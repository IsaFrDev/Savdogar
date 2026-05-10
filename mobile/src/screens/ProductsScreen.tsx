import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, RefreshControl, TextInput, Image, Alert } from 'react-native';
import { productApi } from '../services/api';
import { Package, Search, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react-native';

export default function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productApi.list();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setProducts(data);
    } catch (e) {
      console.error('Failed to load products:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, []);

  const toggleActive = async (product: any) => {
    try {
      await productApi.update(product.id, { is_active: !product.is_active });
      await loadProducts();
    } catch (e) {
      Alert.alert('Xatolik', "Mahsulotni yangilashda xatolik");
    }
  };

  const deleteProduct = (product: any) => {
    Alert.alert(
      "O'chirish",
      `"${product.name}" ni o'chirmoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: "O'chirish", style: 'destructive', onPress: async () => {
            try {
              await productApi.delete(product.id);
              await loadProducts();
            } catch (e) {
              Alert.alert('Xatolik', "O'chirishda xatolik");
            }
          }
        },
      ]
    );
  };

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStockStyle = (stock: number) => {
    if (stock <= 0) return { bg: '#FEE2E2', text: '#DC2626', label: 'Tugagan' };
    if (stock <= 5) return { bg: '#FEF3C7', text: '#D97706', label: 'Kam qoldi' };
    return { bg: '#DCFCE7', text: '#16A34A', label: 'Mavjud' };
  };

  const renderProduct = ({ item }: { item: any }) => {
    const stockStyle = getStockStyle(item.stock || 0);
    const imageUrl = item.images?.[0]?.image;

    return (
      <View style={styles.productCard}>
        <View style={styles.productImageBox}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
          ) : (
            <Package color="#CBD5E1" size={28} />
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productPrice}>
            {parseFloat(item.price || 0).toLocaleString()} so'm
          </Text>
          <View style={styles.productMeta}>
            <View style={[styles.stockBadge, { backgroundColor: stockStyle.bg }]}>
              <Text style={[styles.stockText, { color: stockStyle.text }]}>
                {item.stock || 0} ta — {stockStyle.label}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleActive(item)}
          >
            {item.is_active ? (
              <Eye color="#10B981" size={18} />
            ) : (
              <EyeOff color="#94A3B8" size={18} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => deleteProduct(item)}>
            <Trash2 color="#EF4444" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mahsulotlar</Text>
          <Text style={styles.subtitle}>{products.length} ta mahsulot</Text>
        </View>
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

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Package color="#CBD5E1" size={48} />
            <Text style={styles.emptyText}>Mahsulotlar topilmadi</Text>
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
  subtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0F172A', fontWeight: '600' },
  list: { padding: 16, paddingTop: 4 },
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 20, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  productImageBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden' },
  productImage: { width: 64, height: 64, borderRadius: 16 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#6366F1', marginBottom: 6 },
  productMeta: { flexDirection: 'row', gap: 8 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stockText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  productActions: { gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '600', marginTop: 12 },
});
