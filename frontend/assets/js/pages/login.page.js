(function () {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  function showError(msg) {
    if (!errorEl) return;
    errorEl.classList.remove('hidden');
    errorEl.textContent = msg;
  }

  function hideError() {
    if (!errorEl) return;
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
  }

  async function onSubmit(e) {
    e.preventDefault();

    hideError();

    const email = form.email.value;
    const password = form.password.value;

    btn.disabled = true;
    btn.textContent = 'Logging in…';

    try {
      const res = await window.BoxCricket.apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res || !res.token) throw new Error('Invalid server response');

      window.BoxCricket.setToken(res.token);
      if (res.user) window.BoxCricket.setUser(res.user);

      const redirect = window.BoxCricket.qs('redirect');
      window.location.href = window.BoxCricket.safeRedirectUrl(redirect, '/grounds.html');
    } catch (err) {
      showError(err && err.message ? err.message : 'Login failed');
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!form) return;
    form.addEventListener('submit', onSubmit);
  });
})();
