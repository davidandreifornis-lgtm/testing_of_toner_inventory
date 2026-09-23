/**
 * Application bootstrap — navigation, init modules, load data from API only.
 * Current view is kept in the URL hash (+ sessionStorage) so reload stays on the same page.
 */
const App = {
  titles: {
    dashboard: 'Dashboard',
    inventory: 'Toner Inventory',
    transactions: 'Transaction History',
    masters: 'Suppliers and Locations',
    settings: 'Settings',
  },

  storageKey: 'toner_active_view',

  resolveView() {
    const fromHash = (location.hash || '').replace(/^#/, '').trim();
    if (fromHash && this.titles[fromHash]) return fromHash;
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      if (stored && this.titles[stored]) return stored;
    } catch (_) { /* ignore */ }
    return 'dashboard';
  },

  persistView(name) {
    try {
      sessionStorage.setItem(this.storageKey, name);
    } catch (_) { /* ignore */ }
    if (location.hash.replace(/^#/, '') !== name) {
      history.replaceState(null, '', '#' + name);
    }
  },

  showView(name, opts = {}) {
    if (!this.titles[name]) name = 'dashboard';

    document.querySelectorAll('.page-view').forEach((el) => el.classList.remove('active'));
    const view = document.getElementById('view-' + name);
    if (view) view.classList.add('active');

    document.querySelectorAll('.nav-item[data-view]').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('data-view') === name);
    });

    const title = document.getElementById('page-title');
    if (title) title.textContent = this.titles[name] || name;

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('open');

    this.persistView(name);

    // Load data for the active view only (avoid forcing dashboard after every nav)
    if (!opts.skipLoad) {
      if (name === 'transactions') Transactions.load();
      if (name === 'dashboard') Dashboard.load();
      if (name === 'inventory') Inventory.load();
      if (name === 'settings') Settings.load();
      if (name === 'masters') Masters.load();
    }
  },

  initNav() {
    document.querySelectorAll('.nav-item[data-view]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const view = a.getAttribute('data-view');
        this.showView(view);
      });
    });

    // Browser back/forward or manual hash change
    window.addEventListener('hashchange', () => {
      const name = this.resolveView();
      this.showView(name);
    });

    // Restore last view (hash first, then sessionStorage)
    this.showView(this.resolveView());

    document.getElementById('btn-sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
      document.getElementById('sidebar-overlay')?.classList.toggle('open');
    });
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.remove('open');
    });

    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const ok = await Modals.confirm('Log out of Toner Inventory?', {
        title: 'Confirm log out',
        okLabel: 'Log out',
        danger: true,
      });
      if (ok) window.location.href = 'logout.php';
    });
  },

  async init() {
    Modals.init();
    Notifications.init();
    Dashboard.init();
    Inventory.init();
    Delivery.init();
    Release.init();
    Defective.init();
    Transactions.init();
    Settings.init();
    Logs.init();
    Masters.init();
    this.initNav();

    // Health check only — view data is loaded by showView above
    try {
      await API.health();
    } catch (err) {
      Notifications.toast('API health check failed: ' + (err.message || 'unavailable'), 'error');
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
