import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  CreditCard, 
  Zap, 
  Check, 
  X, 
  Loader2, 
  ShieldCheck,
  TrendingUp,
  History,
  ArrowUpRight,
  Wallet,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storeApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';

export function TariffPlan() {
  const { t, language, currentStore, loadStores } = useApp();
  const [loading, setLoading] = useState(false);
  
  const expiryDate = currentStore?.subscription_expiry ? new Date(currentStore.subscription_expiry) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const plans = [
    {
      name: 'Starter',
      price: '150,000',
      period: 'moth',
      features: ['50 mahsulot', 'Telegram bot', 'Asosiy tahlil', 'Onlayn to\'lovlar'],
      recommend: false,
      color: 'bg-slate-100 text-slate-800'
    },
    {
      name: 'Business',
      price: '290,000',
      period: 'month',
      features: ['Cheksiz mahsulot', 'AI Tavsiyalar', 'Filiallar (3tagacha)', 'Kuryer boshqaruvi', 'Premium dizayn'],
      recommend: true,
      color: 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
    },
    {
      name: 'Enterprise',
      price: '990,000',
      period: 'month',
      features: ['Barcha imkoniyatlar', 'Cheksiz filiallar', 'Custom domen', 'Shaxsiy manager', 'API integratsiya'],
      recommend: false,
      color: 'bg-slate-900 text-white'
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
            {language === 'uz' ? 'Tarif va Balans' : 'Plan & Balance'}
          </h1>
          <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">
            {language === 'uz' ? "Do'koningiz balansi va xizmat muddati" : "Manage your store balance and subscription"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Status Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassCard className="p-8 border-none bg-indigo-600 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-8">
                   <div className="p-3 rounded-2xl bg-white/10 border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                      <Wallet className="w-6 h-6 text-indigo-100" />
                   </div>
                   <span className="px-3 py-1 rounded-full bg-indigo-500/50 text-indigo-50 text-[10px] font-black uppercase tracking-widest border border-white/10">Active</span>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Joriy Balans</p>
                 <div className="flex items-baseline gap-2 mb-8">
                    <h2 className="text-4xl font-black">{currentStore?.balance?.toLocaleString() || '0'}</h2>
                    <span className="text-sm font-black text-indigo-200">UZS</span>
                 </div>
                 <Button className="w-full rounded-2xl h-14 bg-white text-indigo-600 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-indigo-50 shadow-xl shadow-indigo-500/10">
                    <ArrowUpRight className="w-4 h-4" /> Balansni To'ldirish
                 </Button>
               </div>
            </GlassCard>

            <GlassCard className="p-8 border-2 border-slate-100 bg-white shadow-xl relative overflow-hidden flex flex-col justify-between">
               <div className="space-y-6">
                 <div className="flex items-center justify-between">
                   <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100"><Calendar className="w-6 h-6" /></div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                     {daysLeft} kun qoldi
                   </div>
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Amal qilish muddati</p>
                   <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                     {expiryDate?.toLocaleDateString() || 'Not set'}
                   </h3>
                 </div>
               </div>
               <div className="mt-8">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }} />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Info className="w-3 h-3" /> Tarifni o'z vaqtida uzaytirishni unutmang.
                  </p>
               </div>
            </GlassCard>
          </div>

          {/* History / Info */}
          <GlassCard className="p-10 border-2 border-indigo-50 bg-indigo-50/10">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600"><History className="w-6 h-6" /></div>
                <h4 className="font-black text-indigo-900 uppercase tracking-tight">To'lovlar Tarixi</h4>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-indigo-50 shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><Check className="w-5 h-5" /></div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Balansni to'ldirish</p>
                        <p className="text-[10px] font-bold text-slate-400">Click Up orqali • 10.03.2024</p>
                      </div>
                   </div>
                   <div className="text-sm font-black text-emerald-600">+150,000 UZS</div>
                </div>
                <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-indigo-50 shadow-sm opacity-60 grayscale-[0.5]">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><Zap className="w-5 h-5" /></div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Starter Tarifni uzaytirish</p>
                        <p className="text-[10px] font-bold text-slate-400">Balansdan yozildi • 01.03.2024</p>
                      </div>
                   </div>
                   <div className="text-sm font-black text-slate-600">-150,000 UZS</div>
                </div>
             </div>
          </GlassCard>
        </div>

        {/* Upgrade / Pricing Selection Row (simplified) */}
        <div className="space-y-6">
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Tarifni Yangilash</h3>
           {plans.map((plan, i) => (
             <GlassCard 
               key={plan.name}
               className={`p-8 border-2 transition-all relative ${plan.recommend ? 'border-indigo-500 shadow-2xl scale-[1.02] z-10' : 'border-slate-100'}`}
             >
                {plan.recommend && (
                  <div className="absolute top-4 right-4 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3 h-3" /> Tavsiya etiladi
                  </div>
                )}
                <h4 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-6">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-3xl font-black text-slate-800">{plan.price}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UZS / oy</span>
                </div>
                <div className="space-y-4 mb-8">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <Button className={`w-full rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] shadow-xl ${plan.recommend ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
                  {plan.name === 'Starter' ? 'Amaldagi Tarif' : 'O\'tish'}
                </Button>
             </GlassCard>
           ))}
        </div>
      </div>
    </div>
  );
}
