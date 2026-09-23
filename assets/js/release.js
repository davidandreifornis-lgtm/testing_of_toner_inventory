/**
 * Stock issuance — 1 unit, date = today.
 * Department / location / printer assigned / issued by come from the database.
 */
const Release = {
  locationsByDept: {},
  locationMeta: {},
  printers: [],
  users: [],

  async loadLocations() {
    const deptSel = document.getElementById('rel-dept');
    const locSel = document.getElementById('rel-location');
    this.locationsByDept = {};
    this.locationMeta = {};
    this.printers = [];

    try {
      const res = await API.locations();
      const locs = res.locations || res.data?.locations || [];
      const printerSet = new Set();

      if (Array.isArray(locs)) {
        locs.forEach((l) => {
          const dept = String(l.department || l.dept || '').trim();
          const name = String(l.location || l.name || '').trim();
          const printer = String(l.printerName || l.printer_name || '').trim();
          if (!dept || !name) return;
          if (!this.locationsByDept[dept]) this.locationsByDept[dept] = [];
          if (!this.locationsByDept[dept].includes(name)) {
            this.locationsByDept[dept].push(name);
          }
          this.locationMeta[dept + '|' + name] = { printerName: printer };
          if (printer) printerSet.add(printer);
        });
      }
      this.printers = [...printerSet].sort((a, b) => a.localeCompare(b));
    } catch (err) {
      console.warn('Could not load locations from database:', err.message || err);
    }

    if (deptSel) {
      const keys = Object.keys(this.locationsByDept).sort();
      if (!keys.length) {
        deptSel.innerHTML =
          '<option value="">No departments in database — add under Suppliers and Locations</option>';
      } else {
        deptSel.innerHTML =
          '<option value="">Select department…</option>' +
          keys
            .map((d) => `<option value="${Utils.escapeHtml(d)}">${Utils.escapeHtml(d)}</option>`)
            .join('');
      }
    }
    if (locSel) locSel.innerHTML = '<option value="">Select location…</option>';
    this.fillPrinterSelect();
  },

  fillPrinterSelect(preferred) {
    const sel = document.getElementById('rel-printer');
    if (!sel) return;
    const current = preferred != null ? preferred : sel.value;
    if (!this.printers.length) {
      sel.innerHTML = '<option value="">No printers in database — set under Suppliers and Locations</option>';
      return;
    }
    sel.innerHTML =
      '<option value="">Select printer…</option>' +
      this.printers
        .map((p) => `<option value="${Utils.escapeHtml(p)}">${Utils.escapeHtml(p)}</option>`)
        .join('');
    if (current && this.printers.includes(current)) sel.value = current;
  },

  async loadUsers() {
    const sel = document.getElementById('rel-issued-by');
    if (!sel) return;
    this.users = [];
    try {
      const res = await API.get('/users.php');
      this.users = (res.users || []).filter((u) => u.isActive !== false);
    } catch {
      // Non-admin may not list users — try self profile
      try {
        const me = await API.get('/users.php', { self: '1' });
        if (me.user) this.users = [me.user];
      } catch {
        this.users = [];
      }
    }

    if (!this.users.length) {
      sel.innerHTML = '<option value="">No users in database</option>';
      return;
    }
    sel.innerHTML =
      '<option value="">Select user…</option>' +
      this.users
        .map((u) => {
          const label = u.fullName
            ? `${u.fullName} (${u.username})`
            : u.username;
          return `<option value="${Utils.escapeHtml(u.username)}">${Utils.escapeHtml(label)}</option>`;
        })
        .join('');
  },

  onDeptChange() {
    const dept = document.getElementById('rel-dept')?.value || '';
    const locSel = document.getElementById('rel-location');
    if (!locSel) return;
    const locs = this.locationsByDept[dept] || [];
    if (!dept) {
      locSel.innerHTML = '<option value="">Select location…</option>';
    } else if (!locs.length) {
      locSel.innerHTML = '<option value="">No locations for this department</option>';
    } else {
      locSel.innerHTML =
        '<option value="">Select location…</option>' +
        locs.map((l) => `<option value="${Utils.escapeHtml(l)}">${Utils.escapeHtml(l)}</option>`).join('');
    }
  },

  onLocationChange() {
    const dept = document.getElementById('rel-dept')?.value || '';
    const loc = document.getElementById('rel-location')?.value || '';
    const meta = this.locationMeta[dept + '|' + loc];
    if (meta && meta.printerName) {
      this.fillPrinterSelect(meta.printerName);
    }
  },

  onYieldToggle() {
    const on = document.getElementById('rel-yield-enable')?.checked;
    const wrap = document.getElementById('rel-yield-wrap');
    if (wrap) wrap.classList.toggle('hidden', !on);
    if (!on) {
      const y = document.getElementById('rel-yield');
      if (y) y.value = '';
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
      (st === 'out'
        ? '<span class="text-rose-600">(out of stock)</span>'
        : st === 'low'
          ? '<span class="text-amber-600">(low)</span>'
          : '');
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
    const yieldEnabled = !!document.getElementById('rel-yield-enable')?.checked;
    const yieldRaw = document.getElementById('rel-yield')?.value;
    const actualYield =
      yieldEnabled && yieldRaw !== '' && yieldRaw != null ? parseInt(yieldRaw, 10) : null;

    if (!ref) {
      this.showMsg('Reference number is required.', false);
      return;
    }
    if (!inkCode) {
      this.showMsg('Select a toner.', false);
      return;
    }
    if (!department) {
      this.showMsg('Department is required. Add departments under Suppliers and Locations if the list is empty.', false);
      return;
    }
    if (!location) {
      this.showMsg('Location is required.', false);
      return;
    }
    if (yieldEnabled && (actualYield == null || Number.isNaN(actualYield))) {
      this.showMsg('Enter actual yield, or uncheck “Record actual yield”.', false);
      return;
    }

    const ok = await Modals.confirm(
      `Issue 1 × ${inkCode} to ${department} / ${location}? Reference ${ref}. Stock will decrease by 1.`,
      { title: 'Confirm issuance', okLabel: 'Record issuance' }
    );
    if (!ok) return;

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
      const ye = document.getElementById('rel-yield-enable');
      if (ye) ye.checked = false;
      this.onYieldToggle();
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
    const ye = document.getElementById('rel-yield-enable');
    if (ye) ye.checked = false;
    this.onYieldToggle();
    this.loadLocations();
    this.loadUsers();
    Inventory.populateSelects?.();
    this.onItemChange();
    if (window.Modals) Modals.open('modal-release');
    else {
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
    document.getElementById('rel-yield-enable')?.addEventListener('change', () => this.onYieldToggle());
    document.getElementById('btn-record-release')?.addEventListener('click', () => this.submit());
    this.loadLocations();
    this.loadUsers();
  },
};

window.Release = Release;
