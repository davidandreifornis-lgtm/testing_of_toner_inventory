/**
 * Receive delivery — MRR (ERP), multi-line, or manual single.
 * Stock increases; duplicate ref blocked.
 */
const Delivery = {
  mode: 'mrr',
  mrrLines: [],
  suppliers: [],

  setMode(mode) {
    this.mode = mode;
    document.querySelectorAll('.del-mode-btn').forEach((btn) => {
      const active = btn.getAttribute('data-mode') === mode;
      btn.classList.toggle('bg-white', active);
      btn.classList.toggle('shadow-sm', active);
      btn.classList.toggle('text-slate-900', active);
      btn.classList.toggle('text-slate-600', !active);
    });
    document.getElementById('del-mrr-panel')?.classList.toggle('hidden', mode !== 'mrr' || !this.mrrLines.length);
    document.getElementById('del-manual-panel')?.classList.toggle('hidden', mode !== 'manual');
    document.getElementById('del-lines-panel')?.classList.toggle('hidden', mode !== 'lines');
    const searchBtn = document.getElementById('btn-search-mrr');
    if (searchBtn) searchBtn.classList.toggle('hidden', mode !== 'mrr');
  },

  async loadSuppliers() {
    try {
      const res = await API.get('/suppliers.php');
      this.suppliers = res.suppliers || [];
    } catch {
      this.suppliers = [];
    }
    const sel = document.getElementById('del-supplier');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML =
      '<option value="">— Optional —</option>' +
      this.suppliers
        .map((s) => `<option value="${Utils.escapeHtml(s.name)}">${Utils.escapeHtml(s.name)}</option>`)
        .join('') +
      '<option value="__other__">Other (type below)…</option>';
    if (current && [...sel.options].some((o) => o.value === current)) sel.value = current;
  },

  onSupplierChange() {
    const sel = document.getElementById('del-supplier');
    const other = document.getElementById('del-supplier-other');
    if (!sel || !other) return;
    const isOther = sel.value === '__other__';
    other.classList.toggle('hidden', !isOther);
    if (isOther) other.focus();
  },

  getSupplier() {
    const sel = document.getElementById('del-supplier');
    if (!sel) return '';
    if (sel.value === '__other__') {
      return (document.getElementById('del-supplier-other')?.value || '').trim();
    }
    return (sel.value || '').trim();
  },

  renderMrrLines() {
    const tbody = document.getElementById('del-mrr-lines');
    const panel = document.getElementById('del-mrr-panel');
    const count = document.getElementById('del-mrr-count');
    if (!tbody || !panel) return;
    if (!this.mrrLines.length) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');
    if (count) count.textContent = `${this.mrrLines.length} line${this.mrrLines.length === 1 ? '' : 's'}`;
    tbody.innerHTML = this.mrrLines
      .map(
        (l) => `<tr>
        <td class="font-mono">${Utils.escapeHtml(l.itemCode)}</td>
        <td class="text-slate-600">${Utils.escapeHtml(l.description || '—')}</td>
        <td class="text-right font-medium">${l.quantity}</td>
        <td>${Utils.escapeHtml(l.date || '')}</td>
      </tr>`
      )
      .join('');
  },

  async searchMrr() {
    const ref = (document.getElementById('del-ref')?.value || '').trim().toUpperCase();
    if (!ref) {
      this.showMsg('Enter an MRR number to search.', false);
      return;
    }
    const btn = document.getElementById('btn-search-mrr');
    if (btn) btn.disabled = true;
    try {
      const res = await API.post('/delivery.php', { action: 'preview', mrr: ref, referenceNumber: ref });
      this.mrrLines = res.lines || [];
      this.renderMrrLines();
      const warn = document.getElementById('del-mrr-warning');
      if (warn) {
        if (res.alreadyRecorded) {
          warn.textContent = 'This reference was already recorded. Recording again will be blocked.';
          warn.classList.remove('hidden');
        } else {
          warn.classList.add('hidden');
        }
      }
      this.showMsg(`Found ${this.mrrLines.length} line(s) for ${ref}.`, true);
    } catch (err) {
      this.mrrLines = [];
      this.renderMrrLines();
      this.showMsg(err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  addLineRow(data = {}) {
    const list = document.getElementById('del-lines-list');
    if (!list) return;
    const items = (window.Inventory && Inventory.items) || [];
    const opts =
      '<option value="">Select toner…</option>' +
      items
        .map(
          (i) =>
            `<option value="${Utils.escapeHtml(i.inkCode || i.itemCode)}">${Utils.escapeHtml(
              i.inkCode || i.itemCode
            )} — ${Utils.escapeHtml(i.description || '')}</option>`
        )
        .join('');
    const row = document.createElement('div');
    row.className = 'del-line-row grid grid-cols-12 gap-2 items-end';
    row.innerHTML = `
      <div class="col-span-5">
        <label class="form-label text-[11px]">Item</label>
        <select class="form-input del-line-item text-sm">${opts}</select>
      </div>
      <div class="col-span-2">
        <label class="form-label text-[11px]">Qty</label>
        <input type="number" min="1" class="form-input del-line-qty text-sm" value="${data.quantity || 1}">
      </div>
      <div class="col-span-3">
        <label class="form-label text-[11px]">Date</label>
        <input type="date" class="form-input del-line-date text-sm" value="${data.date || Utils.today()}">
      </div>
      <div class="col-span-2">
        <button type="button" class="btn btn-secondary btn-sm w-full del-line-remove">Remove</button>
      </div>`;
    if (data.itemCode) {
      const sel = row.querySelector('.del-line-item');
      if (sel) sel.value = data.itemCode;
    }
    row.querySelector('.del-line-remove')?.addEventListener('click', () => row.remove());
    list.appendChild(row);
  },

  collectLines() {
    const rows = document.querySelectorAll('#del-lines-list .del-line-row');
    const lines = [];
    rows.forEach((row) => {
      const itemCode = (row.querySelector('.del-line-item')?.value || '').trim().toUpperCase();
      const quantity = parseInt(row.querySelector('.del-line-qty')?.value || '0', 10);
      const date = row.querySelector('.del-line-date')?.value || Utils.today();
      if (itemCode && quantity >= 1) lines.push({ itemCode, quantity, date });
    });
    return lines;
  },

  open() {
    this.mrrLines = [];
    this.renderMrrLines();
    this.setMode('mrr');
    const dateEl = document.getElementById('del-date');
    if (dateEl) dateEl.value = Utils.today();
    const msg = document.getElementById('del-msg');
    if (msg) msg.classList.add('hidden');
    document.getElementById('del-ref').value = '';
    document.getElementById('del-qty').value = '1';
    const list = document.getElementById('del-lines-list');
    if (list) list.innerHTML = '';
    Inventory.populateSelects?.();
    this.loadSuppliers();
    if (window.Modals) {
      Modals.open('modal-delivery');
    } else {
      const el = document.getElementById('modal-delivery');
      if (el) {
        el.classList.add('open');
        el.style.display = 'flex';
      }
    }
    document.getElementById('del-ref')?.focus();
  },

  init() {
    const dateEl = document.getElementById('del-date');
    if (dateEl) dateEl.value = Utils.today();

    document.getElementById('btn-open-delivery')?.addEventListener('click', () => this.open());
    document.getElementById('btn-record-delivery')?.addEventListener('click', () => this.submit());
    document.getElementById('btn-search-mrr')?.addEventListener('click', () => this.searchMrr());
    document.getElementById('btn-add-del-line')?.addEventListener('click', () => this.addLineRow());
    document.getElementById('del-supplier')?.addEventListener('change', () => this.onSupplierChange());

    document.querySelectorAll('.del-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode === 'lines' && !document.querySelector('#del-lines-list .del-line-row')) {
          this.addLineRow();
        }
        this.setMode(mode);
      });
    });

    document.getElementById('del-ref')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.mode === 'mrr') {
        e.preventDefault();
        this.searchMrr();
      }
    });
  },

  showMsg(text, ok) {
    const el = document.getElementById('del-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'text-sm ' + (ok ? 'text-emerald-700' : 'text-rose-700');
    el.classList.remove('hidden');
  },

  async submit() {
    const ref = (document.getElementById('del-ref')?.value || '').trim().toUpperCase();
    const supplier = this.getSupplier();

    if (!ref) {
      this.showMsg('Reference number is required.', false);
      return;
    }

    let payload = { referenceNumber: ref, mrr: ref, supplier };

    if (this.mode === 'mrr') {
      if (!this.mrrLines.length) {
        this.showMsg('Search MRR first, or switch to Manual mode.', false);
        return;
      }
      payload.lines = this.mrrLines;
    } else if (this.mode === 'lines') {
      const lines = this.collectLines();
      if (!lines.length) {
        this.showMsg('Add at least one valid line.', false);
        return;
      }
      payload.lines = lines;
    } else {
      const inkCode = (document.getElementById('del-item')?.value || '').trim().toUpperCase();
      const quantity = parseInt(document.getElementById('del-qty')?.value || '0', 10);
      const date = document.getElementById('del-date')?.value || Utils.today();
      if (!inkCode) {
        this.showMsg('Select a toner / item code.', false);
        return;
      }
      if (quantity < 1) {
        this.showMsg('Quantity must be at least 1.', false);
        return;
      }
      payload.inkCode = inkCode;
      payload.itemCode = inkCode;
      payload.quantity = quantity;
      payload.date = date;
    }

    const btn = document.getElementById('btn-record-delivery');
    if (btn) btn.disabled = true;

    try {
      const res = await API.delivery(payload);
      const count = res.lineCount || 1;
      this.showMsg(res.message || 'Delivery recorded.', true);
      Notifications.toast(
        count > 1 ? `Delivery recorded: ${ref} (${count} lines)` : 'Delivery recorded: ' + ref,
        'success'
      );
      document.getElementById('del-ref').value = '';
      document.getElementById('del-qty').value = '1';
      this.mrrLines = [];
      this.renderMrrLines();
      const list = document.getElementById('del-lines-list');
      if (list) list.innerHTML = '';
      await Inventory.load();
      Dashboard.load();
      setTimeout(() => Modals.close('modal-delivery'), 600);
    } catch (err) {
      this.showMsg(err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },
};

window.Delivery = Delivery;
