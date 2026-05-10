/* =============================================
   products.js  — Demo mahsulotlar + render
   =============================================
   Backend bilan ishlashda DEMO_PRODUCTS o'rniga
   API dan ma'lumot oling va renderProducts() ga
   uzating.
*/

const DEMO_PRODUCTS = [
  { id:1,  name:"Erkaklar sport krossovkasi",      price:890000,  oldPrice:1200000, discount:26, emoji:"👟", cat:"erkak",  rating:4.8, reviews:124 },
  { id:2,  name:"Ayollar yozgi ko'ylagi",           price:450000,  oldPrice:650000,  discount:31, emoji:"👗", cat:"ayol",   rating:4.9, reviews:87  },
  { id:3,  name:"Bolalar kombinezoni",              price:320000,  oldPrice:null,    discount:0,  emoji:"🧒", cat:"bola",   rating:4.7, reviews:43  },
  { id:4,  name:"Sport shimlar (uniseks)",          price:560000,  oldPrice:780000,  discount:28, emoji:"🩳", cat:"sport",  rating:4.6, reviews:201 },
  { id:5,  name:"Erkaklar klassik ko'ylagi",        price:720000,  oldPrice:null,    discount:0,  emoji:"👔", cat:"erkak",  rating:4.5, reviews:65  },
  { id:6,  name:"Ayollar sport to'plami",           price:980000,  oldPrice:1400000, discount:30, emoji:"🧘‍♀️", cat:"ayol", rating:5.0, reviews:18  },
  { id:7,  name:"Yangi: Bolalar krossovkasi 2024",  price:410000,  oldPrice:500000,  discount:18, emoji:"👟", cat:"yangi",  rating:4.9, reviews:5   },
  { id:8,  name:"Erkaklar hoodie",                  price:650000,  oldPrice:850000,  discount:24, emoji:"🧥", cat:"erkak",  rating:4.7, reviews:93  },
  { id:9,  name:"Ayollar sport boshi",              price:195000,  oldPrice:null,    discount:0,  emoji:"🧢", cat:"ayol",   rating:4.4, reviews:37  },
  { id:10, name:"Yangi: Uniseks yomg'irpo'sh",      price:1100000, oldPrice:1500000, discount:27, emoji:"🧣", cat:"yangi",  rating:4.8, reviews:11  },
  { id:11, name:"Bolalar qishki kurtka",            price:870000,  oldPrice:1100000, discount:21, emoji:"🧤", cat:"bola",   rating:4.6, reviews:29  },
  { id:12, name:"Sport ayollar krossovkasi",        price:760000,  oldPrice:990000,  discount:23, emoji:"👠", cat:"sport",  rating:4.7, reviews:156 },
];

let activeCat = 'all';

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const filtered = activeCat === 'all'
    ? products
    : products.filter(p => p.cat === activeCat);

  if (!filtered.length) {
    grid.innerHTML = `<p style="color:var(--text-3);grid-column:1/-1;padding:2rem 0">Mahsulot topilmadi</p>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const isFav = Favs.has(p.id);
    return `
    <div class="product-card" onclick="location.href='product.html?id=${p.id}'">
      <div class="product-img-wrap">
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:64px;background:var(--surface-2)">${p.emoji}</div>
        ${p.discount ? `<div class="product-discount-badge">-${p.discount}%</div>` : ''}
        <button
          class="product-fav-btn ${isFav ? 'active' : ''}"
          onclick="toggleFav(event, ${p.id})"
          data-fav-btn="${p.id}"
          aria-label="Sevimli"
        >${isFav ? '❤️' : '🤍'}</button>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-prices">
          <span class="product-price">${fmtPrice(p.price)}</span>
          ${p.oldPrice ? `<span class="product-old-price">${fmtPrice(p.oldPrice)}</span>` : ''}
        </div>
        <div class="product-rating">
          <span class="star">★</span>
          <span>${p.rating}</span>
          <span style="margin-left:2px">(${p.reviews} sharh)</span>
        </div>
        <button
          class="btn-add-cart"
          onclick="handleAddCart(event, ${p.id})"
        >🛒 Savatga qo'shish</button>
      </div>
    </div>`;
  }).join('');
}

function toggleFav(e, id) {
  e.stopPropagation();
  const added = Favs.toggle(id);
  const btn = document.querySelector(`[data-fav-btn="${id}"]`);
  if (btn) {
    btn.textContent = added ? '❤️' : '🤍';
    btn.classList.toggle('active', added);
  }
  showToast(added ? '❤️ Sevimlilarga qo\'shildi' : 'Sevimlilardan olib tashlandi');
}

function handleAddCart(e, id) {
  e.stopPropagation();
  const p = DEMO_PRODUCTS.find(x => x.id === id);
  if (p) addToCart(p);
}

/* Category filter */
function initCategoryFilter() {
  const list = document.getElementById('cat-list');
  if (!list) return;
  list.addEventListener('click', e => {
    const chip = e.target.closest('.cat-chip');
    if (!chip) return;
    list.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCat = chip.dataset.cat;
    renderProducts(DEMO_PRODUCTS);
  });
}

/* Search filter */
function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { renderProducts(DEMO_PRODUCTS); return; }
    renderProducts(DEMO_PRODUCTS.filter(p => p.name.toLowerCase().includes(q)));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderProducts(DEMO_PRODUCTS);
  initCategoryFilter();
  initSearch();
});
