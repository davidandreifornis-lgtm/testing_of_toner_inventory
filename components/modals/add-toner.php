<div id="modal-add-toner" class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal-panel max-w-md">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <h2 class="text-base font-semibold text-slate-900">Add Toner</h2>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-add-toner" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <form id="form-add-toner" class="p-5 space-y-3">
      <div>
        <label class="form-label" for="add-code">Item code *</label>
        <input id="add-code" name="itemCode" type="text" required class="form-input font-mono uppercase" placeholder="e.g. TN-227BK">
      </div>
      <div>
        <label class="form-label" for="add-desc">Description *</label>
        <input id="add-desc" name="description" type="text" required class="form-input" placeholder="Toner description">
      </div>
      <div>
        <label class="form-label" for="add-printer">Compatible printer</label>
        <input id="add-printer" name="printerModel" type="text" class="form-input" placeholder="Optional">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label" for="add-qty">Starting qty</label>
          <input id="add-qty" name="quantity" type="number" min="0" value="0" class="form-input">
        </div>
        <div>
          <label class="form-label" for="add-reorder">Reorder level</label>
          <input id="add-reorder" name="reorderLevel" type="number" min="0" value="3" class="form-input">
        </div>
      </div>
      <div>
        <label class="form-label" for="add-supplier">Supplier</label>
        <input id="add-supplier" name="supplier" type="text" class="form-input" placeholder="Optional">
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="btn btn-secondary modal-close" data-close="modal-add-toner">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  </div>
</div>
