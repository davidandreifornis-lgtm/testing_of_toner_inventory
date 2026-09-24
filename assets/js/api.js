/**
 * API client — talks only to PHP endpoints. No localStorage / mock data.
 */
const API = {
  base: (typeof window.TONER_API_BASE === 'string' ? window.TONER_API_BASE : '/api').replace(/\/$/, ''),

  async request(path, options = {}) {
    const url = this.base + path;
    const opts = {
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(options.body && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(options.headers || {}),
      },
      ...options,
    };
    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
      opts.body = JSON.stringify(opts.body);
    }

    let res;
    try {
      res = await fetch(url, opts);
    } catch (err) {
      throw new Error('Network error. Check that the server and database are available.');
    }

    if (res.status === 401) {
      window.location.href = 'login.php';
      throw new Error('Unauthorized');
    }

    let data;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(res.ok ? 'Invalid JSON response' : `Server error (${res.status})`);
    }

    if (!res.ok || data.ok === false) {
      const msg = data.error || data.message || `Request failed (${res.status})`;
      const e = new Error(msg);
      e.status = res.status;
      e.data = data;
      throw e;
    }
    return data;
  },

  get(path, params) {
    let q = path;
    if (params && typeof params === 'object') {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== '' && v != null) sp.set(k, v);
      });
      const s = sp.toString();
      if (s) q += (q.includes('?') ? '&' : '?') + s;
    }
    return this.request(q, { method: 'GET' });
  },

  post(path, body) {
    return this.request(path, { method: 'POST', body });
  },

  put(path, body) {
    return this.request(path, { method: 'PUT', body });
  },

  del(path, body) {
    return this.request(path, { method: 'DELETE', body });
  },

  // Domain helpers
  inventory() {
    return this.get('/inventory.php');
  },
  addInventory(payload) {
    return this.post('/inventory.php', payload);
  },
  removeInventory(itemCode) {
    return this.del('/inventory.php', { itemCode, inkCode: itemCode });
  },
  updateInventory(payload) {
    return this.put('/inventory.php', payload);
  },
  transactions(params) {
    return this.get('/transactions.php', params);
  },
  delivery(payload) {
    return this.post('/delivery.php', payload);
  },
  previewDelivery(mrr) {
    return this.post('/delivery.php', { action: 'preview', mrr, referenceNumber: mrr });
  },
  release(payload) {
    return this.post('/release.php', payload);
  },
  defective(payload) {
    return this.post('/defective.php', payload);
  },
  locations() {
    return this.get('/locations.php');
  },
  suppliers() {
    return this.get('/suppliers.php');
  },
  health() {
    return this.get('/health.php');
  },
};

window.API = API;
