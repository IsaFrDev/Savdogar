import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingCart, ArrowRight, Package } from 'lucide-react';
import { getMediaUrl } from '../utils/media';
import { useApp } from '../context/AppContext';

interface CartModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  cart: any[];
  updateQuantity: (id: number, quantity: number) => void;
  cartTotal: number;
  currency: string;
  language: string;
  t: (key: string) => string;
  setCheckoutOpen: (open: boolean) => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  show,
  setShow,
  cart,
  updateQuantity,
  cartTotal,
  currency,
  language,
  t,
  setCheckoutOpen,
}) => {
  const { ln } = useApp();

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setShow(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--color-surface-raised)] border-l border-[var(--color-border)] shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
              <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">{t('cart')}</h2>
              <button
                onClick={() => setShow(false)}
                className="p-2.5 hover:bg-[var(--color-surface-raised)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-[var(--text-muted)]">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-6 opacity-10" />
                  <p className="font-black uppercase tracking-widest">
                    {language === 'uz' ? "Sizning savatingiz bo'sh" : 'Your cart is empty'}
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-4 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] group shadow-sm"
                  >
                    {item.product.images?.[0] ? (
                      <img
                        src={getMediaUrl(item.product.images[0].image) || undefined}
                        alt={ln(item.product, 'name')}
                        className="w-20 h-20 rounded-2xl object-cover bg-[var(--color-surface-raised)]"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--text-muted)]">
                        <Package className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-[var(--text-primary)] uppercase tracking-tight truncate">
                        {ln(item.product, 'name')}
                      </h4>
                      <p className="text-[var(--primary)] font-black text-sm mt-1">
                        {item.product.price.toLocaleString()} {currency}
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] text-[var(--text-primary)] border border-[var(--color-border)] transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-black text-[var(--text-primary)] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] text-[var(--text-primary)] border border-[var(--color-border)] transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateQuantity(item.product.id, 0)}
                          className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-200 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-8 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">Jami</span>
                  <span className="text-3xl font-black text-[var(--text-primary)] tabular-nums">
                    {cartTotal.toLocaleString()} <span className="text-sm text-[var(--text-muted)]">{currency}</span>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShow(false);
                    setCheckoutOpen(true);
                  }}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-[var(--primary-foreground)] font-black uppercase tracking-widest text-sm shadow-xl shadow-[var(--primary-glow)] flex items-center justify-center gap-3 hover:brightness-110 shadow-[0_10px_30px_var(--primary-glow)] transition-all active:scale-95"
                >
                  Davom etish <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
