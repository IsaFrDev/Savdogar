import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Users,
  BarChart3,
  Mail,
  MessageSquare,
  Sparkles,
  Target,
  Plus,
  ChevronRight,
  Filter,
  Calendar,
  Clock,
  Zap,
  ArrowRight,
  Layout,
  Smartphone,
  Globe,
  Star,
  Settings,
  Bot,
  Layers,
  FileCode,
  Palette,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit
} from 'lucide-react';
import { supabaseApi } from '../../services/supabaseService';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/Modal';

const Marketing: React.FC = () => {
  const { formatPrice, currentStore } = useApp();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'workflows' | 'templates' | 'ai-concierge'>('campaigns');
  const [loading, setLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  
  // Real data states
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (currentStore?.id) {
      loadMarketingData();
    }
  }, [currentStore]);

  const loadMarketingData = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const [campData, workData, emailData, smsData] = await Promise.all([
        supabaseApi.marketing.listCampaigns(currentStore.id),
        supabaseApi.marketing.listWorkflows(currentStore.id),
        supabaseApi.marketing.listEmailTemplates(currentStore.id),
        supabaseApi.marketing.listSmsTemplates(currentStore.id)
      ]);

      setCampaigns(campData || []);
      setWorkflows(workData || []);
      setEmailTemplates(emailData || []);
      setSmsTemplates(smsData || []);
    } catch (error) {
      console.error('Failed to load marketing data from Supabase:', error);
    }
    setLoading(false);
  };

  const generateAiStrategy = async () => {
    if (!currentStore?.id) return;
    setShowAiModal(true);
    setAiInsight('Analiz qilinmoqda...');
    try {
      const response = await supabaseApi.marketing.getAiStrategy(currentStore.id);
      setAiInsight(response.data.strategy || "Mijozlaringiz kechki soat 20:00 da eng faol. Ushbu vaqtda 'Tungi chegirma' kampaniyasini yuborishni tavsiya qilamiz.");
    } catch (error) {
      setAiInsight("Mijozlaringiz kechki soat 20:00 da eng faol. Ushbu vaqtda 'Tungi chegirma' kampaniyasini yuborishni tavsiya qilamiz.");
    }
  };

  const tabs = [
    { id: 'campaigns', label: 'Kampaniyalar', icon: Send },
    { id: 'workflows', label: 'Avtomatizatsiya', icon: Layers },
    { id: 'templates', label: 'Andozalar', icon: Palette },
    { id: 'ai-concierge', label: 'AI Concierge', icon: Bot },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white">
        <Loader2 className="w-16 h-16 text-slate-950 animate-spin mb-6 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Marketing Intelligence Syncing</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -m-12 p-12 space-y-16 text-slate-950 font-sans selection:bg-slate-950 selection:text-white">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-1.5 bg-slate-950 rounded-full" />
            <span className="text-xs font-black text-slate-950 uppercase tracking-[0.5em]">Growth Suite</span>
          </div>
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase font-heading leading-none">
            Marketing <span className="text-slate-100">Studio</span>
          </h1>
          <p className="text-slate-400 mt-6 uppercase tracking-[0.2em] text-[10px] font-black flex items-center gap-3">
            <Target size={14} className="text-indigo-500" /> Mijozlar bazasi: 1,284 faol foydalanuvchi
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
           <button 
             onClick={generateAiStrategy}
             className="h-20 px-10 bg-indigo-50 text-indigo-600 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-100 transition-all flex items-center gap-4"
           >
             <Sparkles size={20} /> AI Strategiya
           </button>
           <button className="h-20 px-12 bg-slate-950 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-950/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
             <Plus size={22} className="stroke-[3px]" /> Yangi Kampaniya
           </button>
        </div>
      </div>

      {/* Navigation Matrix */}
      <div className="flex gap-4 p-2 bg-slate-50 rounded-[32px] w-fit border border-slate-100 overflow-x-auto no-scrollbar max-w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-4 px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 border ${
              activeTab === tab.id
                ? 'bg-white text-slate-950 border-white shadow-2xl shadow-slate-200'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-slate-950' : 'text-slate-400'}`} strokeWidth={3} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'campaigns' && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-16"
          >
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               {[
                 { label: 'Jami Yuborilgan', value: '45.2k', icon: Mail, trend: '+5.2%', color: 'slate' },
                 { label: 'Click Rate', value: '12.8%', icon: Zap, trend: '+2.1%', color: 'emerald' },
                 { label: 'Konversiya', value: '4.2%', icon: Star, trend: '+0.8%', color: 'amber' }
               ].map((m, i) => (
                 <div key={i} className="bg-white border-2 border-slate-50 p-12 rounded-[56px] relative overflow-hidden group hover:border-slate-200 transition-all">
                    <div className="absolute top-[-20px] right-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                       <m.icon size={150} className="text-slate-950" />
                    </div>
                    <div className="relative z-10">
                       <div className="flex justify-between items-center mb-10">
                          <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-xl">
                             <m.icon size={24} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${m.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{m.trend}</span>
                       </div>
                       <h3 className="text-5xl font-black text-slate-950 tracking-tighter mb-2 tabular-nums">{m.value}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
                    </div>
                 </div>
               ))}
            </div>

            {/* Campaign Grid */}
            <div className="bg-white border-2 border-slate-50 rounded-[64px] overflow-hidden">
               <div className="p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-6">
                     <Target size={32} className="text-indigo-600" /> Faol Kampaniyalar
                  </h3>
                  <button className="h-14 px-8 bg-white border border-slate-200 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3">
                     <Filter size={16} /> Saralash
                  </button>
               </div>
               <div className="grid grid-cols-1 divide-y divide-slate-50">
                  {campaigns.length === 0 ? (
                    <div className="py-32 text-center empty-state-card m-10">
                       <Send size={64} strokeWidth={1} className="mx-auto text-slate-200 mb-8" />
                       <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Hali kampaniyalar yaratilmagan</p>
                    </div>
                  ) : (
                    campaigns.map(camp => (
                      <div key={camp.id} className="p-12 hover:bg-slate-50 transition-all group flex items-center justify-between">
                         <div className="flex items-center gap-10">
                            <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center ${camp.type === 'email' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'} transition-transform group-hover:scale-110 duration-500`}>
                               {camp.type === 'email' ? <Mail size={32} /> : <MessageSquare size={32} />}
                            </div>
                            <div>
                               <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tighter mb-2">{camp.name}</h4>
                               <div className="flex items-center gap-6">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                     <Users size={12} /> {camp.target_count || 0} Mijoz
                                  </span>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                     <Calendar size={12} /> {new Date(camp.created_at).toLocaleDateString()}
                                  </span>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-12">
                            <div className="text-right hidden sm:block">
                               <div className="text-lg font-black text-slate-950 tabular-nums">78%</div>
                               <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Open Rate</div>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${camp.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                  {camp.status}
                               </span>
                               <button className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center hover:scale-110 transition-all shadow-xl shadow-slate-950/20">
                                  <ChevronRight size={24} />
                               </button>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'workflows' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {workflows.length === 0 ? (
                    <div className="col-span-full py-40 bg-slate-50 rounded-[56px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center">
                       <Layers size={80} strokeWidth={1} className="text-slate-200 mb-10" />
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Avtomatizatsiya O'chirilgan</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-12">Drip kampaniyalar va avtomatik zanjirlar yaratish</p>
                       <button className="h-16 px-10 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all hover:scale-105">Zanjir Yaratish</button>
                    </div>
                 ) : (
                    workflows.map(work => (
                       <div key={work.id} className="bg-white border-2 border-slate-50 p-12 rounded-[56px] hover:border-slate-950 transition-all duration-700 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                             <Layers size={100} />
                          </div>
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-950 mb-10 border border-slate-100">
                             <Zap size={28} />
                          </div>
                          <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tighter mb-3">{work.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">{work.trigger_event || 'Registration Trigger'}</p>
                          
                          <div className="space-y-5 mb-10">
                             <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                                <CheckCircle2 size={16} className="text-emerald-500" /> Welcome Email
                             </div>
                             <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                                <CheckCircle2 size={16} className="text-emerald-500" /> Wait 3 Days
                             </div>
                             <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
                                <Clock size={16} /> Discount SMS
                             </div>
                          </div>

                          <button className="w-full h-18 bg-slate-950 text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
                             Boshqarish
                          </button>
                       </div>
                    ))
                 )}
              </div>
           </motion.div>
        )}

        {activeTab === 'templates' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Kontent Hub</h3>
                 <div className="flex gap-4">
                    <button className="h-14 px-8 bg-slate-50 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all">Email Editor</button>
                    <button className="h-14 px-8 bg-slate-50 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all">SMS Editor</button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {emailTemplates.concat(smsTemplates).map((temp, i) => (
                    <div key={i} className="bg-white border-2 border-slate-50 rounded-[48px] p-10 hover:border-slate-950 transition-all duration-700 relative overflow-hidden group">
                       <div className="aspect-video bg-slate-50 rounded-[28px] mb-8 flex items-center justify-center border border-slate-100 p-4">
                          <FileCode size={40} className="text-slate-200" />
                       </div>
                       <h5 className="text-lg font-black text-slate-950 uppercase tracking-tight mb-2 truncate">{temp.name || 'Marketing Template'}</h5>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{temp.subject || 'SMS Content'}</p>
                       <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">V.1.0</span>
                          <button className="text-slate-950 hover:scale-110 transition-transform"><Edit size={18} /></button>
                       </div>
                    </div>
                 ))}
                 <div className="border-4 border-dashed border-slate-50 rounded-[48px] p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-slate-200 transition-all">
                    <Plus size={40} className="text-slate-100 group-hover:text-slate-300 transition-colors mb-4" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Yangi Andoza</span>
                 </div>
              </div>
           </motion.div>
        )}

        {activeTab === 'ai-concierge' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-16 py-10">
              <div className="bg-slate-950 p-16 rounded-[64px] text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-16 opacity-10 rotate-12">
                    <Bot size={200} />
                 </div>
                 <div className="relative z-10">
                    <div className="w-24 h-24 rounded-[32px] bg-white/10 flex items-center justify-center text-white mb-10 shadow-2xl border border-white/10">
                       <Sparkles size={48} className="fill-white" />
                    </div>
                    <h3 className="text-5xl font-black tracking-tighter uppercase font-heading leading-tight mb-8">AI Concierge<br/>Assistant</h3>
                    <p className="text-base font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-16 max-w-xl">
                       Mijozlaringiz bilan muloqot qiluvchi, tovarlarni tavsiya etuvchi va savollarga javob beruvchi aqlli yordamchi.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
                       <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] hover:bg-white/10 transition-all cursor-pointer group">
                          <div className="flex items-center justify-between mb-8">
                             <Globe size={32} />
                             <div className="w-12 h-6 bg-emerald-500 rounded-full flex items-center px-1"><div className="w-4 h-4 bg-white rounded-full ml-auto" /></div>
                          </div>
                          <h5 className="text-lg font-black uppercase tracking-tight mb-2">Multilingual</h5>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">UZB, RUS, ENG tillarida muloqot</p>
                       </div>
                       <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] hover:bg-white/10 transition-all cursor-pointer group">
                          <div className="flex items-center justify-between mb-8">
                             <Smartphone size={32} />
                             <div className="w-12 h-6 bg-slate-800 rounded-full flex items-center px-1"><div className="w-4 h-4 bg-slate-600 rounded-full" /></div>
                          </div>
                          <h5 className="text-lg font-black uppercase tracking-tight mb-2">TWA Integration</h5>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Telegram Mini App ichida chatbot</p>
                       </div>
                    </div>

                    <button className="w-full h-24 bg-white text-slate-950 rounded-[32px] font-black uppercase tracking-[0.5em] text-sm shadow-2xl hover:scale-105 transition-all">
                       Konfiguratsiyani Boshlash
                    </button>
                 </div>
              </div>

              <div className="bg-white border-2 border-slate-50 p-16 rounded-[64px] flex flex-col items-center text-center">
                 <AlertCircle size={48} className="text-rose-500 mb-8" />
                 <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tighter mb-4">Ushbu modul beta bosqichida</h4>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-lg mb-10">
                    AI Concierge funksiyasini faollashtirish uchun avval do'kon ma'lumotlarini to'liq to'ldirishingiz kerak.
                 </p>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={showAiModal} onClose={() => setShowAiModal(false)} title="AI Strategik Insights">
         <div className="p-12 space-y-12 bg-white">
            <div className="w-24 h-24 rounded-[32px] bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto">
               <Sparkles size={48} className="fill-indigo-500" />
            </div>
            <div className="p-10 bg-slate-50 rounded-[40px] border-2 border-slate-100">
               <p className="text-lg font-black text-slate-950 uppercase tracking-tight leading-relaxed text-center italic">
                  "{aiInsight}"
               </p>
            </div>
            <div className="flex gap-6">
               <button onClick={() => setShowAiModal(false)} className="flex-1 h-20 bg-slate-100 text-slate-950 rounded-[32px] font-black uppercase tracking-widest text-[10px]">Tushunarli</button>
               <button className="flex-1 h-20 bg-slate-950 text-white rounded-[32px] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-950/20">Zanjirni Qo'shish</button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default Marketing;
