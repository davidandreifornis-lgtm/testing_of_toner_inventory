<div id="modal-stock-card" class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal-panel max-w-3xl">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <h2 id="sc-title" class="text-base font-semibold text-slate-900">Stock Card</h2>
        <p id="sc-subtitle" class="text-xs text-slate-500 mt-0.5"></p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-stock-card" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="px-5 py-3 grid grid-cols-3 gap-3 text-center border-b border-slate-100">
      <div>
        <div class="text-xs text-slate-500">On hand</div>
        <div id="sc-qty" class="text-lg font-bold">—</div>
      </div>
      <div>
        <div class="text-xs text-slate-500">Reorder level</div>
        <div id="sc-reorder" class="text-lg font-bold">—</div>
      </div>
      <div>
        <div class="text-xs text-slate-500">Status</div>
        <div id="sc-status" class="mt-1"></div>
      </div>
    </div>
    <div class="p-4 max-h-80 overflow-y-auto">
      <table class="data-table text-sm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Ref</th>
            <th class="text-right">In</th>
            <th class="text-right">Out</th>
            <th class="text-right">Balance</th>
          </tr>
        </thead>
        <tbody id="sc-tbody"></tbody>
      </table>
      <div id="sc-empty" class="empty-state hidden py-6">
        <p class="text-sm">No movements for this item.</p>
      </div>
    </div>
  </div>
</div>
