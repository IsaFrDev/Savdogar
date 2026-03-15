import { useRef, useState, useEffect } from 'react';
import { Download, Send, Loader2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import { GlassCard } from './GlassCard';
import { Button } from './Button';

export function TelegramCardCreator() {
    const { language } = useApp();
    const cardRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [storeData, setStoreData] = useState<any>(null);
    const activeStoreId = localStorage.getItem('active_store_id');

    useEffect(() => {
        // Fetch active store info from localStorage or app context
        // For now, we'll try to get it from what's available
        const currentStore = JSON.parse(localStorage.getItem('current_store') || '{}');
        if (currentStore && currentStore.id) {
            setStoreData(currentStore);
        }
    }, [activeStoreId]);

    const handleDownload = async () => {
        if (!cardRef.current || !canvasRef.current) return;
        setIsDownloading(true);

        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Set canvas size (High resolution)
            const width = 1200;
            const height = 1200;
            canvas.width = width;
            canvas.height = height;

            // 1. Draw Background (Telegram Gradient)
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#242f3d'); // Dark Telegram theme
            gradient.addColorStop(1, '#17212b');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Add subtle patterns
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 50; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            // 2. Draw Decorative Shapes
            ctx.fillStyle = '#2b5278'; // Telegram Blue
            ctx.beginPath();
            ctx.arc(width * 0.9, height * 0.1, 200, 0, Math.PI * 2);
            ctx.fill();

            // 3. Draw Store Logo Placeholder or Image
            const logoSize = 240;
            const logoX = width / 2 - logoSize / 2;
            const logoY = 150;

            // Draw shadow for logo
            ctx.shadowBlur = 40;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.arc(width / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw Logo
            if (storeData?.logo) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = storeData.logo.startsWith('http') ? storeData.logo : `${window.location.origin}${storeData.logo}`;

                await new Promise((resolve) => {
                    img.onload = () => {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(width / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
                        ctx.clip();
                        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
                        ctx.restore();
                        resolve(null);
                    };
                    img.onerror = () => {
                        // Fallback to Icon
                        drawFallbackLogo(ctx, width, logoY, logoSize);
                        resolve(null);
                    };
                });
            } else {
                drawFallbackLogo(ctx, width, logoY, logoSize);
            }

            // 4. Draw Store Name
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 72px Inter, sans-serif'; // High weight
            ctx.textAlign = 'center';
            ctx.fillText(storeData?.name || 'SAVDOON STORE', width / 2, 500);

            // 5. Draw Tagline/Description
            ctx.fillStyle = '#708499'; // Telegram muted text
            ctx.font = '600 32px Inter, sans-serif';
            ctx.fillText(storeData?.business_type || 'DIGITAL MARKETPLACE', width / 2, 560);

            // 6. Draw "Visit our Shop" Text
            ctx.fillStyle = '#2481cc'; // Telegram Blue
            ctx.font = '800 24px Inter, sans-serif';
            ctx.fillText(language === 'uz' ? 'DO\'KONIMIZGA TASHRIF BUYURING' : 'VISIT OUR SHOP ON TELEGRAM', width / 2, 650);

            // 7. Draw QR Code Container
            const qrBoxSize = 350;
            const qrX = width / 2 - qrBoxSize / 2;
            const qrY = 700;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(qrX - 20, qrY - 20, qrBoxSize + 40, qrBoxSize + 40, 40);
            ctx.fill();

            // 8. Draw QR Code (from canvas)
            const qrCanvas = document.getElementById('telegram-qr-gen') as HTMLCanvasElement;
            if (qrCanvas) {
                ctx.drawImage(qrCanvas, qrX, qrY, qrBoxSize, qrBoxSize);
            }

            // 9. Draw Telegram Footer
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 36px Inter, sans-serif';
            ctx.fillText('@SavdoonBot', width / 2, 1120);

            ctx.fillStyle = '#708499';
            ctx.font = '500 24px Inter, sans-serif';
            ctx.fillText('Powered by Savdoon.uz', width / 2, 1160);

            // 10. Trigger Download
            const link = document.createElement('a');
            link.download = `${storeData?.name || 'store'}_telegram_card.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

        } catch (err) {
            console.error('Failed to create card:', err);
            alert('Faylni yuklashda xatolik yuz berdi');
        } finally {
            setIsDownloading(false);
        }
    };

    const drawFallbackLogo = (ctx: CanvasRenderingContext2D, width: number, logoY: number, logoSize: number) => {
        ctx.fillStyle = '#2481cc';
        ctx.beginPath();
        ctx.arc(width / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 120px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', width / 2, logoY + logoSize / 2);
    };

    const shopUrl = `https://t.me/SavdoonBot?start=${activeStoreId}`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <GlassCard className="p-8 border-[var(--brand-primary)]/10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-[#2481cc]/10 flex items-center justify-center border border-[#2481cc]/20">
                            <Send className="w-6 h-6 text-[#2481cc]" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Telegram Card Generator</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Posters for your Telegram channel</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Store URL</p>
                            <p className="text-sm font-bold text-[#2481cc] truncate">{shopUrl}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Theme</p>
                                <p className="text-xs font-bold text-white">Classic Telegram Dark</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Format</p>
                                <p className="text-xs font-bold text-white">Square (1:1)</p>
                            </div>
                        </div>

                        <Button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="w-full h-14 rounded-2xl bg-[#2481cc] hover:bg-[#28a1ff] text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#2481cc]/20 transition-all"
                        >
                            {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Download PNG</>}
                        </Button>
                    </div>
                </GlassCard>

                {/* Hidden components for generation */}
                <div className="hidden">
                    <canvas ref={canvasRef} />
                    <QRCodeCanvas
                        id="telegram-qr-gen"
                        value={shopUrl}
                        size={512}
                        level="H"
                        includeMargin={false}
                    />
                </div>
            </div>

            <div className="flex flex-col items-center justify-center">
                <div
                    ref={cardRef}
                    className="w-full max-w-[400px] aspect-square rounded-[2rem] bg-gradient-to-br from-[#242f3d] to-[#17212b] shadow-2xl overflow-hidden relative border border-white/10 flex flex-col items-center p-8"
                >
                    {/* Decorative Top Circle */}
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#2b5278] rounded-full opacity-50 blur-2xl" />

                    {/* Logo Section */}
                    <div className="w-24 h-24 rounded-full bg-[#2481cc] border-4 border-[#17212b] shadow-xl overflow-hidden flex items-center justify-center mb-6 z-10">
                        {storeData?.logo ? (
                            <img
                                src={storeData.logo.startsWith('/') ? `${window.location.origin}${storeData.logo}` : storeData.logo}
                                alt="Store"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-3xl font-black text-white">S</span>
                        )}
                    </div>

                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1 z-10">
                        {storeData?.name || 'Savdoon Store'}
                    </h2>
                    <p className="text-[10px] font-black text-[#708499] uppercase tracking-[0.2em] mb-8 z-10">
                        {storeData?.business_type || 'Digital Marketplace'}
                    </p>

                    <div className="bg-white p-4 rounded-3xl shadow-2xl mb-auto z-10">
                        <QRCodeCanvas
                            value={shopUrl}
                            size={120}
                            level="M"
                            includeMargin={false}
                        />
                    </div>

                    <div className="w-full mt-auto flex flex-col items-center space-y-1 z-10">
                        <div className="flex items-center gap-2 text-white/90 font-black text-sm uppercase tracking-widest">
                            <Send className="w-4 h-4 text-[#2481cc]" />
                            @SavdoonBot
                        </div>
                        <p className="text-[8px] text-[#708499] font-black uppercase tracking-[0.2em]">
                            Powered by Savdoon.uz
                        </p>
                    </div>

                    {/* Telegram Watermark Background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                        <Send className="w-64 h-64 rotate-12" />
                    </div>
                </div>

                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-6">
                    {language === 'uz' ? 'Kartochka qoralamasi (Preview)' : 'Card Preview'}
                </p>
            </div>
        </div>
    );
}
