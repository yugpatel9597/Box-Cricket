(function () {
  const form = document.getElementById('register-form');
  const errorEl = document.getElementById('register-error');
  const btn = document.getElementById('register-btn');

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

    const name = form.name.value;
    const email = form.email.value;
    const phone = form.phone.value;
    const password = form.password.value;

    btn.disabled = true;
    btn.textContent = 'Creating…';

    try {
      const res = await window.BoxCricket.apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });

      if (!res || !res.token) throw new Error('Invalid server response');

      window.BoxCricket.setToken(res.token);
      if (res.user) window.BoxCricket.setUser(res.user);

      const redirect = window.BoxCricket.qs('redirect');
      window.location.href = window.BoxCricket.safeRedirectUrl(redirect, '/grounds.html');
    } catch (err) {
      showError(err && err.message ? err.message : 'Registration failed');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!form) return;
    form.addEventListener('submit', onSubmit);
  });
})();
