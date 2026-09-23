/**
 * Application bootstrap — navigation, init modules, load data from API only.
 * No localStorage demo mode. Empty states when DB has no data.
 */
const App = {
  titles: {
    dashboard: 'Dashboard',
    inventory: 'Toner Inventory',
    transactions: 'Transaction History',
    masters: 'Masters',
    settings: 'Email Settings',
  },

  showView(name) {
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

    if (name === 'transactions') Transactions.load();
    if (name === 'dashboard') Dashboard.load();
    if (name === 'inventory') Inventory.load();
    if (name === 'settings') Settings.load();
    if (name === 'masters') Masters.load();
  },

  initNav() {
    document.querySelectorAll('.nav-item[data-view]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const view = a.getAttribute('data-view');
        history.replaceState(null, '', '#' + view);
        this.showView(view);
      });
    });

    const hash = (location.hash || '#dashboard').replace('#', '');
    this.showView(this.titles[hash] ? hash : 'dashboard');

    document.getElementById('btn-sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
      document.getElementById('sidebar-overlay')?.classList.toggle('open');
    });
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.remove('open');
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

    // Initial data load from database only
    try {
      await API.health();
    } catch (err) {
      Notifications.toast('API health check failed: ' + (err.message || 'unavailable'), 'error');
    }

    await Inventory.load();
    await Dashboard.load();
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
