/**
 * Transaction history — filter, search, CSV export. Backend filtering preferred.
 */
const Transactions = {
  all: [],
  tab: 'RECEIVED',

  async load() {
    const period = document.getElementById('txn-period')?.value || 'month';
    let from = '';
    let to = '';
    if (period === 'custom') {
      from = document.getElementById('txn-from')?.value || '';
      to = document.getElementById('txn-to')?.value || '';
    } else if (period !== 'all') {
      const r = Utils.periodRange(period);
      from = r.from;
      to = r.to;
    }

    const params = {};
    if (this.tab) params.type = this.tab;
    if (from) params.from = from;
    if (to) params.to = to;

    try {
      const res = await API.transactions(params);
      this.all = res.transactions || [];
      this.render();
    } catch (err) {
      const tbody = document.getElementById('txn-tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-rose-600 py-8">${Utils.escapeHtml(err.message)}</td></tr>`;
      }
    }
  },

  filtered() {
    const q = (document.getElementById('txn-search')?.value || '').trim().toLowerCase();
    if (!q) return this.all;
    return this.all.filter((t) => {
      const ref = (t.referenceNumber || '').toLowerCase();
      const code = (t.inkCode || '').toLowerCase();
      const dept = (t.department || '').toLowerCase();
      return ref.includes(q) || code.includes(q) || dept.includes(q);
    });
  },

  render() {
    const tbody = document.getElementById('txn-tbody');
    if (!tbody) return;
    const rows = this.filtered();
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state py-10"><p class="text-sm">No transactions found.</p></td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map((t) => {
        let details = '';
        if (t.type === 'RECEIVED') {
          details = t.supplier ? `Supplier: ${t.supplier}` : t.purpose || '';
        } else if (t.type === 'RELEASED') {
          details = [t.department, t.location].filter(Boolean).join(' / ');
          if (t.defective) details += ' · Defective';
        } else {
          details = t.defectiveNotes || t.purpose || '';
        }
        return `
        <tr>
          <td class="font-mono text-xs font-semibold">${Utils.escapeHtml(t.referenceNumber)}</td>
          <td>${Utils.escapeHtml(t.type)}${t.defective ? ' <span class="badge badge-defective">Def</span>' : ''}</td>
          <td class="font-mono">${Utils.escapeHtml(t.inkCode)}</td>
          <td>${t.quantity}</td>
          <td>${Utils.formatDate(t.date)}</td>
          <td class="text-slate-600 text-xs max-w-[14rem] truncate">${Utils.escapeHtml(details)}</td>
        </tr>`;
      })
      .join('');
  },

  exportCsv() {
    const rows = this.filtered();
    if (!rows.length) {
      Notifications.toast('Nothing to export.', 'info');
      return;
    }
    const headers = ['Reference', 'Type', 'Item', 'Qty', 'Date', 'Department', 'Location', 'Supplier', 'Purpose'];
    const lines = [headers.join(',')];
    rows.forEach((t) => {
      const cells = [
        t.referenceNumber,
        t.type,
        t.inkCode,
        t.quantity,
        t.date,
        t.department || '',
        t.location || '',
        t.supplier || '',
        t.purpose || '',
      ].map((c) => {
        const s = String(c ?? '');
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      });
      lines.push(cells.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transactions-${Utils.today()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  init() {
    document.querySelectorAll('.txn-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.txn-tab').forEach((b) => {
          b.classList.remove('border-slate-900', 'text-slate-900');
          b.classList.add('border-transparent', 'text-slate-500');
        });
        btn.classList.add('border-slate-900', 'text-slate-900');
        btn.classList.remove('border-transparent', 'text-slate-500');
        this.tab = btn.getAttribute('data-txn-tab') || '';
        this.load();
      });
    });

    document.getElementById('txn-period')?.addEventListener('change', () => {
      const period = document.getElementById('txn-period').value;
      const from = document.getElementById('txn-from');
      const to = document.getElementById('txn-to');
      if (period === 'custom') {
        from?.classList.remove('hidden');
        to?.classList.remove('hidden');
      } else {
        from?.classList.add('hidden');
        to?.classList.add('hidden');
      }
      this.load();
    });
    document.getElementById('txn-from')?.addEventListener('change', () => this.load());
    document.getElementById('txn-to')?.addEventListener('change', () => this.load());
    document.getElementById('txn-search')?.addEventListener(
      'input',
      Utils.debounce(() => this.render(), 200)
    );
    document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportCsv());
  },
};

window.Transactions = Transactions;
