import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link, MessageCircle, Send, Check } from 'lucide-react';

interface ShareButtonProps {
    url: string;
    title: string;
    language: string;
}

export function ShareButton({ url, title, language }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const labels = {
        share: language === 'uz' ? 'Ulashish' : language === 'ru' ? 'Поделиться' : 'Share',
        copyLink: language === 'uz' ? 'Havolani nusxalash' : language === 'ru' ? 'Копировать ссылку' : 'Copy Link',
        copied: language === 'uz' ? 'Nusxalandi!' : language === 'ru' ? 'Скопировано!' : 'Copied!',
    };

    const shareOptions = [
        {
            name: 'Telegram',
            icon: <Send className="w-4 h-4" />,
            color: 'bg-blue-500',
            action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank')
        },
        {
            name: 'WhatsApp',
            icon: <MessageCircle className="w-4 h-4" />,
            color: 'bg-green-500',
            action: () => window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank')
        },
        {
            name: labels.copyLink,
            icon: copied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />,
            color: 'bg-violet-500',
            action: () => {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    ];

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-dim)] hover:text-violet-500 transition-all"
            >
                <Share2 className="w-5 h-5" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                        className="absolute bottom-full mb-2 right-0 bg-[var(--color-surface-raised)] border border-[var(--color-border-bright)] rounded-2xl p-2 shadow-2xl min-w-[180px] z-50 backdrop-blur-xl"
                    >
                        <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-wider px-2 py-1">{labels.share}</p>
                        {shareOptions.map((opt, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ x: 3 }}
                                onClick={() => { opt.action(); if (opt.name !== labels.copyLink) setIsOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--bg-surface)] transition-all text-sm text-[var(--text-main)]"
                            >
                                <div className={`p-1 rounded-lg ${opt.color} text-white`}>{opt.icon}</div>
                                {opt.name === labels.copyLink && copied ? labels.copied : opt.name}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
