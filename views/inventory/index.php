<section id="view-inventory" class="page-view space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p class="text-sm text-slate-500">Master list of toners. Click a row for stock card.</p>
    <div class="flex flex-wrap items-center gap-2">
      <input id="inv-search" type="search" placeholder="Search code or description…" class="form-input w-48 sm:w-56">
      <select id="inv-status-filter" class="form-input w-auto">
        <option value="">All status</option>
        <option value="in">In stock</option>
        <option value="low">Low stock</option>
        <option value="out">Out of stock</option>
      </select>
      <button id="btn-add-toner" type="button" class="btn btn-primary btn-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add Toner
      </button>
    </div>
  </div>

  <div class="table-wrap">
    <div class="overflow-x-auto">
      <table class="data-table" id="inventory-table">
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Description</th>
            <th>Printer Model</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Reorder</th>
            <th>Status</th>
            <th>Supplier</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="inventory-tbody">
          <tr><td colspan="8" class="text-center text-slate-400 py-8">Loading…</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>
