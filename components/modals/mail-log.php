<div id="modal-mail-log" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-mail-log-title">
  <div class="modal-panel max-w-3xl">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <h2 id="modal-mail-log-title" class="text-base font-semibold text-slate-900">Mail log</h2>
        <p class="text-xs text-slate-500 mt-0.5">Outbound email attempts (low-stock alerts and system mail)</p>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-mail-log" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
<span id="mail-log-count" class="text-xs text-slate-400"></span>
    </div>
    <div class="p-4 max-h-[28rem] overflow-y-auto">
      <div id="mail-log-list" class="space-y-3">
        <div class="empty-state py-8"><p class="text-sm">Loading…</p></div>
      </div>
    </div>
  </div>
</div>
