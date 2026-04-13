/**
 * Loyalty Program Dashboard Component
 * Mijoz sodiqlik dasturi paneli
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Gift, TrendingUp, Users, Award, ChevronRight } from 'lucide-react';
import { loyaltyAPI } from '../../services/expandedAPI';

interface LoyaltyStats {
  available_points: number;
  total_points: number;
  lifetime_points: number;
  tier_name?: string;
  tier_color?: string;
  total_orders: number;
  total_spent: number;
}

export function LoyaltyDashboard({ storeId }: { storeId: number }) {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [coupons, setCoupons] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoyaltyData();
  }, [storeId]);

  const loadLoyaltyData = async () => {
    try {
      const [loyaltyRes, couponsRes] = await Promise.all([
        loyaltyAPI.getMyLoyalty(storeId),
        loyaltyAPI.getMyCoupons()
      ]);

      setStats(loyaltyRes.data[0]);
      setCoupons(couponsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load loyalty data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Points Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-sm mb-2">Available Points</p>
            <h2 className="text-5xl font-bold mb-2">
              {stats?.available_points?.toLocaleString() || 0}
            </h2>
            <p className="text-indigo-200">
              ≈ {(stats?.available_points || 0).toLocaleString()} so'm chegirma
            </p>
          </div>
          
          {stats?.tier_name && (
            <div className="text-right">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-2"
                style={{ backgroundColor: stats.tier_color || '#CD7F32' }}
              >
                <Award className="w-4 h-4" />
                {stats.tier_name}
              </div>
              <p className="text-indigo-200 text-sm">
                {stats.total_orders} buyurtma
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Lifetime Points"
          value={stats?.lifetime_points?.toLocaleString() || 0}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Total Orders"
          value={stats?.total_orders || 0}
          color="green"
        />
        <StatCard
          icon={<Gift className="w-6 h-6" />}
          label="Active Coupons"
          value={coupons.length}
          color="purple"
        />
      </div>

      {/* Active Coupons */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Faol Kuponlar</h3>
        {coupons.length === 0 ? (
          <p className="text-slate-500">Hozircha kuponlar yo'q</p>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon: any) => (
              <motion.div
                key={coupon.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-lg">{coupon.coupon_code}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}% chegirma`
                      : `${coupon.discount_value.toLocaleString()} so'm chegirma`
                    }
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-500" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Referral Program */}
      <ReferralSection storeId={storeId} />
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} mb-3`}>
        {icon}
      </div>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ReferralSection({ storeId }: { storeId: number }) {
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferral();
  }, []);

  const loadReferral = async () => {
    try {
      const response = await loyaltyAPI.getMyReferrals();
      if (response.data.length > 0) {
        setReferralCode(response.data[0].referral_code);
      }
    } catch (error) {
      console.error('Failed to load referral:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">Referal Dasturi</h3>
      
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Do'stlaringizni taklif qiling va 10,000 so'm bonus oling!
        </p>
        
        {referralCode ? (
          <div className="flex items-center gap-3 mt-3">
            <code className="flex-1 bg-white dark:bg-slate-900 px-4 py-3 rounded-lg font-mono text-lg">
              {referralCode}
            </code>
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {copied ? '✓ Nusxa olindi' : '📋 Nusxa olish'}
            </button>
          </div>
        ) : (
          <button className="mt-3 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Referal kodini olish
          </button>
        )}
      </div>
    </div>
  );
}
