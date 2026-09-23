/**
 * Flag defective — does NOT restore usable stock.
 */
const Defective = {
  showMsg(text, ok) {
    const el = document.getElementById('def-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'text-sm ' + (ok ? 'text-emerald-700' : 'text-rose-700');
    el.classList.remove('hidden');
  },

  async submit() {
    const ref = (document.getElementById('def-ref')?.value || '').trim().toUpperCase();
    const notes = (document.getElementById('def-notes')?.value || '').trim();

    if (!ref) {
      this.showMsg('Reference number is required.', false);
      return;
    }

    const btn = document.getElementById('btn-flag-defective');
    if (btn) btn.disabled = true;

    try {
      const res = await API.defective({
        action: 'flag',
        referenceNumber: ref,
        notes,
      });
      this.showMsg(res.message || 'Flagged as defective. Stock unchanged.', true);
      Notifications.toast('Flagged defective: ' + ref, 'success');
      document.getElementById('def-ref').value = '';
      document.getElementById('def-notes').value = '';
      Dashboard.load();
    } catch (err) {
      this.showMsg(err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  init() {
    document.getElementById('btn-flag-defective')?.addEventListener('click', () => this.submit());
  },
};

window.Defective = Defective;
