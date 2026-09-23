<div id="modal-release" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-release-title">
  <div class="modal-panel max-w-lg">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <h2 id="modal-release-title" class="text-base font-semibold text-slate-900">Stock Issuance</h2>
        <p class="text-xs text-slate-500 mt-0.5">One unit per ticket. Date is today. Stock decreases by 1.</p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-release" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-5 space-y-4">
      <div>
        <label class="form-label" for="rel-ref">Issuance reference number</label>
        <input id="rel-ref" type="text" class="form-input font-mono uppercase" placeholder="e.g. REL-2026-00451" autocomplete="off">
      </div>
      <div>
        <label class="form-label" for="rel-item">Toner / Item code</label>
        <select id="rel-item" class="form-input">
          <option value="">Select toner…</option>
        </select>
        <p id="rel-stock-hint" class="text-xs text-slate-400 mt-1"></p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="form-label" for="rel-dept">Department</label>
          <select id="rel-dept" class="form-input">
            <option value="">Select department…</option>
          </select>
        </div>
        <div>
          <label class="form-label" for="rel-location">Location</label>
          <select id="rel-location" class="form-input">
            <option value="">Select location…</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="form-label" for="rel-printer">Location printer</label>
          <input id="rel-printer" type="text" class="form-input" placeholder="Optional — auto-fills from location">
        </div>
        <div>
          <label class="form-label" for="rel-yield">Actual yield</label>
          <input id="rel-yield" type="number" min="0" step="1" class="form-input" placeholder="Optional">
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="form-label" for="rel-date">Date</label>
          <input id="rel-date" type="date" class="form-input bg-slate-50" readonly>
        </div>
        <div>
          <label class="form-label" for="rel-issued-by">Issued by</label>
          <input id="rel-issued-by" type="text" class="form-input" placeholder="Optional">
        </div>
      </div>
      <p id="rel-msg" class="text-sm hidden"></p>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn btn-secondary modal-close" data-close="modal-release">Cancel</button>
        <button id="btn-record-release" type="button" class="btn btn-success">Record Issuance</button>
      </div>
    </div>
  </div>
</div>
