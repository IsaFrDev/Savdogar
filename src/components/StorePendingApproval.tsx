/**
 * Store Pending Approval Component
 * Do'kon tasdiqlanishini kutayotgan sahifa
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface StorePendingApprovalProps {
    storeName: string;
    storeStatus: 'pending' | 'rejected';
    rejectionReason?: string;
    onRetry?: () => void;
}

export function StorePendingApproval({ storeName, storeStatus, rejectionReason, onRetry }: StorePendingApprovalProps) {
    const { t } = useApp();
    const [timeElapsed, setTimeElapsed] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (storeStatus === 'rejected') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/5 blur-[120px] rounded-full" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl w-full text-center relative z-10"
                >
                    <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <XCircle className="w-12 h-12 text-red-500" />
                    </div>

                    <h1 className="text-4xl font-black text-white mb-6 tracking-tighter uppercase">
                        {storeName}
                    </h1>

                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold mb-8">
                        <AlertCircle className="w-5 h-5" />
                        {t('storeRejectedTitle')}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
                        <h3 className="text-white font-bold mb-3">{t('rejectionReasonLabel')}</h3>
                        <p className="text-slate-300 text-lg leading-relaxed">
                            {rejectionReason || t('reasonNotSpecified')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={onRetry}
                            className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold uppercase tracking-wider transition-all"
                        >
                            {t('retry')}
                        </button>

                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="w-full py-4 px-8 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider transition-all"
                        >
                            {t('backToDashboard')}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Pending status
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full text-center relative z-10"
            >
                <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                    <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
                </div>

                <h1 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter">
                    {storeName}
                </h1>

                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-bold mb-8">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    {t('pendingApprovalTitle')}
                </div>

                <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10">
                    {t('pendingApprovalMsg')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <Clock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-white mb-1">{formatTime(timeElapsed)}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{t('waitingTime')}</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <AlertCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-white mb-1">{t('twentyFourHours')}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{t('estimatedTime')}</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-white mb-1">{t('soon')}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{t('confirmed')}</p>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-8">
                    <h3 className="text-white font-bold mb-3">{t('nextSteps')}</h3>
                    <ul className="text-left text-slate-300 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-amber-500 mt-1">✓</span>
                            <span>{t('adminReview')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-amber-500 mt-1">✓</span>
                            <span>{t('notificationOnApproval')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-amber-500 mt-1">✓</span>
                            <span>{t('storeWillLaunch')}</span>
                        </li>
                    </ul>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="py-4 px-8 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider transition-all"
                >
                    {t('updateStatus')}
                </button>
            </motion.div>
        </div>
    );
}
