import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Wand2, RefreshCw, Smartphone, Palette, Layout, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { IPhone16Frame } from '../../components/IPhone16Frame';
import { Storefront } from '../Storefront';
import { builderApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { GlassCard } from '../../components/GlassCard';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function StoreAIBuilder({ storeId }: { storeId: number }) {
  const { language, t } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: language === 'uz' ? "Assalomu alaykum! Men do'koningizning AI dizayneriman. Qanday dizayn o'zgarishlarini xohlaysiz? Masalan: 'Ko'k rangli Korzinka uslubida dizayn ber' yoki 'Barcha tugmalarni yumaloq qil'." : "Hello! I am your store's AI designer. What design changes would you like? For example: 'Create a blue Korzinka-style design' or 'Make all buttons rounded'.", 
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [previewKey, setPreviewKey] = useState(0); // Used to force-refresh the preview iframe/component
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await builderApi.chat(storeId, input);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.ai_reply,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      // Increment previewKey to trigger a re-fetch of store data in the preview component
      setPreviewKey(prev => prev + 1);
    } catch (error: any) {
      console.error('AI Builder error:', error);
      const errMsg = error.response?.data?.error || "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.";
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: language === 'uz' ? errMsg : errMsg,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 p-4 overflow-hidden">
      {/* Left Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl relative">
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight leading-none">AI Designer</h2>
              <p className="text-[10px] text-[var(--brand-primary)] font-black uppercase tracking-widest mt-1">Real-time Customization</p>
            </div>
          </div>
          <button onClick={() => setPreviewKey(k => k + 1)} className="p-2.5 rounded-xl hover:bg-[var(--color-surface-raised)] transition-all text-[var(--text-dim)]" title="Refresh Preview">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium shadow-sm transition-all ${
                  msg.sender === 'user'
                    ? 'bg-[var(--brand-primary)] text-white rounded-tr-none'
                    : 'bg-[var(--color-surface-raised)] text-[var(--text-main)] border border-[var(--color-border)] rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[var(--color-surface-raised)] p-4 rounded-3xl rounded-tl-none border border-[var(--color-border)]">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--brand-primary)]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] rounded-b-[2.5rem]">
          <div className="flex items-center gap-3 p-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-inner focus-within:ring-2 ring-[var(--brand-primary)]/20 transition-all">
            <input
              type="text"
              placeholder={language === 'uz' ? "Dizaynni o'zgartirish haqida yozing..." : "Describe your design changes..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-[var(--text-main)] font-medium"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="p-3 bg-[var(--brand-primary)] text-white rounded-xl shadow-lg hover:shadow-[var(--brand-primary-glow)] transition-all disabled:opacity-50 disabled:grayscale"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Preview Panel */}
      <div className="flex-1 hidden lg:flex flex-col items-center justify-center relative bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[2.5rem] p-8 shadow-inner overflow-hidden">
        <div className="absolute top-6 left-6 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[var(--brand-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">iPhone 16 Pro Max Preview</span>
        </div>
        
        <div className="scale-[0.85] origin-center">
            <IPhone16Frame>
                <Storefront 
                  key={previewKey} 
                  storeId={storeId} 
                  onBack={() => {}} 
                  isPreview={true}
                />
            </IPhone16Frame>
        </div>
        
        {/* Suggestion Bubbles */}
        <div className="absolute bottom-10 flex flex-wrap justify-center gap-2 px-6">
            <button onClick={() => setInput("Korzinka uslubida qizil rangli dizayn")} className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[10px] font-black uppercase tracking-widest hover:border-[var(--brand-primary)] transition-all text-[var(--text-dim)] hover:text-[var(--brand-primary)] shadow-sm">
                🍓 Korzinka Style
            </button>
            <button onClick={() => setInput("Minimalist dark mode dizayn")} className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[10px] font-black uppercase tracking-widest hover:border-[var(--brand-primary)] transition-all text-[var(--text-dim)] hover:text-[var(--brand-primary)] shadow-sm">
                🌙 Dark Minimalist
            </button>
             <button onClick={() => setInput("Pushti rangli premium dizayn")} className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[10px] font-black uppercase tracking-widest hover:border-[var(--brand-primary)] transition-all text-[var(--text-dim)] hover:text-[var(--brand-primary)] shadow-sm">
                ✨ Luxury Pink
            </button>
        </div>
      </div>
    </div>
  );
}
