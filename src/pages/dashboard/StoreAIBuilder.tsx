import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, RefreshCw, Smartphone, MessageSquare, Loader2, Code, Save, FileCode, FolderPlus, FilePlus, Trash2, Paintbrush, Check } from 'lucide-react';
import { IPhone16Frame } from '../../components/IPhone16Frame';
import { Storefront } from '../Storefront';
import { supabaseApi } from '../../services/supabaseService';
import { supabase } from '../../supabase';
import { useApp } from '../../context/AppContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function StoreAIBuilder({ storeId, onReload }: { storeId: number; onReload?: () => void }) {
  const { language } = useApp();
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(`ai_builder_msgs_${storeId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        // Fallback to initial message
      }
    }
    return [
      {
        id: '1',
        text: language === 'uz' ? "Assalomu alaykum! Men do'koningizning AI dizayneriman. Qanday dizayn o'zgarishlarini xohlaysiz? Masalan: 'Ko'k rangli Korzinka uslubida dizayn ber' yoki 'Barcha tugmalarni yumaloq qil'." : "Hello! I am your store's AI designer. What design changes would you like? For example: 'Create a blue Korzinka-style design' or 'Make all buttons rounded'.", 
        sender: 'ai',
        timestamp: new Date()
      }
    ];
  });
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  
  // Tab state: chat | schema | html | design | visual
  const [activeTab, setActiveTab] = useState<'chat' | 'schema' | 'html' | 'design' | 'visual'>('chat');
  
  // Selected Element State for Visual Editor
  const [selectedElement, setSelectedElement] = useState<any>(null);

  // Design Settings State (PUBG/Standoff 2 style)
  const [designConfig, setDesignConfig] = useState({
    primary_color: '#6366F1',
    secondary_color: '#8B5CF6',
    accent_color: '#F43F5E',
    font_family: "'Inter', sans-serif",
    font_size: 'medium',
    border_radius: '2rem',
    card_style: 'flat',
    banner_style: 'rounded',
    button_style: 'rounded',
  });
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [designSaved, setDesignSaved] = useState(false);
  
  // Schema Editor State
  const [schemaCode, setSchemaCode] = useState('[]');
  const [isSavingSchema, setIsSavingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState('');
  
  // HTML/Files Editor State
  const [htmlCode, setHtmlCode] = useState('');
  const [storeFiles, setStoreFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [isSavingHtml, setIsSavingHtml] = useState(false);
  const [htmlError, setHtmlError] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Key for individual store drafts
  const DRAFT_KEY = `savdogar_builder_draft_${storeId}`;

  // Persistence
  useEffect(() => {
    localStorage.setItem(`ai_builder_msgs_${storeId}`, JSON.stringify(messages));
  }, [messages, storeId]);
  useEffect(() => {
    if (activeTab === 'schema' || activeTab === 'html' || activeTab === 'design') {
      supabaseApi.stores.get(storeId).then(res => {
        const storeData = res;
        const dbSchema = JSON.stringify(storeData.ui_schema || [], null, 2);
        setSchemaCode(dbSchema);
        setSchemaError('');
        
        let files = storeData.store_files || {};
        let needsSave = false;
        
        // Auto-migration for legacy store_html
        if (Object.keys(files).length === 0 && storeData.store_html) {
          files['index.html'] = storeData.store_html;
          needsSave = true;
        }
        
        setStoreFiles(files);
        setHtmlCode(files[activeFile] || files['index.html'] || '');
        setHtmlError('');

        // Load design config from theme_config
        const cfg = storeData.theme_config || {};
        setDesignConfig(prev => ({
          ...prev,
          primary_color: storeData.primary_color || cfg.primary_color || '#6366F1',
          secondary_color: storeData.secondary_color || cfg.secondary_color || '#8B5CF6',
          accent_color: cfg.accent_color || '#F43F5E',
          font_family: cfg.font_family || "'Inter', sans-serif",
          font_size: cfg.font_size || 'medium',
          border_radius: cfg.border_radius || '2rem',
          card_style: cfg.card_style || 'flat',
          banner_style: cfg.banner_style || 'rounded',
          button_style: cfg.button_style || 'rounded',
        }));
        
        // Persist the migration to backend immediately if needed
        if (needsSave) {
          supabaseApi.builder.saveFiles(storeId, files).catch(err => console.error("Initial migration save failed", err));
        }

        // Check for local drafts after fetching DB data
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            // Only show restore prompt if draft differs from current DB data
            const draftFilesJson = JSON.stringify(draft.files || {});
            const currentFilesJson = JSON.stringify(files);
            if (draftFilesJson !== currentFilesJson || draft.schema !== dbSchema) {
              setHasDraft(true);
            }
          } catch (e) {
            console.error("Draft error", e);
          }
        }
      }).catch(err => console.error("Could not fetch store data", err));
    }
  }, [activeTab, storeId, previewKey]);

  // Auto-save drafts to localStorage
  useEffect(() => {
    if (Object.keys(storeFiles).length > 0) {
      const draft = {
        files: storeFiles,
        schema: schemaCode,
        timestamp: Date.now()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [storeFiles, schemaCode]);

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.files) {
          setStoreFiles(draft.files);
          if (draft.files[activeFile]) setHtmlCode(draft.files[activeFile]);
        }
        if (draft.schema) setSchemaCode(draft.schema);
        setHasDraft(false);
      } catch (e) {
        console.error("Restore failed", e);
      }
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  useEffect(() => {
    // Keep htmlCode in sync with storeFiles[activeFile]
    if (storeFiles[activeFile] !== undefined) {
      setHtmlCode(storeFiles[activeFile]);
    }
  }, [activeFile, storeFiles]);

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
      await supabaseApi.builder.saveSchema(storeId, parsed);
      setPreviewKey(k => k + 1);
      
      // Reload store data in AppContext
      if (onReload) {
        await onReload();
      }
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
      
      // Update the current file in the tree before saving
      const updatedFiles = { ...storeFiles, [activeFile]: htmlCode };
      setStoreFiles(updatedFiles);
      
      await supabaseApi.builder.saveFiles(storeId, updatedFiles);
      setPreviewKey(k => k + 1);
      
      // Reload store data in AppContext
      if (onReload) {
        await onReload();
      }
    } catch (e: any) {
      setHtmlError(e.response?.data?.error || e.message || "Failed to save files");
    } finally {
      setIsSavingHtml(false);
      // Clear draft on successful save
      localStorage.removeItem(DRAFT_KEY);
    }
  };

  const createFile = (path: string) => {
    if (storeFiles[path]) return;
    setStoreFiles(prev => ({ ...prev, [path]: '' }));
    setActiveFile(path);
  };

  const deleteFile = (path: string) => {
    const newFiles = { ...storeFiles };
    delete newFiles[path];
    setStoreFiles(newFiles);
    if (activeFile === path) setActiveFile('index.html');
  };

  const handleSend = async (forcedInput?: string) => {
    const textToSend = forcedInput || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!forcedInput) setInput('');
    setIsTyping(true);

    try {
      // Supabase Edge Function call
      const { data: aiData, error } = await supabase.functions.invoke('ai-builder', {
        body: { 
          message: textToSend,
          store_id: storeId,
          store_files: Object.keys(storeFiles).length > 0 ? storeFiles : undefined
        }
      });

      if (error) throw error;
      
      // Update store files if AI returned them
      if (aiData.store_files && Object.keys(aiData.store_files).length > 0) {
        setStoreFiles(aiData.store_files);
        setPreviewKey(k => k + 1);
        
        // Auto-save to backend
        try {
          await supabaseApi.builder.saveFiles(storeId, aiData.store_files);
        } catch (saveError) {
          console.error('Auto-save failed:', saveError);
        }
      }
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiData.ai_reply || aiData.message || "Dizayn yangilandi!",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      
      // Reload store data in AppContext
      if (onReload) {
        await onReload();
      }
    } catch (error: any) {
      console.error('AI Builder error:', error);
      const errMsg = error.response?.data?.details || error.response?.data?.error || error.response?.data?.ai_logic_summary || "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.";
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

  const handleGenerateTemplate = async (type: 'general' | 'driving_school' = 'general') => {
    if (!storeId) {
      alert('Store ID topilmadi!');
      return;
    }
    
    setIsGenerating(true);
    try {
      const messageText = type === 'driving_school' 
        ? 'Generate a professional Driving School (Avtomaktab) template with course categories (A, B, C), instructor section, and registration form'
        : 'Generate a professional storefront template for my business type';

      const { data: aiData, error } = await supabase.functions.invoke('ai-builder', {
        body: { 
          message: messageText,
          store_id: storeId,
          generate_template: true
        }
      });

      if (error) throw error;
      
      if (aiData.store_files && Object.keys(aiData.store_files).length > 0) {
        setStoreFiles(aiData.store_files);
        setPreviewKey(k => k + 1);
        
        // Auto-save to backend
        try {
          await supabaseApi.builder.saveFiles(storeId, aiData.store_files);
        } catch (saveError) {
          console.error('Auto-save failed:', saveError);
        }
        
        // Reload store data
        if (onReload) {
          await onReload();
        }
      }
      
      const aiMsg: Message = {
        id: Date.now().toString(),
        text: aiData.ai_reply || aiData.message || (type === 'driving_school' ? '✅ Avtomaktab shabloni yaratildi!' : '✅ Professional template generated!'),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error('Failed to generate template:', error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: error.response?.data?.error || '❌ Failed to generate template. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualUpdate = (field: string, value: string) => {
    if (!selectedElement) return;
    
    // Update local state first for instant UI response
    setSelectedElement((prev: any) => ({ ...prev, [field]: value }));
    
    // Create a parser to update the HTML string
    const doc = new DOMParser().parseFromString(htmlCode, 'text/html');
    const el = doc.querySelector(selectedElement.selectorPath);
    if (el) {
      if (field === 'text') {
        el.textContent = value;
      } else if (field === 'href') {
        el.setAttribute('href', value);
      } else if (field === 'color') {
        (el as HTMLElement).style.color = value;
      } else if (field === 'backgroundColor') {
        (el as HTMLElement).style.backgroundColor = value;
      }
      
      const newHtml = doc.body.innerHTML;
      setHtmlCode(newHtml);
      
      // Update storeFiles immediately
      setStoreFiles(prev => ({ ...prev, [activeFile]: newHtml }));
      
      // Optional: Auto-save or trigger preview refresh
      // setPreviewKey(k => k + 1);
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
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="px-6 py-3 bg-[var(--brand-primary)] text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:scale-105 disabled:opacity-50"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => handleGenerateTemplate('general')}
                disabled={isGenerating}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-xs transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                title="Generate Professional Template"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span className="hidden sm:inline">Generate</span>
              </button>

              <button
                onClick={() => handleGenerateTemplate('driving_school')}
                disabled={isGenerating}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-xs transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                title="Generate Driving School Template (AvtoX)"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                <span className="hidden sm:inline">AvtoX</span>
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

    if (activeTab === 'design') {
      const fontOptions = [
        { label: 'Inter', value: "'Inter', sans-serif" },
        { label: 'Roboto', value: "'Roboto', sans-serif" },
        { label: 'Outfit', value: "'Outfit', sans-serif" },
        { label: 'Poppins', value: "'Poppins', sans-serif" },
        { label: 'Montserrat', value: "'Montserrat', sans-serif" },
        { label: 'Nunito', value: "'Nunito', sans-serif" },
      ];
      const fontSizes = [
        { label: 'S', value: 'small' },
        { label: 'M', value: 'medium' },
        { label: 'L', value: 'large' },
        { label: 'XL', value: 'xlarge' },
      ];
      const radiusOptions = [
        { label: '0', value: '0px' },
        { label: '8', value: '0.5rem' },
        { label: '16', value: '1rem' },
        { label: '24', value: '1.5rem' },
        { label: '32', value: '2rem' },
      ];

      const handleSaveDesign = async () => {
        setIsSavingDesign(true);
        try {
        await supabaseApi.stores.update(storeId, {
          primary_color: designConfig.primary_color,
          secondary_color: designConfig.secondary_color,
          theme_config: { ...designConfig },
        });
          setDesignSaved(true);
          setTimeout(() => setDesignSaved(false), 2500);
          setPreviewKey(k => k + 1);
          if (onReload) await onReload();
        } catch (e) {
          console.error('Failed to save design:', e);
        } finally {
          setIsSavingDesign(false);
        }
      };

      const ColorRow = ({ label, configKey }: { label: string; configKey: string }) => (
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-widest">{label}</span>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl border-2 border-white/10 shadow-lg cursor-pointer relative overflow-hidden" style={{ backgroundColor: (designConfig as any)[configKey] }}>
              <input type="color" value={(designConfig as any)[configKey]} onChange={(e) => setDesignConfig(prev => ({ ...prev, [configKey]: e.target.value }))} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </div>
            <input type="text" value={(designConfig as any)[configKey]} onChange={(e) => setDesignConfig(prev => ({ ...prev, [configKey]: e.target.value }))} className="w-[88px] px-2.5 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[10px] font-mono font-bold text-[var(--text-main)] uppercase" />
          </div>
        </div>
      );

      return (
        <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar">
          {/* 🎨 RANGLAR */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/80 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center gap-2.5 bg-gradient-to-r from-rose-500/10 to-transparent">
              <span className="text-base">🎨</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-main)]">RANGLAR</span>
            </div>
            <div className="p-4 space-y-3">
              <ColorRow label="Asosiy rang" configKey="primary_color" />
              <ColorRow label="Ikkinchi rang" configKey="secondary_color" />
              <ColorRow label="Aksent rang" configKey="accent_color" />
            </div>
          </div>

          {/* 📐 SHRIFT */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/80 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center gap-2.5 bg-gradient-to-r from-blue-500/10 to-transparent">
              <span className="text-base">📐</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-main)]">SHRIFT</span>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block mb-2">Shrift turi</span>
                <select value={designConfig.font_family} onChange={(e) => setDesignConfig(prev => ({ ...prev, font_family: e.target.value }))} className="w-full px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs font-bold text-[var(--text-main)] focus:outline-none focus:ring-2 ring-[var(--brand-primary)]/30">
                  {fontOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block mb-2">Hajmi</span>
                <div className="grid grid-cols-4 gap-2">
                  {fontSizes.map(s => (
                    <button key={s.value} onClick={() => setDesignConfig(prev => ({ ...prev, font_size: s.value }))} className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${ designConfig.font_size === s.value ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary)]/30' : 'bg-[var(--color-surface)] text-[var(--text-dim)] border-[var(--color-border)] hover:border-[var(--brand-primary)]/50' }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 🔲 SHAKL */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/80 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center gap-2.5 bg-gradient-to-r from-emerald-500/10 to-transparent">
              <span className="text-base">🔲</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-main)]">SHAKL</span>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block mb-2">Burchak radiusi</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {radiusOptions.map(r => (
                    <button key={r.value} onClick={() => setDesignConfig(prev => ({ ...prev, border_radius: r.value }))} className={`py-2 rounded-xl text-[10px] font-black transition-all border ${ designConfig.border_radius === r.value ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary)]/30' : 'bg-[var(--color-surface)] text-[var(--text-dim)] border-[var(--color-border)] hover:border-[var(--brand-primary)]/50' }`}>
                      {r.label}px
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block mb-2">Karta uslubi</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['flat', 'elevated'] as const).map(style => (
                    <button key={style} onClick={() => setDesignConfig(prev => ({ ...prev, card_style: style }))} className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${ designConfig.card_style === style ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary)]/30' : 'bg-[var(--color-surface)] text-[var(--text-dim)] border-[var(--color-border)] hover:border-[var(--brand-primary)]/50' }`}>
                      {style === 'flat' ? 'Tekis' : "Ko'tarilgan"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block mb-2">Banner uslubi</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['sharp', 'rounded', 'glass'] as const).map(style => (
                    <button key={style} onClick={() => setDesignConfig(prev => ({ ...prev, banner_style: style }))} className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${ designConfig.banner_style === style ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary)]/30' : 'bg-[var(--color-surface)] text-[var(--text-dim)] border-[var(--color-border)] hover:border-[var(--brand-primary)]/50' }`}>
                      {style === 'sharp' ? "To'g'ri" : style === 'rounded' ? 'Yumaloq' : 'Shisha'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <motion.button
            onClick={handleSaveDesign}
            disabled={isSavingDesign}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl ${ designSaved ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary)]/30 hover:shadow-[var(--brand-primary)]/50' } disabled:opacity-50`}
          >
            {isSavingDesign ? <Loader2 className="w-4 h-4 animate-spin" /> : designSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {designSaved ? 'SAQLANDI ✓' : 'SAQLASH'}
          </motion.button>
        </div>
      );
    }

    if (activeTab === 'visual') {
      return (
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {!selectedElement ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-dim)] space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-raised)] border-2 border-dashed border-[var(--color-border)] flex items-center justify-center animate-pulse">
                <Smartphone className="w-8 h-8 text-[var(--brand-primary)] opacity-50" />
              </div>
              <div>
                <h3 className="text-[12px] font-black uppercase tracking-widest text-[var(--text-main)] mb-1">Elementni tanlang</h3>
                <p className="text-[10px] font-bold">O'ng tomondagi iPhone ekranidan istalgan elementni (matn, tugma, rasm) ustiga bosing.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/80 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Code className="w-24 h-24" />
                </div>
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <span className="px-2 py-1 bg-rose-500/20 text-rose-500 rounded text-[9px] font-black uppercase tracking-widest">
                    {selectedElement.tagName}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-dim)] truncate max-w-[200px]">
                    {selectedElement.selectorPath}
                  </span>
                </div>
                
                <div className="space-y-3 relative z-10">
                  {selectedElement.text && (
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block mb-1">Matn (Text)</label>
                      <textarea
                        value={selectedElement.text}
                        onChange={(e) => handleManualUpdate('text', e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-2.5 text-xs font-medium text-[var(--text-main)] resize-none focus:ring-2 ring-[var(--brand-primary)]/50 transition-all outline-none"
                        rows={3}
                      />
                    </div>
                  )}
                  
                  {selectedElement.href && (
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block mb-1">Havola (Link)</label>
                      <input
                        type="text"
                        value={selectedElement.href}
                        onChange={(e) => handleManualUpdate('href', e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-2.5 text-xs font-medium text-[var(--text-main)] focus:ring-2 ring-[var(--brand-primary)]/50 transition-all outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block mb-1">Rang (Color)</label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded border border-[var(--color-border)] relative overflow-hidden shadow-sm">
                           <input type="color" value={selectedElement.color.startsWith('#') ? selectedElement.color : '#000000'} onChange={(e) => handleManualUpdate('color', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                           <div className="w-full h-full pointer-events-none" style={{ backgroundColor: selectedElement.color }} />
                        </div>
                        <span className="text-[10px] font-mono text-[var(--text-main)]">{selectedElement.color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block mb-1">Fons (Background)</label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded border border-[var(--color-border)] relative overflow-hidden shadow-sm bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')]">
                           <input type="color" value={selectedElement.backgroundColor.startsWith('#') ? selectedElement.backgroundColor : '#ffffff'} onChange={(e) => handleManualUpdate('backgroundColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                           <div className="w-full h-full pointer-events-none" style={{ backgroundColor: selectedElement.backgroundColor !== 'rgba(0, 0, 0, 0)' ? selectedElement.backgroundColor : 'transparent' }} />
                        </div>
                        <span className="text-[10px] font-mono text-[var(--text-main)] truncate max-w-[80px]">{selectedElement.backgroundColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/80 p-4 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> AI Yordamchi
                </h4>
                <p className="text-[10px] font-bold text-[var(--text-dim)]">Shu elementni o'zgartirish uchun AI'ga buyruq bering (masalan: "Matnni qizil qil va shriftni kattalashtir").</p>
                <div className="flex items-center gap-2 bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)]">
                  <input
                    type="text"
                    placeholder="Buyruq yozing..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        if (target.value.trim()) {
                          handleSend(`Ushbu elementni o'zgartir: (Teg: ${selectedElement.tagName}, Matn: "${selectedElement.text}"). Buyruq: ${target.value}`);
                          target.value = '';
                          setActiveTab('chat');
                        }
                      }
                    }}
                    className="flex-1 bg-transparent px-3 py-1.5 text-[11px] font-medium text-[var(--text-main)] outline-none"
                  />
                  <button onClick={() => {
                    const input = document.querySelector('input[placeholder="Buyruq yozing..."]') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleSend(`Ushbu elementni o'zgartir: (Teg: ${selectedElement.tagName}, Matn: "${selectedElement.text}"). Buyruq: ${input.value}`);
                      input.value = '';
                      setActiveTab('chat');
                    }
                  }} className="p-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // HTML Tab (Explorer Mode)
    return (
      <div className="flex-1 flex overflow-hidden">
        {/* Explorer Sidebar */}
        <div className="w-64 border-r border-[var(--color-border)] bg-[var(--color-surface-raised)]/50 flex flex-col">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">Explorer</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const name = prompt(language === 'uz' ? "Fayl nomi (masalan: style.css):" : "File name (e.g. style.css):");
                  if (name) createFile(name);
                }}
                className="p-1 hover:bg-[var(--color-surface)] rounded transition-colors" title="New File"
              >
                <FilePlus className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              </button>
              <button className="p-1 hover:bg-[var(--color-surface)] rounded transition-colors" title="New Folder">
                <FolderPlus className="w-3.5 h-3.5 text-[var(--text-dim)]" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {Object.keys(storeFiles).sort().map(path => (
              <div 
                key={path}
                onClick={() => setActiveFile(path)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${activeFile === path ? 'bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20' : 'hover:bg-[var(--color-surface)] border border-transparent'}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {path.endsWith('.html') ? <Code className={`w-3.5 h-3.5 ${activeFile === path ? 'text-[var(--brand-primary)]' : 'text-orange-400'}`} /> : 
                   path.endsWith('.css') ? <FileCode className={`w-3.5 h-3.5 ${activeFile === path ? 'text-[var(--brand-primary)]' : 'text-blue-400'}`} /> :
                   <FileCode className={`w-3.5 h-3.5 ${activeFile === path ? 'text-[var(--brand-primary)]' : 'text-emerald-400'}`} />}
                  <span className={`text-[11px] font-bold truncate ${activeFile === path ? 'text-[var(--text-main)]' : 'text-[var(--text-dim)]'}`}>{path}</span>
                </div>
                {path !== 'index.html' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteFile(path); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {/* File Name Header */}
          <div className="bg-[#252526] px-4 py-2 border-b border-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#cccccc]">{activeFile}</span>
            </div>
            
            {hasDraft && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full"
              >
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                  {language === 'uz' ? 'Saqlanmagan o\'zgarishlar bor!' : 'Unsaved Changes Found!'}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={restoreDraft}
                    className="text-[9px] font-black uppercase text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                  >
                    {language === 'uz' ? 'Tiklash' : 'Restore'}
                  </button>
                  <button 
                    onClick={discardDraft}
                    className="text-[9px] font-black uppercase text-red-400 hover:text-red-300 underline underline-offset-2"
                  >
                    {language === 'uz' ? 'O\'chirish' : 'Discard'}
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex items-center gap-4">
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 animate-pulse">Editor Mode</span>
              <button 
                onClick={handleSaveHtml}
                disabled={isSavingHtml}
                className="flex items-center gap-1.5 px-3 py-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {isSavingHtml ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
            </div>
          </div>
          
          <textarea 
            value={htmlCode} 
            onChange={e => setHtmlCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] p-6 font-mono text-xs focus:outline-none resize-none leading-relaxed selection:bg-[var(--brand-primary)]/30"
            style={{ tabSize: 2 }}
          />

          {htmlError && (
            <div className="p-2 bg-red-500/10 border-t border-red-500/20">
               <p className="text-red-500 text-[9px] font-bold uppercase tracking-widest px-2">{htmlError}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-4 p-4 overflow-hidden">
      {/* Global Header */}
      <div className="p-6 border border-[var(--color-border)] flex items-center justify-between gap-4 bg-[var(--color-surface)] rounded-[2rem] shadow-xl shrink-0">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight leading-none">AI Designer</h2>
            <p className="text-[10px] text-[var(--brand-primary)] font-black uppercase tracking-widest mt-1">Real-time Customization</p>
          </div>
        </div>
        
        {/* 4-Tab Switcher */}
        <div className="flex bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-[var(--brand-primary)] text-white shadow-md' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
          >
            <MessageSquare className="w-3 h-3" /> Chat
          </button>
          <button 
            onClick={() => setActiveTab('design')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'design' ? 'bg-indigo-500 text-white shadow-md' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
          >
            <Paintbrush className="w-3 h-3" /> Dizayn
          </button>
          <button 
            onClick={() => setActiveTab('visual')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'visual' ? 'bg-rose-500 text-white shadow-md' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
          >
            <Smartphone className="w-3 h-3" /> Visual Element
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 lg:max-w-[55%] flex flex-col min-w-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          {renderTabContent()}
        </div>

        {/* Right Preview Panel */}
        <div className="flex-1 hidden lg:flex flex-col items-center justify-center relative bg-transparent p-0 overflow-hidden">
            <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
                <Smartphone className="w-4 h-4 text-[var(--brand-primary)] drop-shadow-md" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] drop-shadow-md">iPhone 16 Pro Max Preview</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto transform scale-[0.70] xl:scale-[0.80] origin-center transition-transform duration-500 ease-out">
                <IPhone16Frame>
                    <Storefront 
                      key={previewKey} 
                      storeId={storeId} 
                      onBack={() => {}} 
                      isPreview={true}
                      onElementSelect={(el) => {
                        setSelectedElement(el);
                        setActiveTab('visual');
                      }}
                    />
                </IPhone16Frame>
                </div>
            </div>
            {activeTab === 'chat' && (
              <div className="absolute bottom-10 flex flex-wrap justify-center gap-2 px-6">
                  <button onClick={() => handleSend("Korzinka uslubida qizil rangli dizayn")} className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[10px] font-black uppercase tracking-widest hover:border-[var(--brand-primary)] transition-all text-[var(--text-dim)] hover:text-[var(--brand-primary)] shadow-sm">
                      🍓 Korzinka Style
                  </button>
                  <button onClick={() => handleSend("Minimalist dark mode dizayn")} className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[10px] font-black uppercase tracking-widest hover:border-[var(--brand-primary)] transition-all text-[var(--text-dim)] hover:text-[var(--brand-primary)] shadow-sm">
                      🌙 Dark Minimalist
                  </button>
                  <button onClick={() => handleSend("Pushti rangli premium dizayn")} className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[10px] font-black uppercase tracking-widest hover:border-[var(--brand-primary)] transition-all text-[var(--text-dim)] hover:text-[var(--brand-primary)] shadow-sm">
                      ✨ Luxury Pink
                  </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
