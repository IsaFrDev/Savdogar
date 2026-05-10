import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  DollarSign, 
  Clock, 
  User, 
  Phone, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  Edit3,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  History,
  Filter,
  Users,
  Loader2,
  ShieldCheck,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { Modal } from '../../components/Modal';

interface DebtTransaction {
  id: number;
  debt: number;
  amount: number;
  transaction_type: 'increase' | 'decrease';
  transaction_date: string;
  description: string;
  created_at: string;
}

interface CustomerDebt {
  id: number;
  customer_name: string;
  customer_phone: string;
  total_debt: number;
  limit: number;
  notes: string;
  transactions: DebtTransaction[];
  last_transaction_at: string;
  created_at: string;
}

export function DebtManagement() {
  const { formatPrice, currentStore } = useApp();
  const [debts, setDebts] = useState<CustomerDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<CustomerDebt | null>(null);
  
  const [newDebt, setNewDebt] = useState({
    customer_name: '',
    customer_phone: '',
    limit: 0,
    notes: ''
  });

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    transaction_type: 'increase' as 'increase' | 'decrease',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (currentStore?.id) {
      loadDebts();
    }
  }, [currentStore]);

  const loadDebts = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const data = await supabaseApi.debts.list(currentStore.id);
      setDebts(data || []);
    } catch (error) {
      console.error('Failed to load debts from Supabase:', error);
    }
    setLoading(false);
  };

  const handleCreateDebt = async () => {
    if (!currentStore?.id) return;
    try {
      await supabaseApi.debts.create(currentStore.id, newDebt);
      setShowAddModal(false);
      setNewDebt({ customer_name: '', customer_phone: '', limit: 0, notes: '' });
      loadDebts();
    } catch (error) {
      console.error('Failed to create debt record in Supabase:', error);
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedDebt) return;
    try {
      await supabaseApi.debts.createTransaction({
        debt: selectedDebt.id,
        amount: parseFloat(newTransaction.amount),
        transaction_type: newTransaction.transaction_type,
        description: newTransaction.description,
        transaction_date: newTransaction.transaction_date
      });
      setShowTransactionModal(false);
      setNewTransaction({
        amount: '',
        transaction_type: 'increase',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      loadDebts();
    } catch (error) {
      console.error('Failed to add transaction in Supabase:', error);
    }
  };

  const filteredDebts = debts.filter(d => 
    d.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.customer_phone && d.customer_phone.includes(searchQuery))
  );

  const totalOutstanding = debts.reduce((acc, d) => acc + parseFloat(d.total_debt.toString()), 0);

  if (loading && debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white">
        <Loader2 className="w-16 h-16 text-slate-950 animate-spin mb-6 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Financial Intelligence Syncing</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -m-12 p-12 space-y-16 text-slate-950 font-sans selection:bg-slate-950 selection:text-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-1.5 bg-slate-950 rounded-full shadow-2xl" />
            <span className="text-xs font-black text-slate-950 uppercase tracking-[0.4em]">Financial Hub</span>
          </div>
          <h1 className="text-7xl font-black tracking-tighter text-slate-950 uppercase font-heading leading-none">
            Debt <span className="text-slate-300">Control</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-6 flex items-center gap-3">
             <ShieldCheck size={14} className="text-emerald-500" /> Barcha qarzdorliklar nazorat ostida
          </p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="h-20 px-12 bg-slate-950 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-950/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
        >
          <Plus size={22} className="stroke-[3px]" /> Yangi Qarzdor
        </button>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: 'Umumiy Qarz', value: formatPrice(totalOutstanding), icon: DollarSign, trend: '+8.2%', color: 'rose' },
          { label: 'Faol Qarzdorlar', value: debts.filter(d => d.total_debt > 0).length, icon: Users, trend: 'Stable', color: 'slate' },
          { label: '30 Kunlik To\'lovlar', value: formatPrice(4520000), icon: CheckCircle2, trend: '92% return', color: 'emerald' }
        ].map((m, i) => (
          <div key={i} className="bg-white border-2 border-slate-50 p-12 rounded-[56px] relative overflow-hidden group hover:border-slate-200 transition-all">
             <div className="absolute top-[-20px] right-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <m.icon size={150} className="text-slate-950" />
             </div>
             <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                   <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-xl">
                      <m.icon size={24} />
                   </div>
                   <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${m.color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>{m.trend}</span>
                </div>
                <h3 className="text-5xl font-black text-slate-950 tracking-tighter mb-2 tabular-nums">{m.value}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
             </div>
          </div>
        ))}
      </div>

      {/* List Search */}
      <div className="relative group">
         <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-all" size={24} />
         <input 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-24 pr-10 h-24 bg-slate-50 border-2 border-slate-50 rounded-[40px] text-xl font-black text-slate-950 placeholder:text-slate-200 focus:border-slate-950/10 focus:bg-white transition-all outline-none"
            placeholder="Ism yoki telefon bo'yicha qidirish..."
         />
      </div>

      {/* Debtors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {filteredDebts.map((debt) => (
            <motion.div
               key={debt.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
               className="group"
            >
               <div 
                 onClick={() => { setSelectedDebt(debt); setShowTransactionModal(true); }}
                 className="bg-white border-2 border-slate-50 rounded-[56px] p-10 hover:border-slate-950 transition-all duration-700 cursor-pointer relative overflow-hidden"
               >
                  <div className="flex items-center justify-between relative z-10 mb-10">
                     <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-[32px] bg-slate-100 flex items-center justify-center text-slate-950 font-black text-3xl group-hover:scale-110 transition-transform">
                           {debt.customer_name[0]}
                        </div>
                        <div>
                           <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mb-2">{debt.customer_name}</h3>
                           <div className="flex items-center gap-6">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                 <Phone size={12} /> {debt.customer_phone}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                 <Clock size={12} /> {new Date(debt.last_transaction_at).toLocaleDateString()}
                              </span>
                           </div>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="text-4xl font-black text-slate-950 tabular-nums tracking-tighter">{formatPrice(debt.total_debt)}</span>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">Qoldiq Qarz</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-10 border-t border-slate-50">
                     <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                           {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full bg-slate-100 border-4 border-white" />)}
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">+{debt.transactions?.length || 0} Tranzaksiya</span>
                     </div>
                     <button className="h-14 px-8 bg-slate-50 text-slate-950 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all flex items-center gap-3 group/btn">
                        Batafsil <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                     </button>
                  </div>
               </div>
            </motion.div>
         ))}
      </div>

      {/* Modals */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Yangi Qarzdor Qo'shish">
         <div className="p-12 space-y-10 bg-white">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Mijoz Ismi</label>
               <input value={newDebt.customer_name} onChange={(e) => setNewDebt({...newDebt, customer_name: e.target.value})} className="w-full h-20 bg-slate-50 border-2 border-slate-50 rounded-[32px] px-8 font-black text-slate-950 uppercase outline-none focus:border-slate-950/10" placeholder="e.g. Alisher Fayzullaev" />
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Telefon Raqami</label>
               <input value={newDebt.customer_phone} onChange={(e) => setNewDebt({...newDebt, customer_phone: e.target.value})} className="w-full h-20 bg-slate-50 border-2 border-slate-50 rounded-[32px] px-8 font-black text-slate-950 outline-none focus:border-slate-950/10" placeholder="+998" />
            </div>
            <button onClick={handleCreateDebt} className="w-full h-24 bg-slate-950 text-white rounded-[40px] font-black uppercase tracking-[0.5em] text-sm shadow-2xl hover:scale-[1.02] transition-all">Qarzdorlikni Saqlash</button>
         </div>
      </Modal>

      <Modal isOpen={showTransactionModal} onClose={() => setShowTransactionModal(false)} title={selectedDebt?.customer_name}>
         <div className="p-12 space-y-12 bg-white">
            <div className="p-10 bg-slate-50 rounded-[48px] border-2 border-slate-50 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hozirgi Qarz</p>
                  <h3 className="text-5xl font-black text-slate-950 tabular-nums tracking-tighter">{formatPrice(selectedDebt?.total_debt || 0)}</h3>
               </div>
               <div className="w-20 h-20 rounded-[32px] bg-slate-950 flex items-center justify-center text-white shadow-2xl">
                  <DollarSign size={36} />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <button 
                 onClick={() => setNewTransaction({...newTransaction, transaction_type: 'increase'})}
                 className={`h-24 rounded-[32px] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 transition-all ${newTransaction.transaction_type === 'increase' ? 'bg-slate-950 text-white shadow-2xl' : 'bg-slate-50 text-slate-300'}`}
               >
                  <ArrowUpRight size={24} /> Qarz Qo'shish
               </button>
               <button 
                 onClick={() => setNewTransaction({...newTransaction, transaction_type: 'decrease'})}
                 className={`h-24 rounded-[32px] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 transition-all ${newTransaction.transaction_type === 'decrease' ? 'bg-slate-950 text-white shadow-2xl' : 'bg-slate-50 text-slate-300'}`}
               >
                  <ArrowDownLeft size={24} /> To'lov Olish
               </button>
            </div>

            <div className="space-y-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Miqdor</label>
                  <input type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})} className="w-full h-24 bg-slate-50 border-2 border-slate-50 rounded-[32px] px-10 font-black text-slate-950 text-4xl tabular-nums outline-none" placeholder="0" />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Izoh</label>
                  <input type="text" value={newTransaction.description} onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})} className="w-full h-20 bg-slate-50 border-2 border-slate-50 rounded-[32px] px-10 font-black text-slate-950 uppercase outline-none" placeholder="Masalan: Tovar uchun" />
               </div>
            </div>

            <button onClick={handleAddTransaction} className="w-full h-24 bg-slate-950 text-white rounded-[40px] font-black uppercase tracking-[0.5em] text-sm shadow-2xl hover:scale-[1.02] transition-all">Amalni Yakunlash</button>

            <div className="pt-10">
               <h5 className="text-[11px] font-black text-slate-950 uppercase tracking-widest mb-8 flex items-center gap-3">
                  <History size={16} /> Harakatlar Tarixi
               </h5>
               <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                  {selectedDebt?.transactions?.map(tx => (
                    <div key={tx.id} className="p-8 bg-slate-50 rounded-[32px] flex items-center justify-between border border-slate-100">
                       <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.transaction_type === 'increase' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                             {tx.transaction_type === 'increase' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-950 uppercase tracking-tight">{tx.description || (tx.transaction_type === 'increase' ? 'Qarz' : 'To\'lov')}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(tx.created_at).toLocaleString()}</p>
                          </div>
                       </div>
                       <span className={`text-xl font-black tabular-nums ${tx.transaction_type === 'increase' ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {tx.transaction_type === 'increase' ? '+' : '-'}{formatPrice(tx.amount)}
                       </span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </Modal>
    </div>
  );
}
