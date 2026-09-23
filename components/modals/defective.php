<div id="modal-defective" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-defective-title">
  <div class="modal-panel max-w-md">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <h2 id="modal-defective-title" class="text-base font-semibold text-slate-900">Defective Workflow</h2>
        <p class="text-xs text-slate-500 mt-0.5">Flag → send to supplier → receive replacement</p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-defective" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-5 space-y-4">
      <div class="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button type="button" class="def-action-btn flex-1 rounded-md px-2 py-1.5 text-xs font-medium bg-white shadow-sm text-slate-900" data-action="flag">Flag</button>
        <button type="button" class="def-action-btn flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600" data-action="send_to_supplier">Send to supplier</button>
        <button type="button" class="def-action-btn flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600" data-action="receive_replacement">Receive replacement</button>
      </div>

      <div>
        <label class="form-label" for="def-ref">Issuance / defective reference</label>
        <input id="def-ref" type="text" class="form-input font-mono uppercase" placeholder="Reference of the original issuance" autocomplete="off">
      </div>

      <div id="def-notes-wrap">
        <label class="form-label" for="def-notes">Notes (optional)</label>
        <textarea id="def-notes" class="form-input" rows="2" placeholder="Reason or details"></textarea>
      </div>

      <div id="def-accepted-wrap" class="hidden">
        <label class="form-label" for="def-accepted-by">Accepted by</label>
        <input id="def-accepted-by" type="text" class="form-input" placeholder="Who accepted the replacement">
        <p class="text-[11px] text-slate-400 mt-1">Receiving a replacement <strong>increases</strong> usable stock by 1.</p>
      </div>

      <div id="def-action-hint" class="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
        Flag an already issued ticket as defective. Usable stock is <strong>not</strong> restored.
      </div>

      <p id="def-msg" class="text-sm hidden"></p>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn btn-secondary modal-close" data-close="modal-defective">Cancel</button>
        <button id="btn-flag-defective" type="button" class="btn btn-danger">Flag as Defective</button>
      </div>
    </div>
  </div>
</div>
