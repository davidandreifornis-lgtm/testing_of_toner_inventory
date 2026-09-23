/**
 * In-app notifications and toasts.
 */
const Notifications = {
  items: [],

  toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    const box = document.getElementById('toast-container');
    if (box) {
      box.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 250);
      }, 3500);
    }
  },

  add(title, body, level = 'info') {
    this.items.unshift({
      id: Date.now() + Math.random(),
      title,
      body,
      level,
      at: new Date().toISOString(),
    });
    if (this.items.length > 50) this.items.length = 50;
    this.render();
  },

  clear() {
    this.items = [];
    this.render();
  },

  render() {
    const list = document.getElementById('notifications-list');
    const badge = document.getElementById('notif-badge');
    if (!list) return;

    if (!this.items.length) {
      list.innerHTML = '<div class="empty-state py-8"><p class="text-sm">No notifications yet</p></div>';
      if (badge) badge.classList.add('hidden');
      return;
    }

    if (badge) {
      badge.textContent = String(Math.min(this.items.length, 99));
      badge.classList.remove('hidden');
    }

    list.innerHTML = this.items
      .map(
        (n) => `
      <div class="px-4 py-3 border-b border-slate-50 hover:bg-slate-50">
        <div class="text-sm font-medium text-slate-800">${Utils.escapeHtml(n.title)}</div>
        <div class="text-xs text-slate-500 mt-0.5">${Utils.escapeHtml(n.body)}</div>
      </div>`
      )
      .join('');
  },

  init() {
    const btn = document.getElementById('btn-notifications');
    const panel = document.getElementById('notifications-panel');
    const clearBtn = document.getElementById('btn-clear-notifications');
    if (btn && panel) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('hidden');
      });
      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== btn) {
          panel.classList.add('hidden');
        }
      });
    }
    if (clearBtn) clearBtn.addEventListener('click', () => this.clear());
  },
};

window.Notifications = Notifications;
