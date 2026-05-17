import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { storeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Store, ChevronRight, ChevronLeft, Check } from 'lucide-react-native';

export default function StoreWizardScreen({ navigation }: any) {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('electronics');

  const handleCreate = async () => {
    setLoading(true);
    try {
      await storeApi.create({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        business_type: type,
        status: 'approved' // Match backend change
      });
      await refreshUser();
      navigation.replace('Dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yangi Do'kon</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.progressContainer}>
          {[1, 2].map((s) => (
            <View key={s} style={[styles.progressStep, step >= s && styles.progressStepActive]} />
          ))}
        </View>

        {step === 1 ? (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Do'kon ma'lumotlari</Text>
            <Text style={styles.subtitle}>Sizning onlayn do'koningiz qanday nomlanadi?</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Do'kon nomi</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  setSlug(v.toLowerCase().replace(/\s+/g, '-'));
                }}
                placeholder="My Store"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Do'kon manzili (Slug)</Text>
              <TextInput
                style={styles.input}
                value={slug}
                onChangeText={setSlug}
                placeholder="my-store"
              />
              <Text style={styles.helper}>{slug || 'store'}.savdogar.uz</Text>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
              <Text style={styles.nextBtnText}>Keyingisi</Text>
              <ChevronRight color="white" size={20} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Tayyormisiz?</Text>
            <Text style={styles.subtitle}>Do'koningizni yaratish uchun "Yaratish" tugmasini bosing.</Text>
            
            <View style={styles.summaryCard}>
              <Store color="#6366F1" size={32} />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.summaryName}>{name}</Text>
                <Text style={styles.summaryType}>{type.toUpperCase()}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.createBtn} 
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.createBtnText}>Yaratish</Text>
                  <Check color="white" size={20} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backBtnText}>Orqaga qaytish</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#6366F1',
  },
  stepContainer: {
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  helper: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
  nextBtn: {
    backgroundColor: '#1E293B',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  nextBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  summaryType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
    marginTop: 4,
  },
  createBtn: {
    backgroundColor: '#6366F1',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  createBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  backBtn: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
  },
});
