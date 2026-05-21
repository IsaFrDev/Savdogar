const SUPABASE_URL = '{{SUPABASE_URL}}';
const SUPABASE_KEY = '{{SUPABASE_KEY}}';
const STORE_SLUG = '{{STORE_SLUG}}';

let store = null;
let products = [];
let cart = [];

async function api(path) {
  if (SUPABASE_URL.includes('{{')) return []; // prevent errors if placeholders aren't replaced
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
  if (SUPABASE_URL.includes('{{')) {
    // Template mode preview
    renderProducts([
      { id: 1, name: 'Test Mahsulot 1', price: 150000, category_obj: { name: 'Kiyim' } },
      { id: 2, name: 'Test Mahsulot 2', price: 200000, category_obj: { name: 'Elektronika' } }
    ]);
    return;
  }
  const data = await api('stores?slug=eq.' + STORE_SLUG + '&select=*&limit=1');
  store = data[0];
  if (!store) return;
  document.title = store.name;
  window.STORE_NAME = store.name;
  const el = document.getElementById('store-name');
  if (el) el.textContent = store.name;
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) heroTitle.textContent = store.name;
  const heroDesc = document.getElementById('hero-desc');
  if (heroDesc && store.description) heroDesc.textContent = store.description;
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
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}
window.addEventListener('DOMContentLoaded', loadStore);
