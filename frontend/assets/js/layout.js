(function () {
  function activeClass(href) {
    const current = window.location.pathname || '';
    if (current.endsWith(href)) return 'text-white';
    return 'text-white/70 hover:text-white';
  }

  function getAuthState() {
    const token = window.BoxCricket.getToken();
    const payload = token ? window.BoxCricket.decodeJwt(token) : null;
    const user = window.BoxCricket.getUser();

    return {
      token,
      payload,
      user,
      isLoggedIn: Boolean(token),
      role: (user && user.role) || (payload && payload.role) || 'user'
    };
  }

  function mountHeader() {
    const el = document.getElementById('site-header');
    if (!el) return;

    const auth = getAuthState();

    const userLabel = auth.user && auth.user.name ? auth.user.name : auth.payload && auth.payload.email ? auth.payload.email : null;

    const adminLink =
      auth.isLoggedIn && auth.role === 'admin'
        ? `<a class="${activeClass('admin.html')}" href="/admin.html">Admin</a>`
        : '';

    const authLinks = auth.isLoggedIn
      ? `
        <div class="flex items-center gap-3">
          <a class="hidden sm:inline ${activeClass('my-bookings.html')}" href="/my-bookings.html">My Bookings</a>
          <button id="logout-btn" class="inline-flex items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15">Logout</button>
        </div>
      `
      : `
        <div class="flex items-center gap-3">
          <a class="${activeClass('login.html')}" href="/login.html">Login</a>
          <a class="inline-flex items-center justify-center rounded-lg bg-turf px-3 py-2 text-sm font-semibold text-black hover:bg-turf2" href="/register.html">Register</a>
        </div>
      `;

    el.innerHTML = `
      <header class="sticky top-0 z-50 border-b border-white/10 bg-pitch/80 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a href="/index.html" class="flex items-center gap-2 font-bold tracking-tight text-white">
            <img src="/assets/images/logo.svg" alt="BoxCricket" class="h-8 w-8" />
            <span>BoxCricket</span>
          </a>

          <nav class="hidden items-center gap-6 md:flex">
            <a class="${activeClass('index.html')}" href="/index.html">Home</a>
            <a class="${activeClass('grounds.html')}" href="/grounds.html">Grounds</a>
            <a class="${activeClass('contact.html')}" href="/contact.html">Contact</a>
            ${adminLink}
          </nav>

          <div class="hidden items-center gap-3 md:flex">
            ${userLabel ? `<span class="hidden lg:inline text-sm text-white/60">${userLabel}</span>` : ''}
            ${authLinks}
          </div>

          <button id="mobile-menu-btn" class="inline-flex items-center justify-center rounded-lg bg-white/10 p-2 text-white hover:bg-white/15 md:hidden" aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div id="mobile-menu" class="hidden border-t border-white/10 bg-pitch2/95 px-4 py-4 md:hidden">
          <div class="flex flex-col gap-3">
            <a class="${activeClass('index.html')}" href="/index.html">Home</a>
            <a class="${activeClass('grounds.html')}" href="/grounds.html">Grounds</a>
            <a class="${activeClass('my-bookings.html')}" href="/my-bookings.html">My Bookings</a>
            <a class="${activeClass('contact.html')}" href="/contact.html">Contact</a>
            ${adminLink}
            <div class="mt-2 h-px bg-white/10"></div>
            ${auth.isLoggedIn ? `<button id="logout-btn-m" class="rounded-lg bg-white/10 px-3 py-2 text-left text-sm font-semibold hover:bg-white/15">Logout</button>` : `<a class="rounded-lg bg-turf px-3 py-2 text-sm font-semibold text-black hover:bg-turf2" href="/login.html">Login</a>`}
          </div>
        </div>
      </header>
    `;

    const menuBtn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (menuBtn && menu) {
      menuBtn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
      });
    }

    const logoutButtons = [document.getElementById('logout-btn'), document.getElementById('logout-btn-m')].filter(Boolean);
    for (const btn of logoutButtons) {
      btn.addEventListener('click', () => {
        window.BoxCricket.clearAuth();
        window.location.href = '/index.html';
      });
    }
  }

  function mountFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;

    el.innerHTML = `
      <footer class="border-t border-white/10 bg-pitch2">
        <div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <div class="flex items-center gap-2">
              <img src="/assets/images/logo.svg" alt="BoxCricket" class="h-8 w-8" />
              <span class="text-lg font-bold">BoxCricket</span>
            </div>
            <p class="mt-3 text-sm text-white/60">
              Book premium box cricket slots in seconds. Pay securely with Razorpay.
            </p>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-white">Quick Links</h3>
            <div class="mt-3 flex flex-col gap-2 text-sm">
              <a class="text-white/70 hover:text-white" href="/grounds.html">Grounds</a>
              <a class="text-white/70 hover:text-white" href="/my-bookings.html">My Bookings</a>
              <a class="text-white/70 hover:text-white" href="/contact.html">Contact Us</a>
              <a class="text-white/70 hover:text-white" href="/admin.html">Admin</a>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-white">Policies (Razorpay)</h3>
            <div class="mt-3 flex flex-col gap-2 text-sm">
              <a class="text-white/70 hover:text-white" href="/policies/privacy.html">Privacy Policy</a>
              <a class="text-white/70 hover:text-white" href="/policies/terms.html">Terms & Conditions</a>
              <a class="text-white/70 hover:text-white" href="/policies/refund.html">Refund & Cancellation Policy</a>
            </div>
          </div>
        </div>

        <div class="border-t border-white/10">
          <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/50 sm:flex-row">
            <span>© ${new Date().getFullYear()} BoxCricket. All rights reserved.</span>
            <span>Built for fast, mobile-first booking.</span>
          </div>
        </div>
      </footer>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    mountHeader();
    mountFooter();
  });
})();
