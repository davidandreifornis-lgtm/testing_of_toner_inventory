/**
 * Stock Issuance modal — matches UI spec (Release / Give Toner).
 * - Department filters locations from master list
 * - 1 location → auto-selected + disabled (view-only)
 * - 2+ locations → selectable
 * - Printer always auto-filled from master, read-only
 */
const Release = {
  locationsByDept: {},
  locationMeta: {},
  users: [],

  esc(s) {
    if (window.Utils && typeof Utils.escapeHtml === 'function') {
      return Utils.escapeHtml(String(s));
    }
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  async loadLocations() {
    this.locationsByDept = {};
    this.locationMeta = {};

    try {
      const res = await API.locations();
      const rows = res.locations || res.data?.locations || [];
      (rows || []).forEach((l) => {
        const dept = String(l.department || l.dept || '').trim().toUpperCase();
        const name = String(l.location || l.name || '').trim();
        const printer = String(l.printerName || l.printer_name || '').trim();
        if (!dept || !name) return;
        if (!this.locationsByDept[dept]) this.locationsByDept[dept] = [];
        if (!this.locationsByDept[dept].includes(name)) {
          this.locationsByDept[dept].push(name);
        }
        this.locationMeta[dept + '|' + name] = { printerName: printer };
      });
    } catch (err) {
      console.warn('loadLocations failed:', err);
    }

    const deptSel = document.getElementById('rel-dept');
    if (deptSel) {
      const keys = Object.keys(this.locationsByDept).sort();
      if (!keys.length) {
        deptSel.innerHTML = '<option value="">No departments in master list</option>';
      } else {
        deptSel.innerHTML =
          '<option value="">Select department…</option>' +
          keys.map((d) => `<option value="${this.esc(d)}">${this.esc(d)}</option>`).join('');
      }
      deptSel.value = '';
    }

    this.resetLocationUI();
  },

  resetLocationUI() {
    const locSel = document.getElementById('rel-location');
    const hint = document.getElementById('rel-location-hint');
    if (locSel) {
      locSel.innerHTML = '<option value="">Select department first…</option>';
      locSel.disabled = true;
      locSel.classList.add('bg-slate-50');
    }
    if (hint) hint.textContent = 'Select a department first';
    this.setPrinter('');
  },

  setPrinter(name) {
    const el = document.getElementById('rel-printer');
    if (el) el.value = name ? String(name).trim() : '';
  },

  /** Called when department changes — gist: auto-filter / auto-fill location */
  onDeptChange() {
    const dept = String(document.getElementById('rel-dept')?.value || '')
      .trim()
      .toUpperCase();
    const locSel = document.getElementById('rel-location');
    const hint = document.getElementById('rel-location-hint');
    if (!locSel) return;

    const locs = dept ? this.locationsByDept[dept] || [] : [];

    if (!dept) {
      this.resetLocationUI();
      return;
    }

    if (locs.length === 0) {
      locSel.innerHTML = '<option value="">No locations for this department</option>';
      locSel.disabled = true;
      locSel.classList.add('bg-slate-50');
      if (hint) hint.textContent = 'Add locations under Suppliers and Locations.';
      this.setPrinter('');
      return;
    }

    if (locs.length === 1) {
      // Exactly one → auto-select and lock (view-only)
      const only = locs[0];
      locSel.innerHTML = `<option value="${this.esc(only)}">${this.esc(only)}</option>`;
      locSel.value = only;
      locSel.disabled = true;
      locSel.classList.add('bg-slate-50');
      if (hint) hint.textContent = 'Only location for this department (auto-filled).';
      this.onLocationChange();
      return;
    }

    // 2+ → selectable
    locSel.innerHTML =
      '<option value="">Select location…</option>' +
      locs.map((l) => `<option value="${this.esc(l)}">${this.esc(l)}</option>`).join('');
    locSel.value = '';
    locSel.disabled = false;
    locSel.classList.remove('bg-slate-50');
    if (hint) hint.textContent = 'Multiple locations — choose one.';
    this.setPrinter('');
  },

  onLocationChange() {
    const dept = String(document.getElementById('rel-dept')?.value || '')
      .trim()
      .toUpperCase();
    const loc = String(document.getElementById('rel-location')?.value || '').trim();
    if (!dept || !loc) {
      this.setPrinter('');
      return;
    }
    const meta = this.locationMeta[dept + '|' + loc];
    this.setPrinter(meta && meta.printerName ? meta.printerName : '');
  },

  async loadUsers() {
    const sel = document.getElementById('rel-issued-by');
    if (!sel) return;
    this.users = [];
    try {
      const res = await API.get('/users.php');
      this.users = (res.users || []).filter((u) => u.isActive !== false);
    } catch {
      try {
        const me = await API.get('/users.php', { self: '1' });
        if (me.user) this.users = [me.user];
      } catch {
        this.users = [];
      }
    }
    if (!this.users.length) {
      sel.innerHTML = '<option value="">No users</option>';
      return;
    }
    sel.innerHTML =
      '<option value="">Select user…</option>' +
      this.users
        .map((u) => {
          const label = u.fullName ? `${u.fullName} (${u.username})` : u.username;
          return `<option value="${this.esc(u.username)}">${this.esc(label)}</option>`;
        })
        .join('');
  },

  onYieldToggle() {
    const on = !!document.getElementById('rel-yield-enable')?.checked;
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
      (i) => String(i.inkCode || i.itemCode || '').toUpperCase() === code
    );
    if (!item) {
      hint.textContent = '';
      return;
    }
    const qty = Number(item.quantity) || 0;
    const st =
      window.Utils && Utils.stockStatus
        ? Utils.stockStatus(qty, item.reorderLevel)
        : 'ok';
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
    let actualYield = null;
    if (yieldEnabled && yieldRaw !== '' && yieldRaw != null) {
      actualYield = Number(yieldRaw);
    }

    if (!ref) {
      this.showMsg('Issuance reference number is required.', false);
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

    let confirmed = true;
    if (window.Modals && typeof Modals.confirm === 'function') {
      confirmed = await Modals.confirm(
        'Confirm issuance',
        `Issue 1 × ${inkCode} to ${department} / ${location}? Reference ${ref}. Stock will decrease by 1.`,
        { okLabel: 'Record' }
      );
    }
    if (!confirmed) return;

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
      if (window.Notifications) Notifications.toast('Issuance recorded: ' + ref, 'success');
      const refEl = document.getElementById('rel-ref');
      if (refEl) refEl.value = '';
      const ye = document.getElementById('rel-yield-enable');
      if (ye) ye.checked = false;
      this.onYieldToggle();
      if (window.Inventory) await Inventory.load();
      if (window.Dashboard) Dashboard.load();
      setTimeout(() => {
        if (window.Modals) Modals.close('modal-release');
      }, 600);
    } catch (err) {
      this.showMsg(err.message || 'Failed', false);
      if (window.Notifications) Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  async open() {
    const dateEl = document.getElementById('rel-date');
    if (dateEl && window.Utils) dateEl.value = Utils.today();
    const msg = document.getElementById('rel-msg');
    if (msg) msg.classList.add('hidden');
    const ye = document.getElementById('rel-yield-enable');
    if (ye) ye.checked = false;
    this.onYieldToggle();

    await this.loadLocations();
    await this.loadUsers();
    // Always load inventory so toner options (description + qty) are available
    // even when opening from Dashboard without visiting Inventory first
    try {
      if (window.Inventory && typeof Inventory.load === 'function') {
        await Inventory.load();
      } else if (window.Inventory && Inventory.populateSelects) {
        Inventory.populateSelects();
      }
    } catch (err) {
      console.warn('Could not load inventory for release modal:', err);
    }
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
    if (dateEl && window.Utils) dateEl.value = Utils.today();

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
