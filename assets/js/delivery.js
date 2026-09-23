/**
 * Receive delivery — stock increases, duplicate ref blocked.
 */
const Delivery = {
  init() {
    const dateEl = document.getElementById('del-date');
    if (dateEl) dateEl.value = Utils.today();

    document.getElementById('btn-record-delivery')?.addEventListener('click', () => this.submit());
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
    const inkCode = (document.getElementById('del-item')?.value || '').trim().toUpperCase();
    const quantity = parseInt(document.getElementById('del-qty')?.value || '0', 10);
    const date = document.getElementById('del-date')?.value || Utils.today();
    const supplier = (document.getElementById('del-supplier')?.value || '').trim();

    if (!ref) {
      this.showMsg('Reference number is required.', false);
      return;
    }
    if (!inkCode) {
      this.showMsg('Select a toner / item code.', false);
      return;
    }
    if (quantity < 1) {
      this.showMsg('Quantity must be at least 1.', false);
      return;
    }

    const btn = document.getElementById('btn-record-delivery');
    if (btn) btn.disabled = true;

    try {
      const res = await API.delivery({
        referenceNumber: ref,
        inkCode,
        itemCode: inkCode,
        quantity,
        date,
        supplier,
      });
      this.showMsg(res.message || 'Delivery recorded.', true);
      Notifications.toast('Delivery recorded: ' + ref, 'success');
      document.getElementById('del-ref').value = '';
      document.getElementById('del-qty').value = '1';
      await Inventory.load();
      Dashboard.load();
    } catch (err) {
      this.showMsg(err.message, false);
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },
};

window.Delivery = Delivery;
