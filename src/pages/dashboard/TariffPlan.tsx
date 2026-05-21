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
  Calendar,
  Layers,
  Crown,
  ChevronRight,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GlassCard } from '../../components/GlassCard';

export function TariffPlan() {
  const { t, language, currentStore, formatPrice } = useApp();
  const [loading, setLoading] = useState(false);
  
  const expiryDate = currentStore?.subscription_expiry ? new Date(currentStore.subscription_expiry) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const plans = [
    {
      name: 'Starter',
      price: 150000,
      features: ['50 mahsulot', 'Telegram bot', 'Asosiy tahlil', 'Onlayn to\'lovlar'],
      recommend: false,
      color: 'indigo',
      icon: Zap
    },
    {
      name: 'Business',
      price: 290000,
      features: ['Cheksiz mahsulot', 'AI Tavsiyalar', 'Filiallar (3tagacha)', 'Kuryer boshqaruvi', 'Premium dizayn'],
      recommend: true,
      color: 'emerald',
      icon: Crown
    },
    {
      name: 'Enterprise',
      price: 990000,
      features: ['Barcha imkoniyatlar', 'Cheksiz filiallar', 'Custom domen', 'Shaxsiy manager', 'API integratsiya'],
      recommend: false,
      color: 'slate',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-1 bg-indigo-500 rounded-full" />
            <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Subscription</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-heading">
            {language === 'uz' ? 'Tarif va Balans' : 'Tariff & Balance'}
          </h1>
          <p className="text-slate-400 mt-2 uppercase tracking-[0.2em] text-[10px] font-black">
            {language === 'uz' ? "DO'KONINGIZ BALANSI VA XIZMAT MUDDATI" : "YOUR STORE BALANCE AND SUBSCRIPTION"}
          </p>
        </div>
        
        <button className="h-16 px-10 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
          <Plus size={18} /> {language === 'uz' ? 'Balansni To\'ldirish' : 'Top Up Balance'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Column: Balance & History */}
        <div className="xl:col-span-7 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Balance Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group h-full"
            >
              <GlassCard className="p-10 border-slate-200 bg-white h-full flex flex-col justify-between overflow-hidden rounded-[48px] border group-hover:border-indigo-500/30 transition-all duration-700 shadow-xl">
                <div className="absolute top-[-40px] right-[-20px] text-[160px] font-black text-slate-50 select-none pointer-events-none italic font-heading">
                   $
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xl">
                      <Wallet size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Current Balance</span>
                  </div>
                  <h2 className="text-6xl font-black text-slate-900 tracking-tighter mb-2 group-hover:text-indigo-600 transition-colors">
                    {formatPrice(currentStore?.balance || 0)}
                  </h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">UZBEKISTAN SOM (UZS)</p>
                </div>
                
                <div className="relative z-10 mt-12 flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-widest bg-emerald-500/10 w-fit px-6 py-3 rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Status: Active
                </div>
              </GlassCard>
            </motion.div>

            {/* Expiry Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative group h-full"
            >
              <GlassCard className="p-10 border-slate-200 bg-white h-full flex flex-col justify-between rounded-[48px] border group-hover:border-amber-500/30 transition-all duration-700 shadow-xl">
                <div className="absolute top-[-40px] right-[-20px] text-[160px] font-black text-slate-50 select-none pointer-events-none italic font-heading">
                   T
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-amber-500 transition-colors">
                      <Calendar size={24} />
                    </div>
                    <div className="px-5 py-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-[10px] font-black text-amber-500 uppercase tracking-widest shadow-2xl shadow-amber-500/10">
                      {daysLeft} days left
                    </div>
                  </div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Subscription Expiry</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase group-hover:text-amber-600 transition-colors">
                    {expiryDate?.toLocaleDateString() || 'Not Set'}
                  </h3>
                </div>

                <div className="relative z-10 mt-12">
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4 border border-slate-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }}
                      className="h-full bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                    />
                  </div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] leading-relaxed">
                    Ensure timely renewal to avoid service interruption.
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Transactions List */}
          <GlassCard className="border-slate-200 bg-white rounded-[48px] overflow-hidden shadow-xl">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-6">
                 <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                    <History size={28} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter font-heading">Payment History</h3>
               </div>
               <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors underline underline-offset-8 decoration-indigo-200">View All Transactions →</button>
            </div>
            <div className="p-10 space-y-6">
               <div className="flex items-center justify-between p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 group hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-700 cursor-pointer">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-emerald-500 border border-slate-200 shadow-sm">
                       <Plus size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1 group-hover:text-emerald-600 transition-colors">Balance Top Up</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Via Click / Payme • 10.03.2024</p>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 tracking-tighter">+150,000 UZS</div>
               </div>

               <div className="flex items-center justify-between p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 group hover:bg-rose-50 hover:border-rose-200 transition-all duration-700 cursor-pointer">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-rose-500 border border-slate-200 shadow-sm">
                       <ArrowUpRight size={24} className="rotate-90" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1 group-hover:text-rose-600 transition-colors">Starter Plan Renewal</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto Debit • 01.03.2024</p>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-rose-600 tracking-tighter">-150,000 UZS</div>
               </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Plans */}
        <div className="xl:col-span-5 space-y-10">
           <div className="flex items-center gap-6 px-4">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] whitespace-nowrap">Upgrade Subscription</span>
              <div className="h-px bg-white/5 flex-1" />
           </div>

           <div className="space-y-8">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                  <GlassCard className={`relative p-12 rounded-[56px] border transition-all duration-700 overflow-hidden ${
                    plan.recommend 
                      ? 'bg-indigo-600 border-indigo-700 shadow-2xl scale-[1.02] z-10' 
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xl'
                  }`}>
                    {plan.recommend && (
                      <div className="absolute top-[-30px] right-[-20px] text-[180px] font-black text-white/[0.1] select-none pointer-events-none italic font-heading">
                        ☆
                      </div>
                    )}

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-10">
                        <div>
                          <h4 className={`text-4xl font-black tracking-tighter uppercase font-heading transition-colors ${plan.recommend ? 'text-white' : 'text-slate-900 group-hover:text-indigo-600'}`}>
                            {plan.name}
                          </h4>
                          <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-3 ${plan.recommend ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {plan.recommend ? 'Most Popular Choice' : 'Simplified Solution'}
                          </p>
                        </div>
                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border shadow-xl transition-all duration-700 ${plan.recommend ? 'bg-white text-indigo-600 border-white' : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200'}`}>
                          <plan.icon size={32} />
                        </div>
                      </div>

                      <div className="flex items-baseline gap-3 mb-10">
                        <span className={`text-5xl font-black tracking-tighter ${plan.recommend ? 'text-white' : 'text-slate-900'}`}>
                          {plan.price.toLocaleString()}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${plan.recommend ? 'text-indigo-200' : 'text-slate-400'}`}>
                          UZS / MONTH
                        </span>
                      </div>

                      <div className="space-y-5 mb-12">
                        {plan.features.map(f => (
                          <div key={f} className="flex items-center gap-5">
                             <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${plan.recommend ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                <Check size={14} strokeWidth={4} />
                             </div>
                             <span className={`text-xs font-black uppercase tracking-widest transition-colors ${plan.recommend ? 'text-white/80 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                {f}
                             </span>
                          </div>
                        ))}
                      </div>

                      <button className={`w-full h-18 py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-700 flex items-center justify-center gap-4 ${
                        plan.recommend 
                          ? 'bg-white text-indigo-600 shadow-xl hover:scale-[1.03]' 
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}>
                         {plan.name === 'Starter' ? 'Current Active Plan' : 'Select Plan'} <ArrowRight size={18} />
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
