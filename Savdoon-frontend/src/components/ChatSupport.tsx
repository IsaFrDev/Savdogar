import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Store, Check, CheckCheck, Loader2, Sparkles } from 'lucide-react';
import { chatService, Message } from '../services/chatService';
import { useChatWebSocket } from '../hooks/useChatWebSocket';

interface ChatSupportProps {
    storeId: number;
    storeName: string;
}

export function ChatSupport({ storeId, storeName }: ChatSupportProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [conversationId, setConversationId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // WebSocket hook
    const { status: wsStatus, reconnect } = useChatWebSocket(conversationId, (msg) => {
        setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, {
                id: msg.id,
                sender_type: msg.sender_type,
                content: msg.content,
                is_read: false,
                created_at: msg.created_at
            }];
        });
    });

    // Load existing conversation on mount
    useEffect(() => {
        const savedSessionId = localStorage.getItem(`chat_session_${storeId}`);
        if (savedSessionId) {
            setSessionId(savedSessionId);
            loadExistingConversation(savedSessionId);
        }
    }, [storeId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Polling fallback when WebSocket is not connected
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isStarted && wsStatus !== 'connected' && sessionId) {
            interval = setInterval(async () => {
                try {
                    const lastId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) : 0;
                    const data = await chatService.pollMessages(sessionId, lastId);
                    if (data.messages && data.messages.length > 0) {
                        setMessages(prev => {
                            const newMsgs = data.messages.filter((nm: any) => !prev.find(pm => pm.id === nm.id));
                            if (newMsgs.length === 0) return prev;
                            return [...prev, ...newMsgs];
                        });
                    }
                } catch (error) {
                    // Silent fail for polling
                }
            }, 4000); // 4 second polling
        }
        return () => clearInterval(interval);
    }, [isStarted, wsStatus, sessionId, messages.length]);

    const loadExistingConversation = async (sid: string) => {
        try {
            const data = await chatService.getConversation(storeId, sid);
            if (data.conversation) {
                setMessages(data.conversation.messages || []);
                setIsStarted(true);
                setCustomerName(data.conversation.customer_name);
                setConversationId(data.conversation.id);
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    };

    const handleStartChat = async () => {
        if (!customerName.trim() || !input.trim()) return;

        setIsLoading(true);
        try {
            const data = await chatService.startConversation({
                store_id: storeId,
                customer_name: customerName,
                message: input,
                session_id: sessionId || undefined
            });

            setSessionId(data.session_id);
            localStorage.setItem(`chat_session_${storeId}`, data.session_id);
            setMessages(data.conversation.messages || []);
            setConversationId(data.conversation.id);
            setIsStarted(true);
            setInput('');
        } catch (error) {
            console.error('Failed to start chat:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isSending) return;

        setIsSending(true);
        setInput('');
        try {
            await chatService.sendCustomerMessage(sessionId, input);
        } catch (error) {
            console.error('Failed to send message:', error);
            // Optionally restore input on error
            setInput(input);
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Floating Chat Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg shadow-[var(--primary-glow)] flex items-center justify-center border border-white/10"
            >
                <div className="relative">
                    <MessageCircle className="w-6 h-6" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                </div>
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for mobile */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Chat Window */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="fixed bottom-6 left-6 z-50 w-[calc(100%-3rem)] max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                            style={{ maxHeight: 'calc(100vh - 6rem)' }}
                        >
                            {/* Header */}
                            <div className="p-4 bg-gradient-to-r from-[var(--primary-toq)] to-[var(--secondary-toq)] border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shadow-lg shadow-[var(--primary-glow)]">
                                            <Store className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white text-sm uppercase tracking-tight">{storeName}</h3>
                                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">
                                                {wsStatus === 'connected' ? '🟢 Online' : '🟠 Reconnecting...'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={reconnect}
                                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                                            title="Refresh connection"
                                        >
                                            <Sparkles className={`w-4 h-4 ${wsStatus === 'connecting' ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div
                                className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[350px] max-h-[450px]"
                                style={{
                                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
                                    backgroundSize: '24px 24px'
                                }}
                            >
                                {!isStarted ? (
                                    // Start conversation form
                                    <div className="space-y-4 p-6 bg-white/5 border border-white/5 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 text-center font-black uppercase tracking-widest">
                                            👋 Salom! Savolingiz bo'lsa yo'llang
                                        </p>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Ismingiz</label>
                                            <input
                                                type="text"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="Nodirbek"
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Xabar</label>
                                            <textarea
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Assalomu alaykum..."
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all font-medium"
                                            />
                                        </div>
                                        <button
                                            onClick={handleStartChat}
                                            disabled={isLoading || !customerName.trim() || !input.trim()}
                                            className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary-glow)] active:scale-95"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Yuborilmoqda...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Suhbatni boshlash
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    // Messages
                                    <>
                                        {messages.map((message) => (
                                            <motion.div
                                                key={message.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-lg ${message.sender_type === 'customer'
                                                        ? 'bg-[var(--primary)] text-white rounded-br-sm shadow-[var(--primary-glow)]'
                                                        : 'bg-white/10 text-slate-200 border border-white/5 rounded-bl-sm backdrop-blur-md'
                                                        }`}
                                                >
                                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                                    <div className={`flex items-center gap-1.5 mt-1.5 ${message.sender_type === 'customer' ? 'justify-end' : ''
                                                        }`}>
                                                        <span className={`text-[9px] font-bold ${message.sender_type === 'customer' ? 'text-white/60' : 'text-slate-500'
                                                            }`}>
                                                            {formatTime(message.created_at)}
                                                        </span>
                                                        {message.sender_type === 'customer' && (
                                                            message.is_read ? (
                                                                <CheckCheck className="w-3 h-3 text-white/60" />
                                                            ) : (
                                                                <Check className="w-3 h-3 text-white/60" />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            {/* Input Area - Only show if conversation started */}
                            {isStarted && (
                                <div className="p-4 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }}
                                        className="flex gap-2"
                                    >
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Xabar yozing..."
                                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-glow)] transition-all font-medium placeholder:text-slate-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim() || isSending}
                                            className="p-3 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-toq)] disabled:opacity-50 transition-all shadow-lg shadow-[var(--primary-glow)] active:scale-95"
                                        >
                                            {isSending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
