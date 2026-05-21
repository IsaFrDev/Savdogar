import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  CheckCheck, 
  Loader2, 
  X, 
  Clock, 
  Trash2, 
  Search, 
  User, 
  Phone, 
  MoreVertical, 
  Hash, 
  Zap, 
  Circle,
  Paperclip,
  Smile,
  ShieldCheck,
  ChevronRight,
  Monitor,
  Terminal,
  Activity,
  UserCheck
} from 'lucide-react';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { useApp } from '../../context/AppContext';

export function StoreChatDashboard() {
    const { t, currentStore, language } = useApp();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [input, setInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, convId: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const subscriptionRef = useRef<any>(null);
    const storeSubscriptionRef = useRef<any>(null);

    useEffect(() => {
        if (currentStore?.id) {
            loadConversations();
            
            // Subscribe to store-wide conversation changes
            storeSubscriptionRef.current = supabaseApi.chat.subscribeToStoreConversations(currentStore.id, (payload) => {
                loadConversations();
            });
        }
        return () => {
            if (storeSubscriptionRef.current) {
                storeSubscriptionRef.current.unsubscribe();
            }
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
        };
    }, [currentStore?.id]);

    useEffect(() => {
        if (selectedConversation) {
            // Subscribe to messages in this conversation
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
            
            subscriptionRef.current = supabaseApi.chat.subscribeToMessages(selectedConversation.id, (message) => {
                setSelectedConversation(prev => {
                    if (!prev) return prev;
                    if (prev.messages.find((m: any) => m.id === message.id)) return prev;
                    return {
                        ...prev,
                        messages: [...prev.messages, message]
                    };
                });
            });
        }
    }, [selectedConversation?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);

    const loadConversations = async () => {
        if (!currentStore?.id) return;
        try {
            const data = await supabaseApi.chat.getConversations(currentStore.id);
            setConversations(data || []);
        } catch (error) {
            console.error('Failed to load conversations from Supabase:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadConversationDetail = async (id: number) => {
        try {
            const data = await supabaseApi.chat.getConversationDetail(id);
            setSelectedConversation(data);
            await supabaseApi.chat.markAsRead(id);
            loadConversations();
        } catch (error) {
            console.error('Failed to load conversation from Supabase:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !selectedConversation || isSending) return;
        setIsSending(true);
        try {
            await supabaseApi.chat.sendMessage(selectedConversation.id, input, 'store');
            setInput('');
            // The Realtime subscription will handle updating the message list
        } catch (error) {
            console.error('Failed to send message to Supabase:', error);
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
    };

    const handleDeleteConversation = async (id: number) => {
        setIsDeleting(true);
        try {
            await supabaseApi.chat.deleteConversation(id);
            if (selectedConversation?.id === id) setSelectedConversation(null);
            await loadConversations();
            setContextMenu(null);
        } catch (error) {
            console.error('Failed to delete conversation in Supabase:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, convId: number) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, convId });
    };

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] bg-slate-950/20 rounded-[48px] border border-white/5 backdrop-blur-3xl">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6 opacity-50" />
                <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-[10px]">Initializing Growth Comms...</p>
            </div>
        );
    }

    const filteredConversations = conversations.filter(c => 
        c.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[800px] flex rounded-[48px] overflow-hidden border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-[0_60px_120px_rgba(0,0,0,0.5)] relative">
            {/* Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px] -mr-[250px] -mt-[250px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[80px] -ml-[200px] -mb-[200px]" />
            </div>

            {/* Sidebar: Channel Matrix */}
            <div className="w-[450px] border-r border-white/5 flex flex-col relative z-10 bg-slate-950/20">
                <div className="p-10 border-b border-white/5 bg-gradient-to-r from-indigo-600/10 to-transparent">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/20">
                               <MessageCircle size={28} className="text-white" />
                            </div>
                            <div>
                               <h2 className="text-2xl font-black text-white tracking-tighter uppercase font-heading leading-none">Growth Comms</h2>
                               <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] mt-3">Live Response Matrix</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                           <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">REALTIME</span>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input 
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 h-14 bg-slate-950/50 border border-white/5 rounded-2xl text-xs font-black text-white placeholder:text-slate-800 focus:border-indigo-500/40 transition-all outline-none"
                            placeholder="FILTER CHANNELS..."
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-900 opacity-20">
                            <Activity size={80} className="mb-6" />
                            <p className="font-black uppercase tracking-[0.5em] text-[10px]">No Active Streams</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <motion.button
                                key={conv.id}
                                onClick={() => loadConversationDetail(conv.id)}
                                onContextMenu={(e) => handleContextMenu(e, conv.id)}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className={`w-full p-6 rounded-3xl flex items-start gap-6 transition-all relative overflow-hidden group border ${
                                    selectedConversation?.id === conv.id 
                                    ? 'bg-indigo-600/10 border-indigo-500/20 shadow-2xl' 
                                    : 'bg-transparent border-transparent hover:bg-white/5'
                                }`}
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-14 h-14 rounded-[20px] bg-slate-950 shrink-0 flex items-center justify-center text-indigo-400 font-black border border-white/5 shadow-inner">
                                    {conv.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0 text-left py-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-black text-white uppercase tracking-tighter truncate text-sm">
                                            {conv.customer_name}
                                        </span>
                                        <span className="text-[9px] text-slate-700 font-black tabular-nums">
                                            {formatTime(conv.updated_at)}
                                        </span>
                                    </div>
                                    {conv.last_message && (
                                        <p className="text-xs text-slate-600 truncate font-bold uppercase tracking-tight">
                                            {conv.last_message.sender_type === 'store' && (
                                                <span className="text-indigo-500">ME: </span>
                                            )}
                                            {conv.last_message.content}
                                        </p>
                                    )}
                                </div>
                                {conv.unread_count > 0 && (
                                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-indigo-600/30">
                                        {conv.unread_count}
                                    </div>
                                )}
                            </motion.button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Interface */}
            <div className="flex-1 flex flex-col relative z-10">
                {selectedConversation ? (
                    <AnimatePresence mode="wait">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                            {/* Chat Header */}
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/20 backdrop-blur-xl">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xl">
                                        <UserCheck size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                                            {selectedConversation.customer_name}
                                        </h3>
                                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-3">
                                            <Circle size={8} className="fill-emerald-500 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            Active Protocol • Connected {formatTime(selectedConversation.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-700 hover:text-white transition-all"><Phone size={18} /></button>
                                    <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-700 hover:text-white transition-all"><MoreVertical size={18} /></button>
                                    <button onClick={() => setSelectedConversation(null)} className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all ml-4 flex items-center justify-center">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Message Stream */}
                            <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar bg-slate-950/10">
                                {selectedConversation.messages.map((message, i) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, x: message.sender_type === 'store' ? 40 : -40 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex ${message.sender_type === 'store' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[65%] group relative ${message.sender_type === 'store' ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-8 py-5 rounded-[28px] shadow-2xl relative overflow-hidden ${
                                                message.sender_type === 'store'
                                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                                : 'bg-slate-900 border border-white/5 text-slate-200 rounded-tl-none'
                                            }`}>
                                                {message.sender_type === 'store' && (
                                                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                                )}
                                                <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap relative z-10">{message.content}</p>
                                            </div>
                                            <div className={`flex items-center gap-3 mt-3 px-2 ${message.sender_type === 'store' ? 'flex-row-reverse' : ''}`}>
                                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest tabular-nums">
                                                    {formatTime(message.created_at)}
                                                </span>
                                                {message.sender_type === 'store' && (
                                                    <CheckCheck className="w-3 h-3 text-indigo-500" />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Command Input Area */}
                            <div className="p-10 border-t border-white/5 bg-slate-950/40 backdrop-blur-3xl">
                                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 text-slate-700 group-focus-within:text-indigo-400 transition-all">
                                        <Paperclip size={22} className="cursor-pointer hover:text-white" />
                                        <Smile size={22} className="cursor-pointer hover:text-white" />
                                    </div>
                                    <input
                                        type="text" value={input} onChange={(e) => setInput(e.target.value)}
                                        placeholder="TYPE SECURE MESSAGE..."
                                        className="w-full pl-32 pr-24 h-20 bg-slate-950 border border-white/5 rounded-[32px] text-sm font-black text-white placeholder:text-slate-800 outline-none focus:border-indigo-500/40 transition-all shadow-inner uppercase tracking-tight"
                                    />
                                    <button
                                        type="submit" disabled={!input.trim() || isSending}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-20 transition-all shadow-2xl shadow-indigo-600/40"
                                    >
                                        {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="group-hover:rotate-12 transition-transform" />}
                                    </button>
                                </form>
                                <div className="flex items-center justify-between mt-6 px-4">
                                   <div className="flex items-center gap-3 text-[9px] font-black text-slate-700 uppercase tracking-widest">
                                      <ShieldCheck size={14} className="text-emerald-500" />
                                      End-to-End Encrypted Terminal
                                   </div>
                                   <div className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                                      Press ENTER to transmit
                                   </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
                            <Terminal size={500} className="text-indigo-500" />
                        </div>
                        <div className="w-32 h-32 rounded-[40px] bg-white/5 flex items-center justify-center mb-12 text-slate-900 shadow-inner group relative">
                            <div className="absolute inset-0 bg-indigo-600/5 rounded-full blur-2xl animate-pulse" />
                            <Monitor size={56} className="relative z-10" />
                        </div>
                        <h3 className="text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-none">Standby Mode</h3>
                        <p className="text-slate-600 font-bold text-base leading-relaxed mb-16 max-w-sm mx-auto uppercase tracking-widest italic">Waiting for incoming customer protocols. Select a channel to establish connection.</p>
                        <div className="flex items-center gap-4 text-[10px] font-black text-indigo-500/40 uppercase tracking-[0.5em] animate-pulse">
                           <Zap size={16} /> Live Buffer Active <Zap size={16} />
                        </div>
                    </div>
                )}
            </div>

            {/* Context Menu realization */}
            {contextMenu && (
                <div
                    className="fixed z-[9999] bg-slate-900 border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] rounded-2xl py-3 w-64 overflow-hidden backdrop-blur-3xl"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-6 py-2 mb-2 text-[8px] font-black text-slate-700 uppercase tracking-widest border-b border-white/5">Channel Operations</div>
                    <button
                        onClick={() => handleDeleteConversation(contextMenu.convId)}
                        disabled={isDeleting}
                        className="w-full px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 flex items-center gap-4 transition-all"
                    >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Terminate Stream
                    </button>
                </div>
            )}
        </div>
    );
}
