import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Navigation,
  Globe,
  Settings,
  Plus,
  Trash2,
  DollarSign,
  PackageCheck,
  Zap,
  Coffee
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function DeliverySettings() {
  const { t, language, currentStore, loadStores } = useApp();
  const [loading, setLoading] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState<any>(currentStore?.delivery_settings || {
    enabled: true,
    pickup_enabled: true,
    free_delivery_threshold: 100000,
    base_price: 15000,
    price_per_km: 2000,
    zones: []
  });

  const handleSave = async (newSettings?: any) => {
    const settingsToSave = newSettings || deliverySettings;
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      await supabaseApi.stores.update(currentStore.id, { delivery_settings: settingsToSave });
      await loadStores?.();
    } catch (error) {
      console.error('Failed to update delivery settings:', error);
    }
    setLoading(false);
  };

  const handleToggle = (key: string) => {
    const newSettings = { ...deliverySettings, [key]: !deliverySettings[key] };
    setDeliverySettings(newSettings);
    handleSave(newSettings);
  };

  const updateField = (key: string, value: any) => {
    setDeliverySettings({ ...deliverySettings, [key]: value });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
            {language === 'uz' ? 'Yetkazib Berish' : 'Delivery Settings'}
          </h1>
          <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">
            {language === 'uz' ? "Kuryer va yetkazib berish xizmati sozlamalari" : "Configure courier and delivery services"}
          </p>
        </div>
        <Button onClick={() => handleSave()} disabled={loading} className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Saqlash"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <GlassCard className="p-8 space-y-8 border-2 border-indigo-50 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-500"><Truck className="w-6 h-6" /></div>
                <div>
                   <h4 className="font-black text-slate-800 uppercase tracking-tight">Kuryer orqali yetkazish</h4>
                   <p className="text-[10px] font-bold text-slate-400">Enable courier delivery</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={deliverySettings.enabled} onChange={() => handleToggle('enabled')} className="sr-only peer" />
                <div className="w-12 h-6 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-all duration-300 pointer-events-auto" />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-500"><Coffee className="w-6 h-6" /></div>
                <div>
                   <h4 className="font-black text-slate-800 uppercase tracking-tight">Olib ketish (Self-pickup)</h4>
                   <p className="text-[10px] font-bold text-slate-400">Allow customers to pick up orders</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={deliverySettings.pickup_enabled} onChange={() => handleToggle('pickup_enabled')} className="sr-only peer" />
                <div className="w-12 h-6 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-all duration-300 pointer-events-auto" />
              </label>
            </div>
          </GlassCard>

          <GlassCard className="p-8 space-y-10 border-none bg-slate-50">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Narxlarni Sozlash</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asosiy narx (Base)</label>
                  <Input 
                    type="number"
                    value={deliverySettings.base_price}
                    onChange={(v) => updateField('base_price', parseInt(v))}
                    className="!rounded-2xl !bg-white !border-slate-100 !h-14 font-black"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">1 km uchun narx</label>
                  <Input 
                    type="number"
                    value={deliverySettings.price_per_km}
                    onChange={(v) => updateField('price_per_km', parseInt(v))}
                    className="!rounded-2xl !bg-white !border-slate-100 !h-14 font-black"
                  />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bepul yetkazish (min. summa)</label>
                  <Input 
                    type="number"
                    value={deliverySettings.free_delivery_threshold}
                    onChange={(v) => updateField('free_delivery_threshold', parseInt(v))}
                    className="!rounded-2xl !bg-white !border-slate-100 !h-14 font-black"
                  />
                  <p className="text-[9px] text-slate-400 font-medium ml-1">Mijoz shu summadan ko'p xarid qilsa, yetkazib berish bepul bo'ladi.</p>
                </div>
             </div>
          </GlassCard>
        </div>

        <div className="space-y-8">
           <GlassCard className="p-10 border-none bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
             <div className="relative z-10">
               <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-8 border border-white/10 shadow-xl group-hover:scale-105 transition-transform">
                  <Zap className="w-8 h-8 text-yellow-400" />
               </div>
               <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Express Yetkazib Berish</h3>
               <p className="text-sm font-medium text-slate-400 leading-relaxed mb-8">
                Yandex Go va boshqa yetkazib berish xizmatlari bilan integratsiyani yoqing. Bunda kuryerlar avtomatik chaqiriladi.
               </p>
               <Button className="w-full rounded-2xl h-14 bg-indigo-500 text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-indigo-400 shadow-xl shadow-indigo-500/20 border-none">
                 Yandex Go integratsiyasi (Tez kunda)
               </Button>
             </div>
           </GlassCard>

           <GlassCard className="p-8 border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center py-20 group">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm text-slate-300 group-hover:text-indigo-500 transition-colors">
                 <MapPin className="w-8 h-8" />
              </div>
              <h4 className="font-black text-slate-800 uppercase tracking-tight mb-2">Maxsus Zonalar</h4>
              <p className="text-xs font-bold text-slate-400 max-w-[200px] leading-relaxed mb-6 italic">Har bir rayon uchun alohida narx belgilang (Coming Soon)</p>
              <Button variant="outline" className="rounded-xl px-10 h-12 border-slate-200">Zona qo'shish</Button>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}
