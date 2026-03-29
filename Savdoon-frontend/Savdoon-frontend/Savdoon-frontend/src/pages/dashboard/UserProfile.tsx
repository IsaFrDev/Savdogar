import { useState, useEffect } from 'react';
import {
    User as UserIcon,
    Mail,
    Phone,
    Shield,
    Trash2,
    Loader2,
    CheckCircle,
    Smartphone,
    Languages,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { GlassCard } from '../../components/GlassCard';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { authApi } from '../../services/api';

export default function UserProfile() {
    const { user, refreshUser } = useAuth();
    const { t, language, setLanguage } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [trustedDevices, setTrustedDevices] = useState<any[]>([]);

    useEffect(() => {
        loadTrustedDevices();
    }, []);

    const loadTrustedDevices = async () => {
        try {
            const res = await authApi.listTrustedDevices();
            setTrustedDevices(res.data);
        } catch (error) {
            console.error('Failed to load trusted devices:', error);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            await authApi.updateProfile(formData);
            await refreshUser();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || (language === 'uz' ? 'Profilni yangilashda xatolik yuz berdi' : language === 'ru' ? 'Ошибка при обновлении профиля' : 'Failed to update profile'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            setError(language === 'uz' ? "Yangi parollar mos kelmadi" : "Passwords do not match");
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            await authApi.updatePassword({
                old_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });
            setSuccess(true);
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: '',
            });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || (language === 'uz' ? 'Parolni yangilashda xatolik yuz berdi' : language === 'ru' ? 'Ошибка при обновлении пароля' : 'Failed to update password'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteDevice = async (id: number) => {
        try {
            await authApi.deleteTrustedDevice(id);
            setTrustedDevices(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error('Failed to remove device:', error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight uppercase italic">{t('profileTitle')}</h1>
                <p className="text-[11px] text-[var(--text-dim)] font-black uppercase tracking-[0.3em] mt-2 leading-none">{t('profileSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Personal Info & Password */}
                <div className="lg:col-span-2 space-y-8">
                    <GlassCard className="p-8 border-[var(--glass-border)] bg-[var(--color-surface-raised)]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 rounded-xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)]">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">{t('personalInfo')}</h2>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label={t('profileFirstName')}
                                value={formData.first_name}
                                onChange={(val) => setFormData({ ...formData, first_name: val })}
                                icon={<UserIcon className="w-5 h-5" />}
                            />
                            <Input
                                label={t('profileLastName')}
                                value={formData.last_name}
                                onChange={(val) => setFormData({ ...formData, last_name: val })}
                                icon={<UserIcon className="w-5 h-5" />}
                            />
                            <Input
                                label={t('email')}
                                type="email"
                                value={formData.email}
                                onChange={(val) => setFormData({ ...formData, email: val })}
                                icon={<Mail className="w-5 h-5" />}
                            />
                            <Input
                                label={t('profilePhone')}
                                value={formData.phone}
                                onChange={(val) => setFormData({ ...formData, phone: val })}
                                icon={<Phone className="w-5 h-5" />}
                            />

                            <div className="md:col-span-2 pt-4">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full md:w-auto px-10 h-12"
                                    disabled={isLoading}
                                    icon={isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                >
                                    {t('save')}
                                </Button>
                            </div>
                        </form>
                    </GlassCard>

                    <GlassCard className="p-8 border-[var(--glass-border)] bg-[var(--color-surface-raised)]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">{t('profileSecurity')}</h2>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <Input
                                label={t('password') || 'Current Password'}
                                type="password"
                                value={passwordData.current_password}
                                onChange={(val) => setPasswordData({ ...passwordData, current_password: val })}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label={t('newPassword') || 'New Password'}
                                    type="password"
                                    value={passwordData.new_password}
                                    onChange={(val) => setPasswordData({ ...passwordData, new_password: val })}
                                />
                                <Input
                                    label={t('confirmPassword')}
                                    type="password"
                                    value={passwordData.confirm_password}
                                    onChange={(val) => setPasswordData({ ...passwordData, confirm_password: val })}
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="w-full md:w-auto px-10 h-12 border-[var(--brand-primary)]/30"
                                    disabled={isLoading}
                                >
                                    {t('changePassword')}
                                </Button>
                            </div>
                        </form>
                    </GlassCard>
                </div>

                {/* Right Column: Other Settings */}
                <div className="space-y-8">
                    <GlassCard className="p-8 border-[var(--glass-border)] bg-[var(--color-surface-raised)]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">{language === 'uz' ? 'Ishonchli Qurilmalar' : language === 'ru' ? 'Надежные Устройства' : 'Trusted Devices'}</h2>
                        </div>

                        <div className="space-y-4">
                            {trustedDevices.map((device) => (
                                <div key={device.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[var(--text-main)]">{device.device_name}</p>
                                            <p className="text-[9px] text-[var(--text-dim)] uppercase tracking-wider">
                                                {new Date(device.last_login).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDevice(device.id)}
                                        className="p-2 rounded-lg hover:bg-rose-500/10 text-[var(--text-dim)] hover:text-rose-400 transition-colors"
                                        title={language === 'uz' ? "O'chirish" : "Remove"}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {trustedDevices.length === 0 && (
                                <p className="text-xs text-[var(--text-dim)] italic p-2">{language === 'uz' ? "Ishonchli qurilmalar yo'q" : language === 'ru' ? "Нет надежных устройств" : "No trusted devices found"}</p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 border-[var(--glass-border)] bg-[var(--color-surface-raised)]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                <Languages className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">{language === 'uz' ? 'Til' : language === 'ru' ? 'Язык' : 'Language'}</h2>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setLanguage('uz')}
                                className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${language === 'uz'
                                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                                    : 'bg-white/5 border-[var(--glass-border)] text-[var(--text-dim)] hover:border-[var(--brand-primary)]/30'
                                    }`}
                            >
                                O'zbekcha
                            </button>
                            <button
                                onClick={() => setLanguage('ru')}
                                className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${language === 'ru'
                                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                                    : 'bg-white/5 border-[var(--glass-border)] text-[var(--text-dim)] hover:border-[var(--brand-primary)]/30'
                                    }`}
                            >
                                Русский
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {error && (
                <div className="fixed bottom-8 right-8 bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold uppercase tracking-widest text-xs z-50">
                    {error}
                </div>
            )}
            {success && (
                <div className="fixed bottom-8 right-8 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold uppercase tracking-widest text-xs z-50">
                    {t('success')}
                </div>
            )}
        </div>
    );
}
