import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Users, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  Zap, 
  Star, 
  TrendingUp, 
  Crown, 
  Gift, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Gamepad2,
  Medal,
  Activity,
  Flame
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  badge_type: string;
  requirement_value: number;
  reward_points: number;
}

interface Challenge {
  id: number;
  name: string;
  description: string;
  challenge_type: string;
  target_value: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  participant_count: number;
  completion_count: number;
}

export function GamificationDashboard() {
  const { t, language, currentStore } = useApp();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'badges' | 'challenges' | 'leaderboard'>('badges');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!currentStore?.id) {
      setLoading(false);
      return;
    }
    try {
      const [badgesData, challengesData] = await Promise.all([
        supabaseApi.gamification.listBadges(currentStore.id),
        supabaseApi.gamification.listChallenges(currentStore.id)
      ]);
      
      setBadges(badgesData || []);
      setChallenges(challengesData || []);
    } catch (error) {
      console.error('Error loading gamification data from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-slate-950/20 rounded-[48px] border border-white/5 backdrop-blur-3xl">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-6 opacity-50" />
        <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-[10px]">Synchronizing Loyalty Matrix...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'badges', label: 'Reward Badges', icon: Trophy, color: 'purple' },
    { id: 'challenges', label: 'Active Missions', icon: Target, color: 'blue' },
    { id: 'leaderboard', label: 'Elite Leaderboard', icon: Crown, color: 'amber' },
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-1 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
            <span className="text-xs font-black text-purple-400 uppercase tracking-[0.4em]">Retention OS</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-heading">
            Loyalty Engine
          </h1>
          <p className="text-slate-400 mt-2 uppercase tracking-[0.2em] text-[10px] font-black">
            Incentivize customer behavior through game mechanics and rewards
          </p>
        </div>
        <div className="flex items-center gap-4">
            <button className="h-14 px-8 bg-white/5 border border-white/10 text-white rounded-[20px] font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-slate-900 transition-all flex items-center gap-3">
               <Activity size={16} className="text-purple-500" /> System Audit
            </button>
            <button className="h-16 px-10 bg-purple-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-purple-600/30 hover:scale-105 transition-all flex items-center gap-4">
               <Plus size={18} /> {activeTab === 'badges' ? 'New Badge' : 'Launch Mission'}
            </button>
        </div>
      </div>

      {/* High-Impact Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
        {[
          { label: 'Badges Unlocked', value: badges.length, icon: Medal, color: 'purple', trend: '+12%' },
          { label: 'Active Missions', value: challenges.length, icon: Target, color: 'blue', trend: 'Live' },
          { label: 'Total Engagement', value: challenges.reduce((sum, c) => sum + c.participant_count, 0).toLocaleString(), icon: Users, color: 'emerald', trend: '+24%' },
          { label: 'Success Velocity', value: challenges.reduce((sum, c) => sum + c.completion_count, 0).toLocaleString(), icon: Flame, color: 'orange', trend: '+8%' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group"
          >
            <GlassCard className="p-10 border-slate-200 bg-white transition-all duration-700 rounded-[40px] hover:border-purple-500/20 relative overflow-hidden h-full">
              <div className="absolute top-[-20px] right-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <stat.icon size={120} className={`text-${stat.color}-500`} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                   <div className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums group-hover:text-purple-600 transition-colors">{stat.value}</div>
                   <div className="px-3 py-1 bg-slate-50 rounded-full text-[8px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100">{stat.trend}</div>
                </div>
                <div className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">{stat.label}</div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Navigation Matrix */}
      <div className="flex gap-4 p-2 bg-slate-100 rounded-[24px] border border-slate-200 w-fit relative z-10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
              activeTab === tab.id 
              ? `bg-slate-900 text-white shadow-xl shadow-slate-900/20` 
              : 'text-slate-400 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <tab.icon size={16} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="relative z-10"
        >
          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <GlassCard className="p-10 border-slate-200 bg-white rounded-[48px] border text-center hover:border-purple-500/30 transition-all duration-700 h-full flex flex-col relative overflow-hidden hover:shadow-2xl">
                    <div className="absolute top-[-30px] right-[-20px] text-[160px] font-black text-slate-100 select-none pointer-events-none italic font-heading">
                      {index + 1}
                    </div>
                    <div 
                       className="text-6xl mb-10 p-10 rounded-[40px] bg-white/5 border border-white/10 mx-auto group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-2xl"
                       style={{ background: `${badge.color}10`, borderColor: `${badge.color}20` }}
                    >
                      {badge.icon}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter leading-none group-hover:text-purple-600 transition-colors">{badge.name}</h3>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-tight mb-12 leading-relaxed flex-1">{badge.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 shadow-inner">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Requirement</div>
                        <div className="text-lg font-black text-slate-900 tabular-nums tracking-tighter">{badge.requirement_value}</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-100 rounded-3xl p-5 shadow-inner">
                        <div className="text-[8px] font-black text-purple-600 uppercase tracking-widest mb-1">XP Reward</div>
                        <div className="text-lg font-black text-purple-600 tabular-nums tracking-tighter">+{badge.reward_points}</div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
              
              {badges.length === 0 && (
                <div className="col-span-full empty-state-card py-40 flex flex-col items-center justify-center">
                   <Gamepad2 size={100} className="text-slate-100 mb-8" />
                   <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">No Rewards Configured</h2>
                   <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Initialize your first reward badge to engage elite customers.</p>
                   <button className="mt-12 h-16 px-12 bg-purple-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-purple-600/30 hover:scale-105 transition-all">
                      Deploy Initial Badge
                   </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              {challenges.map((challenge) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group"
                >
                  <GlassCard className={`p-12 border rounded-[56px] bg-white transition-all duration-700 flex flex-col h-full relative overflow-hidden ${
                    challenge.is_active ? 'border-blue-200 group-hover:border-blue-500 shadow-xl' : 'border-slate-100 opacity-60'
                  }`}>
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                      <Target size={200} className="text-blue-500" />
                    </div>
                    
                    <div className="flex justify-between items-start mb-12 relative z-10">
                      <div className="flex-1 pr-12">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-12 h-1 bg-blue-500 rounded-full" />
                           <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{challenge.challenge_type.replace('_', ' ')}</span>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none group-hover:text-blue-600 transition-colors">{challenge.name}</h3>
                        <p className="text-slate-400 font-bold text-base leading-relaxed">{challenge.description}</p>
                      </div>
                      {challenge.is_active && (
                        <div className="px-6 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] animate-pulse shadow-2xl shadow-emerald-500/10">
                          Operational
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-[40px] p-10 mb-12 relative z-10 shadow-inner group/progress">
                      <div className="flex justify-between items-end text-[11px] font-black uppercase tracking-[0.3em] mb-6">
                        <span className="text-slate-400">Completion Matrix</span>
                        <span className="text-slate-900 text-2xl tracking-tighter tabular-nums">{challenge.completion_count} <span className="text-slate-300 text-sm">/ {challenge.target_value}</span></span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-5 overflow-hidden border border-white/5 p-1 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (challenge.completion_count / challenge.target_value) * 100)}%` }}
                          className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-[2s]" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8 relative z-10">
                      <div className="bg-white/5 border border-white/5 rounded-[32px] p-6 text-center group-hover:bg-indigo-600/5 transition-all">
                        <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-2">Engaged Users</div>
                        <div className="text-2xl font-black text-blue-400 tabular-nums tracking-tighter">{challenge.participant_count}</div>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-[32px] p-6 text-center group-hover:bg-indigo-600/5 transition-all">
                        <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-2">Success Rate</div>
                        <div className="text-2xl font-black text-emerald-400 tabular-nums tracking-tighter">{challenge.target_value > 0 ? Math.round((challenge.completion_count / challenge.target_value) * 100) : 0}%</div>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-[32px] p-6 text-center group-hover:bg-indigo-600/5 transition-all">
                        <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-2">Time Matrix</div>
                        <div className="text-xs font-black text-purple-400 uppercase tracking-tight">
                           <Clock size={12} className="inline mr-2" />
                           {new Date(challenge.ends_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}

              {challenges.length === 0 && (
                <div className="col-span-full empty-state-card py-40 flex flex-col items-center justify-center">
                   <Target size={100} className="text-slate-100 mb-8" />
                   <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">No Missions Active</h2>
                   <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Launch high-intensity missions to skyrocket short-term conversion.</p>
                   <button className="mt-12 h-16 px-12 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all">
                      Start First Mission
                   </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-10">
              <GlassCard className="p-20 text-center border-slate-200 bg-white rounded-[64px] border relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
                   <Crown size={500} className="text-amber-500" />
                 </div>
                <div className="w-32 h-32 rounded-[40px] bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mx-auto mb-12 shadow-2xl">
                   <Crown size={64} />
                 </div>
                <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-6 leading-none">Elite Arena</h3>
                <p className="text-slate-400 font-bold text-lg leading-relaxed mb-16 max-w-lg mx-auto uppercase tracking-widest">Global synchronization of top-performing customers is in progress. The Elite Arena will launch in the next protocol update.</p>
                <div className="flex items-center justify-center gap-8">
                   <div className="flex items-center gap-3 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                      <ShieldCheck size={20} className="text-emerald-500" /> Secure Protocol
                   </div>
                   <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                   <div className="flex items-center gap-3 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                      <TrendingUp size={20} className="text-amber-500" /> High Performance
                   </div>
                </div>
              </GlassCard>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
