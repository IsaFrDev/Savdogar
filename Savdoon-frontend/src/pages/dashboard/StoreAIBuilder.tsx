import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  Smartphone, 
  MessageSquare, 
  Loader2, 
  Code, 
  Zap, 
  FileCode, 
  Plus, 
  Trash2,
  Download
} from 'lucide-react';
import { IPhone16Frame } from '../../components/IPhone16Frame';
import api, { builderApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';

const DEFAULT_STORE_HTML = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #0a0a0f; color: #fff; }
    .header { padding: 16px 24px; background: #12121a; border-bottom: 1px solid #1e1e2e; display: flex; align-items: center; justify-content: space-between; }
    .header h1 { font-size: 18px; font-weight: 900; text-transform: uppercase; }
    .banner { width: 100%; height: 200px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; }
    .banner h2 { font-size: 24px; font-weight: 900; color: white; text-transform: uppercase; }
    .products { padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .card { background: #12121a; border: 1px solid #1e1e2e; border-radius: 15px; padding: 15px; }
    .price { color: #6366f1; font-weight: 900; }
  </style>
</head>
<body>
  <div class="header"><h1>STORE NAME</h1></div>
  <div class="banner"><h2>SEASON SALE</h2></div>
  <div class="products">
    <div class="card"><h3>Product 1</h3><p class="price">100,000 UZS</p></div>
    <div class="card"><h3>Product 2</h3><p class="price">150,000 UZS</p></div>
  </div>
</body>
</html>`;

export function StoreAIBuilder() {
  const { language, currentStore, setThemeMode } = useApp();
  const storeId = currentStore?.id || 0;
  const DRAFT_KEY = `savdoon_builder_draft_${storeId}`;

  // State initialization
  const [messages, setMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem(`${DRAFT_KEY}_history`);
    return saved ? JSON.parse(saved) : [{
      role: 'assistant',
      content: language === 'uz' ? "Assalomu alaykum! Men sizning AI dizayneringizman." : "Hello! I am your AI designer."
    }];
  });

  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeFiles, setStoreFiles] = useState<Record<string, string>>({'index.html': DEFAULT_STORE_HTML});
  const [selectedFile, setSelectedFile] = useState('index.html');
  const [mode, setMode] = useState<'editor' | 'preview'>('editor');
  const [previewKey, setPreviewKey] = useState(0);
  const [isSavingHtml, setIsSavingHtml] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-switch to AI Theme for premium feel
  useEffect(() => {
    const prevTheme = localStorage.getItem('savdoon_theme') || 'light';
    setThemeMode('ai');
    
    // Initial fetch from backend
    api.get(`/stores/${storeId}/`).then(res => {
      const files = res.data.store_files || {};
      if (Object.keys(files).length > 0) {
        setStoreFiles(files);
      }
    }).catch(err => console.error("Fetch failed", err));

    return () => {
      // @ts-ignore
      setThemeMode(prevTheme);
    };
  }, [storeId]);

  // Handle Save
  const handleSaveHtml = async () => {
    setIsSavingHtml(true);
    try {
      await builderApi.saveFiles(storeId, storeFiles);
      setPreviewKey(k => k + 1);
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setIsSavingHtml(false);
    }
  };

  // AI Chat Logic
  const handleSend = async () => {
    if (!promptInput.trim() || loading) return;
    
    const userMsg = { role: 'user', content: promptInput };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setPromptInput('');
    setLoading(true);

    try {
      const response = await api.post('/stores/builder/chat/', {
        store_id: storeId,
        message: promptInput,
        store_files: storeFiles
      });

      const aiData = response.data;
      if (aiData.store_files) {
        setStoreFiles(aiData.store_files);
        setPreviewKey(k => k + 1);
        // Auto-save to backend after AI changes
        await builderApi.saveFiles(storeId, aiData.store_files);
      }

      const aiMsg = { role: 'assistant', content: aiData.ai_reply };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      localStorage.setItem(`${DRAFT_KEY}_history`, JSON.stringify(finalMessages));
    } catch (e) {
      console.error("AI Error", e);
    } finally {
      setLoading(false);
    }
  };

  const generateFullExport = () => {
    const blob = new Blob([JSON.stringify(storeFiles)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `store_export_${storeId}.json`;
    a.click();
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-2xl">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">{language === 'uz' ? 'AI Dizayn Studiyasi' : 'AI Design Studio'}</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isSavingHtml ? (language === 'uz' ? 'Saqlanmoqda...' : 'Synchronizing...') : (language === 'uz' ? 'Tizim tayyor' : 'System Ready')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={generateFullExport} variant="outline" className="rounded-xl h-11 px-6 border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button 
             onClick={handleSaveHtml} 
             disabled={isSavingHtml}
             className="rounded-xl h-11 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
          >
            {isSavingHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {language === 'uz' ? ' Nashr Qilish' : ' Launch Design'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Files Explorer */}
        <div className="w-64 glass-card overflow-hidden flex flex-col !bg-black/40 !border-white/5">
          <div className="p-6 border-b border-white/5 bg-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-between w-full">
               {language === 'uz' ? 'Fayllar' : 'Explorer'}
               <Plus className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => {
                 const name = prompt('File name?');
                 if(name) setStoreFiles({...storeFiles, [name]: ''});
               }}/>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
             {Object.keys(storeFiles).map(fileName => (
               <button
                 key={fileName}
                 onClick={() => setSelectedFile(fileName)}
                 className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                   selectedFile === fileName ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:bg-white/5'
                 }`}
               >
                 <div className="flex items-center gap-3"><FileCode className="w-4 h-4" />{fileName}</div>
                 {fileName !== 'index.html' && <Trash2 className="w-3 h-3 text-slate-700 hover:text-red-500" onClick={(e) => {
                   e.stopPropagation();
                   const {[fileName]: _, ...rest} = storeFiles;
                   setStoreFiles(rest);
                   if(selectedFile === fileName) setSelectedFile('index.html');
                 }}/>}
               </button>
             ))}
          </div>
        </div>

        {/* Editor & AI Chat */}
        <div className="flex-1 flex flex-col gap-6">
           <div className="flex-1 glass-card flex flex-col overflow-hidden !bg-black/20 !border-white/5">
              <div className="flex border-b border-white/5 bg-black/20">
                <button onClick={() => setMode('editor')} className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] ${mode === 'editor' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500'}`}>Editor</button>
                <button onClick={() => setMode('preview')} className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] ${mode === 'preview' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500'}`}>Preview</button>
              </div>
              <div className="flex-1 relative bg-[#0a0a0f]">
                 {mode === 'editor' ? (
                   <textarea
                     value={storeFiles[selectedFile] || ''}
                     onChange={(e) => setStoreFiles({...storeFiles, [selectedFile]: e.target.value})}
                     className="w-full h-full bg-transparent text-indigo-100/80 p-8 font-mono text-sm outline-none resize-none"
                   />
                 ) : (
                   <iframe key={previewKey} srcDoc={storeFiles['index.html']} className="w-full h-full border-none bg-white"/>
                 )}
              </div>
           </div>

           {/* Input Area */}
           <div className="glass-card p-4 !bg-black/40 !border-white/5 relative">
              <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 focus-within:border-indigo-500/50 transition-all">
                <textarea
                   value={promptInput}
                   onChange={(e) => setPromptInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                   placeholder={language === 'uz' ? "Dizaynni qanday o'zgartirmoqchisiz?" : "How should we change the design?"}
                   className="flex-1 h-12 bg-transparent text-white p-3 text-sm outline-none resize-none placeholder:text-slate-600"
                />
                <button onClick={handleSend} disabled={loading || !promptInput.trim()} className="w-12 h-12 bg-indigo-500 text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
           </div>
        </div>

        {/* AI Preview (iPhone) */}
        <div className="hidden xl:flex w-96 flex-col items-center justify-center relative">
           <div className="scale-[0.7] transform">
              <IPhone16Frame>
                 <iframe 
                   key={previewKey} 
                   srcDoc={storeFiles['index.html']} 
                   className="w-full h-full border-none bg-white"
                 />
              </IPhone16Frame>
           </div>
           <div className="absolute top-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">OLED Preview</span>
           </div>
        </div>
      </div>
    </div>
  );
}
