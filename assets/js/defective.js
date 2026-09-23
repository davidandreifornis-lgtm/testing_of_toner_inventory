/**
 * Defective workflow: flag → send_to_supplier → receive_replacement
 */
const Defective = {
  action: 'flag',

  hints: {
    flag: 'Flag an already issued ticket as defective. Usable stock is <strong>not</strong> restored.',
    send_to_supplier: 'Mark the defective unit as shipped back to the supplier. Stock still not restored.',
    receive_replacement:
      'Supplier returned a good unit. Usable stock <strong>increases by 1</strong>. Enter who accepted it.',
  },

  btnLabels: {
    flag: 'Flag as Defective',
    send_to_supplier: 'Send to Supplier',
    receive_replacement: 'Receive Replacement',
  },

  setAction(action) {
    this.action = action;
    document.querySelectorAll('.def-action-btn').forEach((btn) => {
      const active = btn.getAttribute('data-action') === action;
      btn.classList.toggle('bg-white', active);
      btn.classList.toggle('shadow-sm', active);
      btn.classList.toggle('text-slate-900', active);
      btn.classList.toggle('text-slate-600', !active);
    });
    const hint = document.getElementById('def-action-hint');
    if (hint) hint.innerHTML = this.hints[action] || '';
    const notesWrap = document.getElementById('def-notes-wrap');
    if (notesWrap) notesWrap.classList.toggle('hidden', action !== 'flag');
    const acceptedWrap = document.getElementById('def-accepted-wrap');
    if (acceptedWrap) acceptedWrap.classList.toggle('hidden', action !== 'receive_replacement');
    const btn = document.getElementById('btn-flag-defective');
    if (btn) {
      btn.textContent = this.btnLabels[action] || 'Submit';
      btn.className =
        'btn ' +
        (action === 'receive_replacement' ? 'btn-success' : action === 'send_to_supplier' ? 'btn-secondary' : 'btn-danger');
    }
  },

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
    const acceptedBy = (document.getElementById('def-accepted-by')?.value || '').trim();

    if (!ref) {
      this.showMsg('Reference number is required.', false);
      return;
    }
    if (this.action === 'receive_replacement' && !acceptedBy) {
      this.showMsg('Accepted by is required when receiving a replacement.', false);
      return;
    }

    const btn = document.getElementById('btn-flag-defective');
    if (btn) btn.disabled = true;

    try {
      const payload = {
        action: this.action,
        referenceNumber: ref,
        notes,
      };
      if (this.action === 'receive_replacement') {
        payload.acceptedBy = acceptedBy;
      }
      const res = await API.defective(payload);
      this.showMsg(res.message || 'Done.', true);
      Notifications.toast(res.message || this.action + ': ' + ref, 'success');
      document.getElementById('def-ref').value = '';
      document.getElementById('def-notes').value = '';
      const ab = document.getElementById('def-accepted-by');
      if (ab) ab.value = '';
      if (this.action === 'receive_replacement') {
        await Inventory.load();
      }
      Dashboard.load();
      setTimeout(() => Modals.close('modal-defective'), 700);
    } catch (err) {
      this.showMsg(err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  open() {
    this.setAction('flag');
    const msg = document.getElementById('def-msg');
    if (msg) msg.classList.add('hidden');
    if (window.Modals) {
      Modals.open('modal-defective');
    } else {
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
    document.querySelectorAll('.def-action-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.setAction(btn.getAttribute('data-action')));
    });
  },
};

window.Defective = Defective;
