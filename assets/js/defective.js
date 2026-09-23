/**
 * Flag defective only — does NOT restore usable stock.
 * Other defective workflow actions will be placed elsewhere later.
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

    const ok = await Modals.confirm(
      `Flag reference ${ref} as defective? Usable stock will not be restored.`,
      { title: 'Confirm defective', okLabel: 'Flag defective', danger: true }
    );
    if (!ok) return;

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
      setTimeout(() => Modals.close('modal-defective'), 600);
    } catch (err) {
      this.showMsg(err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  open() {
    const msg = document.getElementById('def-msg');
    if (msg) msg.classList.add('hidden');
    if (window.Modals) Modals.open('modal-defective');
    else {
      const el = document.getElementById('modal-defective');
      if (el) {
        el.classList.add('open');
        el.style.display = 'flex';
      }
    }
    document.getElementById('def-ref')?.focus();
  },

  init() {
    document.getElementById('btn-open-defective')?.addEventListener('click', () => this.open());
    document.getElementById('btn-flag-defective')?.addEventListener('click', () => this.submit());
  },
};

window.Defective = Defective;
