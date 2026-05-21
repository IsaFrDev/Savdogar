import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { orderApi } from '../services/api';
import { ArrowLeft, Phone, MapPin, Package, Clock, Check, Truck, X } from 'lucide-react-native';

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await orderApi.get(orderId);
      setOrder(res.data);
    } catch (e) {
      console.error('Failed to load order:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    Alert.alert(
      'Holatni o\'zgartirish',
      `Buyurtma holatini "${getStatusText(newStatus)}" ga o'zgartirmoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Ha', onPress: async () => {
            setUpdating(true);
            try {
              await orderApi.updateStatus(orderId, newStatus);
              await loadOrder();
            } catch (e) {
              Alert.alert('Xatolik', 'Holatni yangilashda xatolik yuz berdi');
            } finally {
              setUpdating(false);
            }
          }
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'out_for_delivery': return '#8B5CF6';
      default: return '#94A3B8';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Kutilmoqda';
      case 'confirmed': return 'Tasdiqlangan';
      case 'completed': return 'Yakunlangan';
      case 'cancelled': return 'Bekor qilingan';
      case 'out_for_delivery': return 'Yetkazilmoqda';
      default: return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  const statusActions = [
    { status: 'confirmed', label: 'Tasdiqlash', icon: Check, color: '#3B82F6' },
    { status: 'out_for_delivery', label: 'Yetkazishga', icon: Truck, color: '#8B5CF6' },
    { status: 'completed', label: 'Yakunlash', icon: Check, color: '#10B981' },
    { status: 'cancelled', label: 'Bekor qilish', icon: X, color: '#EF4444' },
  ].filter(a => a.status !== order.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#0F172A" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buyurtma #{order.id}</Text>
        <View style={[styles.headerStatus, { backgroundColor: getStatusColor(order.status) + '15' }]}>
          <Text style={[styles.headerStatusText, { color: getStatusColor(order.status) }]}>
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mijoz ma'lumotlari</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Package color="#6366F1" size={16} /></View>
            <Text style={styles.infoText}>{order.customer_name || "Noma'lum"}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Phone color="#6366F1" size={16} /></View>
            <Text style={styles.infoText}>{order.customer_phone || '—'}</Text>
          </View>
          {order.delivery_address && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><MapPin color="#6366F1" size={16} /></View>
              <Text style={styles.infoText}>{order.delivery_address}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Clock color="#6366F1" size={16} /></View>
            <Text style={styles.infoText}>{new Date(order.created_at).toLocaleString('uz-UZ')}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mahsulotlar</Text>
          {(order.items || []).map((item: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name || `Mahsulot #${item.product}`}</Text>
                <Text style={styles.itemQty}>{item.quantity} × {parseFloat(item.price_at_order || item.price || 0).toLocaleString()} so'm</Text>
              </View>
              <Text style={styles.itemTotal}>
                {(item.quantity * parseFloat(item.price_at_order || item.price || 0)).toLocaleString()} so'm
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Jami:</Text>
            <Text style={styles.totalValue}>
              {parseFloat(order.total_amount || order.total || 0).toLocaleString()} so'm
            </Text>
          </View>
        </View>

        {/* Status Actions */}
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Holatni o'zgartirish</Text>
            <View style={styles.actionsGrid}>
              {statusActions.map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.actionBtn, { borderColor: action.color }]}
                  onPress={() => updateStatus(action.status)}
                  disabled={updating}
                >
                  <action.icon color={action.color} size={18} />
                  <Text style={[styles.actionText, { color: action.color }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {order.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Izohlar</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: '#0F172A' },
  headerStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  headerStatusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  content: { padding: 16 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  infoText: { fontSize: 14, color: '#475569', fontWeight: '600', flex: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  itemQty: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#64748B' },
  totalValue: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 2, gap: 8 },
  actionText: { fontSize: 13, fontWeight: '800' },
  notesText: { fontSize: 14, color: '#475569', fontWeight: '500', lineHeight: 22 },
});
