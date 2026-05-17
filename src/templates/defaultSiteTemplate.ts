// Default Site Template - auto-generated for every new store
// Placeholders: {{STORE_NAME}}, {{STORE_SLUG}}, {{PRIMARY_COLOR}}, {{SUPABASE_URL}}, {{SUPABASE_KEY}}

export const SUPABASE_URL = 'https://bylfcmpkmlzfnzhlnqpk.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5bGZjbXBrbWx6Zm56aGxucXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxMDQ0ODUsImV4cCI6MjA1NDY4MDQ4NX0.w7nWwm5e7_c0U_Uc98jKlTQYvhOkQ4OVOKRqMKRYz18';

export function generateDefaultSite(storeName: string, storeSlug: string, primaryColor = '#6366F1'): Record<string, string> {
  const css = `
:root {
  --primary: ${primaryColor};
  --primary-dark: color-mix(in srgb, ${primaryColor} 80%, black);
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --radius: 1.25rem;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); }
a { text-decoration: none; color: inherit; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }

/* NAVBAR */
nav { background: #fff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
.nav-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; gap: 1rem; }
.nav-logo { font-size: 1.25rem; font-weight: 900; letter-spacing: -0.05em; color: var(--primary); text-transform: uppercase; }
.nav-links { display: flex; align-items: center; gap: 1.5rem; }
.nav-links a { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); transition: color 0.2s; }
.nav-links a:hover { color: var(--primary); }
.nav-cart { position: relative; width: 40px; height: 40px; border-radius: 0.75rem; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; }
.cart-badge { position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff; border-radius: 999px; font-size: 0.6rem; font-weight: 900; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; display: none; }

/* HERO */
.hero { padding: 5rem 0 3rem; text-align: center; }
.hero h1 { font-size: clamp(2rem, 5vw, 4rem); font-weight: 900; letter-spacing: -0.05em; line-height: 1; text-transform: uppercase; }
.hero p { color: var(--muted); font-size: 1rem; margin-top: 1rem; font-weight: 500; }
.hero-btns { display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; flex-wrap: wrap; }
.btn-primary { background: var(--primary); color: #fff; padding: 0.875rem 2rem; border-radius: var(--radius); font-weight: 900; font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; border: none; cursor: pointer; transition: filter 0.2s; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-outline { background: transparent; color: var(--primary); border: 2px solid var(--primary); padding: 0.875rem 2rem; border-radius: var(--radius); font-weight: 900; font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; }

/* BANNERS */
.banners { padding: 2rem 0; }
.banner-slide { border-radius: calc(var(--radius) * 1.5); overflow: hidden; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; padding: 3rem 2.5rem; display: flex; align-items: center; justify-content: space-between; gap: 2rem; }
.banner-slide h2 { font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 900; letter-spacing: -0.04em; text-transform: uppercase; }
.banner-slide img { width: 200px; height: 200px; object-fit: cover; border-radius: 1rem; display: none; }

/* PRODUCTS */
.section-title { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.03em; text-transform: uppercase; margin-bottom: 1.5rem; }
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; padding: 1rem 0 3rem; }
.product-card { background: var(--card); border-radius: var(--radius); border: 1.5px solid var(--border); overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.product-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
.product-img { aspect-ratio: 1; background: var(--bg); overflow: hidden; display: flex; align-items: center; justify-content: center; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.product-img-placeholder { font-size: 3rem; opacity: 0.15; }
.product-info { padding: 1rem; }
.product-cat { font-size: 0.65rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem; }
.product-name { font-size: 0.95rem; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.product-footer { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.product-price { font-size: 1.1rem; font-weight: 900; }
.product-price span { font-size: 0.7rem; color: var(--muted); font-weight: 600; }
.add-to-cart { width: 36px; height: 36px; border-radius: 0.75rem; background: var(--primary); color: #fff; border: none; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: filter 0.2s; }
.add-to-cart:hover { filter: brightness(1.1); }
.quick-order { width: 36px; height: 36px; border-radius: 0.75rem; background: #059669; color: #fff; border: none; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* LOADING */
.loading { text-align: center; padding: 4rem; color: var(--muted); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; }

/* MODAL */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 1rem; }
.modal-overlay.open { display: flex; }
.modal { background: #fff; border-radius: calc(var(--radius) * 2); padding: 2.5rem; width: 100%; max-width: 440px; position: relative; box-shadow: 0 40px 80px rgba(0,0,0,0.2); }
.modal-close { position: absolute; top: 1.5rem; right: 1.5rem; background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 0.75rem; cursor: pointer; font-size: 1.2rem; }
.modal h3 { font-size: 1.5rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.04em; margin-bottom: 0.5rem; }
.modal p { color: var(--muted); font-size: 0.8rem; font-weight: 600; margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 0.4rem; }
.form-group input { width: 100%; height: 52px; border: 1.5px solid var(--border); border-radius: 0.875rem; padding: 0 1rem; font-size: 0.9rem; font-weight: 600; outline: none; transition: border-color 0.2s; font-family: inherit; }
.form-group input:focus { border-color: var(--primary); }
.modal-submit { width: 100%; height: 56px; background: #059669; color: #fff; border: none; border-radius: 0.875rem; font-weight: 900; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: filter 0.2s; margin-top: 1.5rem; }
.modal-submit:hover { filter: brightness(1.1); }
.toast { position: fixed; bottom: 2rem; right: 2rem; background: #0f172a; color: #fff; border-radius: 1rem; padding: 1rem 1.5rem; font-weight: 700; font-size: 0.8rem; z-index: 9999; transform: translateY(100px); opacity: 0; transition: all 0.3s; }
.toast.show { transform: translateY(0); opacity: 1; }

/* FOOTER */
footer { background: #0f172a; color: #fff; padding: 3rem 0; margin-top: 3rem; }
.footer-inner { display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; }
.footer-name { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.04em; text-transform: uppercase; }
.footer-muted { font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 600; letter-spacing: 0.05em; }

@media (max-width: 640px) {
  .nav-links { display: none; }
  .hero { padding: 3rem 0 2rem; }
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
  .banner-slide { padding: 2rem 1.5rem; }
}
`;

  const js = `
const SUPABASE_URL = '${SUPABASE_URL}';
const SUPABASE_KEY = '${SUPABASE_ANON_KEY}';
const STORE_SLUG = '${storeSlug}';

let store = null;
let products = [];
let cart = [];

async function api(path) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  return r.json();
}

async function postOrder(data) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/orders', {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  return r.json();
}

async function loadStore() {
  const data = await api('stores?slug=eq.' + STORE_SLUG + '&select=*&limit=1');
  store = data[0];
  if (!store) return;
  document.title = store.name;
  const el = document.getElementById('store-name');
  if (el) el.textContent = store.name;
  const hero = document.getElementById('hero-desc');
  if (hero && store.description) hero.textContent = store.description;
  loadBanners();
  loadProducts();
}

async function loadBanners() {
  if (!store) return;
  const banners = await api('banners?store_id=eq.' + store.id + '&select=*&order=created_at.desc&limit=5');
  const el = document.getElementById('banners-section');
  if (!el || !banners.length) { if(el) el.style.display='none'; return; }
  el.innerHTML = banners.map(b => \`
    <div class="banner-slide">
      <div>
        <p style="font-size:0.7rem;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;opacity:0.7;margin-bottom:0.5rem">\${b.subtitle || 'Aksiya'}</p>
        <h2>\${b.title || ''}</h2>
        \${b.cta_text ? '<a href="' + (b.cta_link || '#products') + '" class="btn-primary" style="margin-top:1.5rem;display:inline-block">' + b.cta_text + '</a>' : ''}
      </div>
      \${b.image ? '<img src="' + b.image + '" alt="' + (b.title||'') + '">' : ''}
    </div>\`).join('');
}

async function loadProducts() {
  if (!store) return;
  const data = await api('products?store_id=eq.' + store.id + '&select=*,images:product_images(*),category_obj:categories(*)&order=created_at.desc');
  products = data;
  renderProducts(products);
}

function renderProducts(list) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  if (!list.length) { grid.innerHTML = '<div class="loading">Mahsulotlar topilmadi</div>'; return; }
  grid.innerHTML = list.map(p => {
    const img = p.images && p.images[0] ? p.images[0].image : null;
    const imgHtml = img ? '<img src="' + img + '" alt="' + p.name + '" loading="lazy">' : '<div class="product-img-placeholder">📦</div>';
    const cat = p.category_obj && (p.category_obj.name_uz || p.category_obj.name) || '';
    return \`<div class="product-card" onclick="openQuickOrder('\${p.id}')">
      <div class="product-img">\${imgHtml}</div>
      <div class="product-info">
        \${cat ? '<div class="product-cat">' + cat + '</div>' : ''}
        <div class="product-name">\${p.name_uz || p.name || ''}</div>
        <div class="product-footer">
          <div class="product-price">\${(p.price||0).toLocaleString()} <span>UZS</span></div>
          <div style="display:flex;gap:6px">
            <button class="quick-order" onclick="event.stopPropagation();openQuickOrder('\${p.id}')" title="Tezkor Xarid">⚡</button>
          </div>
        </div>
      </div>
    </div>\`;
  }).join('');
}

// Quick Order Modal
function openQuickOrder(productId) {
  const p = products.find(x => x.id == productId);
  if (!p) return;
  window._qProduct = p;
  document.getElementById('qo-product-name').textContent = (p.name_uz || p.name || '');
  document.getElementById('qo-product-price').textContent = (p.price||0).toLocaleString() + ' UZS';
  document.getElementById('quick-order-modal').classList.add('open');
}
function closeQuickOrder() {
  document.getElementById('quick-order-modal').classList.remove('open');
}
async function submitQuickOrder() {
  const name = document.getElementById('qo-name').value.trim();
  const phone = document.getElementById('qo-phone').value.trim();
  if (!name || !phone) { alert("Ism va telefon raqam kiriting!"); return; }
  const btn = document.getElementById('qo-submit');
  btn.textContent = 'Yuborilmoqda...';
  btn.disabled = true;
  try {
    await postOrder({ store_id: store.id, customer_name: name, customer_phone: phone, delivery_type: 'pickup', delivery_address: 'Tezkor Xarid (1-bosish)', total: window._qProduct.price, status: 'pending' });
    closeQuickOrder();
    document.getElementById('qo-name').value = '';
    document.getElementById('qo-phone').value = '';
    showToast('✅ Buyurtmangiz qabul qilindi! Tez orada aloqaga chiqamiz.');
  } catch(e) { alert('Xatolik yuz berdi.'); }
  btn.textContent = '⚡ Sotib Olish';
  btn.disabled = false;
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}
window.addEventListener('DOMContentLoaded', loadStore);
`;

  const html = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${storeName}</title>
  <meta name="description" content="${storeName} - Online Do'kon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="main.css">
</head>
<body>

<nav>
  <div class="container nav-inner">
    <a href="/" class="nav-logo" id="store-name">${storeName}</a>
    <div class="nav-links">
      <a href="#products">Mahsulotlar</a>
    </div>
  </div>
</nav>

<main>
  <section class="hero container">
    <h1 id="store-name-hero">${storeName}</h1>
    <p id="hero-desc">Eng yaxshi mahsulotlarni topib oling</p>
    <div class="hero-btns">
      <a href="#products" class="btn-primary">Xarid qilish</a>
    </div>
  </section>

  <section class="banners container" id="banners-section"></section>

  <section class="container" id="products">
    <h2 class="section-title">Barcha Mahsulotlar</h2>
    <div class="products-grid" id="products-grid">
      <div class="loading">Yuklanmoqda...</div>
    </div>
  </section>
</main>

<footer>
  <div class="container footer-inner">
    <div class="footer-name" id="footer-name">${storeName}</div>
    <div class="footer-muted">© 2025 Barcha huquqlar himoyalangan</div>
  </div>
</footer>

<!-- Quick Order Modal -->
<div class="modal-overlay" id="quick-order-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeQuickOrder()">✕</button>
    <h3>⚡ Tezkor Xarid</h3>
    <p id="qo-product-name"></p>
    <p id="qo-product-price" style="font-size:1.2rem;font-weight:900;color:var(--primary);margin-bottom:1.5rem"></p>
    <div class="form-group">
      <label>Ismingiz</label>
      <input type="text" id="qo-name" placeholder="Sanjar Aliyev">
    </div>
    <div class="form-group">
      <label>Telefon raqam</label>
      <input type="tel" id="qo-phone" placeholder="+998 90 123-45-67">
    </div>
    <button class="modal-submit" id="qo-submit" onclick="submitQuickOrder()">⚡ Sotib Olish</button>
  </div>
</div>

<div class="toast" id="toast"></div>
<script src="products.js"></script>
</body>
</html>`;

  return {
    'index.html': html,
    'main.css': css,
    'products.js': js,
  };
}
