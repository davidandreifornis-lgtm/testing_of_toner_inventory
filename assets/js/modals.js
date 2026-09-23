/**
 * Modal open/close helpers.
 */
const Modals = {
  open(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  close(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  closeAll() {
    document.querySelectorAll('.modal-backdrop.open').forEach((el) => {
      el.classList.remove('open');
    });
    document.body.style.overflow = '';
  },

  confirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-confirm');
      const titleEl = document.getElementById('confirm-title');
      const msgEl = document.getElementById('confirm-message');
      const ok = document.getElementById('confirm-ok');
      const cancel = document.getElementById('confirm-cancel');
      if (!modal || !ok || !cancel) {
        resolve(window.confirm(message));
        return;
      }
      titleEl.textContent = title;
      msgEl.textContent = message;
      this.open('modal-confirm');

      const cleanup = (result) => {
        ok.removeEventListener('click', onOk);
        cancel.removeEventListener('click', onCancel);
        this.close('modal-confirm');
        resolve(result);
      };
      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);
      ok.addEventListener('click', onOk);
      cancel.addEventListener('click', onCancel);
    });
  },

  init() {
    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => this.close(btn.getAttribute('data-close')));
    });
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.close(backdrop.id);
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAll();
    });
  },
};

window.Modals = Modals;
