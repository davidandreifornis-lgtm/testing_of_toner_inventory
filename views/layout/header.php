<header id="app-header" class="sticky top-0 z-30 h-11 flex items-center justify-between px-3 sm:px-4 shrink-0">
  <div class="flex items-center gap-3">
    <button id="btn-sidebar-toggle" type="button" class="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Toggle menu">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
    <h1 id="page-title" class="text-sm font-semibold text-slate-900">Dashboard</h1>
  </div>
  <div class="flex items-center gap-2">
    <button id="btn-notifications" type="button" class="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Notifications">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
      <span id="notif-badge" class="hidden absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">0</span>
    </button>
    <div class="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
      <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">A</div>
      <span class="text-sm font-medium text-slate-700"><?php echo htmlspecialchars(auth_user()); ?></span>
    </div>
  </div>
</header>
