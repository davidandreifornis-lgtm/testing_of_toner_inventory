/**
 * Receive delivery — MRR only (ERP search → confirm lines).
 * Supplier is not collected here (integrated elsewhere later).
 */
const Delivery = {
  mrrLines: [],

  renderMrrLines() {
    const tbody = document.getElementById('del-mrr-lines');
    const panel = document.getElementById('del-mrr-panel');
    const count = document.getElementById('del-mrr-count');
    if (!tbody || !panel) return;
    if (!this.mrrLines.length) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');
    if (count) count.textContent = `${this.mrrLines.length} line${this.mrrLines.length === 1 ? '' : 's'}`;
    tbody.innerHTML = this.mrrLines
      .map(
        (l) => `<tr>
        <td class="font-mono">${Utils.escapeHtml(l.itemCode)}</td>
        <td class="text-slate-600">${Utils.escapeHtml(l.description || '—')}</td>
        <td class="text-right font-medium">${l.quantity}</td>
        <td>${Utils.escapeHtml(l.date || '')}</td>
      </tr>`
      )
      .join('');
  },

  async searchMrr() {
    const ref = (document.getElementById('del-ref')?.value || '').trim().toUpperCase();
    if (!ref) {
      this.showMsg('Enter an MRR number to search.', false);
      return;
    }
    const btn = document.getElementById('btn-search-mrr');
    if (btn) btn.disabled = true;
    try {
      const res = await API.post('/delivery.php', { action: 'preview', mrr: ref, referenceNumber: ref });
      this.mrrLines = res.lines || [];
      this.renderMrrLines();
      const warn = document.getElementById('del-mrr-warning');
      if (warn) {
        if (res.alreadyRecorded) {
          warn.textContent = 'This reference was already recorded. Recording again will be blocked.';
          warn.classList.remove('hidden');
        } else {
          warn.classList.add('hidden');
        }
      }
      this.showMsg(`Found ${this.mrrLines.length} line(s) for ${ref}.`, true);
    } catch (err) {
      this.mrrLines = [];
      this.renderMrrLines();
      this.showMsg(err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  open() {
    this.mrrLines = [];
    this.renderMrrLines();
    const msg = document.getElementById('del-msg');
    if (msg) msg.classList.add('hidden');
    const ref = document.getElementById('del-ref');
    if (ref) ref.value = '';
    if (window.Modals) Modals.open('modal-delivery');
    else {
      const el = document.getElementById('modal-delivery');
      if (el) {
        el.classList.add('open');
        el.style.display = 'flex';
      }
    }
    ref?.focus();
  },

  init() {
    document.getElementById('btn-open-delivery')?.addEventListener('click', () => this.open());
    document.getElementById('btn-record-delivery')?.addEventListener('click', () => this.submit());
    document.getElementById('btn-search-mrr')?.addEventListener('click', () => this.searchMrr());
    document.getElementById('del-ref')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.searchMrr();
      }
    });
  },

  showMsg(text, ok) {
    const el = document.getElementById('del-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'text-sm ' + (ok ? 'text-emerald-700' : 'text-rose-700');
    el.classList.remove('hidden');
  },

  async submit() {
    const ref = (document.getElementById('del-ref')?.value || '').trim().toUpperCase();

    if (!ref) {
      this.showMsg('MRR number is required.', false);
      return;
    }
    if (!this.mrrLines.length) {
      this.showMsg('Search MRR first, then confirm the lines.', false);
      return;
    }

    const ok = await Modals.confirm(
      `Record delivery for MRR ${ref} (${this.mrrLines.length} line${this.mrrLines.length === 1 ? '' : 's'})? Stock will increase.`,
      { title: 'Confirm delivery', okLabel: 'Record delivery' }
    );
    if (!ok) return;

    const btn = document.getElementById('btn-record-delivery');
    if (btn) btn.disabled = true;

    try {
      const res = await API.delivery({
        referenceNumber: ref,
        mrr: ref,
        lines: this.mrrLines,
      });
      const count = res.lineCount || this.mrrLines.length;
      this.showMsg(res.message || 'Delivery recorded.', true);
      Notifications.toast(
        count > 1 ? `Delivery recorded: ${ref} (${count} lines)` : 'Delivery recorded: ' + ref,
        'success'
      );
      document.getElementById('del-ref').value = '';
      this.mrrLines = [];
      this.renderMrrLines();
      await Inventory.load();
      Dashboard.load();
      setTimeout(() => Modals.close('modal-delivery'), 600);
    } catch (err) {
      this.showMsg(err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },
};

window.Delivery = Delivery;
