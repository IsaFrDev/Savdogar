import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';
import { Input } from '../components/Input';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

interface AdminLoginProps {
    onLogin: () => void;
    onBack: () => void;
}

export function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
    const { language } = useApp();
    const { loginAsSuperAdmin } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await loginAsSuperAdmin(username, password);
            onLogin();
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                (language === 'uz' ? "Noto'g'ri admin ma'lumotlari" :
                    language === 'ru' ? "Неверные данные админа" :
                        "Invalid admin credentials")
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4 selection:bg-[var(--brand-primary)]/30 overflow-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--brand-primary)]/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--brand-secondary)]/10 blur-[120px] rounded-full" />
                <div className="absolute top-[30%] left-[50%] w-[20%] h-[20%] bg-[var(--brand-primary)]/5 blur-[80px] rounded-full" />
            </div>

            <div className="absolute top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>

            <GlassCard className="w-full max-w-md p-6 sm:p-8 lg:p-10 border-[var(--glass-border)] bg-[var(--color-surface)] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden group mx-4 sm:mx-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--brand-primary)]/40 to-transparent" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-[var(--brand-primary)] shadow-2xl shadow-[var(--brand-primary-glow)] mb-6 group-hover:scale-110 transition-transform duration-500 ring-4 ring-white/5">
                        <Shield className="w-10 h-10 text-[var(--primary-foreground)]" />
                    </div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 tracking-tight italic uppercase">
                        {language === 'uz' && "Super Admin"}
                        {language === 'ru' && "Супер Админ"}
                        {language === 'en' && "Super Admin"}
                    </h1>
                    <p className="text-[var(--text-muted)] text-[11px] font-black uppercase tracking-[0.2em] italic">
                        {language === 'uz' && "Platforma boshqaruv portali"}
                        {language === 'ru' && "Панель управления платформой"}
                        {language === 'en' && "Platform management portal"}
                    </p>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wider">{error}</span>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label={language === 'uz' ? "Foydalanuvchi nomi" : language === 'ru' ? "Имя пользователя" : "Username"}
                        value={username}
                        onChange={setUsername}
                        placeholder="admin.terminal"
                        icon={<User className="w-5 h-5" />}
                        required
                    />

                    <Input
                        label={language === 'uz' ? "Maxfiy parol" : language === 'ru' ? "Секретный пароль" : "Secret Password"}
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="••••••••"
                        icon={<Lock className="w-5 h-5" />}
                        required
                    />

                    <Button
                        type="submit"
                        className="w-full h-14 bg-[var(--brand-primary)] text-[var(--primary-foreground)] rounded-2xl shadow-2xl shadow-[var(--brand-primary-glow)] font-black uppercase tracking-[0.2em] text-[11px] border-0"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {language === 'uz' ? "Tekshirilmoqda..." : language === 'ru' ? "Проверка..." : "Verifying..."}
                            </span>
                        ) : (
                            language === 'uz' ? "Tizimga kirish" : language === 'ru' ? "Войти в систему" : "Enter System"
                        )}
                    </Button>
                </form>

                <div className="mt-10 pt-8 border-t border-[var(--glass-border)] text-center">
                    <button
                        onClick={onBack}
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-all transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <span className="text-xs">←</span> {language === 'uz' ? "Login sahifasiga qaytish" : language === 'ru' ? "Вернуться к обычному входу" : "Back to login"}
                    </button>
                </div>

                <div className="mt-8 p-6 rounded-[2rem] bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10 relative overflow-hidden group/alert">
                    <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-[var(--brand-primary)]/10 blur-2xl rounded-full group-hover/alert:bg-[var(--brand-primary)]/20 transition-all duration-700" />
                    <p className="text-[10px] text-[var(--text-muted)] font-bold text-center leading-relaxed tracking-wider italic">
                        🔒 {language === 'uz' && "Faqat vakolatli xodimlar uchun. Barcha harakatlar nazorat ostida."}
                        {language === 'ru' && "Только для авторизованного персонала. Все действия логируются."}
                        {language === 'en' && "Authorized personnel only. All actions are monitored."}
                    </p>
                </div>
            </GlassCard>
        </div>
    );
}
