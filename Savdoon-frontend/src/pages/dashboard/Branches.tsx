import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Phone, 
  Clock, 
  Check, 
  X, 
  Loader2, 
  Edit2,
  Navigation,
  Globe,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { branchApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input, TextArea } from '../../components/Input';

interface Branch {
  id: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  is_active: boolean;
  working_hours: Record<string, { open: string; close: string; closed: boolean }>;
  created_at: string;
}

export function Branches() {
  const { t, language, currentStore } = useApp();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [workingHours, setWorkingHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
    mon: { open: '09:00', close: '21:00', closed: false },
    tue: { open: '09:00', close: '21:00', closed: false },
    wed: { open: '09:00', close: '21:00', closed: false },
    thu: { open: '09:00', close: '21:00', closed: false },
    fri: { open: '09:00', close: '21:00', closed: false },
    sat: { open: '09:00', close: '18:00', closed: false },
    sun: { open: '09:00', close: '18:00', closed: true },
  });

  const loadBranches = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const res = await branchApi.list(currentStore.id);
      setBranches(res.data);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBranches();
  }, [currentStore?.id]);

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setName(branch.name);
      setAddress(branch.address);
      setPhone(branch.phone);
      setLat(branch.latitude);
      setLng(branch.longitude);
      setIsActive(branch.is_active);
      setWorkingHours(branch.working_hours || workingHours);
    } else {
      setEditingBranch(null);
      setName('');
      setAddress('');
      setPhone('');
      setLat(null);
      setLng(null);
      setIsActive(true);
      // Keep default working hours
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentStore?.id) return;
    setIsSaving(true);
    try {
      const data = {
        name,
        address,
        phone,
        latitude: lat,
        longitude: lng,
        is_active: isActive,
        working_hours: workingHours
      };
      
      if (editingBranch) {
        await branchApi.update(currentStore.id, editingBranch.id, data);
      } else {
        await branchApi.create(currentStore.id, data);
      }
      
      setIsModalOpen(false);
      loadBranches();
    } catch (error) {
      console.error('Failed to save branch:', error);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!currentStore?.id || !confirm(language === 'uz' ? "Filial o'chirilsinmi?" : "Delete branch?")) return;
    try {
      await branchApi.delete(currentStore.id, id);
      loadBranches();
    } catch (error) {
      console.error('Failed to delete branch:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest">{t('loading')}</p>
      </div>
    );
  }

  const days = [
    { key: 'mon', label: language === 'uz' ? 'Dushanba' : 'Monday' },
    { key: 'tue', label: language === 'uz' ? 'Seshanba' : 'Tuesday' },
    { key: 'wed', label: language === 'uz' ? 'Chorshanba' : 'Wednesday' },
    { key: 'thu', label: language === 'uz' ? 'Payshanba' : 'Thursday' },
    { key: 'fri', label: language === 'uz' ? 'Juma' : 'Friday' },
    { key: 'sat', label: language === 'uz' ? 'Shanba' : 'Saturday' },
    { key: 'sun', label: language === 'uz' ? 'Yakshanba' : 'Sunday' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
            {language === 'uz' ? 'Filiallar' : 'Branches'}
          </h1>
          <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">
            {language === 'uz' ? "Do'koningiz filiallarni boshqarish" : "Manage your store branches"}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-indigo-500/20">
          <Plus className="w-5 h-5" />
          {language === 'uz' ? "Filial qo'shish" : 'Add Branch'}
        </Button>
      </div>

      {branches.length === 0 ? (
        <GlassCard className="p-20 text-center border-dashed border-2 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6 text-slate-400">
            <MapPin className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wide">
            {language === 'uz' ? "Filiallar mavjud emas" : "No Branches Yet"}
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
            {language === 'uz' ? "Do'koningizning turli manzillardagi filiallarni qo'shing va boshqaring." : "Add and manage different branches and locations for your store."}
          </p>
          <Button variant="outline" onClick={() => handleOpenModal()} className="rounded-xl px-8 h-12">
            {language === 'uz' ? "Birinchi filialni qo'shish" : 'Add your first branch'}
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches.map((branch) => (
            <motion.div
              layout
              key={branch.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group"
            >
              <GlassCard className={`p-8 border-2 transition-all duration-500 h-full flex flex-col relative overflow-hidden ${branch.is_active ? 'border-transparent' : 'border-slate-200 opacity-60'}`}>
                {/* Decorative background number */}
                <div className="absolute top-[-20px] right-[-10px] text-[120px] font-black text-slate-900/[0.03] select-none pointer-events-none italic">
                  {branch.id}
                </div>

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-500 shadow-sm border border-indigo-100/50">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenModal(branch)}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(branch.id)}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6 relative z-10 flex-1">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 truncate">
                      {branch.name}
                    </h3>
                    <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-black uppercase tracking-widest">
                      <span className={`w-2 h-2 rounded-full ${branch.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                      {branch.is_active ? (language === 'uz' ? 'Ish faoliyatida' : 'Active') : (language === 'uz' ? 'Faol emas' : 'Inactive')}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        <Navigation className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed line-clamp-2 mt-1">
                        {branch.address || 'No address provided'}
                      </p>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        <Phone className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-xs font-black text-slate-700 mt-2 tracking-wider">
                        {branch.phone || 'No phone provided'}
                      </p>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 mt-1.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dushanba - Juma</p>
                        <p className="text-xs font-bold text-slate-800">
                          {branch.working_hours?.mon?.closed ? 'Yopiq' : `${branch.working_hours?.mon?.open} - ${branch.working_hours?.mon?.close}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    ID: {branch.id}
                  </div>
                  {branch.latitude && branch.longitude && (
                    <a 
                      href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                    >
                      <Globe className="w-3 h-3" />
                      Map view
                    </a>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Branch Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto pt-20 pb-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                    {editingBranch ? (language === 'uz' ? 'Filialni tahrirlash' : 'Edit Branch') : (language === 'uz' ? "Yangi filial qo'shish" : 'Add New Branch')}
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">
                    {language === 'uz' ? "Do'koningiz filiali haqidagi ma'lumotlar" : 'Branch location and operational details'}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-10 max-h-[70vh] overflow-y-auto no-scrollbar space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Filial Nomi</label>
                    <Input 
                      value={name} 
                      onChange={setName} 
                      placeholder={language === 'uz' ? "Masalan: Markaziy filial" : "e.g. Central Branch"}
                      className="!rounded-2xl !bg-slate-50 !border-slate-100 !h-14 font-bold"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Telefon Raqami</label>
                    <Input 
                      value={phone} 
                      onChange={setPhone} 
                      placeholder="+998..." 
                      className="!rounded-2xl !bg-slate-50 !border-slate-100 !h-14 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Manzil</label>
                  <TextArea 
                    value={address} 
                    onChange={setAddress} 
                    placeholder={language === 'uz' ? "To'liq manzil kiriting..." : "Enter full address..."}
                    className="!rounded-2xl !bg-slate-50 !border-slate-100 font-bold !min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                       Kenglik (Latitude) <AlertCircle className="w-3 h-3 text-slate-300" />
                    </label>
                    <Input 
                      type="number"
                      value={lat?.toString() || ''} 
                      onChange={(e) => setLat(parseFloat(e))} 
                      placeholder="41.311081" 
                      className="!rounded-2xl !bg-slate-50 !border-slate-100 !h-14 font-bold"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      Uzunlik (Longitude) <AlertCircle className="w-3 h-3 text-slate-300" />
                    </label>
                    <Input 
                      type="number"
                      value={lng?.toString() || ''} 
                      onChange={(e) => setLng(parseFloat(e))} 
                      placeholder="69.240562" 
                      className="!rounded-2xl !bg-slate-50 !border-slate-100 !h-14 font-bold"
                    />
                  </div>
                </div>

                {/* Working Hours Configuration */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Ish tartibi
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {days.map((day) => (
                      <div 
                        key={day.key}
                        className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${workingHours[day.key].closed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'}`}
                      >
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setWorkingHours(prev => ({
                              ...prev,
                              [day.key]: { ...prev[day.key], closed: !prev[day.key].closed }
                            }))}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${workingHours[day.key].closed ? 'bg-slate-200 text-slate-400' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}
                          >
                            <Check className={`w-3.5 h-3.5 ${workingHours[day.key].closed ? 'opacity-0' : 'opacity-100'}`} />
                          </button>
                          <span className="text-xs font-black uppercase tracking-widest text-slate-700 w-24">{day.label}</span>
                        </div>
                        
                        {!workingHours[day.key].closed ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="time" 
                              value={workingHours[day.key].open}
                              onChange={(e) => setWorkingHours(prev => ({
                                ...prev,
                                [day.key]: { ...prev[day.key], open: e.target.value }
                              }))}
                              className="px-3 py-2 rounded-xl bg-slate-100 border-transparent text-[11px] font-bold outline-none focus:bg-white focus:border-indigo-500/50" 
                            />
                            <span className="text-slate-300 font-bold">-</span>
                            <input 
                              type="time"
                              value={workingHours[day.key].close}
                              onChange={(e) => setWorkingHours(prev => ({
                                ...prev,
                                [day.key]: { ...prev[day.key], close: e.target.value }
                              }))}
                              className="px-3 py-2 rounded-xl bg-slate-100 border-transparent text-[11px] font-bold outline-none focus:bg-white focus:border-indigo-500/50" 
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-4">Dam olish kuni</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className="relative inline-flex items-center">
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
                      <div className="w-12 h-6 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-all duration-300 relative">
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${isActive ? 'translate-x-6' : ''}`} />
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-800 transition-colors">
                      {isActive ? (language === 'uz' ? 'Filial hozirda faol' : 'Branch Active Now') : (language === 'uz' ? 'Vaqtincha yopiq' : 'Temporarily Closed')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px]">
                  {language === 'uz' ? 'Bekor qilish' : 'Cancel'}
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || !name || !address} 
                  className="rounded-2xl h-14 px-12 font-black uppercase tracking-widest text-[11px] bg-indigo-500 text-white shadow-2xl shadow-indigo-500/30"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingBranch ? (language === 'uz' ? 'Saqlash' : 'Save Changes') : (language === 'uz' ? "Qo'shish" : 'Add Branch')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
