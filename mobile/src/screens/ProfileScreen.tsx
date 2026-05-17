import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Shield, LogOut, ChevronRight, Moon, Globe, Bell } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Hisobingizdan chiqmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'Chiqish', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuSections = [
    {
      title: 'Hisob',
      items: [
        { icon: User, label: 'Shaxsiy ma\'lumotlar', value: user?.email },
        { icon: Phone, label: 'Telefon raqam', value: user?.phone || 'Kiritilmagan' },
        { icon: Shield, label: 'Xavfsizlik', value: '2FA' },
      ]
    },
    {
      title: 'Sozlamalar',
      items: [
        { icon: Globe, label: 'Til', value: "O'zbekcha" },
        { icon: Moon, label: 'Tungi rejim', value: "O'chirilgan" },
        { icon: Bell, label: 'Bildirishnomalar', value: 'Yoqilgan' },
      ]
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'superadmin' ? 'Super Admin' : "Do'kon Admini"}
            </Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.menuSection}>
            <Text style={styles.menuTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, iIdx) => (
                <TouchableOpacity key={iIdx} style={[styles.menuItem, iIdx < section.items.length - 1 && styles.menuItemBorder]}>
                  <View style={styles.menuIconBox}>
                    <item.icon color="#6366F1" size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuValue}>{item.value}</Text>
                  </View>
                  <ChevronRight color="#CBD5E1" size={18} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Hisobdan chiqish</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Savdogar Mobile v1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20 },
  profileCard: { alignItems: 'center', backgroundColor: 'white', borderRadius: 28, padding: 32, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
  avatar: { width: 80, height: 80, borderRadius: 28, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
  avatarText: { fontSize: 32, fontWeight: '900', color: 'white' },
  profileName: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  profileEmail: { fontSize: 14, color: '#94A3B8', fontWeight: '500', marginTop: 4 },
  roleBadge: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#EEF2FF', borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '800', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 0.5 },
  menuSection: { marginBottom: 24 },
  menuTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  menuCard: { backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  menuIconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  menuValue: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: '#FEF2F2', borderRadius: 20, gap: 10, marginBottom: 20 },
  logoutText: { fontSize: 15, fontWeight: '800', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 12, color: '#CBD5E1', fontWeight: '600' },
});
