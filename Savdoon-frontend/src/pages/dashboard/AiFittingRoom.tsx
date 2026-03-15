import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Layers, Loader2, Download, Check, Camera } from 'lucide-react';
import { aiApi, productApi } from '../../services/api';

import { useApp } from '../../context/AppContext';

interface AiFittingRoomProps {
    storeId?: number;
}

export default function AiFittingRoom({ storeId }: AiFittingRoomProps) {
    const { t } = useApp();
    const [personImage, setPersonImage] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const personInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (storeId) {
            loadProducts();
        }
    }, [storeId]);

    const loadProducts = async () => {
        try {
            const res = await productApi.list({ store: storeId });
            // Filter products that have images
            setProducts(res.data.filter((p: any) => p.image));
        } catch (e) {
            console.error(e);
        }
    };

    const handlePersonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPersonImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleTryOn = async () => {
        if (!personImage || !selectedProduct) return;
        setLoading(true);
        try {
            // First, ensure we have the base64 of the product image
            // Since product.image is a URL, we might need to fetch it and convert to base64
            // OR if backend handles URL, that's fine. But our backend expects base64.
            // For now, let's assume we fetch the image and convert.

            const productBase64 = await urlToBase64(selectedProduct.image);

            const res = await aiApi.virtualTryOn({
                person_image: personImage,
                garment_image: productBase64
            });
            setResultImage(res.data.result_image);
        } catch (error) {
            console.error("Try-on failed:", error);
            alert(t('tryOnFailed'));
        } finally {
            setLoading(false);
        }
    };

    const urlToBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tight flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-pink-500/20 shadow-inner">
                            <Layers className="w-8 h-8 text-pink-400" />
                        </div>
                        {t('aiFittingRoomTitle')}
                    </h1>
                    <p className="text-slate-400 font-medium mt-2">
                        {t('aiFittingRoomSubtitle')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                {/* 1. Person Upload */}
                <div className="glass-card p-6 flex flex-col h-full rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-black">1</div>
                        <h3 className="font-bold text-[var(--text-main)] uppercase">{t('yourPhoto')}</h3>
                    </div>

                    <div
                        onClick={() => personInputRef.current?.click()}
                        className="flex-1 rounded-[2rem] border-2 border-dashed border-[var(--glass-border)] hover:border-pink-500/50 hover:bg-pink-500/5 transition-all cursor-pointer overflow-hidden relative group"
                    >
                        {personImage ? (
                            <img src={personImage} alt="Person" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                <User className="w-16 h-16 mb-4 opacity-50" />
                                <span className="text-xs font-black uppercase tracking-widest">{t('uploadYourPhoto')}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <input type="file" ref={personInputRef} onChange={handlePersonUpload} accept="image/*" className="hidden" />
                </div>

                {/* 2. Product Selection */}
                <div className="glass-card p-6 flex flex-col h-full rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-black">2</div>
                        <h3 className="font-bold text-[var(--text-main)] uppercase">{t('selectGarment')}</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {products.map(product => (
                            <div
                                key={product.id}
                                onClick={() => setSelectedProduct(product)}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedProduct?.id === product.id ? 'bg-pink-500/20 border-pink-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                            >
                                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-[var(--color-surface-raised)]" />
                                <div>
                                    <h4 className="font-bold text-[var(--text-main)] text-sm">{product.name}</h4>
                                    <p className="text-pink-400 text-xs font-bold">{parseInt(product.price).toLocaleString()} UZS</p>
                                </div>
                                {selectedProduct?.id === product.id && <Check className="ml-auto text-pink-500 w-5 h-5" />}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleTryOn}
                        disabled={loading || !personImage || !selectedProduct}
                        className="mt-6 w-full h-14 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black uppercase tracking-widest shadow-lg shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                        {t('tryOn')}
                    </button>
                </div>

                {/* 3. Result */}
                <div className="glass-card p-6 flex flex-col h-full rounded-[2.5rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-black">3</div>
                        <h3 className="font-bold text-[var(--text-main)] uppercase">{t('result')}</h3>
                    </div>

                    <div className="flex-1 rounded-[2rem] bg-[var(--color-surface-raised)] border border-[var(--glass-border)] overflow-hidden relative flex items-center justify-center">
                        {resultImage ? (
                            <motion.img
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={resultImage}
                                alt="Try-on Result"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest text-center px-8">
                                {t('resultPlaceholder')}
                            </p>
                        )}
                    </div>

                    {resultImage && (
                        <button className="mt-6 w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                            <Download className="w-5 h-5" />
                            {t('downloadImage')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
