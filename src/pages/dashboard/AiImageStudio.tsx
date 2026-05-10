import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Sparkles, Scissors, Download, Upload, Loader2, Check, Trash2, Zap } from 'lucide-react';
import { supabaseApi } from '../../services/supabaseService';
import { Button } from '../../components/Button';
import { useApp } from '../../context/AppContext';

export default function AiImageStudio() {
    const { t } = useApp();
    const [image, setImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setProcessedImage(null);
                setStatus('');
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = async (action: 'polish' | 'remove_bg' | 'both') => {
        if (!image) return;
        setLoading(true);
        setStatus(action === 'remove_bg' ? 'Removing Background...' : action === 'polish' ? 'Polishing Image...' : 'Processing...');

        try {
            const response = await supabaseApi.ai.enhanceImage({
                image: image,
                action: action
            });
            setProcessedImage(response.data.enhanced_image);
            setStatus('Processing Complete!');
        } catch (error: any) {
            console.error('Image processing failed:', error);
            if (error.response?.status === 401) {
                setStatus('Session expired. Please login again.');
            } else if (error.response?.status === 413) {
                setStatus('Image too large. Try a smaller file.');
            } else {
                setStatus('Error processing image');
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = () => {
        if (!processedImage) return;
        const link = document.createElement('a');
        link.href = processedImage;
        link.download = `savdoon_ai_studio_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tight flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-indigo-500/20 shadow-inner">
                            <Sparkles className="w-8 h-8 text-indigo-400" />
                        </div>
                        {t('aiImageStudioTitle')}
                    </h1>
                    <p className="text-[var(--text-dim)] font-medium mt-2">
                        {t('aiImageStudioSubtitle')}
                    </p>
                </div>
                {image && (
                    <Button
                        variant="ghost"
                        onClick={() => { setImage(null); setProcessedImage(null); }}
                        icon={<Trash2 className="w-4 h-4" />}
                    >
                        {t('reset')}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload & Original View */}
                <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30" />

                    {!image ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-[2rem] border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer flex flex-col items-center justify-center p-10 text-center"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Upload className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-main)] uppercase mb-2">{t('uploadImage')}</h3>
                            <p className="text-[var(--text-dim)] text-sm">{t('imageFormatTip')}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">{t('originalImage')}</span>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('processedImage')}</span>
                            </div>
                            <div className="aspect-square rounded-[2rem] overflow-hidden bg-[var(--color-surface-raised)] border border-[var(--glass-border)]">
                                <img src={image} alt="Original" className="w-full h-full object-contain" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => processImage('remove_bg')}
                                    disabled={loading}
                                    className="h-14 rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--glass-border)] hover:border-indigo-500/50 hover:bg-indigo-500/5 text-[var(--text-main)] font-bold uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                    <Scissors className="w-4 h-4 text-indigo-400 group-hover/btn:rotate-12 transition-transform" />
                                    {t('removeBackground')}
                                </button>
                                <button
                                    onClick={() => processImage('polish')}
                                    disabled={loading}
                                    className="h-14 rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--glass-border)] hover:border-purple-500/50 hover:bg-purple-500/5 text-[var(--text-main)] font-bold uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                    <Zap className="w-4 h-4 text-purple-400 group-hover/btn:scale-110 transition-transform" />
                                    {t('polishImage')}
                                </button>
                            </div>
                            <button
                                onClick={() => processImage('both')}
                                disabled={loading}
                                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {t('fullProcess')}
                            </button>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                {/* Processed View */}
                <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-30" />

                    <div className="flex items-center justify-between px-2 mb-6">
                        <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">{t('result')}</span>
                        {status && (
                            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${status.includes('Error') ? 'text-rose-500' : 'text-emerald-400'}`}>
                                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                                {status}
                            </span>
                        )}
                    </div>

                    <div className="aspect-square rounded-[2rem] overflow-hidden bg-[var(--color-surface-raised)] border border-[var(--glass-border)] relative">
                        {processedImage ? (
                            <motion.img
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={processedImage}
                                alt="Processed"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-30">
                                <ImageIcon className="w-16 h-16 text-[var(--text-dim)] mb-4" />
                                <p className="text-[var(--text-dim)] text-xs font-bold uppercase tracking-widest">{t('waitingResult')}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6">
                        <button
                            disabled={!processedImage || loading}
                            onClick={downloadImage}
                            className="w-full h-16 rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--glass-border)] hover:bg-[var(--brand-primary)] hover:text-white disabled:opacity-30 text-[var(--text-main)] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group"
                        >
                            <Download className="w-6 h-6" />
                            {t('downloadImage')}
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Image Guidelines */}
            <div className="p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10">
                <h4 className="text-[var(--text-main)] font-bold uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-400" />
                    {t('imageTips')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <p className="text-indigo-400 text-[10px] font-black uppercase">{t('tipLighting')}</p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{t('tipLightingDesc')}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-indigo-400 text-[10px] font-black uppercase">{t('tipBackground')}</p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{t('tipBackgroundDesc')}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-indigo-400 text-[10px] font-black uppercase">{t('tipCentering')}</p>
                        <p className="text-[var(--text-dim)] text-[11px] leading-relaxed">{t('tipCenteringDesc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
