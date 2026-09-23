<section id="view-defective" class="page-view space-y-4">
  <p class="text-sm text-slate-500">Flag an already issued ticket as defective. Usable stock is <strong>not</strong> restored.</p>

  <div class="bg-white rounded-xl border border-slate-200 p-5 max-w-2xl space-y-4">
    <div>
      <label class="form-label" for="def-ref">Issuance reference number</label>
      <input id="def-ref" type="text" class="form-input font-mono uppercase" placeholder="Reference of the original issuance" autocomplete="off">
    </div>
    <div>
      <label class="form-label" for="def-notes">Notes (optional)</label>
      <textarea id="def-notes" class="form-input" rows="2" placeholder="Reason or details"></textarea>
    </div>
    <div class="flex justify-end gap-2 pt-1">
      <button id="btn-flag-defective" type="button" class="btn btn-danger">Flag as Defective</button>
    </div>
    <p id="def-msg" class="text-sm hidden"></p>
  </div>
</section>
