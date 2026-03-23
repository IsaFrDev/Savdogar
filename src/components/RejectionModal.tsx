import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';

export default function RejectionModal() {
    const { user, acknowledgeRejection } = useAuth();

    if (!user || user.role !== 'store_admin' || user.store_status !== 'rejected') {
        return null;
    }

    const handleAcknowledge = async () => {
        try {
            await acknowledgeRejection();
        } catch (error) {
            console.error('Failed to acknowledge rejection:', error);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-red-100 dark:border-red-900/30"
                >
                    <div className="p-8 text-center text-slate-900 dark:text-white">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold mb-3 tracking-tight">
                            Do'kon rad etildi
                        </h2>

                        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Afsuski, sizning do'kon ochish haqidagi arizangiz moderator tomonidan rad etildi.
                            Profilingiz oddiy foydalanuvchi darajasiga qaytariladi.
                        </p>

                        <Button
                            onClick={handleAcknowledge}
                            className="w-full bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                            size="lg"
                        >
                            Tushunarli
                        </Button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <AlertCircle className="w-3 h-3" />
                            <span>Ma'lumotlar xavfsizligi uchun shartnoma o'chirildi</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
