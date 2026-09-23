/**
 * Modal open/close helpers — robust show/hide (class + inline style).
 */
const Modals = {
  open(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) {
      console.error('[Modals] Element not found:', id);
      return false;
    }
    // Move to body so fixed positioning is never clipped by parent overflow
    if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
    el.classList.add('open');
    el.classList.remove('hidden');
    el.style.display = 'flex';
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    return true;
  },

  close(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return;
    el.classList.remove('open');
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
    // Only unlock scroll if no other modal is open
    if (!document.querySelector('.modal-backdrop.open')) {
      document.body.style.overflow = '';
    }
  },

  closeAll() {
    document.querySelectorAll('.modal-backdrop').forEach((el) => {
      el.classList.remove('open');
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
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
      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;
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
    // Ensure all backdrops start hidden
    document.querySelectorAll('.modal-backdrop').forEach((el) => {
      if (!el.classList.contains('open')) {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      }
    });

    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = btn.getAttribute('data-close');
        if (target) this.close(target);
      });
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
