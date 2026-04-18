import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CITY_SERVICES = [
  {
    icon: 'document-text-outline',
    label: 'Request Indigency Certificate',
    description: 'For financial assistance and scholarship applications',
    route: '/city/indigency',
  },
  {
    icon: 'document-outline',
    label: 'Get Barangay Clearance',
    description: 'Required for employment, business, and residency proof',
    route: '/city/clearance',
  },
  {
    icon: 'id-card-outline',
    label: 'Community Tax Certificate (Cedula)',
    description: 'Required for notarial and government transactions',
    route: '/city/cedula',
  },
  {
    icon: 'people-outline',
    label: 'Apply for Solo Parent ID',
    description: 'Access to Solo Parent Act benefits and privileges',
    route: '/city/solo-parent',
  },
] as const;

export default function CityServicesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>City Services</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Request government documents and certificates online. Most requests are processed within
          1–3 business days.
        </Text>

        {CITY_SERVICES.map(({ icon, label, description, route }) => (
          <TouchableOpacity
            key={label}
            style={styles.serviceCard}
            activeOpacity={0.7}
            onPress={() => router.push(route)}
          >
            <View style={styles.serviceIconWrap}>
              <Ionicons name={icon} size={24} color="#374151" />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceLabel}>{label}</Text>
              <Text style={styles.serviceDesc}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

  content: { padding: 20, paddingBottom: 32 },
  subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 20 },

  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  serviceInfo: { flex: 1, marginRight: 8 },
  serviceLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  serviceDesc: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
});
