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
import { storeApi, aiApi } from '../../services/api';
import { translations } from '../../i18n/translations';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function PlatformSettings() {
  const { language, currentStore, setStores } = useApp();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configuring, setConfiguring] = useState(false);
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
      await storeApi.update(currentStore.id, {
        telegram_bot_token: botToken,
        telegram_chat_id: chatId,
        telegram_welcome: welcomeEn,
        telegram_welcome_uz: welcomeUz,
        telegram_welcome_ru: welcomeRu,
        twa_enabled: twaEnabled
      });
      
      // Update local context
      if (typeof setStores === 'function') {
        const storesResponse = await storeApi.list();
        setStores(storesResponse.data);
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
      const uzRes = await aiApi.translateText({ text: welcomeEn, target_lang: 'uz' });
      setWelcomeUz(uzRes.data.translated_text);
      
      // Translate to RU
      const ruRes = await aiApi.translateText({ text: welcomeEn, target_lang: 'ru' });
      setWelcomeRu(ruRes.data.translated_text);
    } catch (error) {
      console.error('AI Localization failed:', error);
      alert('AI Localization failed');
    } finally {
      setIsLocalizing(false);
    }
  };

  const handleAutoConfigure = async () => {
    if (!currentStore?.id || !botToken) return;
    setConfiguring(true);
    try {
      await storeApi.createTelegramBot(currentStore.id, {
        bot_token: botToken
      });
      alert(language === 'uz' ? 'Bot muvaffaqiyatli sozlandi!' : 'Bot configured successfully!');
      
      // Update local context
      if (typeof setStores === 'function') {
        const storesResponse = await storeApi.list();
        setStores(storesResponse.data);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || (language === 'uz' ? "Xato! Tokenni tekshiring (Faqat HTTPS dagi saytlar uchun webhook ishlaydi)." : "Error! Check token (Webhook only works for HTTPS sites).");
      alert(msg);
    }
    setConfiguring(false);
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
          <h1 className="text-3xl lg:text-4xl font-black text-[var(--text-main)] tracking-tight uppercase font-heading">
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
          <div className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-500 ${currentStore?.telegram_bot_token ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-100/50 text-slate-400 border border-slate-200/50'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${currentStore?.telegram_bot_token ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
            {currentStore?.telegram_bot_token ? 'System Online' : 'Offline'}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Setup Wizard */}
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden relative border-none shadow-2xl bg-white/[0.02] backdrop-blur-3xl ring-1 ring-white/10">
            {/* Steps Progress Overhaul */}
            <div className="px-12 py-8 bg-white/[0.03] border-b border-white/5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-10 relative z-10 w-full">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex-1 flex items-center gap-4 group">
                    <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-sm font-black transition-all duration-500 relative ${step === s ? 'bg-[var(--brand-primary)] text-white shadow-[0_0_30px_var(--brand-primary-glow)] scale-110' : step > s ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
                      {step > s ? <Check className="w-5 h-5 stroke-[3px]" /> : s}
                      {step === s && (
                         <div className="absolute -inset-1 rounded-[1.5rem] border-2 border-[var(--brand-primary)]/30 animate-ping opacity-20" />
                      )}
                    </div>
                    {s < 4 && (
                      <div className="flex-1 hidden md:block">
                        <div className={`h-[2px] rounded-full transition-all duration-1000 ${step > s ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
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
                      <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-indigo-400 mx-auto mb-8 shadow-2xl relative group">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <Bot className="w-12 h-12 relative z-10" />
                      </div>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tight font-heading">{t('createYourBot')}</h2>
                      <p className="text-lg font-medium text-slate-400 leading-relaxed">
                        {language === 'uz' ? "Boshlash uchun Telegramda " : "Start by talking to "}
                        <a href="https://t.me/BotFather" target="_blank" className="text-[var(--brand-primary)] font-black hover:brightness-125 transition-all decoration-2 underline-offset-4 underline">@BotFather</a> 
                        {language === 'uz' ? " bilan gaplashib yangi API Token yarating." : " on Telegram to generate your unique API Token."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {[
                         { step: '01', text: t('botCreatorStep1') },
                         { step: '02', text: t('botCreatorStep2') },
                         { step: '03', text: t('botCreatorStep3') }
                       ].map((item, i) => (
                         <div key={i} className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-3 hover:bg-white/[0.05] transition-all">
                            <span className="text-[9px] font-black text-[var(--brand-primary)] uppercase tracking-widest">{item.step}</span>
                            <p className="text-xs font-bold text-slate-300">{item.text}</p>
                         </div>
                       ))}
                    </div>

                    <Button onClick={() => setStep(2)} className="w-full rounded-[1.75rem] h-20 px-10 font-black uppercase tracking-[0.2em] text-xs bg-white text-slate-900 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl">
                      {t('getStarted')} <ChevronRight className="w-5 h-5 stroke-[3px]" />
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
                        <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                          <Zap className="w-4 h-4" /> {t('botToken')}
                        </label>
                        <Input
                          value={botToken}
                          onChange={setBotToken}
                          placeholder="123456789:ABCDefgh-..."
                          className="!rounded-[1.75rem] !bg-white/[0.03] !border-white/10 !h-20 font-mono text-sm tracking-widest focus:!border-[var(--brand-primary)]/50 focus:!bg-white/[0.05] transition-all"
                        />
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[9px] text-amber-500 font-bold uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5" /> Never share this token with anyone.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-3xl h-18 font-black uppercase tracking-widest text-[10px] border-white/10 text-white hover:bg-white/5">{language === 'uz' ? 'Orqaga' : 'Back'}</Button>
                      <Button onClick={() => setStep(3)} disabled={!botToken} className="flex-[2] rounded-[1.75rem] h-20 font-black uppercase tracking-[0.2em] text-[10px] bg-[var(--brand-primary)] text-white shadow-xl shadow-[var(--brand-primary-glow)] flex items-center justify-center gap-3">
                        {t('verifyToken')} <ChevronRight className="w-4 h-4" />
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
                          <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.3em] ml-2">{t('chatId')}</label>
                          <Input
                            value={chatId}
                            onChange={setChatId}
                            placeholder="-100123456789"
                            className="!rounded-[1.75rem] !bg-white/[0.03] !border-white/10 !h-20 font-black tracking-[0.2em] text-lg"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">{t('appToggle')}</label>
                          <div
                            onClick={() => setTwaEnabled(!twaEnabled)}
                            className={`h-20 rounded-[1.75rem] border-2 flex items-center px-8 gap-6 cursor-pointer transition-all ${twaEnabled ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-white/[0.03] border-white/5 opacity-40 hover:opacity-60'}`}
                          >
                            <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${twaEnabled ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/20'}`}>
                              {twaEnabled && <Check className="w-4 h-4 stroke-[4px]" />}
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest ${twaEnabled ? 'text-indigo-400' : 'text-slate-500'}`}>TWA {twaEnabled ? 'ENABLED' : 'DISABLED'}</span>
                          </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                              <MessageSquare className="w-5 h-5 text-[var(--brand-primary)]" />
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
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-3">{t('primaryGlobal')}</label>
                             <textarea 
                                value={welcomeEn}
                                onChange={(e) => setWelcomeEn(e.target.value)}
                                className="w-full h-28 rounded-3xl bg-white/[0.03] border border-white/10 p-6 text-sm font-medium text-slate-300 focus:ring-4 focus:ring-[var(--brand-primary)]/10 focus:border-[var(--brand-primary)]/40 outline-none transition-all resize-none shadow-inner"
                             />
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-3">Uzbek (UZ)</label>
                               <textarea 
                                  value={welcomeUz}
                                  onChange={(e) => setWelcomeUz(e.target.value)}
                                  className="w-full h-24 rounded-2xl bg-white/[0.03] border border-white/10 p-5 text-xs font-medium text-slate-400 focus:ring-4 focus:ring-[var(--brand-primary)]/10 focus:border-[var(--brand-primary)]/40 outline-none transition-all resize-none"
                               />
                             </div>
                             <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-3">Russian (RU)</label>
                               <textarea 
                                  value={welcomeRu}
                                  onChange={(e) => setWelcomeRu(e.target.value)}
                                  className="w-full h-24 rounded-2xl bg-white/[0.03] border border-white/10 p-5 text-xs font-medium text-slate-400 focus:ring-4 focus:ring-[var(--brand-primary)]/10 focus:border-[var(--brand-primary)]/40 outline-none transition-all resize-none"
                               />
                             </div>
                           </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                        <Button
                          onClick={handleTest}
                          disabled={testing || !botToken || !chatId}
                          className="w-full sm:w-auto rounded-[1.5rem] h-18 px-10 font-black uppercase tracking-[0.2em] text-[10px] bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-3"
                        >
                          {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : t('testBot')}
                        </Button>

                        <Button
                          onClick={handleAutoConfigure}
                          disabled={configuring || !botToken}
                          className="w-full sm:w-auto rounded-[1.5rem] h-18 px-10 font-black uppercase tracking-[0.2em] text-[10px] bg-indigo-500/10 text-indigo-400 border-2 border-indigo-400/20 hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-3"
                        >
                          {configuring ? <Loader2 className="w-5 h-5 animate-spin" /> : (language === 'uz' ? 'AVTO-SOZLASH' : 'AUTO-CONFIG')}
                        </Button>

                        <Button
                          onClick={handleSave}
                          disabled={loading || !botToken || !chatId}
                          className="flex-1 w-full rounded-[1.75rem] h-20 px-10 font-black uppercase tracking-[0.2em] text-[11px] bg-white text-slate-900 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('completeSetup')}
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
                      <div className="absolute inset-0 bg-emerald-500/30 blur-[60px] animate-pulse rounded-full" />
                      <div className="w-32 h-32 rounded-[3.5rem] bg-gradient-to-br from-emerald-400 to-teal-500 border-[6px] border-white/20 flex items-center justify-center text-white relative z-10 shadow-2xl">
                        <ShieldCheck className="w-16 h-16 stroke-[2.5px]" />
                      </div>
                    </div>
                    <div className="text-center space-y-3">
                      <h2 className="text-4xl font-black text-white uppercase tracking-tight font-heading">{t('connectionEstablished')}</h2>
                      <p className="text-lg font-medium text-slate-400 max-w-sm leading-relaxed">
                        {t('connectionEstablishedDesc')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 w-full max-w-sm pt-4">
                        <Button onClick={() => setStep(3)} className="flex-1 rounded-3xl h-18 px-10 font-black uppercase tracking-widest text-[10px] bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all">
                            {t('reviewConfig')}
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
            <GlassCard className="p-8 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)]/20 blur-[60px] rounded-full translate-x-16 -translate-y-16 group-hover:bg-[var(--brand-primary)]/40 transition-colors" />
              <h4 className="font-black text-xl uppercase tracking-tight mb-8 flex items-center gap-4 relative z-10">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/20">
                   <Video className="w-6 h-6 text-indigo-400" />
                </div>
                {t('tutorial')}
              </h4>
              <div 
                className="aspect-video bg-white/5 rounded-[2rem] mb-8 relative group cursor-pointer overflow-hidden border border-white/10 shadow-2xl"
                onClick={() => window.open('https://www.youtube.com/watch?v=aZTo0tG3Eos', '_blank')}
              >
                 <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all z-20">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform ring-1 ring-white/30">
                       <Zap className="w-8 h-8 fill-white text-white" />
                    </div>
                 </div>
                 <img src="https://img.youtube.com/vi/aZTo0tG3Eos/maxresdefault.jpg" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
              </div>
              <p className="text-[10px] font-black text-slate-400 leading-relaxed uppercase tracking-[0.2em] relative z-10 opacity-70">
                {t('setupGuideDesc')}
              </p>
            </GlassCard>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-8 space-y-8 bg-white/[0.02] border-white/10 backdrop-blur-3xl shadow-2xl">
              <h4 className="font-black text-xs uppercase tracking-[0.3em] text-[var(--brand-primary)] flex items-center gap-3">
                <Info className="w-5 h-5" /> {t('quickLinks')}
              </h4>
              <div className="space-y-4">
                {[
                  { label: '@BotFather', url: 'https://t.me/BotFather', desc: t('botFatherDesc') },
                  { label: '@GetMyChatID_Bot', url: 'https://t.me/GetMyChatID_Bot', desc: t('chatIdBotDesc') }
                ].map((link, i) => (
                  <a key={i} href={link.url} target="_blank" className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-[var(--brand-primary)]/40 hover:bg-white/[0.05] transition-all group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <span className="text-[11px] font-black uppercase tracking-widest text-white group-hover:text-[var(--brand-primary)] block mb-1">
                        {link.label}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter block">
                        {link.desc}
                      </span>
                    </div>
                    <ExternalLink className="w-5 h-5 text-slate-600 group-hover:text-[var(--brand-primary)] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 relative z-10" />
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
