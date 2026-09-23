/**
 * Modal open/close helpers + shared admin confirmation dialog.
 */
const Modals = {
  _confirmResolver: null,

  open(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) {
      console.error('[Modals] Element not found:', id);
      return false;
    }
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
    if (!document.querySelector('.modal-backdrop.open')) {
      document.body.style.overflow = '';
    }
  },

  closeAll() {
    // If confirm is open, treat as cancel
    if (this._confirmResolver) {
      const r = this._confirmResolver;
      this._confirmResolver = null;
      r(false);
    }
    document.querySelectorAll('.modal-backdrop').forEach((el) => {
      el.classList.remove('open');
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  },

  /**
   * @param {string} message
   * @param {string|object} titleOrOpts - title string, or { title, okLabel, cancelLabel, danger }
   * @returns {Promise<boolean>}
   */
  confirm(message, titleOrOpts = 'Confirm action') {
    const opts =
      typeof titleOrOpts === 'string'
        ? { title: titleOrOpts }
        : titleOrOpts || {};
    const title = opts.title || 'Confirm action';
    const okLabel = opts.okLabel || 'Confirm';
    const cancelLabel = opts.cancelLabel || 'Cancel';
    const danger = !!opts.danger;

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
      ok.textContent = okLabel;
      cancel.textContent = cancelLabel;
      ok.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');

      // Cancel any previous pending confirm
      if (this._confirmResolver) {
        this._confirmResolver(false);
        this._confirmResolver = null;
      }
      this._confirmResolver = resolve;

      this.open('modal-confirm');

      const cleanup = (result) => {
        ok.removeEventListener('click', onOk);
        cancel.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onBackdrop);
        if (this._confirmResolver === resolve) this._confirmResolver = null;
        this.close('modal-confirm');
        resolve(result);
      };
      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);
      const onBackdrop = (e) => {
        if (e.target === modal) cleanup(false);
      };
      ok.addEventListener('click', onOk);
      cancel.addEventListener('click', onCancel);
      modal.addEventListener('click', onBackdrop);
    });
  },

  init() {
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
        if (target === 'modal-confirm' && this._confirmResolver) {
          const r = this._confirmResolver;
          this._confirmResolver = null;
          r(false);
        }
        if (target) this.close(target);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      if (backdrop.id === 'modal-confirm') return; // handled in confirm()
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
