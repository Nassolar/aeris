import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { DostAlert } from '../../../types';

function formatDate(ts: { seconds: number } | null | undefined): string {
  if (!ts?.seconds) return '—';
  return new Date(ts.seconds * 1000).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DostAlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [alert, setAlert] = useState<DostAlert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    firestore()
      .collection('dost_alerts')
      .doc(id)
      .get()
      .then((doc) => {
        if (doc.exists) setAlert({ id: doc.id, ...doc.data() } as DostAlert);
        setLoading(false);
      })
      .catch((err) => { console.error('[DostAlert]', err); setLoading(false); });
  }, [id]);

  if (loading || !alert) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFC107" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.pageTitle} numberOfLines={1}>{alert.alertType}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Alert banner */}
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={22} color="#856404" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertDate}>
              DOST-NOAH · {formatDate(alert.publishedAt)}
            </Text>
          </View>
        </View>

        <Text style={styles.alertBody}>{alert.body}</Text>

        {/* Evacuation centers */}
        {(alert.evacuationCenters?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EVACUATION CENTERS</Text>
            {alert.evacuationCenters!.map((center, i) => (
              <View key={i} style={styles.evacuationRow}>
                <Ionicons name="location-outline" size={18} color="#374151" style={{ marginRight: 10, marginTop: 1 }} />
                <View>
                  <Text style={styles.evacuationName}>{center.name}</Text>
                  <Text style={styles.evacuationAddress}>{center.address}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Hotlines */}
        {(alert.hotlines?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EMERGENCY HOTLINES</Text>
            {alert.hotlines!.map((h, i) => (
              <TouchableOpacity
                key={i}
                style={styles.hotlineRow}
                onPress={() => Linking.openURL(`tel:${h.number}`)}
              >
                <Ionicons name="call-outline" size={18} color="#374151" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hotlineLabel}>{h.label}</Text>
                  <Text style={styles.hotlineNumber}>{h.number}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1 },

  content: { padding: 16, paddingBottom: 32 },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  alertTitle: { fontSize: 15, fontWeight: '700', color: '#856404', marginBottom: 4 },
  alertDate: { fontSize: 12, color: '#6D5202' },
  alertBody: { fontSize: 15, color: '#374151', lineHeight: 24, marginBottom: 20 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  evacuationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  evacuationName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  evacuationAddress: { fontSize: 12, color: '#6B7280' },

  hotlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  hotlineLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 2 },
  hotlineNumber: { fontSize: 13, color: '#6B7280' },
});
