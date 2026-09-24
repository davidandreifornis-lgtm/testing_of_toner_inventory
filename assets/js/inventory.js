/**
 * Inventory list, search, add, remove, stock card.
 * Stock card behavior aligned with drafts (period filter, edit panel, printer checklist, supplier dropdown).
 * Movement list: newest date on top → older below.
 */
const Inventory = {
  items: [],
  _stockCardCode: null,
  _stockCardOnHand: 0,
  _stockCardTxns: [],

  async load() {
    try {
      const res = await API.inventory();
      this.items = res.items || [];
      this.render();
      this.populateSelects();
    } catch (err) {
      const tbody = document.getElementById('inventory-tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-rose-600 py-8">${Utils.escapeHtml(err.message)}</td></tr>`;
      }
    }
  },

  populateSelects() {
    const optionLabel = (i) => {
      const code = String(i.itemCode || i.inkCode || '').trim();
      const desc = String(i.description || '').trim();
      const qty = Number(i.quantity);
      const qtyText = Number.isFinite(qty) ? String(qty) : '0';
      if (desc) return desc + ' — qty ' + qtyText;
      return code + ' — qty ' + qtyText;
    };
    const items = Array.isArray(this.items) ? this.items : [];
    const esc = (s) => (window.Utils && Utils.escapeHtml ? Utils.escapeHtml(String(s)) : String(s));
    const makeOpts = (placeholder) => {
      if (!items.length) return '<option value="">No toners in inventory</option>';
      return (
        '<option value="">' +
        placeholder +
        '</option>' +
        items
          .map((i) => {
            const val = esc(i.itemCode || i.inkCode || '');
            return '<option value="' + val + '">' + esc(optionLabel(i)) + '</option>';
          })
          .join('')
      );
    };
    const del = document.getElementById('del-item');
    const rel = document.getElementById('rel-item');
    if (del) del.innerHTML = makeOpts('Select toner…');
    if (rel) rel.innerHTML = makeOpts('Select toner…');
  },

  filtered() {
    const q = (document.getElementById('inv-search')?.value || '').trim().toLowerCase();
    const status = document.getElementById('inv-status-filter')?.value || '';
    return this.items.filter((item) => {
      const code = (item.itemCode || item.inkCode || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      if (q && !code.includes(q) && !desc.includes(q)) return false;
      if (status) {
        const st = Utils.stockStatus(item.quantity, item.reorderLevel);
        if (st !== status) return false;
      }
      return true;
    });
  },

  splitPrinters(printerModel) {
    return String(printerModel || '')
      .split(/\s*·\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  },

  render() {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;
    const list = this.filtered();
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-slate-400 py-10">No inventory items match.</td></tr>`;
      return;
    }
    tbody.innerHTML = list
      .map((item) => {
        const code = item.itemCode || item.inkCode || '';
        const st = Utils.stockStatus(item.quantity, item.reorderLevel);
        const printers = this.splitPrinters(item.printerModel);
        const printerHtml = printers.length
          ? printers
              .map(
                (p) =>
                  `<span class="inline-flex px-1.5 py-0.5 rounded text-[11px] bg-indigo-50 text-indigo-800 border border-indigo-100">${Utils.escapeHtml(p)}</span>`
              )
              .join(' ')
          : '<span class="text-slate-400 text-xs">—</span>';
        return `
        <tr class="inventory-row cursor-pointer hover:bg-slate-50" data-code="${Utils.escapeHtml(code)}">
          <td class="font-mono font-semibold text-slate-900">${Utils.escapeHtml(code)}</td>
          <td class="text-sm text-slate-700">${Utils.escapeHtml(item.description || '—')}</td>
          <td class="text-sm">${printerHtml}</td>
          <td class="text-right font-mono font-bold">${Number(item.quantity) || 0}</td>
          <td class="text-right font-mono text-slate-500">${Number(item.reorderLevel) || 0}</td>
          <td>${Utils.statusBadge(st)}</td>
          <td class="text-sm text-slate-600">${Utils.escapeHtml(item.supplier || '—')}</td>
          <td class="text-right">
            <button type="button" class="btn-remove-toner text-xs text-rose-600 hover:text-rose-800 font-medium" data-code="${Utils.escapeHtml(code)}">Remove</button>
          </td>
        </tr>`;
      })
      .join('');

    tbody.querySelectorAll('tr[data-code]').forEach((tr) => {
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.btn-remove-toner')) return;
        this.openStockCard(tr.getAttribute('data-code'));
      });
    });
    tbody.querySelectorAll('.btn-remove-toner').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const code = btn.getAttribute('data-code');
        const ok = await Modals.confirm(`Remove toner ${code} from inventory? Past transactions are kept.`, {
          title: 'Remove toner',
          okLabel: 'Remove',
          danger: true,
        });
        if (!ok) return;
        try {
          await API.removeInventory(code);
          Notifications.toast(`Removed ${code}`, 'success');
          await this.load();
          if (window.Dashboard) Dashboard.load();
        } catch (err) {
          Notifications.toast(err.message, 'error');
        }
      });
    });
  },

  renderStockCardMeta(item) {
    const printers = this.splitPrinters(item.printerModel);
    const printerEl = document.getElementById('sc-printers');
    const supplierEl = document.getElementById('sc-supplier');
    if (printerEl) {
      printerEl.innerHTML = printers.length
        ? printers
            .map(
              (p) =>
                `<span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-100">${Utils.escapeHtml(p)}</span>`
            )
            .join('')
        : '<span class="text-xs text-slate-400 italic">No printer listed</span>';
    }
    if (supplierEl) {
      const sup = (item.supplier || '').trim();
      supplierEl.innerHTML = sup
        ? `<span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200">${Utils.escapeHtml(sup)}</span>`
        : '<span class="text-xs text-slate-400">—</span>';
    }
  },

  /** drafts-style period bounds */
  getStockCardDateBounds() {
    const period = document.getElementById('sc-period')?.value || 'ALL';
    const customFrom = document.getElementById('sc-from')?.value || '';
    const customTo = document.getElementById('sc-to')?.value || '';
    const today = Utils.today();
    if (period === 'TODAY') return { from: today, to: today };
    if (period === 'WEEK') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return { from: d.toISOString().slice(0, 10), to: today };
    }
    if (period === 'MONTH') {
      const d = new Date();
      return {
        from: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
        to: today,
      };
    }
    if (period === 'CUSTOM') {
      return { from: customFrom || '', to: customTo || '' };
    }
    return { from: '', to: '' };
  },

  syncStockCardCustomRangeUI() {
    const period = document.getElementById('sc-period')?.value || 'ALL';
    const wrap = document.getElementById('sc-custom-range');
    if (wrap) {
      if (period === 'CUSTOM') wrap.classList.remove('hidden');
      else wrap.classList.add('hidden');
    }
  },

  txnDateYmd(t) {
    const s = String(t.date || t.txnDate || (t.createdAt || '').toString().split('T')[0] || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
  },

  txnTime(t) {
    const raw = t.createdAt || t.date || '';
    const ms = new Date(raw).getTime();
    if (!Number.isNaN(ms)) return ms;
    const ymd = this.txnDateYmd(t);
    const ms2 = ymd ? new Date(ymd + 'T00:00:00').getTime() : 0;
    return Number.isNaN(ms2) ? 0 : ms2;
  },

  /**
   * Build rows oldest→newest for correct running balance, then reverse so
   * newest dates appear on top (user requirement + drafts history feel).
   */
  renderStockCardMovements() {
    const tbody = document.getElementById('sc-tbody');
    const empty = document.getElementById('sc-empty');
    if (!tbody) return;

    this.syncStockCardCustomRangeUI();
    const { from, to } = this.getStockCardDateBounds();
    const searchQ = (document.getElementById('sc-search')?.value || '').trim().toLowerCase();
    const onHand = Number(this._stockCardOnHand) || 0;
    const txns = Array.isArray(this._stockCardTxns) ? this._stockCardTxns : [];

    // Oldest first for balance math
    const sorted = txns.slice().sort((a, b) => this.txnTime(a) - this.txnTime(b));

    let netFromTxns = 0;
    sorted.forEach((t) => {
      if (t.type === 'RECEIVED') netFromTxns += Number(t.quantity) || 0;
      else if (t.type === 'RELEASED') netFromTxns -= Number(t.quantity) || 0;
    });
    let balance = onHand - netFromTxns;

    const movementRows = [];
    let shown = 0;

    sorted.forEach((t) => {
      const ymd = this.txnDateYmd(t);
      const inRange = (!from || (ymd && ymd >= from)) && (!to || (ymd && ymd <= to));

      const dateLabel = Utils.formatDate(t.date || (t.createdAt || '').toString().split('T')[0]);
      let label = t.type || '';
      let stockIn = '';
      let stockOut = '';
      let note = '';
      const qty = Number(t.quantity) || 0;

      if (t.type === 'RECEIVED') {
        label = 'Delivery Received';
        stockIn = '+' + qty;
        balance += qty;
        note = t.supplier || t.purpose || '';
      } else if (t.type === 'RELEASED') {
        label = t.defective ? 'Issued (later defective)' : 'Issued';
        stockOut = '-' + qty;
        balance -= qty;
        note = [t.department, t.location].filter(Boolean).join(' · ') || t.purpose || '';
      } else if (t.type === 'DEFECTIVE') {
        label = 'Defective Return';
        note = t.purpose || t.defectiveNotes || 'Flagged defective';
      } else if (t.type === 'ADJUSTMENT' || t.type === 'ADJUST') {
        label = 'Stock Adjustment';
        if (qty >= 0) {
          stockIn = '+' + qty;
          balance += qty;
        } else {
          stockOut = String(qty);
          balance += qty;
        }
        note = t.purpose || '';
      }

      if (!inRange) return;

      if (searchQ) {
        const hay = [dateLabel, label, t.referenceNumber || t.ref || '', note, t.type || ''].join(' ').toLowerCase();
        if (!hay.includes(searchQ)) return;
      }

      shown++;
      movementRows.push({
        date: dateLabel,
        type: label,
        ref: t.referenceNumber || t.ref || '—',
        inn: stockIn,
        out: stockOut,
        bal: balance,
        note: note || '—',
      });
    });

    // Newest first
    movementRows.reverse();

    if (!movementRows.length) {
      tbody.innerHTML = '';
      if (empty) {
        empty.classList.remove('hidden');
        const p = empty.querySelector('p');
        if (p) {
          p.textContent = searchQ
            ? 'No movements match your search in the selected date range.'
            : from || to
              ? 'No movements in the selected date range.'
              : 'No movement history for this toner yet.';
        }
      }
      return;
    }

    empty?.classList.add('hidden');
    tbody.innerHTML = movementRows
      .map(
        (r) => `
      <tr class="hover:bg-slate-50">
        <td class="whitespace-nowrap text-xs text-slate-600">${Utils.escapeHtml(r.date)}</td>
        <td class="font-medium text-slate-800">${Utils.escapeHtml(r.type)}</td>
        <td class="font-mono text-xs font-semibold text-slate-900">${Utils.escapeHtml(r.ref)}</td>
        <td class="text-right font-mono font-bold text-blue-600">${r.inn || '—'}</td>
        <td class="text-right font-mono font-bold text-emerald-600">${r.out || '—'}</td>
        <td class="text-right font-mono font-bold text-slate-900">${r.bal}</td>
        <td class="text-xs text-slate-500 truncate" title="${Utils.escapeHtml(r.note)}">${Utils.escapeHtml(r.note)}</td>
      </tr>`
      )
      .join('');
  },

  async openStockCard(code) {
    const item = this.items.find((i) => (i.itemCode || i.inkCode) === code);
    if (!item) return;

    this._stockCardCode = code;
    this._stockCardOnHand = Number(item.quantity) || 0;

    // Reset filters like drafts reset-friendly open
    const searchEl = document.getElementById('sc-search');
    if (searchEl) searchEl.value = '';
    const periodEl = document.getElementById('sc-period');
    if (periodEl) periodEl.value = 'ALL';
    this.syncStockCardCustomRangeUI();

    document.getElementById('sc-title').textContent = code;
    document.getElementById('sc-subtitle').textContent =
      item.description || 'Complete stock movement history — editable master data';
    document.getElementById('sc-qty').textContent = item.quantity;
    document.getElementById('sc-reorder').textContent = item.reorderLevel;
    document.getElementById('sc-status').innerHTML = Utils.statusBadge(
      Utils.stockStatus(item.quantity, item.reorderLevel)
    );
    const codeHidden = document.getElementById('sc-ink-code');
    if (codeHidden) codeHidden.value = code;

    this.renderStockCardMeta(item);

    const tbody = document.getElementById('sc-tbody');
    const empty = document.getElementById('sc-empty');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-slate-400 py-4">Loading…</td></tr>';
    empty?.classList.add('hidden');

    Modals.close('modal-stock-card-edit');
    Modals.open('modal-stock-card');

    try {
      const res = await API.transactions({});
      this._stockCardTxns = (res.transactions || []).filter(
        (t) => (t.inkCode || t.itemCode || '').toUpperCase() === code.toUpperCase()
      );
      this.renderStockCardMovements();
    } catch (err) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-rose-600 py-4">${Utils.escapeHtml(err.message)}</td></tr>`;
      }
    }
  },

  async openStockCardEdit() {
    const code = this._stockCardCode || document.getElementById('sc-ink-code')?.value || '';
    if (!code) return;
    const item = this.items.find((i) => (i.itemCode || i.inkCode) === code);
    if (!item) return;

    document.getElementById('sc-edit-code').textContent = code;
    document.getElementById('sc-edit-description').value = item.description || '';
    document.getElementById('sc-edit-qty').value = Number(item.quantity) || 0;
    document.getElementById('sc-edit-reorder').value = Number(item.reorderLevel) || 0;

    // Supplier dropdown (drafts: populateStockCardSupplierSelect)
    const supSel = document.getElementById('sc-edit-supplier');
    if (supSel) {
      supSel.innerHTML = '<option value="">— Select supplier —</option>';
      try {
        const res = await API.suppliers();
        const list = res.suppliers || res.items || [];
        list.forEach((s) => {
          const name = (s.name || s.supplierName || s.supplier || '').trim();
          if (!name) return;
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          if ((item.supplier || '') === name) opt.selected = true;
          supSel.appendChild(opt);
        });
        if (item.supplier && ![...supSel.options].some((o) => o.value === item.supplier)) {
          const opt = document.createElement('option');
          opt.value = item.supplier;
          opt.textContent = item.supplier + ' (current)';
          opt.selected = true;
          supSel.appendChild(opt);
        }
      } catch (_) {
        /* keep empty */
      }
    }

    // Printer checklist (drafts: populateStockCardPrinterSelect — keep item printers even if not in locations)
    const box = document.getElementById('sc-edit-printers');
    const selectedList = this.splitPrinters(item.printerModel);
    const selected = new Set(selectedList.map((p) => p.toUpperCase()));
    if (box) {
      box.innerHTML = '<p class="text-xs text-slate-400">Loading printers…</p>';
      try {
        const res = await API.locations();
        const locs = res.locations || res.items || [];
        const options = [
          ...new Set(
            locs
              .map((l) => (l.printerName || l.printer_name || '').trim())
              .filter(Boolean)
          ),
        ];
        // Keep printers already on the item
        selectedList.forEach((p) => {
          if (!options.some((o) => o.toUpperCase() === p.toUpperCase())) options.push(p);
        });
        options.sort((a, b) => a.localeCompare(b));

        if (!options.length) {
          box.innerHTML =
            '<p class="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">No printers saved yet. Add printers under <strong>Locations &amp; Suppliers</strong>.</p>';
        } else {
          box.innerHTML = options
            .map((name, i) => {
              const id = 'sc-pr-cb-' + i;
              const checked = selected.has(name.toUpperCase()) ? 'checked' : '';
              return `<label for="${id}" class="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-slate-50">
                <input type="checkbox" id="${id}" class="sc-printer-cb w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" value="${Utils.escapeHtml(name)}" ${checked}>
                <span class="text-sm text-slate-800">${Utils.escapeHtml(name)}</span>
              </label>`;
            })
            .join('');
        }
      } catch (err) {
        box.innerHTML = `<p class="text-xs text-rose-600">${Utils.escapeHtml(err.message)}</p>`;
      }
    }

    const editEl = document.getElementById('modal-stock-card-edit');
    if (editEl) {
      editEl.classList.add('modal-backdrop-front');
      document.body.appendChild(editEl);
    }
    Modals.open('modal-stock-card-edit');
    setTimeout(() => document.getElementById('sc-edit-qty')?.focus(), 50);
  },

  async saveStockCardEdit() {
    const code = this._stockCardCode || document.getElementById('sc-ink-code')?.value || '';
    if (!code) return;

    const quantity = Math.max(0, parseInt(document.getElementById('sc-edit-qty')?.value, 10) || 0);
    const reorderLevel = Math.max(0, parseInt(document.getElementById('sc-edit-reorder')?.value, 10) || 0);
    const supplier = (document.getElementById('sc-edit-supplier')?.value || '').trim();
    const printers = [...document.querySelectorAll('.sc-printer-cb:checked')].map((cb) => cb.value).filter(Boolean);
    const printerModel = printers.join(' · ');

    const ok = await Modals.confirm('Save changes to quantity, printers, and supplier?', {
      title: 'Save stock card',
      okLabel: 'Save',
    });
    if (!ok) return;

    try {
      await API.updateInventory({
        itemCode: code,
        inkCode: code,
        quantity,
        reorderLevel,
        supplier,
        printerModel,
      });
      Notifications.toast(`Stock card for ${code} saved.`, 'success');
      Modals.close('modal-stock-card-edit');
      await this.load();
      if (window.Dashboard) Dashboard.load();
      this.openStockCard(code);
    } catch (err) {
      Notifications.toast(err.message || 'Failed to save stock card.', 'error');
    }
  },

  init() {
    document.getElementById('inv-search')?.addEventListener(
      'input',
      Utils.debounce(() => this.render(), 200)
    );
    document.getElementById('inv-status-filter')?.addEventListener('change', () => this.render());

    document.getElementById('btn-add-toner')?.addEventListener('click', () => {
      document.getElementById('form-add-toner')?.reset();
      Modals.open('modal-add-toner');
    });

    document.getElementById('form-add-toner')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        itemCode: String(fd.get('itemCode') || '').trim().toUpperCase(),
        description: String(fd.get('description') || '').trim(),
        printerModel: String(fd.get('printerModel') || '').trim(),
        quantity: Number(fd.get('quantity') || 0),
        reorderLevel: Number(fd.get('reorderLevel') || 3),
        supplier: String(fd.get('supplier') || '').trim(),
      };
      if (!payload.itemCode || !payload.description) {
        Notifications.toast('Item code and description are required.', 'error');
        return;
      }
      const ok = await Modals.confirm(`Add toner ${payload.itemCode} to inventory?`, {
        title: 'Confirm add toner',
        okLabel: 'Add toner',
      });
      if (!ok) return;
      try {
        await API.addInventory(payload);
        Notifications.toast('Toner added', 'success');
        Modals.close('modal-add-toner');
        await this.load();
        if (window.Dashboard) Dashboard.load();
      } catch (err) {
        Notifications.toast(err.message, 'error');
      }
    });

    // Stock card controls (drafts: period / apply / reset + search)
    document.getElementById('sc-period')?.addEventListener('change', () => {
      this.syncStockCardCustomRangeUI();
      if ((document.getElementById('sc-period')?.value || '') !== 'CUSTOM') {
        this.renderStockCardMovements();
      }
    });
    document.getElementById('btn-sc-apply-dates')?.addEventListener('click', () => this.renderStockCardMovements());
    document.getElementById('btn-sc-reset-dates')?.addEventListener('click', () => {
      const p = document.getElementById('sc-period');
      if (p) p.value = 'ALL';
      const f = document.getElementById('sc-from');
      const t = document.getElementById('sc-to');
      if (f) f.value = '';
      if (t) t.value = '';
      const s = document.getElementById('sc-search');
      if (s) s.value = '';
      this.syncStockCardCustomRangeUI();
      this.renderStockCardMovements();
    });
    document.getElementById('sc-search')?.addEventListener(
      'input',
      Utils.debounce(() => this.renderStockCardMovements(), 150)
    );

    document.getElementById('btn-sc-edit')?.addEventListener('click', () => this.openStockCardEdit());
    document.getElementById('btn-sc-save')?.addEventListener('click', () => this.saveStockCardEdit());
  },
};

window.Inventory = Inventory;
