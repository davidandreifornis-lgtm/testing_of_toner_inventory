/**
 * Stock issuance — always 1 unit, date = today.
 * Supports location printer + actual yield.
 */
const Release = {
  locationsByDept: {},
  locationMeta: {}, // dept|loc -> { printerName }

  async loadLocations() {
    try {
      const res = await API.locations();
      const locs = res.locations || res.data?.locations || [];
      this.locationsByDept = {};
      this.locationMeta = {};

      if (Array.isArray(locs) && locs.length) {
        locs.forEach((l) => {
          const dept = l.department || l.dept || 'General';
          const name = l.location || l.name || '';
          if (!name) return;
          if (!this.locationsByDept[dept]) this.locationsByDept[dept] = [];
          if (!this.locationsByDept[dept].includes(name)) {
            this.locationsByDept[dept].push(name);
          }
          this.locationMeta[dept + '|' + name] = {
            printerName: l.printerName || l.printer_name || '',
          };
        });
      }

      if (!Object.keys(this.locationsByDept).length) {
        this.locationsByDept = {
          'Human Resources': ['HR Office', 'HR Meeting Room'],
          Finance: ['Finance Office', 'Accounting'],
          IT: ['Server Room', 'IT Helpdesk'],
          Operations: ['Ops Floor', 'Warehouse'],
          Admin: ['Admin Office'],
        };
      }

      const deptSel = document.getElementById('rel-dept');
      if (deptSel) {
        deptSel.innerHTML =
          '<option value="">Select department…</option>' +
          Object.keys(this.locationsByDept)
            .sort()
            .map((d) => `<option value="${Utils.escapeHtml(d)}">${Utils.escapeHtml(d)}</option>`)
            .join('');
      }
    } catch {
      this.locationsByDept = {
        'Human Resources': ['HR Office'],
        Finance: ['Finance Office'],
        IT: ['IT Helpdesk'],
        Operations: ['Ops Floor'],
        Admin: ['Admin Office'],
      };
      const deptSel = document.getElementById('rel-dept');
      if (deptSel) {
        deptSel.innerHTML =
          '<option value="">Select department…</option>' +
          Object.keys(this.locationsByDept)
            .map((d) => `<option value="${Utils.escapeHtml(d)}">${Utils.escapeHtml(d)}</option>`)
            .join('');
      }
    }
  },

  onDeptChange() {
    const dept = document.getElementById('rel-dept')?.value || '';
    const locSel = document.getElementById('rel-location');
    if (!locSel) return;
    const locs = this.locationsByDept[dept] || [];
    locSel.innerHTML =
      '<option value="">Select location…</option>' +
      locs.map((l) => `<option value="${Utils.escapeHtml(l)}">${Utils.escapeHtml(l)}</option>`).join('');
    const printer = document.getElementById('rel-printer');
    if (printer) printer.value = '';
  },

  onLocationChange() {
    const dept = document.getElementById('rel-dept')?.value || '';
    const loc = document.getElementById('rel-location')?.value || '';
    const meta = this.locationMeta[dept + '|' + loc];
    const printer = document.getElementById('rel-printer');
    if (printer && meta && meta.printerName) {
      printer.value = meta.printerName;
    }
  },

  onItemChange() {
    const code = (document.getElementById('rel-item')?.value || '').trim().toUpperCase();
    const hint = document.getElementById('rel-stock-hint');
    if (!hint) return;
    if (!code || !window.Inventory || !Inventory.items) {
      hint.textContent = '';
      return;
    }
    const item = Inventory.items.find(
      (i) => (i.inkCode || i.itemCode || '').toUpperCase() === code
    );
    if (!item) {
      hint.textContent = '';
      return;
    }
    const qty = Number(item.quantity) || 0;
    const st = Utils.stockStatus(qty, item.reorderLevel);
    hint.innerHTML =
      `Current stock: <strong>${qty}</strong> ` +
      (st === 'out' ? '<span class="text-rose-600">(out of stock)</span>' : st === 'low' ? '<span class="text-amber-600">(low)</span>' : '');
  },

  showMsg(text, ok) {
    const el = document.getElementById('rel-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'text-sm ' + (ok ? 'text-emerald-700' : 'text-rose-700');
    el.classList.remove('hidden');
  },

  async submit() {
    const ref = (document.getElementById('rel-ref')?.value || '').trim().toUpperCase();
    const inkCode = (document.getElementById('rel-item')?.value || '').trim().toUpperCase();
    const department = (document.getElementById('rel-dept')?.value || '').trim();
    const location = (document.getElementById('rel-location')?.value || '').trim();
    const issuedBy = (document.getElementById('rel-issued-by')?.value || '').trim();
    const locationPrinter = (document.getElementById('rel-printer')?.value || '').trim();
    const yieldRaw = document.getElementById('rel-yield')?.value;
    const actualYield = yieldRaw !== '' && yieldRaw != null ? parseInt(yieldRaw, 10) : null;

    if (!ref) {
      this.showMsg('Reference number is required.', false);
      return;
    }
    if (!inkCode) {
      this.showMsg('Select a toner.', false);
      return;
    }
    if (!department) {
      this.showMsg('Department is required.', false);
      return;
    }
    if (!location) {
      this.showMsg('Location is required.', false);
      return;
    }

    const btn = document.getElementById('btn-record-release');
    if (btn) btn.disabled = true;

    try {
      const payload = {
        referenceNumber: ref,
        inkCode,
        itemCode: inkCode,
        department,
        location,
        issuedBy,
        locationPrinter,
        printerName: locationPrinter,
      };
      if (actualYield != null && !Number.isNaN(actualYield)) {
        payload.actualYield = actualYield;
        payload.yield = actualYield;
      }
      const res = await API.release(payload);
      this.showMsg(res.message || 'Issuance recorded.', true);
      Notifications.toast('Issuance recorded: ' + ref, 'success');
      document.getElementById('rel-ref').value = '';
      const y = document.getElementById('rel-yield');
      if (y) y.value = '';
      await Inventory.load();
      Dashboard.load();
      setTimeout(() => Modals.close('modal-release'), 600);
    } catch (err) {
      this.showMsg(err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  open() {
    const dateEl = document.getElementById('rel-date');
    if (dateEl) dateEl.value = Utils.today();
    const msg = document.getElementById('rel-msg');
    if (msg) msg.classList.add('hidden');
    Inventory.populateSelects?.();
    this.onItemChange();
    if (window.Modals) {
      Modals.open('modal-release');
    } else {
      const el = document.getElementById('modal-release');
      if (el) {
        el.classList.add('open');
        el.style.display = 'flex';
      }
    }
    document.getElementById('rel-ref')?.focus();
  },

  init() {
    const dateEl = document.getElementById('rel-date');
    if (dateEl) dateEl.value = Utils.today();

    document.getElementById('btn-open-release')?.addEventListener('click', () => this.open());
    document.getElementById('rel-dept')?.addEventListener('change', () => this.onDeptChange());
    document.getElementById('rel-location')?.addEventListener('change', () => this.onLocationChange());
    document.getElementById('rel-item')?.addEventListener('change', () => this.onItemChange());
    document.getElementById('btn-record-release')?.addEventListener('click', () => this.submit());
    this.loadLocations();
  },
};

window.Release = Release;
