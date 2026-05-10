/**
 * Warehouse Management Dashboard
 * Ombor boshqaruvi paneli
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingUp, TrendingDown, MapPin, ArrowRightLeft } from 'lucide-react';
import { supabaseApi } from '../../services/supabaseService';

export function WarehouseManagement({ storeId }: { storeId: number }) {
  const [warehouses, setWarehouses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWarehouseData();
  }, [storeId]);

  const loadWarehouseData = async () => {
    try {
      const warehousesData = await supabaseApi.warehouses.list(storeId);
      setWarehouses(warehousesData || []);
      
      if (warehousesData && warehousesData.length > 0) {
        const alertsData = await supabaseApi.warehouses.getAlerts(warehousesData[0].id);
        setAlerts(alertsData || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load warehouse data from Supabase:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="w-6 h-6" />}
          label="Jami Omborlar"
          value={warehouses.length}
          color="blue"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="Ogohlantirishlar"
          value={alerts.length}
          color="red"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Ombor Utilizatsiyasi"
          value={`${warehouses[0]?.utilization_percentage || 0}%`}
          color="green"
        />
        <StatCard
          icon={<ArrowRightLeft className="w-6 h-6" />}
          label="Tranferlar"
          value="3"
          color="purple"
        />
      </div>

      {/* Warehouses List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Omborxonalar</h3>
        <div className="space-y-4">
          {warehouses.map((warehouse: any) => (
            <motion.div
              key={warehouse.id}
              whileHover={{ scale: 1.01 }}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-lg">{warehouse.name}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {warehouse.address}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  warehouse.is_default 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {warehouse.is_default ? 'Asosiy' : 'Qo\'shimcha'}
                </div>
              </div>

              {/* Utilization Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Utilizatsiya</span>
                  <span className="font-bold">{warehouse.utilization_percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      warehouse.utilization_percentage > 90 
                        ? 'bg-red-500' 
                        : warehouse.utilization_percentage > 70 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${warehouse.utilization_percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {warehouse.current_utilization} / {warehouse.total_capacity} mahsulot
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stock Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Ombor Ogohlantirishlari
          </h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert: any) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                    : alert.severity === 'high'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{alert.alert_type}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {alert.product_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{alert.message}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    alert.severity === 'critical' ? 'bg-red-500 text-white' :
                    alert.severity === 'high' ? 'bg-orange-500 text-white' :
                    'bg-yellow-500 text-white'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
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
