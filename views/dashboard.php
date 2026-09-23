<section id="view-dashboard" class="page-view active space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p class="text-sm text-slate-500">Overview of toner stock levels and movements.</p>
    <div class="flex items-center gap-2">
      <select id="dash-period" class="form-input w-auto text-sm py-1.5">
        <option value="today">Today</option>
        <option value="week">This week</option>
        <option value="month" selected>This month</option>
        <option value="all">All time</option>
      </select>
      <button id="btn-refresh-dashboard" type="button" class="btn btn-secondary btn-sm">Refresh</button>
    </div>
  </div>


  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <button type="button" id="btn-open-delivery" class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-soft hover:border-slate-300 hover:bg-slate-50 transition-colors">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
      </span>
      <span>
        <span class="block text-sm font-semibold text-slate-900">Receive Delivery</span>
        <span class="block text-xs text-slate-500">Increase stock from a delivery</span>
      </span>
    </button>
    <button type="button" id="btn-open-release" class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-soft hover:border-slate-300 hover:bg-slate-50 transition-colors">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
      </span>
      <span>
        <span class="block text-sm font-semibold text-slate-900">Stock Issuance</span>
        <span class="block text-xs text-slate-500">Release 1 unit to a department</span>
      </span>
    </button>
    <button type="button" id="btn-open-defective" class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-soft hover:border-slate-300 hover:bg-slate-50 transition-colors">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      </span>
      <span>
        <span class="block text-sm font-semibold text-slate-900">Return Defective</span>
        <span class="block text-xs text-slate-500">Flag issued ticket (no stock restore)</span>
      </span>
    </button>
  </div>

  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
    <div class="kpi-card">
      <div class="text-xs font-medium text-slate-500 mb-1">Total SKUs</div>
      <div id="kpi-skus" class="text-2xl font-bold text-slate-900">—</div>
    </div>
    <div class="kpi-card">
      <div class="text-xs font-medium text-slate-500 mb-1">Total Stock</div>
      <div id="kpi-stock" class="text-2xl font-bold text-slate-900">—</div>
    </div>
    <div class="kpi-card">
      <div class="text-xs font-medium text-slate-500 mb-1">Low Stock</div>
      <div id="kpi-low" class="text-2xl font-bold text-amber-600">—</div>
    </div>
    <div class="kpi-card">
      <div class="text-xs font-medium text-slate-500 mb-1">Out of Stock</div>
      <div id="kpi-out" class="text-2xl font-bold text-rose-600">—</div>
    </div>
    <div class="kpi-card">
      <div class="text-xs font-medium text-slate-500 mb-1">Deliveries</div>
      <div id="kpi-deliveries" class="text-2xl font-bold text-slate-900">—</div>
      <div id="kpi-deliveries-units" class="text-[11px] text-slate-400 mt-0.5"></div>
    </div>
    <div class="kpi-card">
      <div class="text-xs font-medium text-slate-500 mb-1">Releases</div>
      <div id="kpi-releases" class="text-2xl font-bold text-slate-900">—</div>
      <div id="kpi-releases-units" class="text-[11px] text-slate-400 mt-0.5"></div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div class="bg-white rounded-xl border border-slate-200 p-4">
      <h3 class="text-sm font-semibold text-slate-800 mb-3">Department demand</h3>
      <div class="h-56 relative">
        <canvas id="chart-dept"></canvas>
        <div id="chart-dept-empty" class="hidden absolute inset-0 flex items-center justify-center text-sm text-slate-400">No release data</div>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 p-4">
      <h3 class="text-sm font-semibold text-slate-800 mb-3">Stock status</h3>
      <div class="h-56 relative">
        <canvas id="chart-status"></canvas>
        <div id="chart-status-empty" class="hidden absolute inset-0 flex items-center justify-center text-sm text-slate-400">No inventory</div>
      </div>
    </div>
  </div>

  <div id="dash-low-stock-alert" class="hidden bg-amber-50 border border-amber-200 rounded-xl p-4">
    <div class="flex items-start gap-3">
      <svg class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      <div>
        <div class="text-sm font-semibold text-amber-900">Low / out of stock items</div>
        <ul id="dash-low-list" class="mt-1 text-sm text-amber-800 space-y-0.5"></ul>
      </div>
    </div>
  </div>
</section>
