import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Package, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';
import { useApp } from '../context/AppContext';

export function NotificationCenter() {
    const { t } = useApp();
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadNotifications();
            const interval = setInterval(loadNotifications, 30000); // Polling every 30s
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const loadNotifications = async () => {
        try {
            const [listRes, countRes] = await Promise.all([
                notificationApi.list(),
                notificationApi.unreadCount(),
            ]);
            setNotifications(listRes.data);
            setUnreadCount(countRes.data.count);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await notificationApi.markRead(id);
            loadNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            loadNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'order_status': return Package;
            case 'new_message': return MessageSquare;
            case 'alert': return AlertCircle;
            default: return Bell;
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'order_status': return 'text-indigo-400';
            case 'new_message': return 'text-emerald-400';
            case 'alert': return 'text-rose-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl bg-[var(--primary-glow)] hover:filter hover:brightness(120%) text-[var(--text-main)] border border-[var(--glass-border)] transition-all"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/20"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-80 sm:w-96 bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between bg-[var(--brand-primary-glow)]">
                                <h3 className="font-black text-[var(--brand-primary)] uppercase tracking-tight text-sm">{t('notifications')}</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={markAllRead}
                                        className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest px-2 py-1"
                                    >
                                        {t('markAllRead')}
                                    </button>
                                    <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-all">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <Bell className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t('noNotifications')}</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {notifications.map((notification) => {
                                            const Icon = getIcon(notification.notification_type);
                                            return (
                                                <div
                                                    key={notification.id}
                                                    className={`p-4 transition-all hover:bg-[var(--primary-glow)] flex gap-4 ${!notification.read ? 'bg-[var(--primary-glow)]' : ''}`}
                                                >
                                                    <div className={`p-2 rounded-xl bg-[var(--bg-main)] h-fit border border-[var(--glass-border)] ${getIconColor(notification.notification_type)}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h4 className={`text-xs font-black uppercase tracking-tight ${!notification.read ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                                                                {notification.title}
                                                            </h4>
                                                            {!notification.read && (
                                                                <button
                                                                    onClick={() => markAsRead(notification.id)}
                                                                    className="w-5 h-5 flex items-center justify-center rounded-full bg-[var(--primary-glow)] text-[var(--primary)] hover:brightness(120%) transition-all"
                                                                >
                                                                    <Check className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                            {notification.message}
                                                        </p>
                                                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest block pt-1">
                                                            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-3 bg-[var(--primary-glow)] border-t border-[var(--glass-border)] text-center">
                                    <button className="text-[10px] font-black text-[var(--text-dim)] hover:text-[var(--text-main)] uppercase tracking-widest transition-all">
                                        {t('viewAllNotifications')}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
