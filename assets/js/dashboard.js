/**
 * Dashboard KPIs and charts — data from API / database only.
 * Each KPI is clickable and opens a detail table of the underlying rows.
 */
const Dashboard = {
  inventory: [],
  transactions: [],
  departments: [],
  detailRows: [],
  detailKind: null,

  async load() {
    try {
      const [invRes, txnRes, locRes] = await Promise.all([
        API.inventory(),
        API.transactions({}),
        API.locations().catch(() => ({ locations: [] })),
      ]);
      this.inventory = invRes.items || [];
      this.transactions = txnRes.transactions || [];
      // Unique departments from location masters (always shown on demand chart)
      const depts = new Set();
      (locRes.locations || locRes.items || []).forEach((l) => {
        const d = String(l.department || l.dept || '').trim().toUpperCase();
        if (d) depts.add(d);
      });
      this.departments = [...depts].sort();
      this.render();
    } catch (err) {
      Notifications.toast(err.message || 'Failed to load dashboard', 'error');
    }
  },

  periodRange() {
    const period = document.getElementById('dash-period')?.value || 'month';
    return Utils.periodRange(period);
  },

  periodLabel() {
    const period = document.getElementById('dash-period')?.value || 'month';
    const map = { today: 'Today', week: 'This week', month: 'This month', all: 'All time' };
    return map[period] || period;
  },

  inPeriod(t) {
    const range = this.periodRange();
    if (!range.from && !range.to) return true;
    const d = (t.date || '').slice(0, 10);
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  },

  codeOf(item) {
    return (item.itemCode || item.inkCode || '').toString();
  },

  render() {
    let skus = this.inventory.length;
    let stock = 0;
    let low = 0;
    let out = 0;
    let inCount = 0;

    this.inventory.forEach((item) => {
      const q = Number(item.quantity) || 0;
      const r = Number(item.reorderLevel) || 0;
      stock += q;
      const st = Utils.stockStatus(q, r);
      if (st === 'out') out++;
      else if (st === 'low') low++;
      else inCount++;
    });

    let delCount = 0;
    let delUnits = 0;
    let relCount = 0;
    let relUnits = 0;
    // Seed every known department with 0 so the chart always lists them
    const deptMap = {};
    (this.departments || []).forEach((d) => {
      deptMap[d] = 0;
    });
    const ticketRefs = new Set();

    this.transactions.filter((t) => this.inPeriod(t)).forEach((t) => {
      const ref = (t.referenceNumber || '').trim();
      const refUp = ref.toUpperCase();
      if (ref) ticketRefs.add(refUp);

      // Stock-card adjustments (ADJ-…) are not real deliveries/releases for KPIs/charts
      const isAdjustment = refUp.startsWith('ADJ-')
        || /stock card adjustment/i.test(String(t.purpose || ''));

      if (t.type === 'RECEIVED') {
        if (isAdjustment) return;
        delCount++;
        delUnits += Number(t.quantity) || 0;
      } else if (t.type === 'RELEASED') {
        if (isAdjustment) return;
        relCount++;
        relUnits += Number(t.quantity) || 0;
        // Only real issuances with a department count toward demand (skip empty → no "Unknown")
        const d = String(t.department || '').trim().toUpperCase();
        if (!d) return;
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
    set('kpi-tickets', ticketRefs.size);
    set('kpi-deliveries-units', delUnits ? `${delUnits} units · click` : 'Click for details');
    set('kpi-releases-units', relUnits ? `${relUnits} units · click` : 'Click for details');
    set('kpi-tickets-sub', this.periodLabel() + ' · click');

    // Show all departments (masters), sorted by demand desc then name; no "Unknown"
    const deptEntries = Object.entries(deptMap)
      .filter(([name]) => name && name.toLowerCase() !== 'unknown')
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    Charts.renderDept(
      deptEntries.map((e) => e[0]),
      deptEntries.map((e) => e[1])
    );
    Charts.renderStatus(inCount, low, out);

    const lowItems = this.inventory.filter((i) => {
      const st = Utils.stockStatus(i.quantity, i.reorderLevel);
      return st === 'low' || st === 'out';
    });
    const alertBox = document.getElementById('dash-low-stock-alert');
    const list = document.getElementById('dash-low-list');
    if (alertBox && list) {
      if (lowItems.length) {
        alertBox.classList.remove('hidden');
        list.innerHTML = lowItems
          .slice(0, 12)
          .map((i) => {
            const st = Utils.stockStatus(i.quantity, i.reorderLevel);
            return `<li><span class="font-mono font-semibold">${Utils.escapeHtml(this.codeOf(i))}</span> — qty ${i.quantity} (${st === 'out' ? 'out' : 'low'})</li>`;
          })
          .join('');
      } else {
        alertBox.classList.add('hidden');
        list.innerHTML = '';
      }
    }
  },

  /** Build detail rows from DB-backed inventory / transactions for a KPI. */
  getDetail(kind) {
    const inv = this.inventory.slice();
    const txns = this.transactions.filter((t) => this.inPeriod(t));
    const period = this.periodLabel();

    if (kind === 'skus') {
      return {
        title: 'Total Toner SKUs',
        sub: `All items in dbo.toner_inventory · ${inv.length} SKU(s)`,
        columns: ['Item code', 'Description', 'Printer', 'Qty', 'Reorder', 'Status', 'Supplier'],
        rows: inv
          .slice()
          .sort((a, b) => this.codeOf(a).localeCompare(this.codeOf(b)))
          .map((i) => {
            const st = Utils.stockStatus(i.quantity, i.reorderLevel);
            return {
              search: `${this.codeOf(i)} ${i.description || ''} ${i.printerModel || ''} ${i.supplier || ''}`,
              cells: [
                this.codeOf(i),
                i.description || '—',
                i.printerModel || '—',
                String(i.quantity ?? 0),
                String(i.reorderLevel ?? 0),
                st === 'out' ? 'Out' : st === 'low' ? 'Low' : 'In stock',
                i.supplier || '—',
              ],
            };
          }),
      };
    }

    if (kind === 'stock') {
      return {
        title: 'Total Stock On-Hand',
        sub: `Quantity by item from dbo.toner_inventory · total ${inv.reduce((s, i) => s + (Number(i.quantity) || 0), 0)} units`,
        columns: ['Item code', 'Description', 'Qty on hand', 'Reorder level', 'Status'],
        rows: inv
          .slice()
          .sort((a, b) => (Number(b.quantity) || 0) - (Number(a.quantity) || 0))
          .map((i) => {
            const st = Utils.stockStatus(i.quantity, i.reorderLevel);
            return {
              search: `${this.codeOf(i)} ${i.description || ''}`,
              cells: [
                this.codeOf(i),
                i.description || '—',
                String(i.quantity ?? 0),
                String(i.reorderLevel ?? 0),
                st === 'out' ? 'Out' : st === 'low' ? 'Low' : 'In stock',
              ],
            };
          }),
      };
    }

    if (kind === 'low') {
      const rows = inv.filter((i) => Utils.stockStatus(i.quantity, i.reorderLevel) === 'low');
      return {
        title: 'Low Stock Items',
        sub: `quantity ≤ reorder level (and &gt; 0) · ${rows.length} item(s)`,
        columns: ['Item code', 'Description', 'Qty', 'Reorder', 'Supplier'],
        rows: rows.map((i) => ({
          search: `${this.codeOf(i)} ${i.description || ''}`,
          cells: [
            this.codeOf(i),
            i.description || '—',
            String(i.quantity ?? 0),
            String(i.reorderLevel ?? 0),
            i.supplier || '—',
          ],
        })),
      };
    }

    if (kind === 'out') {
      const rows = inv.filter((i) => Utils.stockStatus(i.quantity, i.reorderLevel) === 'out');
      return {
        title: 'Out of Stock',
        sub: `quantity ≤ 0 · ${rows.length} item(s)`,
        columns: ['Item code', 'Description', 'Qty', 'Reorder', 'Supplier'],
        rows: rows.map((i) => ({
          search: `${this.codeOf(i)} ${i.description || ''}`,
          cells: [
            this.codeOf(i),
            i.description || '—',
            String(i.quantity ?? 0),
            String(i.reorderLevel ?? 0),
            i.supplier || '—',
          ],
        })),
      };
    }

    if (kind === 'deliveries') {
      const rows = txns.filter((t) => t.type === 'RECEIVED');
      return {
        title: 'Deliveries (period)',
        sub: `${period} · dbo.toner_transactions type RECEIVED · ${rows.length} line(s)`,
        columns: ['Date', 'Reference', 'Item code', 'Qty', 'Supplier', 'Purpose'],
        rows: rows.map((t) => ({
          search: `${t.referenceNumber || ''} ${t.inkCode || ''} ${t.supplier || ''}`,
          cells: [
            Utils.formatDate(t.date),
            t.referenceNumber || '—',
            t.inkCode || '—',
            String(t.quantity ?? 0),
            t.supplier || '—',
            t.purpose || '—',
          ],
        })),
      };
    }

    if (kind === 'releases') {
      const rows = txns.filter((t) => t.type === 'RELEASED');
      return {
        title: 'Releases (period)',
        sub: `${period} · dbo.toner_transactions type RELEASED · ${rows.length} line(s)`,
        columns: ['Date', 'Reference', 'Item code', 'Qty', 'Department', 'Location', 'Issued by'],
        rows: rows.map((t) => ({
          search: `${t.referenceNumber || ''} ${t.inkCode || ''} ${t.department || ''} ${t.location || ''}`,
          cells: [
            Utils.formatDate(t.date),
            t.referenceNumber || '—',
            t.inkCode || '—',
            String(t.quantity ?? 0),
            t.department || '—',
            t.location || '—',
            t.issuedBy || '—',
          ],
        })),
      };
    }

    if (kind === 'tickets') {
      // Unique reference numbers in period across all transaction types
      const byRef = {};
      txns.forEach((t) => {
        const ref = (t.referenceNumber || '').trim().toUpperCase();
        if (!ref) return;
        if (!byRef[ref]) {
          byRef[ref] = {
            referenceNumber: t.referenceNumber,
            types: new Set(),
            items: new Set(),
            qty: 0,
            dates: [],
            departments: new Set(),
          };
        }
        byRef[ref].types.add(t.type || '');
        if (t.inkCode) byRef[ref].items.add(t.inkCode);
        byRef[ref].qty += Number(t.quantity) || 0;
        if (t.date) byRef[ref].dates.push((t.date || '').slice(0, 10));
        if (t.department) byRef[ref].departments.add(t.department);
      });
      const list = Object.values(byRef).sort((a, b) =>
        String(b.dates[0] || '').localeCompare(String(a.dates[0] || ''))
      );
      return {
        title: 'Tickets Processed',
        sub: `${period} · unique reference numbers in dbo.toner_transactions · ${list.length} ticket(s)`,
        columns: ['Reference', 'Type(s)', 'Item(s)', 'Total qty', 'Department(s)', 'Date(s)'],
        rows: list.map((r) => ({
          search: `${r.referenceNumber} ${[...r.items].join(' ')} ${[...r.departments].join(' ')}`,
          cells: [
            r.referenceNumber || '—',
            [...r.types].filter(Boolean).join(', ') || '—',
            [...r.items].join(', ') || '—',
            String(r.qty),
            [...r.departments].join(', ') || '—',
            [...new Set(r.dates)].sort().join(', ') || '—',
          ],
        })),
      };
    }

    return { title: 'Details', sub: '', columns: [], rows: [] };
  },

  openDetail(kind) {
    const data = this.getDetail(kind);
    this.detailKind = kind;
    this.detailRows = data.rows || [];

    const title = document.getElementById('modal-kpi-detail-title');
    const sub = document.getElementById('modal-kpi-detail-sub');
    if (title) title.textContent = data.title;
    if (sub) sub.innerHTML = data.sub;

    const thead = document.getElementById('kpi-detail-thead');
    if (thead) {
      thead.innerHTML =
        '<tr>' +
        (data.columns || []).map((c) => `<th>${Utils.escapeHtml(c)}</th>`).join('') +
        '</tr>';
    }

    const search = document.getElementById('kpi-detail-search');
    if (search) search.value = '';
    this.renderDetailRows('');

    if (window.Modals) Modals.open('modal-kpi-detail');
    else {
      const el = document.getElementById('modal-kpi-detail');
      if (el) {
        el.classList.add('open');
        el.style.display = 'flex';
      }
    }
  },

  renderDetailRows(query) {
    const q = (query || '').trim().toLowerCase();
    const filtered = q
      ? this.detailRows.filter((r) => (r.search || '').toLowerCase().includes(q))
      : this.detailRows;

    const count = document.getElementById('kpi-detail-count');
    if (count) {
      count.textContent = `${filtered.length} row${filtered.length === 1 ? '' : 's'}`;
    }

    const tbody = document.getElementById('kpi-detail-tbody');
    if (!tbody) return;
    if (!filtered.length) {
      tbody.innerHTML =
        '<tr><td colspan="12" class="text-center text-slate-400 py-6">No matching data from the database.</td></tr>';
      return;
    }
    tbody.innerHTML = filtered
      .map(
        (r) =>
          '<tr>' +
          (r.cells || [])
            .map((c, i) => {
              const mono = i === 0 || String(c).match(/^[A-Z0-9._-]{3,}$/);
              return `<td class="${mono ? 'font-mono' : ''}">${Utils.escapeHtml(String(c))}</td>`;
            })
            .join('') +
          '</tr>'
      )
      .join('');
  },

  init() {
    document.getElementById('dash-period')?.addEventListener('change', () => this.render());

    document.querySelectorAll('.kpi-clickable[data-kpi]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.getAttribute('data-kpi');
        if (kind) this.openDetail(kind);
      });
    });

    document.getElementById('kpi-detail-search')?.addEventListener(
      'input',
      Utils.debounce((e) => this.renderDetailRows(e.target.value), 180)
    );
  },
};

window.Dashboard = Dashboard;
