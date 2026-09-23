<div id="modal-delivery" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-delivery-title">
  <div class="modal-panel max-w-2xl">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <h2 id="modal-delivery-title" class="text-base font-semibold text-slate-900">Receive Delivery</h2>
        <p class="text-xs text-slate-500 mt-0.5">Stock increases. Duplicate references are blocked.</p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-delivery" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-5 space-y-4">
      <!-- Mode tabs -->
      <div class="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button type="button" id="del-mode-mrr" class="del-mode-btn flex-1 rounded-md px-3 py-1.5 text-sm font-medium bg-white shadow-sm text-slate-900" data-mode="mrr">MRR (ERP)</button>
        <button type="button" id="del-mode-manual" class="del-mode-btn flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600" data-mode="manual">Manual</button>
        <button type="button" id="del-mode-lines" class="del-mode-btn flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600" data-mode="lines">Multi-line</button>
      </div>

      <div>
        <label class="form-label" for="del-ref">Reference / MRR number</label>
        <div class="flex gap-2">
          <input id="del-ref" type="text" class="form-input font-mono uppercase flex-1" placeholder="Reference / MRR number" autocomplete="off">
          <button id="btn-search-mrr" type="button" class="btn btn-secondary whitespace-nowrap">Search MRR</button>
        </div>
      </div>

      <!-- MRR preview lines -->
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

      <!-- Manual single -->
      <div id="del-manual-panel" class="hidden space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="form-label" for="del-item">Toner / Item code</label>
            <select id="del-item" class="form-input">
              <option value="">Select toner…</option>
            </select>
          </div>
          <div>
            <label class="form-label" for="del-qty">Quantity</label>
            <input id="del-qty" type="number" min="1" step="1" class="form-input" value="1">
          </div>
        </div>
        <div>
          <label class="form-label" for="del-date">Delivery date</label>
          <input id="del-date" type="date" class="form-input">
        </div>
      </div>

      <!-- Multi-line editor -->
      <div id="del-lines-panel" class="hidden space-y-2">
        <div class="flex items-center justify-between">
          <p class="text-xs font-medium text-slate-600">Delivery lines</p>
          <button type="button" id="btn-add-del-line" class="btn btn-secondary btn-sm">+ Add line</button>
        </div>
        <div id="del-lines-list" class="space-y-2"></div>
      </div>

      <div>
        <label class="form-label" for="del-supplier">Supplier</label>
        <div class="flex gap-2">
          <select id="del-supplier" class="form-input flex-1">
            <option value="">— Optional —</option>
          </select>
          <input id="del-supplier-other" type="text" class="form-input flex-1 hidden" placeholder="Or type supplier name">
        </div>
        <p class="text-[11px] text-slate-400 mt-1">Managed under Masters. You can also type a free-text name.</p>
      </div>

      <p id="del-msg" class="text-sm hidden"></p>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn btn-secondary modal-close" data-close="modal-delivery">Cancel</button>
        <button id="btn-record-delivery" type="button" class="btn btn-primary">Record Delivery</button>
      </div>
    </div>
  </div>
</div>
