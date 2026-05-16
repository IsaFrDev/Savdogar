import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  Clock, 
  User, 
  Plus, 
  Settings, 
  Filter, 
  Search, 
  Zap, 
  Play, 
  Square, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronRight,
  Loader2,
  DollarSign,
  BarChart3,
  BellRing,
  History,
  TrendingUp,
  Activity as ActivityIcon,
  ShoppingCart,
  Coffee,
  Briefcase,
  Users,
  Wallet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { Modal } from '../../components/Modal';
import { supabase } from '../../supabase';

interface ClubManagementProps {
  storeId: number;
}

export function ClubManagement({ storeId }: ClubManagementProps) {
  const { t, formatPrice } = useApp();
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sessionOrders, setSessionOrders] = useState<Record<number, any[]>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeView, setActiveView] = useState<'control' | 'reports' | 'business'>('control');
  
  // Advanced Business
  const [shifts, setShifts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Utilities');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [selectedZone, setSelectedZone] = useState<number | 'all'>('all');
  const [customers, setCustomers] = useState<any[]>([]);
  const [happyHours, setHappyHours] = useState<any[]>([]);
  
  // Modals
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [selectedTariff, setSelectedTariff] = useState<any>(null);
  const [duration, setDuration] = useState<string>('60');
  const [guestName, setGuestName] = useState<string>('');
  const [isActivating, setIsActivating] = useState(false);

  // POS Modal
  const [showPosModal, setShowPosModal] = useState(false);
  const [selectedActiveSession, setSelectedActiveSession] = useState<any>(null);
  const [isOrdering, setIsOrdering] = useState(false);

  // Happy Hours Modal
  const [showHhModal, setShowHhModal] = useState(false);
  const [newHhDiscount, setNewHhDiscount] = useState('20');
  const [newHhZone, setNewHhZone] = useState('');

  useEffect(() => {
    if (storeId) {
      loadClubData();
      loadTariffs();
      loadProducts();
      
      const channel = supabase
        .channel(`club-updates-${storeId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'club_devices', filter: `store_id=eq.${storeId}` }, () => loadClubData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'club_sessions', filter: `store_id=eq.${storeId}` }, () => loadClubData())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_bookings', filter: `store_id=eq.${storeId}` }, (payload) => {
          handleNewBooking(payload.new);
          loadClubData();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'club_bookings', filter: `store_id=eq.${storeId}` }, () => loadClubData())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [storeId]);

  const loadTariffs = async () => {
    try {
      const data = await supabaseApi.club.tariffs.list(storeId);
      setTariffs(data || []);
      if (data && data.length > 0) setSelectedTariff(data[0]);
    } catch (error) {
      console.error('Failed to load tariffs:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data } = await supabaseApi.products.list({ store: storeId });
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadSessionOrders = async (sessionId: number) => {
    try {
      const orders = await supabaseApi.club.sessionOrders.list(sessionId);
      setSessionOrders(prev => ({ ...prev, [sessionId]: orders }));
    } catch (error) {
      console.error('Failed to load session orders:', error);
    }
  };

  const loadClubData = async () => {
    setLoading(true);
    try {
      const [zonesData, devicesData, sessionsData, bookingsData, statsData, shiftsData, expensesData, customersData, hhData] = await Promise.all([
        supabaseApi.club.zones.list(storeId),
        supabaseApi.club.devices.list(storeId),
        supabaseApi.club.sessions.listActive(storeId),
        supabaseApi.club.bookings.list(storeId),
        supabaseApi.club.sessions.getStats(storeId),
        supabaseApi.club.shifts.list(storeId),
        supabaseApi.club.expenses.list(storeId),
        supabaseApi.club.customers.list(storeId),
        supabaseApi.club.happyHours.list(storeId)
      ]);
      
      setZones(zonesData || []);
      setDevices(devicesData || []);
      setActiveSessions(sessionsData || []);
      setBookings(bookingsData || []);
      setStats(statsData || []);
      setShifts(shiftsData || []);
      setExpenses(expensesData || []);
      setCustomers(customersData || []);
      setHappyHours(hhData || []);
      
      if (shiftsData && shiftsData.length > 0) {
        setIsShiftOpen(shiftsData[0].status === 'open');
      }
      
      // Load orders for all active sessions
      if (sessionsData) {
        sessionsData.forEach(session => loadSessionOrders(session.id));
      }
    } catch (error) {
      console.error('Failed to load club data:', error);
    }
    setLoading(false);
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'busy': return 'bg-rose-500';
      case 'booked': return 'bg-amber-500';
      case 'maintenance': return 'bg-slate-400';
      default: return 'bg-slate-200';
    }
  };

  const getActiveSession = (deviceId: number) => {
    return activeSessions.find(s => s.device_id === deviceId);
  };

  const handleStartSession = (device: any) => {
    setSelectedDevice(device);
    const zoneTariffs = tariffs.filter(t => t.zone_id === device.zone_id);
    if (zoneTariffs.length > 0) {
      setSelectedTariff(zoneTariffs[0]);
      setDuration(zoneTariffs[0].duration_minutes?.toString() || '60');
    }
    setShowSessionModal(true);
  };

  const handleActivateSession = async () => {
    if (!selectedDevice || !selectedTariff || !duration) return;
    
    setIsActivating(true);
    try {
      const startTime = new Date().toISOString();
      // Calculate end time if not unlimited
      const durationNum = parseInt(duration);
      const endTime = durationNum > 0 
        ? new Date(Date.now() + durationNum * 60000).toISOString()
        : null;

      const sessionData = {
        store_id: storeId,
        device_id: selectedDevice.id,
        tariff_id: selectedTariff.id,
        user_name: guestName || 'Guest User',
        start_time: startTime,
        end_time: endTime,
        status: 'active',
        total_amount: (selectedTariff.price / (selectedTariff.duration_minutes || 60)) * durationNum
      };

      await supabaseApi.club.sessions.start(sessionData);
      setShowSessionModal(false);
      setGuestName('');
      setIsActivating(false);
    } catch (error) {
      console.error('Failed to start session:', error);
      setIsActivating(false);
    }
  };

  const handleStopSession = async (sessionId: number) => {
    if (!window.confirm('Are you sure you want to stop this session?')) return;
    try {
      await supabaseApi.club.sessions.stop(sessionId, { status: 'completed' });
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  };

  const handleOpenPos = (session: any) => {
    setSelectedActiveSession(session);
    setShowPosModal(true);
  };

  const handleAddProductToSession = async (product: any) => {
    if (!selectedActiveSession || isOrdering) return;
    setIsOrdering(true);
    try {
      const orderData = {
        session_id: selectedActiveSession.id,
        product_id: product.id,
        quantity: 1,
        price: product.price,
        total: product.price
      };
      await supabaseApi.club.sessionOrders.add(orderData);
      
      // Update session's total_amount with the new order's total
      const updatedTotal = (selectedActiveSession.total_amount || 0) + product.price;
      await supabase.from('club_sessions').update({ total_amount: updatedTotal }).eq('id', selectedActiveSession.id);
      
      await loadSessionOrders(selectedActiveSession.id);
      await loadClubData(); // Reload to update main total
    } catch (error) {
      console.error('Failed to add product to session:', error);
    }
    setIsOrdering(false);
  };

  const handleUpdateBookingStatus = async (bookingId: number, status: string) => {
    try {
      await supabaseApi.club.bookings.updateStatus(bookingId, status);
      // Subscription will reload data
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  const handleToggleShift = async () => {
    try {
      if (isShiftOpen) {
        if (!shifts.length || !window.confirm('Haqiqatdan ham smenani yopmoqchimisiz?')) return;
        await supabaseApi.club.shifts.end(shifts[0].id, {
          cash_actual: 0, // This would normally come from a prompt/form
          card_actual: 0
        });
      } else {
        const staff = (await supabase.auth.getUser()).data.user;
        await supabaseApi.club.shifts.start({
          store_id: storeId,
          staff_id: staff?.id,
          status: 'open'
        });
      }
      loadClubData();
    } catch (error) {
      console.error('Failed to toggle shift:', error);
    }
  };

  const handleRecordExpense = async () => {
    if (!expenseDesc || !expenseAmount) return;
    setIsSubmittingExpense(true);
    try {
      const staff = (await supabase.auth.getUser()).data.user;
      await supabaseApi.club.expenses.add({
        store_id: storeId,
        category: expenseCategory,
        amount: parseFloat(expenseAmount),
        description: expenseDesc,
        recorded_by: staff?.id
      });
      setExpenseDesc('');
      setExpenseAmount('');
      loadClubData();
    } catch (error) {
      console.error('Failed to record expense:', error);
    }
    setIsSubmittingExpense(false);
  };

  const handleCreateHappyHour = async () => {
    try {
      await supabaseApi.club.happyHours.create({
        store_id: storeId,
        zone_id: newHhZone ? parseInt(newHhZone) : null,
        start_time: '00:00',
        end_time: '08:00',
        discount_percentage: parseInt(newHhDiscount),
        days_of_week: [0, 1, 2, 3, 4, 5, 6]
      });
      setNewHhDiscount('20');
      loadClubData();
    } catch (err) {
      console.error('Failed to create happy hour:', err);
    }
  };

  const handleNewBooking = (booking: any) => {
    // Show system notification or toast
    if (Notification.permission === 'granted') {
      new Notification('Yangi Band Qilish!', {
        body: `${booking.customer_name} PC-${booking.device_id} uchun so'rov yubordi.`,
        icon: '/logo.png'
      });
    }
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {});
  };

  const filteredDevices = selectedZone === 'all' 
    ? devices 
    : devices.filter(d => d.zone_id === selectedZone);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-slate-950 animate-spin mb-6" />
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Loading Club Control...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-1 bg-slate-950 rounded-full" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.5em]">Club Management</span>
          </div>
          <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase leading-none">
            Real-time <span className="text-indigo-600">Control Center</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 bg-slate-100 p-1.5 rounded-[24px]">
          <button 
            onClick={() => setActiveView('control')}
            className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 ${activeView === 'control' ? 'bg-white text-slate-950 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:text-slate-950'}`}
          >
            <Monitor size={16} /> Control Panel
          </button>
          <button 
            onClick={() => setActiveView('reports')}
            className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 ${activeView === 'reports' ? 'bg-white text-slate-950 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:text-slate-950'}`}
          >
            <BarChart3 size={16} /> Reports
          </button>
          <button 
            onClick={() => setActiveView('business')}
            className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 ${activeView === 'business' ? 'bg-slate-950 text-white shadow-xl shadow-slate-950/20' : 'text-slate-500 hover:text-slate-950'}`}
          >
            <Briefcase size={16} /> Business Tools
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'control' ? (
          <motion.div 
            key="control"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-12"
          >


      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="p-8 border-2 border-slate-50 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Monitor size={24} />
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">Live</div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active PCs</p>
          <h3 className="text-3xl font-black text-slate-950">{activeSessions.length} / {devices.length}</h3>
        </GlassCard>

        <GlassCard className="p-8 border-2 border-slate-50 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest">Queue</div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bookings Today</p>
          <h3 className="text-3xl font-black text-slate-950">{bookings.filter(b => b.status === 'pending').length}</h3>
        </GlassCard>

        <GlassCard className="p-8 border-2 border-slate-50 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">Revenue</div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Income Today</p>
          <h3 className="text-3xl font-black text-slate-950">{formatPrice(activeSessions.reduce((acc, s) => acc + (s.total_amount || 0), 0))}</h3>
        </GlassCard>

        <GlassCard className="p-8 border-2 border-slate-50 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">Avg</div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Session</p>
          <h3 className="text-3xl font-black text-slate-950">2.4h</h3>
        </GlassCard>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 bg-white border border-slate-100 rounded-[32px] shadow-xl shadow-slate-200/40">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 px-2 w-full md:w-auto">
          <button 
            onClick={() => setSelectedZone('all')}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedZone === 'all' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-950'}`}
          >
            All Zones
          </button>
          {zones.map(zone => (
            <button 
              key={zone.id}
              onClick={() => setSelectedZone(zone.id)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedZone === zone.id ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-950'}`}
            >
              {zone.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto px-2">
          <div className="flex bg-slate-50 p-1.5 rounded-2xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}
            >
              <List size={18} />
            </button>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2" />
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search PC..." 
              className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border border-transparent focus:border-slate-950 rounded-2xl text-xs font-black transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Device Grid */}
      <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'grid-cols-1'}`}>
        <AnimatePresence mode="popLayout">
          {filteredDevices.map((device, idx) => {
            const session = getActiveSession(device.id);
            return (
              <motion.div
                key={device.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
              >
                <GlassCard 
                  className={`relative p-6 border-2 transition-all group overflow-hidden ${
                    device.status === 'busy' ? 'border-indigo-500/20 bg-indigo-50/10' : 'border-slate-50 bg-white hover:border-slate-950'
                  }`}
                >
                  {/* Status Indicator */}
                  <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${getDeviceStatusColor(device.status)} shadow-lg`} />
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${device.status === 'busy' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'} transition-all`}>
                        <Monitor size={28} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-950 tracking-tighter">{device.name}</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{device.zone?.name || 'General'}</p>
                      </div>
                    </div>

                    {session ? (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active User</span>
                          <span className="text-xs font-black text-indigo-600 truncate">{session.user_name || 'Guest User'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Time Remaining</span>
                          <div className="flex items-center gap-2">
                             <Clock size={12} className="text-indigo-600" />
                             <SessionTimer startTime={session.start_time} endTime={session.end_time} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleOpenPos(session)}
                            className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                          >
                            <ShoppingCart size={12} /> Bar
                          </button>
                          <button 
                            onClick={() => handleStopSession(session.id)}
                            className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                          >
                            <Square size={12} fill="currentColor" /> Stop
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="h-20 flex flex-col justify-center items-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available</span>
                          <span className="text-[10px] font-black text-slate-300 mt-1">{formatPrice(device.zone?.hourly_price || 0)} / hr</span>
                        </div>
                        <button 
                          onClick={() => handleStartSession(device)}
                          className="w-full py-3 bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                          <Play size={12} fill="currentColor" /> Start Session
                        </button>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bookings & Logs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <GlassCard className="p-10 border-2 border-slate-50 bg-white">
          <div className="flex items-center justify-between mb-10">
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">Recent Bookings</h3>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">Reservations for today</p>
             </div>
             <button className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all">
                <Filter size={20} />
             </button>
          </div>

          <div className="space-y-4">
            {bookings.length > 0 ? bookings.map((booking, idx) => (
              <div key={idx} className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center group-hover:scale-110 transition-transform">
                   <span className="text-[10px] font-black text-indigo-600">{new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex-1">
                   <h5 className="text-sm font-black text-slate-950 uppercase">{booking.customer_name}</h5>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{booking.device?.name}</span>
                      <div className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{booking.customer_phone}</span>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                     className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:scale-110 transition-transform"
                   >
                      <CheckCircle2 size={18} />
                   </button>
                   <button 
                     onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                     className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:scale-110 transition-transform"
                   >
                      <AlertCircle size={18} />
                   </button>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                    <Calendar size={32} />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No bookings for today</p>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-10 border-2 border-slate-50 bg-white">
          <div className="flex items-center justify-between mb-10">
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">Live Session Log</h3>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">Latest system events</p>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live Updates</span>
             </div>
          </div>

          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex gap-6 relative group">
                <div className="w-px h-full bg-slate-100 absolute left-2.5 top-0" />
                <div className="w-5 h-5 rounded-full bg-slate-950 border-4 border-white shadow-sm z-10 mt-1" />
                <div className="flex-1 space-y-2 pb-6 border-b border-slate-50">
                   <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">PC-0{item} Session Started</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">12:45 PM</span>
                   </div>
                   <p className="text-xs text-slate-500 font-medium">Session started for <span className="font-black text-slate-950">Guest_42</span> on PC-0{item} (VIP Zone).</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  ) : (
    <motion.div 
      key="reports"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="p-8 border-2 border-indigo-100 bg-indigo-50/10">
          <TrendingUp className="w-12 h-12 text-indigo-600 mb-6" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue Today</p>
          <h3 className="text-4xl font-black text-slate-950">{formatPrice(stats.reduce((acc, s) => acc + (s.total_amount || 0), 0))}</h3>
        </GlassCard>
        
        <GlassCard className="p-8 border-2 border-emerald-100 bg-emerald-50/10">
          <ActivityIcon className="w-12 h-12 text-emerald-600 mb-6" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sessions</p>
          <h3 className="text-4xl font-black text-slate-950">{stats.length}</h3>
        </GlassCard>

        <GlassCard className="p-8 border-2 border-amber-100 bg-amber-50/10">
          <History className="w-12 h-12 text-amber-600 mb-6" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Ticket Size</p>
          <h3 className="text-4xl font-black text-slate-950">
            {formatPrice(stats.length > 0 ? stats.reduce((acc, s) => acc + (s.total_amount || 0), 0) / stats.length : 0)}
          </h3>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <GlassCard className="p-10 border-2 border-slate-50 bg-white">
           <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase mb-10">Completed Sessions</h3>
           <div className="space-y-6">
              {stats.map((session, idx) => (
                <div key={idx} className="flex items-center justify-between p-6 rounded-[24px] bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-950 border border-slate-100">
                      <Monitor size={20} />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-950 uppercase">{session.user_name}</h5>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(session.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-indigo-600">{formatPrice(session.total_amount)}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{session.tariff?.name}</p>
                  </div>
                </div>
              ))}
              {stats.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No sessions completed today</p>
                </div>
              )}
           </div>
        </GlassCard>

        <GlassCard className="p-10 border-2 border-slate-50 bg-white">
           <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase mb-10">Zone Performance</h3>
           <div className="space-y-8">
              {zones.map(zone => {
                const zoneRevenue = stats.filter(s => s.tariff?.zone_id === zone.id).reduce((acc, s) => acc + (s.total_amount || 0), 0);
                const totalRevenue = stats.reduce((acc, s) => acc + (s.total_amount || 0), 0);
                const percentage = totalRevenue > 0 ? (zoneRevenue / totalRevenue) * 100 : 0;
                
                return (
                  <div key={zone.id} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <h6 className="text-[11px] font-black text-slate-950 uppercase tracking-widest">{zone.name}</h6>
                      <span className="text-[11px] font-black text-indigo-600">{formatPrice(zoneRevenue)}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
           </div>
        </GlassCard>
      </div>
    </motion.div>
  ) : (
    <motion.div 
      key="business"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Shift Management */}
        <GlassCard className="p-8 border-2 border-slate-50 bg-white space-y-6">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-950 mb-2">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">Shift Control</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage staff shifts & cash</p>
          </div>
          
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isShiftOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                   {isShiftOpen ? 'Active' : 'Closed'}
                </span>
             </div>
             {isShiftOpen && (
               <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Cash</span>
                  <span className="text-sm font-black text-slate-950">{formatPrice(stats.reduce((acc, s) => acc + (s.total_amount || 0), 0))}</span>
               </div>
             )}
          </div>
          
          <button 
            onClick={handleToggleShift}
            className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isShiftOpen ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}
          >
            {isShiftOpen ? 'End Current Shift' : 'Start New Shift'}
          </button>
        </GlassCard>

        {/* Expense Tracking */}
        <GlassCard className="p-8 border-2 border-slate-50 bg-white space-y-6">
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mb-2">
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">Expenses</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Record business spending</p>
          </div>
          
          <div className="space-y-4">
            <input 
              type="text" 
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              placeholder="Description (e.g. Internet, Rent)" 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-slate-950" 
            />
            <input 
              type="number" 
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="Amount" 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-slate-950" 
            />
            <select 
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-slate-950"
            >
               <option value="Utilities">Utilities</option>
               <option value="Rent">Rent</option>
               <option value="Salary">Salary</option>
               <option value="Inventory">Inventory</option>
               <option value="Other">Other</option>
            </select>
          </div>
          
          <button 
            onClick={handleRecordExpense}
            disabled={isSubmittingExpense || !expenseDesc || !expenseAmount}
            className="w-full py-4 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-950/20 disabled:opacity-50"
          >
            {isSubmittingExpense ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Record Expense'}
          </button>
        </GlassCard>

        {/* Happy Hours & Marketing */}
        <GlassCard className="p-8 border-2 border-slate-50 bg-white space-y-6">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-2">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">Happy Hours</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dynamic pricing rules</p>
          </div>
          
          <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
               Lower prices automatically during off-peak hours to increase foot traffic.
             </p>
          </div>
          
          <button 
            onClick={() => setShowHhModal(true)}
            className="w-full py-4 bg-white border border-slate-200 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest hover:border-slate-950 transition-all"
          >
            Configure Rules
          </button>
        </GlassCard>

        {/* Customers CRM */}
        <GlassCard className="p-8 border-2 border-slate-50 bg-white space-y-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">Customer CRM</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Loyalty & Cashback tracking</p>
              </div>
            </div>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
              Manage Customers
            </button>
          </div>
          
          <div className="w-full overflow-x-auto">
             <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                   <tr>
                      <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
                      <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tier</th>
                      <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cashback Balance</th>
                   </tr>
                </thead>
                <tbody>
                   {customers.length > 0 ? customers.map((c) => (
                     <tr key={c.id} className="bg-slate-50">
                        <td className="px-4 py-4 rounded-l-xl text-xs font-black text-slate-950">{c.name}</td>
                        <td className="px-4 py-4 text-xs font-black text-slate-500">{c.phone || '-'}</td>
                        <td className="px-4 py-4">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${c.tier === 'gold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{c.tier}</span>
                        </td>
                        <td className="px-4 py-4 rounded-r-xl text-xs font-black text-slate-950">{formatPrice(c.cashback_balance)}</td>
                     </tr>
                   )) : (
                     <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">No customers found.</td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  )}
</AnimatePresence>

      {/* Start Session Modal */}
      <Modal 
        show={showSessionModal} 
        onClose={() => setShowSessionModal(false)}
        title={`Start Session - ${selectedDevice?.name}`}
      >
        <div className="p-8 space-y-8">
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Tariff</label>
                 <select 
                   value={selectedTariff?.id}
                   onChange={(e) => {
                     const tariff = tariffs.find(t => t.id === parseInt(e.target.value));
                     setSelectedTariff(tariff);
                     if (tariff) setDuration(tariff.duration_minutes?.toString() || '60');
                   }}
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-slate-950 transition-all"
                 >
                    {tariffs.filter(t => t.zone_id === selectedDevice?.zone_id).map(tariff => (
                      <option key={tariff.id} value={tariff.id}>{tariff.name} ({formatPrice(tariff.price)})</option>
                    ))}
                    {tariffs.filter(t => t.zone_id === selectedDevice?.zone_id).length === 0 && (
                      <option disabled>No tariffs for this zone</option>
                    )}
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration (min)</label>
                 <input 
                   type="number" 
                   value={duration}
                   onChange={(e) => setDuration(e.target.value)}
                   placeholder="60" 
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-slate-950 transition-all" 
                 />
              </div>
           </div>

           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name (Optional)</label>
              <input 
                type="text" 
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter guest name" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-slate-950 transition-all" 
              />
           </div>

           <div className="p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100 flex items-center justify-between">
              <div>
                 <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Total Estimated</p>
                 <h4 className="text-2xl font-black text-indigo-600 tracking-tighter">
                   {formatPrice(selectedTariff ? (selectedTariff.price / (selectedTariff.duration_minutes || 60)) * parseInt(duration || '0') : 0)}
                 </h4>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">End Time</p>
                 <h4 className="text-lg font-black text-slate-950 tracking-tighter">
                   {duration && parseInt(duration) > 0 
                     ? new Date(Date.now() + parseInt(duration) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                     : '--:--'}
                 </h4>
              </div>
           </div>

           <div className="flex gap-4">
              <button 
                onClick={() => setShowSessionModal(false)}
                className="flex-1 py-5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleActivateSession}
                disabled={isActivating || !selectedTariff}
                className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isActivating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Activate Session'}
              </button>
           </div>
        </div>
      </Modal>

      {/* Mini-Bar POS Modal */}
      <Modal 
        show={showPosModal} 
        onClose={() => {
          setShowPosModal(false);
          setSelectedActiveSession(null);
        }}
        title={`Mini-bar: ${selectedActiveSession?.device?.name || 'PC'}`}
      >
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
             <div>
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Guest</p>
                <h4 className="text-sm font-black text-slate-950">{selectedActiveSession?.user_name || 'Guest User'}</h4>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Session Bill</p>
                <h4 className="text-lg font-black text-slate-950">{formatPrice(selectedActiveSession?.total_amount || 0)}</h4>
             </div>
          </div>

          <div>
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Current Orders</h3>
             <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {selectedActiveSession && sessionOrders[selectedActiveSession.id]?.length > 0 ? (
                  sessionOrders[selectedActiveSession.id].map((order: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                       <span className="text-xs font-black text-slate-950">{order.product?.name || 'Item'} x{order.quantity}</span>
                       <span className="text-xs font-black text-slate-400">{formatPrice(order.total)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No items ordered yet.</p>
                )}
             </div>
          </div>

          <div>
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Add Products</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                {products.length > 0 ? products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleAddProductToSession(product)}
                    disabled={isOrdering}
                    className="p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-600/10 transition-all disabled:opacity-50"
                  >
                     <Coffee className="w-6 h-6 text-indigo-600 mb-2" />
                     <h4 className="text-xs font-black text-slate-950 truncate">{product.name}</h4>
                     <p className="text-[10px] font-black text-slate-400 mt-1">{formatPrice(product.price)}</p>
                  </button>
                )) : (
                  <div className="col-span-3 text-center py-8">
                     <p className="text-xs text-slate-400">No products found in store inventory.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </Modal>
      {/* Happy Hours Modal */}
      <Modal 
        show={showHhModal} 
        onClose={() => setShowHhModal(false)}
        title="Happy Hours Configuration"
      >
        <div className="p-8 space-y-8">
           <div className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Rules</h3>
             {happyHours.length > 0 ? happyHours.map(hh => (
               <div key={hh.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-black text-slate-950">{hh.discount_percentage}% OFF</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase">{hh.start_time} - {hh.end_time} • {hh.zone?.name || 'All Zones'}</p>
                  </div>
                  <button 
                    onClick={async () => {
                      await supabaseApi.club.happyHours.delete(hh.id);
                      loadClubData();
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-rose-500 hover:bg-rose-50"
                  >
                    <Square size={14} />
                  </button>
               </div>
             )) : (
               <p className="text-xs text-slate-400 italic">No happy hour rules defined.</p>
             )}
           </div>

           <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-4">
              <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Add New Rule (Night Owl)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount %</label>
                    <input 
                      type="number" 
                      value={newHhDiscount}
                      onChange={(e) => setNewHhDiscount(e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-slate-950" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zone</label>
                    <select 
                      value={newHhZone}
                      onChange={(e) => setNewHhZone(e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-slate-950"
                    >
                       <option value="">All Zones</option>
                       {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                 </div>
              </div>
              
              <button 
                onClick={handleCreateHappyHour}
                className="w-full py-4 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
              >
                Add 00:00 - 08:00 Rule
              </button>
           </div>
        </div>
      </Modal>
    </div>
  );
}

function SessionTimer({ startTime, endTime }: { startTime: string, endTime: string | null }) {
  const [timeLeft, setTimeLeft] = useState('--:--:--');

  useEffect(() => {
    const timer = setInterval(() => {
      if (!endTime) {
        // Count up for open sessions
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        const diff = now - start;
        
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        return;
      }

      // Count down for limited sessions
      const end = new Date(endTime).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, endTime]);

  return <span className={`text-base font-black tabular-nums ${endTime ? 'text-slate-950' : 'text-indigo-600'}`}>{timeLeft}</span>;
}

