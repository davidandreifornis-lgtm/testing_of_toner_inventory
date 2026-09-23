/**
 * Stock issuance — always 1 unit, date = today.
 */
const Release = {
  locationsByDept: {},

  async loadLocations() {
    try {
      const res = await API.locations();
      // Expect either { departments: [...] } or { locations: [...] }
      const depts = res.departments || res.data?.departments || [];
      const locs = res.locations || res.data?.locations || [];

      this.locationsByDept = {};
      if (Array.isArray(depts) && depts.length) {
        depts.forEach((d) => {
          const name = d.name || d.department || d;
          this.locationsByDept[name] = (d.locations || []).map((l) => l.name || l.location || l);
        });
      } else if (Array.isArray(locs)) {
        locs.forEach((l) => {
          const dept = l.department || l.dept || 'General';
          if (!this.locationsByDept[dept]) this.locationsByDept[dept] = [];
          this.locationsByDept[dept].push(l.name || l.location || l);
        });
      }

      // Fallback common departments if API empty
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
      // Use fallback
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
    if (locs.length === 1) locSel.value = locs[0];
  },

  onItemChange() {
    const code = document.getElementById('rel-item')?.value || '';
    const hint = document.getElementById('rel-stock-hint');
    if (!hint) return;
    const item = Inventory.items.find((i) => (i.itemCode || i.inkCode) === code);
    if (item) {
      hint.textContent = `On hand: ${item.quantity}`;
      hint.className = item.quantity < 1 ? 'text-xs text-rose-600 mt-1' : 'text-xs text-slate-400 mt-1';
    } else {
      hint.textContent = '';
    }
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
      const res = await API.release({
        referenceNumber: ref,
        inkCode,
        itemCode: inkCode,
        department,
        location,
        issuedBy,
      });
      this.showMsg(res.message || 'Issuance recorded.', true);
      Notifications.toast('Issuance recorded: ' + ref, 'success');
      document.getElementById('rel-ref').value = '';
      await Inventory.load();
      Dashboard.load();
    } catch (err) {
      this.showMsg(err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  init() {
    const dateEl = document.getElementById('rel-date');
    if (dateEl) dateEl.value = Utils.today();

    document.getElementById('rel-dept')?.addEventListener('change', () => this.onDeptChange());
    document.getElementById('rel-item')?.addEventListener('change', () => this.onItemChange());
    document.getElementById('btn-record-release')?.addEventListener('click', () => this.submit());
    this.loadLocations();
  },
};

window.Release = Release;
