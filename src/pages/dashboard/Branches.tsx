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
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { LocationPicker } from '../../components/LocationPicker';

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
      const data = await supabaseApi.branches.list(currentStore.id);
      setBranches(data);
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
        await supabaseApi.branches.update(currentStore.id, editingBranch.id, data);
      } else {
        await supabaseApi.branches.create(currentStore.id, data);
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
      await supabaseApi.branches.delete(currentStore.id, id);
      loadBranches();
    } catch (error) {
      console.error('Failed to delete branch:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6 opacity-50" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">{t('loading')}</p>
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
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-1 bg-indigo-500 rounded-full" />
            <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Locations</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-heading">
            {language === 'uz' ? 'Filiallar' : 'Branches'}
          </h1>
          <p className="text-slate-400 mt-2 uppercase tracking-[0.2em] text-[10px] font-black">
            {language === 'uz' ? "Do'koningiz filiallarni boshqarish" : "Manage your store branches"}
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="h-16 px-10 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-4"
        >
          <Plus size={18} />
          {language === 'uz' ? "Filial qo'shish" : 'Add Branch'}
        </button>
      </div>

      {branches.length === 0 ? (
        <div className="empty-state-card p-24 flex flex-col items-center">
          <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center mb-8 text-slate-200 border border-slate-100 shadow-inner">
            <MapPin size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter">
            {language === 'uz' ? "Filiallar mavjud emas" : "No Branches Yet"}
          </h2>
          <p className="text-slate-400 max-w-sm mx-auto mb-10 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
            {language === 'uz' ? "Do'koningizning turli manzillardagi filiallarni qo'shing va boshqaring." : "Add and manage different branches and locations for your store."}
          </p>
          <button 
            onClick={() => handleOpenModal()} 
            className="h-14 px-10 border border-slate-200 text-slate-500 rounded-[20px] font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
          >
            {language === 'uz' ? "Birinchi filialni qo'shish" : 'Add your first branch'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {branches.map((branch) => (
            <motion.div
              layout
              key={branch.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group"
            >
              <GlassCard className={`p-10 border-slate-200 bg-white transition-all duration-700 h-full flex flex-col relative overflow-hidden rounded-[40px] hover:border-indigo-500/30 group ${!branch.is_active && 'opacity-50 grayscale'}`}>
                {/* Decorative background number */}
                <div className="absolute top-[-30px] right-[-20px] text-[160px] font-black text-white/[0.02] select-none pointer-events-none italic font-heading">
                  {branch.id}
                </div>

                <div className="flex items-start justify-between mb-10 relative z-10">
                  <div className="w-16 h-16 rounded-[24px] bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xl group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700">
                    <MapPin size={28} />
                  </div>
                    <div className="flex gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 relative z-10">
                    <button 
                      onClick={() => handleOpenModal(branch)}
                      className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-sm"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(branch.id)}
                      className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-500/20"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-8 relative z-10 flex-1">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 truncate group-hover:text-indigo-600 transition-colors">
                      {branch.name}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
                      <span className={`w-2 h-2 rounded-full ${branch.is_active ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                      <span className={branch.is_active ? 'text-emerald-400' : 'text-slate-600'}>
                        {branch.is_active ? (language === 'uz' ? 'Ish faoliyatida' : 'Active') : (language === 'uz' ? 'Faol emas' : 'Inactive')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-6 group/item">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover/item:border-indigo-500/30 transition-colors">
                        <Navigation size={18} className="text-slate-500 group-hover/item:text-indigo-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed line-clamp-2 mt-1 uppercase tracking-wider">
                        {branch.address || 'No address provided'}
                      </p>
                    </div>

                    <div className="flex items-start gap-6 group/item">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover/item:border-indigo-500/30 transition-colors">
                        <Phone size={18} className="text-slate-500 group-hover/item:text-indigo-400" />
                      </div>
                      <p className="text-xs font-black text-white mt-2.5 tracking-[0.2em] tabular-nums">
                        {branch.phone || 'No phone provided'}
                      </p>
                    </div>

                    <div className="flex items-start gap-6 group/item">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover/item:border-indigo-500/30 transition-colors">
                        <Clock size={18} className="text-slate-500 group-hover/item:text-indigo-400" />
                      </div>
                      <div className="flex-1 mt-1.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Working Hours</p>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                          {branch.working_hours?.mon?.closed ? (
                            <span className="text-rose-500">Closed</span>
                          ) : (
                            <span className="tabular-nums">{branch.working_hours?.mon?.open} - {branch.working_hours?.mon?.close}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    Branch ID: {branch.id}
                  </div>
                  {branch.latitude && branch.longitude && (
                    <a 
                      href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-6 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-3 hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-100"
                    >
                      <Globe size={14} />
                      Live Location
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-4xl bg-white border border-slate-200 rounded-[48px] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase font-heading">
                    {editingBranch ? (language === 'uz' ? 'Filialni tahrirlash' : 'Edit Branch') : (language === 'uz' ? "Yangi filial qo'shish" : 'Add New Branch')}
                  </h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black mt-2">
                    {language === 'uz' ? "Do'koningiz filiali haqidagi ma'lumotlar" : 'Branch location and operational details'}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-12 max-h-[65vh] overflow-y-auto no-scrollbar space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Branch Name</label>
                    <input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder={language === 'uz' ? "Masalan: Markaziy filial" : "e.g. Central Branch"}
                      className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-8 py-5 text-slate-900 font-black outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                    <input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+998..." 
                      className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-8 py-5 text-slate-900 font-black outline-none focus:border-indigo-500/50 transition-all tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Address</label>
                  <textarea 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    placeholder={language === 'uz' ? "To'liq manzil kiriting..." : "Enter full address..."}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-8 py-6 text-slate-900 font-black outline-none focus:border-indigo-500/50 transition-all resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                     Kartadan manzilni tanlang <AlertCircle size={14} className="text-slate-700" />
                  </label>
                  <LocationPicker 
                    initialLat={lat || undefined} 
                    initialLng={lng || undefined} 
                    onLocationSelect={(selectedLat, selectedLng, selectedAddr) => {
                      setLat(selectedLat);
                      setLng(selectedLng);
                      if (selectedAddr) setAddress(selectedAddr);
                    }} 
                  />
                </div>

                {/* Working Hours Configuration */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                      <Clock size={16} /> Operation Schedule
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {days.map((day) => (
                      <div 
                        key={day.key}
                        className={`p-6 rounded-[32px] border transition-all duration-700 flex items-center justify-between ${workingHours[day.key].closed ? 'bg-white/5 border-white/5 opacity-40' : 'bg-white/[0.03] border-white/5 hover:border-indigo-500/30'}`}
                      >
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={() => setWorkingHours(prev => ({
                              ...prev,
                              [day.key]: { ...prev[day.key], closed: !prev[day.key].closed }
                            }))}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${workingHours[day.key].closed ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30'}`}
                          >
                            <Check size={16} className={workingHours[day.key].closed ? 'opacity-0' : 'opacity-100'} />
                          </button>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">{day.label}</span>
                        </div>
                        
                        {!workingHours[day.key].closed ? (
                          <div className="flex items-center gap-3">
                            <input 
                              type="time" 
                              value={workingHours[day.key].open}
                              onChange={(e) => setWorkingHours(prev => ({
                                ...prev,
                                [day.key]: { ...prev[day.key], open: e.target.value }
                              }))}
                              className="px-4 py-3 rounded-xl bg-slate-950/50 border border-white/5 text-[11px] font-black text-white outline-none focus:border-indigo-500/50 tabular-nums" 
                            />
                            <span className="text-slate-800 font-black">-</span>
                            <input 
                              type="time"
                              value={workingHours[day.key].close}
                              onChange={(e) => setWorkingHours(prev => ({
                                ...prev,
                                [day.key]: { ...prev[day.key], close: e.target.value }
                              }))}
                              className="px-4 py-3 rounded-xl bg-slate-950/50 border border-white/5 text-[11px] font-black text-white outline-none focus:border-indigo-500/50 tabular-nums" 
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 mr-4 italic">Weekend / Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-10 border-t border-white/5">
                  <label className="flex items-center gap-6 cursor-pointer group w-fit">
                    <div className="relative inline-flex items-center">
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
                      <div className={`w-14 h-7 rounded-full transition-all duration-500 relative cursor-pointer ${isActive ? 'bg-emerald-600 shadow-2xl shadow-emerald-600/30' : 'bg-slate-800'}`}>
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-lg ${isActive ? 'left-[32px]' : 'left-[4px]'}`} />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                        {isActive ? (language === 'uz' ? 'Filial hozirda faol' : 'Branch Active Now') : (language === 'uz' ? 'Vaqtincha yopiq' : 'Temporarily Closed')}
                      </span>
                      <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">Status and Visibility</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-12 py-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-6">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="h-16 px-10 border border-slate-200 text-slate-500 rounded-[24px] font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all"
                >
                  {language === 'uz' ? 'Bekor qilish' : 'Cancel'}
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving || !name || !address} 
                  className="h-16 px-12 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-4 disabled:opacity-50 disabled:grayscale"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : editingBranch ? (language === 'uz' ? 'Saqlash' : 'Save Changes') : (language === 'uz' ? "Qo'shish" : 'Add Branch')}
                  {!isSaving && <ChevronRight size={18} />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
