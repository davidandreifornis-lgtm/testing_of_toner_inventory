<div id="modal-release" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-release-title">
  <div class="modal-panel max-w-lg">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <div>
        <h2 id="modal-release-title" class="text-sm font-semibold text-slate-900">Stock Issuance</h2>
        <p class="text-xs text-slate-500 mt-0.5">One unit per ticket. Date is today. Stock decreases by 1.</p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-release" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-4 space-y-3">
      <div>
        <label class="form-label" for="rel-ref">Issuance reference number</label>
        <input id="rel-ref" type="text" class="form-input font-mono uppercase" placeholder="Issuance reference" autocomplete="off">
      </div>
      <div>
        <label class="form-label" for="rel-item">Toner / Item code</label>
        <select id="rel-item" class="form-input">
          <option value="">Select toner…</option>
        </select>
        <p id="rel-stock-hint" class="text-xs text-slate-400 mt-0.5"></p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="form-label" for="rel-printer">Printer assigned</label>
          <select id="rel-printer" class="form-input">
            <option value="">Select printer…</option>
          </select>
        </div>
        <div>
          <label class="form-label" for="rel-issued-by">Issued by</label>
          <select id="rel-issued-by" class="form-input">
            <option value="">Select user…</option>
          </select>
        </div>
      </div>
      <div>
        <label class="form-label" for="rel-date">Date</label>
        <input id="rel-date" type="date" class="form-input bg-slate-50" readonly>
      </div>
      <div class="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 space-y-2">
        <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input id="rel-yield-enable" type="checkbox" class="rounded border-slate-300">
          <span>Record actual yield</span>
        </label>
        <p class="text-[11px] text-slate-500">Only for printers that report yield. Leave unchecked if not applicable.</p>
        <div id="rel-yield-wrap" class="hidden">
          <label class="form-label" for="rel-yield">Actual yield</label>
          <input id="rel-yield" type="number" min="0" step="1" class="form-input" placeholder="Yield value">
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
