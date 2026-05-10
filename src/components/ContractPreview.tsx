import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle } from 'lucide-react';
import { storeApi } from '../services/api';
import { GlassCard } from './GlassCard';
import { useApp } from '../context/AppContext';

interface ContractPreviewProps {
    onAgree: (agreed: boolean) => void;
    agreed: boolean;
}

export function ContractPreview({ onAgree, agreed }: ContractPreviewProps) {
    const { language, t } = useApp();
    const [contractContent, setContractContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContract();
    }, [language]);

    const loadContract = async () => {
        setLoading(true);
        try {
            const response = await storeApi.getContractTemplate(language);
            const apiContent = response.data.content || '';
            // Only use API content if it's a real, complete contract (> 200 chars)
            if (apiContent.length > 200) {
                setContractContent(apiContent);
            } else {
                setContractContent(getLocalContract(language));
            }
        } catch (error) {
            // Fallback to hardcoded content
            setContractContent(getLocalContract(language));
        }
        setLoading(false);
    };

    const getLocalContract = (lang: string) => {
        const contracts: Record<string, string> = {
            en: `
SAVDOON ENTERPRISE SERVICE AGREEMENT

This Agreement is entered into between Savdoon Platform ("Platform") and the Store Owner ("You").

1. SUBSCRIPTION & FEES
   1.1 The monthly platform fee is 150,000 UZS (One Hundred Fifty Thousand Som).
   1.2 Subscription must be renewed every 30 days to maintain active store status.
   1.3 All fees are non-refundable.

2. STORE OPERATIONS
   2.1 You agree to provide accurate store information.
   2.2 You are responsible for all content and products uploaded.
   2.3 You agree to comply with all applicable laws of Uzbekistan.

3. APPROVAL PROCESS
   3.1 New stores require manual review and approval by the Platform administrators.
   3.2 Platform reserves the right to reject stores that do not meet quality guidelines.

4. TERMINATION
   4.1 Either party may terminate this agreement with 30 days notice.
   4.2 Platform may suspend stores for policy violations or non-payment.

By signing below, you acknowledge and agree to these terms.
      `,
            uz: `
SAVDOON ENTERPRISE XIZMAT KO‘RSATISH SHARTNOMASI

Ushbu Shartnoma Savdoon Platformasi ("Platforma") va Do'kon Egasi ("Siz") o'rtasida tuzilgan.

1. OBUNA VA TO‘LOVLAR
   1.1 Oylik platforma to'lovi 150,000 (bir yuz ellik ming) so'mni tashkil qiladi.
   1.2 Do'kon faol holatda turishi uchun har 30 kunda obunani yangilab turish shart.
   1.3 Barcha to'lovlar qaytarib berilmaydi.

2. DO'KON FAOLIYATI
   2.1 Siz do'kon haqida faqat to'g'ri ma'lumotlarni taqdim etishga rozisiz.
   2.2 Yuklangan barcha mahsulotlar va kontent uchun siz javobgarsiz.
   2.3 Siz O'zbekiston Respublikasi qonunlariga rioya qilishga rozilik bildirasiz.

3. TASDIQLASH JARAYONI
   3.1 Yangi do'konlar Platforma ma'murlari tomonidan qo'lda tekshiriladi va tasdiqlanadi.
   3.2 Platforma sifat talablariga javob bermaydigan do'konlarni rad etish huquqini saqlab qoladi.

4. BEKOR QILISH
   4.1 Har bir tomon 30 kun oldin xabar berish orqali shartnomani bekor qilishi mumkin.
   4.2 Qoidalar buzilganda yoki to'lov qilinmaganda Platforma do'konni to'xtatib qo'yishi mumkin.

Quyida imzo chekish orqali barcha shartlarga rozilik bildirasiz.
      `,
            ru: `
СОГЛАШЕНИЕ ОБ ОБСЛУЖИВАНИИ SAVDOON ENTERPRISE

Настоящий Договор заключается между Платформой Savdoon ("Платформа") и Владельцем магазина ("Вы").

1. ПОДПИСКА И ОПЛАТА
   1.1 Ежемесячная плата за платформу составляет 150,000 (сто пятьдесят тысяч) сум.
   1.2 Подписка должна продлеваться каждые 30 дней для поддержания активного статуса магазина.
   1.3 Все платежи не подлежат возврату.

2. ОПЕРАЦИИ МАГАЗИНА
   2.1 Вы соглашаетесь предоставлять достоверную информацию о магазине.
   2.2 Вы несете полную ответственность за весь контент и товары.
   2.3 Вы соглашаетесь соблюдать законодательство Республики Узбекистан.

3. ПРОЦЕСС ОДОБРЕНИЯ
   3.1 Новые магазины проходят ручную проверку и одобрение администрацией Платформы.
   3.2 Платформа оставляет за собой право отклонить магазин при нарушении правил.

4. РАСТОРЖЕНИЕ
   4.1 Любая сторона может расторгнуть договор, уведомив за 30 дней.
   4.2 Платформа может приостановить работу магазина за нарушения или неуплату.

Подписывая ниже, вы подтверждаете свое согласие с данными условиями.
      `,
        };
        return contracts[lang] || contracts.en;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('contractAgreement') || 'Service Agreement'}</span>
            </div>

            <GlassCard className="max-h-64 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <pre className="whitespace-pre-wrap text-[11px] text-[var(--text-secondary)] font-sans leading-relaxed">
                        {contractContent}
                    </pre>
                )}
            </GlassCard>

            <motion.label
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 p-5 rounded-2xl cursor-pointer transition-all border-2 ${agreed
                    ? 'bg-emerald-500/10 border-emerald-500/50'
                    : 'bg-[var(--color-surface-raised)] border-[var(--color-border)] hover:border-[var(--brand-primary)]/30'
                    }`}
            >
                <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => onAgree(e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <div className="flex-1">
                    <p className={`text-xs font-black uppercase tracking-wider ${agreed ? 'text-emerald-600' : 'text-[var(--text-primary)]'}`}>
                        {t('agreeToTerms')}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {t('readAndAccept')}
                    </p>
                </div>
                {agreed && <CheckCircle className="w-6 h-6 text-green-500" />}
            </motion.label>
        </div>
    );
}
