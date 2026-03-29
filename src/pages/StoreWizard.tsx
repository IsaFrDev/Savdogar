import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Settings, MapPin, MessageCircle, FileSignature, Check, ChevronRight, ChevronLeft, Upload, AlertCircle, Sparkles, Loader2, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storeApi } from '../services/api';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Input';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { SignaturePad, SignaturePadRef } from '../components/SignaturePad';
import { ContractPreview } from '../components/ContractPreview';
import { LocationPicker } from '../components/LocationPicker';
import { Language } from '../i18n/translations';
import { extractColorsFromImage } from '../utils/colorExtractor';

interface StoreWizardProps {
    onComplete: () => void;
}

const businessTypes = ['grocery', 'clothing', 'electronics', 'services', 'restaurant', 'beauty', 'home', 'other'];

export function StoreWizard({ onComplete }: StoreWizardProps) {
    const { t, language, addStore } = useApp();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [createdStoreId, setCreatedStoreId] = useState<number | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState('#6366F1');
    const [secondaryColor, setSecondaryColor] = useState('#8B5CF6');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Step 1: Basics
    const [storeName, setStoreName] = useState('');
    const [storeSlug, setStoreSlug] = useState('');
    const [businessType, setBusinessType] = useState('electronics');
    const [description, setDescription] = useState('');

    // Step 3: Catalog
    const [catalogMode, setCatalogMode] = useState(false);
    const [defaultLang, setDefaultLang] = useState<Language>('uz');

    // Step 4: Location
    const [pickupAddress, setPickupAddress] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    // Step 5: Telegram
    const [botToken, setBotToken] = useState('');
    const [chatId, setChatId] = useState('');

    // Step 6: Contract
    const [telegramUsername, setTelegramUsername] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [signatureData, setSignatureData] = useState('');
    const signaturePadRef = useRef<SignaturePadRef>(null);
    const [businessDescription, _setBusinessDescription] = useState('');
    const [isAnalyzingBusiness, setIsAnalyzingBusiness] = useState(false);
    const [complianceResult, setComplianceResult] = useState<{ is_allowed: boolean; reason: string; suggested_features: string[]; suggested_category: string; summary: string } | null>(null);

    // Live theme preview
    useEffect(() => {
        const root = document.documentElement;
        const originalPrimary = root.style.getPropertyValue('--brand-primary');
        const originalSecondary = root.style.getPropertyValue('--brand-secondary');
        const originalGlow = root.style.getPropertyValue('--brand-primary-glow');

        root.style.setProperty('--brand-primary', primaryColor);
        root.style.setProperty('--brand-secondary', secondaryColor);
        root.style.setProperty('--brand-primary-glow', `${primaryColor}40`); // 25% opacity for glow

        return () => {
            if (originalPrimary) root.style.setProperty('--brand-primary', originalPrimary);
            if (originalSecondary) root.style.setProperty('--brand-secondary', originalSecondary);
            if (originalGlow) root.style.setProperty('--brand-primary-glow', originalGlow);
        };
    }, [primaryColor, secondaryColor]);

    const steps = [
        { num: 1, title: t('createYourStore'), icon: Store },
        { num: 2, title: 'AI Analysis', icon: Sparkles },
        { num: 3, title: t('catalogSettings'), icon: Settings },
        { num: 4, title: t('locationPickup'), icon: MapPin },
        { num: 5, title: t('telegramIntegration'), icon: MessageCircle },
        { num: 6, title: t('signContract'), icon: FileSignature },
    ];

    const handleNext = async () => {
        if (step === 1) {
            // Need to analyze business before proceeding if "other" or description provided
            if (businessDescription.trim().length > 10) {
                setIsAnalyzingBusiness(true);
                setError('');
                try {
                    const { aiApi } = await import('../services/api');
                    const res = await aiApi.analyzeBusiness({
                        description: businessDescription,
                        business_type: businessType,
                        language
                    });
                    setComplianceResult(res.data);
                    if (!res.data.is_allowed) {
                        setError(res.data.reason);
                        return;
                    }
                    setStep(2); // Go to Analysis review step
                } catch (err) {
                    console.error("Business analysis failed", err);
                    setStep(3); // Skip to catalog if AI fails but allow proceeding
                } finally {
                    setIsAnalyzingBusiness(false);
                }
                return;
            } else if (businessType === 'other') {
                setError(language === 'uz' ? "Iltimos, biznesingiz haqida qisqacha ma'lumot bering." : "Please provide a short description of your business.");
                return;
            }
        }

        if (step < 6) setStep(step + 1);
        else handleComplete();
    };

    const handleComplete = async () => {
        if (!agreeToTerms || !signatureData) {
            setError(t('signatureRequired') || 'Please agree to terms and sign the contract');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Create store via API
            let data: any;
            const slug = storeSlug || storeName.toLowerCase().replace(/\s+/g, '-');

            if (logoFile) {
                const formData = new FormData();
                formData.append('name', storeName);
                formData.append('slug', slug);
                formData.append('description', description);
                formData.append('business_type', businessType);
                formData.append('business_description', businessDescription);
                formData.append('catalog_mode', String(catalogMode));
                formData.append('default_language', defaultLang);
                formData.append('signature_data', signatureData);
                formData.append('agree_to_terms', String(agreeToTerms));
                formData.append('telegram_username', telegramUsername);
                formData.append('logo', logoFile);
                if (pickupAddress) formData.append('pickup_address', pickupAddress);
                if (latitude) formData.append('latitude', latitude);
                if (longitude) formData.append('longitude', longitude);
                if (botToken) formData.append('telegram_bot_token', botToken);
                if (chatId) formData.append('telegram_chat_id', chatId);
                formData.append('primary_color', primaryColor);
                formData.append('secondary_color', secondaryColor);
                data = formData;
            } else {
                data = {
                    name: storeName,
                    slug: slug,
                    description,
                    business_type: businessType,
                    business_description: businessDescription,
                    pickup_address: pickupAddress,
                    latitude: latitude ? parseFloat(latitude) : undefined,
                    longitude: longitude ? parseFloat(longitude) : undefined,
                    telegram_bot_token: botToken,
                    telegram_chat_id: chatId,
                    catalog_mode: catalogMode,
                    default_language: defaultLang,
                    signature_data: signatureData,
                    agree_to_terms: agreeToTerms,
                    telegram_username: telegramUsername,
                    primary_color: primaryColor,
                    secondary_color: secondaryColor,
                };
            }

            const response = await storeApi.create(data);

            // Save store ID for contract download
            setCreatedStoreId(response.data.id);

            // Add to local context
            addStore({
                id: response.data.id.toString(),
                name: storeName,
                slug: slug,
                businessType,
                description,
                catalogMode,
                pickupAddress,
                latitude,
                longitude,
                telegramBot: botToken,
                chatId,
                defaultLanguage: defaultLang,
                telegram_username: telegramUsername,
                base_currency: 'UZS',
                use_auto_rates: true,
                manual_exchange_rates: {},
                primaryColor,
                secondaryColor,
            } as any);

            setStep(7); // Success step (pushed from 6 to 7)
        } catch (err: any) {
            console.error('Store creation error:', err.response?.data);
            const data = err.response?.data;
            let errorMessage = t('errorGeneric');

            if (data) {
                if (typeof data === 'string') {
                    errorMessage = data;
                } else if (data.slug) {
                    const slugError = data.slug[0].toLowerCase();
                    if (slugError.includes('already exists') || slugError.includes('exists')) {
                        errorMessage = language === 'uz' ? "Bu nomdagi do'kon havolasi (link) band. Iltimos, boshqa nom tanlang." :
                            language === 'ru' ? "Магазин с таким URL уже существует. Выберите другое имя." :
                                "A store with this URL already exists. Please choose another name.";
                    } else {
                        errorMessage = `URL: ${data.slug[0]}`;
                    }
                } else if (data.name) {
                    errorMessage = `${t('storeName')}: ${data.name[0]}`;
                } else if (data.error) {
                    errorMessage = data.error;
                } else if (data.logo) {
                    errorMessage = `${t('logoError') || 'Logo Error'}: ${data.logo[0]}`;
                } else if (data.detail) {
                    errorMessage = data.detail;
                }
            }

            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignature = (signature: string) => {
        setSignatureData(signature);
    };

    const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Extract colors
            try {
                const colors = await extractColorsFromImage(file);
                setPrimaryColor(colors.primary);
                setSecondaryColor(colors.secondary);
            } catch (err) {
                console.error("Color extraction failed", err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[var(--text-primary)] flex items-center justify-center p-4 selection:bg-[var(--brand-primary)]/10">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[130px] rounded-full"
                    style={{ backgroundColor: `${primaryColor}33` }} // 20% opacity primary
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.1, 0.15, 0.1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[130px] rounded-full"
                    style={{ backgroundColor: `${secondaryColor}26` }} // 15% opacity secondary
                />
            </div>

            <div className="absolute top-4 right-4 z-[10000]">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-2xl relative z-10">
                {/* Progress Steps */}
                {step < 6 && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between relative px-2">
                            {/* Background Line */}
                            <div className="absolute left-10 right-10 top-5 h-[2px] bg-[var(--color-border)] -translate-y-1/2 z-0" />
                            {/* Progress Line */}
                            <div
                                className="absolute left-10 top-5 h-[3px] bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] -translate-y-1/2 z-0 transition-all duration-700 shadow-[0_0_15px_var(--brand-primary-glow)]"
                                style={{ width: `${Math.max(0, ((step - 1) / (steps.length - 1)) * (100 - (20)))}%` }}
                            />
                            {steps.map((s) => (
                                <div key={s.num} className="relative z-10 flex flex-col items-center w-20">
                                    <motion.div
                                        animate={{
                                            scale: step === s.num ? 1.2 : 1,
                                            backgroundColor: step > s.num ? 'var(--brand-primary)' : step === s.num ? 'white' : 'white',
                                            borderColor: step >= s.num ? 'var(--brand-primary)' : 'var(--color-border)'
                                        }}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white border-2 backdrop-blur-md transition-shadow duration-300"
                                        style={{
                                            boxShadow: step === s.num ? '0 0 20px var(--brand-primary-glow)' : 'none',
                                            color: step > s.num ? 'white' : step === s.num ? 'var(--brand-primary)' : 'var(--text-muted)'
                                        }}
                                    >
                                        {step > s.num ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <s.icon className="w-5 h-5" />
                                        )}
                                    </motion.div>
                                    <span className={`mt-3 text-[9px] font-black uppercase tracking-tight text-center leading-tight whitespace-pre-wrap ${step >= s.num ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}`}>
                                        {s.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden text-left border border-[var(--color-border)] shadow-xl shadow-slate-200/50">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-primary)]" />
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--text-main)] w-full">{t('createYourStore')}</h2>
                                        <p className="text-[var(--text-dim)] mt-1">
                                            {t('storeBasicsSubtitle')}
                                        </p>
                                    </div>
                                    <Input
                                        label={t('storeName')}
                                        value={storeName}
                                        onChange={(v) => {
                                            setStoreName(v);
                                            setStoreSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                                        }}
                                        placeholder="My Awesome Store"
                                    />
                                    <Input
                                        label={t('storeSlug')}
                                        value={storeSlug}
                                        onChange={setStoreSlug}
                                        placeholder="my-awesome-store"
                                        helper={`${storeSlug || 'your-store'}.savdoon.uz`}
                                        className="font-mono text-sm"
                                    />
                                    <div className="space-y-1.5 text-left">
                                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">{t('businessType')}</label>
                                        <select
                                            value={businessType}
                                            onChange={(e) => setBusinessType(e.target.value)}
                                            className="w-full px-4 py-3.5 rounded-2xl border-1.5 border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary-glow)] appearance-none cursor-pointer font-medium"
                                        >
                                            {businessTypes.map((type) => (
                                                <option key={type} value={type} className="bg-white">{t(type)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <TextArea
                                        label={t('shortDescription')}
                                        value={description}
                                        onChange={setDescription}
                                        placeholder={t('descriptionPlaceholder')}
                                        rows={3}
                                    />
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles className="w-6 h-6 text-[var(--brand-primary)]" />
                                            <h2 className="text-2xl font-bold text-[var(--text-main)] w-full">AI Business Analysis</h2>
                                        </div>
                                        <p className="text-[var(--text-dim)] text-sm">
                                            {language === 'uz' ? 'Biznesingiz muvaffaqiyatli tahlil qilindi' : 'AI has analyzed your business model'}
                                        </p>
                                    </div>

                                    {complianceResult && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{t('summary')}</h3>
                                                <p className="text-sm leading-relaxed text-slate-300 italic">
                                                    "{complianceResult.summary}"
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/20">
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-3">
                                                        {language === 'uz' ? 'Tavsiya etilgan kategoriya' : 'Suggested Category'}
                                                    </h3>
                                                    <p className="text-xl font-bold text-white capitalize">{complianceResult.suggested_category}</p>
                                                </div>
                                                <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3">Status</h3>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                        <p className="text-sm font-bold text-white">Verified & Compliant</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                                                    {language === 'uz' ? 'Tavsiya etilgan funksiyalar' : 'Suggested AI Features'}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {complianceResult.suggested_features.map((feature, i) => (
                                                        <span key={i} className="px-4 py-2 rounded-xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-[10px] font-bold uppercase tracking-wide">
                                                            {feature}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--text-main)]">{t('catalogSettings')}</h2>
                                        <p className="text-[var(--text-dim)] mt-1">
                                            {t('configureStoreBehavior')}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10">
                                        <input
                                            type="checkbox"
                                            checked={catalogMode}
                                            onChange={(e) => setCatalogMode(e.target.checked)}
                                            className="mt-1 w-5 h-5 text-[var(--brand-primary)] rounded-lg border-white/10 bg-slate-900 focus:ring-[var(--brand-primary)]"
                                        />
                                        <div>
                                            <p className="font-bold text-[var(--text-primary)] uppercase tracking-tight">{t('catalogModeOnly')}</p>
                                            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium leading-relaxed">{t('catalogModeHelper')}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">{t('defaultLanguage')}</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {(['uz', 'ru'] as Language[]).map((lang) => (
                                                <button
                                                    key={lang}
                                                    onClick={() => setDefaultLang(lang)}
                                                    className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center ${defaultLang === lang
                                                        ? 'bg-white border-[var(--brand-primary)] shadow-[0_0_20px_var(--brand-primary-glow)] scale-[1.02]'
                                                        : 'bg-[var(--color-surface-raised)] border-transparent hover:border-[var(--brand-primary)]/30 text-[var(--text-muted)]'
                                                        }`}
                                                >
                                                    <span className="text-3xl mb-3 block">
                                                        {lang === 'uz' ? '🇺🇿' : '🇷🇺'}
                                                    </span>
                                                    <span className={`text-[11px] font-black uppercase tracking-widest ${defaultLang === lang ? 'text-[var(--brand-primary)]' : 'text-[var(--text-dim)]'}`}>
                                                        {lang === 'uz' ? "O'zbekcha" : 'Русский'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-6 text-left">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--text-main)]">{t('locationPickup')}</h2>
                                        <p className="text-[var(--text-dim)] mt-1">{t('pickupHelper')}</p>
                                    </div>
                                    <Input
                                        label={t('pickupAddress')}
                                        value={pickupAddress}
                                        onChange={setPickupAddress}
                                        placeholder="123 Main Street, City, Country"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label={t('latitude')}
                                            value={latitude}
                                            onChange={setLatitude}
                                            placeholder="41.2995"
                                        />
                                        <Input
                                            label={t('longitude')}
                                            value={longitude}
                                            onChange={setLongitude}
                                            placeholder="69.2401"
                                        />
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-white/10">
                                        <LocationPicker
                                            initialLat={latitude ? parseFloat(latitude) : undefined}
                                            initialLng={longitude ? parseFloat(longitude) : undefined}
                                            onLocationSelect={(lat, lng, addr) => {
                                                setLatitude(lat.toFixed(6));
                                                setLongitude(lng.toFixed(6));
                                                if (addr) setPickupAddress(addr);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="space-y-6 text-left">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--text-main)]">{t('telegramIntegration')}</h2>
                                        <p className="text-[var(--text-dim)] mt-1">{t('telegramHelper')}</p>
                                    </div>
                                    <Input
                                        label={t('botToken')}
                                        value={botToken}
                                        onChange={setBotToken}
                                        placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                                    />
                                    <Input
                                        label={t('chatId')}
                                        value={chatId}
                                        onChange={setChatId}
                                        placeholder="@your_channel or 123456789"
                                    />
                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                        <p className="text-xs text-blue-400 font-bold uppercase tracking-wider text-center">
                                            💡 {t('setupLater')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 6 && (
                                <div className="space-y-6 text-left">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--text-main)]">
                                            {language === 'uz' && "Shartnoma va imzo"}
                                            {language === 'ru' && "Договор и подпись"}
                                            {language === 'en' && "Contract & Signature"}
                                        </h2>
                                        <p className="text-[var(--text-dim)] mt-1">
                                            {language === 'uz' ? "Do'koningiz logotipi va shartnomani tasdiqlang" :
                                                language === 'ru' ? "Загрузите логотип и подтвердите договор" :
                                                    "Upload logo and confirm the contract"}
                                        </p>
                                    </div>

                                    {/* Move Logo Upload here */}
                                    <div className="space-y-1.5 text-left">
                                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">{t('uploadLogo')}</label>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={onLogoChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)] rounded-3xl p-10 text-center hover:border-[var(--brand-primary)]/50 hover:bg-[var(--brand-primary)]/5 transition-all cursor-pointer group relative overflow-hidden min-h-[140px] flex flex-col items-center justify-center shadow-inner"
                                        >
                                            {logoPreview ? (
                                                <div className="relative group/preview w-full h-full flex items-center justify-center">
                                                    <img src={logoPreview} alt="Logo preview" className="max-h-28 rounded-xl object-contain shadow-lg" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{t('change') || 'Change'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="p-4 rounded-full bg-white shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                                        <Upload className="w-8 h-8 text-[var(--brand-primary)]" />
                                                    </div>
                                                    <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                                        {t('clickToUpload')}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Color Preview */}
                                    {logoPreview && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm"
                                        >
                                            <div className="flex -space-x-3">
                                                <div className="w-10 h-10 rounded-full ring-4 ring-white shadow-lg" style={{ backgroundColor: primaryColor }} />
                                                <div className="w-10 h-10 rounded-full ring-4 ring-white shadow-lg" style={{ backgroundColor: secondaryColor }} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-2">
                                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                                    {language === 'uz' ? 'AI Ranglar' : 'AI Colors'}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                                                    {language === 'uz' ? 'Logotip asosida tanlandi' : 'Extracted from logo'}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="space-y-4">
                                        <Input
                                            label={t('telegramUsername')}
                                            value={telegramUsername}
                                            onChange={(v) => {
                                                if (v && !v.startsWith('@')) setTelegramUsername('@' + v);
                                                else setTelegramUsername(v);
                                            }}
                                            placeholder={t('telegramUsernamePlaceholder')}
                                            required
                                            helper={t('telegramUsernameRequired')}
                                        />
                                    </div>

                                    <ContractPreview onAgree={setAgreeToTerms} agreed={agreeToTerms} />

                                    {agreeToTerms && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-4"
                                        >
                                            <SignaturePad
                                                ref={signaturePadRef}
                                                onSign={handleSignature}
                                                nameForGeneration={storeName}
                                                label={
                                                    language === 'uz' ? "Elektron imzongiz" :
                                                        language === 'ru' ? "Ваша электронная подпись" :
                                                            "Your electronic signature"
                                                }
                                            />

                                            {signatureData && (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <Check className="w-5 h-5" />
                                                    <span className="text-sm font-medium">
                                                        {language === 'uz' && "Imzo qabul qilindi"}
                                                        {language === 'ru' && "Подпись принята"}
                                                        {language === 'en' && "Signature accepted"}
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600">
                                            <AlertCircle className="w-5 h-5" />
                                            <span className="text-sm">{error}</span>
                                        </div>
                                    )}

                                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                        <p className="text-xs text-amber-500 font-bold uppercase tracking-widest text-center leading-relaxed">
                                            ⚠️ {language === 'uz' ? "Do'koningiz admin tasdig'idan keyin faollashadi" :
                                                language === 'ru' ? "Ваш магазин будет активирован после одобрения админа" :
                                                    "Your store will be activated after admin approval"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 7 && (
                                <div className="text-center py-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', duration: 0.5 }}
                                        className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6"
                                    >
                                        <FileSignature className="w-10 h-10 text-white" />
                                    </motion.div>
                                    <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4 uppercase tracking-tight">
                                        {t('pendingApprovalTitle')}
                                    </h2>
                                    <p className="text-[var(--text-muted)] mb-8 max-w-sm mx-auto font-medium">
                                        {t('pendingApprovalMsg')}
                                    </p>

                                    <div className="bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10 rounded-[2rem] p-8 mb-10 text-left shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-black uppercase tracking-widest text-[var(--brand-primary)] opacity-70">{t('subscriptionFee')}</span>
                                            <span className="text-2xl font-black text-[var(--brand-primary)]">{t('monthlyFee')}</span>
                                        </div>
                                        <div className="h-[1px] bg-[var(--brand-primary)]/10 w-full mb-4" />
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-relaxed">
                                            {language === 'uz'
                                                ? "To'lov do'kon tasdiqlanganidan so'ng amalga oshiriladi."
                                                : language === 'ru'
                                                    ? "Оплата производится после одобрения магазина."
                                                    : "Payment is required after store approval."}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                        {createdStoreId && (
                                            <button
                                                onClick={async () => {
                                                    if (!createdStoreId) return;
                                                    try {
                                                        const response = await storeApi.downloadContract(createdStoreId);
                                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                                        const link = document.createElement('a');
                                                        link.href = url;
                                                        link.setAttribute('download', `contract_${storeSlug}.pdf`);
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        link.remove();
                                                        window.URL.revokeObjectURL(url);
                                                    } catch (err) {
                                                        console.error('Contract download failed:', err);
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-6 py-4 rounded-2xl border-2 border-[var(--color-border)] text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                                            >
                                                <Download className="w-4 h-4" />
                                                {t('downloadContract')}
                                            </button>
                                        )}
                                        <Button
                                            onClick={onComplete}
                                            size="lg"
                                            className="px-10 py-5 shadow-xl shadow-[var(--brand-primary-glow)]"
                                        >
                                            {t('goToDashboard')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step < 7 && (
                                <div className="flex justify-between mt-8">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStep(step - 1)}
                                        disabled={step === 1 || isSubmitting}
                                        icon={<ChevronLeft className="w-4 h-4" />}
                                    >
                                        {t('back')}
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        disabled={
                                            isSubmitting || isAnalyzingBusiness ||
                                            (step === 1 && (!storeName || !businessType)) ||
                                            (step === 6 && (!agreeToTerms || !signatureData))
                                        }
                                        icon={isAnalyzingBusiness ? <Loader2 className="w-4 h-4 animate-spin" /> : (step === 6 ? <Check className="w-5 h-5" /> : <ChevronRight className="w-4 h-4" />)}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                {t('submitting')}
                                            </span>
                                        ) : isAnalyzingBusiness ? (
                                            <span className="flex items-center gap-2">
                                                {language === 'uz' ? 'Tahlil qilinmoqda...' : 'Analyzing...'}
                                            </span>
                                        ) : step === 6 ? (
                                            language === 'uz' ? 'YARATISH' : 'CREATE STORE'
                                        ) : (
                                            t('next')
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
