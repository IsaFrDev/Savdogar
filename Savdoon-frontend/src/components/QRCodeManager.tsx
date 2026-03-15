import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, Printer, ShoppingBag, Store, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

interface QRCodeManagerProps {
    storeId: string;
}

export function QRCodeManager({ storeId: _storeId }: QRCodeManagerProps) {
    const { t, currentStore, products } = useApp();
    const [selectedProduct, setSelectedProduct] = useState<string | 'store'>('store');
    const [copied, setCopied] = useState(false);

    const getQRValue = () => {
        const baseUrl = window.location.origin;
        if (selectedProduct === 'store') {
            return `${baseUrl}/store/${currentStore?.slug}`;
        }
        const product = products.find(p => p.id === selectedProduct);
        return `${baseUrl}/store/${currentStore?.slug}?product=${product?.slug}`;
    };

    const downloadQR = () => {
        const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = `qr-${selectedProduct === 'store' ? 'store' : 'product'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getQRValue());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight uppercase mb-2">{t('qrTitle')}</h1>
                    <p className="text-[var(--text-dim)] font-medium tracking-wide">{t('qrSubtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 rounded-[2rem] border-[var(--glass-border)] bg-[var(--color-surface-raised)] shadow-sm">
                        <h3 className="text-[var(--text-main)] font-black uppercase tracking-widest text-sm mb-6">{t('qrType')}</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => setSelectedProduct('store')}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${selectedProduct === 'store'
                                    ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30 text-[var(--brand-primary)] shadow-sm'
                                    : 'bg-[var(--bg-body)] border-[var(--color-border)] text-[var(--text-dim)] hover:border-[var(--brand-primary)]/50'
                                    }`}
                            >
                                <div className={`p-2 rounded-xl transition-all ${selectedProduct === 'store' ? 'bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--brand-primary-glow)]' : 'bg-[var(--color-border)] text-[var(--text-dim)] group-hover:bg-[var(--brand-primary)]/20'}`}>
                                    <Store className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">{t('storeQR')}</p>
                                    <p className="text-[10px] uppercase tracking-widest font-black opacity-60">{t('toMainPage')}</p>
                                </div>
                            </button>

                            <div className="relative pt-4">
                                <div className="absolute inset-0 flex items-center px-4" aria-hidden="true">
                                    <div className="w-full border-t border-[var(--color-border)]"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-[var(--text-dim)]">
                                    <span className="bg-[var(--color-surface-raised)] px-3">{t('orProduct')}</span>
                                </div>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                {products.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => setSelectedProduct(product.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${selectedProduct === product.id
                                            ? 'bg-[var(--brand-secondary)]/10 border-[var(--brand-secondary)]/30 text-[var(--brand-secondary)] shadow-sm'
                                            : 'bg-[var(--bg-body)] border-[var(--color-border)] text-[var(--text-dim)] hover:border-[var(--brand-secondary)]/50'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl transition-all ${selectedProduct === product.id ? 'bg-[var(--brand-secondary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--brand-secondary-glow)]' : 'bg-[var(--color-border)] text-[var(--text-dim)]'}`}>
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <p className="font-bold text-sm truncate">{product.name}</p>
                                            <p className="text-[10px] uppercase tracking-widest font-black opacity-60">{product.price.toLocaleString()} sum</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Preview & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-12 rounded-[2.5rem] border-[var(--glass-border)] bg-[var(--color-surface-raised)] shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)]/5 blur-3xl rounded-full -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--brand-secondary)]/5 blur-3xl rounded-full -ml-32 -mb-32" />

                        <div className="relative z-10 p-10 bg-white rounded-[2rem] shadow-2xl">
                            <QRCodeCanvas
                                id="qr-code-canvas"
                                value={getQRValue()}
                                size={256}
                                level="H"
                                includeMargin={false}
                                imageSettings={{
                                    src: "/favicon.ico",
                                    x: undefined,
                                    y: undefined,
                                    height: 48,
                                    width: 48,
                                    excavate: true,
                                }}
                            />
                        </div>

                        <div className="mt-10 text-center space-y-2">
                            <p className="text-[var(--text-main)] font-black uppercase tracking-widest text-lg">
                                {selectedProduct === 'store' ? t('storeQR') : products.find(p => p.id === selectedProduct)?.name}
                            </p>
                            <div className="flex items-center gap-2 justify-center py-2 px-4 bg-[var(--bg-body)] rounded-full border border-[var(--color-border)] cursor-pointer group hover:border-[var(--brand-primary)]/50 transition-colors" onClick={copyToClipboard}>
                                <span className="text-xs text-[var(--text-dim)] font-bold truncate max-w-[250px]">{getQRValue()}</span>
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-dim)] group-hover:text-[var(--brand-primary)] transition-colors" />}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 w-full max-w-lg">
                            <button
                                onClick={downloadQR}
                                className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-[var(--bg-body)] border border-[var(--color-border)] text-[var(--text-dim)] hover:text-[var(--text-main)] hover:border-[var(--brand-primary)]/50 transition-all hover:bg-[var(--brand-primary)]/5 group shadow-sm"
                            >
                                <div className="p-3 rounded-2xl bg-[var(--color-border)] group-hover:bg-[var(--brand-primary)] group-hover:text-[var(--primary-foreground)] transition-all">
                                    <Download className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{t('download')}</span>
                            </button>

                            <button
                                className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-[var(--bg-body)] border border-[var(--color-border)] text-[var(--text-dim)] hover:text-[var(--text-main)] hover:border-emerald-500/50 transition-all hover:bg-emerald-500/5 group shadow-sm"
                                onClick={() => window.print()}
                            >
                                <div className="p-3 rounded-2xl bg-[var(--color-border)] group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-emerald-500/20 group-hover:shadow-lg">
                                    <Printer className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{t('print')}</span>
                            </button>

                            <button
                                className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-[var(--bg-body)] border border-[var(--color-border)] text-[var(--text-dim)] hover:text-[var(--text-main)] hover:border-sky-500/50 transition-all hover:bg-sky-500/5 group shadow-sm"
                            >
                                <div className="p-3 rounded-2xl bg-[var(--color-border)] group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sky-500/20 group-hover:shadow-lg">
                                    <Share2 className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{t('share')}</span>
                            </button>

                            <button
                                className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-[var(--bg-body)] border border-[var(--color-border)] text-[var(--text-dim)] hover:text-[var(--text-main)] hover:border-amber-500/50 transition-all hover:bg-amber-500/5 group shadow-sm"
                            >
                                <div className="p-3 rounded-2xl bg-[var(--color-border)] group-hover:bg-amber-500 group-hover:text-white transition-all shadow-amber-500/20 group-hover:shadow-lg">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{t('order')}</span>
                            </button>
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-[2rem] border-[var(--glass-border)] bg-[var(--color-surface-raised)] shadow-sm relative overflow-hidden group">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-[var(--primary-foreground)] shadow-lg shadow-[var(--brand-primary-glow)]">
                                <Check className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-[var(--text-main)] font-bold text-lg mb-1">{t('qrTipTitle')}</h4>
                                <p className="text-[var(--text-dim)] text-sm">{t('qrTipDesc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
