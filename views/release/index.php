<section id="view-release" class="page-view space-y-4">
  <p class="text-sm text-slate-500">Issue one toner unit per ticket. Date is today. Stock decreases by 1.</p>

  <div class="bg-white rounded-xl border border-slate-200 p-5 max-w-2xl space-y-4">
    <div>
      <label class="form-label" for="rel-ref">Issuance reference number</label>
      <input id="rel-ref" type="text" class="form-input font-mono uppercase" placeholder="e.g. REL-2026-00451" autocomplete="off">
    </div>
    <div>
      <label class="form-label" for="rel-item">Toner / Item code</label>
      <select id="rel-item" class="form-input">
        <option value="">Select toner…</option>
      </select>
      <p id="rel-stock-hint" class="text-xs text-slate-400 mt-1"></p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="form-label" for="rel-date">Date</label>
        <input id="rel-date" type="date" class="form-input bg-slate-50" readonly>
      </div>
      <div>
        <label class="form-label" for="rel-issued-by">Issued by</label>
        <input id="rel-issued-by" type="text" class="form-input" placeholder="Optional">
      </div>
    </div>
    <div class="flex justify-end gap-2 pt-1">
      <button id="btn-record-release" type="button" class="btn btn-success">Record Issuance</button>
    </div>
    <p id="rel-msg" class="text-sm hidden"></p>
  </div>
</section>
