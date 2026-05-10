import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { storeApi, orderApi } from '../services/api';
import { Store, Plus, ShoppingCart, TrendingUp, Package, Bell, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [currentStore, setCurrentStore] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, totalProducts: 0 });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentStore) {
      loadStoreData(currentStore.id);
    }
  }, [currentStore]);

  const loadData = async () => {
    try {
      const res = await storeApi.list();
      const storeList = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setStores(storeList);
      if (storeList.length > 0 && !currentStore) {
        setCurrentStore(storeList[0]);
      }
    } catch (e) {
      console.error('Failed to load stores:', e);
    }
  };

  const loadStoreData = async (storeId: number) => {
    try {
      const ordersRes = await orderApi.list({ store: storeId, limit: 5 });
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data.results || []);
      setRecentOrders(orders.slice(0, 5));

      const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || o.total || 0), 0);
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders,
        totalProducts: currentStore?.products_count || 0,
      });
    } catch (e) {
      console.error('Failed to load store data:', e);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    if (currentStore) await loadStoreData(currentStore.id);
    setRefreshing(false);
  }, [currentStore]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Salom,</Text>
          <Text style={styles.userName}>{user?.first_name || user?.username} 👋</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Bell color="#1E293B" size={22} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Selector */}
        {currentStore && (
          <View style={styles.storeSelector}>
            <View style={styles.storeIconBox}>
              <Store color="#6366F1" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeSelectorLabel}>Faol do'kon</Text>
              <Text style={styles.storeSelectorName}>{currentStore.name}</Text>
            </View>
            {stores.length > 1 && (
              <TouchableOpacity style={styles.switchBtn}>
                <Text style={styles.switchBtnText}>Almashtirish</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#6366F1' }]}>
            <TrendingUp color="rgba(255,255,255,0.7)" size={20} />
            <Text style={styles.statValue}>{stats.totalRevenue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Bugungi tushum</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#1E293B' }]}>
            <ShoppingCart color="rgba(255,255,255,0.7)" size={20} />
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Buyurtmalar</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <Bell color="rgba(255,255,255,0.7)" size={20} />
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Kutilmoqda</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <Package color="rgba(255,255,255,0.7)" size={20} />
            <Text style={styles.statValue}>{stats.totalProducts}</Text>
            <Text style={styles.statLabel}>Mahsulotlar</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Tezkor harakatlar</Text>
        <View style={styles.quickActions}>
          {[
            { label: 'Buyurtmalar', icon: ShoppingCart, color: '#6366F1', screen: 'Orders' },
            { label: 'Mahsulotlar', icon: Package, color: '#10B981', screen: 'Products' },
            { label: "Yangi do'kon", icon: Plus, color: '#1E293B', screen: 'StoreWizard' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                <action.icon color={action.color} size={20} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>So'nggi buyurtmalar</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.seeAll}>Barchasi →</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingCart color="#CBD5E1" size={40} />
            <Text style={styles.emptyText}>Hali buyurtmalar yo'q</Text>
          </View>
        ) : (
          recentOrders.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            >
              <View style={styles.orderLeft}>
                <Text style={styles.orderId}>#{order.id}</Text>
                <Text style={styles.orderCustomer}>{order.customer_name || 'Noma\'lum'}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                </Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>
                  {parseFloat(order.total_amount || order.total || 0).toLocaleString()} so'm
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>
              <ChevronRight color="#CBD5E1" size={18} />
            </TouchableOpacity>
          ))
        )}

        {/* Stores List */}
        {stores.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Do'konlarim</Text>
            {stores.map((store: any) => (
              <TouchableOpacity
                key={store.id}
                style={[styles.storeCard, currentStore?.id === store.id && styles.storeCardActive]}
                onPress={() => setCurrentStore(store)}
              >
                <View style={styles.storeCardIcon}>
                  <Store color={currentStore?.id === store.id ? '#6366F1' : '#94A3B8'} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeCardName}>{store.name}</Text>
                  <Text style={styles.storeCardType}>{store.business_type}</Text>
                </View>
                <View style={[styles.storeCardStatus, { backgroundColor: store.status === 'approved' ? '#DCFCE7' : '#FEF3C7' }]}>
                  <Text style={[styles.storeCardStatusText, { color: store.status === 'approved' ? '#16A34A' : '#D97706' }]}>
                    {store.status === 'approved' ? 'Faol' : 'Kutilmoqda'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  greeting: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  userName: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  notifBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  notifDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'white' },
  scrollContent: { padding: 20 },
  storeSelector: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  storeIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  storeSelectorLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  storeSelectorName: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  switchBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
  switchBtnText: { fontSize: 11, fontWeight: '700', color: '#6366F1' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: { width: (width - 52) / 2, padding: 18, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
  statValue: { fontSize: 22, fontWeight: '900', color: 'white', marginTop: 10, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: -0.3, marginBottom: 16 },
  seeAll: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  quickActionBtn: { flex: 1, padding: 16, backgroundColor: 'white', borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  quickActionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionLabel: { fontSize: 11, fontWeight: '700', color: '#475569', textAlign: 'center' },
  orderCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  orderLeft: { flex: 1 },
  orderId: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  orderCustomer: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  orderDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  orderRight: { alignItems: 'flex-end', marginRight: 8 },
  orderAmount: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 4, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '600', marginTop: 12 },
  storeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderRadius: 20, marginBottom: 10, borderWidth: 2, borderColor: '#F1F5F9' },
  storeCardActive: { borderColor: '#6366F1', backgroundColor: '#FAFAFE' },
  storeCardIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  storeCardName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  storeCardType: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  storeCardStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  storeCardStatusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
