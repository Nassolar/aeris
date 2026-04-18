import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useKycStore } from './kycStore';

const CITY_BLACK = '#000000';

export default function KycReview() {
  const router = useRouter();
  const store = useKycStore();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      router.replace('/kyc/processing');
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Error', 'Failed to submit. Please try again.');
    }
  };

  const row = (label: string, value: string) => (
    <View key={label} style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value || '—'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Review</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Review your information</Text>

        <View style={styles.card}>
          {row('ID TYPE', store.idType)}
          {row('NAME', 'Will be extracted from ID')}
          {row('ADDRESS', store.homeAddress || 'Not provided')}
          {row('HOUSEHOLD', `${store.dependents} dependent${store.dependents !== 1 ? 's' : ''}`)}
          {row('SENIOR CITIZEN', store.hasSenior ? 'Yes' : 'No')}
          {row('PWD', store.hasPwd ? `Yes${store.pwdType ? ` — ${store.pwdType}` : ''}` : 'No')}
        </View>

        <View style={styles.privacyNotice}>
          <Ionicons name="shield-checkmark" size={18} color="#000" style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.privacyText}>
            Your ID photos will be processed and deleted immediately after verification. We never
            store your raw ID images. Only a SHA-256 hash of your ID number is kept.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnLabel}>Submit for Verification</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnLabel}>Go Back and Edit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  pageTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  content: { padding: 24, paddingBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  reviewValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },

  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  privacyText: { fontSize: 13, color: '#374151', flex: 1, lineHeight: 20 },

  footer: { paddingHorizontal: 24, paddingBottom: 8 },
  submitBtn: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitBtnLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  backBtn: { paddingVertical: 14, alignItems: 'center' },
  backBtnLabel: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
});
