import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { Eraser, Check, Sparkles, Loader2, X } from 'lucide-react';
import { Button } from './Button';
import { aiService } from '../services/aiService';
import { useApp } from '../context/AppContext';

interface SignaturePadProps {
    onSign: (signature: string) => void;
    width?: number;
    height?: number;
    label?: string;
    nameForGeneration?: string;
}

export interface SignaturePadRef {
    clear: () => void;
    isEmpty: () => boolean;
    getSignature: () => string;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
    ({ onSign, width = 400, height = 200, label, nameForGeneration }, ref) => {
        const { language } = useApp();
        const signatureRef = useRef<SignatureCanvas>(null);
        const [isEnhancing, setIsEnhancing] = useState(false);
        const [isGenerating, setIsGenerating] = useState(false);
        const [enhanced, setEnhanced] = useState(false);
        const [variants, setVariants] = useState<any[]>([]);
        const [showVariants, setShowVariants] = useState(false);

        useImperativeHandle(ref, () => ({
            clear: () => {
                signatureRef.current?.clear();
                setEnhanced(false);
                setVariants([]);
            },
            isEmpty: () => signatureRef.current?.isEmpty() ?? true,
            getSignature: () => signatureRef.current?.toDataURL() ?? '',
        }));

        const handleClear = () => {
            signatureRef.current?.clear();
            setEnhanced(false);
        };

        const handleConfirm = () => {
            if (signatureRef.current && !signatureRef.current.isEmpty()) {
                const signatureData = signatureRef.current.toDataURL();
                onSign(signatureData);
            }
        };

        const handleEnhance = async () => {
            if (signatureRef.current && !signatureRef.current.isEmpty()) {
                setIsEnhancing(true);
                try {
                    const originalSignature = signatureRef.current.toDataURL();
                    const enhancedSignature = await aiService.enhanceSignature(originalSignature);

                    if (enhancedSignature && signatureRef.current) {
                        const canvas = signatureRef.current.getCanvas();
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        img.onload = () => {
                            if (ctx) {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                // Keep transparent or slightly tinted for UI, but handle save properly
                                // Drawing the image (which might have been processed by AI)
                                ctx.drawImage(img, 0, 0);
                                setEnhanced(true);
                            }
                        };
                        img.src = enhancedSignature;
                    }
                } catch (error) {
                    console.error('Failed to enhance signature:', error);
                } finally {
                    setIsEnhancing(false);
                }
            }
        };

        const handleGenerateVariants = async () => {
            if (!nameForGeneration) return;
            setIsGenerating(true);
            try {
                const results = await aiService.generateSignatures(nameForGeneration);
                setVariants(results);
                setShowVariants(true);
            } catch (error) {
                console.error('Failed to generate signatures:', error);
            } finally {
                setIsGenerating(false);
            }
        };

        const applyVariant = (variant: any) => {
            if (signatureRef.current) {
                const canvas = signatureRef.current.getCanvas();
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    // Transparent background for UI

                    // Draw the name with specific font
                    ctx.font = `italic 48px ${variant.font_family}`;
                    ctx.fillStyle = '#1e293b';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(variant.text, canvas.width / 2, canvas.height / 2);

                    setEnhanced(true);
                    setShowVariants(false);
                }
            }
        };

        return (
            <div className="space-y-3">
                {label && (
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</label>
                )}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative rounded-3xl border-2 border-dashed ${enhanced ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' : 'border-[var(--color-border)] bg-[var(--color-surface-raised)]'} overflow-hidden transition-all duration-500 shadow-inner`}
                    style={{ width, height: height + 50 }}
                >
                    <div className="absolute top-3 left-4 text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2 z-10">
                        ✍️ {language === 'uz' ? "Imzo chizing yoki AI tanlang" : "Sign or select AI"}
                        {enhanced && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-[8px] font-black uppercase tracking-widest border border-[var(--brand-primary)]/30"
                            >
                                <Sparkles className="w-2 h-2" /> AI Sync
                            </motion.span>
                        )}
                    </div>
                    <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                            width,
                            height,
                            style: {
                                marginTop: 25,
                                cursor: 'crosshair',
                            },
                        }}
                        backgroundColor="transparent"
                        penColor="#1e293b"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/5 mx-8" />

                    <AnimatePresence>
                        {(isEnhancing || isGenerating) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center p-4 z-20"
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-3 rounded-full bg-[var(--brand-primary)]/10">
                                        <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-[var(--brand-primary)]">
                                        AI Analyzing...
                                    </span>
                                </div>
                            </motion.div>
                        )}

                        {showVariants && variants.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white/98 backdrop-blur-2xl overflow-y-auto p-6 z-30"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-[11px] font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-widest">
                                        <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
                                        AI Signature Lab
                                    </h3>
                                    <button onClick={() => setShowVariants(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pb-4">
                                    {variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => applyVariant(v)}
                                            className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 transition-all text-center group shadow-sm"
                                        >
                                            <span
                                                className="text-2xl block mb-2 truncate text-[var(--text-primary)] group-hover:scale-110 transition-transform"
                                                style={{ fontFamily: v.font_family }}
                                            >
                                                {v.text}
                                            </span>
                                            <span className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">{v.style}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-600 mb-2 font-bold uppercase tracking-widest">Select to apply</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <div className="flex gap-2 flex-wrap">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleClear}
                        icon={<Eraser className="w-4 h-4" />}
                        className="shadow-sm"
                    >
                        {language === 'uz' ? "O'chirish" : "Clear"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEnhance}
                        disabled={isEnhancing || isGenerating}
                        className="!border-[var(--brand-primary)]/30 !text-[var(--brand-primary)] hover:!bg-[var(--brand-primary)]/10"
                        icon={<Sparkles className="w-4 h-4" />}
                    >
                        {language === 'uz' ? "Chiroyli qilish" : "Beautify"}
                    </Button>
                    {nameForGeneration && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateVariants}
                            disabled={isEnhancing || isGenerating}
                            className="!border-emerald-500/30 !text-emerald-400 hover:!bg-emerald-500/10"
                            icon={<Sparkles className="w-4 h-4" />}
                        >
                            AI Generate
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirm}
                        icon={<Check className="w-4 h-4" />}
                        className="bg-[var(--brand-primary)] hover:brightness-110 text-[var(--primary-foreground)] shadow-lg shadow-[var(--brand-primary-glow)]"
                    >
                        {language === 'uz' ? "Tasdiqlash" : "Confirm"}
                    </Button>
                </div>
            </div>
        );
    }
);

SignaturePad.displayName = 'SignaturePad';
