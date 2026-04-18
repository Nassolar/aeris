import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { Bill } from '../../../types';

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

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    firestore()
      .collection('bills')
      .doc(id)
      .get()
      .then((doc) => {
        if (doc.exists) setBill({ id: doc.id, ...doc.data() } as Bill);
        setLoading(false);
      })
      .catch((err) => { console.error('[Receipt]', err); setLoading(false); });
  }, [id]);

  const share = async () => {
    if (!bill) return;
    await Share.share({
      message: `AERIS Official Receipt\n\nOR No.: ${bill.receiptNumber ?? '—'}\nDate: ${formatDate(bill.paidAt)}\nAmount: ${formatPeso(bill.paidAmount ?? bill.totalAmount)}\nFor: ${bill.description}`,
    });
  };

  if (loading || !bill) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2ECC71" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Official Receipt</Text>
      </View>

      <View style={styles.content}>
        {/* Confirmed banner */}
        <View style={styles.confirmedBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#2ECC71" style={{ marginRight: 8 }} />
          <Text style={styles.confirmedText}>PAYMENT CONFIRMED</Text>
        </View>

        {/* Receipt card */}
        <View style={styles.receiptCard}>
          <Text style={styles.receiptTitle}>OFFICIAL RECEIPT</Text>
          {bill.receiptNumber && (
            <Text style={styles.receiptNumber}>OR No.: {bill.receiptNumber}</Text>
          )}
          <Text style={styles.receiptDate}>Date: {formatDate(bill.paidAt)}</Text>

          <View style={styles.divider} />

          <Text style={styles.receiptRow}>
            <Text style={styles.receiptFieldLabel}>Received from: </Text>
            <Text style={styles.receiptFieldValue}>Account holder</Text>
          </Text>

          <View style={styles.divider} />

          <Text style={styles.receiptAmount}>{formatPeso(bill.paidAmount ?? bill.totalAmount)}</Text>
          <Text style={styles.receiptFor}>For: {bill.description}</Text>
          {bill.propertyRef && (
            <Text style={styles.receiptProperty}>{bill.propertyRef}</Text>
          )}

          {/* QR placeholder */}
          <View style={styles.qrWrap}>
            <Ionicons name="qr-code-outline" size={80} color="#D1D5DB" />
            <Text style={styles.qrNote}>Verification QR</Text>
            {/* TODO: QR encodes verification URL after react-native-qrcode-svg is installed */}
          </View>

          <Text style={styles.verifyUrl}>lgu.aeristech.ai/verify/or/</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareBtn} onPress={share}>
          <Ionicons name="share-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
          <Text style={styles.shareBtnLabel}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backToBillsBtn}
          onPress={() => router.replace('/city/bills')}
        >
          <Text style={styles.backToBillsLabel}>Back to Bills</Text>
        </TouchableOpacity>
      </View>
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

  content: { flex: 1, padding: 20 },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  confirmedText: { fontSize: 15, fontWeight: '800', color: '#065F46', letterSpacing: 1 },

  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  receiptNumber: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  receiptDate: { fontSize: 13, color: '#6B7280', marginBottom: 16 },

  divider: { width: '100%', height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  receiptRow: { fontSize: 13, color: '#374151', marginBottom: 4 },
  receiptFieldLabel: { fontWeight: '600' },
  receiptFieldValue: { color: '#1A1A1A' },

  receiptAmount: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  receiptFor: { fontSize: 14, color: '#374151', textAlign: 'center', marginBottom: 4 },
  receiptProperty: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },

  qrWrap: { alignItems: 'center', marginTop: 20, marginBottom: 4 },
  qrNote: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  verifyUrl: { fontSize: 11, color: '#9CA3AF' },

  footer: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareBtnLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  backToBillsBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToBillsLabel: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
});
