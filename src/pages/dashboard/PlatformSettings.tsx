import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Loader2, 
  AlertCircle,
  Bot,
  Video,
  ChevronRight,
  Info,
  ShieldCheck,
  Zap,
  ExternalLink,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { translations } from '../../i18n/translations';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function PlatformSettings() {
  const { language, currentStore, setStores } = useApp();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form State
  const [botToken, setBotToken] = useState(currentStore?.telegram_bot_token || '');
  const [chatId, setChatId] = useState(currentStore?.telegram_chat_id || '');

  // New Form State for Welcome Messages
  const [welcomeEn, setWelcomeEn] = useState(currentStore?.telegram_welcome || 'Welcome to our store!');
  const [welcomeUz, setWelcomeUz] = useState(currentStore?.telegram_welcome_uz || '');
  const [welcomeRu, setWelcomeRu] = useState(currentStore?.telegram_welcome_ru || '');
  const [twaEnabled, setTwaEnabled] = useState(currentStore?.twa_enabled || false);
  const [isLocalizing, setIsLocalizing] = useState(false);

  const handleSave = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      await supabaseApi.stores.update(currentStore.id, {
        telegram_bot_token: botToken,
        telegram_chat_id: chatId,
        telegram_welcome: welcomeEn,
        telegram_welcome_uz: welcomeUz,
        telegram_welcome_ru: welcomeRu,
        twa_enabled: twaEnabled
      });
      
      // Update local context
      if (typeof setStores === 'function') {
        const storesData = await supabaseApi.stores.list();
        setStores(storesData);
      }
      
      setStep(4); // Move to success step
    } catch (error) {
      console.error('Failed to update platform settings:', error);
      alert('Xatolik yuz berdi');
    }
    setLoading(false);
  };

  const handleAiLocalize = async () => {
    if (!welcomeEn) return;
    setIsLocalizing(true);
    try {
      // Translate to UZ
      const uzRes = await supabaseApi.ai.translateText({ text: welcomeEn, target_lang: 'uz' });
      setWelcomeUz(uzRes.data.translated_text);
      
      // Translate to RU
      const ruRes = await supabaseApi.ai.translateText({ text: welcomeEn, target_lang: 'ru' });
      setWelcomeRu(ruRes.data.translated_text);
    } catch (error) {
      console.error('AI Localization failed:', error);
      alert('AI Localization failed');
    } finally {
      setIsLocalizing(false);
    }
  };

  const handleTest = async () => {
    if (!currentStore?.id) return;
    setTesting(true);
    try {
      await supabaseApi.stores.testTelegram(currentStore.id, {
        bot_token: botToken,
        chat_id: chatId
      });
      alert(t('testMessageSent'));
    } catch (error) {
      alert(language === 'uz' ? "Xatolik! Token yoki Chat ID ni tekshiring." : "Error! Check Token or Chat ID.");
    }
    setTesting(false);
  };

  const t = (key: string) => {
    // @ts-ignore
    return translations[language][key] || key;
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      >
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase font-heading">
            {t('telegramIntegrationTitle')}
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-[var(--brand-primary)] rounded-full" />
            <p className="text-[var(--text-dim)] uppercase tracking-[0.3em] text-[10px] font-black">
              {t('autoNotificationsBotSettings')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-500 ${currentStore?.telegram_bot_token ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm' : 'bg-slate-100/50 text-slate-400 border border-slate-200/50'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${currentStore?.telegram_bot_token ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-300'}`} />
            {currentStore?.telegram_bot_token ? 'System Online' : 'Offline'}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Setup Wizard */}
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden relative border border-slate-200 shadow-2xl bg-white">
            {/* Steps Progress Overhaul */}
            <div className="px-12 py-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-10 relative z-10 w-full">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex-1 flex items-center gap-4 group">
                    <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-sm font-black transition-all duration-500 relative ${step === s ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110' : step > s ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                      {step > s ? <Check className="w-5 h-5 stroke-[3px]" /> : s}
                      {step === s && (
                         <div className="absolute -inset-1 rounded-[1.5rem] border-2 border-indigo-500/30 animate-ping opacity-20" />
                      )}
                    </div>
                    {s < 4 && (
                      <div className="flex-1 hidden md:block">
                        <div className={`h-[2px] rounded-full transition-all duration-1000 ${step > s ? 'bg-emerald-500 shadow-sm' : 'bg-slate-200'}`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-12 min-h-[500px] flex flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
                    className="space-y-10 max-w-2xl w-full"
                  >
                    <div className="space-y-6">
                      <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-8 shadow-inner relative group">
                        <div className="absolute inset-0 bg-indigo-100/50 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Bot className="w-12 h-12 relative z-10" />
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight font-heading">Create Your Bot</h2>
                      <p className="text-lg font-medium text-slate-500 leading-relaxed">
                        Start by talking to <a href="https://t.me/BotFather" target="_blank" className="text-indigo-600 font-black hover:text-indigo-800 transition-all decoration-2 underline-offset-4 underline">@BotFather</a> on Telegram to generate your unique API Token.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {[
                         { step: '01', text: 'Send /newbot' },
                         { step: '02', text: 'Name your bot' },
                         { step: '03', text: 'Get API Token' }
                       ].map((item, i) => (
                         <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3 hover:bg-white hover:shadow-lg transition-all">
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{item.step}</span>
                            <p className="text-xs font-bold text-slate-600">{item.text}</p>
                         </div>
                       ))}
                    </div>

                    <Button onClick={() => setStep(2)} className="w-full rounded-[1.75rem] h-20 px-10 font-black uppercase tracking-[0.2em] text-xs bg-slate-900 text-white hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl">
                      Get Started <ChevronRight className="w-5 h-5 stroke-[3px]" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
                    className="space-y-10 w-full max-w-xl"
                  >
                    <div className="space-y-8 text-left">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                          <Zap className="w-4 h-4" /> {t('botToken')}
                        </label>
                        <Input
                          value={botToken}
                          onChange={setBotToken}
                          placeholder="123456789:ABCDefgh-..."
                          className="!rounded-[1.75rem] !bg-slate-50 !border-slate-100 !h-20 font-mono text-sm tracking-widest focus:!border-indigo-500/50 focus:!bg-white transition-all text-slate-900"
                        />
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[9px] text-amber-500 font-bold uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5" /> Never share this token with anyone.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-3xl h-18 font-black uppercase tracking-widest text-[10px] border-slate-200 text-slate-500 hover:bg-slate-50">Back</Button>
                      <Button onClick={() => setStep(3)} disabled={!botToken} className="flex-[2] rounded-[1.75rem] h-20 font-black uppercase tracking-[0.2em] text-[10px] bg-slate-900 text-white shadow-xl flex items-center justify-center gap-3">
                        Verify Token <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
                    className="space-y-10 w-full text-left"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] ml-2">{t('chatId')}</label>
                          <Input
                            value={chatId}
                            onChange={setChatId}
                            placeholder="-100123456789"
                            className="!rounded-[1.75rem] !bg-slate-50 !border-slate-100 !h-20 font-black tracking-[0.2em] text-lg text-slate-900"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">App Toggle</label>
                          <div
                            onClick={() => setTwaEnabled(!twaEnabled)}
                            className={`h-20 rounded-[1.75rem] border-2 flex items-center px-8 gap-6 cursor-pointer transition-all ${twaEnabled ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100'}`}
                          >
                            <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${twaEnabled ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>
                              {twaEnabled && <Check className="w-4 h-4 stroke-[4px]" />}
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest ${twaEnabled ? 'text-indigo-700' : 'text-slate-400'}`}>TWA {twaEnabled ? 'ENABLED' : 'DISABLED'}</span>
                          </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                              <MessageSquare className="w-5 h-5 text-indigo-600" />
                              {t('welcomeMessage')}
                            </h3>
                            <button 
                                onClick={handleAiLocalize} 
                                disabled={isLocalizing || !welcomeEn}
                                className="h-10 rounded-xl px-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                            >
                                {isLocalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                AI Localize
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                           <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-3">Primary (Global)</label>
                             <textarea 
                                value={welcomeEn}
                                onChange={(e) => setWelcomeEn(e.target.value)}
                                className="w-full h-28 rounded-3xl bg-white border border-slate-200 p-6 text-sm font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 outline-none transition-all resize-none shadow-sm"
                             />
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-3">Uzbek (UZ)</label>
                               <textarea 
                                  value={welcomeUz}
                                  onChange={(e) => setWelcomeUz(e.target.value)}
                                  className="w-full h-24 rounded-2xl bg-white border border-slate-200 p-5 text-xs font-medium text-slate-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 outline-none transition-all resize-none"
                               />
                             </div>
                             <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-3">Russian (RU)</label>
                               <textarea 
                                  value={welcomeRu}
                                  onChange={(e) => setWelcomeRu(e.target.value)}
                                  className="w-full h-24 rounded-2xl bg-white border border-slate-200 p-5 text-xs font-medium text-slate-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 outline-none transition-all resize-none"
                               />
                             </div>
                           </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6">
                        <Button
                          onClick={handleTest}
                          disabled={testing || !botToken || !chatId}
                          className="rounded-[1.5rem] h-18 px-10 font-black uppercase tracking-[0.2em] text-[10px] bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-3"
                        >
                          {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Test Bot"}
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={loading || !botToken || !chatId}
                          className="flex-1 rounded-[1.75rem] h-20 px-10 font-black uppercase tracking-[0.2em] text-[11px] bg-slate-900 text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Setup"}
                        </Button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    className="flex flex-col items-center justify-center space-y-8"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full" />
                      <div className="w-32 h-32 rounded-[3.5rem] bg-emerald-500 border-[6px] border-white flex items-center justify-center text-white relative z-10 shadow-xl">
                        <ShieldCheck className="w-16 h-16 stroke-[2.5px]" />
                      </div>
                    </div>
                    <div className="text-center space-y-3">
                      <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight font-heading">Connection Established</h2>
                      <p className="text-lg font-medium text-slate-500 max-w-sm leading-relaxed">
                        Your store is now fully synchronized with Telegram. Notifications will arrive in real-time.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 w-full max-w-sm pt-4">
                        <Button onClick={() => setStep(3)} className="flex-1 rounded-3xl h-18 px-10 font-black uppercase tracking-widest text-[10px] bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200 transition-all">
                            Review Config
                        </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar Help Cards */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group rounded-[40px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full translate-x-16 -translate-y-16 group-hover:bg-indigo-500/40 transition-colors" />
              <h4 className="font-black text-xl uppercase tracking-tight mb-8 flex items-center gap-4 relative z-10">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/20">
                   <Video className="w-6 h-6 text-indigo-400" />
                </div>
                Tutorial
              </h4>
              <div 
                className="aspect-video bg-white/10 rounded-[2rem] mb-8 relative group cursor-pointer overflow-hidden border border-white/10 shadow-2xl"
                onClick={() => window.open('https://www.youtube.com/watch?v=aZTo0tG3Eos', '_blank')}
              >
                 <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all z-20">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform ring-1 ring-white/30">
                       <Zap className="w-8 h-8 fill-white text-white" />
                    </div>
                 </div>
                 <img src="https://img.youtube.com/vi/aZTo0tG3Eos/maxresdefault.jpg" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
              </div>
              <p className="text-[10px] font-black text-slate-400 leading-relaxed uppercase tracking-[0.2em] relative z-10 opacity-70">
                Watch the 2-minute setup guide to learn how to connect your bot instantly.
              </p>
            </GlassCard>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-8 space-y-8 bg-white border border-slate-200 shadow-xl rounded-[40px]">
              <h4 className="font-black text-xs uppercase tracking-[0.3em] text-indigo-600 flex items-center gap-3">
                <Info className="w-5 h-5" /> Quick Links
              </h4>
              <div className="space-y-4">
                {[
                  { label: '@BotFather', url: 'https://t.me/BotFather', desc: 'Create your bot here' },
                  { label: '@GetMyChatID_Bot', url: 'https://t.me/GetMyChatID_Bot', desc: 'Get your numeric ID' }
                ].map((link, i) => (
                  <a key={i} href={link.url} target="_blank" className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group overflow-hidden relative shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 group-hover:text-indigo-600 block mb-1">
                        {link.label}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block">
                        {link.desc}
                      </span>
                    </div>
                    <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 relative z-10" />
                  </a>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
