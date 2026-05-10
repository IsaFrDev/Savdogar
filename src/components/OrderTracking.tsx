import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { useOrderWebSocket, OrderWebSocketEvent } from '../hooks/useOrderWebSocket';

interface OrderTrackingProps {
  orderId: number;
  currentStatus: string;
  orderNumber?: string;
  totalAmount?: number;
  onStatusChange?: (newStatus: string) => void;
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const statusColors: Record<string, string> = {
  pending: 'text-yellow-500',
  confirmed: 'text-blue-500',
  preparing: 'text-purple-500',
  shipped: 'text-orange-500',
  delivered: 'text-green-500',
  cancelled: 'text-red-500',
};

const statusSteps = [
  { key: 'pending', label: 'Qabul qilindi', icon: Clock, detail: 'Buyurtmangiz tizimga muvaffaqiyatli kiritildi' },
  { key: 'confirmed', label: 'Tasdiqlandi', icon: CheckCircle, detail: 'Do\'kon buyurtmangizni tasdiqladi' },
  { key: 'preparing', label: 'Tayyorlanmoqda', icon: Package, detail: 'Mahsulotlar qadoqlashga tayyorlanmoqda' },
  { key: 'shipped', label: 'Yo\'lda', icon: Truck, detail: 'Kuryer buyurtmani yetkazish uchun yo\'lga chiqdi' },
  { key: 'delivered', label: 'Yetkazildi', icon: CheckCircle, detail: 'Buyurtma muvaffaqiyatli topshirildi' },
];

export const OrderTracking: React.FC<OrderTrackingProps> = ({
  orderId,
  currentStatus,
  orderNumber,
  totalAmount = 0,
  onStatusChange,
}) => {
  const [status, setStatus] = useState(currentStatus);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Connect to order WebSocket
  const { status: wsStatus, lastUpdate, reconnect } = useOrderWebSocket(
    orderId,
    undefined,
    (event: OrderWebSocketEvent) => {
      if (event.type === 'order_status_update') {
        setStatus(event.status);
        
        // Add notification
        setNotifications(prev => [
          {
            id: Date.now(),
            message: event.message,
            timestamp: event.timestamp,
            status: event.status,
          },
          ...prev.slice(0, 4), // Keep last 5
        ]);
        
        // Notify parent
        if (onStatusChange) {
          onStatusChange(event.status);
        }
      }
    }
  );

  const getStatusIndex = (statusKey: string) => {
    return statusSteps.findIndex(step => step.key === statusKey);
  };

  const currentIndex = getStatusIndex(status);

  return (
    <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl max-w-2xl mx-auto border border-gray-100 font-sans">
      {/* Header Section */}
      <div className="p-8 pb-4 flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-[#1E293B] tracking-tighter leading-none uppercase">
            Buyurtma<br />Tafsilotlari
          </h2>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-black text-indigo-500 uppercase tracking-widest"># {orderNumber || orderId}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all shadow-sm">
            <RefreshCw className="w-5 h-5" onClick={reconnect} />
          </button>
          <button className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all shadow-sm">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-100 mx-8" />

      <div className="p-8 space-y-10">
        {/* Connection Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 w-max rounded-xl border border-gray-100">
           <div className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500'}`} />
           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
             {wsStatus === 'connected' ? 'Real-time Live' : 'Sinxronizatsiya...'}
           </span>
        </div>

        {/* Timeline Area */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1">Order Status History</h4>
          
          <div className="relative pl-12 space-y-12">
             {/* Vertical Line */}
             <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  className="w-full bg-indigo-500 origin-top"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: (currentIndex + 1) / statusSteps.length }}
                  transition={{ duration: 1, ease: "circOut" }}
                />
             </div>

             {statusSteps.map((step, index) => {
               const isCompleted = index <= currentIndex;
               const isCurrent = index === currentIndex;
               const Icon = step.icon;

               return (
                 <motion.div 
                   key={step.key}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: index * 0.1 }}
                   className="relative flex items-start gap-6 group"
                 >
                    {/* Step Icon Node */}
                    <div className={`absolute -left-12 w-10 h-10 rounded-2xl border-4 border-white shadow-xl z-10 flex items-center justify-center transition-all duration-500 ${
                      isCompleted ? 'bg-indigo-500 text-white scale-110' : 'bg-gray-100 text-gray-300'
                    }`}>
                      <Icon className={`w-4 h-4 ${isCurrent ? 'animate-bounce' : ''}`} />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-indigo-500 rounded-2xl animate-ping opacity-20" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h5 className={`font-black uppercase tracking-tight ${isCompleted ? 'text-[#1E293B]' : 'text-gray-300'}`}>
                          {step.label}
                        </h5>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-indigo-100">
                            Faol bosqich
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 font-medium leading-relaxed ${isCompleted ? 'text-gray-500' : 'text-gray-200'}`}>
                        {step.detail}
                      </p>
                    </div>
                 </motion.div>
               );
             })}
          </div>
        </div>

        {/* Amount Card - Dark Premium */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative p-8 rounded-[2.5rem] bg-[#0A0B1A] overflow-hidden group shadow-2xl"
        >
          {/* Abstract Decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 blur-3xl -ml-12 -mb-12" />

          <div className="relative flex items-end justify-between">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] opacity-80">Total Amount</p>
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black text-white tracking-tighter tabular-nums">
                  {totalAmount.toLocaleString()}
                </span>
              </div>
              <p className="text-xs font-black text-indigo-300 uppercase tracking-widest opacity-60">UZS</p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em]">
                   {status === 'pending' ? 'KUTILMOQDA' : status.toUpperCase()}
                 </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Real-time Ticker */}
        <AnimatePresence>
          {notifications.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pt-4"
            >
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Live Update</p>
                  <p className="text-xs font-bold text-[#1E293B] truncate">{notifications[0].message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
