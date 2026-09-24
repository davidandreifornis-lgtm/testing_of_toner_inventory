/**
 * Return Defective — search issuance ticket first, then flag.
 * Stock is NOT restored on flag.
 */
const Defective = {
  found: null, // RELEASED transaction from search

  showMsg(text, ok) {
    const el = document.getElementById('def-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'text-sm ' + (ok ? 'text-emerald-700' : 'text-rose-700');
    el.classList.remove('hidden');
  },

  hideMsg() {
    const el = document.getElementById('def-msg');
    if (el) el.classList.add('hidden');
  },

  clearPreview() {
    this.found = null;
    const preview = document.getElementById('def-preview');
    const notesWrap = document.getElementById('def-notes-wrap');
    const flagBtn = document.getElementById('btn-flag-defective');
    if (preview) preview.classList.add('hidden');
    if (notesWrap) notesWrap.classList.add('hidden');
    if (flagBtn) flagBtn.disabled = true;
  },

  showPreview(t) {
    this.found = t;
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || '—';
    };
    set('def-prev-ref', t.referenceNumber);
    set('def-prev-toner', t.inkCode);
    set('def-prev-dept', t.department);
    set('def-prev-loc', t.location);
    set('def-prev-date', t.date);
    set('def-prev-qty', String(t.quantity != null ? t.quantity : 1));

    document.getElementById('def-preview')?.classList.remove('hidden');
    document.getElementById('def-notes-wrap')?.classList.remove('hidden');
    const flagBtn = document.getElementById('btn-flag-defective');
    if (flagBtn) flagBtn.disabled = false;
  },

  async search() {
    const ref = (document.getElementById('def-ref')?.value || '').trim().toUpperCase();
    this.hideMsg();
    this.clearPreview();

    if (!ref) {
      this.showMsg('Enter an issuance reference number to search.', false);
      return;
    }

    // Keep input normalized
    const refEl = document.getElementById('def-ref');
    if (refEl) refEl.value = ref;

    const searchBtn = document.getElementById('btn-search-defective');
    if (searchBtn) searchBtn.disabled = true;

    try {
      // Load RELEASED and DEFECTIVE for this reference
      const [relRes, defRes] = await Promise.all([
        API.transactions({ type: 'RELEASED' }),
        API.transactions({ type: 'DEFECTIVE' }),
      ]);

      const released = (relRes.transactions || []).filter(
        (t) => String(t.referenceNumber || '').trim().toUpperCase() === ref
      );
      const defective = (defRes.transactions || []).filter(
        (t) => String(t.referenceNumber || '').trim().toUpperCase() === ref
      );

      if (!released.length) {
        this.showMsg(
          'Issuance not found — process the release first, then flag it as defective.',
          false
        );
        return;
      }

      // Prefer a RELEASED row that is not already marked defective
      const active = released.find((t) => !t.defective) || released[0];

      if (active.defective || defective.length) {
        this.showMsg(
          'Already flagged — this issuance ticket was already marked as defective.',
          false
        );
        // Still show details so the admin can see what it was
        this.showPreview(active);
        const flagBtn = document.getElementById('btn-flag-defective');
        if (flagBtn) flagBtn.disabled = true;
        document.getElementById('def-notes-wrap')?.classList.add('hidden');
        return;
      }

      this.showPreview(active);
      this.showMsg('Issuance found. Review details, then flag as defective.', true);
    } catch (err) {
      this.showMsg(err.message || 'Search failed.', false);
    } finally {
      if (searchBtn) searchBtn.disabled = false;
    }
  },

  async submit() {
    if (!this.found) {
      this.showMsg('Search for a valid issuance ticket first.', false);
      return;
    }

    const ref = String(this.found.referenceNumber || '')
      .trim()
      .toUpperCase();
    const notes = (document.getElementById('def-notes')?.value || '').trim();

    if (!ref) {
      this.showMsg('Reference number is required.', false);
      return;
    }

    let confirmed = true;
    if (window.Modals && typeof Modals.confirm === 'function') {
      confirmed = await Modals.confirm(
        `Flag reference ${ref} as defective? Usable stock will not be restored.`,
        { title: 'Confirm defective', okLabel: 'Flag defective', danger: true }
      );
    }
    if (!confirmed) return;

    const btn = document.getElementById('btn-flag-defective');
    if (btn) btn.disabled = true;

    try {
      const res = await API.defective({
        action: 'flag',
        referenceNumber: ref,
        notes,
      });
      this.showMsg(res.message || 'Flagged as defective. Stock unchanged.', true);
      if (window.Notifications) Notifications.toast('Flagged defective: ' + ref, 'success');
      document.getElementById('def-ref').value = '';
      document.getElementById('def-notes').value = '';
      this.clearPreview();
      if (window.Dashboard) Dashboard.load();
      if (window.Inventory) Inventory.load?.();
      setTimeout(() => {
        if (window.Modals) Modals.close('modal-defective');
      }, 600);
    } catch (err) {
      this.showMsg(err.message, false);
      if (window.Notifications) Notifications.toast(err.message, 'error');
      if (btn) btn.disabled = false;
    }
  },

  open() {
    this.hideMsg();
    this.clearPreview();
    const refEl = document.getElementById('def-ref');
    if (refEl) refEl.value = '';
    const notes = document.getElementById('def-notes');
    if (notes) notes.value = '';

    if (window.Modals) Modals.open('modal-defective');
    else {
      const el = document.getElementById('modal-defective');
      if (el) {
        el.classList.add('open');
        el.style.display = 'flex';
      }
    }
    refEl?.focus();
  },

  init() {
    document.getElementById('btn-open-defective')?.addEventListener('click', () => this.open());
    document.getElementById('btn-search-defective')?.addEventListener('click', () => this.search());
    document.getElementById('btn-flag-defective')?.addEventListener('click', () => this.submit());

    // Enter in reference field triggers search
    document.getElementById('def-ref')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.search();
      }
    });

    // Typing a new ref clears previous search result
    document.getElementById('def-ref')?.addEventListener('input', () => {
      this.clearPreview();
      this.hideMsg();
    });
  },
};

window.Defective = Defective;
