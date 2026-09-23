<section id="view-transactions" class="page-view space-y-2">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex flex-wrap gap-1 border-b border-slate-200">
      <button type="button" data-txn-tab="RECEIVED" class="txn-tab px-3 py-2 text-sm font-medium border-b-2 border-slate-900 text-slate-900">Deliveries</button>
      <button type="button" data-txn-tab="RELEASED" class="txn-tab px-3 py-2 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-800">Releases</button>
      <button type="button" data-txn-tab="DEFECTIVE" class="txn-tab px-3 py-2 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-800">Defective</button>
      <button type="button" data-txn-tab="" class="txn-tab px-3 py-2 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-800">All</button>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <input id="txn-search" type="search" placeholder="Search ref or code…" class="form-input w-40">
      <select id="txn-period" class="form-input w-auto">
        <option value="today">Today</option>
        <option value="week">This week</option>
        <option value="month" selected>This month</option>
        <option value="custom">Custom</option>
        <option value="all">All time</option>
      </select>
      <input id="txn-from" type="date" class="form-input w-auto hidden">
      <input id="txn-to" type="date" class="form-input w-auto hidden">
      <button id="btn-export-csv" type="button" class="btn btn-secondary btn-sm">Export CSV</button>
    </div>
  </div>

  <div class="table-wrap">
    <div class="overflow-x-auto">
      <table class="data-table" id="txn-table">
        <thead>
          <tr id="txn-thead-row">
            <th>Reference</th>
            <th>Type</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Date</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody id="txn-tbody">
          <tr><td colspan="6" class="text-center text-slate-400 py-8">Loading…</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>
