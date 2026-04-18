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
import auth from '@react-native-firebase/auth';
import { Bill } from '../../../types';

// ─── Reference number generation ─────────────────────────────────────────────
// Deterministic: ARS-{YEAR}-{TYPE_CODE}-{6-digit sequence from billId}
const BILL_TYPE_CODES: Record<string, string> = {
  rpt: 'RPT',
  business_permit: 'BP',
  ctc: 'CTC',
  misc: 'MISC',
};

function generateReferenceNumber(bill: Bill): string {
  const year = new Date().getFullYear();
  const typeCode = BILL_TYPE_CODES[bill.billType] ?? 'MISC';
  // Use last 6 chars of Firestore doc ID as sequence (deterministic)
  const sequence = bill.id.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, '0');
  return `ARS-${year}-${typeCode}-${sequence}`;
}

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function PayAtHallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsub = firestore()
      .collection('bills')
      .doc(id)
      .onSnapshot(
        (doc) => {
          if (doc.exists) setBill({ id: doc.id, ...doc.data() } as Bill);
          setLoading(false);
        },
        (err) => { console.error('[PayAtHall]', err); setLoading(false); },
      );
    return () => unsub();
  }, [id]);

  // Save referenceNumber to Firestore when generated
  useEffect(() => {
    if (!bill || bill.referenceNumber) return;
    const ref = generateReferenceNumber(bill);
    firestore().collection('bills').doc(bill.id).update({ referenceNumber: ref }).catch((e) =>
      console.error('[PayAtHall] save ref error:', e),
    );
  }, [bill?.id]);

  const share = async () => {
    if (!bill) return;
    const ref = bill.referenceNumber ?? generateReferenceNumber(bill);
    await Share.share({
      message: `AERIS Payment Reference\n\nReference Number: ${ref}\nBill: ${bill.description}\nAmount: ${formatPeso(bill.totalAmount)}\n\nShow this to the cashier at the City Hall Treasurer's Office.`,
    });
  };

  if (loading || !bill) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#E84040" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const refNumber = bill.referenceNumber ?? generateReferenceNumber(bill);
  const user = auth().currentUser;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Pay at City Hall</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>Show this to the cashier</Text>

        {/* Reference number */}
        <View style={styles.refBox}>
          <Text style={styles.refLabel}>REFERENCE NUMBER</Text>
          <Text style={styles.refNumber}>{refNumber}</Text>
        </View>

        {/* QR code placeholder */}
        <View style={styles.qrPlaceholder}>
          <Ionicons name="qr-code-outline" size={120} color="#D1D5DB" />
          <Text style={styles.qrNote}>QR code renders here</Text>
          {/* TODO: Install react-native-qrcode-svg and replace with:
            <QRCode
              value={JSON.stringify({ ref: refNumber, billId: bill.id, amount: bill.totalAmount, uid: user?.uid })}
              size={200}
            />
          */}
        </View>

        <View style={styles.divider} />

        {/* Bill summary */}
        <Text style={styles.summaryDesc}>{bill.description}</Text>
        <Text style={styles.summaryAmount}>Amount: {formatPeso(bill.totalAmount)}</Text>
        <Text style={styles.summaryLgu}>Quezon City Treasurer's Office</Text>

        <Text style={styles.helperNote}>
          All fields are pre-filled for the cashier. Just show this screen.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareBtn} onPress={share}>
          <Ionicons name="share-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
          <Text style={styles.shareBtnLabel}>Share / Save</Text>
        </TouchableOpacity>
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

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 28, alignItems: 'center' },
  instruction: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 24 },

  refBox: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 28,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  refLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  refNumber: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: 2, fontFamily: 'monospace' },

  qrPlaceholder: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  qrNote: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  divider: { width: '100%', height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },

  summaryDesc: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 },
  summaryAmount: { fontSize: 15, color: '#374151', textAlign: 'center', marginBottom: 4 },
  summaryLgu: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 },
  helperNote: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  footer: { paddingHorizontal: 24, paddingBottom: 12 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 12,
  },
  shareBtnLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
});
