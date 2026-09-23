<section id="view-masters" class="page-view space-y-6">
  <p class="text-sm text-slate-500">Manage supplier list and department / location / printer mappings used in deliveries and issuances.</p>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Suppliers -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h2 class="text-sm font-semibold text-slate-900">Suppliers</h2>
        <button type="button" id="btn-refresh-suppliers" class="btn btn-secondary btn-sm">Refresh</button>
      </div>
      <div class="flex gap-2">
        <input id="supplier-name" type="text" class="form-input flex-1" placeholder="New supplier name">
        <button type="button" id="btn-add-supplier" class="btn btn-primary">Add</button>
      </div>
      <p id="suppliers-msg" class="text-sm hidden"></p>
      <div class="table-wrap max-h-72 overflow-auto">
        <table class="data-table text-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th class="w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="suppliers-tbody">
            <tr><td colspan="2" class="text-slate-400 text-center py-6">Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Locations -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h2 class="text-sm font-semibold text-slate-900">Locations</h2>
        <button type="button" id="btn-refresh-locations" class="btn btn-secondary btn-sm">Refresh</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input id="loc-dept" type="text" class="form-input" placeholder="Department">
        <input id="loc-name" type="text" class="form-input" placeholder="Location">
        <input id="loc-printer" type="text" class="form-input" placeholder="Printer (optional)">
      </div>
      <div class="flex justify-end">
        <button type="button" id="btn-add-location" class="btn btn-primary">Add location</button>
      </div>
      <p id="locations-msg" class="text-sm hidden"></p>
      <div class="table-wrap max-h-72 overflow-auto">
        <table class="data-table text-sm">
          <thead>
            <tr>
              <th>Department</th>
              <th>Location</th>
              <th>Printer</th>
              <th class="w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="locations-tbody">
            <tr><td colspan="4" class="text-slate-400 text-center py-6">Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>
