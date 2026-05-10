import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Barcode, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Wallet, 
  QrCode,
  X,
  Store,
  ChevronRight,
  AlertCircle,
  Loader2,
  Box,
  LayoutGrid,
  Zap,
  ArrowRight,
  User,
  Phone,
  Monitor,
  Database,
  ShieldCheck,
  ChevronLeft,
  Settings,
  History,
  Terminal,
  Calculator,
  Scan,
  RotateCcw,
  Unlock,
  Lock,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  CircleDollarSign,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { Modal } from '../../components/Modal';

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  barcode?: string;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
  discount: number;
}

interface CashRegister {
  id: number;
  name: string;
  register_code: string;
  is_active: boolean;
  total_sales?: number;
}

const POSInterface: React.FC = () => {
  const { formatPrice, t, currentStore } = useApp();
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [startingCash, setStartingCash] = useState('0');
  const [activeTab, setActiveTab] = useState<'pos' | 'transactions' | 'refunds'>('pos');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (currentStore?.id) {
      loadRegisters();
      loadTransactions();
    }
  }, [currentStore]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStore?.id) loadProducts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentStore]);

  const loadRegisters = async () => {
    if (!currentStore?.id) return;
    try {
      const data = await supabaseApi.pos.listRegisters(currentStore.id);
      setRegisters(data);
      const active = data.find((r: CashRegister) => r.is_active);
      if (active) setActiveRegister(active);
    } catch (error) {
      console.error('Failed to load registers from Supabase:', error);
    }
  };

  const loadTransactions = async () => {
    if (!currentStore?.id) return;
    try {
      const data = await supabaseApi.pos.listTransactions(currentStore.id);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions from Supabase:', error);
    }
  };

  const loadProducts = async (query: string) => {
    if (!currentStore?.id) return;
    try {
      const data = await supabaseApi.products.list(currentStore.id);
      if (query) {
          setProducts(data.filter(p => p.name.toLowerCase().includes(query.toLowerCase())));
      } else {
          setProducts(data);
      }
    } catch (error) {
      console.error('Failed to load products from Supabase:', error);
    }
  };

  const handleOpenRegister = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      let registerId = registers[0]?.id;
      if (!registerId) {
          alert('No registers configured for this store.');
          setLoading(false);
          return;
      }
      await supabaseApi.pos.openRegister(registerId, parseFloat(startingCash));
      await loadRegisters();
      setShowSessionModal(false);
    } catch (error) {
      console.error('Failed to open register in Supabase:', error);
    }
    setLoading(false);
  };

  const handleCloseRegister = async () => {
    if (!activeRegister) return;
    if (!window.confirm('Sessiyani yopishni tasdiqlaysizmi?')) return;
    setLoading(true);
    try {
      await supabaseApi.pos.closeRegister(activeRegister.id, calculateTotal());
      setActiveRegister(null);
      await loadRegisters();
    } catch (error) {
      console.error('Failed to close register in Supabase:', error);
    }
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1, discount: 0 }]);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    setBarcodeInput('');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity - item.discount), 0);
  };

  const handleCheckout = async () => {
      if (cart.length === 0 || !currentStore?.id) return;
      setLoading(true);
      try {
          const saleData = {
              store_id: currentStore.id,
              transaction_number: `POS-${Date.now()}`,
              customer_name: 'Guest Customer',
              payment_method: 'cash',
              total: calculateTotal(),
              items: cart.map(item => ({
                  product_id: item.id,
                  quantity: item.quantity,
                  price: item.price
              }))
          };
          await supabaseApi.pos.createSale(saleData);
          setCart([]);
          alert('Transaction Completed Successfully!');
          loadTransactions();
      } catch (error) {
          console.error('POS Checkout failed in Supabase:', error);
          alert('Checkout failed');
      }
      setLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-white -m-12 p-0 overflow-hidden text-slate-950 font-sans selection:bg-slate-950 selection:text-white">
      <header className="h-32 bg-white px-12 flex items-center justify-between border-b-2 border-slate-50 relative z-50">
         <div className="flex items-center gap-16">
            <div className="flex items-center gap-8 group">
               <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center shadow-xl transition-transform duration-700 cursor-pointer hover:scale-105">
                  <Terminal size={24} className="text-white" />
               </div>
               <div>
                  <h1 className="text-2xl font-black tracking-tight uppercase font-heading leading-none">POS <span className="text-slate-300">Terminal</span></h1>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                     <ShieldCheck size={10} className="text-emerald-500" /> Build 5.0 • {activeRegister?.register_code || 'STANDBY'}
                  </p>
               </div>
            </div>

            <nav className="hidden xl:flex items-center gap-4 p-2 bg-slate-50 rounded-[28px] border border-slate-100">
               {[
                 { id: 'pos', label: 'Sotuv', icon: ShoppingCart },
                 { id: 'transactions', label: 'Tarix', icon: History },
                 { id: 'refunds', label: 'Qaytarish', icon: RotateCcw }
               ].map(tab => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)} 
                   className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2.5 ${activeTab === tab.id ? 'bg-white text-slate-950 border border-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <tab.icon size={12} strokeWidth={3} /> {tab.label}
                 </button>
               ))}
            </nav>
         </div>

         <div className="flex items-center gap-8">
            {activeRegister?.is_active ? (
              <div className="flex items-center gap-4 px-8 py-4 bg-emerald-50 border-2 border-emerald-100 rounded-[24px]">
                 <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,1)]" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Sessiya Faol</span>
                 <button onClick={handleCloseRegister} className="ml-4 p-2 hover:bg-emerald-100 rounded-xl transition-all text-emerald-600"><Lock size={18} /></button>
              </div>
            ) : (
              <button 
                onClick={() => setShowSessionModal(true)}
                className="h-16 px-10 bg-slate-950 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-950/20 hover:scale-105 transition-all flex items-center gap-4"
              >
                 <Unlock size={18} /> Sessiya Ochish
              </button>
            )}
            
            <div className="flex items-center gap-4">
               <button className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all">
                  <Database size={24} />
               </button>
               <button className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all">
                  <Settings size={24} />
               </button>
            </div>
         </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
         {activeTab === 'pos' && (
           <div className="flex-1 flex overflow-hidden w-full">
              <section className="flex-1 flex flex-col p-12 gap-12 overflow-hidden bg-white">
                 <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8 relative group">
                       <input 
                          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-8 h-18 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-950 placeholder:text-slate-200 focus:border-slate-950/10 focus:bg-white transition-all outline-none shadow-sm uppercase tracking-tight"
                          placeholder="Mahsulot Qidirish..."
                       />
                    </div>
                    <form onSubmit={handleBarcode} className="xl:col-span-4 relative group">
                       <input 
                          value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
                          className="w-full pl-8 pr-8 h-18 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-950 placeholder:text-slate-200 focus:border-slate-950/10 focus:bg-white transition-all outline-none shadow-sm uppercase tracking-tight"
                          placeholder="Shtrix-kod..."
                       />
                    </form>
                 </div>

                 <div className="flex-1 border-2 border-slate-50 rounded-[64px] p-12 overflow-hidden flex flex-col relative">
                    <div className="flex items-center justify-between mb-12">
                       <div className="flex items-center gap-8">
                          <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
                             <LayoutGrid size={24} />
                          </div>
                          <div>
                             <h3 className="text-xl font-black text-slate-950 tracking-tight uppercase font-heading leading-none">Mahsulotlar</h3>
                             <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">{products.length} Tovar topildi</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 no-scrollbar">
                       <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10 pb-10">
                          {products.map(product => (
                            <motion.div 
                              key={product.id} onClick={() => addToCart(product)}
                              whileHover={{ y: -8 }} whileTap={{ scale: 0.98 }}
                              className="group bg-white border-2 border-slate-50 rounded-[48px] p-8 cursor-pointer hover:border-slate-950 transition-all duration-700"
                            >
                               <div className="aspect-square bg-slate-50 rounded-[32px] mb-8 flex items-center justify-center overflow-hidden border border-slate-50 p-4">
                                  {product.image ? <img src={product.image} className="w-full h-full object-cover rounded-[24px]" /> : <Box size={48} className="text-slate-200" />}
                               </div>
                               <div className="space-y-3">
                                  <h4 className="text-[11px] font-black text-slate-950 uppercase tracking-tight leading-tight line-clamp-2 h-8">{product.name}</h4>
                                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                     <span className="text-base font-black text-slate-950 tabular-nums">{formatPrice(product.price)}</span>
                                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{product.stock_quantity}</span>
                                  </div>
                               </div>
                            </motion.div>
                          ))}
                       </div>
                    </div>
                 </div>
              </section>

              <aside className="w-[600px] bg-white border-l-2 border-slate-50 flex flex-col relative">
                 <div className="p-12 border-b-2 border-slate-50">
                    <div className="flex items-center justify-between mb-12">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center shadow-lg">
                             <ShoppingCart size={24} className="text-white" />
                          </div>
                          <div>
                             <h3 className="text-2xl font-black text-slate-950 tracking-tight uppercase font-heading leading-none">Savat</h3>
                             <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">{cart.length} Pozitsiya</p>
                          </div>
                       </div>
                       {cart.length > 0 && (
                         <button onClick={() => setCart([])} className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100 flex items-center justify-center">
                            <Trash2 size={24} />
                         </button>
                       )}
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar bg-white">
                    {cart.map(item => (
                      <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-50/50 border-2 border-slate-50 rounded-[40px] p-6 hover:border-slate-200 transition-all relative">
                         <div className="flex gap-6">
                            <div className="w-20 h-20 rounded-[24px] bg-white shrink-0 overflow-hidden border border-slate-100 p-2">
                               {item.image ? <img src={item.image} className="w-full h-full object-cover rounded-[18px]" /> : <Box size={28} className="text-slate-200" />}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                               <div className="flex justify-between items-start gap-4">
                                  <h4 className="text-sm font-black text-slate-950 uppercase tracking-tight truncate flex-1">{item.name}</h4>
                                  <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-slate-300 hover:text-rose-500"><X size={18} /></button>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                   <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-slate-100">
                                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-950 transition-all"><Minus size={14} /></button>
                                      <span className="text-sm font-black text-slate-950 tabular-nums min-w-[20px] text-center tracking-tighter">{item.quantity}</span>
                                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-950 transition-all"><Plus size={14} /></button>
                                   </div>
                                   <div className="text-right">
                                      <span className="text-lg font-black text-slate-950 tabular-nums tracking-tighter">{formatPrice(item.price * item.quantity)}</span>
                                   </div>
                                </div>
                            </div>
                         </div>
                      </motion.div>
                    ))}
                    {cart.length === 0 && (
                       <div className="h-full flex flex-col items-center justify-center py-20 opacity-10">
                          <ShoppingCart size={80} strokeWidth={1} />
                          <p className="mt-6 font-black uppercase tracking-[0.4em] text-[10px]">Savat Bo'sh</p>
                       </div>
                    )}
                 </div>

                 <div className="p-10 bg-slate-50 border-t-2 border-slate-100 space-y-8">
                    <div className="space-y-3">
                       <div className="flex justify-between items-center px-4">
                          <span className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Jami Summa</span>
                          <span className="text-lg font-black text-slate-950 tabular-nums tracking-widest">{formatPrice(calculateTotal())}</span>
                       </div>
                       <div className="flex justify-between items-center px-4">
                          <span className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Chegirma</span>
                          <span className="text-lg font-black text-slate-950 tabular-nums tracking-widest">0.00</span>
                       </div>
                       <div className="h-px bg-slate-200 w-full my-4" />
                       <div className="flex justify-between items-end px-4">
                          <div>
                             <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[8px] mb-1">Yakuniy To'lov</p>
                             <h4 className="text-3xl font-black text-slate-950 tracking-tight tabular-nums">{formatPrice(calculateTotal())}</h4>
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      disabled={cart.length === 0 || !activeRegister?.is_active || loading}
                      className="w-full h-24 bg-slate-950 text-white rounded-[32px] font-black uppercase tracking-[0.5em] text-sm shadow-2xl shadow-slate-950/20 hover:scale-[1.02] active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-6 group"
                    >
                       {loading ? <Loader2 size={28} className="animate-spin" /> : (
                         <>
                            <CreditCard size={28} />
                            To'lovni Yakunlash
                            <ArrowRight size={28} className="group-hover:translate-x-3 transition-transform" />
                         </>
                       )}
                    </button>
                 </div>
              </aside>
           </div>
         )}

         {activeTab === 'transactions' && (
           <div className="flex-1 p-12 overflow-y-auto bg-slate-50/30">
              <div className="bg-white border-2 border-slate-100 rounded-[56px] overflow-hidden shadow-sm">
                  <div className="p-12 border-b-2 border-slate-100 flex items-center justify-between">
                     <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Tranzaksiyalar Tarixi</h3>
                     <div className="flex gap-4">
                        <button className="h-12 px-6 bg-slate-50 text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 border border-slate-100"><ArrowDownToLine size={16} /> Eksport</button>
                     </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="py-8 px-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">ID / SANA</th>
                        <th className="text-left py-8 px-12 text-[10px] font-black uppercase tracking-widest text-slate-400">MIJOZ</th>
                        <th className="text-center py-8 px-12 text-[10px] font-black uppercase tracking-widest text-slate-400">TO'LOV</th>
                        <th className="text-right py-8 px-12 text-[10px] font-black uppercase tracking-widest text-slate-400">SUMMA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-all cursor-pointer">
                           <td className="py-10 px-12">
                              <div className="font-black text-slate-950 text-sm tracking-widest uppercase mb-1">{t.transaction_number}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(t.created_at).toLocaleString()}</div>
                           </td>
                           <td className="py-10 px-12">
                              <div className="font-black text-slate-600 text-xs uppercase tracking-tight">{t.customer_name || 'Guest Customer'}</div>
                           </td>
                           <td className="py-10 px-12 text-center">
                              <span className="px-5 py-2 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-600 border border-slate-100">{t.payment_method}</span>
                           </td>
                           <td className="py-10 px-12 text-right">
                              <div className="font-black text-slate-950 tabular-nums text-xl tracking-tighter">{formatPrice(t.total)}</div>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
           </div>
         )}
      </main>

      <Modal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} title="Yangi Sessiya Ochish">
         <div className="p-12 space-y-10 bg-white">
            <div className="w-24 h-24 rounded-[32px] bg-slate-50 border-2 border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
               <Calculator size={40} className="text-slate-950" />
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Boshlang'ich Naqd Pul (UZS)</label>
               <input 
                 type="number" value={startingCash} onChange={(e) => setStartingCash(e.target.value)}
                 className="w-full h-24 bg-slate-50 border-2 border-slate-100 rounded-[32px] px-10 font-black text-3xl text-slate-950 outline-none focus:border-slate-950 transition-all text-center tabular-nums" 
               />
            </div>
            <div className="flex gap-6">
               <button onClick={() => setShowSessionModal(false)} className="flex-1 h-20 bg-slate-50 text-slate-950 rounded-[28px] font-black uppercase tracking-widest text-[10px] border border-slate-100">Bekor Qilish</button>
               <button onClick={handleOpenRegister} disabled={loading} className="flex-1 h-20 bg-slate-950 text-white rounded-[28px] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-950/20 hover:scale-105 active:scale-95 transition-all">
                  {loading ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'Sessiyani Boshlash'}
               </button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default POSInterface;
