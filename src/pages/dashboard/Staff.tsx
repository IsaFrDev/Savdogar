import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Shield, 
  User, 
  Mail, 
  Check, 
  X, 
  Loader2, 
  ShieldCheck,
  UserPlus,
  Settings,
  Lock,
  Unlock,
  AlertCircle,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';

interface StaffRole {
  id: number;
  name: string;
  permissions: string[];
  is_active: boolean;
  members_count: number;
}

interface StaffMember {
  id: number;
  user_email: string;
  user_full_name: string;
  role_name: string;
  is_active: boolean;
  staff_type: 'admin' | 'manager' | 'operator' | 'courier';
}

export function Staff() {
  const { t, language, currentStore } = useApp();
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'roles'>('members');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Member Form
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [staffType, setStaffType] = useState<'admin' | 'manager' | 'operator' | 'courier'>('manager');

  const loadStaffData = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const [staffData, rolesData] = await Promise.all([
        supabaseApi.staff.list(currentStore.id),
        supabaseApi.staffRoles.list(currentStore.id)
      ]);
      setStaff(staffData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to load staff data from Supabase:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStaffData();
  }, [currentStore?.id]);

  const handleAddMember = async () => {
    if (!currentStore?.id) return;
    setIsSaving(true);
    try {
      await supabaseApi.staff.create(currentStore.id, {
        user_email: email, // Supabase-da user_email bo'lishi mumkin
        role_id: selectedRole || null,
        staff_type: staffType,
        is_active: true
      });
      setIsModalOpen(false);
      loadStaffData();
      setEmail('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Xatolik yuz berdi');
    }
    setIsSaving(false);
  };

  const handleRemoveStaff = async (id: number) => {
    if (!currentStore?.id || !confirm(language === 'uz' ? "Xodimni o'chirmoqchimisiz?" : "Remove staff member?")) return;
    try {
      await supabaseApi.staff.delete(currentStore.id, id);
      loadStaffData();
    } catch (error) {
      console.error('Failed to remove staff:', error);
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

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-1 bg-indigo-500 rounded-full" />
            <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Organization</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase font-heading">
            {language === 'uz' ? 'Xodimlar' : 'Staff & Roles'}
          </h1>
          <p className="text-slate-500 mt-2 uppercase tracking-[0.2em] text-[10px] font-black">
            {language === 'uz' ? "Do'koningiz boshqaruvini jamoangiz bilan ulashing" : "Share your store management with your team"}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="h-16 px-10 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-4"
        >
          <UserPlus size={18} />
          {language === 'uz' ? "Xodim qo'shish" : 'Add Member'}
        </button>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex gap-4 p-2 bg-white/5 rounded-[24px] w-fit border border-white/5 backdrop-blur-xl">
        <button 
          onClick={() => setActiveSubTab('members')}
          className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeSubTab === 'members' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
        >
          {language === 'uz' ? 'Xodimlar' : 'Members'}
        </button>
        <button 
          onClick={() => setActiveSubTab('roles')}
          className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeSubTab === 'roles' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
        >
          {language === 'uz' ? 'Rollar' : 'Roles'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'members' ? (
          <motion.div 
            key="members"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            {staff.length === 0 ? (
              <GlassCard className="col-span-full py-32 text-center border-dashed border-2 border-white/5 bg-slate-900/20 backdrop-blur-3xl flex flex-col items-center rounded-[48px]">
                 <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center mb-8 text-slate-700 shadow-inner">
                    <User size={40} />
                 </div>
                 <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Hali xodimlar qo'shilmagan</p>
              </GlassCard>
            ) : (
              staff.map(member => (
                <GlassCard key={member.id} className="p-10 border-white/5 bg-slate-900/40 backdrop-blur-3xl transition-all duration-700 rounded-[40px] hover:border-indigo-500/30 group">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-[28px] bg-indigo-600/10 text-indigo-400 flex items-center justify-center mb-6 border border-indigo-500/20 shadow-2xl group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700">
                      <User size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter truncate w-full group-hover:text-indigo-400 transition-colors">
                      {member.user_full_name || 'Unnamed Staff'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 mb-8">{member.user_email}</p>
                    
                    <div className="flex items-center gap-3 mb-10">
                      <span className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:border-indigo-500/30 transition-colors">
                        {member.staff_type}
                      </span>
                      {member.role_name && (
                        <span className="px-4 py-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">
                          {member.role_name}
                        </span>
                      )}
                    </div>

                    <div className="w-full pt-8 border-t border-white/5 flex justify-center">
                      <button 
                        onClick={() => handleRemoveStaff(member.id)}
                        className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-500 shadow-xl shadow-rose-500/10"
                      >
                        <Trash2 size={20} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="roles"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            {roles.map(role => (
              <GlassCard key={role.id} className="p-10 border-white/5 bg-slate-900/40 backdrop-blur-3xl transition-all duration-700 rounded-[40px] hover:border-indigo-500/30 group">
                 <div className="flex items-center justify-between mb-8">
                   <div className="w-14 h-14 rounded-2xl bg-amber-600/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-2xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-700">
                     <Shield size={24} />
                   </div>
                   <span className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500">{role.members_count} Members</span>
                 </div>
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 group-hover:text-amber-400 transition-colors">{role.name}</h3>
                 <div className="flex flex-wrap gap-2 mb-8">
                   {role.permissions.map(p => (
                     <span key={p} className="px-3 py-1 rounded-lg bg-slate-950/50 border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:border-amber-500/30 transition-colors">
                       {p}
                     </span>
                   ))}
                 </div>
                 <div className="pt-8 border-t border-white/5 flex justify-end">
                    <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-600 hover:text-white transition-all">
                      <Settings size={18} />
                    </button>
                 </div>
              </GlassCard>
            ))}
            <button className="h-full min-h-[300px] border-2 border-dashed border-white/5 bg-white/[0.01] rounded-[40px] flex flex-col items-center justify-center hover:bg-white/[0.03] hover:border-indigo-500/30 transition-all duration-700 group">
              <div className="w-20 h-20 rounded-[28px] bg-white/5 flex items-center justify-center mb-6 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-700 shadow-inner">
                <Plus size={32} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 group-hover:text-indigo-400 transition-colors">Create New Role</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-slate-900/60 backdrop-blur-3xl border border-white/5 rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="px-12 py-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase font-heading">Add Member</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mt-2">Grant access to your store management</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="p-12 space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="example@mail.com" 
                    className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:border-indigo-500/50 transition-all"
                  />
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <ShieldAlert size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">
                      User must be already registered on Savdoon platform to be added as a staff member.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Staff Access Type</label>
                  <div className="relative">
                    <select 
                      value={staffType}
                      onChange={(e) => setStaffType(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="manager">Manager</option>
                      <option value="operator">Operator</option>
                      <option value="admin">Administrator</option>
                      <option value="courier">Courier</option>
                    </select>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <ChevronRight size={20} className="rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Custom Role (Optional)</label>
                  <div className="relative">
                    <select 
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">No Role (Default permissions)</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <ChevronRight size={20} className="rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-12 py-10 bg-white/[0.02] border-t border-white/5 flex items-center justify-end gap-6">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="h-16 px-10 border border-white/10 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddMember} 
                  disabled={isSaving || !email}
                  className="h-16 px-12 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-4 disabled:opacity-50 disabled:grayscale"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : "Add Member"}
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
