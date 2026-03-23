import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Languages, Megaphone, Image as ImageIcon, Wand2, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

import { Button } from '../../components/Button';
import { useApp } from '../../context/AppContext';
import { aiApi } from '../../services/api';

interface AIStudioProps {
    store?: any;
    onTabChange: (tab: string) => void;
}

const AIStudio: React.FC<AIStudioProps> = ({ store, onTabChange }) => {
    const { language } = useApp();
    const [activeTool, setActiveTool] = useState<'translator' | 'poster' | 'studio' | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [studioResult, setStudioResult] = useState<{ image: string, analysis: string } | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setStudioResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const processStudioImage = async () => {
        if (!selectedImage) return;
        setIsProcessing(true);
        try {
            const response = await aiApi.enhanceImage({ image: selectedImage });
            setStudioResult({
                image: response.data.enhanced_image,
                analysis: response.data.analysis
            });
        } catch (error) {
            console.error('Studio processing failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const tools = [
        {
            id: 'products',
            title: language === 'uz' ? 'AI Auto-Translator' : language === 'ru' ? 'AI Авто-переводчик' : 'AI Auto-Translator',
            description: language === 'uz' ? 'Mahsulotlaringizni o\'zbek, rus va ingliz tillariga bir vaqtda tarjima qiling.' : 'Переводите товары на узбекский, русский и английский одновременно.',
            icon: Languages,
            color: 'text-[var(--brand-primary)]',
            bg: 'bg-[var(--brand-primary)]/10',
            status: 'Ready'
        },
        {
            id: 'ai-creative',
            title: language === 'uz' ? 'AI Social Poster' : language === 'ru' ? 'AI Соц-постер' : 'AI Social Poster',
            description: language === 'uz' ? 'Instagram va Telegram uchun jozibador marketing postlarini yarating.' : 'Создавайте привлекательные посты для Instagram и Telegram.',
            icon: Megaphone,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            status: 'Ready'
        },
        {
            id: 'ai-image-studio',
            title: language === 'uz' ? 'AI Photostudio' : language === 'ru' ? 'AI Фотостудия' : 'AI Photostudio',
            description: language === 'uz' ? 'Mahsulot rasmlaridan fonni olib tashlash va professional studiya effektini berish.' : 'Удаление фона и создание эффекта профессиональной студии.',
            icon: ImageIcon,
            color: 'text-[var(--brand-primary)]',
            bg: 'bg-[var(--brand-primary)]/10',
            status: 'Ready'
        },
        {
            id: 'ai-fitting-room',
            title: language === 'uz' ? 'Virtual Fitting Room' : language === 'ru' ? 'Виртуальная примерочная' : 'Virtual Fitting Room',
            description: language === 'uz' ? 'Mijozlarga kiyimlarni virtual tarzda kiyib ko\'rish imkonini bering.' : language === 'ru' ? 'Позвольте клиентам виртуально примерить одежду.' : 'Allow customers to try on clothes virtually.',
            icon: Wand2,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            status: language === 'ru' ? 'Готово' : language === 'uz' ? 'Tayyor' : 'Ready',
            hidden: store?.business_type !== 'clothing'
        }
    ].filter(tool => !tool.hidden);

    return (
        <div className="space-y-8">
            {/* Hero Header */}
            <div className="relative overflow-hidden p-8 lg:p-12 rounded-[2.5rem] bg-slate-900/50 border border-white/5">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Sparkles className="w-40 h-40 text-[var(--brand-primary)] animate-pulse" />
                </div>

                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-[10px] font-black uppercase tracking-widest mb-6">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Studio Powered by Gemini 1.5</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-main)] tracking-tight mb-4 uppercase">
                        {language === 'uz' ? 'AI Studio bilan biznesingizni kuchaytiring' : language === 'ru' ? 'Усильте бизнес с AI Studio' : 'Power up your business with AI Studio'}
                    </h1>
                    <p className="text-lg text-slate-400 font-medium leading-relaxed">
                        {language === 'uz' ? 'Mahsulotlarni professional darajada tayyorlash, tarjima qilish va ijtimoiy tarmoqlarda reklama qilish uchun aqlli vositalar.' : 'Умные инструменты для перевода и продвижения ваших товаров.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tools.map((tool) => (
                    <motion.div
                        key={tool.id}
                        whileHover={{ y: -5 }}
                        className={`glass-card p-8 rounded-[2rem] border-white/5 flex flex-col h-full cursor-pointer hover:border-[var(--brand-primary)]/30 transition-all ${activeTool === tool.id ? 'ring-2 ring-[var(--brand-primary)]/50' : ''}`}
                        onClick={() => onTabChange(tool.id)}
                    >
                        <div className={`w-14 h-14 rounded-2xl ${tool.bg} ${tool.color} flex items-center justify-center mb-6 shadow-xl`}>
                            <tool.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-main)] mb-3 uppercase tracking-tight">{tool.title}</h3>
                        <p className="text-[var(--text-dim)] text-sm font-medium leading-relaxed mb-8 flex-1">
                            {tool.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${tool.status === 'Ready' || tool.status === 'Tayyor' || tool.status === 'Готово' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {tool.status}
                            </span>
                            {(tool.status === 'Ready' || tool.status === 'Tayyor' || tool.status === 'Готово') && (
                                <ArrowRight className="w-4 h-4 text-[var(--brand-primary)]" />
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Tool Content */}
            <AnimatePresence mode="wait">
                {activeTool && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card p-10 lg:p-16 rounded-[3rem] border-white/10 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                            <Wand2 className="w-60 h-60 text-[var(--brand-primary)]" />
                        </div>

                        {activeTool === 'studio' ? (
                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-[10px] font-black uppercase tracking-widest">
                                        <ImageIcon className="w-3 h-3" />
                                        <span>AI Photostudio</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tight">AI Photostudio</h2>
                                    <p className="text-[var(--text-dim)] font-medium leading-relaxed">
                                        {language === 'uz' ? 'Rasm yuklang va AI fonni avtomatik olib tashlab, uni professional do\'kon foni bilan almashtiradi.' : language === 'ru' ? 'Загрузите изображение, и AI автоматически удалит фон, заменив его на профессиональный фон для магазина.' : 'Upload an image and AI will automatically remove the background, replacing it with a professional store background.'}
                                    </p>

                                    <div className="flex flex-col gap-4">
                                        <label className="flex flex-col items-center justify-center h-48 rounded-[2rem] border-2 border-dashed border-white/10 hover:border-[var(--brand-primary)]/50 hover:bg-white/5 transition-all cursor-pointer group">
                                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                                <ImageIcon className="w-10 h-10 text-slate-600 group-hover:text-[var(--brand-primary)] mb-4 transition-colors" />
                                                <p className="text-sm font-bold text-slate-500 group-hover:text-slate-300">
                                                    {language === 'uz' ? 'Rasm yuklash uchun bosing' : language === 'ru' ? 'Нажмите, чтобы загрузить изображение' : 'Click to upload image'}
                                                </p>
                                            </div>
                                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                        </label>

                                        {selectedImage && (
                                            <Button
                                                onClick={processStudioImage}
                                                disabled={isProcessing}
                                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest"
                                            >
                                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (language === 'uz' ? 'Fonni Olib Tashlash' : language === 'ru' ? 'Удалить фон' : 'Remove Background')}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="relative aspect-square rounded-[2rem] bg-slate-950/50 border border-white/5 overflow-hidden flex items-center justify-center">
                                    {studioResult ? (
                                        <div className="relative w-full h-full p-8 flex flex-col items-center justify-center">
                                            <img src={studioResult.image} className="max-w-full max-h-[80%] object-contain" alt="Result" />
                                            <p className="mt-6 text-[10px] font-medium text-emerald-400 text-center uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                                                {studioResult.analysis}
                                            </p>
                                        </div>
                                    ) : selectedImage ? (
                                        <img src={selectedImage} className="w-full h-full object-contain opacity-50 blur-[2px]" alt="Preview" />
                                    ) : (
                                        <Sparkles className="w-20 h-20 text-slate-800" />
                                    )}
                                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 text-center max-w-xl mx-auto">
                                <div className="w-20 h-20 rounded-3xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center mx-auto mb-8 shadow-2xl">
                                    {activeTool === 'translator' ? <Languages className="w-10 h-10" /> : <Megaphone className="w-10 h-10" />}
                                </div>
                                <h2 className="text-3xl font-black text-[var(--text-main)] mb-4 uppercase tracking-tight">
                                    {activeTool === 'translator' ? 'Bulk Auto-Translator' : 'AI Social Media Poster'}
                                </h2>
                                <p className="text-[var(--text-dim)] font-medium leading-relaxed mb-10">
                                    {activeTool === 'translator'
                                        ? 'Do\'koningizdagi barcha mahsulotlarni bir vaqtda tarjima qilish funksiyasi tez orada ishga tushadi. Hozircha mahsulot tahrirlash oynasida "AI Translate" tugmasidan foydalanishingiz mumkin.'
                                        : 'Mahsulotlar uchun professional marketing postlarini yaratish interfeysi tayyorlanmoqda. Bu funksiya orqali Instagram va Telegram uchun tayyor dizayn va matn olasiz.'}
                                </p>
                                <Button
                                    className="rounded-2xl px-12 h-14 font-black uppercase tracking-widest text-xs"
                                    onClick={() => setActiveTool(null)}
                                >
                                    {language === 'uz' ? 'Tushunarli' : language === 'ru' ? 'Понятно' : 'Understood'}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Power Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: language === 'ru' ? 'Точность ИИ' : language === 'uz' ? 'AI Aniqligi' : 'AI Accuracy', value: '98%', icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: language === 'ru' ? 'Экономия времени' : language === 'uz' ? 'Vaqtni tejash' : 'Save Time', value: '10x', icon: Wand2, color: 'text-[var(--brand-primary)]' },
                    { label: language === 'ru' ? 'SEO Буст' : language === 'uz' ? 'SEO O\'sishi' : 'SEO Boost', value: '45%', icon: Sparkles, color: 'text-amber-400' },
                    { label: language === 'ru' ? 'Языки' : language === 'uz' ? 'Tillar' : 'Languages', value: '3+', icon: Languages, color: 'text-[var(--brand-primary)]' }
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-2xl border-white/5 bg-white/[0.01] flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-xl font-black text-[var(--text-main)]">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIStudio;
