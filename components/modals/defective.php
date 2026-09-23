<div id="modal-defective" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-defective-title">
  <div class="modal-panel max-w-md">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <h2 id="modal-defective-title" class="text-base font-semibold text-slate-900">Return Defective</h2>
        <p class="text-xs text-slate-500 mt-0.5">Usable stock is <strong>not</strong> restored.</p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-defective" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-5 space-y-4">
      <div>
        <label class="form-label" for="def-ref">Issuance reference number</label>
        <input id="def-ref" type="text" class="form-input font-mono uppercase" placeholder="Reference of the original issuance" autocomplete="off">
      </div>
      <div>
        <label class="form-label" for="def-notes">Notes (optional)</label>
        <textarea id="def-notes" class="form-input" rows="2" placeholder="Reason or details"></textarea>
      </div>
      <p id="def-msg" class="text-sm hidden"></p>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn btn-secondary modal-close" data-close="modal-defective">Cancel</button>
        <button id="btn-flag-defective" type="button" class="btn btn-danger">Flag as Defective</button>
      </div>
    </div>
  </div>
</div>
