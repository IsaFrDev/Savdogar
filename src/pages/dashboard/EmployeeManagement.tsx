import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Briefcase, Star, Search, Phone, Mail, Calendar, TrendingUp, Loader2, MoreVertical, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';

interface Employee {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  position: string;
  status: string;
  employee_id: string;
  hire_date: string;
  phone: string;
  total_sales: string;
  orders_processed: number;
  customer_rating: string;
}

interface EmployeeManagementProps {
  storeId?: number;
}

export function EmployeeManagement({ storeId }: EmployeeManagementProps) {
  const { t } = useApp();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'on_leave'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEmployees();
  }, [storeId]);

  const loadEmployees = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    try {
      const data = await supabaseApi.staff.list(storeId);
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'manager': return <Briefcase size={18} />;
      case 'sales': return <TrendingUp size={18} />;
      case 'cashier': return <Star size={18} />;
      case 'warehouse': return <ShieldCheck size={18} />;
      default: return <Users size={18} />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'on_leave': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'terminated': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const filteredEmployees = employees
    .filter(emp => {
      if (activeTab === 'all') return true;
      return emp.status === activeTab;
    })
    .filter(emp => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        emp.user.first_name.toLowerCase().includes(q) ||
        emp.user.last_name.toLowerCase().includes(q) ||
        emp.user.username.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q)
      );
    });

  const statCards = [
    { label: t('totalEmployees') || 'Jami xodimlar', value: employees.length, icon: Users, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { label: t('active') || 'Faol', value: employees.filter(e => e.status === 'active').length, icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: t('ordersProcessed') || 'Buyurtmalar', value: employees.reduce((sum, e) => sum + e.orders_processed, 0), icon: TrendingUp, color: 'bg-sky-50 text-sky-600 border-sky-100' },
    { label: t('avgRating') || "O'rtacha reyting", value: employees.length > 0 ? (employees.reduce((sum, e) => sum + parseFloat(e.customer_rating || '0'), 0) / employees.length).toFixed(1) : '0.0', icon: Star, color: 'bg-amber-50 text-amber-600 border-amber-100', isStar: true },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-slate-950 animate-spin mb-6" />
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-1 bg-slate-950 rounded-full shadow-xl shadow-slate-950/20" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">{t('team') || 'Jamoa'}</span>
          </div>
          <h1 className="text-5xl font-black text-slate-950 tracking-tighter uppercase font-heading">{t('employeeManagement') || 'Xodimlar'}</h1>
          <p className="text-slate-400 uppercase tracking-[0.2em] text-[10px] font-black">{t('manageStaff') || "Do'kon xodimlarini boshqarish"}</p>
        </div>

        <button className="h-16 px-12 rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] bg-slate-950 text-white shadow-xl hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
          <UserPlus size={18} />
          {t('addEmployee') || 'Xodim qo\'shish'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <GlassCard key={i} delay={i * 0.1} className="p-8 bg-white border-2 border-slate-50 rounded-[32px] shadow-xl shadow-slate-200/20 relative overflow-hidden group">
            <div className="relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${stat.color} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon size={24} />
              </div>
              <div className="text-4xl font-black text-slate-950 tracking-tighter mb-2">
                {stat.isStar && <span className="text-amber-500 mr-1">⭐</span>}
                {stat.value}
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">{stat.label}</p>
            </div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-slate-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </GlassCard>
        ))}
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder={t('searchEmployees') || 'Xodimlarni qidirish...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 text-slate-950 font-bold outline-none focus:border-slate-950 transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'on_leave'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                activeTab === tab
                  ? 'bg-slate-950 text-white shadow-xl shadow-slate-950/20'
                  : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
              }`}
            >
              {tab === 'all' ? `${t('all') || 'Barchasi'} (${employees.length})`
                : tab === 'active' ? `${t('active') || 'Faol'} (${employees.filter(e => e.status === 'active').length})`
                : `${t('onLeave') || "Ta'tilda"} (${employees.filter(e => e.status === 'on_leave').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Grid */}
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredEmployees.map((employee, index) => (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-8 bg-white border-2 border-slate-50 rounded-[32px] shadow-lg shadow-slate-200/20 hover:shadow-2xl hover:border-slate-100 transition-all duration-500 group relative overflow-hidden">
                <div className="relative z-10">
                  {/* Top Row */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20">
                        {employee.user.first_name?.[0]}{employee.user.last_name?.[0]}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-950 tracking-tight">
                          {employee.user.first_name} {employee.user.last_name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">@{employee.user.username}</p>
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  {/* Status & Position */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(employee.status)}`}>
                      {employee.status === 'active' ? (t('active') || 'Faol') :
                       employee.status === 'on_leave' ? (t('onLeave') || "Ta'tilda") :
                       (t('terminated') || 'Ishdan bo\'shagan')}
                    </span>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
                      {getPositionIcon(employee.position)}
                      <span className="text-[9px] font-black uppercase tracking-widest capitalize">{employee.position}</span>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={14} className="text-slate-300" />
                      <span className="text-slate-600 font-medium">{employee.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={14} className="text-slate-300" />
                      <span className="text-slate-600 font-medium truncate">{employee.user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar size={14} className="text-slate-300" />
                      <span className="text-slate-600 font-medium">{new Date(employee.hire_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-6 border-t-2 border-slate-50">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{t('sales') || 'Sotuvlar'}</div>
                      <div className="text-base font-black text-emerald-600 tracking-tight">
                        {parseFloat(employee.total_sales || '0').toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{t('orders') || 'Buyurtmalar'}</div>
                      <div className="text-base font-black text-indigo-600 tracking-tight">
                        {employee.orders_processed}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button className="flex-1 py-4 bg-slate-950 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95">
                      {t('viewProfile') || "Profilni ko'rish"}
                    </button>
                    <button className="flex-1 py-4 bg-slate-50 border-2 border-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95">
                      {t('edit') || 'Tahrirlash'}
                    </button>
                  </div>
                </div>

                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-700" />
              </GlassCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <GlassCard className="p-16 bg-white border-2 border-slate-50 rounded-[48px] shadow-xl shadow-slate-200/20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-24 h-24 rounded-[32px] bg-slate-50 border-2 border-slate-100 flex items-center justify-center mx-auto mb-8">
              <Users size={40} className="text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase mb-3">
              {t('noEmployeesFound') || 'Xodimlar topilmadi'}
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
              {t('addFirstEmployee') || "Birinchi xodimingizni qo'shing!"}
            </p>
          </div>
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl" />
        </GlassCard>
      )}
    </div>
  );
}
