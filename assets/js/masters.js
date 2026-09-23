/**
 * Masters: suppliers + department/location/printer management.
 */
const Masters = {
  showMsg(id, text, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'text-sm ' + (ok ? 'text-emerald-700' : 'text-rose-700');
    el.classList.remove('hidden');
  },

  async loadSuppliers() {
    const tbody = document.getElementById('suppliers-tbody');
    if (!tbody) return;
    try {
      const res = await API.get('/suppliers.php');
      const list = res.suppliers || [];
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-slate-400 text-center py-6">No suppliers yet.</td></tr>';
        return;
      }
      tbody.innerHTML = list
        .map(
          (s) => `<tr data-id="${s.id}">
          <td>${Utils.escapeHtml(s.name)}</td>
          <td class="text-right">
            <button type="button" class="text-xs text-rose-600 hover:underline btn-del-supplier" data-id="${s.id}">Remove</button>
          </td>
        </tr>`
        )
        .join('');
      tbody.querySelectorAll('.btn-del-supplier').forEach((btn) => {
        btn.addEventListener('click', () => this.removeSupplier(Number(btn.getAttribute('data-id'))));
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-rose-600 text-center py-6">${Utils.escapeHtml(err.message)}</td></tr>`;
    }
  },

  async addSupplier() {
    const input = document.getElementById('supplier-name');
    const name = (input?.value || '').trim();
    if (!name) {
      this.showMsg('suppliers-msg', 'Supplier name is required.', false);
      return;
    }
    try {
      await API.post('/suppliers.php', { name });
      if (input) input.value = '';
      this.showMsg('suppliers-msg', 'Supplier added.', true);
      Notifications.toast('Supplier added', 'success');
      await this.loadSuppliers();
      if (window.Delivery) Delivery.loadSuppliers?.();
    } catch (err) {
      this.showMsg('suppliers-msg', err.message, false);
      Notifications.toast(err.message, 'error');
    }
  },

  async removeSupplier(id) {
    if (!id || !confirm('Remove this supplier?')) return;
    try {
      await API.del('/suppliers.php', { id });
      this.showMsg('suppliers-msg', 'Supplier removed.', true);
      await this.loadSuppliers();
      if (window.Delivery) Delivery.loadSuppliers?.();
    } catch (err) {
      this.showMsg('suppliers-msg', err.message, false);
    }
  },

  async loadLocations() {
    const tbody = document.getElementById('locations-tbody');
    if (!tbody) return;
    try {
      const res = await API.locations();
      const list = res.locations || [];
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-slate-400 text-center py-6">No locations yet.</td></tr>';
        return;
      }
      tbody.innerHTML = list
        .map(
          (l) => `<tr data-id="${l.id}">
          <td>${Utils.escapeHtml(l.department)}</td>
          <td>${Utils.escapeHtml(l.location)}</td>
          <td class="text-slate-600">${Utils.escapeHtml(l.printerName || '—')}</td>
          <td class="text-right">
            <button type="button" class="text-xs text-rose-600 hover:underline btn-del-location" data-id="${l.id}">Remove</button>
          </td>
        </tr>`
        )
        .join('');
      tbody.querySelectorAll('.btn-del-location').forEach((btn) => {
        btn.addEventListener('click', () => this.removeLocation(Number(btn.getAttribute('data-id'))));
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-rose-600 text-center py-6">${Utils.escapeHtml(err.message)}</td></tr>`;
    }
  },

  async addLocation() {
    const department = (document.getElementById('loc-dept')?.value || '').trim().toUpperCase();
    const location = (document.getElementById('loc-name')?.value || '').trim();
    const printerName = (document.getElementById('loc-printer')?.value || '').trim();
    if (!department || !location) {
      this.showMsg('locations-msg', 'Department and location are required.', false);
      return;
    }
    try {
      await API.post('/locations.php', { department, location, printerName });
      document.getElementById('loc-dept').value = '';
      document.getElementById('loc-name').value = '';
      document.getElementById('loc-printer').value = '';
      this.showMsg('locations-msg', 'Location added.', true);
      Notifications.toast('Location added', 'success');
      await this.loadLocations();
      if (window.Release) Release.loadLocations?.();
    } catch (err) {
      this.showMsg('locations-msg', err.message, false);
      Notifications.toast(err.message, 'error');
    }
  },

  async removeLocation(id) {
    if (!id || !confirm('Remove this location?')) return;
    try {
      await API.del('/locations.php', { id });
      this.showMsg('locations-msg', 'Location removed.', true);
      await this.loadLocations();
      if (window.Release) Release.loadLocations?.();
    } catch (err) {
      this.showMsg('locations-msg', err.message, false);
    }
  },

  load() {
    this.loadSuppliers();
    this.loadLocations();
  },

  init() {
    document.getElementById('btn-add-supplier')?.addEventListener('click', () => this.addSupplier());
    document.getElementById('btn-refresh-suppliers')?.addEventListener('click', () => this.loadSuppliers());
    document.getElementById('btn-add-location')?.addEventListener('click', () => this.addLocation());
    document.getElementById('btn-refresh-locations')?.addEventListener('click', () => this.loadLocations());
    document.getElementById('supplier-name')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addSupplier();
      }
    });
  },
};

window.Masters = Masters;
