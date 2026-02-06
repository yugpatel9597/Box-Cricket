(function () {
  const API_BASE = '/api';

  function getToken() {
    return localStorage.getItem('bc_token');
  }

  function setToken(token) {
    localStorage.setItem('bc_token', token);
  }

  function clearToken() {
    localStorage.removeItem('bc_token');
  }

  function getUser() {
    try {
      const raw = localStorage.getItem('bc_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem('bc_user', JSON.stringify(user));
  }

  function clearUser() {
    localStorage.removeItem('bc_user');
  }

  function clearAuth() {
    clearToken();
    clearUser();
  }

  function decodeJwt(token) {
    try {
      const parts = String(token).split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(normalized)
          .split('')
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function qs(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function setQs(params) {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(params)) {
      if (v === null || typeof v === 'undefined') url.searchParams.delete(k);
      else url.searchParams.set(k, String(v));
    }
    return url.toString();
  }

  function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function toLocalDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    const [y, mo, d] = String(dateStr).split('-').map((v) => Number(v));
    const [h, mi] = String(timeStr).split(':').map((v) => Number(v));
    if ([y, mo, d, h, mi].some((v) => !Number.isFinite(v))) return null;
    return new Date(y, mo - 1, d, h, mi, 0, 0);
  }

  function formatINRFromPaise(amountPaise) {
    const rupees = Number(amountPaise || 0) / 100;
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(rupees);
    } catch {
      return `₹${Math.round(rupees)}`;
    }
  }

  async function apiFetch(path, options) {
    const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

    const opts = options ? { ...options } : {};
    const headers = { ...(opts.headers || {}) };

    if (!headers['Content-Type'] && opts.body && typeof opts.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    const token = getToken();
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    opts.headers = headers;

    const res = await fetch(url, opts);

    let data;
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    if (isJson) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const err = new Error((data && data.message) || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  function safeRedirectUrl(input, fallback) {
    const value = input || fallback || '/index.html';
    if (typeof value !== 'string') return '/index.html';
    if (!value.startsWith('/')) return '/index.html';
    return value;
  }

  window.BoxCricket = {
    API_BASE,
    getToken,
    setToken,
    clearToken,
    getUser,
    setUser,
    clearUser,
    clearAuth,
    decodeJwt,
    qs,
    setQs,
    todayISO,
    toLocalDateTime,
    formatINRFromPaise,
    apiFetch,
    safeRedirectUrl
  };
})();
