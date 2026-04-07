import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, MessageCircle, Globe, Users, Save, Loader2, Shield, Smartphone, LogOut, Laptop, Monitor, Trash2, Edit, CheckCircle, AlertCircle, X, Plus, Copy, RefreshCw, Eye, EyeOff, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storeApi, authApi, aiApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input, TextArea } from '../../components/Input';
import { Language } from '../../i18n/translations';

import { TwoFactorSetup } from '../../components/TwoFactorSetup';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallBanner } from '../../components/PWAInstallBanner';
import { LocationPicker } from '../../components/LocationPicker';

type SettingsTab = 'general' | 'location' | 'social' | 'working_hours' | 'telegram' | 'sms' | 'localization' | 'currency' | 'billing' | 'roles' | 'security';

interface SettingsPageProps {
  storeId?: number;
  onUpdate?: () => void;
}

export function SettingsPage({ storeId, onUpdate }: SettingsPageProps) {
  const { t, language } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [description, setDescription] = useState('');
  const [businessType, setBusinessType] = useState('electronics');
  const [catalogMode, setCatalogMode] = useState(false);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [telegramWelcome, setTelegramWelcome] = useState('');
  const [telegramWelcomeUz, setTelegramWelcomeUz] = useState('');
  const [telegramWelcomeRu, setTelegramWelcomeRu] = useState('');
  const [twaEnabled, setTwaEnabled] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isTranslatingWelcome, setIsTranslatingWelcome] = useState(false);
  const [defaultLang, setDefaultLang] = useState<Language>('uz');
  const [baseCurrency, setBaseCurrency] = useState<'UZS' | 'USD' | 'RUB'>('UZS');
  const [useAutoRates, setUseAutoRates] = useState(true);
  const [manualRates, setManualRates] = useState({ USD: 12800, RUB: 140 });
  const { user, disable2FA, listSessions, endSession, endAllSessions } = useAuth();
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'store_admin' });
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [rotatingKey, setRotatingKey] = useState(false);
  
  // New operational states
  const [instagramUrl, setInstagramUrl] = useState('');
  const [telegramChannel, setTelegramChannel] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [eskizEmail, setEskizEmail] = useState('');
  const [eskizToken, setEskizToken] = useState('');
  const [workingHours, setWorkingHours] = useState<any>({});
  const [balance, setBalance] = useState(0);
  const [plan, setPlan] = useState('free_trial');

  const loadStore = async () => {
    setLoading(true);
    try {
      const response = await storeApi.get(storeId!);
      const store = response.data;
      setStoreName(store.name);
      setStoreSlug(store.slug);
      setDescription(store.description || '');
      setBusinessType(store.business_type || 'electronics');
      setCatalogMode(store.catalog_mode || false);
      setAddress(store.location_address || '');
      setLatitude(store.location_lat?.toString() || '');
      setLongitude(store.location_lng?.toString() || '');
      setBotToken(store.telegram_bot_token || '');
      setChatId(store.telegram_chat_id || '');
      setTelegramWelcome(store.telegram_welcome || '');
      setTelegramWelcomeUz(store.telegram_welcome_uz || '');
      setTelegramWelcomeRu(store.telegram_welcome_ru || '');
      setTwaEnabled(store.twa_enabled || false);
      setMaintenanceMode(store.maintenance_mode || false);
      setBaseCurrency(store.base_currency || 'UZS');
      setUseAutoRates(store.use_auto_rates ?? true);
      setManualRates(store.manual_exchange_rates || { USD: 12800, RUB: 140 });
      setApiKey(store.api_key || '');
      
      // Load new fields
      setInstagramUrl(store.instagram_url || '');
      setTelegramChannel(store.telegram_channel || '');
      setFacebookUrl(store.facebook_url || '');
      setWebsiteUrl(store.website_url || '');
      setYoutubeUrl(store.youtube_url || '');
      setTiktokUrl(store.tiktok_url || '');
      setWhatsappNumber(store.whatsapp_number || '');
      setPhone(store.phone || '');
      setEmail(store.email || '');
      setEskizEmail(store.eskiz_email || '');
      setEskizToken(store.eskiz_token || '');
      setWorkingHours(store.working_hours || {});
      setBalance(store.balance || 0);
      setPlan(store.plan || 'free_trial');
    } catch (error) {
      console.error('Failed to load store settings:', error);
    }
    setLoading(false);
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
    setLoadingSessions(false);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await authApi.listUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
    setLoadingUsers(false);
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await authApi.deleteUser(id);
      setNotification({ type: 'success', message: language === 'uz' ? "Foydalanuvchi o'chirildi" : "User deleted successfully" });
      loadUsers();
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Failed to delete user:', error);
      setNotification({ type: 'error', message: language === 'uz' ? "Xatolik yuz berdi" : "Failed to delete user" });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleEditUser = () => {
    // Placeholder for edit functionality
    setNotification({ type: 'success', message: language === 'uz' ? "Tahrirlash tez orada qo'shiladi" : "Edit feature coming soon" });
    setNotification({ type: 'success', message: language === 'uz' ? "Tahrirlash tez orada qo'shiladi" : "Edit feature coming soon" });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      setNotification({ type: 'error', message: language === 'uz' ? "Barcha maydonlarni to'ldiring" : "All fields are required" });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      await authApi.createUser(newUser);
      setNotification({ type: 'success', message: language === 'uz' ? "Foydalanuvchi yaratildi" : "User created successfully" });
      setShowAddUserModal(false);
      setNewUser({ username: '', email: '', password: '', role: 'store_admin' });
      loadUsers();
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setNotification({ type: 'error', message: error.response?.data?.error || (language === 'uz' ? "Foydalanuvchi yaratishda xatolik" : "Failed to create user") });
      setTimeout(() => setNotification(null), 3000);
    }
    setIsSaving(false);
  };

  const handleGenerateApiKey = async () => {
    if (!storeId) return;
    if (apiKey && !confirm(t('rotateKeyConfirmation'))) return;

    setRotatingKey(true);
    try {
      const response = await storeApi.generateApiKey(storeId);
      setApiKey(response.data.api_key);
      setNotification({ type: 'success', message: t('apiKeyUpdated') });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Failed to generate API key:', error);
      setNotification({ type: 'error', message: language === 'uz' ? "Xatolik yuz berdi" : "Failed to generate key" });
      setTimeout(() => setNotification(null), 3000);
    }
    setRotatingKey(false);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setNotification({ type: 'success', message: t('copied') });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (storeId) {
      loadStore();
    }
    if (activeTab === 'security') {
      loadSessions();
    }
    if (activeTab === 'roles' && user?.role === 'superadmin') {
      loadUsers();
    }
  }, [storeId, activeTab]);

  const handleSave = async () => {
    if (!storeId) return;
    setIsSaving(true);
    try {
      await storeApi.update(storeId, {
        name: storeName,
        slug: storeSlug,
        description,
        business_type: businessType,
        catalog_mode: catalogMode,
        location_address: address,
        location_lat: latitude ? parseFloat(latitude) : null,
        location_lng: longitude ? parseFloat(longitude) : null,
        telegram_bot_token: botToken,
        telegram_chat_id: chatId,
        telegram_welcome: telegramWelcome,
        telegram_welcome_uz: telegramWelcomeUz,
        telegram_welcome_ru: telegramWelcomeRu,
        twa_enabled: twaEnabled,
        maintenanceMode,
        default_language: defaultLang,
        base_currency: baseCurrency,
        use_auto_rates: useAutoRates,
        manual_exchange_rates: manualRates,
        instagram_url: instagramUrl,
        telegram_channel: telegramChannel,
        facebook_url: facebookUrl,
        website_url: websiteUrl,
        youtube_url: youtubeUrl,
        tiktok_url: tiktokUrl,
        whatsapp_number: whatsappNumber,
        phone,
        email,
        eskiz_email: eskizEmail,
        eskiz_token: eskizToken,
        working_hours: workingHours,
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update store:', error);
    }
    setIsSaving(false);
  };

  const handleTestTelegram = async () => {
    if (!storeId || !botToken || !chatId) return;
    setIsTestingTelegram(true);
    try {
      await storeApi.testTelegram(storeId, { bot_token: botToken, chat_id: chatId });
      alert(language === 'uz' ? 'Test xabari yuborildi!' : 'Тестовое сообщение отправлено!');
    } catch (error: any) {
      console.error('Failed to test telegram:', error);
      alert(error.response?.data?.error || (language === 'uz' ? 'Xatolik yuz berdi' : 'Произошла ошибка'));
    }
    setIsTestingTelegram(false);
  };

  const handleEndSession = async (id: number) => {
    try {
      await endSession(id);
      loadSessions();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleEndAllSessions = async () => {
    if (!confirm(t('logoutAllOthersConfirmation'))) return;
    try {
      await endAllSessions();
      loadSessions();
    } catch (error) {
      console.error('Failed to end all sessions:', error);
    }
  };

  const tabs = [
    { id: 'general' as SettingsTab, label: t('general'), icon: Store },
    { id: 'location' as SettingsTab, label: t('location'), icon: MapPin },
    { id: 'social' as SettingsTab, label: language === 'uz' ? 'Ijtimoiy tarmoqlar' : 'Social Media', icon: Globe },
    { id: 'working_hours' as SettingsTab, label: language === 'uz' ? 'Ish vaqti' : 'Working Hours', icon: RefreshCw },
    { id: 'telegram' as SettingsTab, label: t('telegram'), icon: MessageCircle },
    { id: 'sms' as SettingsTab, label: 'SMS Gateway', icon: Smartphone },
    { id: 'localization' as SettingsTab, label: t('localization'), icon: Globe },
    { id: 'currency' as SettingsTab, label: language === 'uz' ? 'Valyuta' : 'Currency', icon: DollarSign },
    { id: 'billing' as SettingsTab, label: language === 'uz' ? 'To\'lov va balans' : 'Billing & Balance', icon: DollarSign },
    { id: 'roles' as SettingsTab, label: t('roles'), icon: Users },
    { id: 'security' as SettingsTab, label: t('security'), icon: Shield },
  ];

  const businessTypes = ['grocery', 'clothing', 'electronics', 'services', 'restaurant', 'beauty', 'home', 'other'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest">{t('loading') || 'Yuklanmoqda...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight">{t('settings')}</h1>
        <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">{t('manageSettings')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <GlassCard className="p-3 h-fit border-[var(--glass-border)] lg:w-80 shrink-0 overflow-x-auto no-scrollbar bg-[var(--color-surface)] shadow-xl">
          <nav className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-4 px-6 py-4 rounded-[1.25rem] transition-all duration-500 relative group whitespace-nowrap lg:whitespace-normal border ${activeTab === tab.id
                  ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary-glow)] border-[var(--brand-primary)]/20'
                  : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--brand-primary)]/5 border-transparent'
                  }`}
              >
                <tab.icon className={`w-5 h-5 shrink-0 transition-all duration-500 ${activeTab === tab.id ? 'text-[var(--brand-primary)] scale-110' : 'text-current opacity-40 group-hover:opacity-100 group-hover:scale-110'}`} />
                <span className={`font-black text-[11px] uppercase tracking-[0.15em] transition-all ${activeTab === tab.id ? 'translate-x-1' : ''}`}>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeSettingTab"
                    className="absolute left-0 w-1.5 h-6 bg-[var(--brand-primary)] rounded-full hidden lg:block"
                    style={{ left: '-1px' }}
                  />
                )}
              </button>
            ))}
          </nav>
        </GlassCard>

        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {activeTab === 'general' && (
              <GlassCard className="p-8 sm:p-10 border-[var(--glass-border)] bg-[var(--color-surface)] shadow-2xl">
                <div className="mb-10 border-b border-[var(--glass-border)] pb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{t('general')}</h2>
                    <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">{t('storeDetailsHelper')}</p>
                  </div>
                  {/* AI Stylist integration here could be added if needed, but App.tsx handles it mostly */}
                </div>
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">{t('storeName')}</label>
                      <Input
                        value={storeName}
                        onChange={setStoreName}
                        className="!rounded-[1.25rem] !bg-[var(--bg-surface)] !border-[var(--glass-border)] focus:!border-[var(--brand-primary)]/50 !py-4 font-bold"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">{t('storeSlug')}</label>
                      <Input
                        value={storeSlug}
                        onChange={setStoreSlug}
                        helper={`${storeSlug}.savdoon.uz`}
                        className="!rounded-[1.25rem] !bg-[var(--bg-surface)] !border-[var(--glass-border)] focus:!border-[var(--brand-primary)]/50 !py-4 font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">{t('shortDescription')}</label>
                    <TextArea
                      value={description}
                      onChange={setDescription}
                      rows={4}
                      className="!bg-[var(--bg-surface)] !border-[var(--glass-border)] focus:!border-[var(--brand-primary)]/50 !rounded-[1.25rem] !p-5 text-sm font-medium leading-relaxed"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">{t('businessType')}</label>
                    <div className="relative">
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full px-5 py-4 rounded-[1.25rem] border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/50 transition-all duration-300 font-bold text-sm appearance-none"
                      >
                        {businessTypes.map((type) => (
                          <option key={type} value={type} className="bg-[var(--color-surface-raised)] font-bold">{t(type)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-start gap-6 p-8 rounded-[2rem] bg-[var(--brand-primary)]/5 border border-[var(--glass-border)] hover:bg-[var(--brand-primary)]/10 transition-all duration-500 group">
                    <div className="relative inline-flex items-center cursor-pointer mt-1">
                      <input type="checkbox" checked={catalogMode} onChange={(e) => setCatalogMode(e.target.checked)} className="sr-only peer" id="catalog-mode" />
                      <div
                        onClick={() => setCatalogMode(!catalogMode)}
                        className={`w-12 h-6 rounded-full transition-all duration-500 relative cursor-pointer ${catalogMode ? 'bg-[var(--brand-primary)]' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-lg ${catalogMode ? 'left-[26px]' : 'left-[2px]'}`} />
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-[var(--text-main)] text-[10px] uppercase tracking-widest">{t('catalogModeOnly')}</p>
                      <p className="text-[10px] sm:text-xs text-[var(--text-dim)] mt-2 leading-relaxed font-bold">{t('catalogModeHelper')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-all duration-500 group">
                    <div className="relative inline-flex items-center cursor-pointer mt-1">
                      <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="sr-only peer" />
                      <div
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        className={`w-12 h-6 rounded-full transition-all duration-500 relative cursor-pointer ${maintenanceMode ? 'bg-amber-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-lg ${maintenanceMode ? 'left-[26px]' : 'left-[2px]'}`} />
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-[var(--text-main)] text-[10px] uppercase tracking-widest flex items-center gap-2">
                        {t('maintenanceModeTitle')}
                        {maintenanceMode && <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                      </p>
                      <p className="text-[10px] sm:text-xs text-[var(--text-dim)] mt-2 leading-relaxed font-bold">
                        {t('maintenanceModeDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[200px] rounded-[1.25rem] h-14 font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-[var(--brand-primary-glow)] bg-[var(--brand-primary)] text-[var(--primary-foreground)] hover:brightness-110 active:scale-[0.98] transition-all">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-3" /> {t('save')}</>}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'location' && (
              <GlassCard className="p-8 sm:p-10 border-[var(--glass-border)] bg-[var(--color-surface)] shadow-2xl">
                <div className="mb-10 border-b border-[var(--glass-border)] pb-8">
                  <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{t('location')}</h2>
                  <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">{t('locationHelper')}</p>
                </div>
                <div className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">{t('pickupAddress')}</label>
                    <Input
                      value={address}
                      onChange={setAddress}
                      placeholder={t('pickupAddress')}
                      className="!rounded-[1.25rem] !bg-[var(--bg-surface)] !border-[var(--glass-border)] focus:!border-[var(--brand-primary)]/50 !py-4 font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">{t('latitude')}</label>
                      <Input
                        value={latitude}
                        onChange={setLatitude}
                        placeholder="41.2995"
                        className="!rounded-[1.25rem] !bg-[var(--bg-surface)] !border-[var(--glass-border)] focus:!border-[var(--brand-primary)]/50 !py-4 font-bold tabular-nums"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">{t('longitude')}</label>
                      <Input
                        value={longitude}
                        onChange={setLongitude}
                        placeholder="69.2401"
                        className="!rounded-[1.25rem] !bg-[var(--bg-surface)] !border-[var(--glass-border)] focus:!border-[var(--brand-primary)]/50 !py-4 font-bold tabular-nums"
                      />
                    </div>
                  </div>
                  <div className="rounded-[2.5rem] overflow-hidden border border-[var(--glass-border)] shadow-inner">
                    <LocationPicker
                      initialLat={latitude ? parseFloat(latitude) : undefined}
                      initialLng={longitude ? parseFloat(longitude) : undefined}
                      onLocationSelect={(lat, lng, addr) => {
                        setLatitude(lat.toFixed(6));
                        setLongitude(lng.toFixed(6));
                        if (addr) setAddress(addr);
                      }}
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[200px] rounded-[1.25rem] h-14 font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-[var(--brand-primary-glow)] bg-[var(--brand-primary)] text-[var(--primary-foreground)] hover:brightness-110 active:scale-[0.98] transition-all">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-3" /> {t('save')}</>}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'working_hours' && (
              <GlassCard className="p-8 sm:p-10 border-[var(--glass-border)] bg-[var(--color-surface)] shadow-2xl">
                <div className="mb-10 border-b border-[var(--glass-border)] pb-8">
                  <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{language === 'uz' ? 'Ish vaqti' : 'Working Hours'}</h2>
                  <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">{language === 'uz' ? 'Haftalik ish tartibini belgilang' : 'Set your weekly business schedule'}</p>
                </div>
                <div className="space-y-4">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--glass-border)] hover:bg-[var(--brand-primary)]/[0.02] transition-colors">
                      <div className="w-full sm:w-32 font-black uppercase tracking-widest text-[10px] text-[var(--brand-primary)]">
                        {language === 'uz' ? 
                          (day === 'monday' ? 'Dushanba' : day === 'tuesday' ? 'Seshanba' : day === 'wednesday' ? 'Chorshanba' : day === 'thursday' ? 'Payshanba' : day === 'friday' ? 'Juma' : day === 'saturday' ? 'Shanba' : 'Yakshanba') 
                          : day.toUpperCase()}
                      </div>
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => setWorkingHours({...workingHours, [day]: {...(workingHours[day] || {from: '09:00', to: '18:00'}), enabled: !(workingHours[day]?.enabled)}})}
                          className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${workingHours[day]?.enabled ? 'bg-[var(--brand-primary)]' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-md ${workingHours[day]?.enabled ? 'left-[26px]' : 'left-[2px]'}`} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-[var(--text-dim)]">{workingHours[day]?.enabled ? (language === 'uz' ? 'Ochiq' : 'Open') : (language === 'uz' ? 'Yopiq' : 'Closed')}</span>
                      </div>
                      {workingHours[day]?.enabled && (
                        <div className="flex items-center gap-4 ml-auto">
                          <input 
                            type="time" 
                            value={workingHours[day]?.from || '09:00'} 
                            onChange={(e) => setWorkingHours({...workingHours, [day]: {...workingHours[day], from: e.target.value}})}
                            className="bg-[var(--color-surface)] border border-[var(--glass-border)] rounded-lg px-3 py-2 font-bold text-sm text-[var(--text-main)]"
                          />
                          <span className="text-[10px] font-black text-[var(--text-dim)]">—</span>
                          <input 
                            type="time" 
                            value={workingHours[day]?.to || '18:00'} 
                            onChange={(e) => setWorkingHours({...workingHours, [day]: {...workingHours[day], to: e.target.value}})}
                            className="bg-[var(--color-surface)] border border-[var(--glass-border)] rounded-lg px-3 py-2 font-bold text-sm text-[var(--text-main)]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[200px] rounded-[1.25rem] h-14 font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-[var(--brand-primary-glow)] bg-[var(--brand-primary)] text-[var(--primary-foreground)] hover:brightness-110 active:scale-[0.98] transition-all">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-3" /> {t('save')}</>}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'sms' && (
              <GlassCard className="p-8 sm:p-10 border-[var(--glass-border)] bg-[var(--color-surface)] shadow-2xl">
                <div className="mb-10 border-b border-[var(--glass-border)] pb-8">
                  <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">SMS Gateway</h2>
                  <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">{language === 'uz' ? 'SMS xabarnomalar uchun Eskiz.uz sozlamalari' : 'Eskiz.uz settings for SMS notifications'}</p>
                </div>
                <div className="space-y-8">
                  <div className="p-6 rounded-2xl bg-sky-500/5 border border-sky-500/10 mb-6">
                    <p className="text-xs font-bold text-sky-400 leading-relaxed">
                      {language === 'uz' ? "SMS yuborish uchun Eskiz.uz platformasidan ro'yxatdan o'ting va API ma'lumotlarini kiriting." : "Register on Eskiz.uz platform and enter API credentials to enable SMS notifications."}
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">Eskiz.uz Email</label>
                      <Input value={eskizEmail} onChange={setEskizEmail} placeholder="email@example.com" className="!rounded-[1.25rem] font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">Eskiz.uz Token</label>
                      <TextArea value={eskizToken} onChange={setEskizToken} placeholder="Your long API token..." rows={4} className="!rounded-[1.25rem] font-mono text-sm font-bold" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[200px] rounded-[1.25rem] h-14 font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-[var(--brand-primary-glow)] bg-[var(--brand-primary)] text-[var(--primary-foreground)] hover:brightness-110 active:scale-[0.98] transition-all">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-3" /> {t('save')}</>}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'billing' && (
              <GlassCard className="p-8 sm:p-10 border-[var(--glass-border)] bg-[var(--color-surface)] shadow-2xl">
                <div className="mb-10 border-b border-[var(--glass-border)] pb-8">
                  <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{language === 'uz' ? 'To\'lov va balans' : 'Billing & Balance'}</h2>
                  <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">{language === 'uz' ? 'Balans va obuna ma\'lumotlari' : 'Manage your balance and subscription'}</p>
                </div>
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-[2.5rem] bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10">
                      <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">{language === 'uz' ? 'Hozirgi balans' : 'Current Balance'}</p>
                      <h3 className="text-4xl font-black text-[var(--brand-primary)] mt-4 tabular-nums">
                        {balance.toLocaleString()} <span className="text-xl">UZS</span>
                      </h3>
                      <Button className="mt-8 w-full rounded-2xl h-12 bg-[var(--brand-primary)] hover:brightness-110 text-white font-black uppercase tracking-widest text-[10px]">
                        {language === 'uz' ? 'Balansni to\'ldirish' : 'Top Up Balance'}
                      </Button>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10">
                      <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">{language === 'uz' ? 'Tarif rejasi' : 'Current Plan'}</p>
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-2xl font-black text-indigo-400 tracking-tight uppercase">{plan.replace('_', ' ')}</span>
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">Active</div>
                      </div>
                      <p className="text-xs text-[var(--text-dim)] font-bold mt-4">
                        {language === 'uz' ? "Keyingi hisob-kitob sanasi: No'malum" : "Next billing date: Unknown"}
                      </p>
                      <Button variant="outline" className="mt-8 w-full rounded-2xl h-12 border-indigo-500/20 text-indigo-400 font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500/5">
                        {language === 'uz' ? 'Tarifni o\'zgartirish' : 'Upgrade Plan'}
                      </Button>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-[var(--bg-surface)] border border-[var(--glass-border)]">
                    <h4 className="font-black text-[var(--text-main)] uppercase tracking-wider text-[10px] mb-6">{language === 'uz' ? 'So\'nggi to\'lovlar' : 'Recent Transactions'}</h4>
                    <div className="flex flex-col items-center justify-center p-10 text-[var(--text-dim)]">
                      <RefreshCw className="w-10 h-10 mb-4 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest opacity-50">{language === 'uz' ? 'To\'lovlar tarixi bo\'sh' : 'No recent transactions'}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'social' && (
              <GlassCard className="p-8 sm:p-10 border-[var(--glass-border)] bg-[var(--color-surface)] shadow-2xl">
                <div className="mb-10 border-b border-[var(--glass-border)] pb-8">
                  <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{language === 'uz' ? 'Ijtimoiy tarmoqlar' : 'Social Media'}</h2>
                  <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">{language === 'uz' ? 'Mijozlar bilan bog\'lanish uchun havolalar' : 'Links to connect with your customers'}</p>
                </div>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">Instagram URL</label>
                      <Input value={instagramUrl} onChange={setInstagramUrl} placeholder="https://instagram.com/yourstore" className="!rounded-[1.25rem] font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">Telegram Channel/Group</label>
                      <Input value={telegramChannel} onChange={setTelegramChannel} placeholder="your_channel" className="!rounded-[1.25rem] font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">Facebook URL</label>
                      <Input value={facebookUrl} onChange={setFacebookUrl} placeholder="https://facebook.com/yourstore" className="!rounded-[1.25rem] font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">TikTok URL</label>
                      <Input value={tiktokUrl} onChange={setTiktokUrl} placeholder="https://tiktok.com/@yourstore" className="!rounded-[1.25rem] font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">YouTube URL</label>
                      <Input value={youtubeUrl} onChange={setYoutubeUrl} placeholder="https://youtube.com/@yourstore" className="!rounded-[1.25rem] font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">Website URL</label>
                      <Input value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://yourstore.com" className="!rounded-[1.25rem] font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">WhatsApp Number</label>
                      <Input value={whatsappNumber} onChange={setWhatsappNumber} placeholder="+998..." className="!rounded-[1.25rem] font-bold" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[200px] rounded-[1.25rem] h-14 font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-[var(--brand-primary-glow)] bg-[var(--brand-primary)] text-[var(--primary-foreground)] hover:brightness-110 active:scale-[0.98] transition-all">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-3" /> {t('save')}</>}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'telegram' && (
              <GlassCard className="p-8 sm:p-10 border-[var(--glass-border)] bg-[var(--color-surface)] shadow-2xl">
                <div className="mb-10 border-b border-[var(--glass-border)] pb-8">
                  <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{t('telegramIntegration')}</h2>
                  <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">{t('telegramSettingsHelper')}</p>
                </div>
                <div className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">{t('botToken')}</label>
                    <Input
                      value={botToken}
                      onChange={setBotToken}
                      placeholder="123456789:ABCDEF..."
                      className="!rounded-[1.25rem] !bg-[var(--bg-surface)] !border-[var(--glass-border)] focus:!border-[var(--brand-primary)]/50 !py-4 font-bold tabular-nums"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">{t('chatId')}</label>
                    <Input
                      value={chatId}
                      onChange={setChatId}
                      placeholder="-100123456789"
                      className="!rounded-[1.25rem] !bg-[var(--bg-surface)] !border-[var(--glass-border)] focus:!border-[var(--brand-primary)]/50 !py-4 font-bold tabular-nums"
                    />
                  </div>

                  <div className="space-y-6 pt-6 border-t border-[var(--glass-border)]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-[var(--text-main)]">{t('welcomeMessage') || 'Xush kelibsiz xabari'}</h3>
                      <Button
                        variant="outline"
                        type="button"
                        disabled={isTranslatingWelcome || !telegramWelcome}
                        onClick={async () => {
                          if (!telegramWelcome) return;
                          setIsTranslatingWelcome(true);
                          try {
                            const uzRes = await aiApi.translateText({ text: telegramWelcome, target_lang: 'uz' });
                            const ruRes = await aiApi.translateText({ text: telegramWelcome, target_lang: 'ru' });
                            setTelegramWelcomeUz(uzRes.data.translated_text || telegramWelcomeUz);
                            setTelegramWelcomeRu(ruRes.data.translated_text || telegramWelcomeRu);
                            setNotification({ type: 'success', message: 'Tarjima yakunlandi' });
                          } catch (error) {
                            console.error(error);
                            setNotification({ type: 'error', message: 'Tarjima xatosi' });
                          } finally {
                            setTimeout(() => setNotification(null), 3000);
                            setIsTranslatingWelcome(false);
                          }
                        }}
                        className="h-10 text-[10px] font-black uppercase tracking-widest text-[#6366F1] border-[#6366F1]/20 hover:bg-[#6366F1]/10 px-4"
                      >
                        {isTranslatingWelcome ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                        AI Localize
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">Main Welcome Message</label>
                        <TextArea
                          value={telegramWelcome}
                          onChange={setTelegramWelcome}
                          placeholder="Welcome to our store!"
                          rows={3}
                          className="!bg-[var(--bg-surface)] !border-[var(--glass-border)] focus:!border-[var(--brand-primary)]/50 !rounded-[1.25rem] !p-5 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">UZ Welcome</label>
                          <TextArea
                            value={telegramWelcomeUz}
                            onChange={setTelegramWelcomeUz}
                            placeholder="Do'konimizga xush kelibsiz!"
                            rows={3}
                            className="!bg-[var(--bg-surface)] !border-[var(--glass-border)] focus:!border-[var(--brand-primary)]/50 !rounded-[1.25rem] !p-5 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">RU Welcome</label>
                          <TextArea
                            value={telegramWelcomeRu}
                            onChange={setTelegramWelcomeRu}
                            placeholder="Добро пожаловать в наш магазин!"
                            rows={3}
                            className="!bg-[var(--bg-surface)] !border-[var(--glass-border)] focus:!border-[var(--brand-primary)]/50 !rounded-[1.25rem] !p-5 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 p-8 rounded-[2rem] bg-[var(--brand-primary)]/5 border border-[var(--glass-border)] hover:bg-[var(--brand-primary)]/10 transition-all duration-500 group">
                    <div className="relative inline-flex items-center cursor-pointer mt-1">
                      <input type="checkbox" checked={twaEnabled} onChange={(e) => setTwaEnabled(e.target.checked)} className="sr-only peer" id="twa-enabled" />
                      <div
                        onClick={() => setTwaEnabled(!twaEnabled)}
                        className={`w-12 h-6 rounded-full transition-all duration-500 relative cursor-pointer ${twaEnabled ? 'bg-[var(--brand-primary)]' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-lg ${twaEnabled ? 'left-[26px]' : 'left-[2px]'}`} />
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-[var(--text-main)] text-[10px] uppercase tracking-widest flex items-center gap-2">
                        {t('telegramMiniApp')}
                        {twaEnabled && <span className="inline-block w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />}
                      </p>
                      <p className="text-[10px] sm:text-xs text-[var(--text-dim)] mt-2 leading-relaxed font-bold">
                        {t('telegramMiniAppDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      onClick={handleTestTelegram}
                      disabled={isTestingTelegram || !botToken || !chatId}
                      variant="outline"
                      className="rounded-[1.25rem] h-14 font-black uppercase tracking-[0.3em] text-[11px] border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
                    >
                      {isTestingTelegram ? <Loader2 className="w-5 h-5 animate-spin" /> : <><MessageCircle className="w-4 h-4 mr-3" /> {t('testNotification')}</>}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[200px] rounded-[1.25rem] h-14 font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-[var(--brand-primary-glow)] bg-[var(--brand-primary)] text-[var(--primary-foreground)] hover:brightness-110 active:scale-[0.98] transition-all">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-3" /> {t('save')}</>}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'localization' && (
              <GlassCard className="p-8 sm:p-10 border-[var(--glass-border)] bg-[var(--color-surface)] shadow-2xl">
                <div className="mb-10 border-b border-[var(--glass-border)] pb-8">
                  <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{t('localization')}</h2>
                  <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">{t('localizationHelper')}</p>
                </div>
                <div className="space-y-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {(['uz', 'ru'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setDefaultLang(lang)}
                        className={`p-8 rounded-[2rem] border-2 transition-all duration-500 flex flex-col items-center gap-5 group relative overflow-hidden ${defaultLang === lang
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 shadow-lg shadow-[var(--brand-primary-glow)]'
                          : 'border-[var(--glass-border)] bg-[var(--bg-surface)] hover:border-[var(--brand-primary)]/50'
                          }`}
                      >
                        {defaultLang === lang && (
                          <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--brand-primary)] flex items-center justify-center rounded-bl-[1.5rem] shadow-xl">
                            <Save className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <span className="text-5xl group-hover:scale-110 transition-transform duration-500">{lang === 'uz' ? '🇺🇿' : '🇷🇺'}</span>
                        <div className="text-center">
                          <span className={`block text-xs font-black uppercase tracking-[0.2em] transition-colors ${defaultLang === lang ? 'text-[var(--text-main)]' : 'text-[var(--text-dim)]'}`}>
                            {lang === 'uz' ? "O'zbekcha" : 'Русский'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[200px] rounded-[1.25rem] h-14 font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-[var(--brand-primary-glow)] bg-[var(--brand-primary)] text-[var(--primary-foreground)] hover:brightness-110 active:scale-[0.98] transition-all">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-3" /> {t('save')}</>}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}
            {activeTab === 'currency' && (
              <GlassCard className="p-8 sm:p-10 border-[var(--glass-border)] bg-[var(--color-surface)] shadow-2xl">
                <div className="mb-10 border-b border-[var(--glass-border)] pb-8">
                  <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{t('currencySettings')}</h2>
                  <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">{t('currencyHelper')}</p>
                </div>
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">{language === 'uz' ? 'Asosiy Valyuta' : 'Base Currency'}</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['UZS', 'USD', 'RUB'].map((curr) => (
                        <button
                          key={curr}
                          onClick={() => setBaseCurrency(curr as any)}
                          className={`py-4 rounded-2xl border-2 font-black transition-all ${baseCurrency === curr
                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--text-main)] shadow-lg shadow-[var(--brand-primary-glow)]'
                            : 'border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-dim)] hover:border-[var(--brand-primary)]/20'
                            }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-6 p-8 rounded-[2rem] bg-[var(--brand-primary)]/5 border border-[var(--glass-border)] hover:bg-[var(--brand-primary)]/10 transition-all duration-500">
                    <div className="relative inline-flex items-center cursor-pointer mt-1">
                      <input type="checkbox" checked={useAutoRates} onChange={(e) => setUseAutoRates(e.target.checked)} className="sr-only peer" />
                      <div
                        onClick={() => setUseAutoRates(!useAutoRates)}
                        className={`w-12 h-6 rounded-full transition-all duration-500 relative cursor-pointer ${useAutoRates ? 'bg-[var(--brand-primary)]' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-lg ${useAutoRates ? 'left-[26px]' : 'left-[2px]'}`} />
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-[var(--text-main)] text-[10px] uppercase tracking-widest">{language === 'uz' ? 'Markaziy Bank Kurslari (Avto)' : 'Central Bank Rates (Auto)'}</p>
                      <p className="text-[10px] text-[var(--text-dim)] mt-2 font-bold">{language === 'uz' ? 'Narxlar avtomatik ravishda CBU API orqali yangilanadi' : 'Prices automatically update via CBU API'}</p>
                    </div>
                  </div>

                  {!useAutoRates && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-[2rem] bg-[var(--bg-surface)] border border-[var(--glass-border)]"
                    >
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">1 USD (UZS)</label>
                        <Input
                          value={manualRates.USD.toString()}
                          onChange={(val) => setManualRates({ ...manualRates, USD: parseFloat(val) || 0 })}
                          type="number"
                          className="!bg-[var(--color-surface)]"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] ml-1">1 RUB (UZS)</label>
                        <Input
                          value={manualRates.RUB.toString()}
                          onChange={(val) => setManualRates({ ...manualRates, RUB: parseFloat(val) || 0 })}
                          type="number"
                          className="!bg-[var(--color-surface)]"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[200px] rounded-[1.25rem] h-14 font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-[var(--brand-primary-glow)] bg-[var(--brand-primary)] text-[var(--primary-foreground)] hover:brightness-110 transition-all">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-3" /> {t('save')}</>}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'roles' && (
              <div className="space-y-8">
                <div className="mb-10 border-b border-[var(--glass-border)] pb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{t('roles')}</h2>
                    <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">
                      {language === 'uz' ? "Foydalanuvchilarni boshqarish (Faqat SuperAdmin)" : "Manage Users (SuperAdmin Only)"}
                    </p>
                  </div>
                  {user?.role === 'superadmin' && (
                    <Button onClick={() => setShowAddUserModal(true)} className="rounded-xl bg-[var(--brand-primary)] hover:brightness-110 text-[var(--primary-foreground)] text-[10px] font-black uppercase tracking-widest px-4 h-10 shadow-lg shadow-[var(--brand-primary-glow)]">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('add') || "Qo'shish"}
                    </Button>
                  )}
                </div>

                {notification && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mb-6 p-4 rounded-2xl border flex items-center justify-between ${notification.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <span className="text-xs font-black uppercase tracking-wider">{notification.message}</span>
                    </div>
                    <button onClick={() => setNotification(null)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {!user?.role || user.role !== 'superadmin' ? (
                  <div className="p-8 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 text-center">
                    <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-wider mb-2">
                      {language === 'uz' ? "Ruxsat yo'q" : "Access Denied"}
                    </h3>
                    <p className="text-xs text-rose-400 font-bold uppercase tracking-widest">
                      {language === 'uz' ? "Ushbu bo'lim faqat Super Adminlar uchun" : "This section is for Super Admins only"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {loadingUsers ? (
                      <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" /></div>
                    ) : (
                      <div className="overflow-hidden rounded-[2rem] border border-[var(--glass-border)] bg-[var(--color-surface)]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[var(--bg-surface)] border-b border-[var(--glass-border)] text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-black">
                              <th className="p-6">User</th>
                              <th className="p-6">Role</th>
                              <th className="p-6 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--glass-border)]">
                            {users.map((u) => (
                              <tr key={u.id} className="group hover:bg-[var(--brand-primary)]/[0.02] transition-colors">
                                <td className="p-6">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 flex items-center justify-center font-black text-[var(--brand-primary)]">
                                      {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-bold text-[var(--text-main)] text-sm">{u.username}</div>
                                      <div className="text-[10px] text-[var(--text-dim)] font-bold">{u.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${u.role === 'superadmin' ? 'bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)] border-[var(--brand-secondary)]/20' :
                                    u.role === 'store_admin' ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/20' :
                                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                    }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="p-6 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleEditUser()}
                                      disabled={u.id == user?.id}
                                      className={`p-3 rounded-xl transition-all shadow-lg ${u.id == user?.id ? 'bg-slate-800/20 text-slate-600 cursor-not-allowed' : 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[var(--primary-foreground)] shadow-[var(--brand-primary-glow)]'}`}
                                      title={t('edit')}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteUser(u.id)}
                                      disabled={u.id == user?.id}
                                      className={`p-3 rounded-xl transition-all shadow-lg ${u.id == user?.id ? 'bg-slate-800/20 text-slate-600 cursor-not-allowed' : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white shadow-rose-500/10'}`}
                                      title={t('delete')}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                {/* Add User Modal */}
                {showAddUserModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-md p-8 border-[var(--glass-border)] bg-[var(--color-surface)] relative shadow-2xl">
                      <button onClick={() => setShowAddUserModal(false)} className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors">
                        <X className="w-5 h-5" />
                      </button>

                      <h3 className="text-xl font-black text-[var(--text-main)] mb-6 uppercase tracking-tight">
                        {language === 'uz' ? "Yangi foydalanuvchi" : "New User"}
                      </h3>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">{language === 'uz' ? "Foydalanuvchi nomi" : "Username"}</label>
                          <Input
                            value={newUser.username}
                            onChange={(val) => setNewUser({ ...newUser, username: val })}
                            placeholder="username"
                            className="!bg-[var(--bg-surface)] !border-[var(--glass-border)]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">Email</label>
                          <Input
                            value={newUser.email}
                            onChange={(val) => setNewUser({ ...newUser, email: val })}
                            placeholder="email@example.com"
                            type="email"
                            className="!bg-[var(--bg-surface)] !border-[var(--glass-border)]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">{language === 'uz' ? "Parol" : "Password"}</label>
                          <Input
                            value={newUser.password}
                            onChange={(val) => setNewUser({ ...newUser, password: val })}
                            type="password"
                            placeholder="******"
                            className="!bg-[var(--bg-surface)] !border-[var(--glass-border)]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">{language === 'uz' ? "Rol" : "Role"}</label>
                          <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            className="w-full px-5 py-4 rounded-[1.25rem] border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/50 transition-all duration-300 font-bold text-sm appearance-none"
                          >
                            <option value="store_admin">Store Admin</option>
                            <option value="customer">Customer</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </div>

                        <Button
                          onClick={handleAddUser}
                          disabled={isSaving}
                          className="w-full mt-4 rounded-xl bg-[var(--brand-primary)] hover:brightness-110 text-[var(--primary-foreground)] font-black uppercase tracking-widest h-12 shadow-lg shadow-[var(--brand-primary-glow)]"
                        >
                          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (language === 'uz' ? "Yaratish" : "Create User")}
                        </Button>
                      </div>
                    </GlassCard>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <GlassCard className="p-8 sm:p-10 border-[var(--glass-border)] bg-[var(--color-surface)] shadow-2xl space-y-12">
                {/* API Configuration */}
                <div className="space-y-8">
                  <div className="border-b border-[var(--glass-border)] pb-8">
                    <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase">
                      {t('apiConfiguration')}
                    </h2>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-[var(--bg-surface)] border border-[var(--glass-border)] relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em]">{t('masterApiKey')}</label>
                      <button
                        onClick={handleGenerateApiKey}
                        disabled={rotatingKey}
                        className="flex items-center gap-2 text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-wider hover:brightness-110 transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${rotatingKey ? 'animate-spin' : ''}`} />
                        {apiKey ? t('rotateKey') : t('generateKey')}
                      </button>
                    </div>

                    <div className="flex items-center gap-4 bg-[var(--color-surface)] p-2 rounded-xl border border-[var(--glass-border)]">
                      <div className="flex-1 font-mono text-sm text-[var(--brand-primary)] px-4 truncate">
                        {apiKey || t('noApiKey')}
                      </div>
                      {apiKey && (
                        <div className="flex items-center gap-2 pr-2">
                          <button
                            onClick={handleCopyApiKey}
                            className="p-2 hover:bg-[var(--brand-primary)]/10 rounded-lg text-[var(--text-dim)] hover:text-[var(--brand-primary)] transition-colors"
                            title={t('copy')}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="p-2 hover:bg-[var(--brand-primary)]/10 rounded-lg text-[var(--text-dim)] hover:text-[var(--brand-primary)] transition-colors"
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-[10px] text-[var(--text-dim)] font-bold leading-relaxed">
                      {t('apiKeyWarning')}
                    </p>
                  </div>
                </div>

                {/* 2FA Section */}
                <div className="space-y-8">
                  <div className="border-b border-[var(--glass-border)] pb-8">
                    <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">
                      {t('twoFactorAuth')}
                    </h2>
                    <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">
                      {t('twoFactorDesc')}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between p-8 rounded-[2rem] bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10 gap-6">
                    <div className="flex gap-6 items-center">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${user?.two_factor_enabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20 text-[var(--brand-primary)]'}`}>
                        <Shield className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-black text-[var(--text-main)] uppercase tracking-wider text-sm">
                          {user?.two_factor_enabled ? t('enabled') : t('disabled')}
                        </h4>
                        <p className="text-[var(--text-dim)] text-xs mt-1 font-bold">
                          {user?.two_factor_enabled
                            ? t('accountSecured')
                            : t('enableTwoFactorRecommendation')}
                        </p>
                      </div>
                    </div>
                    {user?.two_factor_enabled ? (
                      <Button
                        variant="outline"
                        onClick={() => { if (confirm(t('disable2FAConfirmation'))) disable2FA() }}
                        className="rounded-xl border-[var(--glass-border)] text-[var(--text-dim)] hover:text-rose-500 hover:bg-rose-500/5 text-[10px] font-black uppercase tracking-widest px-6 h-12"
                      >
                        {t('disable')}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShow2FASetup(true)}
                        className="rounded-xl bg-[var(--brand-primary)] hover:brightness-110 text-[var(--primary-foreground)] text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-[var(--brand-primary-glow)] h-12"
                      >
                        {t('enable')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Sessions Section */}
                <div className="space-y-8">
                  <div className="border-b border-[var(--glass-border)] pb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase">
                        {t('activeDevices')}
                      </h2>
                      <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.3em] font-black mt-2">
                        {t('activeDevicesDesc')}
                      </p>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        onClick={handleEndAllSessions}
                        className="text-[10px] font-black text-rose-500 hover:brightness-125 uppercase tracking-widest underline underline-offset-4"
                      >
                        {t('logoutAllOthers')}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {loadingSessions ? (
                      <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" /></div>
                    ) : sessions.map((session) => (
                      <div key={session.id} className="group p-6 rounded-[2rem] bg-[var(--bg-surface)] border border-[var(--glass-border)] hover:border-[var(--brand-primary)]/20 hover:bg-[var(--brand-primary)]/5 transition-all duration-500 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${session.is_current ? 'bg-[var(--brand-primary)]/20 border-[var(--brand-primary)]/30 text-[var(--brand-primary)]' : 'bg-[var(--color-surface)] border-[var(--glass-border)] text-[var(--text-dim)]'}`}>
                            {session.device_type === 'mobile' ? <Smartphone className="w-6 h-6" /> : (session.device_type === 'tablet' ? <Laptop className="w-6 h-6" /> : <Monitor className="w-6 h-6" />)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h5 className="font-black text-[var(--text-main)] text-sm uppercase tracking-wider">{session.device_name}</h5>
                              {session.is_current && (
                                <span className="px-2 py-0.5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-[8px] font-black uppercase tracking-widest border border-[var(--brand-primary)]/20">
                                  {t('current')}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[var(--text-dim)] font-bold mt-1 uppercase tracking-widest">
                              {session.browser} • {session.os} • {session.ip_address}
                            </p>
                          </div>
                        </div>
                        {!session.is_current && (
                          <button
                            onClick={() => handleEndSession(session.id)}
                            className="p-3 rounded-xl bg-transparent hover:bg-rose-500/10 text-[var(--text-dim)] hover:text-rose-500 border border-transparent hover:border-rose-500/20 transition-all duration-300"
                            title={t('endSession')}
                          >
                            <LogOut className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </div>

      {/* PWA Install Section */}
      <PWAInstallBanner language={language} variant="card" />

      {
        show2FASetup && (
          <TwoFactorSetup
            onClose={() => setShow2FASetup(false)}
            onSuccess={() => {
              // Success handler
            }}
          />
        )
      }
    </div >
  );
}
