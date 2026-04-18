import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getBOLO, BOLODocument, BOLOSeverity } from '../../../services/boloService';

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(timestamp: { toDate: () => Date } | null | undefined): string {
  if (!timestamp) return 'Unknown';
  const diffMs = Date.now() - timestamp.toDate().getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Less than an hour ago';
  if (diffHours === 1) return '~1 hour ago';
  return `~${diffHours} hours ago`;
}

const SEVERITY_CONFIG: Record<
  BOLOSeverity,
  { label: string; color: string; bg: string }
> = {
  critical: { label: 'URGENT', color: '#fff', bg: '#C81919' },
  serious: { label: 'SERIOUS', color: '#fff', bg: '#E67E22' },
  minor: { label: 'NOTICE', color: '#333', bg: '#F0F0F0' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function BOLODetailScreen() {
  const { boloId } = useLocalSearchParams<{ boloId: string }>();
  const router = useRouter();

  const [bolo, setBolo] = useState<BOLODocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [inactive, setInactive] = useState(false);

  useEffect(() => {
    if (!boloId) return;

    getBOLO(boloId).then((data) => {
      if (!data) {
        setInactive(true);
      } else {
        setBolo(data);
      }
      setLoading(false);
    });
  }, [boloId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (inactive || !bolo) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#999" />
          <Text style={styles.inactiveTitle}>Alert No Longer Active</Text>
          <Text style={styles.inactiveBody}>
            This community alert has expired or is no longer available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const severity = SEVERITY_CONFIG[bolo.severity] ?? SEVERITY_CONFIG.serious;
  const locationText = [bolo.lastSeenBarangay, bolo.lastSeenCity]
    .filter(Boolean)
    .join(', ');

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>COMMUNITY ALERT</Text>
            <View style={[styles.severityBadge, { backgroundColor: severity.bg }]}>
              <Text style={[styles.severityText, { color: severity.color }]}>
                {severity.label}
              </Text>
            </View>
          </View>
          <Text style={styles.headerSub}>
            Authorities are looking for a person or vehicle in your area. Please stay alert.
          </Text>
        </View>

        {/* Subject photo */}
        {bolo.subjectPhoto ? (
          <Image source={{ uri: bolo.subjectPhoto }} style={styles.subjectPhoto} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person-outline" size={64} color="#CCC" />
          </View>
        )}

        {/* Description */}
        {bolo.subjectDescription ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Description</Text>
            <Text style={styles.cardBody}>{bolo.subjectDescription}</Text>
          </View>
        ) : null}

        {/* Location & time */}
        <View style={styles.card}>
          {locationText ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color="#555" />
              <Text style={styles.infoText}>Area: {locationText}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#555" />
            <Text style={styles.infoText}>
              Last seen: {relativeTime(bolo.lastSeenAt)}
            </Text>
          </View>
        </View>

        {/* Safety warning */}
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={20} color="#C81919" style={{ marginBottom: 4 }} />
          <Text style={styles.warningText}>
            DO NOT APPROACH OR CONFRONT THIS PERSON
          </Text>
          <Text style={styles.warningBody}>
            Your safety is the priority. If you see this person, report via the button below and move to a safe location.
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => router.push(`/bolo/${boloId}/sighting`)}
        >
          <Ionicons name="camera-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.reportBtnText}>Report a Sighting</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  backBtn: { padding: 16 },
  scroll: { paddingBottom: 40 },

  headerBanner: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: { fontWeight: '700', fontSize: 12 },
  headerSub: { color: '#CCC', fontSize: 13, lineHeight: 18 },

  subjectPhoto: {
    width: '100%',
    height: 240,
    marginBottom: 16,
  },
  photoPlaceholder: {
    height: 160,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },

  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#999', marginBottom: 6, textTransform: 'uppercase' },
  cardBody: { fontSize: 15, color: '#333', lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 8, fontSize: 14, color: '#333' },

  warningCard: {
    backgroundColor: '#FFF5F5',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCCCC',
    alignItems: 'center',
  },
  warningText: { fontWeight: '800', color: '#C81919', fontSize: 14, textAlign: 'center', marginBottom: 6 },
  warningBody: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 18 },

  reportBtn: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  inactiveTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 16, marginBottom: 8 },
  inactiveBody: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});
