import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, RefreshCw, Smartphone, MessageSquare, Loader2, Code, Save, FileCode } from 'lucide-react';
import { IPhone16Frame } from '../../components/IPhone16Frame';
import { Storefront } from '../Storefront';
import api, { builderApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const DEFAULT_STORE_HTML = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg-main, #0a0a0f); color: var(--text-primary, #fff); }
    .header { padding: 16px 24px; background: var(--color-surface, #12121a); border-bottom: 1px solid var(--color-border, #1e1e2e); display: flex; align-items: center; justify-content: space-between; }
    .header h1 { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
    .banner { width: 100%; height: 300px; background: linear-gradient(135deg, var(--primary, #6366f1), var(--secondary, #8b5cf6)); display: flex; align-items: center; justify-content: center; }
    .banner h2 { font-size: 32px; font-weight: 900; color: white; text-transform: uppercase; }
    .search-bar { padding: 20px 24px; }
    .search-bar input { width: 100%; padding: 14px 20px; border-radius: 16px; border: 1px solid var(--color-border, #1e1e2e); background: var(--color-surface, #12121a); color: var(--text-primary, #fff); font-size: 14px; outline: none; }
    .products { padding: 20px 24px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .product-card { background: var(--color-surface, #12121a); border: 1px solid var(--color-border, #1e1e2e); border-radius: 20px; overflow: hidden; transition: transform 0.3s; }
    .product-card:hover { transform: translateY(-4px); }
    .product-card .img { height: 160px; background: var(--color-surface-raised, #1a1a2e); display: flex; align-items: center; justify-content: center; color: var(--text-muted, #666); }
    .product-card .info { padding: 16px; }
    .product-card .name { font-weight: 800; font-size: 14px; text-transform: uppercase; margin-bottom: 8px; }
    .product-card .price { font-weight: 900; font-size: 18px; color: var(--primary, #6366f1); }
    .footer { padding: 24px; text-align: center; border-top: 1px solid var(--color-border, #1e1e2e); margin-top: 40px; }
    .footer p { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted, #666); }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{STORE_NAME}}</h1>
    <span style="font-size:10px; color: var(--primary); font-weight:900; text-transform:uppercase; letter-spacing:2px;">{{BUSINESS_TYPE}}</span>
  </div>
  
  <div class="banner">
    <h2>{{STORE_NAME}}</h2>
  </div>
  
  <div class="search-bar">
    <input type="text" placeholder="Qidirish..." />
  </div>
  
  {{PRODUCTS_GRID}}
  
  <div class="footer">
    <p>© {{STORE_NAME}} — Barcha huquqlar himoyalangan</p>
  </div>
</body>
</html>`;

export function StoreAIBuilder({ storeId }: { storeId: number }) {
  const { language } = useApp();
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
  const [previewKey, setPreviewKey] = useState(0);
  
  // Tab state: chat | schema | html
  const [activeTab, setActiveTab] = useState<'chat' | 'schema' | 'html'>('chat');
  
  // Schema Editor State
  const [schemaCode, setSchemaCode] = useState('[]');
  const [isSavingSchema, setIsSavingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState('');
  
  // HTML Editor State
  const [htmlCode, setHtmlCode] = useState('');
  const [isSavingHtml, setIsSavingHtml] = useState(false);
  const [htmlError, setHtmlError] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch store data when switching tabs
  useEffect(() => {
    if (activeTab === 'schema' || activeTab === 'html') {
      api.get(`/stores/${storeId}/`).then(res => {
        setSchemaCode(JSON.stringify(res.data.ui_schema || [], null, 2));
        setSchemaError('');
        setHtmlCode(res.data.store_html || DEFAULT_STORE_HTML);
        setHtmlError('');
      }).catch(err => console.error("Could not fetch store data", err));
    }
  }, [activeTab, storeId, previewKey]);

  useEffect(() => {
    if (scrollRef.current && activeTab === 'chat') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeTab]);

  const handleSaveSchema = async () => {
    try {
      setIsSavingSchema(true);
      setSchemaError('');
      const parsed = JSON.parse(schemaCode);
      if (!Array.isArray(parsed)) throw new Error("Schema must be a JSON array.");
      await builderApi.saveSchema(storeId, parsed);
      setPreviewKey(k => k + 1);
    } catch (e: any) {
      setSchemaError(e.message || "Invalid JSON array");
    } finally {
      setIsSavingSchema(false);
    }
  };

  const handleSaveHtml = async () => {
    try {
      setIsSavingHtml(true);
      setHtmlError('');
      await builderApi.saveHtml(storeId, htmlCode);
      setPreviewKey(k => k + 1);
    } catch (e: any) {
      setHtmlError(e.response?.data?.error || e.message || "Failed to save HTML");
    } finally {
      setIsSavingHtml(false);
    }
  };

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
      setPreviewKey(prev => prev + 1);
    } catch (error: any) {
      console.error('AI Builder error:', error);
      const errMsg = error.response?.data?.error || "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.";
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: errMsg,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'chat') {
      return (
        <>
          {/* Chat Messages */}
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

          {/* Chat Input */}
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
        </>
      );
    }

    if (activeTab === 'schema') {
      return (
        <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
          <div className="flex-1 relative flex flex-col rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="bg-[var(--color-surface-raised)] px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">ui_schema.json</span>
            </div>
            <textarea 
              value={schemaCode} 
              onChange={e => setSchemaCode(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] p-4 font-mono text-xs focus:outline-none resize-none leading-relaxed"
              style={{ tabSize: 2 }}
            />
          </div>
          {schemaError && (
            <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest px-2">{schemaError}</p>
          )}
          <button 
            onClick={handleSaveSchema}
            disabled={isSavingSchema}
            className="w-full py-3.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--brand-primary)]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSavingSchema ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {language === 'uz' ? 'Schemani Saqlash' : 'Save Schema'}
          </button>
        </div>
      );
    }

    // HTML Tab
    return (
      <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
        <div className="flex-1 relative flex flex-col rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="bg-[var(--color-surface-raised)] px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">storefront.html</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">LIVE EDITOR</span>
          </div>
          <textarea 
            value={htmlCode} 
            onChange={e => setHtmlCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-[#1e1e1e] text-[#ce9178] p-4 font-mono text-xs focus:outline-none resize-none leading-relaxed"
            style={{ tabSize: 2 }}
          />
        </div>
        {htmlError && (
          <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest px-2">{htmlError}</p>
        )}
        <button 
          onClick={handleSaveHtml}
          disabled={isSavingHtml}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isSavingHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {language === 'uz' ? 'HTML Saqlash va Yangilash' : 'Save HTML & Refresh'}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 p-4 overflow-hidden">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl relative">
        {/* Header with Tabs */}
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight leading-none">AI Designer</h2>
              <p className="text-[10px] text-[var(--brand-primary)] font-black uppercase tracking-widest mt-1">Real-time Customization</p>
            </div>
          </div>
          
          {/* 3-Tab Switcher */}
          <div className="flex bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('chat')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-[var(--brand-primary)] text-white shadow-md' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
            >
              <MessageSquare className="w-3 h-3" /> Chat
            </button>
            <button 
              onClick={() => setActiveTab('schema')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'schema' ? 'bg-[var(--brand-primary)] text-white shadow-md' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
            >
              <Code className="w-3 h-3" /> Schema
            </button>
            <button 
              onClick={() => setActiveTab('html')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'html' ? 'bg-emerald-500 text-white shadow-md' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
            >
              <FileCode className="w-3 h-3" /> HTML
            </button>
          </div>

          <button onClick={() => setPreviewKey(k => k + 1)} className="p-2.5 rounded-xl hover:bg-[var(--color-surface-raised)] transition-all text-[var(--text-dim)]" title="Refresh Preview">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Tab Content */}
        {renderTabContent()}
      </div>

      {/* Right Preview Panel */}
      <div className="flex-1 hidden lg:flex flex-col items-center justify-center relative bg-transparent p-0 overflow-hidden">
        <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
            <Smartphone className="w-4 h-4 text-[var(--brand-primary)] drop-shadow-md" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] drop-shadow-md">iPhone 16 Pro Max Preview</span>
        </div>
        
        <div className="flex items-center justify-center transform scale-[0.70] xl:scale-[0.80] origin-center transition-transform duration-500 ease-out">
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
