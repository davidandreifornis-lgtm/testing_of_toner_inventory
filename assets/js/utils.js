/**
 * Shared utilities — no demo data, no localStorage fallback.
 */
const Utils = {
  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  formatDate(d) {
    if (!d) return '—';
    const s = String(d).slice(0, 10);
    try {
      const dt = new Date(s + 'T00:00:00');
      return dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return s;
    }
  },

  today() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  },

  periodRange(period) {
    const today = this.today();
    if (period === 'today') return { from: today, to: today };
    if (period === 'week') {
      const d = new Date();
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1);
      return { from: d.toISOString().slice(0, 10), to: today };
    }
    if (period === 'month') {
      const d = new Date();
      return { from: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`, to: today };
    }
    return { from: '', to: '' };
  },

  stockStatus(qty, reorder) {
    qty = Number(qty) || 0;
    reorder = Number(reorder) || 0;
    if (qty <= 0) return 'out';
    if (qty <= reorder) return 'low';
    return 'in';
  },

  statusBadge(status) {
    const map = {
      in: '<span class="badge badge-in">In stock</span>',
      low: '<span class="badge badge-low">Low stock</span>',
      out: '<span class="badge badge-out">Out of stock</span>',
    };
    return map[status] || '';
  },

  debounce(fn, ms = 250) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  },
};

window.Utils = Utils;
