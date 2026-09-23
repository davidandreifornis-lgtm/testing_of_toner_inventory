/**
 * Mail log + system activity logs (dashboard modals).
 */
const Logs = {
  formatWhen(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso).slice(0, 19);
      return d.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(iso).slice(0, 19);
    }
  },

  // —— Mail log ——
  async loadMailLog() {
    const list = document.getElementById('mail-log-list');
    const countEl = document.getElementById('mail-log-count');
    if (list) list.innerHTML = '<div class="empty-state py-6"><p class="text-sm text-slate-400">Loading…</p></div>';
    try {
      const res = await API.get('/mail_log.php', { limit: 80 });
      const entries = res.entries || [];
      if (countEl) countEl.textContent = `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`;
      if (!entries.length) {
        if (list) {
          list.innerHTML = `<div class="empty-state py-8"><p class="text-sm">No mail log entries yet.${res.exists === false ? ' (storage/mail.log not found)' : ''}</p></div>`;
        }
        return;
      }
      if (list) {
        list.innerHTML = entries
          .map((e) => {
            const ok = e.ok !== false;
            const badge = ok
              ? '<span class="badge badge-in">OK</span>'
              : '<span class="badge badge-out">Failed</span>';
            return `
            <div class="rounded-lg border border-slate-200 bg-white p-3">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div class="text-xs text-slate-500">${Utils.escapeHtml(this.formatWhen(e.loggedAt))}</div>
                ${badge}
              </div>
              <div class="text-sm font-medium text-slate-800">${Utils.escapeHtml(e.subject || 'System mail')}</div>
              <div class="text-xs text-slate-500 mt-0.5">
                ${e.to ? 'To: ' + Utils.escapeHtml(e.to) : ''}
                ${e.driver ? ' · ' + Utils.escapeHtml(e.driver) : ''}
              </div>
              <pre class="mt-2 text-[11px] text-slate-600 whitespace-pre-wrap break-words max-h-24 overflow-y-auto bg-slate-50 rounded p-2 border border-slate-100">${Utils.escapeHtml(e.bodyPreview || e.meta || '')}</pre>
            </div>`;
          })
          .join('');
      }
    } catch (err) {
      if (list) {
        list.innerHTML = `<div class="empty-state py-8"><p class="text-sm text-rose-600">${Utils.escapeHtml(err.message)}</p></div>`;
      }
      if (countEl) countEl.textContent = '';
    }
  },

  openMailLog() {
    Modals.open('modal-mail-log');
    this.loadMailLog();
  },

  // —— System logs ——
  async loadSystemLogs() {
    const tbody = document.getElementById('syslog-tbody');
    const countEl = document.getElementById('syslog-count');
    const period = document.getElementById('syslog-period')?.value || 'MONTH';
    const q = document.getElementById('syslog-search')?.value || '';
    const action = document.getElementById('syslog-action')?.value || '';

    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-slate-400 py-8">Loading…</td></tr>';
    }

    try {
      const res = await API.get('/logs.php', {
        limit: 200,
        period,
        q,
        action,
      });
      const logs = res.logs || [];
      if (countEl) countEl.textContent = `${logs.length} record${logs.length === 1 ? '' : 's'}`;

      // Populate action filter once
      const actionSel = document.getElementById('syslog-action');
      if (actionSel && res.meta?.actions?.length && actionSel.options.length <= 1) {
        res.meta.actions.forEach((a) => {
          if (!a.key) return;
          const opt = document.createElement('option');
          opt.value = a.key;
          opt.textContent = a.label || a.key;
          actionSel.appendChild(opt);
        });
      }

      if (!logs.length) {
        if (tbody) {
          tbody.innerHTML =
            '<tr><td colspan="5" class="empty-state py-10"><p class="text-sm">No system log entries for this filter.</p></td></tr>';
        }
        return;
      }

      if (tbody) {
        tbody.innerHTML = logs
          .map((row) => {
            const refItem = [row.referenceNumber, row.itemCode].filter(Boolean).join(' · ');
            const admin = row.actorName || row.actorUsername || '—';
            return `
            <tr>
              <td class="whitespace-nowrap text-xs text-slate-500">${Utils.escapeHtml(this.formatWhen(row.createdAt))}</td>
              <td>
                <div class="font-medium text-slate-800">${Utils.escapeHtml(row.actionLabel || row.actionKey)}</div>
                <div class="text-[10px] text-slate-400 font-mono">${Utils.escapeHtml(row.actionKey)}</div>
              </td>
              <td class="text-xs text-slate-600 max-w-[14rem]">${Utils.escapeHtml(row.details || '—')}</td>
              <td class="text-xs">${Utils.escapeHtml(admin)}</td>
              <td class="text-xs font-mono text-slate-600">${Utils.escapeHtml(refItem || '—')}</td>
            </tr>`;
          })
          .join('');
      }
    } catch (err) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-rose-600 py-8">${Utils.escapeHtml(err.message)}</td></tr>`;
      }
      if (countEl) countEl.textContent = '';
    }
  },

  openSystemLogs() {
    Modals.open('modal-system-logs');
    this.loadSystemLogs();
  },

  init() {
    document.getElementById('btn-open-mail-log')?.addEventListener('click', () => this.openMailLog());
    document.getElementById('btn-open-system-logs')?.addEventListener('click', () => this.openSystemLogs());
    document.getElementById('syslog-period')?.addEventListener('change', () => this.loadSystemLogs());
    document.getElementById('syslog-action')?.addEventListener('change', () => this.loadSystemLogs());
    document.getElementById('syslog-search')?.addEventListener(
      'input',
      Utils.debounce(() => this.loadSystemLogs(), 300)
    );
  },
};

window.Logs = Logs;
