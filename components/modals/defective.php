<div id="modal-defective" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-defective-title">
  <div class="modal-panel max-w-md">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <div>
        <h2 id="modal-defective-title" class="text-sm font-semibold text-slate-900">Return Defective</h2>
        <p class="text-xs text-slate-500 mt-0.5">Search the issuance ticket first, then flag it. Usable stock is <strong>not</strong> restored.</p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-defective" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-4 space-y-3">
      <!-- Step 1: search -->
      <div>
        <label class="form-label" for="def-ref">Issuance reference number</label>
        <div class="flex gap-2">
          <input id="def-ref" type="text" class="form-input font-mono uppercase flex-1" placeholder="e.g. AMEC-000013" autocomplete="off">
          <button type="button" id="btn-search-defective" class="btn btn-secondary shrink-0">Search</button>
        </div>
      </div>

      <!-- Preview after successful search -->
      <div id="def-preview" class="hidden rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1.5">
        <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Issuance found</div>
        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-800">
          <div><span class="text-slate-500">Reference</span><br><span id="def-prev-ref" class="font-mono font-semibold"></span></div>
          <div><span class="text-slate-500">Toner</span><br><span id="def-prev-toner" class="font-mono"></span></div>
          <div><span class="text-slate-500">Department</span><br><span id="def-prev-dept"></span></div>
          <div><span class="text-slate-500">Location</span><br><span id="def-prev-loc"></span></div>
          <div><span class="text-slate-500">Date</span><br><span id="def-prev-date"></span></div>
          <div><span class="text-slate-500">Qty</span><br><span id="def-prev-qty"></span></div>
        </div>
      </div>

      <div id="def-notes-wrap" class="hidden">
        <label class="form-label" for="def-notes">Notes (optional)</label>
        <textarea id="def-notes" class="form-input" rows="2" placeholder="Reason or details"></textarea>
      </div>

      <p id="def-msg" class="text-sm hidden"></p>

      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn btn-secondary modal-close" data-close="modal-defective">Cancel</button>
        <button id="btn-flag-defective" type="button" class="btn btn-danger" disabled>Flag as Defective</button>
      </div>
    </div>
  </div>
</div>
