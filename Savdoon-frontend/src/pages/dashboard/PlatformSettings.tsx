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
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storeApi } from '../../services/api';
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
  const [isCopied, setIsCopied] = useState(false);

  const handleSave = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      await storeApi.update(currentStore.id, {
        telegram_bot_token: botToken,
        telegram_chat_id: chatId
      });
      await loadStores?.();
      setStep(4); // Move to success step
    } catch (error) {
       console.error('Failed to update platform settings:', error);
       alert('Xatolik yuz berdi');
    }
    setLoading(false);
  };

  const handleTest = async () => {
    if (!currentStore?.id) return;
    setTesting(true);
    try {
      const res = await storeApi.testTelegram(currentStore.id, {
        bot_token: botToken,
        chat_id: chatId
      });
      if (res.data.message) {
         alert(language === 'uz' ? "Test xabari muvaffaqiyatli yuborildi!" : "Test message sent successfully!");
      }
    } catch (error) {
      alert(language === 'uz' ? "Test xabari yuborishda xatolik. Token yoki Chat ID ni tekshiring." : "Failed to send test message. Check Token or Chat ID.");
    }
    setTesting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
            {language === 'uz' ? 'Platformalar' : 'Platforms'}
          </h1>
          <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">
            {language === 'uz' ? "Telegram va boshqa savdo kanallarini sozlash" : "Setup Telegram and other sales channels"}
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
                           <Zap className="w-3.5 h-3.5" /> API Token (HTTP API)
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
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Chat ID ni aniqlash</h3>
                       <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-xl">
                        Bot sizga buyurtmalar haqida xabar yuborishi uchun, botga <code className="text-indigo-600 bg-indigo-50 px-1 rounded">/start</code> yuboring va Chat ID ni oling. <a href="https://t.me/GetMyChatID_Bot" target="_blank" className="font-bold text-indigo-500 hover:underline">@GetMyChatID_Bot</a> dan foydalanishingiz mumkin.
                      </p>
                      
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telegram Chat ID</label>
                        <Input 
                          value={chatId} 
                          onChange={setChatId} 
                          placeholder="123456789" 
                          className="!rounded-2xl !bg-slate-50 !border-slate-100 !h-16 font-black tracking-widest"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <Button 
                          onClick={handleTest} 
                          disabled={testing || !botToken || !chatId}
                          className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] bg-emerald-50 text-emerald-600 border border-emerald-100 border-2"
                        >
                          {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Test Xabari"}
                        </Button>
                        <Button 
                          onClick={handleSave} 
                          disabled={loading || !botToken || !chatId}
                          className="flex-1 rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sozlamalarni Saqlash"}
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
                    <Button onClick={() => setStep(1)} className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                      Qaytadan Sozlash
                    </Button>
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
