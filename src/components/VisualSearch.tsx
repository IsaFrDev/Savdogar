import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, X, ImageIcon } from 'lucide-react';
import api from '../services/api';

interface VisualSearchProps {
    storeSlug?: string;
    onResultClick?: (productId: number) => void;
    language: string;
}

export function VisualSearch({ storeSlug, onResultClick, language }: VisualSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [imagePreview, setImagePreview] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [keywords, setKeywords] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const labels = {
        title: language === 'uz' ? '🔍 Rasm bilan qidirish' : language === 'ru' ? '🔍 Поиск по фото' : '🔍 Visual Search',
        upload: language === 'uz' ? 'Rasm yuklang yoki suratga oling' : language === 'ru' ? 'Загрузите фото' : 'Upload photo or take a picture',
        searching: language === 'uz' ? 'AI qidirmoqda...' : language === 'ru' ? 'AI ищет...' : 'AI searching...',
        noResults: language === 'uz' ? 'Mahsulot topilmadi' : language === 'ru' ? 'Товары не найдены' : 'No products found',
        found: language === 'uz' ? 'topildi' : language === 'ru' ? 'найдено' : 'found',
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const dataUrl = ev.target?.result as string;
            setImagePreview(dataUrl);
            setIsSearching(true);
            setResults([]);

            try {
                const response = await api.post('/ai/visual-search/', {
                    image_data: dataUrl,
                    store_slug: storeSlug || ''
                });
                setResults(response.data.results || []);
                setKeywords(response.data.keywords || '');
            } catch {
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-dim)] hover:text-violet-500 transition-all"
                title={labels.title}
            >
                <Camera className="w-5 h-5" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between">
                                <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
                                    <Search className="w-5 h-5 text-violet-500" />
                                    {labels.title}
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-[var(--bg-surface)]">
                                    <X className="w-5 h-5 text-[var(--text-dim)]" />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Upload */}
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="border-2 border-dashed border-[var(--glass-border)] rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-violet-500/50 transition-colors"
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Search" className="w-32 h-32 rounded-xl object-cover" />
                                    ) : (
                                        <ImageIcon className="w-12 h-12 text-[var(--text-dim)]" />
                                    )}
                                    <span className="text-xs text-[var(--text-dim)]">{labels.upload}</span>
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

                                {/* Scanning Animation */}
                                {isSearching && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center gap-3 py-4"
                                    >
                                        <div className="relative w-20 h-20">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                                className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 border-r-fuchsia-500"
                                            />
                                            <Search className="absolute inset-0 m-auto w-8 h-8 text-violet-500" />
                                        </div>
                                        <span className="text-sm font-bold text-violet-500">{labels.searching}</span>
                                    </motion.div>
                                )}

                                {/* Keywords */}
                                {keywords && !isSearching && (
                                    <p className="text-xs text-[var(--text-dim)] text-center">
                                        AI: <span className="font-bold text-[var(--text-main)]">{keywords}</span>
                                    </p>
                                )}

                                {/* Results */}
                                {results.length > 0 && !isSearching && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                                        <p className="text-xs font-bold text-[var(--text-dim)]">{results.length} {labels.found}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {results.map((product: any) => (
                                                <motion.div
                                                    key={product.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => onResultClick?.(product.id)}
                                                    className="p-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-all"
                                                >
                                                    <p className="text-sm font-bold text-[var(--text-main)] truncate">{product.name}</p>
                                                    <p className="text-xs font-black text-violet-500">{Number(product.price).toLocaleString()} UZS</p>
                                                    {product.store__name && (
                                                        <p className="text-[10px] text-[var(--text-dim)] mt-1">🏪 {product.store__name}</p>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* No Results */}
                                {results.length === 0 && !isSearching && imagePreview && (
                                    <p className="text-sm text-[var(--text-dim)] text-center py-4">{labels.noResults}</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
