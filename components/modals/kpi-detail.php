<div id="modal-kpi-detail" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-kpi-detail-title">
  <div class="modal-panel max-w-4xl w-full">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <div>
        <h2 id="modal-kpi-detail-title" class="text-sm font-semibold text-slate-900">Details</h2>
        <p id="modal-kpi-detail-sub" class="text-[11px] text-slate-500 mt-0.5"></p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-kpi-detail" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-3 space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <input id="kpi-detail-search" type="search" class="form-input w-full sm:w-56" placeholder="Search…">
        <span id="kpi-detail-count" class="text-xs text-slate-500"></span>
      </div>
      <div class="table-wrap overflow-auto max-h-[min(60vh,28rem)]">
        <table class="data-table text-sm">
          <thead id="kpi-detail-thead"></thead>
          <tbody id="kpi-detail-tbody">
            <tr><td class="text-center text-slate-400 py-6">—</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
