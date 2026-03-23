import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Scan, AlertCircle, CheckCircle, Loader2, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api'; // Import authApi
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { GlassCard } from '../components/GlassCard';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';

interface LoginProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function Login({ onLogin, onRegister }: LoginProps) {
  const { t, language } = useApp();
  const { login, loginWithFaceId, verify2FA } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFaceIdLoading, setIsFaceIdLoading] = useState(false);
  const [error, setError] = useState('');
  const [faceIdMessage, setFaceIdMessage] = useState('');
  const [step, setStep] = useState<'login' | '2fa' | 'device_verification'>('login');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [deviceCode, setDeviceCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await login(email, password);
      if (data?.two_factor_required) {
        setTwoFactorEmail(data.email);
        setStep('2fa');
      } else {
        onLogin();
      }
    } catch (err: any) {
      if (err.response?.status === 401 && err.response?.data?.device_verification_required) {
        setTempToken(err.response.data.temp_token);
        setStep('device_verification');
        setError('');
        return;
      }

      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        t('errorInvalidCredentials')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceIdLogin = async () => {
    setError('');
    setFaceIdMessage('');
    setIsFaceIdLoading(true);

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error(t('faceIdNotSupported'));
      }

      await loginWithFaceId(email.trim() || undefined);
      setFaceIdMessage(t('loginWithFaceIdSuccess'));
      setTimeout(onLogin, 500);
    } catch (err: any) {
      setError(
        err.message || t('faceIdLoginFailed')
      );
    } finally {
      setIsFaceIdLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await verify2FA(twoFactorEmail, twoFactorCode, useBackupCode);
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.error || "2FA verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await authApi.verifyDevice(deviceCode, tempToken);
      const { access, refresh } = res.data.tokens;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.error || "Device verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative text-[var(--text-primary)] transition-colors duration-500 flex items-center justify-center p-4 overflow-hidden">
      {/* Visual Depth Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--brand-primary-glow)] blur-[160px] rounded-full opacity-60 animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--brand-primary-glow)] blur-[160px] rounded-full opacity-40" />
      </div>

      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <GlassCard className="w-full max-w-md p-8 sm:p-12 lg:p-14 border-[var(--color-border-bright)] bg-[var(--color-surface)] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent opacity-50" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center mx-auto mb-8 shadow-2xl relative group overflow-hidden p-4">
            <img
              src="/savdoon-logo.jpg"
              alt="Savdoon Logo"
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] mb-4 tracking-tighter uppercase font-heading">
            {t('welcomeBack')}
          </h1>
          <div className="h-1 w-12 bg-[var(--brand-primary)] mx-auto rounded-full mb-4 opacity-50" />
          <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[0.3em]">
            {t('signInToManage')}
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider">{error}</span>
          </motion.div>
        )}

        {faceIdMessage && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider">{faceIdMessage}</span>
          </motion.div>
        )}

        {step === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <Input
              label={t('email')}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@savdoon.com"
              icon={<Mail className="w-5 h-5" />}
            />
            <div className="space-y-3">
            <Input
              label={t('password')}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              showPasswordToggle
            />
              <div className="flex justify-end">
                <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-primary)] hover:brightness-125 transition-all">
                  {t('forgotPassword')}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full h-14" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('checking')}
                </span>
              ) : (
                t('login')
              )}
            </Button>

            <div className="pt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-border)]" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="px-4 bg-[var(--bg-main)] text-[var(--text-muted)] font-black uppercase tracking-[0.4em]">
                    {t('or')}
                  </span>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-5 space-y-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
                    <Scan className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      {t('faceIdLogin')}
                    </p>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--text-muted)]">
                      {t('faceIdEmailHint')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-12 rounded-xl border-[var(--brand-primary)]/30 text-[var(--text-secondary)] hover:border-[var(--brand-primary)]/60 hover:text-[var(--brand-primary)]"
                  icon={isFaceIdLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                  onClick={handleFaceIdLogin}
                  disabled={isFaceIdLoading}
                >
                  {isFaceIdLoading ? t('checking') : t('faceIdLogin')}
                </Button>
              </div>
            </div>
          </form>
        ) : step === 'device_verification' ? (
          <form onSubmit={handleDeviceVerify} className="space-y-8">
            <div className="text-center mb-6">
              <Shield className="w-16 h-16 text-[var(--brand-primary)] mx-auto mb-6" />
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight font-heading">
                {t('newDevice')}
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-widest mt-2">
                {t('verifCodeSent')}
              </p>
            </div>

            <Input
              label={t('verificationCode')}
              type="text"
              value={deviceCode}
              onChange={setDeviceCode}
              placeholder="000 000"
              icon={<Shield className="w-5 h-5" />}
              helper={t('verificationCodeHint')}
            />

            <Button type="submit" variant="primary" size="lg" className="w-full h-14" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('verifying')}
                </span>
              ) : (
                t('verifyDevice')
              )}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setError('');
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {t('goBack')}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handle2FAVerify} className="space-y-8">
            <div className="text-center mb-6">
              <Lock className="w-16 h-16 text-[var(--brand-primary)] mx-auto mb-6" />
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight font-heading">
                {useBackupCode ? t('backupCode') : t('authenticatorCode')}
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-widest mt-2">
                {useBackupCode ? t('enter8DigitBackup') : t('enterCodeFromApp')}
              </p>
            </div>

            <Input
              label={useBackupCode ? t('backupCode') : t('authenticatorCode')}
              type="text"
              value={twoFactorCode}
              onChange={setTwoFactorCode}
              placeholder={useBackupCode ? "ABC12345" : "000 000"}
              icon={<Lock className="w-5 h-5" />}
              helper={!useBackupCode ? t('verificationCodeHint') : undefined}
            />

            <Button type="submit" variant="primary" size="lg" className="w-full h-14" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('checking')}
                </span>
              ) : (
                t('verify')
              )}
            </Button>

            <div className="flex flex-col gap-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setTwoFactorCode('');
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-primary)] hover:brightness-125"
              >
                {useBackupCode ? t('useAuthenticator') : t('useBackupCode')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setError('');
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {t('goBack')}
              </button>
            </div>
          </form>
        )}

        <div className="mt-12 pt-10 border-t border-[var(--color-border)] text-center">
          <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] leading-loose">
            {t('alreadyHaveAccount') === "Already have an account?" ? "Don't have an account? " :
              language === 'uz' ? "Hisobingiz yo'qmi? " : "Нет аккаунта? "}
            <button
              onClick={onRegister}
              className="ml-2 text-[var(--brand-primary)] hover:brightness-125 transition-all underline underline-offset-8"
            >
              {t('createStore')}
            </button>
          </p>

        </div>
      </GlassCard>
    </div>
  );
}
