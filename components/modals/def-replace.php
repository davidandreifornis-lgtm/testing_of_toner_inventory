<div id="modal-def-replace" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="def-replace-title">
  <div class="modal-panel max-w-md">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <div>
        <h2 id="def-replace-title" class="text-sm font-semibold text-slate-900">Receive replacement</h2>
        <p class="text-xs text-slate-500 mt-0.5">Adds <strong>+1</strong> to stock and closes the defective ticket.</p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-def-replace" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-4 space-y-3">
      <p class="text-sm text-slate-600">Reference: <span id="def-replace-ref" class="font-mono font-semibold text-slate-900"></span>
        · Item: <span id="def-replace-code" class="font-mono"></span></p>
      <div>
        <label class="form-label" for="def-replace-accepted-by">Accepted by</label>
        <select id="def-replace-accepted-by" class="form-input">
          <option value="">Select user…</option>
        </select>
      </div>
      <p id="def-replace-msg" class="text-sm hidden"></p>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn btn-secondary modal-close" data-close="modal-def-replace">Cancel</button>
        <button type="button" id="btn-confirm-def-replace" class="btn btn-success">Confirm &amp; add to stock</button>
      </div>
    </div>
  </div>
</div>
