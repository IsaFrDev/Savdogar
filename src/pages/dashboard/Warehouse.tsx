import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  ArrowUpRight, 
  TrendingUp, 
  AlertTriangle, 
  Filter, 
  MoreVertical,
  Download,
  Check,
  X,
  Loader2,
  RefreshCw,
  Box,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  category_name: string;
  speed?: string; // e.g., "fast", "medium", "slow"
  margin?: number;
}

export function Warehouse() {
  const { t, language, currentStore } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdjusting, setIsAdjusting] = useState<number | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState(0);

  const loadInventory = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      // In a real app, this might be a specialized inventory endpoint.
      // Here we use the product list and supplement with margin/speed logic.
      const res = await supabaseApi.products.list({ store: currentStore.id });
      const productData = res.data.results || res.data || [];
      
      const inventoryData = productData.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || `SKU-${p.id}`,
        price: p.price,
        cost_price: p.cost_price || p.price * 0.7, // Placeholder logic
        stock: p.stock_quantity || 0,
        category_name: p.category_name || 'Uncategorized',
        margin: p.price > 0 ? ((p.price - (p.cost_price || p.price * 0.7)) / p.price * 100) : 0,
        speed: (p.stock_quantity || 0) < 5 ? 'slow' : 'medium' // Placeholder
      }));
      
      setItems(inventoryData);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInventory();
  }, [currentStore?.id]);

  const handleAdjustStock = async (id: number, type: 'add' | 'subtract' | 'set') => {
    try {
      await supabaseApi.inventory.updateStock(id, adjustmentValue, type);
      setIsAdjusting(null);
      setAdjustmentValue(0);
      loadInventory();
    } catch (error) {
      console.error('Stock adjustment failed:', error);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
            {language === 'uz' ? 'Ombor Boshqaruvi' : 'Warehouse Management'}
          </h1>
          <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">
            {language === 'uz' ? "Mahsulot qoldiqlari va tannarx tahlili" : "Stock levels and cost-benefit analysis"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] hidden md:flex items-center gap-2">
            <Download className="w-4 h-4" /> {language === 'uz' ? 'Eksport' : 'Export'}
          </Button>
          <Button onClick={loadInventory} className="rounded-xl h-12 w-12 flex items-center justify-center bg-slate-100 text-slate-600 border border-slate-200">
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-500"><Box className="w-5 h-5" /></div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jami mahsulotlar</p>
          <p className="text-2xl font-black text-slate-800">{items.length}</p>
        </GlassCard>

        <GlassCard className="p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-500"><AlertTriangle className="w-5 h-5" /></div>
            <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Crisis</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kam qolganlar</p>
          <p className="text-2xl font-black text-slate-800">{items.filter(i => i.stock < 5).length}</p>
        </GlassCard>

        <GlassCard className="p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-500"><DollarSign className="w-5 h-5" /></div>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">O'rtacha Marja</p>
          <p className="text-2xl font-black text-slate-800">
            {(items.reduce((acc, i) => acc + (i.margin || 0), 0) / (items.length || 1)).toFixed(1)}%
          </p>
        </GlassCard>

        <GlassCard className="p-6 border-l-4 border-l-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600"><Package className="w-5 h-5" /></div>
            <span className="text-[10px] font-black text-slate-500">Total</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Umumiy qoldiq qiymati</p>
          <p className="text-2xl font-black text-slate-800">
            {items.reduce((acc, i) => acc + (i.stock * i.cost_price), 0).toLocaleString()} UZS
          </p>
        </GlassCard>
      </div>

      {/* Filter & Search */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500/30 transition-all font-bold text-sm"
            placeholder={language === 'uz' ? "Mahsulot nomi yoki SKU bo'yicha qidirish..." : "Search by product name or SKU..."}
          />
        </div>
        <Button variant="outline" className="rounded-2xl h-12 px-6 flex items-center gap-2 border-slate-200">
          <Filter className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
        </Button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Mahsulot</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tannarx (UZS)</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Narx (UZS)</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Marja</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Qoldiq</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-slate-800 uppercase text-xs tracking-tight mb-0.5">{item.name}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-xs font-black text-slate-600">{item.cost_price.toLocaleString()}</td>
                <td className="px-8 py-6 text-xs font-black text-slate-800">{item.price.toLocaleString()}</td>
                <td className="px-8 py-6">
                   <div className={`p-1.5 rounded-lg w-fit text-[9px] font-black uppercase tracking-widest ${item.margin && item.margin > 30 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                     {item.margin?.toFixed(1)}%
                   </div>
                </td>
                <td className="px-8 py-6">
                  {isAdjusting === item.id ? (
                    <div className="flex items-center gap-2 bg-indigo-50 p-1.5 rounded-xl border border-indigo-100">
                      <input 
                        type="number" 
                        autoFocus
                        value={adjustmentValue}
                        onChange={(e) => setAdjustmentValue(parseInt(e.target.value))}
                        className="w-16 h-8 bg-white border-none rounded-lg text-xs font-black text-center outline-none"
                      />
                      <button onClick={() => handleAdjustStock(item.id, 'add')} className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setIsAdjusting(null)} className="w-8 h-8 rounded-lg bg-white text-slate-400 flex items-center justify-center border border-slate-100"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-black ${item.stock < 10 ? 'text-amber-500' : 'text-slate-800'}`}>
                        {item.stock} dona
                      </span>
                      <button 
                        onClick={() => {
                          setIsAdjusting(item.id);
                          setAdjustmentValue(0);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-3 text-slate-300 hover:text-slate-600 transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
