/**
 * Email / SMTP settings UI.
 */
const Settings = {
  current: null,

  showMsg(text, ok) {
    const el = document.getElementById('settings-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'text-sm ' + (ok ? 'text-emerald-700' : 'text-rose-700');
    el.classList.remove('hidden');
  },

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
      src.textContent = source === 'database'
        ? 'Source: database (toner_email_settings)'
        : 'Source: defaults / config file (save to persist in database)';
    }
  },

  async load() {
    try {
      const res = await API.get('/settings.php');
      this.fillForm(res.email || {}, res.source || 'defaults');
    } catch (err) {
      this.showMsg(err.message || 'Could not load email settings.', false);
      // Still show empty form for offline editing notes
      this.fillForm(
        {
          smtp_host: 'smtp.gmail.com',
          smtp_port: 465,
          smtp_encryption: 'ssl',
          cooldown_hours: 12,
        },
        'unavailable'
      );
    }
  },

  collect() {
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

  async save() {
    const email = this.collect();
    if (!email.alert_recipient) {
      this.showMsg('Alert recipient email is required.', false);
      return;
    }
    if (!email.smtp_host) {
      this.showMsg('SMTP host is required.', false);
      return;
    }
    if (!email.smtp_user) {
      this.showMsg('SMTP username is required.', false);
      return;
    }

    const btn = document.getElementById('btn-save-email');
    if (btn) btn.disabled = true;
    try {
      const res = await API.post('/settings.php', { email });
      this.showMsg(res.message || 'Email settings saved.', true);
      Notifications.toast('Email settings saved', 'success');
      this.fillForm(res.email || email, res.source || 'database');
    } catch (err) {
      this.showMsg(err.message, false);
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
        (r.sent
          ? 'Alert email sent (or attempted).'
          : r.reason || 'Low-stock check completed.');
      this.showMsg(typeof msg === 'string' ? msg : JSON.stringify(r), !!r.sent || res.ok !== false);
      Notifications.toast('Low-stock check finished', r.sent ? 'success' : 'info');
    } catch (err) {
      this.showMsg(err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  init() {
    document.getElementById('btn-save-email')?.addEventListener('click', () => this.save());
    document.getElementById('btn-test-low-stock')?.addEventListener('click', () => this.testLowStock());

    // Port helper when encryption changes
    document.getElementById('mail-smtp-encryption')?.addEventListener('change', (e) => {
      const port = document.getElementById('mail-smtp-port');
      if (!port) return;
      if (e.target.value === 'ssl' && (port.value === '587' || port.value === '')) port.value = '465';
      if (e.target.value === 'tls' && (port.value === '465' || port.value === '')) port.value = '587';
    });
  },
};

window.Settings = Settings;
