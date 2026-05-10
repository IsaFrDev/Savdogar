import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Input, TextArea } from './Input';
import { Button } from './Button';
import { DeliveryOptions } from './DeliveryOptions';

interface CheckoutModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  isSubmitting: boolean;
  t: (key: string) => string;
  language: string;
  deliveryType: 'pickup' | 'delivery';
  setDeliveryType: (type: 'pickup' | 'delivery') => void;
  storeId: number;
  setSelectedDeliveryOption: (option: any) => void;
  selectedDeliveryOption: any;
  promoCode: string;
  setPromoCode: (code: string) => void;
  applyPromoCode: () => void;
  promoError: string | null;
  appliedPromo: any;
  name: string;
  setName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  address: string;
  setAddress: (address: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  user: any;
  loyaltyPoints: number;
  usePoints: boolean;
  setUsePoints: (use: boolean) => void;
  pointsRedeemed: number;
  setPointsRedeemed: (points: number) => void;
  cart: any[];
  cartTotal: number;
  currency: string;
  handlePlaceOrder: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  show,
  setShow,
  isSubmitting,
  t,
  language,
  deliveryType,
  setDeliveryType,
  storeId,
  setSelectedDeliveryOption,
  selectedDeliveryOption,
  promoCode,
  setPromoCode,
  applyPromoCode,
  promoError,
  appliedPromo,
  name,
  setName,
  phone,
  setPhone,
  address,
  setAddress,
  notes,
  setNotes,
  user,
  loyaltyPoints,
  usePoints,
  setUsePoints,
  pointsRedeemed,
  setPointsRedeemed,
  cart,
  cartTotal,
  currency,
  handlePlaceOrder,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
            onClick={() => !isSubmitting && setShow(false)}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl bg-[var(--color-surface-raised)] rounded-3xl border border-[var(--color-border)] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
              <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">{t('checkout')}</h2>
              <button
                onClick={() => setShow(false)}
                disabled={isSubmitting}
                className="p-2 hover:bg-[var(--color-surface-raised)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    deliveryType === 'pickup'
                      ? 'border-[var(--primary)] bg-[var(--primary-glow)] text-[var(--primary)]'
                      : 'border-[var(--color-border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <span className="block text-[10px] font-black uppercase tracking-widest">{t('pickup')}</span>
                </button>
                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    deliveryType === 'delivery'
                      ? 'border-[var(--primary)] bg-[var(--primary-glow)] text-[var(--primary)]'
                      : 'border-[var(--color-border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <span className="block text-[10px] font-black uppercase tracking-widest">{t('delivery')}</span>
                </button>
              </div>

              {deliveryType === 'delivery' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    {language === 'uz' ? 'Yetkazib berish turi' : language === 'ru' ? 'Тип доставки' : 'Delivery Type'}
                  </label>
                  <DeliveryOptions
                    storeId={storeId!}
                    onSelect={setSelectedDeliveryOption}
                    selectedType={selectedDeliveryOption?.type}
                  />
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                    {t('promoCode')}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={setPromoCode}
                      placeholder={t('promoCodePlaceholder')}
                      className="bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--text-primary)] flex-1 h-12"
                    />
                    <Button
                      onClick={applyPromoCode}
                      variant="secondary"
                      className="rounded-xl px-5 h-12 uppercase tracking-widest text-[10px] font-black shadow-sm"
                    >
                      {t('applyPromo')}
                    </Button>
                  </div>
                  {promoError && (
                    <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest ml-1">{promoError}</p>
                  )}
                  {appliedPromo && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
                      <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                        {t('promoApplied')} ({appliedPromo.code})
                      </span>
                      <span className="text-emerald-700 font-bold">
                        -
                        {appliedPromo.discount_type === 'percentage'
                          ? `${appliedPromo.value}%`
                          : `${appliedPromo.value.toLocaleString()} ${currency}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <Input
                    label={t('name')}
                    value={name}
                    onChange={setName}
                    required
                    icon={<User className="w-5 h-5" />}
                    className="bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--text-primary)]"
                  />
                  <Input
                    label={t('phone')}
                    value={phone}
                    onChange={setPhone}
                    required
                    icon={<Phone className="w-5 h-5" />}
                    className="bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--text-primary)]"
                  />
                  {deliveryType === 'delivery' && (
                    <Input
                      label={t('address')}
                      value={address}
                      onChange={setAddress}
                      required
                      icon={<MapPin className="w-5 h-5" />}
                      className="bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--text-primary)]"
                    />
                  )}
                  <TextArea
                    label={t('additionalNotes')}
                    value={notes}
                    onChange={setNotes}
                    rows={2}
                    className="bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--text-primary)]"
                  />
                </div>

                {/* Loyalty Points Redemption */}
                {user && loyaltyPoints > 0 && (
                  <div className="p-6 rounded-2xl bg-[var(--primary-glow)] border border-[var(--primary)]/10 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white shadow-sm">
                          <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">
                            {t('loyaltyPoints')}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                            {loyaltyPoints} {t('pointsAvailable')}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={usePoints}
                          onChange={(e) => {
                            setUsePoints(e.target.checked);
                            if (e.target.checked) {
                              const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
                              const maxPointsNeeded = Math.floor(subtotal / 1000);
                              setPointsRedeemed(Math.min(loyaltyPoints, maxPointsNeeded));
                            } else {
                              setPointsRedeemed(0);
                            }
                          }}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                      </label>
                    </div>
                    {usePoints && (
                      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                          {t('discountFromPoints')}
                        </p>
                        <p className="text-sm font-black text-emerald-600">
                          -{(pointsRedeemed * 1000).toLocaleString()} {currency}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="p-8 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              {deliveryType === 'delivery' && selectedDeliveryOption && (
                <div className="flex justify-between items-center mb-2 text-slate-400 text-sm font-bold uppercase tracking-widest">
                  <span>Yetkazib berish:</span>
                  <span>
                    {selectedDeliveryOption.price.toLocaleString()} {currency}
                  </span>
                </div>
              )}
              {appliedPromo && (
                <div className="flex justify-between items-center mb-4 text-emerald-400 text-sm font-bold uppercase tracking-widest">
                  <span>Chegirma:</span>
                  <span>
                    -
                    {appliedPromo.discount_type === 'percentage'
                      ? (
                          (cartTotal + (deliveryType === 'delivery' ? selectedDeliveryOption?.price || 0 : 0)) *
                          (appliedPromo.value / 100)
                        ).toLocaleString()
                      : appliedPromo.value.toLocaleString()}{' '}
                    {currency}
                  </span>
                </div>
              )}
              {usePoints && pointsRedeemed > 0 && (
                <div className="flex justify-between items-center mb-2 text-[var(--primary)] text-sm font-bold uppercase tracking-widest">
                  <span>{t('loyaltyRedemption')}:</span>
                  <span>
                    -{(pointsRedeemed * 1000).toLocaleString()} {currency}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-black text-2xl text-[var(--text-primary)] mb-6 uppercase tracking-tight">
                Jami:{' '}
                <span>
                  {(() => {
                    const base = cartTotal + (deliveryType === 'delivery' ? selectedDeliveryOption?.price || 0 : 0);
                    let discount = 0;
                    if (appliedPromo) {
                      discount +=
                        appliedPromo.discount_type === 'percentage'
                          ? (base * appliedPromo.value) / 100
                          : appliedPromo.value;
                    }
                    if (usePoints) {
                      discount += pointsRedeemed * 1000;
                    }
                    return Math.max(0, base - discount).toLocaleString();
                  })()}{' '}
                  {currency}
                </span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !name || !phone || cart.length === 0}
                className="w-full py-4 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-toq)] text-[var(--primary-foreground)] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary-glow)] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('placeOrder')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
