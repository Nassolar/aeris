import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { Bill } from '../../../types';

const OVERDUE_RED = '#E84040';

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function formatDate(ts: { seconds: number } | null | undefined): string {
  if (!ts?.seconds) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function showComingSoon() {
  const msg = 'Online payment coming soon. Pay at the city hall for now.';
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.LONG);
  } else {
    Alert.alert('Coming Soon', msg);
  }
}

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = firestore()
      .collection('bills')
      .doc(id)
      .onSnapshot(
        (doc) => {
          if (doc.exists) setBill({ id: doc.id, ...doc.data() } as Bill);
          setLoading(false);
        },
        (err) => { console.error('[BillDetail] error:', err); setLoading(false); },
      );

    return () => unsubscribe();
  }, [id]);

  // Real-time: navigate to receipt when bill becomes 'paid'
  useEffect(() => {
    if (bill?.status === 'paid') {
      router.replace({ pathname: '/city/bill/receipt', params: { id: bill.id } });
    }
  }, [bill?.status]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={OVERDUE_RED} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!bill) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#6B7280' }}>Bill not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOverdue = bill.status === 'overdue';
  const billTypeLabel = (bill.description.split('—')[0] ?? bill.description).trim();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.pageTitle} numberOfLines={1}>{billTypeLabel}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {bill.propertyRef && (
          <Text style={styles.propertyRef}>{bill.propertyRef}</Text>
        )}

        {/* Amount breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>AMOUNT DUE</Text>
          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>Principal</Text>
            <Text style={styles.lineValue}>{formatPeso(bill.principal)}</Text>
          </View>
          {bill.penalties > 0 && (
            <View style={styles.lineRow}>
              <Text style={[styles.lineLabel, { color: OVERDUE_RED }]}>Penalties</Text>
              <Text style={[styles.lineValue, { color: OVERDUE_RED }]}>
                {formatPeso(bill.penalties)}
              </Text>
            </View>
          )}
          <View style={[styles.lineRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalValue, { color: isOverdue ? OVERDUE_RED : '#1A1A1A' }]}>
              {formatPeso(bill.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Payment options */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>HOW TO PAY</Text>

          <TouchableOpacity
            style={styles.payOptionRow}
            onPress={() => router.push({
              pathname: '/city/bill/pay-at-hall',
              params: { id: bill.id },
            })}
          >
            <Ionicons name="business-outline" size={22} color="#374151" style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.payOptionLabel}>Pay at City Hall</Text>
              <Text style={styles.payOptionSub}>Show reference number to cashier</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {[
            { icon: 'phone-portrait-outline', label: 'GCash' },
            { icon: 'phone-portrait-outline', label: 'Maya' },
            { icon: 'card-outline', label: 'Bank Transfer' },
          ].map(({ icon, label }) => (
            <TouchableOpacity
              key={label}
              style={styles.payOptionRow}
              onPress={showComingSoon}
            >
              <Ionicons name={icon as 'key'} size={22} color="#9CA3AF" style={{ marginRight: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.payOptionLabel, { color: '#9CA3AF' }]}>{label}</Text>
                <Text style={styles.comingSoon}>Coming Soon</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bill details */}
        {(bill.taxYear ?? bill.propertyRef) && (
          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>
              {bill.taxYear ? `TAX YEAR ${bill.taxYear}` : 'BILL DETAILS'}
            </Text>
            {bill.propertyRef && (
              <Text style={styles.detailText}>{bill.propertyRef}</Text>
            )}
            {bill.dueDate && (
              <Text style={styles.detailText}>Due: {formatDate(bill.dueDate)}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  backBtn: { padding: 20, paddingBottom: 0 },
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
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1 },

  content: { padding: 16, paddingBottom: 32 },
  propertyRef: { fontSize: 14, color: '#6B7280', marginBottom: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  lineLabel: { fontSize: 14, color: '#374151' },
  lineValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  totalRow: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  totalValue: { fontSize: 18, fontWeight: '800' },

  payOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  payOptionLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  payOptionSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  comingSoon: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },

  detailText: { fontSize: 14, color: '#374151', paddingHorizontal: 16, paddingBottom: 12 },
});
