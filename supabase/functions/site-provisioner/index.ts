import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
}

const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600&display=swap');

:root {
  --primary: {{PRIMARY_COLOR}};
  --bg: #050505;
  --card: #0f0f0f;
  --text: #ffffff;
  --text-dim: rgba(255, 255, 255, 0.6);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { 
  background: var(--bg); 
  color: var(--text); 
  font-family: 'Plus Jakarta Sans', sans-serif; 
  line-height: 1.6;
  overflow-x: hidden;
}

.navbar { 
  height: 80px; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  padding: 0 5%;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo { 
  font-family: 'Unbounded', sans-serif; 
  font-weight: 700; 
  font-size: 1.5rem;
  letter-spacing: -1px;
}
.logo span { color: var(--primary); }

.hero { 
  padding: 120px 5% 80px; 
  text-align: center;
  position: relative;
}

.hero::before {
  content: '';
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 400px;
  background: radial-gradient(circle, {{PRIMARY_COLOR}}22 0%, transparent 70%);
  pointer-events: none;
}

.badge {
  display: inline-block;
  padding: 6px 16px;
  background: {{PRIMARY_COLOR}}15;
  border: 1px solid {{PRIMARY_COLOR}}33;
  color: var(--primary);
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

h1 { 
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(2rem, 5vw, 4rem); 
  line-height: 1.1;
  margin-bottom: 24px;
  font-weight: 700;
}

.hero p {
  color: var(--text-dim);
  max-width: 600px;
  margin: 0 auto 40px;
  font-size: 1.1rem;
}

.btn { 
  background: var(--primary); 
  color: #000; 
  padding: 18px 40px; 
  border-radius: 16px; 
  border: none; 
  cursor: pointer; 
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.3s ease;
}
.btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px {{PRIMARY_COLOR}}44; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
  padding: 40px 5%;
}

.product-card {
  background: var(--card);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.05);
  transition: all 0.3s ease;
}
.product-card:hover { border-color: {{PRIMARY_COLOR}}66; }

.product-img {
  width: 100%;
  height: 200px;
  background: #1a1a1a;
  border-radius: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}
`;

const TEMPLATES = {
  grocery: {
    badge: "🥬 Fresh & Natural",
    title: "Quality Groceries — <span>Uyingizgacha</span>",
    subtitle: "The freshest fruits and vegetables delivered in 30 minutes.",
    color: "#22c55e",
    emoji: "🍎"
  },
  clothing: {
    badge: "✨ New Collection 2024",
    title: "Modern Fashion — <span>50% Chegirma</span>",
    subtitle: "Latest trends and exclusive designs. Fast delivery, easy returns.",
    color: "#f97316",
    emoji: "👕"
  },
  electronics: {
    badge: "💻 Top Brands",
    title: "Latest Technology — <span>Eng Yaxshi Narx</span>",
    subtitle: "Smartphones, laptops, and gadgets with warranty. Installments available.",
    color: "#3b82f6",
    emoji: "📱"
  },
  restaurant: {
    badge: "🍕 Mazali Taomlar",
    title: "Sevimli Taomlar — <span>Tezkor Yetkazib Berish</span>",
    subtitle: "Issiq va mazali taomlar 45 daqiqada stolingizda.",
    color: "#ef4444",
    emoji: "🍕"
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { storeId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) throw new Error('Store not found');

    const type = store.business_type?.toLowerCase() || 'clothing';
    const template = TEMPLATES[type as keyof typeof TEMPLATES] || TEMPLATES.clothing;

    const html = `<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${store.name} | Bozorchi AI Storefront</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="navbar">
        <div class="logo">${store.name}<span>.</span></div>
        <div class="nav-links">🛒</div>
    </header>
    <section class="hero">
        <div class="badge">${template.badge}</div>
        <h1>${template.title}</h1>
        <p>${template.subtitle}</p>
        <button class="btn">Shop Now</button>
    </section>
    <div class="grid">
        <div class="product-card">
            <div class="product-img">${template.emoji}</div>
            <h3>Premium Product</h3>
            <p style="color: var(--text-dim); font-size: 0.9rem; margin: 8px 0;">Sifatli mahsulot siz uchun.</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
                <span style="font-weight: 700; color: var(--primary);">250,000 UZS</span>
                <span style="font-size: 0.8rem; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 8px;">Savatga</span>
            </div>
        </div>
        <div class="product-card">
            <div class="product-img">${template.emoji}</div>
            <h3>Special Edition</h3>
            <p style="color: var(--text-dim); font-size: 0.9rem; margin: 8px 0;">Eksklyuziv taklif faqat bugun.</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
                <span style="font-weight: 700; color: var(--primary);">450,000 UZS</span>
                <span style="font-size: 0.8rem; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 8px;">Savatga</span>
            </div>
        </div>
    </div>
</body>
</html>`;

    const css = BASE_CSS.replace(/{{PRIMARY_COLOR}}/g, store.primary_color || template.color);

    const storeFiles = {
      'index.html': html,
      'style.css': css,
      'main.js': `// ${store.name} Logic\ndocument.addEventListener('DOMContentLoaded', () => console.log('Storefront ready'));`
    };

    await supabase
      .from('stores')
      .update({ store_files: storeFiles, status: 'approved' })
      .eq('id', storeId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
});
