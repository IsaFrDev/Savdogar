import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  QrCode,
  Package,
  Info,
  Loader2,
  X,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

interface IKPU {
  id: number;
  product_id: number;
  product_name: string;
  code: string;
  vat_rate: number;
  package_code?: string;
}

export function IKPU() {
  const { language, currentStore } = useApp();
  const [ikpuList, setIkpuList] = useState<IKPU[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [code, setCode] = useState('');
  const [vatRate, setVatRate] = useState(12);

  const loadData = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const [ikpuData, prodData] = await Promise.all([
        supabaseApi.ikpu.list(currentStore.id),
        supabaseApi.products.list(currentStore.id)
      ]);
      setIkpuList(ikpuData);
      setProducts(prodData || []);
    } catch (error) {
      console.error('Failed to load IKPU data from Supabase:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentStore?.id]);

  const handleSave = async () => {
    if (!currentStore?.id || !selectedProduct) return;
    setIsSaving(true);
    try {
      await supabaseApi.ikpu.create(currentStore.id, {
        product_id: parseInt(selectedProduct),
        code,
        vat_rate: vatRate
      });
      setIsModalOpen(false);
      loadData();
      setSelectedProduct('');
      setCode('');
    } catch (error) {
      console.error('Failed to save IKPU to Supabase:', error);
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -m-12 p-12 space-y-12">
      {/* Header Realization from Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase font-heading">
            FISKAL MA'LUMOTLAR (IKPU)
          </h1>
          <p className="text-slate-500 mt-2 uppercase tracking-[0.2em] text-[10px] font-black">
            MAHSULOTLARINGIZ UCHUN FISKAL KODLARNI BOSHQARING
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="rounded-2xl h-16 px-10 font-black uppercase tracking-[0.2em] text-[11px] flex items-center gap-4 shadow-2xl shadow-indigo-500/20 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[3px]" />
          IKPU QO'SHISH
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative">
        {ikpuList.length === 0 ? (
          <div className="bg-slate-50/50 rounded-[48px] border-2 border-slate-100 p-24 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 pointer-events-none" />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10"
            >
              <div className="w-32 h-32 rounded-[40px] bg-white shadow-2xl shadow-slate-200 flex items-center justify-center mx-auto mb-10 group-hover:rotate-12 transition-transform duration-700 p-8">
                <QrCode className="w-full h-full text-slate-200 stroke-[1.5px]" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter font-heading">FISKAL KODLAR MAVJUD EMAS</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-12 font-bold text-sm leading-relaxed uppercase tracking-wide opacity-70">
                Elektron chek va fiskallashtirish uchun mahsulotlarga IKPU kodlarini biriktiring.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="rounded-[24px] px-10 py-5 border-2 border-indigo-500/30 text-indigo-600 font-black uppercase tracking-[0.2em] text-[11px] hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all shadow-xl shadow-indigo-500/5"
              >
                Yangi IKPU qo'shish
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-100 border border-slate-100 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mahsulot</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">IKPU Kodi</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">QQS (%)</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ikpuList.map(ikpu => (
                    <tr key={ikpu.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm">
                            <Package className="w-6 h-6" />
                          </div>
                          <div className="font-black text-slate-900 uppercase text-sm tracking-tight">{ikpu.product_name}</div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <code className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xs tracking-[0.2em] border border-emerald-100/50">
                          {ikpu.code}
                        </code>
                      </td>
                      <td className="px-10 py-8">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-[10px] font-black text-slate-700 uppercase tracking-widest">{ikpu.vat_rate}% QQS</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button 
                          onClick={() => {}} // Handle delete
                          className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Info Card - Exactly as in screenshot */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-10 rounded-[40px] bg-amber-50/50 border border-amber-100/50 flex flex-col sm:flex-row items-center gap-8"
      >
        <div className="w-20 h-20 rounded-[28px] bg-white shadow-xl shadow-amber-500/5 flex items-center justify-center shrink-0 border border-amber-100/30">
          <Info className="w-8 h-8 text-amber-500" strokeWidth={2.5} />
        </div>
        <div>
          <h5 className="font-black text-amber-900 text-lg uppercase tracking-tighter mb-2">IKPU NIMA UCHUN KERAK?</h5>
          <p className="text-sm text-amber-800/80 leading-relaxed font-bold uppercase tracking-tight opacity-70">
            O'zbekiston qonunchiligiga ko'ra, har bir mahsulot va xizmat uchun maxsus klassifikator kodi (IKPU) bo'lishi shart. To'g'ri ko'rsatilgan IKPU kodi fiskal cheklarni to'g'ri shakllanishini ta'minlaydi.
          </p>
        </div>
      </motion.div>

      {/* Modal Overhaul */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-[48px] shadow-2xl relative z-10 overflow-hidden border border-white/20"
            >
              <div className="p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter font-heading">IKPU qo'shish</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Yangi fiskal kodni biriktirish</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-12 space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Mahsulotni tanlang</label>
                  <select 
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full h-16 rounded-[24px] bg-slate-50 border-slate-100 border px-8 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none uppercase tracking-tight"
                  >
                    <option value="">Tanlang...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">IKPU Kodi (17 xona)</label>
                    <a href="https://tasnif.soliq.uz" target="_blank" className="text-[9px] font-black text-indigo-500 uppercase hover:underline flex items-center gap-1"><Sparkles size={10} /> Tasnif portalidan topish</a>
                  </div>
                  <input 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    placeholder="01103001001000000" 
                    className="w-full h-16 rounded-[24px] bg-slate-50 border-slate-100 border px-8 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all tracking-[0.3em]"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">QQS Stavkasi (%)</label>
                  <div className="flex gap-4">
                    {[0, 12].map(rate => (
                      <button 
                        key={rate}
                        onClick={() => setVatRate(rate)}
                        className={`flex-1 h-16 rounded-[24px] font-black text-sm transition-all ${vatRate === rate ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                         {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-12 bg-slate-50/50 flex items-center gap-6">
                <button 
                  onClick={handleSave} 
                  disabled={isSaving || !selectedProduct || !code}
                  className="w-full h-16 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Biriktirish"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
