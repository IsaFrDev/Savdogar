import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Store,
    Users,
    CreditCard,
    Settings,
    Menu,
    X,
    DollarSign,
    ShieldCheck,
    LogOut,
    Clock,
    Search,
    Bell,
    TrendingUp,
    Check,
    CheckCircle,
    Loader2,
    ArrowUpRight,
    Fingerprint,
    Scan,
    Shield,
    Terminal as TerminalIcon,
    Eye,
    Trash2,
    Globe,
    Cpu,
    Briefcase,
    Zap,
    RefreshCw,
    Activity,
    Lock,
    EyeOff,
    FileText,
    MessageCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { storeApi, authApi, orderApi } from '../services/api';
import { GlassCard } from '../components/GlassCard';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AdminTerminal } from '../components/AdminTerminal';

interface SuperAdminDashboardProps {
    onLogout: () => void;
    onSwitchToUserView?: () => void;
    onManageStore?: (id: number) => void;
}

interface PendingStore {
    id: number;
    name: string;
    slug: string;
    owner_details: {
        email: string;
        first_name: string;
        last_name: string;
    };
    business_type: string;
    status: string;
    created_at: string;
    subscription_expiry: string | null;
    contract_signed: boolean;
    telegram_username?: string;
}

export function SuperAdminDashboard({ onLogout, onSwitchToUserView, onManageStore }: SuperAdminDashboardProps) {
    const { user, logout, registerFaceId, refreshUser } = useAuth();
    const { t, language, maintenanceMode, setMaintenanceMode, currency: defaultCurrency, setCurrency: setDefaultCurrency } = useApp();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'stores' | 'users' | 'payments' | 'settings' | 'audit'>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [pendingStores, setPendingStores] = useState<PendingStore[]>([]);
    const [allStores, setAllStores] = useState<PendingStore[]>([]);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [isFaceIdRegistering, setIsFaceIdRegistering] = useState(false);
    const [faceIdSuccess, setFaceIdSuccess] = useState(false);
    const [faceIdError, setFaceIdError] = useState('');
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [editingUser, setEditingUser] = useState<any | null>(null);

    const [multiStoreEnabled, setMultiStoreEnabled] = useState(true);
    const [apiKey, setApiKey] = useState('svd_live_xxxxxxxxxxxxxxxxxxxxxxxx');
    const [isRefreshingKey, setIsRefreshingKey] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                setIsTerminalOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [pendingRes, allRes, usersRes, ordersRes] = await Promise.all([
                storeApi.getPendingStores(),
                storeApi.list(),
                authApi.listUsers(),
                orderApi.list(),
            ]);
            setPendingStores(pendingRes.data.filter((s: any) => s.status === 'pending'));
            setAllStores(allRes.data.filter((s: any) => s.status !== 'rejected'));
            setAllUsers(usersRes.data);
            setAllOrders(ordersRes.data.sort((a: any, b: any) => (b.id || 0) - (a.id || 0)));
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm(language === 'uz' ? "Ushbu foydalanuvchini o'chirmoqchimisiz?" : language === 'ru' ? "Удалить этого пользователя?" : "Are you sure you want to delete this user?")) return;
        try {
            await authApi.deleteUser(id);
            setAllUsers(prev => prev.filter(u => u.id !== id));
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert(language === 'uz' ? "Xatolik yuz berdi" : "Произошла ошибка");
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setActionLoading(editingUser.id);
        try {
            const res = await authApi.updateUser(editingUser.id, editingUser);
            setAllUsers(prev => prev.map(u => u.id === editingUser.id ? res.data : u));
            setEditingUser(null);
            alert(language === 'uz' ? "Muvaffaqiyatli saqlandi" : "Успешно сохранено");
        } catch (error) {
            console.error('Failed to update user:', error);
            alert(language === 'uz' ? "Xatolik yuz berdi" : "Произошла ошибка");
        }
        setActionLoading(null);
    };

    const handleApprove = async (storeId: number) => {
        setActionLoading(storeId);
        try {
            await storeApi.approveStore(storeId);
            await loadData();
        } catch (error) {
            console.error('Failed to approve store:', error);
        }
        setActionLoading(null);
    };

    const handleReject = async (storeId: number) => {
        const reason = prompt(
            language === 'uz' ? "Rad etish sababini kiriting:" :
                language === 'ru' ? "Введите причину отклонения:" :
                    "Enter rejection reason:"
        );

        if (reason === null) return;

        setActionLoading(storeId);
        try {
            await storeApi.rejectStore(storeId, reason);
            await loadData();
        } catch (error) {
            console.error('Failed to reject store:', error);
        }
        setActionLoading(null);
    };

    const handleDownloadContract = async (storeId: number, slug: string) => {
        try {
            const response = await storeApi.downloadContract(storeId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `contract_${slug}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Contract download failed:', error);
        }
    };

    const handleDeleteStore = async (id: number, name: string) => {
        const confirmMsg = language === 'uz'
            ? `"${name}" do'konini butunlay o'chirmoqchimisiz? Ushbu amalni qaytarib bo'lmaydi!`
            : language === 'ru'
                ? `Вы уверены, что хотите навсегда удалить магазин "${name}"? Это действие нельзя отменить!`
                : `Are you sure you want to permanently delete store "${name}"? This action cannot be undone!`;

        if (!confirm(confirmMsg)) return;

        setActionLoading(id);
        try {
            await storeApi.delete(id);
            setAllStores(prev => prev.filter(s => s.id !== id));
            setPendingStores(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete store:', error);
            alert(language === 'uz' ? "Xatolik yuz berdi" : "Произошла ошибка");
        }
        setActionLoading(null);
    };

    const menuItems = [
        { id: 'dashboard', label: t('adminDashboard'), icon: LayoutDashboard },
        { id: 'pending', label: t('pendingStores'), icon: Clock, badge: pendingStores.length },
        { id: 'stores', label: t('allStores'), icon: Store },
        { id: 'users', label: t('users'), icon: Users },
        { id: 'payments', label: t('payments'), icon: CreditCard },
        { id: 'settings', label: t('settings'), icon: Settings },
        { id: 'terminal', label: language === 'uz' ? 'Terminal' : language === 'ru' ? 'Терминал' : 'Terminal', icon: TerminalIcon },
        { id: 'userView', label: language === 'uz' ? "User ko'rinishi" : language === 'ru' ? 'Вид пользователя' : 'User View', icon: Eye },
    ];

    const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.total) || Number(o.total_amount) || 0), 0);

    const stats = [
        { label: t('totalStores'), value: allStores.length.toString(), change: '+0%', icon: Store, gradient: 'from-violet-600 via-indigo-600 to-blue-600', glow: 'shadow-indigo-500/20' },
        { label: t('pendingStores'), value: pendingStores.length.toString(), change: t('approvalPending'), icon: Clock, gradient: 'from-amber-600 via-orange-600 to-rose-600', glow: 'shadow-orange-500/20' },
        { label: language === 'uz' ? 'Jami Savdo' : 'Общая Продажа', value: totalRevenue.toLocaleString() + ' UZS', change: '+0%', icon: DollarSign, gradient: 'from-emerald-600 via-teal-600 to-cyan-600', glow: 'shadow-teal-500/20' },
        { label: t('totalUsers'), value: allUsers.length.toString(), change: '+0%', icon: Users, gradient: 'from-fuchsia-600 via-purple-600 to-indigo-600', glow: 'shadow-purple-500/20' },
    ];

    const handleLogoutAction = () => {
        logout();
        onLogout();
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-amber-500/5 text-amber-500 border-amber-500/10',
            approved: 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10',
            rejected: 'bg-rose-500/5 text-rose-400 border-rose-500/10',
            expired: 'bg-slate-500/10 text-slate-400 border-slate-500/10',
        };

        const labels: Record<string, Record<string, string>> = {
            pending: { uz: 'Kutilmoqda', ru: 'Ожидает', en: 'Pending' },
            approved: { uz: 'Tasdiqlangan', ru: 'Одобрен', en: 'Approved' },
            rejected: { uz: 'Rad etilgan', ru: 'Отклонён', en: 'Rejected' },
            expired: { uz: 'Muddati o\'tgan', ru: 'Истек', en: 'Expired' },
        };

        return (
            <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${styles[status]}`}>
                {labels[status]?.[language] || status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[var(--brand-primary)]/30 transition-colors duration-300">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isSidebarOpen ? 280 : 80,
                    x: typeof window !== 'undefined' && window.innerWidth < 1024 ? (isSidebarOpen ? 0 : -280) : 0
                }}
                className="fixed left-0 top-0 h-full bg-[var(--bg-sidebar)] backdrop-blur-xl border-r border-[var(--glass-border)] z-50 overflow-hidden flex flex-col shadow-2xl shadow-black/50 lg:translate-x-0"
            >
                <div className="p-6 flex items-center gap-4 border-b border-white/5 h-20 bg-white/[0.02]">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className="flex items-center gap-3 hover:opacity-80 transition-all outline-none"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/40 flex-shrink-0 p-[2px]">
                            <div className="w-full h-full rounded-[9px] bg-slate-900 flex items-center justify-center p-1.5 overflow-hidden">
                                <img src="/savdoon-logo.jpg" alt="Savdoon" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        {isSidebarOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col"
                            >
                                <span className="text-sm font-black tracking-[0.2em] text-white leading-none">SAVDOON</span>
                                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.1em] mt-1">SuperAdmin</span>
                            </motion.div>
                        )}
                    </button>
                    {/* Close button for mobile sidebar */}
                    {isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden ml-auto p-2 text-slate-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'terminal') {
                                    setIsTerminalOpen(true);
                                } else if (item.id === 'userView') {
                                    onSwitchToUserView?.();
                                } else {
                                    setActiveTab(item.id as any);
                                }
                                if (window.innerWidth < 1024) setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative group ${activeTab === item.id
                                ? 'text-white bg-indigo-500/10 border border-indigo-500/20 shadow-xl shadow-indigo-500/5'
                                : 'text-slate-400 hover:text-indigo-400 hover:bg-white/[0.03]'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${activeTab === item.id ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`} />
                            {isSidebarOpen && (
                                <div className="flex-1 flex items-center justify-between text-left">
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-[13px] tracking-wide">
                                        {item.label}
                                    </motion.span>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="bg-rose-500/20 text-rose-400 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-rose-500/20">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            )}
                            {activeTab === item.id && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogoutAction}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        {isSidebarOpen && <span className="font-bold text-sm uppercase tracking-widest">{t('logout')}</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main
                className={`transition-all duration-300 min-h-screen ${isSidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-[80px]'
                    }`}
            >
                {/* Top Header */}
                <header className="h-20 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--glass-border)] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-4 lg:gap-6">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-slate-400 hover:text-white transition-all border border-[var(--glass-border)]"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className="flex items-center gap-3 lg:hidden hover:opacity-80 transition-opacity active:scale-95"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center shadow-lg shadow-[var(--brand-primary-glow)]">
                                <ShieldCheck className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-black text-sm tracking-tighter text-[var(--text-primary)]">SAVDOON</span>
                        </button>
                        <div className="hidden sm:flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-2.5 rounded-2xl focus-within:border-indigo-500/50 transition-all shadow-inner">
                            <Search className="w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder={t('search')}
                                className="bg-transparent border-none focus:ring-0 text-[13px] text-slate-200 placeholder:text-slate-500 w-32 md:w-64 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-5 relative">
                        <div className="flex items-center p-1 bg-white/[0.03] border border-white/5 rounded-xl">
                            <LanguageSwitcher />
                        </div>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-white transition-all border border-white/5 relative shadow-sm"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-900" />
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 top-full mt-3 w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
                                            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">{t('notifications')}</span>
                                            <span className="text-[10px] text-[var(--brand-primary)] font-bold uppercase tracking-widest">1 New</span>
                                        </div>
                                        <div className="p-2">
                                            <div className="p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer">
                                                <div className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary-glow)] flex items-center justify-center text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)]/20 transition-all flex-shrink-0">
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-[var(--text-primary)] leading-normal">System Update</p>
                                                        <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">System status labels internationalization completed.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-[var(--bg-surface-hover)] border-t border-[var(--glass-border)] text-center cursor-pointer hover:brightness-110 transition-all">
                                            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('markAllAsRead')}</span>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

                        <div className="h-10 w-[1px] bg-white/5 mx-2 lg:mx-3" />
                        <div className="flex items-center gap-3 lg:gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-[13px] font-black text-white leading-none mb-1.5">{user?.first_name || 'Admin'}</p>
                                <div className="flex items-center justify-end gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.15em] leading-none">{t('superAdmin')}</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-[1px] border border-white/10">
                                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center font-black text-white text-xs lg:text-sm">
                                    {user?.first_name?.charAt(0) || 'S'}{user?.last_name?.charAt(0) || 'A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Content */}
                <div className="p-4 lg:p-8">
                    <div className="mb-10 flex flex-col items-start">
                        <div className="flex items-center gap-3 mb-2 px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                            <p className="text-indigo-400 uppercase tracking-[0.25em] text-[9px] font-black leading-none">{t('enterprisePanel')}</p>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                            {activeTab === 'dashboard' ? t('systemAnalytics') :
                                activeTab === 'pending' ? t('pendingStores') : t('adminDashboard')}
                        </h1>
                    </div>

                    {activeTab === 'dashboard' && (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-10">
                                {stats.map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1, duration: 0.8, ease: [0.21, 1.02, 0.47, 0.98] }}
                                    >
                                        <GlassCard className="p-7 lg:p-9 border-white/5 hover:border-white/10 transition-all duration-500 group relative overflow-hidden bg-white/[0.01]">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
                                            <div className="flex justify-between items-start mb-8">
                                                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} ${stat.glow} group-hover:scale-110 transition-transform duration-500 flex items-center justify-center p-[2px]`}>
                                                    <div className="w-full h-full rounded-[14px] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2.5">
                                                        <stat.icon className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest border border-emerald-500/20">
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    {stat.change}
                                                </div>
                                            </div>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em] mb-2 px-1">{stat.label}</p>
                                            <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight px-1">{stat.value}</h3>
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <GlassCard className="lg:col-span-2 p-8 lg:p-10 border-white/5 bg-white/[0.01]">
                                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                                        <div>
                                            <h3 className="text-xl lg:text-2xl font-black text-white tracking-tight">{t('recentStores')}</h3>
                                            <p className="text-[10px] lg:text-[11px] text-slate-500 uppercase tracking-[0.2em] font-black mt-2 italic">{t('approvalPending')}</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('pending')}
                                            className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20"
                                        >
                                            {t('viewAll')}
                                        </button>
                                    </div>

                                    <div className="space-y-5">
                                        {pendingStores.slice(0, 5).map((store) => (
                                            <div key={store.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all duration-500 group">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center font-black text-indigo-400 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-500">
                                                        {store.name.charAt(0)}
                                                    </div>
                                                    <div 
                                                        onClick={() => onManageStore?.(store.id)}
                                                        className="cursor-pointer group/name"
                                                    >
                                                        <p className="text-base font-black text-white tracking-tight group-hover/name:text-indigo-400 transition-colors uppercase">{store.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{store.business_type}</p>
                                                            {store.subscription_expiry && (
                                                                <>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                                    <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest leading-none">
                                                                        {new Date(store.subscription_expiry).toLocaleDateString()}
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="px-4 py-1.5 rounded-xl bg-amber-500/5 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] border border-amber-500/10">
                                                        {t('pending')}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleApprove(store.id)}
                                                            disabled={actionLoading === store.id}
                                                            className="p-3 rounded-xl bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/10 active:scale-90"
                                                        >
                                                            {actionLoading === store.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                                        </button>
                                                        {onManageStore && (
                                                            <button
                                                                onClick={() => onManageStore(store.id)}
                                                                className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5 transition-all shadow-sm"
                                                                title="Manage Store"
                                                            >
                                                                 <Briefcase className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {pendingStores.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                                                <div className="relative mb-6">
                                                    <CheckCircle className="w-16 h-16 opacity-10" />
                                                    <div className="absolute inset-0 bg-indigo-500/10 blur-[40px] rounded-full animate-pulse" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">{t('noNewStores')}</p>
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-8 lg:p-10 border-white/5 bg-white/[0.01] flex flex-col justify-center items-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                                    <div className="text-center p-8 relative">
                                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
                                            <ShieldCheck className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-[0.25em] mb-3">System Secure</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto">
                                            Savdoon Enterprise Protection Active.<br /> All systems operational.
                                        </p>
                                    </div>
                                </GlassCard>
                            </div>
                        </>
                    )}

                    {(activeTab === 'pending' || activeTab === 'stores') && (
                        <GlassCard className="p-0 border-white/5 overflow-hidden bg-white/[0.01]">
                            <div className="p-8 lg:p-10 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between bg-white/[0.02] gap-6">
                                <div>
                                    <h3 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                                        {activeTab === 'pending' ? t('pendingStores') : t('allStores')}
                                    </h3>
                                    <p className="text-[10px] lg:text-[11px] text-slate-500 uppercase tracking-[0.2em] font-black mt-2">
                                        {t('total')}: <span className="text-indigo-400">{(activeTab === 'pending' ? pendingStores : allStores).length}</span>
                                    </p>
                                </div>
                                <div className="flex gap-3 self-end sm:self-auto">
                                    <button onClick={loadData} className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-indigo-500 text-white transition-all border border-white/5 shadow-xl hover:shadow-indigo-500/20">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('storeName')}</th>
                                            <th className="hidden md:table-cell py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('storeOwner')}</th>
                                            <th className="hidden md:table-cell py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Contact</th>
                                            <th className="hidden sm:table-cell py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('businessType')}</th>
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('status')}</th>
                                            <th className="hidden xl:table-cell py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('subscriptionExpiry') || 'Subscription'}</th>
                                            <th className="hidden lg:table-cell py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('date')}</th>
                                            <th className="py-7 px-8 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {(activeTab === 'pending' ? pendingStores : allStores).map((store) => (
                                            <tr key={store.id} className="hover:bg-white/[0.02] transition-all duration-500 group">
                                                <td className="py-7 px-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 border border-white/5 flex items-center justify-center font-black text-indigo-400 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-500">
                                                            {store.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div 
                                                            onClick={() => onManageStore?.(store.id)}
                                                            className="min-w-0 cursor-pointer group/name"
                                                        >
                                                            <p className="text-[15px] font-black text-white truncate tracking-tight group-hover/name:text-indigo-400 transition-colors uppercase">{store.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-black lowercase tracking-wider truncate mt-1">{store.slug}.savdoon.uz</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell py-7 px-8">
                                                    <div>
                                                        <p className="text-sm font-black text-slate-200">{store.owner_details?.first_name} {store.owner_details?.last_name}</p>
                                                        <p className="text-[10px] text-slate-500 font-black mt-1 uppercase tracking-widest">{store.owner_details?.email}</p>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell py-7 px-6 lg:px-8 text-sm font-black text-[var(--text-primary)]">
                                                    <div className="flex flex-col gap-1">
                                                        {store.telegram_username ? (
                                                            <a
                                                                href={`https://t.me/${store.telegram_username.replace('@', '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[11px] font-black text-[var(--brand-primary)] hover:underline uppercase tracking-widest flex items-center gap-1.5"
                                                            >
                                                                <MessageCircle className="w-3.5 h-3.5" />
                                                                {store.telegram_username}
                                                            </a>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-500 italic">No Username</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell py-7 px-6 lg:px-8">
                                                    <span className="text-[10px] font-black text-[var(--brand-primary)]/80 tracking-[0.15em] uppercase px-3 py-1.5 rounded-lg bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10">
                                                        {t(store.business_type) || store.business_type}
                                                    </span>
                                                </td>
                                                <td className="py-7 px-6 lg:px-8">{getStatusBadge(store.status)}</td>
                                                <td className="hidden xl:table-cell py-7 px-6 lg:px-8">
                                                    {store.subscription_expiry ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-[var(--brand-primary)] uppercase tracking-widest">{new Date(store.subscription_expiry).toLocaleDateString()}</span>
                                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">30 Days Cycle</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-600 italic">No Active Plan</span>
                                                    )}
                                                </td>
                                                <td className="hidden lg:table-cell py-7 px-6 lg:px-8">
                                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{new Date(store.created_at).toLocaleDateString()}</p>
                                                </td>
                                                <td className="py-7 px-8">
                                                    <div className="flex items-center justify-end gap-3 transition-all duration-300">
                                                        {store.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(store.id)}
                                                                    disabled={actionLoading === store.id}
                                                                    className="p-3 rounded-2xl bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/10 transition-all shadow-sm hover:shadow-emerald-500/10"
                                                                    title={t('approve')}
                                                                >
                                                                    {actionLoading === store.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(store.id)}
                                                                    disabled={actionLoading === store.id}
                                                                    className="p-3 rounded-2xl bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-500/10 transition-all shadow-sm hover:shadow-amber-500/10"
                                                                    title={t('reject')}
                                                                >
                                                                    <X className="w-5 h-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => window.open(`http://${store.slug}.savdoon.uz`, '_blank')}
                                                            className="p-3 rounded-2xl bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/10 shadow-sm hover:shadow-indigo-500/10"
                                                            title={t('viewStorefront')}
                                                        >
                                                            <ArrowUpRight className="w-5 h-5" />
                                                        </button>
                                                        {onManageStore && (
                                                            <button
                                                                onClick={() => onManageStore(store.id)}
                                                                className="p-3 rounded-2xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5 transition-all shadow-sm"
                                                                title="Manage Store"
                                                            >
                                                                <Briefcase className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        {store.contract_signed && (
                                                            <button
                                                                onClick={() => handleDownloadContract(store.id, store.slug)}
                                                                className="p-3 rounded-2xl bg-indigo-500/5 text-indigo-500 hover:bg-indigo-500 hover:text-white border border-indigo-500/10 transition-all shadow-sm"
                                                                title={language === 'uz' ? 'Shartnomani yuklab olish' : language === 'ru' ? 'Скачать договор' : 'Download Contract'}
                                                            >
                                                                <FileText className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteStore(store.id, store.name)}
                                                            disabled={actionLoading === store.id}
                                                            className="p-3 rounded-2xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/10 transition-all shadow-sm hover:shadow-rose-500/10"
                                                            title={language === 'uz' ? "Do'konni o'chirish" : language === 'ru' ? 'Удалить магазин' : 'Delete Store'}
                                                        >
                                                            {actionLoading === store.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(activeTab === 'pending' ? pendingStores : allStores).length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-32 text-center">
                                                    <div className="flex flex-col items-center justify-center text-slate-600">
                                                        <div className="relative mb-8">
                                                            <Store className="w-20 h-20 opacity-10" />
                                                            <div className="absolute inset-0 bg-[var(--brand-primary)]/5 blur-3xl rounded-full" />
                                                        </div>
                                                        <p className="text-xs font-black uppercase tracking-[0.4em] italic">{t('noOrdersFound')}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard >
                    )
                    }

                    {activeTab === 'users' && (
                        <GlassCard className="p-0 border-white/5 overflow-hidden bg-white/[0.01]">
                            <div className="p-8 lg:p-10 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between bg-white/[0.02] gap-6">
                                <div>
                                    <h3 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                                        {language === 'uz' ? 'Barcha Foydalanuvchilar' : language === 'ru' ? 'Все Пользователи' : 'All Users'}
                                    </h3>
                                    <p className="text-[10px] lg:text-[11px] text-slate-500 uppercase tracking-[0.2em] font-black mt-2 italic">
                                        {t('total')}: <span className="text-indigo-400">{allUsers.length}</span>
                                    </p>
                                </div>
                                <button onClick={loadData} className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-indigo-500 text-white transition-all border border-white/5 shadow-xl hover:shadow-indigo-500/20 self-end sm:self-auto">
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">ID</th>
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('name')}</th>
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('email')}</th>
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Login / Access</th>
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Role</th>
                                            <th className="py-7 px-8 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {allUsers.map((u: any) => (
                                            <tr key={u.id} className="hover:bg-white/[0.02] transition-all duration-500 group">
                                                <td className="py-7 px-8 text-xs font-black text-slate-600 group-hover:text-indigo-400 transition-colors">#{u.id}</td>
                                                <td className="py-7 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center font-black text-indigo-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all">
                                                            {(u.first_name || u.email || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <p className="text-sm font-black text-white truncate uppercase tracking-tight">{u.first_name} {u.last_name}</p>
                                                    </div>
                                                </td>
                                                <td className="py-7 px-8 text-sm font-bold text-slate-400">{u.email}</td>
                                                <td className="py-7 px-8">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">@{u.username}</span>
                                                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider italic">
                                                            {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'Active Member'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-7 px-8">
                                                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${u.is_superuser ? 'bg-indigo-500/5 text-indigo-400 border-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.1)]' :
                                                        u.is_staff ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' :
                                                            'bg-slate-500/5 text-slate-400 border-slate-500/10'
                                                        }`}>
                                                        {u.is_superuser ? 'SuperAdmin' : u.is_staff ? 'Staff' : 'User'}
                                                    </span>
                                                </td>
                                                <td className="py-7 px-8 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingUser(u);
                                                                setUserEditForm({ 
                                                                    role: u.is_superuser ? 'superadmin' : u.is_staff ? 'staff' : 'user', 
                                                                    phone_number: u.phone_number || '', 
                                                                    first_name: u.first_name || '', 
                                                                    last_name: u.last_name || '' 
                                                                });
                                                            }}
                                                            className="p-3 rounded-2xl bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/10 transition-all shadow-sm"
                                                        >
                                                            <Edit2 className="w-5 h-5" />
                                                        </button>
                                                        {u.id !== user?.id && (
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id, u.username)}
                                                                className="p-3 rounded-2xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/10 transition-all shadow-sm"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    )}

                    {activeTab === 'payments' && (
                        <GlassCard className="p-0 border-white/5 overflow-hidden bg-white/[0.01]">
                            <div className="p-8 lg:p-10 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                                        {language === 'uz' ? 'Barcha Buyurtmalar' : language === 'ru' ? 'Все Заказы' : 'All Orders'}
                                    </h3>
                                    <p className="text-[10px] lg:text-[11px] text-slate-500 uppercase tracking-[0.2em] font-black mt-2">
                                        {t('total')}: <span className="text-indigo-400">{allOrders.length}</span>
                                    </p>
                                </div>
                                <button onClick={loadData} className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-indigo-500 text-white transition-all border border-white/5 shadow-xl hover:shadow-indigo-500/20 self-end sm:self-auto">
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('orderId')}</th>
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('customer')}</th>
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('storeName')}</th>
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('total')}</th>
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('status')}</th>
                                            <th className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('date')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {allOrders.map((order: any) => (
                                            <tr key={order.id} className="hover:bg-white/[0.02] transition-all duration-500 group">
                                                <td className="py-7 px-8 text-sm font-black text-indigo-400 group-hover:scale-105 transition-transform">#{order.id}</td>
                                                <td className="py-7 px-8">
                                                    <div>
                                                        <p className="text-sm font-black text-white uppercase tracking-tight">{order.customer_name}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold mt-1">{order.customer_phone}</p>
                                                    </div>
                                                </td>
                                                <td className="py-7 px-8 text-sm font-bold text-slate-400 uppercase tracking-tight">{order.store_name || `Store #${order.store}`}</td>
                                                <td className="py-7 px-8 text-[15px] font-black text-emerald-400 tracking-tighter">
                                                    {Number(order.total || order.total_amount || 0).toLocaleString()} <span className="text-[10px] text-emerald-500/60 ml-0.5">UZS</span>
                                                </td>
                                                <td className="py-7 px-8">
                                                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${order.status === 'completed' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' :
                                                        order.status === 'pending' ? 'bg-amber-500/5 text-amber-500 border-amber-500/10' :
                                                            order.status === 'cancelled' ? 'bg-rose-500/5 text-rose-400 border-rose-500/10' :
                                                                'bg-indigo-500/5 text-indigo-400 border-indigo-500/10'
                                                        }`}>
                                                        {t(order.status) || order.status}
                                                    </span>
                                                </td>
                                                <td className="py-7 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">
                                                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    )}

                    {
                        activeTab === 'audit' && (
                            <GlassCard className="p-0 border-white/5 overflow-hidden bg-white/[0.01]">
                                <div className="p-8 lg:p-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl lg:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                                            {language === 'uz' ? 'Tizim Audit Loglari' : language === 'ru' ? 'Логи Аудита Системы' : 'System Audit Logs'}
                                        </h3>
                                        <p className="text-[10px] lg:text-[11px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-black mt-2">
                                            Ultimate Security Suite - Forensic Trail
                                        </p>
                                    </div>
                                    <button onClick={() => loadData()} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/10">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-12 text-center">
                                    <p className="text-xs text-[var(--text-muted)] italic font-bold uppercase tracking-widest">System logs are archived</p>
                                </div>
                            </GlassCard>
                        )
                    }

                    {activeTab === 'settings' && (
                        <div className="max-w-6xl mx-auto space-y-8 pb-32">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* System Configuration */}
                                <GlassCard className="lg:col-span-2 p-8 lg:p-10 border-white/5 bg-white/[0.01] relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -ml-32 -mt-32" />

                                    <div className="flex items-center justify-between mb-10 relative">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                                <Cpu className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white tracking-tight">{language === 'uz' ? 'Tizim Konfiguratsiyasi' : 'Конфигурация Системы'}</h3>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 opacity-60">Global Settings & API</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">System Online</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                        {/* Maintenance Mode */}
                                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all group/item">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                                        <Zap className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-black text-white uppercase tracking-tight">Maintenance</span>
                                                </div>
                                                <button
                                                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${maintenanceMode ? 'bg-amber-500' : 'bg-slate-800'}`}
                                                >
                                                    <motion.div
                                                        animate={{ x: maintenanceMode ? 26 : 4 }}
                                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                                                    />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
                                                {language === 'uz' ? "Barcha foydalanuvchilar uchun tizimni vaqtincha yopish." : "Temporary disable system access for all users."}
                                            </p>
                                        </div>

                                        {/* Multi-Store Mode */}
                                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                                        <Globe className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-black text-white uppercase tracking-tight">Multi-Store Platform</span>
                                                </div>
                                                <button
                                                    onClick={() => setMultiStoreEnabled(!multiStoreEnabled)}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${multiStoreEnabled ? 'bg-indigo-500' : 'bg-slate-800'}`}
                                                >
                                                    <motion.div
                                                        animate={{ x: multiStoreEnabled ? 26 : 4 }}
                                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                                                    />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
                                                {language === 'uz' ? "Bir nechta do'konlar yaratishni boshqarish." : "Toggle ability to create multiple stores."}
                                            </p>
                                        </div>

                                        {/* Default Currency */}
                                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                                        <DollarSign className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-black text-white uppercase tracking-tight">Default Currency</span>
                                                </div>
                                                <select
                                                    value={defaultCurrency}
                                                    onChange={(e) => setDefaultCurrency(e.target.value)}
                                                    className="bg-slate-900 border border-white/5 text-indigo-400 text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer rounded-lg px-2 py-1"
                                                >
                                                    <option value="UZS">UZS</option>
                                                    <option value="USD">USD</option>
                                                    <option value="RUB">RUB</option>
                                                </select>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
                                                {language === 'uz' ? "Tizim uchun asosiy valyutani tanlash." : "Select the base system currency."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* API Keys Section */}
                                    <div className="mt-10 pt-10 border-t border-white/5">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">API Configuration</h4>
                                        <div className="space-y-4">
                                            <div className="p-7 rounded-[2rem] bg-indigo-500/[0.02] border border-white/5 relative overflow-hidden group/key">
                                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.03] to-transparent pointer-events-none" />
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master API Key</span>
                                                    <button
                                                        onClick={() => {
                                                            setIsRefreshingKey(true);
                                                            const newKey = 'svd_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                                                            setTimeout(() => {
                                                                setApiKey(newKey);
                                                                setIsRefreshingKey(false);
                                                            }, 1000);
                                                        }}
                                                        className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <RefreshCw className={`w-3 h-3 ${isRefreshingKey ? 'animate-spin' : ''}`} />
                                                        Rotate Key
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <code className="flex-1 bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-indigo-400 font-mono text-[13px] tracking-widest truncate">
                                                        {showKey ? apiKey : '••••••••••••••••••••••••••••••••'}
                                                    </code>
                                                    <button
                                                        onClick={() => setShowKey(!showKey)}
                                                        className="p-4 bg-slate-900 border border-white/5 rounded-2xl hover:bg-slate-800 transition-all text-slate-400"
                                                    >
                                                        {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>

                                    {/* Security Panel */}
                                    <div className="space-y-8">
                                        <GlassCard className="p-8 lg:p-10 border-white/5 bg-white/[0.01] overflow-hidden relative group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)]/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-[var(--brand-primary)]/10 transition-colors" />

                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="p-3 rounded-xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)]">
                                                    <Shield className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                                                    {language === 'uz' ? "Xavfsizlik" : "Security"}
                                                </h3>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--glass-border)]">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Fingerprint className="w-5 h-5 text-indigo-400" />
                                                            <span className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">Face ID</span>
                                                        </div>
                                                        {user?.face_id_registered ? (
                                                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-black uppercase border border-emerald-500/20">Active</span>
                                                        ) : (
                                                            <span className="px-2 py-1 bg-[var(--bg-surface-hover)] text-[var(--text-muted)] rounded text-[9px] font-black uppercase border border-[var(--glass-border)]">Inactive</span>
                                                        )}
                                                    </div>

                                                    <p className="text-[var(--text-muted)] text-[11px] font-bold leading-relaxed mb-6">
                                                        {language === 'uz' ? "Biometrik login xavfsizlik va tezlikni bir vaqtda ta'minlaydi." : "Biometric login provides both security and speed."}
                                                    </p>

                                                    <AnimatePresence>
                                                        {faceIdError && (
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-2 overflow-hidden">
                                                                <X className="w-3.5 h-3.5" />
                                                                {faceIdError}
                                                            </motion.div>
                                                        )}
                                                        {faceIdSuccess && (
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-2 overflow-hidden">
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                Success!
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <button
                                                        onClick={async () => {
                                                            setFaceIdError('');
                                                            setFaceIdSuccess(false);
                                                            setIsFaceIdRegistering(true);
                                                            try {
                                                                await registerFaceId();
                                                                await refreshUser();
                                                                setFaceIdSuccess(true);
                                                            } catch (err: any) {
                                                                setFaceIdError(err.message || 'Face ID registration failed');
                                                            } finally {
                                                                setIsFaceIdRegistering(false);
                                                            }
                                                        }}
                                                        disabled={isFaceIdRegistering}
                                                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 ${isFaceIdRegistering
                                                            ? 'bg-white/5 text-slate-500'
                                                            : 'bg-[var(--brand-primary)] hover:brightness-110 text-[var(--primary-foreground)] shadow-xl shadow-[var(--brand-primary-glow)] active:scale-95'
                                                            }`}
                                                    >
                                                        {isFaceIdRegistering ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Scan className="w-4 h-4" />
                                                                {user?.face_id_registered ? (language === 'uz' ? "Yangilash" : "Update") : (language === 'uz' ? "O'rnatish" : "Setup")}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--glass-border)] flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Lock className="w-4 h-4 text-[var(--brand-secondary)]" />
                                                        <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest leading-none">Two-Factor Auth</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Coming Soon</span>
                                                </div>

                                                <div className="pt-4 border-t border-[var(--glass-border)] flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                                    <span className="text-[var(--text-muted)]">WebAuthn Status</span>
                                                    <span className={window.PublicKeyCredential ? "text-emerald-400" : "text-rose-400"}>
                                                        {window.PublicKeyCredential ? 'Supported' : 'Unsupported'}
                                                    </span>
                                                </div>
                                            </div>
                                        </GlassCard>

                                        {/* System Health / Logs */}
                                        <GlassCard className="p-8 border-[var(--glass-border)] bg-[var(--card-bg)]">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Activity className="w-5 h-5 text-[var(--brand-primary)]" />
                                                <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">System Logs</h4>
                                            </div>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'DB Connections', value: '12 Active', status: 'optimal' },
                                                    { label: 'Cache Hits', value: '98.2%', status: 'high' }
                                                ].map((log, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--glass-border)]">
                                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{log.label}</span>
                                                        <span className="text-[10px] font-black text-[var(--text-primary)]">{log.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </GlassCard>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>
            </main>

            <AnimatePresence>
                {editingUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            transition={{ duration: 0.4, ease: [0.21, 1.02, 0.47, 0.98] }}
                            className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                                        {language === 'uz' ? 'Profilni Tahrirlash' : 'Edit User Profile'}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                        <User className="w-3 h-3 text-indigo-400" />
                                        User ID: #{editingUser.id}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5 shadow-inner"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateUser} className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">First Name</label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={editingUser.first_name || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                                                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:text-slate-700 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Last Name</label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={editingUser.last_name || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                                                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:text-slate-700 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={editingUser.email || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-bold shadow-inner"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">New Password <span className="text-[9px] text-slate-600 normal-case">(optional)</span></label>
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            placeholder="••••••••••••"
                                            onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:text-slate-700 shadow-inner"
                                        />
                                        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-500/50 transition-colors" />
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading === 'editing'}
                                        className="flex-[2] py-4 rounded-2xl bg-indigo-500 hover:brightness-110 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {actionLoading === 'editing' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Confirm Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isTerminalOpen && (
                    <AdminTerminal onClose={() => setIsTerminalOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}