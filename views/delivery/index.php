<section id="view-delivery" class="page-view space-y-4">
  <p class="text-sm text-slate-500">Record a delivery by reference number. Stock increases; duplicate references are blocked.</p>

  <div class="bg-white rounded-xl border border-slate-200 p-5 max-w-2xl space-y-4">
    <div>
      <label class="form-label" for="del-ref">Reference / MRR number</label>
      <input id="del-ref" type="text" class="form-input font-mono uppercase" placeholder="e.g. MG009105 or DEL-2026-00125" autocomplete="off">
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="form-label" for="del-item">Toner / Item code</label>
        <select id="del-item" class="form-input">
          <option value="">Select toner…</option>
        </select>
      </div>
      <div>
        <label class="form-label" for="del-qty">Quantity</label>
        <input id="del-qty" type="number" min="1" step="1" class="form-input" value="1">
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="form-label" for="del-date">Delivery date</label>
        <input id="del-date" type="date" class="form-input">
      </div>
      <div>
        <label class="form-label" for="del-supplier">Supplier</label>
        <input id="del-supplier" type="text" class="form-input" placeholder="Optional">
      </div>
    </div>
    <div class="flex justify-end gap-2 pt-1">
      <button id="btn-record-delivery" type="button" class="btn btn-primary">Record Delivery</button>
    </div>
    <p id="del-msg" class="text-sm hidden"></p>
  </div>
</section>
