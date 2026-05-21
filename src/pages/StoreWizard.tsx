import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Settings, MapPin, FileSignature, Check, Upload, AlertCircle, Sparkles, Loader2, Download, LayoutTemplate, Eye, X, FolderCheck, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabaseApi } from '../services/supabaseService';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Input';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { SignaturePad, SignaturePadRef } from '../components/SignaturePad';
import { ContractPreview } from '../components/ContractPreview';
import { LocationPicker } from '../components/LocationPicker';
import { Language } from '../i18n/translations';
import { extractColorsFromImage } from '../utils/colorExtractor';

interface StoreWizardProps {
    onComplete: (storeId: number, storeName: string) => void;
}

const templates = [
    { id: 'clothing', type: 'clothing', image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e12?auto=format&fit=crop&q=80&w=1200' },
    { id: 'grocery', type: 'grocery', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200' },
    { id: 'electronics', type: 'electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=1200' },
    { id: 'restaurant', type: 'restaurant', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200' },
    { id: 'bakery', type: 'bakery', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1200' },
    { id: 'furniture', type: 'furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200' },
    { id: 'beauty', type: 'beauty', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200' },
    { id: 'home', type: 'home', image: 'https://images.unsplash.com/photo-1513584684374-8bdb74838a0f?auto=format&fit=crop&q=80&w=1200' },
    { id: 'services', type: 'services', image: 'https://images.unsplash.com/photo-1454165833767-02a698d58745?auto=format&fit=crop&q=80&w=1200' },
];

export function StoreWizard({ onComplete }: StoreWizardProps) {
    const { t, language, addStore, setLanguage } = useApp();
    const { refreshUser, user } = useAuth();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [createdStoreId, setCreatedStoreId] = useState<number | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Color Theme
    const colorCombinations = [
        { id: 'indigo', name: 'Indigo (Asosiy)', primary: '#6366F1', primaryDark: '#4f46e5', secondary: '#059669' },
        { id: 'korzinka', name: 'Qizil va Sariq', primary: '#E60000', primaryDark: '#CC0000', secondary: '#FFB800' },
        { id: 'makro', name: 'Yashil va Siyohrang', primary: '#00C48C', primaryDark: '#00A375', secondary: '#7000FF' },
        { id: 'ocean', name: 'Havorang va Pushti', primary: '#0EA5E9', primaryDark: '#0284C7', secondary: '#F43F5E' },
        { id: 'dark', name: 'Qora va Tilla', primary: '#0F172A', primaryDark: '#000000', secondary: '#EAB308' },
    ];
    const [selectedTheme, setSelectedTheme] = useState(colorCombinations[0]);

    // Step 1: Identity & Type
    const [businessType, setBusinessType] = useState<'restoran' | 'onlayn_dokon' | 'computer_club' | 'tour_firma'>('onlayn_dokon');
    const [businessCategory, setBusinessCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [platform, setPlatform] = useState<'telegram' | 'veb_sayt'>('telegram');
    const [storeName, setStoreName] = useState('');
    const [storeSlug, setStoreSlug] = useState('');
    const [description, setDescription] = useState('');

    // Step 2: Template
    const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
    const [previewModal, setPreviewModal] = useState<string | null>(null);

    const [isAnalyzingBusiness, setIsAnalyzingBusiness] = useState(false);
    const [complianceResult, setComplianceResult] = useState<{ is_allowed: boolean; reason: string; suggested_features: string[]; suggested_category: string; summary: string } | null>(null);

    // Step 5: Catalog
    const [catalogMode, setCatalogMode] = useState(false);
    const [defaultLang, setDefaultLang] = useState<Language>('uz');

    // Step 7: Location
    const [branchName, setBranchName] = useState('');
    const [branchPhone, setBranchPhone] = useState('+998 ');
    const [deliveryFee, setDeliveryFee] = useState('');
    const [pickupAddress, setPickupAddress] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    // Step 8: Telegram
    const [botToken, setBotToken] = useState('');
    const [chatId, setChatId] = useState('');

    // Step 9: Contract
    const [telegramUsername, setTelegramUsername] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [signatureData, setSignatureData] = useState('');
    // Computer Club Setup
    const [pcCount, setPcCount] = useState('20');
    const [zoneConfig, setZoneConfig] = useState({
        general: { price: '5000', count: '15' },
        vip: { price: '10000', count: '5' }
    });
    const [morningPackage, setMorningPackage] = useState({ price: '15000', duration: '180' });
    const [nightPackage, setNightPackage] = useState({ price: '35000', duration: '600' });

    const signaturePadRef = useRef<SignaturePadRef>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatPhoneNumber = (value: string) => {
        // Remove all non-digits except +
        const digits = value.replace(/[^\d+]/g, '');

        // Ensure it starts with +998
        let result = digits;
        if (!result.startsWith('+998')) {
            result = '+998' + result.replace(/^\+?998?/, '');
        }

        // Apply mask: +998 (XX) XXX-XX-XX
        const match = result.match(/^\+998(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})$/);
        if (match) {
            let formatted = '+998';
            if (match[1]) formatted += ` (${match[1]}`;
            if (match[1].length === 2) formatted += ')';
            if (match[2]) formatted += ` ${match[2]}`;
            if (match[2].length === 3) formatted += '-';
            if (match[3]) formatted += `${match[3]}`;
            if (match[3].length === 2) formatted += '-';
            if (match[4]) formatted += `${match[4]}`;
            return formatted.trim();
        }

        return result.slice(0, 19); // Fallback limit
    };

    // Colors are now fixed based on Default Site theme
    const primaryColor = '#6366F1';
    const secondaryColor = '#F43F5E';

    useEffect(() => {
        const root = document.documentElement;
        const originalPrimary = root.style.getPropertyValue('--brand-primary');
        const originalSecondary = root.style.getPropertyValue('--brand-secondary');
        const originalGlow = root.style.getPropertyValue('--brand-primary-glow');

        root.style.setProperty('--brand-primary', primaryColor);
        root.style.setProperty('--brand-secondary', secondaryColor);
        root.style.setProperty('--brand-primary-glow', `${primaryColor}40`);

        return () => {
            if (originalPrimary) root.style.setProperty('--brand-primary', originalPrimary);
            if (originalSecondary) root.style.setProperty('--brand-secondary', originalSecondary);
            if (originalGlow) root.style.setProperty('--brand-primary-glow', originalGlow);
        };
    }, []);

    const steps = [
        { num: 1, title: t('identity'), icon: Store },
        { num: 2, title: t('template'), icon: LayoutTemplate },
        { num: 3, title: t('aiAnalysis'), icon: Sparkles },
        { num: 4, title: t('catalogSettings'), icon: Settings },
        { num: 5, title: t('identity'), icon: Upload },
        { num: 6, title: t('locationPickup'), icon: MapPin },
        { num: 8, title: t('signContract'), icon: FileSignature },
    ];

    const handleNext = async () => {
        if (step === 1) {
            if (!storeName || (businessType === 'computer_club' && (!businessCategory || (businessCategory === 'other' && !customCategory)))) {
                setError(t('pleaseFillRequiredFields') || 'Iltimos, barcha maydonlarni to\'ldiring');
                return;
            }
            setError('');
            if (businessType === 'computer_club') setStep(1.5);
            else setStep(2);
            return;
        }

        if (step === 1.5) {
            setStep(2);
            return;
        }

        if (step === 3) {
            setStep(4);
            return;
        }

        // Skip step 7 (Telegram bot) - go directly from 6 to 8
        if (step === 6) { setStep(8); return; }

        if (step < 8) setStep(step + 1);
        else handleComplete();
    };

    const handleComplete = async () => {
        if (!agreeToTerms || !signatureData) {
            setError(t('signatureRequired'));
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Create store via API
            let data: any;
            const slug = storeSlug || storeName.toLowerCase().replace(/\s+/g, '-');
            // Map frontend categories to valid backend BUSINESS_TYPE_CHOICES
            const backendTypeMap: Record<string, string> = {
                grocery: 'grocery', clothing: 'clothing', electronics: 'electronics',
                restaurant: 'restaurant', bakery: 'bakery', beauty: 'beauty',
                home: 'home', services: 'services',
                // Map sub-categories to closest backend type
                accessories: 'other', auto_parts: 'other', pet_products: 'other',
                drinks: 'grocery', bookstore: 'other', appliances: 'electronics',
                shoes: 'clothing', sport: 'other', furniture: 'home',
                construction: 'other', pharmacy: 'other', toys: 'other',
                dark_kitchen: 'restaurant', fast_food: 'restaurant', cafe: 'restaurant',
                restoran: 'restaurant', computer_club: 'computer_club'
            };
            const rawCategory = businessCategory === 'other' ? customCategory : businessCategory;
            const finalBusinessType = businessType === 'computer_club' 
                ? 'computer_club' 
                : businessType === 'tour_firma'
                    ? 'tour_firma'
                    : backendTypeMap[rawCategory] || 'other';

            const storeData = {
                name: storeName,
                slug: slug,
                business_type: finalBusinessType || 'other',
                owner_id: user?.id,
                status: 'pending',
                default_language: defaultLang
            };

            const createdStore = await supabaseApi.stores.create(storeData);
            const response = { data: createdStore };

            // Auto-generate Default Site HTML files for this store locally via Vite plugin
            try {
                await fetch('/api/create-site', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        storeName: storeName,
                        storeSlug: slug,
                        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
                        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
                        primaryColor: selectedTheme.primary,
                        primaryDark: selectedTheme.primaryDark,
                        secondaryColor: selectedTheme.secondary
                    })
                });
            } catch (siteErr) {
                console.warn('Default site generation skipped:', siteErr);
            }

            // Computer Club Provisioning
            if (finalBusinessType === 'computer_club') {
                // Create General Zone
                const generalZone = await supabaseApi.club.zones.create({
                    store_id: createdStore.id,
                    name: 'General Hall',
                    hourly_price: parseFloat(zoneConfig.general.price)
                });
                
                // Create VIP Zone
                const vipZone = await supabaseApi.club.zones.create({
                    store_id: createdStore.id,
                    name: 'VIP Zone',
                    hourly_price: parseFloat(zoneConfig.vip.price)
                });

                // Create Devices for General Hall
                const genCount = parseInt(zoneConfig.general.count) || 0;
                for (let i = 1; i <= genCount; i++) {
                    await supabaseApi.club.devices.create({
                        store_id: createdStore.id,
                        zone_id: generalZone.id,
                        name: `PC-${String(i).padStart(2, '0')}`,
                        status: 'available'
                    });
                }

                // Create Devices for VIP Zone
                const vipCount = parseInt(zoneConfig.vip.count) || 0;
                for (let i = 1; i <= vipCount; i++) {
                    await supabaseApi.club.devices.create({
                        store_id: createdStore.id,
                        zone_id: vipZone.id,
                        name: `VIP-${String(i).padStart(2, '0')}`,
                        status: 'available'
                    });
                }

                // Create Packages
                await supabaseApi.club.tariffs.create({
                    store_id: createdStore.id,
                    zone_id: generalZone.id,
                    name: 'Morning Package',
                    price: parseFloat(morningPackage.price),
                    duration_minutes: parseInt(morningPackage.duration)
                });

                await supabaseApi.club.tariffs.create({
                    store_id: createdStore.id,
                    zone_id: generalZone.id,
                    name: 'Night Package',
                    price: parseFloat(nightPackage.price),
                    duration_minutes: parseInt(nightPackage.duration)
                });
            }

            // Trigger Edge Function for provisioning
            try {
                const { supabase } = await import('../supabase');
                await supabase.functions.invoke('site-provisioner', {
                    body: { storeId: createdStore.id }
                });
            } catch (invokeErr) {
                console.error('Edge Function invocation failed:', invokeErr);
            }

            // Refresh user role (from customer to store_admin)
            await refreshUser();

            // Save store ID for contract download
            setCreatedStoreId(response.data.id);

            // Add to local context using the actual data from server
            addStore(response.data);

            setStep(9); // Success step
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
                        errorMessage = t('errorStoreSlugExists');
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

            // Colors are fixed - no dynamic extraction needed
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[var(--text-primary)] flex items-center justify-center p-4 selection:bg-[var(--brand-primary)]/10 font-sans">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[130px] rounded-full"
                    style={{ backgroundColor: `${primaryColor}33` }}
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[130px] rounded-full"
                    style={{ backgroundColor: `${secondaryColor}26` }}
                />
            </div>

            <div className="absolute top-4 right-4 z-[10000]">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-4xl relative z-10">
                {/* Progress Steps */}
                {step < 10 && (
                    <div className="mb-8 overflow-x-auto hide-scrollbar pb-4 px-2">
                        <div className="flex items-center min-w-max justify-between relative px-2">
                            <div className="absolute left-10 right-10 top-5 h-[2px] bg-[var(--color-border)] -translate-y-1/2 z-0" />
                            <div
                                className="absolute left-10 top-5 h-[3px] bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] -translate-y-1/2 z-0 transition-all duration-700 shadow-[0_0_15px_var(--brand-primary-glow)]"
                                style={{ width: `${Math.max(0, ((step - 1) / (steps.length - 1)) * 100)}%` }}
                            />
                            {steps.map((s) => (
                                <div key={s.num} className="relative z-10 flex flex-col items-center w-16 sm:w-20">
                                    <motion.div
                                        animate={{
                                            scale: step === s.num ? 1.2 : 1,
                                            backgroundColor: step > s.num ? 'var(--brand-primary)' : 'white',
                                            borderColor: step >= s.num ? 'var(--brand-primary)' : 'var(--color-border)'
                                        }}
                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white border-2 backdrop-blur-md transition-shadow duration-300"
                                        style={{
                                            boxShadow: step === s.num ? '0 0 20px var(--brand-primary-glow)' : 'none',
                                            color: step > s.num ? 'white' : step === s.num ? 'var(--brand-primary)' : 'var(--text-muted)'
                                        }}
                                    >
                                        {step > s.num ? <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} /> : <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    </motion.div>
                                    <span className={`mt-3 text-[8px] sm:text-[9px] font-black uppercase tracking-tight text-center leading-tight whitespace-pre-wrap ${step >= s.num ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}`}>
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
                        className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden text-left border border-[var(--color-border)] shadow-2xl shadow-slate-200/50"
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-primary)]" />

                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('createYourStore')}</h2>
                                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">{t('storeBasicsSubtitle')}</p>
                                </div>

                                <Input
                                    label={t('storeName')}
                                    value={storeName}
                                    onChange={(v) => {
                                        setStoreName(v);
                                        setStoreSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                                    }}
                                    placeholder={t('storeNamePlaceholder')}
                                    required
                                />

                                 <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">{t('businessType')}</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'onlayn_dokon', label: t('onlayn_dokon') || 'Onlayn do\'kon' },
                                            { id: 'restoran', label: t('restoran') || 'Restoran' },
                                            { id: 'computer_club', label: 'Kompyuter klub' },
                                            { id: 'tour_firma', label: 'Tur Firma' }
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => {
                                                    setBusinessType(type.id as any);
                                                    setBusinessCategory('');
                                                }}
                                                className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${businessType === type.id ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${businessType === type.id ? 'border-indigo-600' : 'border-slate-300'}`}>
                                                    {businessType === type.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                                                </div>
                                                <span className="font-bold text-sm text-slate-700">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>


                                {/* Platform is always Web - no selector needed */}

                                {businessType !== 'computer_club' && businessType !== 'tour_firma' && (
                                    <>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">{t('businessCategory')}</label>
                                            <select
                                                value={businessCategory}
                                                onChange={(e) => setBusinessCategory(e.target.value)}
                                                className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-indigo-600 focus:outline-none font-bold text-sm transition-all"
                                            >
                                                <option value="">{t('selectCategory') || 'Toifani tanlang'}</option>
                                                {businessType === 'restoran' ? (
                                                    <>
                                                        <option value="dark_kitchen">{t('darkKitchen')}</option>
                                                        <option value="fast_food">{t('fastFood')}</option>
                                                        <option value="cafe">{t('cafe')}</option>
                                                        <option value="restoran">{t('restoran')}</option>
                                                        <option value="other">{t('other')}</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="accessories">{t('accessories')}</option>
                                                        <option value="auto_parts">{t('autoParts')}</option>
                                                        <option value="electronics">{t('electronics')}</option>
                                                        <option value="beauty">{t('beauty')}</option>
                                                        <option value="pet_products">{t('petProducts')}</option>
                                                        <option value="drinks">{t('drinks')}</option>
                                                        <option value="bookstore">{t('bookstore')}</option>
                                                        <option value="clothing">{t('clothing')}</option>
                                                        <option value="appliances">{t('appliances')}</option>
                                                        <option value="grocery">{t('grocery')}</option>
                                                        <option value="shoes">{t('shoes')}</option>
                                                        <option value="sport">{t('sport')}</option>
                                                        <option value="home">{t('home')}</option>
                                                        <option value="other">{t('other')}</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>

                                        {businessCategory === 'other' && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                                <Input
                                                    label={t('otherCustom')}
                                                    value={customCategory}
                                                    onChange={setCustomCategory}
                                                    placeholder={t('otherCustomPlaceholder') || 'O\'zingiz kiriting...'}
                                                    required
                                                />
                                            </motion.div>
                                        )}
                                    </>
                                )}

                                <Input
                                    label={t('storeSlug')}
                                    value={storeSlug}
                                    onChange={setStoreSlug}
                                    placeholder={t('storeSlugPlaceholder')}
                                    helper={`${storeSlug || 'your-store'}.savdogar.vercel.app`}
                                    className="font-mono text-sm"
                                    required
                                />
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
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('selectTemplate')}</h2>
                                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">{t('templatesReady')}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates
                                        .filter(tpl => businessType === 'restoran' ? tpl.type === 'restaurant' || tpl.type === 'bakery' : tpl.type !== 'restaurant')
                                        .map(tpl => (
                                            <div key={tpl.id} className={`group rounded-[2rem] overflow-hidden border-2 transition-all duration-300 ${selectedTemplate.id === tpl.id ? 'border-indigo-600 shadow-xl' : 'border-slate-100 hover:border-slate-300'}`}>
                                                <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                                                    <img src={tpl.image} alt={t(tpl.id)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                        <button onClick={() => setPreviewModal(tpl.image)} className="px-4 py-2 rounded-xl bg-white/90 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:scale-105 transition-all flex items-center gap-2 shadow-xl">
                                                            <Eye size={14} /> {t('preview')}
                                                        </button>
                                                        <button onClick={() => setSelectedTemplate(tpl)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2 shadow-xl">
                                                            <Check size={14} /> {t('select')}
                                                        </button>
                                                    </div>
                                                    {selectedTemplate.id === tpl.id && (
                                                        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                                                            <Check size={16} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 bg-white cursor-pointer" onClick={() => setSelectedTemplate(tpl)}>
                                                    <h3 className="text-md font-black text-slate-900 uppercase tracking-tighter">{t(tpl.id)}</h3>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('customizeColors')}</h2>
                                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">{t('chooseColorsForBrand')}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('primaryColor')}</label>
                                            <div className="flex items-center gap-4 p-3 border border-slate-100 rounded-2xl bg-slate-50">
                                                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0" />
                                                <span className="font-mono text-sm font-bold text-slate-700">{primaryColor}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('secondaryColor')}</label>
                                            <div className="flex items-center gap-4 p-3 border border-slate-100 rounded-2xl bg-slate-50">
                                                <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0" />
                                                <span className="font-mono text-sm font-bold text-slate-700">{secondaryColor}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-[2rem] flex flex-col items-center justify-center border-2 border-slate-100/50" style={{ backgroundColor: `${primaryColor}08` }}>
                                        <div className="w-full rounded-2xl bg-white shadow-xl p-6 text-center">
                                            <h3 className="text-xl font-black uppercase tracking-tighter" style={{ color: primaryColor }}>{t('preview')}</h3>
                                            <button className="mt-4 w-full py-3 rounded-xl text-white font-black text-[10px] uppercase shadow-lg" style={{ backgroundColor: primaryColor }}>{t('buyNow')}</button>
                                            <div className="mt-3 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase" style={{ backgroundColor: `${secondaryColor}15`, color: secondaryColor }}>{t('discount')} -20%!</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}






                        {step === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-main)]">{t('catalogSettings')}</h2>
                                    <p className="text-[var(--text-dim)] mt-1">{t('configureStoreBehavior')}</p>
                                </div>
                                <div
                                    onClick={() => setCatalogMode(!catalogMode)}
                                    className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${catalogMode ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                                >
                                    <div className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${catalogMode ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-300 text-transparent'}`}>
                                        <Check className="w-4 h-4" strokeWidth={4} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--text-primary)] uppercase tracking-tight">{t('catalogModeTitle')}</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-1 font-medium leading-relaxed">
                                            {t('catalogModeSubtitle')}
                                        </p>
                                    </div>
                                </div>
                                {!catalogMode && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-amber-50 border border-amber-100 space-y-4">
                                        <div>
                                            <p className="font-bold text-amber-900 uppercase tracking-tight text-sm">{t('ordersAndDelivery')}</p>
                                            <p className="text-xs text-amber-700 mt-1 font-medium">{t('deliveryFeeNotice')}</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-amber-200">
                                            <span className="pl-3 text-slate-400 font-bold text-sm">{t('currency') || 'UZS'}</span>
                                            <input
                                                type="number"
                                                value={deliveryFee}
                                                onChange={(e) => setDeliveryFee(e.target.value)}
                                                placeholder={t('deliveryFeePlaceholder')}
                                                className="w-full p-2 text-sm font-bold focus:outline-none"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                                <div className="space-y-1.5 text-left">
                                    <label className="block text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">{t('defaultLanguage')}</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(['uz', 'ru'] as Language[]).map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => setDefaultLang(lang)}
                                                className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center ${defaultLang === lang ? 'bg-indigo-50 border-[var(--brand-primary)] scale-[1.02]' : 'bg-[var(--color-surface-raised)] border-transparent hover:border-[var(--brand-primary)]/30 text-[var(--text-muted)]'}`}
                                            >
                                                <span className="text-3xl mb-3 block">{lang === 'uz' ? '🇺🇿' : '🇷🇺'}</span>
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${defaultLang === lang ? 'text-[var(--brand-primary)]' : 'text-[var(--text-dim)]'}`}>{t(lang === 'uz' ? 'uzbek' : 'russian')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-main)]">{t('uploadLogoTitle')}</h2>
                                    <p className="text-[var(--text-dim)] mt-1">{t('uploadLogoDesc')}</p>
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <input type="file" ref={fileInputRef} onChange={onLogoChange} accept="image/*" className="hidden" />
                                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)] rounded-3xl p-10 text-center hover:border-[var(--brand-primary)]/50 hover:bg-[var(--brand-primary)]/5 transition-all cursor-pointer group relative overflow-hidden min-h-[140px] flex flex-col items-center justify-center">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo preview" className="max-h-28 rounded-xl object-contain shadow-lg" />
                                        ) : (
                                            <>
                                                <div className="p-4 rounded-full bg-white shadow-sm mb-4"><Upload className="w-8 h-8 text-[var(--brand-primary)]" /></div>
                                                <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('clickToUpload')}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <div>
                                        <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest mb-1">Veb-sayt Ranglari</h3>
                                        <p className="text-xs text-[var(--text-muted)]">Do'koningiz interfeysi qaysi ranglarda bo'lishini tanlang.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {colorCombinations.map((theme) => (
                                            <div
                                                key={theme.id}
                                                onClick={() => setSelectedTheme(theme)}
                                                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${selectedTheme.id === theme.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-8 h-8 rounded-full shadow-sm border-2 border-white z-10" style={{ backgroundColor: theme.primary }}></div>
                                                        <div className="w-8 h-8 rounded-full shadow-sm border-2 border-white" style={{ backgroundColor: theme.secondary }}></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{theme.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 6 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-main)]">{t('locationPickup')}</h2>
                                    <p className="text-[var(--text-dim)] mt-1">{t('pickupHelper')}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input label={t('branchName')} value={branchName} onChange={setBranchName} placeholder={t('branchNamePlaceholder')} required />
                                    <Input
                                        label={t('branchPhone')}
                                        value={branchPhone}
                                        onChange={(v) => setBranchPhone(formatPhoneNumber(v))}
                                        placeholder="+998 (90) 123-45-67"
                                        required
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest px-1 flex items-center gap-2">
                                        {t('selectLocationOnMap')}
                                    </label>
                                    <LocationPicker
                                        initialLat={latitude ? parseFloat(latitude) : undefined}
                                        initialLng={longitude ? parseFloat(longitude) : undefined}
                                        onLocationSelect={(lat, lng, addr) => {
                                            setLatitude(lat.toString());
                                            setLongitude(lng.toString());
                                            if (addr) setPickupAddress(addr);
                                        }}
                                    />
                                </div>
                                <Input label={t('pickupAddress')} value={pickupAddress} onChange={setPickupAddress} placeholder={t('pickupAddressPlaceholder')} />
                            </div>
                        )}

                        {step === 7 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-main)]">{t('telegramIntegration')}</h2>
                                    <p className="text-[var(--text-dim)] mt-1">{t('telegramHelper')}</p>
                                </div>
                                <Input label={t('botToken')} value={botToken} onChange={setBotToken} placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ" />
                                <Input label={t('chatId')} value={chatId} onChange={setChatId} placeholder="@your_channel or 123456789" />
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider text-center">💡 {t('setupLater')}</p>
                                </div>
                            </div>
                        )}

                        {step === 8 && (
                            <div className="space-y-6 text-left">
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-main)]">{t('signContract')}</h2>
                                    <p className="text-[var(--text-dim)] mt-1">{t('confirmContract')}</p>
                                </div>

                                <Input label={t('telegramUsername')} value={telegramUsername} onChange={(v) => { if (v && !v.startsWith('@')) setTelegramUsername('@' + v); else setTelegramUsername(v); }} placeholder={t('telegramUsernamePlaceholder')} required />

                                <ContractPreview onAgree={setAgreeToTerms} agreed={agreeToTerms} />

                                {agreeToTerms && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                                        <SignaturePad ref={signaturePadRef} onSign={handleSignature} nameForGeneration={storeName} label={t('yourElectronicSignature')} />
                                        {signatureData && (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <Check className="w-5 h-5" />
                                                <span className="text-sm font-medium">{t('signatureAccepted')}</span>
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
                            </div>
                        )}

                        {step === 9 && (
                            <div className="text-center py-8">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5 }} className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                                    <Check className="w-12 h-12 text-emerald-500" strokeWidth={3} />
                                </motion.div>
                                <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">{t('pendingApprovalTitle')}</h2>

                                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 mb-8 max-w-md mx-auto text-left shadow-2xl overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-50" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                                <FolderCheck className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm tracking-tight">{t('filesystemSyncComplete') || 'Filesystem Sync Complete'}</p>
                                                <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">sites/{storeSlug}/</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 font-mono text-[9px]">
                                            <div className="flex items-center gap-2 text-emerald-400/80">
                                                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                                <span>Replicating Default Site structure...</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-emerald-400/80">
                                                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                                <span>Injecting {storeName} metadata...</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-emerald-400/80">
                                                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                                <span>Deploying HTML/CSS assets...</span>
                                            </div>
                                        </div>

                                        <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                            <code className="text-[10px] text-indigo-400 font-mono truncate mr-2">
                                                /sites/{storeSlug}/index.html
                                            </code>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[8px] font-bold text-emerald-500">LIVE</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    {createdStoreId && (
                                        <button onClick={async () => { if (!createdStoreId) return; try { const { supabaseApi } = await import('../services/supabaseService'); const response = await supabaseApi.stores.downloadContract(createdStoreId); const url = window.URL.createObjectURL(new Blob([response.data])); const link = document.createElement('a'); link.href = url; link.setAttribute('download', `contract_${storeSlug}.pdf`); document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url); } catch (err) { console.error('Contract download failed:', err); } }} className="flex items-center gap-2 px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">
                                            <Download className="w-4 h-4" /> {t('downloadContract')}
                                        </button>
                                    )}
                                    <Button onClick={() => {
                                        if (defaultLang) setLanguage(defaultLang);
                                        onComplete(createdStoreId || 0, storeName);
                                    }} size="lg" className="px-10 py-5 shadow-xl shadow-indigo-600/30" disabled={!createdStoreId}>{t('goToDashboard')}</Button>
                                </div>
                            </div>
                        )}

                        {step < 9 && (
                            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                                <Button variant="ghost" onClick={() => {
                                    if (step === 2 && businessType === 'computer_club') setStep(1.5);
                                    else if (step === 1.5) setStep(1);
                                    else if (step === 8) setStep(6); // skip step 7 (bot)
                                    else setStep(step - 1);
                                }} disabled={step === 1 || isSubmitting} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                                    ← {t('back')}
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={
                                        isSubmitting || isAnalyzingBusiness ||
                                        (step === 1 && !storeName) ||
                                        (step === 8 && (!agreeToTerms || !signatureData))
                                    }
                                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 font-bold tracking-wider"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('submitting')}</span>
                                    ) : isAnalyzingBusiness ? (
                                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('analyzing')}</span>
                                    ) : step === 8 ? (
                                        t('create')
                                    ) : (
                                        <span className="flex items-center gap-2">{t('next')} →</span>
                                    )}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Template Preview Modal */}
            <AnimatePresence>
                {previewModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-10" onClick={() => setPreviewModal(null)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative w-full max-w-5xl max-h-[90vh] rounded-[3rem] overflow-hidden bg-white shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setPreviewModal(null)} className="absolute top-6 right-6 z-50 w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>

                            {/* Sidebar Info */}
                            <div className="w-full md:w-80 p-8 border-r border-slate-100 flex flex-col justify-between bg-slate-50/50">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
                                        <LayoutTemplate size={24} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                                        {t(templates.find(t => t.image === previewModal)?.id || '')}
                                    </h3>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-4">{t('templateFeatures')}</p>
                                    <ul className="mt-4 space-y-3">
                                        {[t('premiumDesign'), t('mobileResponsive'), t('fastLoading'), t('aiAssistant')].map(item => (
                                            <li key={item} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    onClick={() => {
                                        const tpl = templates.find(t => t.image === previewModal);
                                        if (tpl) setSelectedTemplate(tpl);
                                        setPreviewModal(null);
                                        if (step === 1) setStep(2);
                                    }}
                                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check size={18} /> {t('select')}
                                </button>
                            </div>

                            {/* Live Mock View */}
                            <div className="flex-1 bg-slate-100 p-8 overflow-auto flex items-center justify-center">
                                <div className="w-full max-w-[320px] aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-[8px] border-slate-900 overflow-hidden relative">
                                    {/* Mock Status Bar */}
                                    <div className="h-6 bg-slate-900 w-full flex items-center justify-center">
                                        <div className="w-16 h-4 bg-black rounded-full" />
                                    </div>

                                    {/* Mock Content */}
                                    <div className="h-full overflow-y-auto hide-scrollbar pb-10 bg-[#F5F6FA]">
                                        {/* Mock Header */}
                                        <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-10">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                                                {storeName ? storeName[0] : 'S'}
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="w-5 h-5 text-slate-400"><Search size={16} /></div>
                                                <div className="w-5 h-5 text-slate-400 relative">
                                                    <ShoppingCart size={16} />
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 rounded-full border border-white" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mock Hero (Actual Default Site Style) */}
                                        <div className="p-3">
                                            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 relative overflow-hidden text-white">
                                                <div className="relative z-10">
                                                    <div className="text-[8px] font-bold uppercase tracking-widest opacity-70 mb-2">Yangi Kolleksiya 2024</div>
                                                    <div className="text-lg font-black leading-tight mb-2 uppercase italic">{storeName || 'Sizning Do\'kon'}</div>
                                                    <div className="text-[10px] opacity-80 mb-4 line-clamp-2">Eng so'nggi trendlar va eksklyuziv dizaynlar.</div>
                                                    <div className="inline-block px-4 py-2 bg-white text-indigo-600 text-[10px] font-black rounded-full shadow-lg">Xarid Qilish →</div>
                                                </div>
                                                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full" />
                                            </div>
                                        </div>

                                        {/* Category Chips */}
                                        <div className="px-3 py-2 flex gap-2 overflow-hidden">
                                            <div className="px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full">Barchasi</div>
                                            <div className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded-full whitespace-nowrap">Erkaklar</div>
                                            <div className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded-full whitespace-nowrap">Ayollar</div>
                                        </div>

                                        {/* Mock Grid (Default Site Style) */}
                                        <div className="p-3 grid grid-cols-2 gap-3">
                                            {[
                                                { name: "Sport krossovkasi", emoji: "👟", price: "890,000" },
                                                { name: "Yozgi ko'ylak", emoji: "👗", price: "450,000" },
                                                { name: "Bolalar kiyimi", emoji: "🧒", price: "320,000" },
                                                { name: "Sport shimlar", emoji: "🩳", price: "560,000" }
                                            ].map((p, i) => (
                                                <div key={i} className="bg-white rounded-2xl p-2 border border-slate-100 shadow-sm">
                                                    <div className="aspect-square w-full rounded-xl bg-slate-50 flex items-center justify-center text-3xl mb-2">
                                                        {p.emoji}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-800 mb-1 truncate">{p.name}</div>
                                                    <div className="text-[10px] font-black text-indigo-600">{p.price} UZS</div>
                                                    <div className="mt-2 w-full h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[8px] font-bold">
                                                        Savatga
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
