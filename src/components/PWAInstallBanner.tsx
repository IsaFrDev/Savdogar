import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Share, Plus, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useState } from 'react';

interface PWAInstallBannerProps {
    language?: string;
    variant?: 'banner' | 'card' | 'button';
}

export function PWAInstallBanner({ language = 'en', variant = 'banner' }: PWAInstallBannerProps) {
    const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
    const [dismissed, setDismissed] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    const labels = {
        title: language === 'uz' ? "Ilovani o'rnating" : language === 'ru' ? 'Установить приложение' : 'Install App',
        subtitle: language === 'uz'
            ? "Savdogar'ni telefonga o'rnating — tezroq ishlaydi va oflayn rejim"
            : language === 'ru'
                ? 'Установите Savdogar на телефон — быстрее и оффлайн режим'
                : 'Install Savdogar on your device — faster experience & offline mode',
        install: language === 'uz' ? "O'rnatish" : language === 'ru' ? 'Установить' : 'Install',
        installed: language === 'uz' ? "O'rnatilgan ✓" : language === 'ru' ? 'Установлено ✓' : 'Installed ✓',
        iosTitle: language === 'uz' ? 'iOS uchun' : language === 'ru' ? 'Для iOS' : 'For iOS',
        iosStep1: language === 'uz' ? "Safari'da pastki menyu (Share) tugmasini bosing" : language === 'ru' ? 'Нажмите кнопку «Поделиться» в Safari' : 'Tap the Share button in Safari',
        iosStep2: language === 'uz' ? '"Bosh ekranga qo\'shish" ni tanlang' : language === 'ru' ? 'Выберите «На экран Домой»' : 'Select "Add to Home Screen"',
        iosStep3: language === 'uz' ? '"Qo\'shish" tugmasini bosing' : language === 'ru' ? 'Нажмите «Добавить»' : 'Tap "Add"',
    };

    if (isInstalled) {
        if (variant === 'card') {
            return (
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{labels.installed}</p>
                        <p className="text-[var(--text-dim)] text-xs mt-0.5">
                            {language === 'uz' ? "Savdogar ilovasi qurilmangizga o'rnatilgan" : language === 'ru' ? 'Приложение Savdogar установлено' : 'Savdogar app is installed on your device'}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    }

    if (dismissed && variant === 'banner') return null;

    // iOS Guide Modal
    if (showIOSGuide) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="p-6 rounded-3xl bg-[var(--color-surface-raised)] border border-[var(--glass-border)] shadow-xl space-y-5"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">{labels.iosTitle}</h3>
                        <button onClick={() => setShowIOSGuide(false)} className="p-2 rounded-xl hover:bg-[var(--color-border)] text-[var(--text-dim)]">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center font-black text-sm flex-shrink-0">1</div>
                            <div className="flex items-center gap-2">
                                <Share className="w-4 h-4 text-[var(--brand-primary)]" />
                                <p className="text-sm text-[var(--text-main)]">{labels.iosStep1}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center font-black text-sm flex-shrink-0">2</div>
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-[var(--brand-primary)]" />
                                <p className="text-sm text-[var(--text-main)]">{labels.iosStep2}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center font-black text-sm flex-shrink-0">3</div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <p className="text-sm text-[var(--text-main)]">{labels.iosStep3}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // For "button" variant — compact install button
    if (variant === 'button') {
        return (
            <button
                onClick={() => {
                    if (isIOS) setShowIOSGuide(true);
                    else install();
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--brand-primary)] text-[var(--primary-foreground)] font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[var(--brand-primary-glow)] active:scale-95"
            >
                <Download className="w-4 h-4" />
                {labels.install}
            </button>
        );
    }

    // For "card" variant — used inside Profile/Settings
    if (variant === 'card') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)]/5 to-[var(--brand-secondary)]/5 border border-[var(--brand-primary)]/20 space-y-4"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--brand-primary-glow)]">
                        <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-black text-[var(--text-main)] text-sm uppercase tracking-tight">{labels.title}</h4>
                        <p className="text-[var(--text-dim)] text-xs mt-0.5">{labels.subtitle}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (isIOS) setShowIOSGuide(true);
                        else install();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--brand-primary)] text-[var(--primary-foreground)] font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[var(--brand-primary-glow)] active:scale-95"
                >
                    <Download className="w-4 h-4" />
                    {isIOS ? labels.iosTitle : labels.install}
                </button>
            </motion.div>
        );
    }

    // Default "banner" variant — floating at bottom
    if (!canInstall && !isIOS) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-lg"
            >
                <div className="relative p-5 rounded-3xl bg-[var(--color-surface-raised)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-2xl shadow-black/20">
                    <button
                        onClick={() => setDismissed(true)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[var(--color-border)] text-[var(--text-dim)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white shadow-lg shadow-[var(--brand-primary-glow)] flex-shrink-0">
                            <Smartphone className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-[var(--text-main)] text-sm uppercase tracking-tight">{labels.title}</h3>
                            <p className="text-[var(--text-dim)] text-xs mt-0.5 line-clamp-2">{labels.subtitle}</p>
                        </div>
                        <button
                            onClick={() => {
                                if (isIOS) setShowIOSGuide(true);
                                else install();
                            }}
                            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] text-[var(--primary-foreground)] font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[var(--brand-primary-glow)] active:scale-95"
                        >
                            {labels.install}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
