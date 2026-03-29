import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, ShoppingCart, Sparkles } from 'lucide-react';
import { productApi } from '../services/api';
import { useApp } from '../context/AppContext';

interface Message {
    role: 'user' | 'ai';
    text: string;
    products?: any[];
    timestamp: Date;
}

interface AiConciergeProps {
    storeId: number;
    storeName: string;
    language?: string;
    onAddToCart?: (product: any) => void;
}

export function AiConcierge({ storeId, storeName, language = 'uz', onAddToCart }: AiConciergeProps) {
    const { t } = useApp();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'ai',
            text: (t('aiGreeting') || '').replace('{storeName}', storeName),
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: new Date() }]);
        setLoading(true);

        try {
            const res = await productApi.aiConcierge({
                store_id: storeId,
                message: userMsg,
                store_name: storeName,
                language,
            });
            setMessages(prev => [...prev, {
                role: 'ai',
                text: res.data.reply,
                products: res.data.products,
                timestamp: new Date(),
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: t('aiError'),
                timestamp: new Date(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setOpen(true)}
                className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-2xl shadow-[var(--brand-primary-glow)] flex items-center justify-center ${open ? 'hidden' : ''}`}
            >
                <Bot className="w-7 h-7" />
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] h-[550px] bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[var(--brand-primary)]/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-[var(--primary-foreground)]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{t('aiAssistantTitle')}</h4>
                                    <p className="text-[10px] text-[var(--brand-primary)] font-medium flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> {storeName}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] ${msg.role === 'user'
                                        ? 'bg-[var(--brand-primary)] text-[var(--primary-foreground)] rounded-2xl rounded-br-sm shadow-[var(--brand-primary-glow)]'
                                        : 'bg-white/5 text-slate-200 rounded-2xl rounded-bl-sm border border-white/5'
                                        } px-4 py-3`}>
                                        <p className="text-sm leading-relaxed">{msg.text}</p>

                                        {/* Product Cards */}
                                        {msg.products && msg.products.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {msg.products.map((p: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-3 p-2 bg-white/10 rounded-xl">
                                                        {p.image && (
                                                            <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-xs font-bold truncate">{p.name}</h5>
                                                            <p className="text-xs text-[var(--brand-primary)] font-medium">
                                                                {parseFloat(p.price).toLocaleString()} UZS
                                                            </p>
                                                        </div>
                                                        {onAddToCart && (
                                                            <button
                                                                onClick={() => onAddToCart(p)}
                                                                className="p-1.5 bg-[var(--brand-primary)] rounded-lg text-[var(--primary-foreground)] hover:brightness-110 transition-colors"
                                                            >
                                                                <ShoppingCart className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <span className="text-[10px] opacity-50 mt-1 block">
                                            {msg.timestamp.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <div className="flex items-center gap-2 text-[var(--brand-primary)]">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-xs">{t('aiThinking')}</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                    placeholder={t('typeMessage')}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[var(--brand-primary)]/50"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                    className="p-3 bg-[var(--brand-primary)] text-[var(--primary-foreground)] rounded-2xl hover:brightness-110 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
