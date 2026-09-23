/**
 * Inventory list, search, add, remove, stock card.
 */
const Inventory = {
  items: [],

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
    const opts =
      '<option value="">Select toner…</option>' +
      this.items
        .map(
          (i) =>
            `<option value="${Utils.escapeHtml(i.itemCode || i.inkCode)}">${Utils.escapeHtml(i.itemCode || i.inkCode)} — qty ${i.quantity}</option>`
        )
        .join('');
    const del = document.getElementById('del-item');
    const rel = document.getElementById('rel-item');
    if (del) del.innerHTML = opts;
    if (rel) rel.innerHTML = opts;
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

  render() {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;
    const rows = this.filtered();
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state py-10"><p class="text-sm">No inventory items found.</p></td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map((item) => {
        const code = item.itemCode || item.inkCode || '';
        const st = Utils.stockStatus(item.quantity, item.reorderLevel);
        return `
        <tr data-code="${Utils.escapeHtml(code)}">
          <td class="font-mono font-semibold">${Utils.escapeHtml(code)}</td>
          <td class="max-w-[12rem] truncate">${Utils.escapeHtml(item.description || '')}</td>
          <td class="text-slate-600">${Utils.escapeHtml(item.printerModel || '—')}</td>
          <td class="text-right font-semibold">${item.quantity}</td>
          <td class="text-right text-slate-500">${item.reorderLevel}</td>
          <td>${Utils.statusBadge(st)}</td>
          <td class="text-slate-600">${Utils.escapeHtml(item.supplier || '—')}</td>
          <td class="text-right">
            <button type="button" class="btn btn-secondary btn-sm btn-remove-toner" data-code="${Utils.escapeHtml(code)}">Remove</button>
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
        const ok = await Modals.confirm(`Remove toner ${code} from inventory? Past transactions are kept.`, { title: 'Remove toner', okLabel: 'Remove', danger: true });
        if (!ok) return;
        try {
          await API.removeInventory(code);
          Notifications.toast(`Removed ${code}`, 'success');
          await this.load();
          Dashboard.load();
        } catch (err) {
          Notifications.toast(err.message, 'error');
        }
      });
    });
  },

  async openStockCard(code) {
    const item = this.items.find((i) => (i.itemCode || i.inkCode) === code);
    if (!item) return;

    document.getElementById('sc-title').textContent = code;
    document.getElementById('sc-subtitle').textContent = item.description || '';
    document.getElementById('sc-qty').textContent = item.quantity;
    document.getElementById('sc-reorder').textContent = item.reorderLevel;
    document.getElementById('sc-status').innerHTML = Utils.statusBadge(
      Utils.stockStatus(item.quantity, item.reorderLevel)
    );

    const tbody = document.getElementById('sc-tbody');
    const empty = document.getElementById('sc-empty');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-4">Loading…</td></tr>';
    Modals.open('modal-stock-card');

    try {
      const res = await API.transactions({});
      const txns = (res.transactions || [])
        .filter((t) => (t.inkCode || '').toUpperCase() === code.toUpperCase())
        .sort((a, b) => {
          const da = (a.date || '') + (a.createdAt || '');
          const db = (b.date || '') + (b.createdAt || '');
          return da.localeCompare(db);
        });

      let bal = 0;
      // Reconstruct balance: start from 0 and apply chronologically
      // For display we show running balance after each movement
      const rows = [];
      txns.forEach((t) => {
        let inn = 0;
        let out = 0;
        if (t.type === 'RECEIVED') {
          inn = Number(t.quantity) || 0;
          bal += inn;
        } else if (t.type === 'RELEASED') {
          out = Number(t.quantity) || 0;
          bal -= out;
        }
        // DEFECTIVE does not change stock
        rows.push({
          date: t.date,
          type: t.type,
          ref: t.referenceNumber,
          inn,
          out,
          bal,
        });
      });

      if (!rows.length) {
        tbody.innerHTML = '';
        empty?.classList.remove('hidden');
      } else {
        empty?.classList.add('hidden');
        tbody.innerHTML = rows
          .map(
            (r) => `
          <tr>
            <td>${Utils.formatDate(r.date)}</td>
            <td>${Utils.escapeHtml(r.type)}</td>
            <td class="font-mono text-xs">${Utils.escapeHtml(r.ref)}</td>
            <td class="text-right text-emerald-600">${r.inn || ''}</td>
            <td class="text-right text-rose-600">${r.out || ''}</td>
            <td class="text-right font-semibold">${r.bal}</td>
          </tr>`
          )
          .join('');
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-rose-600 py-4">${Utils.escapeHtml(err.message)}</td></tr>`;
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
      const ok = await Modals.confirm(
        `Add toner ${payload.itemCode} to inventory?`,
        { title: 'Confirm add toner', okLabel: 'Add toner' }
      );
      if (!ok) return;
      try {
        await API.addInventory(payload);
        Notifications.toast('Toner added', 'success');
        Modals.close('modal-add-toner');
        await this.load();
        Dashboard.load();
      } catch (err) {
        Notifications.toast(err.message, 'error');
      }
    });
  },
};

window.Inventory = Inventory;
