/* =============================================
   auth.js  — Login holati + Cart + UI helpers
   ============================================= */

const AUTH_KEY  = 'shop_user';
const CART_KEY  = 'shop_cart';
const FAV_KEY   = 'shop_favs';

/* ---------- AUTH ---------- */
const Auth = {
  get() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
  },
  set(user) { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); },
  clear()   { localStorage.removeItem(AUTH_KEY); },
  isLoggedIn() { return !!this.get(); }
};

/* ---------- CART ---------- */
const Cart = {
  get() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  },
  save(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); },
  add(product) {
    const items = this.get();
    const idx   = items.findIndex(i => i.id === product.id);
    if (idx > -1) items[idx].qty += 1;
    else items.push({ ...product, qty: 1 });
    this.save(items);
    updateCartBadge();
  },
  remove(id) {
    this.save(this.get().filter(i => i.id !== id));
    updateCartBadge();
  },
  setQty(id, qty) {
    if (qty < 1) { this.remove(id); return; }
    const items = this.get();
    const idx   = items.findIndex(i => i.id === id);
    if (idx > -1) items[idx].qty = qty;
    this.save(items);
    updateCartBadge();
  },
  total() {
    return this.get().reduce((s, i) => s + i.price * i.qty, 0);
  },
  count() {
    return this.get().reduce((s, i) => s + i.qty, 0);
  }
};

/* ---------- FAVOURITES ---------- */
const Favs = {
  get() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
  },
  toggle(id) {
    const favs = this.get();
    const idx  = favs.indexOf(id);
    if (idx > -1) favs.splice(idx, 1);
    else favs.push(id);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    updateFavBadge();
    return idx === -1; // true = added
  },
  has(id) { return this.get().includes(id); }
};

/* ---------- BADGE UPDATERS ---------- */
function updateCartBadge() {
  const c = Cart.count();
  document.querySelectorAll('[data-cart-badge]').forEach(el => {
    el.textContent = c;
    el.style.display = c ? 'flex' : 'none';
  });
}
function updateFavBadge() {
  const c = Favs.get().length;
  document.querySelectorAll('[data-fav-badge]').forEach(el => {
    el.textContent = c;
    el.style.display = c ? 'flex' : 'none';
  });
}

/* ---------- TOAST ---------- */
function showToast(msg, duration = 2200) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast'; el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}

/* ---------- FORMAT PRICE ---------- */
function fmtPrice(n) {
  return n.toLocaleString('uz-UZ') + ' UZS';
}

/* ---------- MODALS ---------- */
function openModal(id)  {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}

/* ---------- PROFILE BUTTON HANDLER ---------- */
function handleProfileClick() {
  if (Auth.isLoggedIn()) {
    openModal('profile-modal');
  } else {
    openModal('login-modal');
  }
}

/* ---------- LOGIN FLOW ---------- */
let loginPhone = '';
let loginStep  = 1; // 1=phone, 2=otp

function showLoginStep(step) {
  loginStep = step;
  const phoneEl = document.getElementById('login-step-phone');
  const otpEl   = document.getElementById('login-step-otp');
  if (phoneEl) phoneEl.style.display = step === 1 ? '' : 'none';
  if (otpEl)   otpEl.style.display   = step === 2 ? '' : 'none';
  if (step === 2) {
    setTimeout(() => {
      const first = document.querySelector('.otp-input');
      if (first) first.focus();
    }, 100);
  }
}

function initLoginForm() {
  const phoneInput = document.getElementById('login-phone-input');
  const phoneBtn   = document.getElementById('login-phone-btn');
  const otpInputs  = document.querySelectorAll('.otp-input');
  const otpBtn     = document.getElementById('login-otp-btn');

  if (phoneInput && phoneBtn) {
    phoneInput.addEventListener('input', () => {
      const val = phoneInput.value.replace(/\D/g, '');
      phoneBtn.disabled = val.length < 9;
    });
    phoneBtn.addEventListener('click', () => {
      loginPhone = '+998' + phoneInput.value.replace(/\D/g, '');
      // real SMS yuborilmaydi — demo
      showToast('📱 SMS kodi yuborildi (demo: 1234)');
      showLoginStep(2);
      const hint = document.getElementById('otp-phone-hint');
      if (hint) hint.textContent = loginPhone;
    });
  }

  if (otpInputs.length && otpBtn) {
    otpInputs.forEach((inp, i) => {
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/\D/g, '').slice(-1);
        if (inp.value && i < otpInputs.length - 1) {
          otpInputs[i + 1].focus();
        }
        const code = [...otpInputs].map(x => x.value).join('');
        otpBtn.disabled = code.length < 4;
        if (code.length === 4) inp.classList.add('filled');
      });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !inp.value && i > 0) {
          otpInputs[i - 1].focus();
        }
      });
    });

    otpBtn.addEventListener('click', () => {
      const code = [...otpInputs].map(x => x.value).join('');
      // demo: har qanday 4 raqam ishlaydi
      Auth.set({ phone: loginPhone, name: '' });
      closeModal('login-modal');
      showToast('✅ Tizimga kirdingiz!');
      updateProfileIcon();
      refreshProfileModal();
      // reset
      otpInputs.forEach(x => { x.value = ''; x.classList.remove('filled'); });
      if (phoneInput) phoneInput.value = '';
      showLoginStep(1);
    });
  }
}

/* ---------- PROFILE MODAL ---------- */
function refreshProfileModal() {
  const user = Auth.get();
  const phoneEl = document.getElementById('profile-phone-display');
  if (phoneEl) phoneEl.textContent = user ? user.phone : '';
}

function initProfileModal() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.clear();
      closeModal('profile-modal');
      showToast('👋 Chiqildi');
      updateProfileIcon();
    });
  }
}

/* ---------- PROFILE ICON STATE ---------- */
function updateProfileIcon() {
  const icons = document.querySelectorAll('[data-profile-icon]');
  const user  = Auth.get();
  icons.forEach(el => {
    el.textContent = user ? '👤' : '👤';
    el.style.color = user ? 'var(--brand)' : '';
  });
}

/* ---------- CART PANEL ---------- */
function openCartPanel() {
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('panel-overlay');
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartPanel();
}
function closeCartPanel() {
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('panel-overlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartPanel() {
  const body = document.getElementById('cart-body');
  if (!body) return;
  const items = Cart.get();
  const totalEl = document.getElementById('cart-total-price');

  if (!items.length) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Savat bo'sh</p>
      </div>`;
    if (totalEl) totalEl.textContent = fmtPrice(0);
    return;
  }

  body.innerHTML = items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div style="width:68px;height:68px;border-radius:8px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">${item.emoji || '📦'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmtPrice(item.price)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="cartQty(${item.id}, ${item.qty - 1})">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="cartQty(${item.id}, ${item.qty + 1})">+</button>
        </div>
      </div>
      <div class="cart-item-del" onclick="cartDel(${item.id})">🗑</div>
    </div>
  `).join('');

  if (totalEl) totalEl.textContent = fmtPrice(Cart.total());
}

function cartQty(id, qty) { Cart.setQty(id, qty); renderCartPanel(); }
function cartDel(id)      { Cart.remove(id);       renderCartPanel(); }

/* ---------- ADD TO CART (global) ---------- */
function addToCart(product) {
  Cart.add(product);
  showToast(`🛒 Savatga qo'shildi`);
}

/* ---------- INIT NAVBAR (fetch dan keyin chaqiriladi) ---------- */
function initNavbar() {
  updateCartBadge();
  updateFavBadge();
  updateProfileIcon();

  document.querySelectorAll('[data-profile-btn]').forEach(btn => {
    btn.addEventListener('click', handleProfileClick);
  });
  document.querySelectorAll('[data-cart-btn]').forEach(btn => {
    btn.addEventListener('click', openCartPanel);
  });

  const closeCartBtn = document.getElementById('cart-close-btn');
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartPanel);

  const panelOverlay = document.getElementById('panel-overlay');
  if (panelOverlay) panelOverlay.addEventListener('click', closeCartPanel);

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        const id = overlay.id;
        if (id === 'login-modal' && loginStep === 2) { showLoginStep(1); return; }
        closeModal(id);
      }
    });
  });

  initLoginForm();
  initProfileModal();
  refreshProfileModal();

  // Search input (agar products.js ham bor bo'lsa)
  const searchInput = document.getElementById('search-input');
  if (searchInput && typeof initSearch === 'function') initSearch();
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  updateFavBadge();
  updateProfileIcon();
  initLoginForm();
  initProfileModal();

  // Profile btn
  document.querySelectorAll('[data-profile-btn]').forEach(btn => {
    btn.addEventListener('click', handleProfileClick);
  });

  // Cart btn
  document.querySelectorAll('[data-cart-btn]').forEach(btn => {
    btn.addEventListener('click', openCartPanel);
  });

  // Close cart
  const closeCartBtn = document.getElementById('cart-close-btn');
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartPanel);

  // Panel overlay close
  const panelOverlay = document.getElementById('panel-overlay');
  if (panelOverlay) panelOverlay.addEventListener('click', closeCartPanel);

  // Modal close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        const id = overlay.id;
        if (id === 'login-modal' && loginStep === 2) {
          showLoginStep(1); return;
        }
        closeModal(id);
      }
    });
  });
});
