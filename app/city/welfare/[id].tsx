import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { WelfareProgram } from '../../../types';

function formatDate(ts: { seconds: number } | null | undefined): string {
  if (!ts?.seconds) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDatetime(ts: { seconds: number } | null | undefined): string {
  if (!ts?.seconds) return '—';
  return new Date(ts.seconds * 1000).toLocaleString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WelfareDeliveryCodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [program, setProgram] = useState<WelfareProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsub = firestore()
      .collection('welfare_programs')
      .doc(id)
      .onSnapshot(
        (doc) => {
          if (doc.exists) setProgram({ id: doc.id, ...doc.data() } as WelfareProgram);
          setLoading(false);
        },
        (err) => { console.error('[Welfare]', err); setLoading(false); },
      );
    return () => unsub();
  }, [id]);

  if (loading || !program) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF9500" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const isConfirmed = program.status === 'confirmed';
  const codeDigits = program.deliveryCode.split('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Delivery Code</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>YOUR DELIVERY CODE</Text>
        <Text style={styles.programName}>{program.programName}</Text>
        <Text style={styles.period}>{program.period}</Text>

        <View style={styles.divider} />

        {/* 4-digit code — large boxes, senior-friendly */}
        <View style={styles.codeRow}>
          {codeDigits.map((digit, i) => (
            <View key={i} style={styles.codeBox}>
              <Text style={styles.codeDigit}>{digit}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.instruction}>
          Show this 4-digit code to the barangay worker when they deliver your benefit.
        </Text>

        <Text style={styles.warning}>Do not share this code before delivery.</Text>

        <View style={styles.divider} />

        <Text style={styles.expiry}>Expires: {formatDate(program.expiresAt)}</Text>

        {/* Status */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: isConfirmed ? '#ECFDF5' : '#FFF7ED' },
        ]}>
          <Text style={[
            styles.statusText,
            { color: isConfirmed ? '#065F46' : '#92400E' },
          ]}>
            {isConfirmed ? 'CONFIRMED ✓' : 'PENDING DELIVERY'}
          </Text>
        </View>

        {/* Confirmed delivery detail */}
        {isConfirmed && program.deliveredAt && (
          <View style={styles.deliveryRecord}>
            <Text style={styles.deliveryLabel}>Delivered:</Text>
            <Text style={styles.deliveryValue}>{formatDatetime(program.deliveredAt)}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 36,
    alignItems: 'center',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  programName: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 },
  period: { fontSize: 14, color: '#6B7280', marginBottom: 0 },

  divider: { width: '100%', height: 1, backgroundColor: '#F3F4F6', marginVertical: 24 },

  // Delivery code
  codeRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  codeBox: {
    width: 64,
    height: 72,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  codeDigit: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A1A1A',
    // Monospaced for digit clarity
    fontVariant: ['tabular-nums'],
  },

  instruction: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  warning: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 0,
  },

  expiry: { fontSize: 13, color: '#9CA3AF', marginBottom: 16 },

  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  deliveryRecord: {
    flexDirection: 'row',
    gap: 6,
  },
  deliveryLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  deliveryValue: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
});
