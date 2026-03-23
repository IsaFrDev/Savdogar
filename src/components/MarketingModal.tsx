import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Instagram, MessageSquare, Twitter, Copy, Check, Sparkles, Loader2 } from 'lucide-react';
import { productApi } from '../services/api';
import { Button } from './Button';

interface MarketingModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: number;
        name: string;
        description: string;
    };
    language: string;
}

export function MarketingModal({ isOpen, onClose, product, language }: MarketingModalProps) {
    const [platform, setPlatform] = useState<'instagram' | 'telegram' | 'twitter'>('instagram');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateContent = async () => {
        setIsLoading(true);
        try {
            const response = await productApi.generateMarketingPost(
                product.name,
                product.description,
                platform,
                language
            );
            setGeneratedContent(response.data.content);
        } catch (error) {
            console.error('Failed to generate marketing content:', error);
            setGeneratedContent('Error generating content. Please try again.');
        }
        setIsLoading(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const platforms = [
        { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'bg-pink-500' },
        { id: 'telegram', icon: Send, label: 'Telegram', color: 'bg-sky-500' },
        { id: 'twitter', icon: Twitter, label: 'Twitter', color: 'bg-blue-400' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl glass-card rounded-[2.5rem] border border-white/10 z-[110] overflow-hidden flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">AI Marketing Assistant</h2>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">{product.name}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-8">
                            {/* Platform Selection */}
                            <div className="grid grid-cols-3 gap-4">
                                {platforms.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setPlatform(p.id as any)}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 group ${platform === p.id
                                            ? 'bg-white/10 border-[var(--brand-primary)]/50 scale-[1.02]'
                                            : 'border-white/5 hover:border-white/10 bg-white/5'}`}
                                    >
                                        <div className={`p-3 rounded-xl ${platform === p.id ? p.color : 'bg-slate-800'} text-white transition-all`}>
                                            <p.icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${platform === p.id ? 'text-white' : 'text-slate-500'}`}>
                                            {p.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Generator / Content */}
                            <div className="min-h-[200px] rounded-3xl bg-slate-900/50 border border-white/5 p-6 relative group/content">
                                {generatedContent ? (
                                    <div className="space-y-4">
                                        <pre className="text-sm text-slate-300 font-medium leading-relaxed whitespace-pre-wrap font-sans">
                                            {generatedContent}
                                        </pre>
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button
                                                onClick={handleCopy}
                                                className="p-2.5 rounded-xl bg-slate-800 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all"
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-16 h-16 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] mb-4">
                                            <MessageSquare className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-[200px]">
                                            Create viral content for your product with a single click.
                                        </p>
                                    </div>
                                )}

                                {isLoading && (
                                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
                                        <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin mb-4" />
                                        <p className="text-[10px] text-white font-black uppercase tracking-[0.3em] animate-pulse">Generating Magic...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end gap-4">
                            <Button variant="secondary" onClick={onClose} className="rounded-2xl px-8 h-12 text-[10px] font-black uppercase tracking-widest border-white/5">
                                Cancel
                            </Button>
                            <Button
                                onClick={generateContent}
                                disabled={isLoading}
                                icon={<Sparkles className="w-4 h-4" />}
                                className="rounded-2xl px-10 h-12 text-[10px] font-black uppercase tracking-widest bg-[var(--brand-primary)] text-[var(--primary-foreground)] hover:brightness-110 shadow-xl shadow-[var(--brand-primary-glow)]"
                            >
                                {generatedContent ? 'Regenerate' : 'Generate Post'}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
