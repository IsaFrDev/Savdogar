import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Scan, Loader2, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
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
  const { login, loginWithFaceId, verify2FA, verifyDevice } = useAuth();

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
      if (err.status === 401 && err.data?.device_verification_required) {
        setTempToken(err.data.temp_token);
        setStep('device_verification');
        setError('');
        return;
      }

      setError(
        err.message ||
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
      setError(err.message || "2FA verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await verifyDevice(deviceCode, tempToken);
      onLogin();
    } catch (err: any) {
      setError(err.message || "Device verification failed");
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
              src="/savdogar_logo.png"
              alt="Savdogar Logo"
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span className="text-[11px] font-bold uppercase tracking-wider">{error}</span>
          </motion.div>
        )}

        {faceIdMessage && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
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
              placeholder="you@savdogar.vercel.app"
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
