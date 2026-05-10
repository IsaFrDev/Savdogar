const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const SITES_DIR = path.join(__dirname, '../sites');

async function syncSites() {
  console.log('🚀 Starting Sites Sync...');

  // Get all stores with generated files
  const { data: stores, error } = await supabase
    .from('stores')
    .select('slug, name, store_files')
    .not('store_files', 'is', null);

  if (error) {
    console.error('Error fetching stores:', error);
    return;
  }

  for (const store of stores) {
    const storeDir = path.join(SITES_DIR, store.slug);
    
    if (!fs.existsSync(storeDir)) {
      console.log(`📁 Creating directory for ${store.name} (${store.slug})...`);
      fs.mkdirSync(storeDir, { recursive: true });
    }

    const files = store.store_files;
    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(storeDir, filename);
      const dirPath = path.dirname(filePath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      console.log(`📝 Writing ${filename}...`);
      fs.writeFileSync(filePath, content);
    }
  }

  console.log('✅ Sync Complete!');
}

syncSites();
