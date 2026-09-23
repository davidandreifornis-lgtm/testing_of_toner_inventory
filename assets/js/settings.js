/**
 * Settings — Email/SMTP + User management
 */
const Settings = {
  current: null,
  users: [],
  me: null,
  tab: 'email',

  showMsg(id, text, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'text-sm ' + (ok ? 'text-emerald-700' : 'text-rose-700');
    el.classList.remove('hidden');
  },

  /** Tabs only on small phones (< 768px). Tablet/desktop show both sections. */
  isTabMode() {
    return window.matchMedia('(max-width: 767px)').matches;
  },

  setTab(tab) {
    this.tab = tab || 'email';
    document.querySelectorAll('.settings-tab').forEach((btn) => {
      const active = btn.getAttribute('data-tab') === this.tab;
      btn.classList.toggle('bg-white', active);
      btn.classList.toggle('shadow-sm', active);
      btn.classList.toggle('text-slate-900', active);
      btn.classList.toggle('text-slate-600', !active);
    });
    const email = document.getElementById('settings-panel-email');
    const users = document.getElementById('settings-panel-users');
    const view = document.getElementById('view-settings');
    if (this.isTabMode()) {
      view?.classList.add('settings-tab-mode');
      email?.classList.toggle('settings-panel-hidden', this.tab !== 'email');
      users?.classList.toggle('settings-panel-hidden', this.tab !== 'users');
    } else {
      view?.classList.remove('settings-tab-mode');
      email?.classList.remove('settings-panel-hidden');
      users?.classList.remove('settings-panel-hidden');
    }
  },

  syncLayout() {
    this.setTab(this.tab || 'email');
  },

  // ——— Email ———
  fillForm(email, source) {
    this.current = email || {};
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val != null ? val : '';
    };
    set('mail-alert-recipient', email.alert_recipient || email.admin_email || '');
    set('mail-smtp-host', email.smtp_host || '');
    set('mail-smtp-port', email.smtp_port != null ? email.smtp_port : 465);
    set('mail-smtp-encryption', email.smtp_encryption || 'ssl');
    set('mail-cooldown', email.cooldown_hours != null ? email.cooldown_hours : 12);
    set('mail-smtp-user', email.smtp_user || '');
    set('mail-smtp-pass', '');

    const hint = document.getElementById('mail-pass-hint');
    if (hint) {
      hint.textContent = email.smtp_pass_set
        ? 'A password is already saved. Leave blank to keep it, or enter a new one to replace.'
        : 'No password saved yet. Enter SMTP / App password.';
    }
    const src = document.getElementById('settings-source');
    if (src) {
      src.textContent =
        source === 'database'
          ? 'Source: database (toner_email_settings)'
          : 'Source: defaults / config file (save to persist in database)';
    }
  },

  async loadEmail() {
    try {
      const res = await API.get('/settings.php');
      this.fillForm(res.email || {}, res.source || 'defaults');
    } catch (err) {
      this.showMsg('settings-msg', err.message || 'Could not load email settings.', false);
      this.fillForm(
        { smtp_host: '', smtp_port: 465, smtp_encryption: 'ssl', cooldown_hours: 12 },
        'unavailable'
      );
    }
  },

  collectEmail() {
    return {
      alert_recipient: (document.getElementById('mail-alert-recipient')?.value || '').trim(),
      admin_email: (document.getElementById('mail-alert-recipient')?.value || '').trim(),
      smtp_host: (document.getElementById('mail-smtp-host')?.value || '').trim(),
      smtp_port: parseInt(document.getElementById('mail-smtp-port')?.value || '465', 10),
      smtp_encryption: document.getElementById('mail-smtp-encryption')?.value || 'ssl',
      cooldown_hours: parseInt(document.getElementById('mail-cooldown')?.value || '12', 10),
      smtp_user: (document.getElementById('mail-smtp-user')?.value || '').trim(),
      smtp_pass: document.getElementById('mail-smtp-pass')?.value || '',
      driver: 'smtp',
    };
  },

  async saveEmail() {
    const email = this.collectEmail();
    if (!email.alert_recipient) {
      this.showMsg('settings-msg', 'Alert recipient email is required.', false);
      return;
    }
    if (!email.smtp_host) {
      this.showMsg('settings-msg', 'SMTP host is required.', false);
      return;
    }
    if (!email.smtp_user) {
      this.showMsg('settings-msg', 'SMTP username is required.', false);
      return;
    }
    const btn = document.getElementById('btn-save-email');
    if (btn) btn.disabled = true;
    try {
      const res = await API.post('/settings.php', { email });
      this.showMsg('settings-msg', res.message || 'Email settings saved.', true);
      Notifications.toast('Email settings saved', 'success');
      this.fillForm(res.email || email, res.source || 'database');
    } catch (err) {
      this.showMsg('settings-msg', err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  async testLowStock() {
    const btn = document.getElementById('btn-test-low-stock');
    if (btn) btn.disabled = true;
    try {
      const res = await API.get('/check_low_stock.php', { force: '1' });
      const r = res.result || res;
      const msg =
        r.message ||
        (r.sent ? 'Alert email sent (or attempted).' : r.reason || 'Low-stock check completed.');
      this.showMsg('settings-msg', typeof msg === 'string' ? msg : JSON.stringify(r), !!r.sent || res.ok !== false);
      Notifications.toast('Low-stock check finished', r.sent ? 'success' : 'info');
    } catch (err) {
      this.showMsg('settings-msg', err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  // ——— Users ———
  async loadMe() {
    try {
      const res = await API.get('/users.php', { self: '1' });
      this.me = res.user || null;
      const info = document.getElementById('my-user-info');
      if (info && this.me) {
        info.textContent =
          `Signed in as ${this.me.username}` +
          (this.me.fullName ? ` (${this.me.fullName})` : '') +
          ` · role: ${this.me.role}` +
          (this.me.source === 'config' ? ' · config file login (run migration_users.sql for DB users)' : '');
      }
    } catch {
      this.me = null;
    }
  },

  async loadUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    try {
      const res = await API.get('/users.php');
      this.users = res.users || [];
      if (!this.users.length) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="text-slate-400 text-center py-6">No users in database. Add one above, or run sql/migration_users.sql.</td></tr>';
        return;
      }
      tbody.innerHTML = this.users
        .map((u) => {
          const status = u.isActive
            ? '<span class="badge badge-in">Active</span>'
            : '<span class="badge badge-out">Inactive</span>';
          const roleBadge =
            u.role === 'admin'
              ? '<span class="text-xs font-semibold text-slate-800">Admin</span>'
              : '<span class="text-xs text-slate-600">User</span>';
          return `<tr data-id="${u.id}">
            <td class="font-mono">${Utils.escapeHtml(u.username)}</td>
            <td>${Utils.escapeHtml(u.fullName || '—')}</td>
            <td>${roleBadge}</td>
            <td>${status}</td>
            <td class="text-right space-x-2">
              <button type="button" class="text-xs text-blue-600 hover:underline btn-edit-user" data-id="${u.id}">Edit</button>
              ${
                u.isActive
                  ? `<button type="button" class="text-xs text-rose-600 hover:underline btn-deactivate-user" data-id="${u.id}">Deactivate</button>`
                  : ''
              }
            </td>
          </tr>`;
        })
        .join('');
      tbody.querySelectorAll('.btn-edit-user').forEach((btn) => {
        btn.addEventListener('click', () => this.openEdit(Number(btn.getAttribute('data-id'))));
      });
      tbody.querySelectorAll('.btn-deactivate-user').forEach((btn) => {
        btn.addEventListener('click', () => this.deactivate(Number(btn.getAttribute('data-id'))));
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-rose-600 text-center py-6">${Utils.escapeHtml(err.message)}</td></tr>`;
    }
  },

  async addUser() {
    const username = (document.getElementById('user-new-username')?.value || '').trim().toLowerCase();
    const fullName = (document.getElementById('user-new-fullname')?.value || '').trim();
    const password = document.getElementById('user-new-password')?.value || '';
    const role = document.getElementById('user-new-role')?.value || 'user';

    if (!username) {
      this.showMsg('users-msg', 'Username is required.', false);
      return;
    }
    if (password.length < 6) {
      this.showMsg('users-msg', 'Password must be at least 6 characters.', false);
      return;
    }
    const btn = document.getElementById('btn-add-user');
    if (btn) btn.disabled = true;
    try {
      await API.post('/users.php', { username, fullName, password, role });
      document.getElementById('user-new-username').value = '';
      document.getElementById('user-new-fullname').value = '';
      document.getElementById('user-new-password').value = '';
      document.getElementById('user-new-role').value = 'user';
      this.showMsg('users-msg', 'User created.', true);
      Notifications.toast('User created', 'success');
      await this.loadUsers();
    } catch (err) {
      this.showMsg('users-msg', err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  openEdit(id) {
    const u = this.users.find((x) => x.id === id);
    if (!u) return;
    document.getElementById('edit-user-id').value = String(u.id);
    document.getElementById('edit-user-username').value = u.username;
    document.getElementById('edit-user-fullname').value = u.fullName || '';
    document.getElementById('edit-user-role').value = u.role === 'admin' ? 'admin' : 'user';
    document.getElementById('edit-user-active').value = u.isActive ? '1' : '0';
    document.getElementById('edit-user-password').value = '';
    const msg = document.getElementById('edit-user-msg');
    if (msg) msg.classList.add('hidden');
    if (window.Modals) Modals.open('modal-edit-user');
    else {
      const el = document.getElementById('modal-edit-user');
      if (el) {
        el.classList.add('open');
        el.style.display = 'flex';
      }
    }
  },

  async saveEdit() {
    const id = parseInt(document.getElementById('edit-user-id')?.value || '0', 10);
    const fullName = (document.getElementById('edit-user-fullname')?.value || '').trim();
    const role = document.getElementById('edit-user-role')?.value || 'user';
    const isActive = document.getElementById('edit-user-active')?.value === '1';
    const password = document.getElementById('edit-user-password')?.value || '';

    if (!id) return;
    if (password && password.length < 6) {
      this.showMsg('edit-user-msg', 'Password must be at least 6 characters.', false);
      return;
    }
    const btn = document.getElementById('btn-save-edit-user');
    if (btn) btn.disabled = true;
    try {
      const payload = { id, fullName, role, isActive };
      if (password) payload.password = password;
      await API.put('/users.php', payload);
      Notifications.toast('User updated', 'success');
      if (window.Modals) Modals.close('modal-edit-user');
      await this.loadUsers();
    } catch (err) {
      this.showMsg('edit-user-msg', err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  async deactivate(id) {
    if (!id || !confirm('Deactivate this user? They will no longer be able to sign in.')) return;
    try {
      await API.del('/users.php', { id });
      this.showMsg('users-msg', 'User deactivated.', true);
      Notifications.toast('User deactivated', 'success');
      await this.loadUsers();
    } catch (err) {
      this.showMsg('users-msg', err.message, false);
      Notifications.toast(err.message, 'error');
    }
  },

  async changeMyPassword() {
    const current = document.getElementById('user-self-current')?.value || '';
    const next = document.getElementById('user-self-new')?.value || '';
    const confirmPw = document.getElementById('user-self-confirm')?.value || '';

    if (!this.me || !this.me.id) {
      this.showMsg(
        'self-pass-msg',
        'Password change requires a database user. Run sql/migration_users.sql and log in with a DB user.',
        false
      );
      return;
    }
    if (next.length < 6) {
      this.showMsg('self-pass-msg', 'New password must be at least 6 characters.', false);
      return;
    }
    if (next !== confirmPw) {
      this.showMsg('self-pass-msg', 'New password and confirmation do not match.', false);
      return;
    }
    const btn = document.getElementById('btn-change-my-password');
    if (btn) btn.disabled = true;
    try {
      await API.put('/users.php', {
        id: this.me.id,
        password: next,
        currentPassword: current,
        fullName: this.me.fullName,
      });
      document.getElementById('user-self-current').value = '';
      document.getElementById('user-self-new').value = '';
      document.getElementById('user-self-confirm').value = '';
      this.showMsg('self-pass-msg', 'Password updated.', true);
      Notifications.toast('Password updated', 'success');
    } catch (err) {
      this.showMsg('self-pass-msg', err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  load() {
    this.loadEmail();
    this.loadUsers();
    this.loadMe();
    this.syncLayout();
  },

  init() {
    document.querySelectorAll('.settings-tab').forEach((btn) => {
      btn.addEventListener('click', () => this.setTab(btn.getAttribute('data-tab')));
    });
    window.addEventListener('resize', () => {
      clearTimeout(this._resizeT);
      this._resizeT = setTimeout(() => this.syncLayout(), 120);
    });
    this.syncLayout();
    document.getElementById('btn-save-email')?.addEventListener('click', () => this.saveEmail());
    document.getElementById('btn-test-low-stock')?.addEventListener('click', () => this.testLowStock());
    document.getElementById('mail-smtp-encryption')?.addEventListener('change', (e) => {
      const port = document.getElementById('mail-smtp-port');
      if (!port) return;
      if (e.target.value === 'ssl' && (port.value === '587' || port.value === '')) port.value = '465';
      if (e.target.value === 'tls' && (port.value === '465' || port.value === '')) port.value = '587';
    });

    document.getElementById('btn-add-user')?.addEventListener('click', () => this.addUser());
    document.getElementById('btn-refresh-users')?.addEventListener('click', () => this.loadUsers());
    document.getElementById('btn-save-edit-user')?.addEventListener('click', () => this.saveEdit());
    document.getElementById('btn-change-my-password')?.addEventListener('click', () => this.changeMyPassword());
  },
};

window.Settings = Settings;
