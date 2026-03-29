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
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storeApi, aiApi } from '../../services/api';
import { translations } from '../../i18n/translations';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function PlatformSettings() {
  const { language, currentStore } = useApp();
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
      await storeApi.update(currentStore.id, {
        telegram_bot_token: botToken,
        telegram_chat_id: chatId,
        telegram_welcome: welcomeEn,
        telegram_welcome_uz: welcomeUz,
        telegram_welcome_ru: welcomeRu,
        twa_enabled: twaEnabled
      });
      // @ts-ignore
      if (typeof loadStores === 'function') await loadStores();
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

  const handleTest = async () => {
    if (!currentStore?.id) return;
    setTesting(true);
    try {
      await storeApi.testTelegram(currentStore.id, {
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
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
            {t('telegramIntegrationTitle')}
          </h1>
          <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">
            {t('autoNotificationsBotSettings')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${currentStore?.telegram_bot_token ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
            <div className={`w-2 h-2 rounded-full ${currentStore?.telegram_bot_token ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            {currentStore?.telegram_bot_token ? 'Telegram Bot Active' : 'Not Configured'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Setup Wizard */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-0 overflow-hidden relative border-2 border-indigo-100/50">
            {/* Steps Progress */}
            <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${step === s ? 'bg-indigo-600 text-white shadow-lg' : step > s ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {step > s ? <Check className="w-4 h-4" /> : s}
                    </div>
                    {s < 4 && <div className={`w-4 h-0.5 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{step}/4 Bosqich</span>
            </div>

            <div className="p-10 min-h-[400px]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 mb-6">
                        <Bot className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Bot yaratish</h2>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-xl">
                        Avvalo, Telegramda <a href="https://t.me/BotFather" target="_blank" className="text-indigo-600 font-bold hover:underline">@BotFather</a> orqali yangi bot yarating va u yerdan API Tokenni oling.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black shadow-sm text-slate-600">1</div>
                        <p className="text-xs font-bold text-slate-700">@BotFather ga <code className="text-indigo-600 bg-indigo-50 px-1 rounded">/newbot</code> komandasini yuboring.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black shadow-sm text-slate-600">2</div>
                        <p className="text-xs font-bold text-slate-700">Botga nom bering (masalan: Savdoon Store Bot).</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black shadow-sm text-slate-600">3</div>
                        <p className="text-xs font-bold text-slate-700">Botga username bering (username <code className="text-indigo-600 bg-indigo-50 px-1 rounded">_bot</code> bilan tugashi shart).</p>
                      </div>
                    </div>
                    <Button onClick={() => setStep(2)} className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] bg-slate-900 text-white flex items-center gap-3">
                      Keyingi <ChevronRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5" /> {t('botToken')} (HTTP API)
                        </label>
                        <Input
                          value={botToken}
                          onChange={setBotToken}
                          placeholder="123456789:ABCDefgh-..."
                          className="!rounded-2xl !bg-slate-50 !border-slate-100 !h-16 font-mono text-sm tracking-wider"
                        />
                        <p className="text-[9px] text-slate-400 font-medium ml-1 flex items-center gap-1 leading-relaxed">
                          <AlertCircle className="w-3 h-3" /> BotFather taqdim etgan tokenni shu yerga nusxalab qo'ying.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" onClick={() => setStep(1)} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px]">Orqaga</Button>
                      <Button onClick={() => setStep(3)} disabled={!botToken} className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] bg-slate-900 text-white flex items-center gap-3">
                        Keyingi <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('chatId')}</label>
                          <Input
                            value={chatId}
                            onChange={setChatId}
                            placeholder="-100123456789"
                            className="!rounded-2xl !bg-slate-50 !border-slate-100 !h-16 font-black tracking-widest"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('telegramMiniApp')}</label>
                          <div
                            onClick={() => setTwaEnabled(!twaEnabled)}
                            className={`h-16 rounded-2xl border-2 flex items-center px-6 gap-4 cursor-pointer transition-all ${twaEnabled ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${twaEnabled ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                              {twaEnabled && <Check className="w-3 h-3" />}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-800">TWA {twaEnabled ? 'Yoqilgan' : 'O\'chirilgan'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t('welcomeMessage')}</h3>
                            <Button 
                                onClick={handleAiLocalize} 
                                disabled={isLocalizing || !welcomeEn}
                                className="h-8 rounded-lg px-4 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-black flex items-center gap-2"
                            >
                                {isLocalizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                {t('aiLocalize')}
                            </Button>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('mainWelcomeMessage')}</label>
                             <textarea 
                                value={welcomeEn}
                                onChange={(e) => setWelcomeEn(e.target.value)}
                                className="w-full h-24 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                             />
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('uzWelcome')}</label>
                               <textarea 
                                  value={welcomeUz}
                                  onChange={(e) => setWelcomeUz(e.target.value)}
                                  className="w-full h-20 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                               />
                             </div>
                             <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('ruWelcome')}</label>
                               <textarea 
                                  value={welcomeRu}
                                  onChange={(e) => setWelcomeRu(e.target.value)}
                                  className="w-full h-20 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                               />
                             </div>
                           </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                        <Button
                          onClick={handleTest}
                          disabled={testing || !botToken || !chatId}
                          className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] bg-emerald-50 text-emerald-600 border border-emerald-100 border-2"
                        >
                          {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : t('send')}
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={loading || !botToken || !chatId}
                          className="flex-1 rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] bg-slate-900 text-white shadow-xl shadow-indigo-500/20"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('saveSettings')}
                        </Button>
                      </div>
                    </div>
                    <button onClick={() => setStep(2)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Orqaga qaytish</button>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center space-y-6 pt-10"
                  >
                    <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-500">
                      <ShieldCheck className="w-12 h-12" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Muvaffaqiyatli!</h2>
                      <p className="text-sm font-medium text-slate-500 max-w-xs leading-relaxed">
                        Telegram botingiz to'liq ulandi. Endi yangi buyurtmalar to'g'ridan-to'g'ri Telegramingizga keladi.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 w-full max-w-xs">
                        <Button onClick={() => setStep(3)} className="flex-1 rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] bg-slate-900 text-white">
                            Tahrirlash
                        </Button>
                        <Button onClick={() => setStep(1)} className="rounded-2xl h-14 px-6 font-black uppercase tracking-widest text-[11px] bg-slate-100 text-slate-500">
                            Reset
                        </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar Help */}
        <div className="space-y-6">
          <GlassCard className="p-8 bg-slate-900 text-white border-none shadow-2xl">
            <h4 className="font-black text-lg uppercase tracking-tight mb-6 flex items-center gap-3">
              <Video className="w-5 h-5 text-indigo-400" /> Video-qo'llanma
            </h4>
            <div className="aspect-video bg-white/5 rounded-2xl mb-6 relative group cursor-pointer overflow-hidden border border-white/10">
               <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Zap className="w-6 h-6 fill-white text-white" />
                  </div>
               </div>
               <img src="https://img.youtube.com/vi/aZTo0tG3Eos/maxresdefault.jpg" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-tighter">
              Botingizni 2 daqiqada qanday sozlashni bilib oling.
            </p>
          </GlassCard>

          <GlassCard className="p-8 space-y-6 border-2 border-indigo-50 bg-indigo-50/20">
            <h4 className="font-black text-sm uppercase tracking-widest text-indigo-900 flex items-center gap-2">
              <Info className="w-4 h-4" /> Foydali havolalar
            </h4>
            <div className="space-y-3">
              <a href="https://t.me/BotFather" target="_blank" className="flex items-center justify-between p-4 rounded-xl bg-white border border-indigo-50 hover:border-indigo-200 transition-all group">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-indigo-600">@BotFather</span>
                <ExternalLink className="w-4 h-4 text-slate-300" />
              </a>
              <a href="https://t.me/GetMyChatID_Bot" target="_blank" className="flex items-center justify-between p-4 rounded-xl bg-white border border-indigo-50 hover:border-indigo-200 transition-all group">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-indigo-600">@GetMyChatID_Bot</span>
                <ExternalLink className="w-4 h-4 text-slate-300" />
              </a>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
