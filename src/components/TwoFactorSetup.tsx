import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Copy, Check, Loader2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Button } from './Button';
import { Input } from './Input';
import { GlassCard } from './GlassCard';

interface TwoFactorSetupProps {
    onClose: () => void;
    onSuccess: (backupCodes: string[]) => void;
}

export function TwoFactorSetup({ onClose, onSuccess }: TwoFactorSetupProps) {
    const { setup2FA, enable2FA } = useAuth();
    const { language } = useApp();

    const [step, setStep] = useState<'scan' | 'verify' | 'success'>('scan');
    const [loading, setLoading] = useState(false);
    const [setupData, setSetupData] = useState<{ secret: string; otpauth_url: string } | null>(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadSetupData();
    }, []);

    const loadSetupData = async () => {
        setLoading(true);
        try {
            const data = await setup2FA();
            setSetupData(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to initialize 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (code.length < 6) return;
        setLoading(true);
        setError('');
        try {
            const data = await enable2FA(code);
            setBackupCodes(data.backup_codes);
            setStep('success');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const copyBackupCodes = () => {
        const text = backupCodes.join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSuccessClose = () => {
        onSuccess(backupCodes);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <GlassCard className="w-full max-w-lg p-8 border-white/10 bg-slate-900 shadow-2xl relative overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {step === 'scan' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[var(--brand-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--brand-primary)]/20">
                                <Shield className="w-8 h-8 text-[var(--brand-primary)]" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">
                                {language === 'uz' ? "2FA-NI SOZLASH" : "SETUP 2FA"}
                            </h2>
                            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold">
                                {language === 'uz' ? "Authenticator ilovasi bilan skan qiling" : "Scan with Authenticator app"}
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin" />
                            </div>
                        ) : setupData ? (
                            <div className="space-y-6">
                                <div className="flex justify-center p-4 bg-white rounded-2xl mx-auto w-fit">
                                    <QRCodeSVG value={setupData.otpauth_url} size={200} />
                                </div>

                                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5 space-y-2">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                        {language === 'uz' ? "Yoki kodni qo'lda kiriting:" : "Or enter code manually:"}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <code className="text-sm font-black text-[var(--brand-primary)] tracking-wider">
                                            {setupData.secret}
                                        </code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(setupData.secret)}
                                            className="text-[var(--brand-primary)] hover:brightness-110"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setStep('verify')}
                                    className="w-full h-14 bg-[var(--brand-primary)] text-[var(--primary-foreground)] font-black uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-[var(--brand-primary-glow)]"
                                >
                                    {language === 'uz' ? "DAVOM ETISH" : "CONTINUE"}
                                </Button>
                            </div>
                        ) : error && (
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-xs font-bold">{error}</span>
                            </div>
                        )}
                    </div>
                )}

                {step === 'verify' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">
                                {language === 'uz' ? "KODNI TASDIQLASH" : "VERIFY CODE"}
                            </h2>
                            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold">
                                {language === 'uz' ? "Ilovadagi 6 xonali kodni kiriting" : "Enter 6-digit code from app"}
                            </p>
                        </div>

                        <Input
                            value={code}
                            onChange={setCode}
                            placeholder="000 000"
                            className="text-center text-2xl font-black tracking-[0.5em]"
                        />

                        {error && (
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
                                <AlertCircle className="w-5 h-5 text-rose-500" />
                                <span className="text-xs font-bold">{error}</span>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setStep('scan')}
                                className="flex-1 h-14 font-black uppercase tracking-[0.2em] text-[11px]"
                            >
                                {language === 'uz' ? "ORTGA" : "BACK"}
                            </Button>
                            <Button
                                onClick={handleVerify}
                                disabled={loading || code.length < 6}
                                className="flex-[2] h-14 bg-[var(--brand-primary)] text-[var(--primary-foreground)] font-black uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-[var(--brand-primary-glow)]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (language === 'uz' ? "TASDIQLASH" : "VERIFY")}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                <Check className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">
                                {language === 'uz' ? "2FA YOQILDI!" : "2FA ENABLED!"}
                            </h2>
                            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold">
                                {language === 'uz' ? "Zaxira kodlarini saqlab qo'ying" : "Save your backup codes"}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-6 rounded-2xl bg-slate-800/50 border border-white/5">
                            {backupCodes.map((bc, i) => (
                                <code key={i} className="text-sm font-black text-[var(--brand-primary)] text-center tracking-widest">{bc}</code>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                onClick={copyBackupCodes}
                                className="flex-1 h-14 font-black uppercase tracking-[0.2em] text-[11px]"
                                icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            >
                                {copied ? (language === 'uz' ? "NUSXALANDI" : "COPIED") : (language === 'uz' ? "NUSXALASH" : "COPY")}
                            </Button>
                            <Button
                                onClick={handleSuccessClose}
                                className="flex-1 h-14 bg-emerald-600 font-black uppercase tracking-[0.2em] text-[11px]"
                            >
                                {language === 'uz' ? "YOPISH" : "CLOSE"}
                            </Button>
                        </div>

                        <div className="p-4 rounded-xl bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10">
                            <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-wider">
                                {language === 'uz'
                                    ? "DIQQAT: Telefoningizni yo'qotsangiz, ushbu kodlar orqali hisobingizga kira olasiz. Ularni xavfsiz joyda saqlang."
                                    : "NOTICE: If you lose your phone, these codes are the only way to access your account. Store them securely."}
                            </p>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
