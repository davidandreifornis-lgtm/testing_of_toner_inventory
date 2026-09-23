<div id="modal-delivery" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-delivery-title">
  <div class="modal-panel max-w-2xl">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <div>
        <h2 id="modal-delivery-title" class="text-sm font-semibold text-slate-900">Receive Delivery</h2>
        <p class="text-xs text-slate-500 mt-0.5">Enter MRR number, search ERP lines, then record. Stock increases. Duplicates are blocked.</p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-delivery" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-4 space-y-3">
      <div>
        <label class="form-label" for="del-ref">MRR number</label>
        <div class="flex gap-2">
          <input id="del-ref" type="text" class="form-input font-mono uppercase flex-1" placeholder="MRR number" autocomplete="off">
          <button id="btn-search-mrr" type="button" class="btn btn-secondary whitespace-nowrap">Search MRR</button>
        </div>
      </div>

      <div id="del-mrr-panel" class="hidden space-y-2">
        <div class="flex items-center justify-between">
          <p class="text-xs font-medium text-slate-600">ERP lines</p>
          <span id="del-mrr-count" class="text-xs text-slate-400"></span>
        </div>
        <div class="table-wrap max-h-48 overflow-auto">
          <table class="data-table text-xs">
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th class="text-right">Qty</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody id="del-mrr-lines"></tbody>
          </table>
        </div>
        <p id="del-mrr-warning" class="text-xs text-amber-700 hidden"></p>
      </div>

      <p id="del-msg" class="text-sm hidden"></p>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn btn-secondary modal-close" data-close="modal-delivery">Cancel</button>
        <button id="btn-record-delivery" type="button" class="btn btn-primary">Record Delivery</button>
      </div>
    </div>
  </div>
</div>
