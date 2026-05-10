import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { GlassCard } from '../components/GlassCard';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';

interface RegisterProps {
  onSuccess: () => void;
  onLogin: () => void;
}

export function Register({ onSuccess, onLogin }: RegisterProps) {
  const { t, language } = useApp();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState<'store_admin'>('store_admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');



    if (password.length < 8) {
      setError(
        language === 'uz' ? "Parol kamida 8 ta belgidan iborat bo'lishi kerak" :
          language === 'ru' ? "Пароль должен содержать минимум 8 символов" :
            "Password must be at least 8 characters"
      );
      return;
    }

    setIsLoading(true);

    try {
      // Split name into first and last
      const nameParts = name.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      await register({
        email,
        username: email, // Use email as username
        password,
        password2: password,
        first_name,
        last_name,
        role,
      });

      onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || t('errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen relative text-[var(--text-primary)] transition-colors duration-500 flex items-center justify-center p-4 overflow-hidden bg-white">
      {/* Visual Depth Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--brand-primary)]/5 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--brand-secondary)]/5 blur-[160px] rounded-full" />
      </div>

      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <GlassCard className="w-full max-w-lg p-8 sm:p-12 lg:p-14 border-[var(--color-border)] bg-white/80 shadow-2xl relative overflow-hidden group backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-primary)] opacity-80" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center mx-auto mb-8 shadow-2xl relative group overflow-hidden p-4">
            <img
              src="/savdoon-logo.jpg"
              alt="Savdoon Logo"
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] mb-4 tracking-tighter uppercase font-heading">{t('createAccount')}</h1>
          <div className="h-1.5 w-16 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] mx-auto rounded-full mb-6" />
          <p className="text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-[0.2em] max-w-[280px] mx-auto leading-relaxed">
            {language === 'uz' ? "Bugun o'z onlayn do'koningizni yarating" :
                language === 'ru' ? "Начните создавать свой магазин сегодня" :
                  "Start building your online store today"}
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4 text-rose-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider">{error}</span>
          </motion.div>
        )}



        <form onSubmit={handleSubmit} className="space-y-8">
          <Input
            label={t('name')}
            value={name}
            onChange={setName}
            placeholder="John Doe"
            icon={<User className="w-5 h-5" />}
            required
          />
          <Input
            label={t('email')}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@savdoon.com"
            icon={<Mail className="w-5 h-5" />}
            required
          />
          <Input
            label={t('password')}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            icon={<Lock className="w-5 h-5" />}
            required
            showPasswordToggle
          />

          <Button type="submit" variant="primary" size="lg" className="w-full h-14" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                {language === 'uz' ? "Kutilmoqda..." : language === 'ru' ? "Ожидание..." : "Loading..."}
              </span>
            ) : (
              t('register')
            )}
          </Button>
        </form>

        <div className="mt-12 pt-10 border-t border-[var(--color-border)] text-center">
          <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">
            {t('alreadyHaveAccount')}{' '}
            <button
              onClick={onLogin}
              className="ml-2 text-[var(--brand-primary)] hover:brightness-125 transition-all underline underline-offset-8"
            >
              {t('login')}
            </button>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
