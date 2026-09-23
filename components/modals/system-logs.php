<div id="modal-system-logs" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-system-logs-title">
  <div class="modal-panel max-w-4xl">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <h2 id="modal-system-logs-title" class="text-base font-semibold text-slate-900">System logs</h2>
        <p class="text-xs text-slate-500 mt-0.5">Every admin action recorded in the system</p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-system-logs" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
      <input id="syslog-search" type="search" class="form-input w-40 sm:w-52" placeholder="Search…">
      <select id="syslog-period" class="form-input w-auto">
        <option value="TODAY">Today</option>
        <option value="WEEK">This week</option>
        <option value="MONTH" selected>This month</option>
        <option value="ALL">All time</option>
      </select>
      <select id="syslog-action" class="form-input w-auto max-w-[10rem]">
        <option value="">All actions</option>
      </select>
<span id="syslog-count" class="text-xs text-slate-400"></span>
    </div>
    <div class="p-0 max-h-[28rem] overflow-y-auto">
      <table class="data-table text-sm">
        <thead class="sticky top-0 bg-slate-50 z-10">
          <tr>
            <th>When</th>
            <th>Action</th>
            <th>Details</th>
            <th>Admin</th>
            <th>Ref / Item</th>
          </tr>
        </thead>
        <tbody id="syslog-tbody">
          <tr><td colspan="5" class="text-center text-slate-400 py-8">Loading…</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
