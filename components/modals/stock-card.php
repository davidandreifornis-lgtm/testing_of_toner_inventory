<!-- Stock Card — behavior aligned with drafts (openStockCard / edit panel / period filter) -->
<div id="modal-stock-card" class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal-panel max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
      <div class="min-w-0 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
        </div>
        <div class="min-w-0">
          <h2 class="text-base font-semibold text-slate-900 truncate">Stock Card — <span id="sc-title" class="font-mono text-blue-700">—</span></h2>
          <p id="sc-subtitle" class="text-xs text-slate-500 mt-0.5 truncate">Edit quantity, printers &amp; supplier · view movement history</p>
        </div>
      </div>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0" data-close="modal-stock-card" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <input type="hidden" id="sc-ink-code" value="">

    <div class="px-5 py-3 border-b border-slate-100 bg-slate-50 space-y-2 shrink-0">
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200">
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">On hand</span>
          <span id="sc-qty" class="font-bold font-mono text-lg text-slate-900">0</span>
        </div>
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200">
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Reorder</span>
          <span id="sc-reorder" class="font-bold font-mono text-lg text-slate-900">0</span>
        </div>
        <div id="sc-status" class="mt-0.5"></div>
      </div>
      <div>
        <div class="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Compatible printers</div>
        <div id="sc-printers" class="flex flex-wrap gap-1.5 text-sm"></div>
      </div>
      <div>
        <div class="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Supplier</div>
        <div id="sc-supplier" class="flex flex-wrap gap-1.5 text-sm"></div>
      </div>
    </div>

    <div class="px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-end gap-2 shrink-0">
      <div>
        <label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1" for="sc-period">Period</label>
        <select id="sc-period" class="form-input text-xs py-1.5">
          <option value="ALL" selected>All time</option>
          <option value="TODAY">Today</option>
          <option value="WEEK">Last 7 days</option>
          <option value="MONTH">This month</option>
          <option value="CUSTOM">Custom range</option>
        </select>
      </div>
      <div id="sc-custom-range" class="hidden flex flex-wrap items-end gap-2">
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1" for="sc-from">From</label>
          <input id="sc-from" type="date" class="form-input text-xs py-1.5">
        </div>
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1" for="sc-to">To</label>
          <input id="sc-to" type="date" class="form-input text-xs py-1.5">
        </div>
      </div>
      <button type="button" id="btn-sc-apply-dates" class="btn btn-primary text-xs py-1.5 px-3">Apply</button>
      <button type="button" id="btn-sc-reset-dates" class="btn btn-secondary text-xs py-1.5 px-3">Reset</button>
      <div class="flex-1 min-w-[140px]">
        <label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1" for="sc-search">Search</label>
        <input id="sc-search" type="search" class="form-input text-xs py-1.5" placeholder="Date, type, ref…">
      </div>
    </div>

    <div class="p-4 overflow-y-auto flex-1 min-h-0">
      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="data-table text-sm w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Ref</th>
              <th class="text-right">In</th>
              <th class="text-right">Out</th>
              <th class="text-right">Balance</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody id="sc-tbody"></tbody>
        </table>
      </div>
      <div id="sc-empty" class="empty-state hidden py-6">
        <p class="text-sm text-center text-slate-400">No movement history for this toner yet.</p>
      </div>
    </div>

    <div class="shrink-0 px-5 py-3 border-t border-slate-200 flex flex-wrap justify-end gap-2">
      <button type="button" id="btn-sc-edit" class="btn btn-secondary text-sm inline-flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        Edit details
      </button>
      <button type="button" class="btn btn-primary text-sm" data-close="modal-stock-card">Close</button>
    </div>
  </div>
</div>

<!-- Edit panel — fixed overlay in front of stock card (drafts pattern) -->
<div id="modal-stock-card-edit" class="modal-backdrop modal-backdrop-front" role="dialog" aria-modal="true">
  <div class="modal-panel max-w-md overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-white flex items-center gap-3">
      <div class="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-base font-bold text-slate-900">Edit item details</h4>
        <p class="text-xs text-slate-500">Printers &amp; supplier from master lists · changes save to inventory</p>
      </div>
      <button type="button" class="modal-close p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" data-close="modal-stock-card-edit" title="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="px-5 py-4 space-y-4 max-h-[min(60vh,28rem)] overflow-y-auto">
      <div class="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div>
          <div class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Item code</div>
          <div id="sc-edit-code" class="font-mono font-bold text-slate-900 text-sm mt-0.5">—</div>
        </div>
        <span class="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md bg-slate-200/80 text-slate-600">Read-only</span>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-800 mb-1.5" for="sc-edit-description">Description</label>
        <input id="sc-edit-description" type="text" readonly tabindex="-1" class="form-input bg-slate-100 text-slate-600 cursor-not-allowed" placeholder="—">
        <p class="text-[11px] text-slate-500 mt-1">From MRR / master data — not editable here.</p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-semibold text-slate-800 mb-1.5" for="sc-edit-qty">Quantity on hand</label>
          <input id="sc-edit-qty" type="number" min="0" step="1" class="form-input font-mono font-bold">
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-800 mb-1.5" for="sc-edit-reorder">Reorder level</label>
          <input id="sc-edit-reorder" type="number" min="0" step="1" class="form-input font-mono">
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-800 mb-1.5" for="sc-edit-supplier">Supplier</label>
        <select id="sc-edit-supplier" class="form-input">
          <option value="">— Select supplier —</option>
        </select>
        <p class="text-[11px] text-slate-500 mt-1">Managed under <strong>Locations &amp; Suppliers</strong>.</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-800 mb-1.5">Compatible printer(s)</label>
        <div id="sc-edit-printers" class="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 space-y-1">
          <p class="text-xs text-slate-400">Loading printers…</p>
        </div>
        <p class="text-[11px] text-slate-500 mt-1.5">Check all printers this toner works with. List comes from <strong>Locations</strong> printer names.</p>
      </div>

      <p class="text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 leading-relaxed">
        Changing <strong>quantity</strong> records a stock adjustment in transaction history (ADJ-…).
      </p>
    </div>

    <div class="px-5 py-3.5 border-t border-slate-100 bg-slate-50/90 flex justify-end gap-2">
      <button type="button" class="btn btn-secondary" data-close="modal-stock-card-edit">Cancel</button>
      <button type="button" id="btn-sc-save" class="btn btn-primary inline-flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        Save changes
      </button>
    </div>
  </div>
</div>
