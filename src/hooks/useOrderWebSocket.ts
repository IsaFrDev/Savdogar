import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

export interface OrderStatusUpdate {
  type: 'order_status_update';
  order_id: number;
  status: string;
  status_label: string;
  message: string;
  timestamp: string;
  data?: any;
}

export interface OrderCreated {
  type: 'order_created';
  order_id: number;
  order_number: string;
  status: string;
  total: number;
  message: string;
  timestamp: string;
  data?: any;
}

export interface OrderCancelled {
  type: 'order_cancelled';
  order_id: number;
  reason: string;
  message: string;
  timestamp: string;
  data?: any;
}

export type OrderWebSocketEvent = OrderStatusUpdate | OrderCreated | OrderCancelled;

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Qabul qilindi',
    confirmed: 'Tasdiqlandi',
    preparing: 'Tayyorlanmoqda',
    shipped: 'Yo\'lda',
    delivered: 'Yetkazildi',
    cancelled: 'Bekor qilindi',
  };
  return labels[status] || status;
};

const getStatusMessage = (status: string, orderNumber: string): string => {
  const messages: Record<string, string> = {
    pending: `Buyurtma #${orderNumber} qabul qilindi va ko'rib chiqilmoqda.`,
    confirmed: `Do'kon buyurtma #${orderNumber}ni tasdiqladi.`,
    preparing: `Buyurtma #${orderNumber} tayyorlanmoqda.`,
    shipped: `Buyurtma #${orderNumber} kuryerga topshirildi va yo'lda.`,
    delivered: `Buyurtma #${orderNumber} muvaffaqiyatli yetkazildi.`,
    cancelled: `Buyurtma #${orderNumber} bekor qilindi.`,
  };
  return messages[status] || `Buyurtma holati o'zgardi: ${status}`;
};

/**
 * WebSocket hook for real-time order tracking using Supabase Realtime.
 */
export function useOrderWebSocket(
  orderId?: number | null,
  storeId?: number | null,
  onEvent?: (event: OrderWebSocketEvent) => void
) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<OrderWebSocketEvent | null>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!supabase) return;

    setStatus('connecting');

    // Build filter for Postgres changes
    let filter = '';
    if (orderId) {
      filter = `id=eq.${orderId}`;
    } else if (storeId) {
      filter = `store_id=eq.${storeId}`;
    }

    const channel = supabase.channel(`orders-realtime-${orderId || storeId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and UPDATE
          schema: 'public',
          table: 'orders',
          filter: filter || undefined
        },
        (payload) => {
          console.log('Order Realtime payload:', payload);
          
          const newOrder = payload.new as any;
          const oldOrder = payload.old as any;
          
          let event: OrderWebSocketEvent | null = null;

          if (payload.eventType === 'INSERT') {
            event = {
              type: 'order_created',
              order_id: newOrder.id,
              order_number: newOrder.order_number,
              status: newOrder.status,
              total: newOrder.total,
              message: `Yangi buyurtma yaratildi: #${newOrder.order_number}`,
              timestamp: new Date().toISOString()
            };
          } else if (payload.eventType === 'UPDATE') {
            if (newOrder.status !== oldOrder?.status) {
              if (newOrder.status === 'cancelled') {
                event = {
                  type: 'order_cancelled',
                  order_id: newOrder.id,
                  reason: newOrder.cancel_reason || 'Noma\'lum sabab',
                  message: getStatusMessage('cancelled', newOrder.order_number),
                  timestamp: new Date().toISOString()
                };
              } else {
                event = {
                  type: 'order_status_update',
                  order_id: newOrder.id,
                  status: newOrder.status,
                  status_label: getStatusLabel(newOrder.status),
                  message: getStatusMessage(newOrder.status, newOrder.order_number),
                  timestamp: new Date().toISOString()
                };
              }
            }
          }

          if (event) {
            setLastUpdate(event);
            if (onEventRef.current) {
              onEventRef.current(event);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Supabase Realtime subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, storeId]);

  const reconnect = () => {
    // Supabase handles reconnect automatically, but we can trigger a re-render if needed
    setStatus('connecting');
  };

  return { status, lastUpdate, reconnect };
}

