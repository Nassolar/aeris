import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CITY_BLACK = '#000000';

const BENEFITS = [
  'Pay your bills without queuing',
  'Request certificates from home',
  'Receive welfare delivery codes',
  'Get DOST hazard alerts for your barangay',
];

export default function KycWelcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={24} color="#374151" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={72} color={CITY_BLACK} />
        </View>

        <Text style={styles.title}>Verify your identity to unlock all AERIS city services</Text>

        <View style={styles.benefitsList}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={CITY_BLACK} style={{ marginRight: 10, marginTop: 1 }} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.privacyNote}>
          Your information is protected under RA 10173 (Data Privacy Act).
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/kyc/id-upload')}
        >
          <Text style={styles.primaryBtnLabel}>Start Verification</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
          <Text style={styles.skipBtnLabel}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  closeBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10, padding: 4 },
  content: { paddingHorizontal: 32, paddingTop: 80, paddingBottom: 24, alignItems: 'center' },

  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6', // Light gray instead of light green
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 28,
  },
  benefitsList: { width: '100%', marginBottom: 28 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  benefitText: { fontSize: 15, color: '#374151', flex: 1, lineHeight: 22 },
  privacyNote: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 8 },
  primaryBtn: {
    backgroundColor: CITY_BLACK,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryBtnLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  skipBtn: { paddingVertical: 14, alignItems: 'center' },
  skipBtnLabel: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
});
