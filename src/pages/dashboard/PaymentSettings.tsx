import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  DollarSign, 
  Wallet, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  Lock,
  Smartphone,
  ShieldCheck,
  Building,
  CreditCard as CardIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
  type: 'manual' | 'automatic';
  description: string;
}

export function PaymentSettings() {
  const { t, language, currentStore, loadStores } = useApp();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, boolean>>(currentStore?.payment_methods || {
    cash: true,
    card: true,
    click: false,
    payme: false,
    uzum: false
  });

  const handleToggle = async (method: string) => {
    const newMethods = { ...paymentMethods, [method]: !paymentMethods[method] };
    setPaymentMethods(newMethods);
    if (!currentStore?.id) return;
    try {
      await supabaseApi.stores.update(currentStore.id, { payment_methods: newMethods });
      loadStores?.();
    } catch (error) {
      console.error('Failed to update payment methods:', error);
    }
  };

  const methods = [
    { 
      id: 'cash', 
      name: language === 'uz' ? 'Naqd pul' : 'Cash', 
      icon: DollarSign, 
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      description: language === 'uz' ? "Mijoz buyurtmani olishda naqd pul to'laydi." : "Customer pays cash upon delivery/pickup."
    },
    { 
      id: 'card', 
      name: language === 'uz' ? 'Terminal (Karta)' : 'Terminal (Card)', 
      icon: CreditCard, 
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      description: language === 'uz' ? "Olish paytida karta orqali to'lov (terminal)." : "Payment via card terminal upon receipt."
    },
    { 
      id: 'click', 
      name: 'Click Up', 
      icon: Smartphone, 
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      description: language === 'uz' ? "Click tizimi orqali onlayn to'lov." : "Online payment via Click system."
    },
    { 
      id: 'payme', 
      name: 'Payme', 
      icon: Wallet, 
      color: 'bg-teal-50 text-teal-600 border-teal-100',
      description: language === 'uz' ? "Payme tizimi orqali onlayn to'lov." : "Online payment via Payme system."
    },
    { 
      id: 'uzum', 
      name: 'Uzum Bank', 
      icon: Building, 
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      description: language === 'uz' ? "Uzum tizimi orqali onlayn to'lov." : "Online payment via Uzum system."
    },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
            {language === 'uz' ? 'To\'lov Sozlamalari' : 'Payment Settings'}
          </h1>
          <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">
            {language === 'uz' ? "Mijozlar uchun to'lov usullarini yoqing" : "Enable payment methods for your customers"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Mavjud To'lov Usullari</h3>
          {methods.map((method) => (
            <GlassCard 
              key={method.id} 
              className={`p-6 transition-all border-2 ${paymentMethods[method.id] ? 'border-indigo-100 scale-[1.01]' : 'border-transparent opacity-80'}`}
            >
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${method.color}`}>
                    <method.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{method.name}</h4>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-relaxed">{method.description}</p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={paymentMethods[method.id]} 
                    onChange={() => handleToggle(method.id)}
                    className="sr-only peer" 
                  />
                  <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
                </label>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="space-y-8">
          <GlassCard className="p-10 border-none bg-slate-900 text-white shadow-2xl overflow-hidden relative">
            <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-8 border border-white/10 shadow-xl">
                 <ShieldCheck className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Onlayn To'lovlarni Ulanish</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed mb-8">
                Click, Payme va boshqa tizimlarni to'liq avtomatik rejimda ulanish uchun "Hujjatlar" bo'limidan foydalaning. Bu mijozlarga karta orqali to'lov yuborish imkonini beradi.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Xavfsiz tranzaksiyalar</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Avtomatik xabar berish</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Xizmat haqi - 0% (Bozorchi AI tomonidan)</span>
                </div>
              </div>
              <Button className="w-full mt-10 rounded-2xl h-14 bg-white text-slate-900 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-100">
                <Lock className="w-4 h-4" /> Merchant ID ni sozlash
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-10 border-2 border-indigo-50/50 bg-white space-y-6">
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Muhim ma'lumot
            </h4>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                Agar siz onlayn to'lov tizimlarining bitimini (merchant) sozlasangiz, bizning tizim avtomatik ravishda to'langan buyurtmalarni statusini "To'langan"ga o'zgartiradi.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
