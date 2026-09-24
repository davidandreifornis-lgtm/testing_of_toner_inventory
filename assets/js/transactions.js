/**
 * Transaction history — tabs, search, CSV, detail view,
 * defective stages 2 (send to supplier) & 3 (receive replacement).
 */
const Transactions = {
  all: [],
  tab: 'RECEIVED',
  deptFilter: 'ALL',
  currentDetail: null,
  replaceRef: null,
  replaceCode: null,

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
      this.renderDeptTabs();
      this.render();
    } catch (err) {
      const tbody = document.getElementById('txn-tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-rose-600 py-8">${Utils.escapeHtml(err.message)}</td></tr>`;
      }
    }
  },

  renderDeptTabs() {
    const wrap = document.getElementById('txn-dept-tabs');
    if (!wrap) return;
    const show = this.tab === 'RELEASED' || this.tab === 'DEFECTIVE';
    wrap.classList.toggle('hidden', !show);
    if (!show) {
      this.deptFilter = 'ALL';
      return;
    }
    const depts = new Set();
    this.all.forEach((t) => {
      const d = String(t.department || '').trim();
      if (d) depts.add(d);
    });
    const list = ['ALL', ...[...depts].sort()];
    wrap.innerHTML = list
      .map((d) => {
        const active = this.deptFilter === d;
        const label = d === 'ALL' ? 'All depts' : d;
        return `<button type="button" data-txn-dept="${Utils.escapeHtml(d)}"
          class="txn-dept-tab px-2.5 py-1 text-xs rounded-full border ${
            active
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }">${Utils.escapeHtml(label)}</button>`;
      })
      .join('');
    wrap.querySelectorAll('.txn-dept-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.deptFilter = btn.getAttribute('data-txn-dept') || 'ALL';
        this.renderDeptTabs();
        this.render();
      });
    });
  },

  filtered() {
    const q = (document.getElementById('txn-search')?.value || '').trim().toLowerCase();
    return this.all.filter((t) => {
      if (this.deptFilter && this.deptFilter !== 'ALL') {
        if (String(t.department || '').trim() !== this.deptFilter) return false;
      }
      if (!q) return true;
      const ref = (t.referenceNumber || '').toLowerCase();
      const code = (t.inkCode || '').toLowerCase();
      const dept = (t.department || '').toLowerCase();
      return ref.includes(q) || code.includes(q) || dept.includes(q);
    });
  },

  statusBadge(t) {
    const st = String(t.status || '').toUpperCase();
    if (t.type === 'DEFECTIVE' || t.defective) {
      if (st === 'REPLACED') return '<span class="badge badge-in">REPLACED</span>';
      if (st === 'SENT_TO_SUPPLIER') return '<span class="badge badge-low">SENT</span>';
      return '<span class="badge badge-defective">DEFECTIVE</span>';
    }
    return '';
  },

  render() {
    const tbody = document.getElementById('txn-tbody');
    if (!tbody) return;
    const rows = this.filtered();
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state py-10"><p class="text-sm">No transactions found.</p></td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map((t, idx) => {
        let details = '';
        if (t.type === 'RECEIVED') {
          details = t.supplier ? `Supplier: ${t.supplier}` : t.purpose || '';
        } else if (t.type === 'RELEASED') {
          details = [t.department, t.location].filter(Boolean).join(' / ');
          if (t.defective) details += ' · Defective';
        } else {
          details = [t.department, t.location].filter(Boolean).join(' / ') || t.purpose || '';
        }
        return `
        <tr>
          <td class="font-mono text-xs font-semibold">${Utils.escapeHtml(t.referenceNumber)}</td>
          <td>${Utils.escapeHtml(t.type)} ${this.statusBadge(t)}</td>
          <td class="font-mono text-xs">${Utils.escapeHtml(t.inkCode)}</td>
          <td>${t.quantity}</td>
          <td>${Utils.escapeHtml(t.date)}</td>
          <td class="text-xs text-slate-600 max-w-[14rem] truncate">${Utils.escapeHtml(details)}</td>
          <td class="text-right">
            <button type="button" class="btn btn-secondary btn-sm btn-txn-view" data-idx="${idx}">View</button>
          </td>
        </tr>`;
      })
      .join('');

    // Map idx to filtered rows
    const filtered = rows;
    tbody.querySelectorAll('.btn-txn-view').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.getAttribute('data-idx'));
        this.openDetail(filtered[i]);
      });
    });
  },

  openDetail(t) {
    if (!t) return;
    this.currentDetail = t;
    const title = document.getElementById('txn-detail-title');
    const sub = document.getElementById('txn-detail-subtitle');
    const body = document.getElementById('txn-detail-body');
    const actions = document.getElementById('txn-detail-actions');
    const msg = document.getElementById('txn-detail-msg');
    if (msg) msg.classList.add('hidden');

    if (title) title.textContent = t.type + ' · ' + (t.referenceNumber || '');
    if (sub) sub.textContent = t.txnCode || t.id || '';

    const rows = [
      ['Reference', t.referenceNumber],
      ['Type', t.type],
      ['Status', t.status || 'RECORDED'],
      ['Item code', t.inkCode],
      ['Quantity', t.quantity],
      ['Date', t.date],
      ['Department', t.department],
      ['Location', t.location],
      ['Printer', t.locationPrinter],
      ['Supplier', t.supplier],
      ['Issued by', t.issuedBy],
      ['Recorded by', t.recordedBy],
      ['Purpose', t.purpose],
      ['Yield', t.actualYield != null ? t.actualYield : ''],
      ['Defective notes', t.defectiveNotes],
    ];
    if (body) {
      body.innerHTML = rows
        .filter(([, v]) => v !== '' && v != null)
        .map(
          ([k, v]) =>
            `<div><dt class="text-xs text-slate-500">${Utils.escapeHtml(k)}</dt>
             <dd class="font-medium text-slate-900 break-words">${Utils.escapeHtml(String(v))}</dd></div>`
        )
        .join('');
    }

    // Defective workflow buttons (stages 2 & 3)
    const sendBtn = document.getElementById('btn-def-send-supplier');
    const recvBtn = document.getElementById('btn-def-recv-replace');
    if (sendBtn) sendBtn.classList.add('hidden');
    if (recvBtn) recvBtn.classList.add('hidden');
    if (actions) actions.classList.add('hidden');

    const isDefectiveType = t.type === 'DEFECTIVE' || !!t.defective;
    if (isDefectiveType && actions) {
      const st = String(t.status || 'DEFECTIVE').toUpperCase();
      actions.classList.remove('hidden');
      if (st === 'DEFECTIVE' || st === 'RECORDED' || st === '') {
        sendBtn?.classList.remove('hidden');
      } else if (st === 'SENT_TO_SUPPLIER') {
        recvBtn?.classList.remove('hidden');
      }
      // REPLACED → no action buttons
    }

    Modals.open('modal-txn-detail');
  },

  async sendToSupplier() {
    const t = this.currentDetail;
    if (!t) return;
    const ref = String(t.referenceNumber || '').trim().toUpperCase();
    const ok = await Modals.confirm(
      `Mark ${ref} as sent to supplier? Stock will not change.`,
      { title: 'Send to supplier', okLabel: 'Send', danger: false }
    );
    if (!ok) return;
    const msg = document.getElementById('txn-detail-msg');
    try {
      const res = await API.defective({
        action: 'send_to_supplier',
        referenceNumber: ref,
      });
      if (msg) {
        msg.textContent = res.message || 'Sent to supplier.';
        msg.className = 'text-sm text-emerald-700';
        msg.classList.remove('hidden');
      }
      Notifications.toast('Sent to supplier: ' + ref, 'success');
      await this.load();
      // Refresh detail from reloaded data
      const updated = this.all.find(
        (x) =>
          String(x.referenceNumber || '').toUpperCase() === ref &&
          (x.type === 'DEFECTIVE' || x.defective)
      );
      if (updated) this.openDetail(updated);
    } catch (err) {
      if (msg) {
        msg.textContent = err.message;
        msg.className = 'text-sm text-rose-700';
        msg.classList.remove('hidden');
      }
      Notifications.toast(err.message, 'error');
    }
  },

  async openReplaceModal() {
    const t = this.currentDetail;
    if (!t) return;
    this.replaceRef = String(t.referenceNumber || '').trim().toUpperCase();
    this.replaceCode = t.inkCode || '';
    document.getElementById('def-replace-ref').textContent = this.replaceRef;
    document.getElementById('def-replace-code').textContent = this.replaceCode;
    const msg = document.getElementById('def-replace-msg');
    if (msg) msg.classList.add('hidden');

    // Populate accepted-by from users
    const sel = document.getElementById('def-replace-accepted-by');
    if (sel) {
      sel.innerHTML = '<option value="">Select user…</option>';
      try {
        const res = await API.get('/users.php');
        (res.users || [])
          .filter((u) => u.isActive !== false)
          .forEach((u) => {
            const label = u.fullName ? `${u.fullName} (${u.username})` : u.username;
            sel.innerHTML += `<option value="${Utils.escapeHtml(u.username)}">${Utils.escapeHtml(label)}</option>`;
          });
      } catch {
        /* ignore */
      }
    }

    Modals.close('modal-txn-detail');
    Modals.open('modal-def-replace');
  },

  async confirmReplace() {
    const ref = this.replaceRef;
    const acceptedBy = (document.getElementById('def-replace-accepted-by')?.value || '').trim();
    const msg = document.getElementById('def-replace-msg');
    if (!ref) return;
    if (!acceptedBy) {
      if (msg) {
        msg.textContent = 'Select who accepted the replacement.';
        msg.className = 'text-sm text-rose-700';
        msg.classList.remove('hidden');
      }
      return;
    }
    const btn = document.getElementById('btn-confirm-def-replace');
    if (btn) btn.disabled = true;
    try {
      const res = await API.defective({
        action: 'receive_replacement',
        referenceNumber: ref,
        acceptedBy,
      });
      Notifications.toast(res.message || 'Replacement received (+1 stock)', 'success');
      Modals.close('modal-def-replace');
      await this.load();
      if (window.Inventory) Inventory.load?.();
      if (window.Dashboard) Dashboard.load?.();
    } catch (err) {
      if (msg) {
        msg.textContent = err.message;
        msg.className = 'text-sm text-rose-700';
        msg.classList.remove('hidden');
      }
      Notifications.toast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  exportCsv() {
    const rows = this.filtered();
    if (!rows.length) {
      Notifications.toast('Nothing to export', 'warning');
      return;
    }
    const headers = [
      'referenceNumber',
      'type',
      'status',
      'inkCode',
      'quantity',
      'date',
      'department',
      'location',
      'supplier',
      'purpose',
    ];
    const lines = [headers.join(',')];
    rows.forEach((t) => {
      lines.push(
        headers
          .map((h) => {
            const v = t[h] != null ? String(t[h]) : '';
            return `"${v.replace(/"/g, '""')}"`;
          })
          .join(',')
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `toner-transactions-${Utils.today()}.csv`;
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
        this.deptFilter = 'ALL';
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

    document.getElementById('btn-def-send-supplier')?.addEventListener('click', () => this.sendToSupplier());
    document.getElementById('btn-def-recv-replace')?.addEventListener('click', () => this.openReplaceModal());
    document.getElementById('btn-confirm-def-replace')?.addEventListener('click', () => this.confirmReplace());
  },
};

window.Transactions = Transactions;
