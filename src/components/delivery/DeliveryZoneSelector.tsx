/**
 * Delivery Zone Selector Component
 * Yetkazib berish zonasini tanlash
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { deliveryAPI } from '../../services/expandedAPI';

interface DeliveryZoneSelectorProps {
  storeId: number;
  userLocation?: { lat: number; lng: number };
  onSelectZone: (zone: any) => void;
}

export function DeliveryZoneSelector({ storeId, userLocation, onSelectZone }: DeliveryZoneSelectorProps) {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userZone, setUserZone] = useState<any>(null);

  useEffect(() => {
    loadZones();
  }, [storeId]);

  const loadZones = async () => {
    try {
      const response = await deliveryAPI.getZones(storeId);
      setZones(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load zones:', error);
      setLoading(false);
    }
  };

  const selectZone = (zone: any) => {
    setSelectedZone(zone);
    onSelectZone(zone);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32">Loading zones...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Yetkazib berish zonasi</h3>

      {userZone && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <p className="text-sm text-green-700 dark:text-green-400">
            ✓ Sizning manzilingiz <strong>{userZone.name}</strong> zonasida
          </p>
        </motion.div>
      )}

      <div className="grid gap-3">
        {zones.map((zone: any) => {
          const isSelected = selectedZone?.id === zone.id;
          
          return (
            <motion.div
              key={zone.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => selectZone(zone)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-indigo-500" />
                    <h4 className="font-bold">{zone.name}</h4>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{zone.base_price.toLocaleString()} so'm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{zone.estimated_time_minutes} daqiqa</span>
                    </div>
                  </div>

                  {zone.min_order_amount > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Minimal buyurtma: {zone.min_order_amount.toLocaleString()} so'm
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">
                    {zone.base_price.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">so'm</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedZone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg"
        >
          <p className="text-sm text-indigo-700 dark:text-indigo-400">
            ✓ <strong>{selectedZone.name}</strong> tanlandi
          </p>
        </motion.div>
      )}
    </div>
  );
}
