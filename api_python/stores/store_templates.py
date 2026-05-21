"""
AI Store Generator - Beautiful Store Templates
Generates professional storefront templates based on business type
"""

BASE_CSS = '''/* =============================================
   E-Commerce Template CSS
   Placeholder: {{PRIMARY_COLOR}}, {{STORE_NAME}}
   ============================================= */

@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap');

:root {
    --primary: {{PRIMARY_COLOR}};       
    --primary-dim: rgba(255, 92, 0, 0.15);
    --primary-border: rgba(255, 92, 0, 0.4);

    --bg: #0a0a0a;
    --bg-card: #161616;
    --bg-surface: #1a1a1a;

    --text: #ffffff;
    --text-muted: rgba(255, 255, 255, 0.6);
    --text-faint: rgba(255, 255, 255, 0.3);

    --border: rgba(255, 255, 255, 0.08);
    --border-hover: rgba(255, 255, 255, 0.15);

    --font-display: 'Unbounded', sans-serif;
    --font-body: 'DM Sans', sans-serif;

    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
    --radius-pill: 999px;

    --transition: 0.2s ease;
}

/* RESET */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; scroll-behavior: smooth; }
body { background: var(--bg); color: var(--text); font-family: var(--font-body); line-height: 1.6; }
a { color: inherit; text-decoration: none; }
button { font-family: var(--font-body); cursor: pointer; }
ul { list-style: none; }

/* TOP BAR */
.top-bar {
    background: var(--primary);
    color: #fff;
    text-align: center;
    padding: 7px 1rem;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.3px;
}

/* NAVBAR */
.navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    height: 68px;
    background: rgba(10, 10, 10, 0.96);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(12px);
}

.nav-logo {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.5px;
    white-space: nowrap;
}
.nav-logo .accent { color: var(--primary); }

.nav-links {
    display: flex;
    gap: 28px;
}
.nav-link {
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.2px;
    transition: color var(--transition);
}
.nav-link:hover { color: var(--text); }

.nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* BUTTONS */
.btn {
    padding: 9px 20px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    border: none;
    transition: all var(--transition);
    white-space: nowrap;
}
.btn-primary {
    background: var(--primary);
    color: #fff;
}
.btn-primary:hover { opacity: 0.88; }

.btn-outline {
    background: none;
    border: 1px solid var(--border-hover);
    color: var(--text);
}
.btn-outline:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); }

.btn-ghost {
    background: rgba(255,255,255,0.07);
    border: 1px solid var(--border-hover);
    color: var(--text);
}
.btn-ghost:hover { background: rgba(255,255,255,0.12); }

.icon-btn {
    background: none;
    border: 1px solid var(--border);
    color: var(--text);
    width: 38px; height: 38px;
    border-radius: var(--radius-sm);
    font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    transition: border-color var(--transition);
}
.icon-btn:hover { border-color: var(--border-hover); }

.cart-btn { position: relative; }
.cart-badge {
    position: absolute;
    top: -4px; right: -4px;
    background: var(--primary);
    color: #fff;
    width: 17px; height: 17px;
    border-radius: 50%;
    font-size: 9px;
    font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid var(--bg);
}

/* HERO */
.hero {
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5rem 2rem;
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #111 0%, #1a0a00 60%, #0d0d0d 100%);
}
.hero::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 92, 0, 0.18) 0%, transparent 70%);
    right: -100px; top: -150px;
    pointer-events: none;
}
.hero::after {
    content: '';
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 92, 0, 0.1) 0%, transparent 70%);
    left: -80px; bottom: -80px;
    pointer-events: none;
}

.hero-content {
    max-width: 560px;
    position: relative;
    z-index: 1;
}

.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--primary-dim);
    border: 1px solid var(--primary-border);
    color: #ff8040;
    padding: 5px 14px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 1.25rem;
    letter-spacing: 0.3px;
}

.hero-title {
    font-family: var(--font-display);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 700;
    line-height: 1.15;
    margin-bottom: 1rem;
    color: var(--text);
}
.hero-title em {
    color: var(--primary);
    font-style: normal;
}

.hero-subtitle {
    color: var(--text-muted);
    font-size: 15px;
    margin-bottom: 2rem;
    line-height: 1.65;
    max-width: 460px;
}

.hero-btns {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}
.hero-btns .btn { padding: 12px 28px; font-size: 14px; }

.hero-visual {
    flex: 1;
    max-width: 420px;
    min-height: 300px;
}

/* STATS BAR */
.stats-bar {
    display: flex;
    background: #141414;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
}
.stat-item {
    flex: 1;
    text-align: center;
    padding: 1.25rem 1rem;
    border-right: 1px solid var(--border);
}
.stat-item:last-child { border-right: none; }
.stat-num {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    color: var(--primary);
    line-height: 1;
}
.stat-label {
    font-size: 11px;
    color: var(--text-faint);
    margin-top: 4px;
    letter-spacing: 0.3px;
}

/* SECTIONS */
.section { padding: 2rem; }

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
}
.section-title {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
}
.section-link {
    font-size: 12px;
    color: var(--primary);
    transition: opacity var(--transition);
}
.section-link:hover { opacity: 0.7; }

/* CATEGORY CHIPS */
.categories {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}
.cat-chip {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    padding: 8px 18px;
    border-radius: var(--radius-pill);
    font-size: 13px;
    transition: all var(--transition);
}
.cat-chip:hover {
    border-color: var(--border-hover);
    color: var(--text);
}
.cat-chip.active {
    background: var(--primary-dim);
    border-color: var(--primary-border);
    color: #ff8040;
}

/* PRODUCTS GRID */
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
}

.product-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: border-color var(--transition), transform var(--transition);
}
.product-card:hover {
    border-color: var(--border-hover);
    transform: translateY(-2px);
}
.product-img {
    width: 100%;
    aspect-ratio: 4/5;
    object-fit: cover;
    background: var(--bg-surface);
}
.product-info { padding: 14px; }
.product-name { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
.product-price { font-family: var(--font-display); font-size: 15px; color: var(--primary); }
.product-price-old { font-size: 12px; color: var(--text-faint); text-decoration: line-through; margin-left: 6px; }
.product-badge {
    display: inline-block;
    background: var(--primary);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    margin-bottom: 8px;
}
.btn-add-cart {
    width: 100%;
    margin-top: 10px;
    padding: 9px;
    background: var(--primary);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font-body);
    cursor: pointer;
    transition: opacity var(--transition);
}
.btn-add-cart:hover { opacity: 0.85; }

/* PROMO BANNER */
.promo-banner {
    margin: 0 2rem 2rem;
    background: linear-gradient(135deg, var(--primary) 0%, #cc4400 100%);
    border-radius: var(--radius-lg);
    padding: 2.5rem 2rem;
    text-align: center;
}
.promo-banner h2 {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 0.5rem;
}
.promo-banner p {
    color: rgba(255,255,255,0.85);
    font-size: 14px;
    margin-bottom: 1.5rem;
}
.promo-banner strong {
    background: rgba(255,255,255,0.2);
    padding: 2px 10px;
    border-radius: 4px;
    font-family: var(--font-display);
    font-size: 13px;
    letter-spacing: 1px;
}
.promo-banner .btn-primary {
    background: #fff;
    color: var(--primary);
}

/* FOOTER */
.footer {
    background: #0d0d0d;
    border-top: 1px solid var(--border);
    padding: 2rem;
}
.footer-top {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
}
.footer-brand .nav-logo { font-size: 18px; margin-bottom: 0.75rem; }
.footer-desc { font-size: 13px; color: var(--text-faint); line-height: 1.65; max-width: 280px; }
.footer-links-group h4 {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 600;
    color: var(--text-faint);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 1rem;
}
.footer-links-group a {
    display: block;
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 8px;
    transition: color var(--transition);
}
.footer-links-group a:hover { color: var(--text); }

.footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 1rem;
}
.footer-bottom p { font-size: 12px; color: var(--text-faint); }
.footer-legal { display: flex; gap: 16px; }
.footer-legal a { font-size: 12px; color: var(--text-faint); transition: color var(--transition); }
.footer-legal a:hover { color: var(--text-muted); }

@media (max-width: 1024px) {
    .footer-top { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
    .navbar { padding: 0 1rem; }
    .nav-links { display: none; }
    .hero { padding: 3rem 1rem; flex-direction: column; }
    .hero-visual { display: none; }
    .stats-bar { flex-wrap: wrap; }
    .stat-item { flex: 0 0 50%; border-bottom: 1px solid var(--border); }
    .footer-top { grid-template-columns: 1fr; }
    .section { padding: 1.5rem 1rem; }
}'''

def get_base_html(store_name, hero_badge, hero_title, hero_subtitle, categories_html):
    return f'''<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{STORE_NAME}}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

    <!-- TOP ANNOUNCEMENT BAR -->
    <div class="top-bar">
        Bepul yetkazib berish — 200,000 so'mdan yuqori buyurtmalar uchun 🚀
    </div>

    <!-- NAVBAR -->
    <header class="navbar">
        <div class="nav-logo">{{STORE_NAME}}<span class="accent">.</span></div>

        <nav class="nav-links">
            <a href="#" class="nav-link">Katalog</a>
            <a href="#" class="nav-link">Aksiyalar</a>
            <a href="#" class="nav-link">Yangiliklar</a>
            <a href="#" class="nav-link">Do'konlar</a>
            <a href="#" class="nav-link">Aloqa</a>
        </nav>

        <div class="nav-actions">
            <button class="icon-btn" aria-label="Qidirish">🔍</button>
            <button class="icon-btn cart-btn" aria-label="Savat">
                🛒
                <span class="cart-badge">0</span>
            </button>
            <button class="btn btn-outline">Kirish</button>
        </div>
    </header>

    <!-- HERO BANNER -->
    <section class="hero">
        <div class="hero-content">
            <div class="hero-badge">{hero_badge}</div>
            <h1 class="hero-title">{hero_title}</h1>
            <p class="hero-subtitle">{hero_subtitle}</p>
            <div class="hero-btns">
                <button class="btn btn-primary">Xarid Qilish</button>
                <button class="btn btn-ghost">Kolleksiyani Ko'rish</button>
            </div>
        </div>
        <div class="hero-visual">
            <!-- Hero image/illustration goes here -->
        </div>
    </section>

    <!-- STATS BAR -->
    <div class="stats-bar">
        <div class="stat-item">
            <div class="stat-num">50K+</div>
            <div class="stat-label">Mamnun Mijozlar</div>
        </div>
        <div class="stat-item">
            <div class="stat-num">5000+</div>
            <div class="stat-label">Mahsulotlar</div>
        </div>
        <div class="stat-item">
            <div class="stat-num">30 min</div>
            <div class="stat-label">Yetkazib Berish</div>
        </div>
        <div class="stat-item">
            <div class="stat-num">4.9 ★</div>
            <div class="stat-label">Mijoz Bahosi</div>
        </div>
    </div>

    <!-- CATEGORIES -->
    <section class="section">
        <div class="section-header">
            <h2 class="section-title">Kategoriyalar</h2>
            <a href="#" class="section-link">Barchasi →</a>
        </div>
        <div class="categories">
            {categories_html}
        </div>
    </section>

    <!-- PRODUCTS SECTION -->
    <section class="section">
        <div class="section-header">
            <h2 class="section-title">Mashhur Mahsulotlar</h2>
            <a href="#" class="section-link">Barchasi →</a>
        </div>
        {{{{PRODUCTS_GRID}}}}
    </section>

    <!-- PROMO BANNER -->
    <section class="promo-banner">
        <div class="promo-content">
            <h2>Maxsus Taklif</h2>
            <p>Birinchi buyurtmangizga 15% chegirma. Promo kod: <strong>YANGI15</strong></p>
            <button class="btn btn-primary">Hozir Foydalanish</button>
        </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
        <div class="footer-top">
            <div class="footer-brand">
                <div class="nav-logo">{{STORE_NAME}}<span class="accent">.</span></div>
                <p class="footer-desc">O'zbekistonning eng yaxshi onlayn do'koni. Sifat va tezlik biz uchun muhim.</p>
            </div>
            <div class="footer-links-group">
                <h4>Do'kon</h4>
                <a href="#">Katalog</a>
                <a href="#">Aksiyalar</a>
                <a href="#">Yangi Mahsulotlar</a>
            </div>
            <div class="footer-links-group">
                <h4>Yordam</h4>
                <a href="#">Yetkazib Berish</a>
                <a href="#">Qaytarish</a>
                <a href="#">FAQ</a>
            </div>
            <div class="footer-links-group">
                <h4>Ijtimoiy Tarmoqlar</h4>
                <a href="#">Telegram</a>
                <a href="#">Instagram</a>
                <a href="#">YouTube</a>
            </div>
        </div>
        <div class="footer-bottom">
            <p>© 2024 {{STORE_NAME}}. Barcha huquqlar himoyalangan.</p>
            <div class="footer-legal">
                <a href="#">Maxfiylik Siyosati</a>
                <a href="#">Foydalanish Shartlari</a>
            </div>
        </div>
    </footer>

</body>
</html>'''

# Grocery Template
GROCERY_HTML = get_base_html(
    store_name="{{STORE_NAME}}",
    hero_badge="🥬 Yangi va Tabiiy",
    hero_title="Sifatli Oziq-ovqatlar — <em>Uyingizgacha</em>",
    hero_subtitle="Eng barra meva va sabzavotlar, kundalik mahsulotlar 30 daqiqada yetkazib beriladi.",
    categories_html='''<button class="cat-chip active">Barchasi</button>
            <button class="cat-chip">Mevalar</button>
            <button class="cat-chip">Sabzavotlar</button>
            <button class="cat-chip">Go'sht</button>
            <button class="cat-chip">Sut mahsulotlari</button>'''
)

# Clothing Template
CLOTHING_HTML = get_base_html(
    store_name="{{STORE_NAME}}",
    hero_badge="✨ Yangi Kolleksiya 2024",
    hero_title="Zamonaviy kiyimlar — <em>50% chegirma</em>",
    hero_subtitle="Eng so'nggi trendlar va eksklyuziv dizaynlar. Tezkor yetkazib berish, oson qaytarish.",
    categories_html='''<button class="cat-chip active">Barchasi</button>
            <button class="cat-chip">Erkaklar</button>
            <button class="cat-chip">Ayollar</button>
            <button class="cat-chip">Bolalar</button>
            <button class="cat-chip">Sport</button>'''
)

# Electronics Template
ELECTRONICS_HTML = get_base_html(
    store_name="{{STORE_NAME}}",
    hero_badge="💻 Top Brendlar",
    hero_title="So'nggi Texnologiyalar — <em>Eng Yaxshi Narxda</em>",
    hero_subtitle="Smartfonlar, noutbuklar va gadjetlar kafolat bilan. 12 oygacha muddatli to'lov.",
    categories_html='''<button class="cat-chip active">Barchasi</button>
            <button class="cat-chip">Telefonlar</button>
            <button class="cat-chip">Noutbuklar</button>
            <button class="cat-chip">Aksessuarlar</button>
            <button class="cat-chip">Texnika</button>'''
)

# Services Template
SERVICES_HTML = get_base_html(
    store_name="{{STORE_NAME}}",
    hero_badge="🛠 Professional Xizmat",
    hero_title="Sifatli Xizmatlar — <em>Ajoyib Narxlarda</em>",
    hero_subtitle="Bizning mutaxassislar sizga eng yaxshi xizmatni taklif etishadi. Hoziroq buyurtma bering.",
    categories_html='''<button class="cat-chip active">Barchasi</button>
            <button class="cat-chip">Konsultatsiya</button>
            <button class="cat-chip">Ta'mirlash</button>
            <button class="cat-chip">Go'zallik</button>
            <button class="cat-chip">Tozalash</button>'''
)


def get_template_for_business_type(business_type: str) -> dict:
    """Biznes turiga qarab do'kon shablonini olish."""
    business_type = business_type.lower()
    
    html = ELECTRONICS_HTML
    if business_type == 'grocery':
        html = GROCERY_HTML
    elif business_type == 'clothing':
        html = CLOTHING_HTML
    elif business_type == 'electronics':
        html = ELECTRONICS_HTML
    elif business_type == 'services':
        html = SERVICES_HTML

    return {
        'name': f'{business_type.capitalize()} Template',
        'primary_color': '#ff5c00',
        'secondary_color': '#cc4400',
        'accent_color': '#161616',
        'html': html,
        'css': BASE_CSS,
        'js': '''// Smooth scroll and interactivity
document.addEventListener("DOMContentLoaded", () => {
    console.log("Store template loaded successfully!");
});'''
    }


def generate_complete_store(store_name: str, business_type: str) -> dict:
    """Toliq do'kon shablonini (HTML, CSS, JS) yaratish"""
    template = get_template_for_business_type(business_type)
    
    return {
        'store_files': {
            'index.html': template['html'].replace('{{STORE_NAME}}', store_name),
            'css/style.css': template['css'].replace('{{STORE_NAME}}', store_name),
            'js/main.js': template['js']
        }
    }
