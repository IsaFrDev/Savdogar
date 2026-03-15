import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Check, Loader2, Wand2, X, Layout, Type, MousePointer2 } from 'lucide-react';

interface StoreStylistProps {
    currentLogo?: string;
    currentPrimary: string;
    currentSecondary: string;
    onApply: (primary: string, secondary: string, themeConfig?: any, logoFile?: File | null) => void;
    language: string;
}

export function StoreStylist({ currentPrimary, currentSecondary, onApply, language }: StoreStylistProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [logoPreview, setLogoPreview] = useState('');
    const [palette, setPalette] = useState<string[]>([]);
    const [suggestion, setSuggestion] = useState('');
    const [selectedPrimary, setSelectedPrimary] = useState(currentPrimary);
    const [selectedSecondary, setSelectedSecondary] = useState(currentSecondary);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [fontFamily, setFontFamily] = useState('Outfit');
    const [borderRadius, setBorderRadius] = useState('2rem');
    const [layout, setLayout] = useState('modern');
    const [applied, setApplied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const labels = {
        title: language === 'uz' ? 'AI Stilist V2' : language === 'ru' ? 'AI Стилист V2' : 'AI Stylist V2',
        upload: language === 'uz' ? 'Logotipni shu yerga tashlang' : language === 'ru' ? 'Перетащите логотип сюда' : 'Drop your logo here',
        analyzing: language === 'uz' ? 'AI tahlil qilmoqda...' : language === 'ru' ? 'AI анализирует...' : 'AI is analyzing...',
        apply: language === 'uz' ? 'Saqlash' : language === 'ru' ? 'Сохранить' : 'Apply Globally',
        primary: language === 'uz' ? 'Asosiy rang' : language === 'ru' ? 'Основной цвет' : 'Primary Color',
        secondary: language === 'uz' ? 'Ikkinchi rang' : language === 'ru' ? 'Вторичный цвет' : 'Secondary Color',
        font: language === 'uz' ? 'Shrift' : language === 'ru' ? 'Шрифт' : 'Brand Font',
        applied: language === 'uz' ? 'Muvaffaqiyatli!' : language === 'ru' ? 'Успешно!' : 'Success!',
        smartPalette: language === 'uz' ? 'Aqlli Palitra' : language === 'ru' ? 'Умная палитра' : 'Smart Palette',
        previewHint: language === 'uz' ? 'Rangni tanlang - u darhol dashboardda aks etadi' : language === 'ru' ? 'Выберите цвет - он сразу применится к панели' : 'Pick a color to preview it instantly',
    };

    // Live Preview Effect: Updates CSS variables locally for instant feedback
    useEffect(() => {
        if (!isOpen) return;
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', selectedPrimary);
        root.style.setProperty('--brand-secondary', selectedSecondary);
        root.style.setProperty('--brand-primary-glow', `${selectedPrimary}33`);
        root.style.setProperty('--font-family', fontFamily);
        root.style.setProperty('--border-radius', borderRadius);
    }, [selectedPrimary, selectedSecondary, fontFamily, borderRadius, isOpen]);

    const handleFileChange = async (file: File) => {
        if (!file) return;
        setLogoFile(file);

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const dataUrl = ev.target?.result as string;
            setLogoPreview(dataUrl);
            setIsAnalyzing(true);
            setApplied(false);

            try {
                const { aiApi } = await import('../services/api');
                const response = await aiApi.analyzeLogo({ image_data: dataUrl });
                const data = response.data;

                if (data.palette) setPalette(data.palette);
                if (data.primary) setSelectedPrimary(data.primary);
                if (data.secondary) setSelectedSecondary(data.secondary);
                if (data.font_family) setFontFamily(data.font_family);
                if (data.border_radius) setBorderRadius(data.border_radius);
                if (data.layout) setLayout(data.layout);
                if (data.suggestion) setSuggestion(data.suggestion);
            } catch (error) {
                console.error('Logo analysis failed:', error);
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileChange(file);
        }
    };

    const handleApply = () => {
        onApply(selectedPrimary, selectedSecondary, {
            fontFamily,
            borderRadius,
            layout,
            glassOpacity: '0.05'
        }, logoFile);
        setApplied(true);
        setTimeout(() => {
            setApplied(false);
            setIsOpen(false);
        }, 1500);
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="relative group flex items-center gap-3 px-8 py-4 rounded-[2rem] bg-indigo-600 text-white text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient" />
                <Wand2 className="w-5 h-5 relative z-10 animate-bounce" />
                <span className="relative z-10">{labels.title}</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-200"
                        >
                            {/* Header */}
                            <div className="p-8 sm:p-10 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Sparkles className="w-6 h-6 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{labels.title}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 italic">{labels.previewHint}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-4 rounded-2xl hover:bg-slate-50 text-slate-400 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Left Section: Upload & Suggestion */}
                                <div className="space-y-8">
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={onDrop}
                                        onClick={() => fileRef.current?.click()}
                                        className={`relative aspect-square rounded-[2.5rem] border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-6 group overflow-hidden ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[0.98]' :
                                            logoPreview ? 'border-indigo-100 bg-slate-50' : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50'
                                            }`}
                                    >
                                        {logoPreview ? (
                                            <motion.img
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                src={logoPreview}
                                                alt="Logo"
                                                className="w-40 h-40 object-contain drop-shadow-2xl"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                    <Upload className="w-8 h-8 text-indigo-500" />
                                                </div>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{labels.upload}</p>
                                            </div>
                                        )}

                                        {isAnalyzing && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{labels.analyzing}</p>
                                            </div>
                                        )}

                                        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} className="hidden" />
                                    </div>

                                    {suggestion && !isAnalyzing && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 italic text-sm text-slate-500 line-clamp-3">
                                            "{suggestion}"
                                        </motion.div>
                                    )}
                                </div>

                                {/* Right Section: Customization */}
                                <div className="space-y-8">
                                    {/* Smart Palette */}
                                    {palette.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{labels.smartPalette}</h4>
                                            <div className="flex flex-wrap gap-3">
                                                {palette.map((color, i) => (
                                                    <motion.button
                                                        key={i}
                                                        whileHover={{ scale: 1.15, rotate: 5 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => {
                                                            if (i % 2 === 0) setSelectedPrimary(color);
                                                            else setSelectedSecondary(color);
                                                        }}
                                                        className={`w-12 h-12 rounded-2xl shadow-lg border-4 transition-all ${color === selectedPrimary || color === selectedSecondary ? 'border-slate-900' : 'border-white'
                                                            }`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Color Selectors */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl shadow-inner border-2 border-white" style={{ backgroundColor: selectedPrimary }} />
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{labels.primary}</p>
                                                    <p className="text-xs font-mono font-bold text-slate-900">{selectedPrimary}</p>
                                                </div>
                                            </div>
                                            <input
                                                type="color"
                                                value={selectedPrimary}
                                                onChange={(e) => setSelectedPrimary(e.target.value)}
                                                className="w-8 h-8 rounded-lg cursor-pointer opacity-0 absolute"
                                            />
                                            <MousePointer2 className="w-4 h-4 text-slate-300" />
                                        </div>

                                        <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl shadow-inner border-2 border-white" style={{ backgroundColor: selectedSecondary }} />
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{labels.secondary}</p>
                                                    <p className="text-xs font-mono font-bold text-slate-900">{selectedSecondary}</p>
                                                </div>
                                            </div>
                                            <input
                                                type="color"
                                                value={selectedSecondary}
                                                onChange={(e) => setSelectedSecondary(e.target.value)}
                                                className="w-8 h-8 rounded-lg cursor-pointer opacity-0 absolute"
                                            />
                                            <MousePointer2 className="w-4 h-4 text-slate-300" />
                                        </div>
                                    </div>

                                    {/* Advanced Settings */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-indigo-500">
                                                <Type className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{labels.font}</span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-900 truncate">{fontFamily}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-indigo-500">
                                                <Layout className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Border</span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-900">{borderRadius}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-8 sm:p-10 bg-slate-50 flex items-center gap-6">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleApply}
                                    disabled={applied || isAnalyzing}
                                    className={`flex-1 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all flex items-center justify-center gap-3 ${applied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                                        }`}
                                >
                                    {applied ? <Check className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                                    {applied ? labels.applied : labels.apply}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient 3s ease infinite;
                }
            `}</style>
        </>
    );
}
