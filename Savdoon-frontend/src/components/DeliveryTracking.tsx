import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Package, Truck, CheckCircle, Clock, X, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DeliveryTrackingProps {
    orderId: number;
    status: string;
    courierInfo?: {
        name: string;
        phone?: string;
        vehicle_type?: string;
    };
    onClose: () => void;
}

const STEPS = [
    { key: 'pending', icon: Clock, label_uz: 'Kutilmoqda', label_en: 'Pending', label_ru: 'Ожидание' },
    { key: 'confirmed', icon: Package, label_uz: 'Tasdiqlangan', label_en: 'Confirmed', label_ru: 'Подтвержден' },
    { key: 'shipped', icon: Truck, label_uz: 'Yo\'lda', label_en: 'Shipped', label_ru: 'В пути' },
    { key: 'delivered', icon: CheckCircle, label_uz: 'Yetkazildi', label_en: 'Delivered', label_ru: 'Доставлен' },
];

export function DeliveryTracking({ orderId, status, courierInfo, onClose }: DeliveryTrackingProps) {
    const { language } = useApp();
    const [estimatedTime, setEstimatedTime] = useState<string>('');

    const getCurrentStepIndex = () => {
        const idx = STEPS.findIndex(s => s.key === status);
        return idx >= 0 ? idx : 0;
    };

    const currentStep = getCurrentStepIndex();

    useEffect(() => {
        // Estimate delivery time based on status
        if (status === 'shipped') {
            setEstimatedTime(language === 'uz' ? '30-45 daqiqa' : language === 'ru' ? '30-45 минут' : '30-45 minutes');
        } else if (status === 'confirmed') {
            setEstimatedTime(language === 'uz' ? '1-2 soat' : language === 'ru' ? '1-2 часа' : '1-2 hours');
        }
    }, [status, language]);

    const getLabel = (step: typeof STEPS[0]) => {
        if (language === 'uz') return step.label_uz;
        if (language === 'ru') return step.label_ru;
        return step.label_en;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">
                            {language === 'uz' ? 'Buyurtma kuzatuvi' : language === 'ru' ? 'Отслеживание заказа' : 'Order Tracking'}
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                            #{orderId}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Timeline */}
                <div className="p-8">
                    <div className="relative">
                        {STEPS.map((step, index) => {
                            const StepIcon = step.icon;
                            const isCompleted = index <= currentStep;
                            const isCurrent = index === currentStep;

                            return (
                                <div key={step.key} className="flex items-start gap-4 relative">
                                    {/* Connector Line */}
                                    {index < STEPS.length - 1 && (
                                        <div className="absolute left-5 top-10 w-0.5 h-12">
                                            <div
                                                className={`w-full h-full transition-all duration-500 ${index < currentStep ? 'bg-emerald-500' : 'bg-slate-800'
                                                    }`}
                                            />
                                        </div>
                                    )}

                                    {/* Step Icon */}
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: isCurrent ? 1.1 : 1,
                                            boxShadow: isCurrent ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
                                        }}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isCompleted
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-slate-800 text-slate-600 border border-white/5'
                                            }`}
                                    >
                                        <StepIcon className="w-5 h-5" />
                                    </motion.div>

                                    {/* Step Content */}
                                    <div className={`pb-8 ${index === STEPS.length - 1 ? 'pb-0' : ''}`}>
                                        <p className={`text-sm font-black uppercase tracking-tight ${isCompleted ? 'text-white' : 'text-slate-600'
                                            }`}>
                                            {getLabel(step)}
                                        </p>
                                        {isCurrent && estimatedTime && (
                                            <motion.p
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-xs text-emerald-400 font-bold mt-1"
                                            >
                                                ⏱ {language === 'uz' ? 'Taxminiy vaqt' : 'Est. time'}: {estimatedTime}
                                            </motion.p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Courier Info */}
                    {courierInfo && status === 'shipped' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                        {language === 'uz' ? 'Kuryer' : 'Courier'}
                                    </p>
                                    <p className="text-sm font-black text-white">{courierInfo.name}</p>
                                </div>
                            </div>
                            {courierInfo.phone && (
                                <a
                                    href={`tel:${courierInfo.phone}`}
                                    className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-black uppercase tracking-widest w-fit"
                                >
                                    <Phone className="w-4 h-4" />
                                    {courierInfo.phone}
                                </a>
                            )}
                            {courierInfo.vehicle_type && (
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                                    🚗 {courierInfo.vehicle_type}
                                </p>
                            )}
                        </motion.div>
                    )}

                    {/* Map Visual */}
                    {status === 'shipped' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 h-48 rounded-2xl bg-slate-800 border border-white/5 overflow-hidden relative shadow-inner"
                        >
                            <div className="absolute inset-0 opacity-20">
                                {/* Stylized Map Background */}
                                <svg width="100%" height="100%" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="scale-150 transform">
                                    <path d="M0 50H100V150H0V50Z" fill="#1E293B" />
                                    <path d="M120 20H220V120H120V20Z" fill="#1E293B" />
                                    <path d="M240 80H340V180H240V80Z" fill="#1E293B" />
                                    <path d="M50 0V200" stroke="#334155" strokeWidth="10" />
                                    <path d="M160 0V200" stroke="#334155" strokeWidth="10" />
                                    <path d="M280 0V200" stroke="#334155" strokeWidth="10" />
                                    <path d="M0 70H400" stroke="#334155" strokeWidth="10" />
                                    <path d="M0 130H400" stroke="#334155" strokeWidth="10" />
                                </svg>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-[80%] h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '60%' }}
                                        transition={{ duration: 2, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                    />
                                    <motion.div
                                        animate={{ x: [0, 200], opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                        className="absolute top-0 left-0 w-8 h-full bg-white/20 skew-x-12"
                                    />
                                </div>

                                <div className="absolute top-1/2 left-[10%] -translate-y-1/2">
                                    <div className="p-2 rounded-xl bg-slate-900 border border-white/10 shadow-xl">
                                        <Package className="w-4 h-4 text-slate-500" />
                                    </div>
                                </div>

                                <motion.div
                                    animate={{ left: '60%' }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    className="absolute top-1/2 -translate-y-1/2"
                                >
                                    <div className="relative">
                                        <motion.div
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute inset-0 bg-emerald-500 rounded-full"
                                        />
                                        <div className="relative p-2.5 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 border-2 border-slate-900">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="absolute top-1/2 left-[90%] -translate-y-1/2">
                                    <div className="p-2 rounded-xl bg-slate-900 border border-white/10 shadow-xl">
                                        <MapPin className="w-4 h-4 text-emerald-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-4 inset-x-0 text-center">
                                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em] animate-pulse">
                                    {language === 'uz' ? 'Kuryer yo\'lda' : language === 'ru' ? 'Курьер в пути' : 'Courier in transit'}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
