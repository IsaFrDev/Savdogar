import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  MessageSquare, 
  Mail, 
  Megaphone, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Info,
  X,
  Send,
  Zap,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Campaign {
  id: number;
  name: string;
  campaign_type: string;
  trigger_type: string;
  status: string;
  subject: string;
  message: string;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  converted_count: number;
  revenue_generated: string;
  created_at: string;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

export function MarketingCampaigns() {
  const { formatPrice } = useApp();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    campaign_type: 'email',
    trigger_type: 'manual',
    subject: '',
    message: ''
  });

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const handleCreateCampaign = () => {
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Kampaniyalar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -m-12 p-12 space-y-12 text-slate-900">
      {/* Marketing Header from Screenshot */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase font-heading">
            Marketing Kampaniyalari
          </h1>
          <p className="text-slate-500 mt-2 uppercase tracking-[0.2em] text-[10px] font-black">
            MIJOZLARINGIZ BILAN ALOQANI MUSTAHKAMLANG
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => {}} 
            className="rounded-2xl h-16 px-8 font-black uppercase tracking-[0.2em] text-[11px] flex items-center gap-3 shadow-2xl shadow-indigo-500/20 bg-indigo-600 text-white hover:scale-105 active:scale-95 transition-all"
          >
            <MessageSquare className="w-5 h-5 stroke-[2.5px]" />
            SMS KAMPANIYA
          </button>
          <button 
            onClick={() => {}} 
            className="rounded-2xl h-16 px-8 font-black uppercase tracking-[0.2em] text-[11px] flex items-center gap-3 shadow-2xl shadow-amber-500/20 bg-amber-500 text-white hover:scale-105 active:scale-95 transition-all"
          >
            <Mail className="w-5 h-5 stroke-[2.5px]" />
            EMAIL KAMPANIYA
          </button>
        </div>
      </div>

      {/* Main Campaign Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Campaigns List or Empty State */}
        <div className="lg:col-span-8">
          {campaigns.length === 0 ? (
            <div className="bg-slate-50/50 rounded-[48px] border-2 border-slate-100 p-24 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 pointer-events-none" />
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10"
              >
                <div className="w-32 h-32 rounded-[40px] bg-white shadow-2xl shadow-slate-200 flex items-center justify-center mx-auto mb-10 group-hover:-rotate-12 transition-transform duration-700 p-8">
                  <Megaphone className="w-full h-full text-slate-200 stroke-[1.5px]" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter font-heading">KAMPANIYALAR MAVJUD EMAS</h2>
                <p className="text-slate-500 max-w-sm mx-auto mb-12 font-bold text-sm leading-relaxed uppercase tracking-wide opacity-70">
                  Mijozlarga yangiliklar, aksiyalar va chegirmalar haqida xabar yuborishni boshlang.
                </p>
                <button 
                  onClick={() => setShowCreateForm(true)} 
                  className="rounded-[24px] px-12 py-6 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/20 flex items-center gap-3 mx-auto"
                >
                  <Plus size={18} strokeWidth={3} /> Yangi kampaniya yaratish
                </button>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Campaign cards would go here if they existed */}
            </div>
          )}
        </div>

        {/* Info & Insights Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Info Card - Exact from screenshot */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="p-10 rounded-[40px] bg-indigo-50/50 border border-indigo-100/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
               <Zap size={80} className="text-indigo-600" />
            </div>
            <div className="w-16 h-16 rounded-[24px] bg-white shadow-xl shadow-indigo-500/5 flex items-center justify-center mb-8 border border-indigo-100/30">
              <Info className="w-6 h-6 text-indigo-600" strokeWidth={3} />
            </div>
            <h5 className="font-black text-indigo-900 text-xl uppercase tracking-tighter mb-4 leading-none">MARKETING NIMA UCHUN KERAK?</h5>
            <p className="text-sm text-indigo-800/80 leading-relaxed font-bold uppercase tracking-tight opacity-70">
              Marketing orqali siz mijozlar bazasini kengaytirishingiz, sotuvlarni oshirishingiz va o'z brendingizni taniqli qilishingiz mumkin. Savdogar platformasi sizga eng samarali marketing vositalarini taqdim etadi.
            </p>
          </motion.div>

          {/* Quick Stats Card */}
          <div className="bg-slate-900 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <h4 className="text-white font-black uppercase tracking-widest text-xs">Mijozlar Bazasi</h4>
                <Users className="text-indigo-400" size={20} />
             </div>
             <div className="space-y-6">
                <div className="flex justify-between items-end">
                   <div>
                      <div className="text-4xl font-black text-white tracking-tighter">1,284</div>
                      <div className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">Faol mijozlar</div>
                   </div>
                   <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                      <TrendingUp size={14} /> +12%
                   </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 w-[65%]" />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Modal - Premium Overhaul */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateForm(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="w-full max-w-2xl bg-white rounded-[48px] shadow-2xl relative z-10 overflow-hidden border border-white/20"
            >
              <div className="p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter font-heading">Yangi kampaniya</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">MIJOZLARINGIZ UCHUN MAXSUS TAKLIF</p>
                </div>
                <button onClick={() => setShowCreateForm(false)} className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="w-6 h-6" strokeWidth={3} />
                </button>
              </div>

              <div className="p-12 space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Kampaniya turi</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['email', 'sms'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setNewCampaign({ ...newCampaign, campaign_type: type })}
                        className={`h-20 rounded-[28px] font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 border-2 ${newCampaign.campaign_type === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                         {type === 'email' ? <Mail size={18} /> : <MessageSquare size={18} />}
                         {type} KAMPANIYA
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Kampaniya nomi</label>
                  <input 
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    className="w-full h-16 rounded-[24px] bg-slate-50 border-slate-100 border px-8 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase tracking-tight"
                    placeholder="Masalan: Yozgi chegirmalar 2024"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Xabar matni</label>
                  <textarea 
                    rows={4}
                    value={newCampaign.message}
                    onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                    className="w-full rounded-[24px] bg-slate-50 border-slate-100 border p-8 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase tracking-tight resize-none"
                    placeholder="Mijozlarga yuboriladigan xabar matni..."
                  />
                </div>
              </div>

              <div className="p-12 bg-slate-50/50">
                <button 
                  onClick={handleCreateCampaign}
                  className="w-full h-20 rounded-[32px] font-black uppercase tracking-[0.2em] text-[11px] bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                >
                  <Send className="w-5 h-5" /> KAMPANIYANI YARATISH
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
