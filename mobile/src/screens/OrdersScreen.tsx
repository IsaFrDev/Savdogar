import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, RefreshControl, TextInput } from 'react-native';
import { orderApi } from '../services/api';
import { ShoppingCart, Search, ChevronRight, Filter } from 'lucide-react-native';

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await orderApi.list();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, []);

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

  const filteredOrders = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (o.customer_name || '').toLowerCase().includes(q) ||
        String(o.id).includes(q)
      );
    }
    return true;
  });

  const filters = [
    { key: 'all', label: 'Barchasi' },
    { key: 'pending', label: 'Kutilmoqda' },
    { key: 'confirmed', label: 'Tasdiqlangan' },
    { key: 'completed', label: 'Yakunlangan' },
  ];

  const renderOrder = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      activeOpacity={0.7}
    >
      <View style={[styles.orderStatusBar, { backgroundColor: getStatusColor(item.status) }]} />
      <View style={styles.orderContent}>
        <View style={styles.orderTop}>
          <Text style={styles.orderId}>Buyurtma #{item.id}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString('uz-UZ')}
          </Text>
        </View>
        <Text style={styles.orderCustomer}>{item.customer_name || "Noma'lum mijoz"}</Text>
        <View style={styles.orderBottom}>
          <Text style={styles.orderTotal}>
            {parseFloat(item.total_amount || item.total || 0).toLocaleString()} so'm
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </View>
      <ChevronRight color="#CBD5E1" size={18} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buyurtmalar</Text>
        <Text style={styles.count}>{orders.length} ta</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search color="#94A3B8" size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Qidirish..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ShoppingCart color="#CBD5E1" size={48} />
            <Text style={styles.emptyText}>Buyurtmalar topilmadi</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  title: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  count: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 0, backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0F172A', fontWeight: '600' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0' },
  filterBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: 'white' },
  list: { padding: 16, paddingTop: 4 },
  orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 20, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  orderStatusBar: { width: 4, alignSelf: 'stretch' },
  orderContent: { flex: 1, padding: 16 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  orderDate: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  orderCustomer: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 8 },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '600', marginTop: 12 },
});
