<div id="modal-delivery" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-delivery-title">
  <div class="modal-panel max-w-lg">
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
      <div>
        <label class="form-label" for="del-ref">Reference / MRR number</label>
        <input id="del-ref" type="text" class="form-input font-mono uppercase" placeholder="e.g. MG009105 or DEL-2026-00125" autocomplete="off">
      </div>
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
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="form-label" for="del-date">Delivery date</label>
          <input id="del-date" type="date" class="form-input">
        </div>
        <div>
          <label class="form-label" for="del-supplier">Supplier</label>
          <input id="del-supplier" type="text" class="form-input" placeholder="Optional">
        </div>
      </div>
      <p id="del-msg" class="text-sm hidden"></p>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn btn-secondary modal-close" data-close="modal-delivery">Cancel</button>
        <button id="btn-record-delivery" type="button" class="btn btn-primary">Record Delivery</button>
      </div>
    </div>
  </div>
</div>
