/**
 * Dashboard KPIs and charts — data from API only.
 */
const Dashboard = {
  inventory: [],
  transactions: [],

  async load() {
    try {
      const [invRes, txnRes] = await Promise.all([
        API.inventory(),
        API.transactions({}),
      ]);
      this.inventory = invRes.items || [];
      this.transactions = txnRes.transactions || [];
      this.render();
    } catch (err) {
      Notifications.toast(err.message || 'Failed to load dashboard', 'error');
    }
  },

  render() {
    const period = document.getElementById('dash-period')?.value || 'month';
    const range = Utils.periodRange(period);

    let skus = this.inventory.length;
    let stock = 0;
    let low = 0;
    let out = 0;
    let inCount = 0;
    const lowItems = [];

    this.inventory.forEach((item) => {
      const q = Number(item.quantity) || 0;
      const r = Number(item.reorderLevel) || 0;
      stock += q;
      const st = Utils.stockStatus(q, r);
      if (st === 'out') {
        out++;
        lowItems.push(item);
      } else if (st === 'low') {
        low++;
        lowItems.push(item);
      } else {
        inCount++;
      }
    });

    const inPeriod = (t) => {
      if (!range.from && !range.to) return true;
      const d = (t.date || '').slice(0, 10);
      if (range.from && d < range.from) return false;
      if (range.to && d > range.to) return false;
      return true;
    };

    let delCount = 0;
    let delUnits = 0;
    let relCount = 0;
    let relUnits = 0;
    const deptMap = {};

    this.transactions.filter(inPeriod).forEach((t) => {
      if (t.type === 'RECEIVED') {
        delCount++;
        delUnits += Number(t.quantity) || 0;
      } else if (t.type === 'RELEASED') {
        relCount++;
        relUnits += Number(t.quantity) || 0;
        const d = (t.department || 'Unknown').trim() || 'Unknown';
        deptMap[d] = (deptMap[d] || 0) + (Number(t.quantity) || 1);
      }
    });

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('kpi-skus', skus);
    set('kpi-stock', stock);
    set('kpi-low', low);
    set('kpi-out', out);
    set('kpi-deliveries', delCount);
    set('kpi-releases', relCount);
    set('kpi-deliveries-units', delUnits ? `${delUnits} units` : '');
    set('kpi-releases-units', relUnits ? `${relUnits} units` : '');

    const deptEntries = Object.entries(deptMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    Charts.renderDept(
      deptEntries.map((e) => e[0]),
      deptEntries.map((e) => e[1])
    );
    Charts.renderStatus(inCount, low, out);

    const alertBox = document.getElementById('dash-low-stock-alert');
    const list = document.getElementById('dash-low-list');
    if (alertBox && list) {
      if (lowItems.length) {
        alertBox.classList.remove('hidden');
        list.innerHTML = lowItems
          .slice(0, 12)
          .map((i) => {
            const st = Utils.stockStatus(i.quantity, i.reorderLevel);
            return `<li><span class="font-mono font-semibold">${Utils.escapeHtml(i.itemCode || i.inkCode)}</span> — qty ${i.quantity} (${st === 'out' ? 'out' : 'low'})</li>`;
          })
          .join('');
        lowItems.forEach((i) => {
          Notifications.add(
            stLabel(i),
            `${i.itemCode || i.inkCode}: ${i.quantity} on hand`,
            'warning'
          );
        });
      } else {
        alertBox.classList.add('hidden');
        list.innerHTML = '';
      }
    }
  },

  init() {
    document.getElementById('dash-period')?.addEventListener('change', () => this.render());
    document.getElementById('btn-refresh-dashboard')?.addEventListener('click', () => this.load());
  },
};

function stLabel(i) {
  const st = Utils.stockStatus(i.quantity, i.reorderLevel);
  return st === 'out' ? 'Out of stock' : 'Low stock';
}

window.Dashboard = Dashboard;
