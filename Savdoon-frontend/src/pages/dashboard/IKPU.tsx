import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  QrCode,
  Package,
  Info,
  Loader2,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ikpuApi, productApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
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
  const { t, language, currentStore } = useApp();
  const [ikpuList, setIkpuList] = useState<IKPU[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [code, setCode] = useState('');
  const [vatRate, setVatRate] = useState(12); // Default for Uzbekistan

  const loadData = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const [ikpuRes, prodRes] = await Promise.all([
        ikpuApi.list(currentStore.id),
        productApi.list({ store: currentStore.id, active: true })
      ]);
      setIkpuList(ikpuRes.data);
      setProducts(prodRes.data.results || prodRes.data || []);
    } catch (error) {
      console.error('Failed to load IKPU data:', error);
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
      await ikpuApi.create(currentStore.id, {
        product: selectedProduct,
        code,
        vat_rate: vatRate
      });
      setIsModalOpen(false);
      loadData();
      setSelectedProduct('');
      setCode('');
    } catch (error) {
      console.error('Failed to save IKPU:', error);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!currentStore?.id || !confirm(language === 'uz' ? "IKPU o'chirilsinmi?" : "Delete IKPU?")) return;
    try {
      await ikpuApi.delete(currentStore.id, id);
      loadData();
    } catch (error) {
      console.error('Failed to delete IKPU:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
            {language === 'uz' ? 'Fiskal Ma\'lumotlar (IKPU)' : 'Fiscal Data (IKPU)'}
          </h1>
          <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">
            {language === 'uz' ? "Mahsulotlaringiz uchun fiskal kodlarni boshqaring" : "Manage fiscal codes for your products"}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-emerald-500/10 bg-emerald-500 text-white">
          <Plus className="w-5 h-5" />
          {language === 'uz' ? "IKPU qo'shish" : 'Add IKPU'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ikpuList.length === 0 ? (
          <GlassCard className="p-20 text-center border-dashed border-2">
            <QrCode className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wide">Fiskal kodlar mavjud emas</h2>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">Elektron chek va fiskallashtirish uchun mahsulotlarga IKPU kodlarini biriktiring.</p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)} className="rounded-xl px-8 h-12">Yangi IKPU qo'shish</Button>
          </GlassCard>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-slate-50/50 border-b border-slate-100">
                 <tr>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Mahsulot</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">IKPU Kodi</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">QQS (%)</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amallar</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {ikpuList.map(ikpu => (
                   <tr key={ikpu.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                           <Package className="w-5 h-5" />
                         </div>
                         <div className="font-black text-slate-800 uppercase text-xs tracking-tight">{ikpu.product_name}</div>
                       </div>
                     </td>
                     <td className="px-8 py-6">
                       <code className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs tracking-widest border border-emerald-100/50">
                         {ikpu.code}
                       </code>
                     </td>
                     <td className="px-8 py-6">
                       <span className="text-xs font-black text-slate-700">{ikpu.vat_rate}%</span>
                     </td>
                     <td className="px-8 py-6 text-right">
                       <button 
                         onClick={() => handleDelete(ikpu.id)}
                         className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
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

      {/* Info Card */}
      <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 flex gap-6">
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
          <Info className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h5 className="font-black text-amber-900 text-sm uppercase tracking-wide mb-1">IKPU nima uchun kerak?</h5>
          <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
            O'zbekiston qonunchiligiga ko'ra, har bir mahsulot va xizmat uchun maxsus klassifikator kodi (IKPU) bo'lishi shart. To'g'ri ko'rsatilgan IKPU kodi fiskal cheklarni to'g'ri shakllanishini ta'minlaydi.
          </p>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-20 pb-20 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">IKPU qo'shish</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mahsulotni tanlang</label>
                  <select 
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full h-14 rounded-2xl bg-slate-50 border-slate-100 border px-6 font-bold text-sm outline-none focus:border-emerald-500/50 transition-all appearance-none"
                  >
                    <option value="">Tanlang...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">IKPU Kodi (17 xona)</label>
                  <Input 
                    value={code} 
                    onChange={setCode} 
                    placeholder="Masalan: 01103001001000000" 
                    className="!rounded-2xl !bg-slate-50 !border-slate-100 !h-14 font-bold tracking-widest"
                  />
                  <a href="https://tasnif.soliq.uz" target="_blank" className="text-[9px] font-black text-indigo-500 uppercase hover:underline ml-1">Kodni Tasnif portalidan topish →</a>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">QQS Stavkasi (%)</label>
                  <div className="flex gap-3">
                    {[0, 12].map(rate => (
                      <button 
                        key={rate}
                        onClick={() => setVatRate(rate)}
                        className={`flex-1 h-12 rounded-xl font-black transition-all ${vatRate === rate ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                         {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-10 bg-slate-50 flex items-center gap-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]">Bekor qilish</Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || !selectedProduct || !code}
                  className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Biriktirish"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
