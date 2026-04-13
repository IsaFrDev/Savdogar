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
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { staffApi, staffRoleApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

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
      const [staffRes, rolesRes] = await Promise.all([
        staffApi.list(currentStore.id),
        staffRoleApi.list(currentStore.id)
      ]);
      setStaff(staffRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error('Failed to load staff data:', error);
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
      await staffApi.create(currentStore.id, {
        email,
        role_id: selectedRole || null,
        staff_type: staffType,
        is_active: true
      });
      setIsModalOpen(false);
      loadStaffData();
      setEmail('');
    } catch (error: any) {
      alert(error.response?.data?.error || t('errorOccurred'));
    }
    setIsSaving(false);
  };

  const handleRemoveStaff = async (id: number) => {
    if (!currentStore?.id || !confirm(language === 'uz' ? "Xodimni o'chirmoqchimisiz?" : "Remove staff member?")) return;
    try {
      await staffApi.delete(currentStore.id, id);
      loadStaffData();
    } catch (error) {
      console.error('Failed to remove staff:', error);
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

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
            {t('staffAndRoles')}
          </h1>
          <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">
            {language === 'uz' ? "Do'koningiz boshqaruvini jamoangiz bilan ulashing" : "Share your store management with your team"}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-indigo-500/20">
          <UserPlus className="w-5 h-5" />
          {language === 'uz' ? "Xodim qo'shish" : 'Add Member'}
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveSubTab('members')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'members' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {t('members')}
        </button>
        <button 
          onClick={() => setActiveSubTab('roles')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'roles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {t('roles')}
        </button>
      </div>

      {activeSubTab === 'members' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
               <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('noStaffAdded')}</p>
            </div>
          ) : (
            staff.map(member => (
              <GlassCard key={member.id} className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 border border-indigo-100/50">
                  <User className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight truncate w-full">{member.user_full_name || 'Ismsiz xodim'}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">{member.user_email}</p>
                
                <div className="flex items-center gap-2 mb-6">
                  <span className="px-3 py-1 rounded-lg bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-600">
                    {member.staff_type}
                  </span>
                  {member.role_name && (
                    <span className="px-3 py-1 rounded-lg bg-indigo-100 text-[9px] font-black uppercase tracking-widest text-indigo-600">
                      {member.role_name}
                    </span>
                  )}
                </div>

                <div className="w-full pt-4 border-t border-slate-100 flex justify-center">
                  <button 
                    onClick={() => handleRemoveStaff(member.id)}
                    className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map(role => (
            <GlassCard key={role.id} className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <div className="p-3 rounded-xl bg-amber-50 text-amber-500">
                   <Shield className="w-5 h-5" />
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role.members_count} a'zolar</span>
               </div>
               <h3 className="font-black text-slate-800 uppercase tracking-tight mb-4">{role.name}</h3>
               <div className="flex flex-wrap gap-1.5 mb-6">
                 {role.permissions.map(p => (
                   <span key={p} className="px-2 py-0.5 rounded bg-slate-100 text-[8px] font-bold uppercase text-slate-500">
                     {p}
                   </span>
                 ))}
               </div>
            </GlassCard>
          ))}
          <button className="h-full min-h-[200px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center hover:bg-slate-50 transition-colors group">
            <Plus className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 transition-colors mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('createRole')}</span>
          </button>
        </div>
      )}

      {/* Add Member Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-20 pb-20 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{t('addMember')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email manzili</label>
                  <Input 
                    value={email} 
                    onChange={setEmail} 
                    placeholder="example@mail.com" 
                    className="!rounded-2xl !bg-slate-50 !border-slate-100 !h-14 font-bold"
                  />
                  <p className="text-[9px] text-slate-400 font-medium ml-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Faqat Savdoonda ro'yxatdan o'tgan foydalanuvchilar qo'shilishi mumkin.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Boshqaruv turi</label>
                  <select 
                    value={staffType}
                    onChange={(e) => setStaffType(e.target.value as any)}
                    className="w-full h-14 rounded-2xl bg-slate-50 border-slate-100 border px-6 font-bold text-sm outline-none"
                  >
                    <option value="manager">Manager</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Administrator</option>
                    <option value="courier">Kuryer</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Maxsus Rol (ixtiyoriy)</label>
                  <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full h-14 rounded-2xl bg-slate-50 border-slate-100 border px-6 font-bold text-sm outline-none"
                  >
                    <option value="">Rolsiz (standart huquqlar)</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-10 bg-slate-50 flex items-center gap-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]">{t('cancel')}</Button>
                <Button 
                  onClick={handleAddMember} 
                  disabled={isSaving || !email}
                  className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] bg-indigo-500 text-white shadow-xl shadow-indigo-500/20"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : t('addMember')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
