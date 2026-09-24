<div id="modal-txn-detail" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="txn-detail-title">
  <div class="modal-panel max-w-lg">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <div>
        <h2 id="txn-detail-title" class="text-sm font-semibold text-slate-900">Transaction detail</h2>
        <p id="txn-detail-subtitle" class="text-xs text-slate-500 mt-0.5"></p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-txn-detail" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-4 space-y-3">
      <dl id="txn-detail-body" class="grid grid-cols-2 gap-x-3 gap-y-2 text-sm"></dl>
      <div id="txn-detail-actions" class="hidden border-t border-slate-100 pt-3 space-y-2">
        <p class="text-xs text-slate-500">Defective workflow</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" id="btn-def-send-supplier" class="btn btn-secondary btn-sm hidden">Send to supplier</button>
          <button type="button" id="btn-def-recv-replace" class="btn btn-success btn-sm hidden">Receive replacement</button>
        </div>
      </div>
      <p id="txn-detail-msg" class="text-sm hidden"></p>
      <div class="flex justify-end pt-1">
        <button type="button" class="btn btn-secondary modal-close" data-close="modal-txn-detail">Close</button>
      </div>
    </div>
  </div>
</div>
