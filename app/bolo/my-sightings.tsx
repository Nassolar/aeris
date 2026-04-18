import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBOLOSightings } from '../../hooks/useBOLOSightings';
import { SightingWithId, SightingValidationStatus } from '../../services/boloService';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(timestamp: { toDate: () => Date } | null | undefined): string {
  if (!timestamp) return '';
  return timestamp.toDate().toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const STATUS_CONFIG: Record<
  SightingValidationStatus,
  { label: string; color: string; bg: string; icon: string; note: string }
> = {
  pending: {
    label: 'PENDING REVIEW',
    color: '#856404',
    bg: '#FFF3CD',
    icon: 'time-outline',
    note: 'Your sighting is being reviewed by authorities.',
  },
  validated: {
    label: 'VALIDATED',
    color: '#155724',
    bg: '#D4EDDA',
    icon: 'checkmark-circle-outline',
    note: '',
  },
  dismissed: {
    label: 'DISMISSED',
    color: '#666',
    bg: '#F0F0F0',
    icon: 'close-circle-outline',
    note: 'This sighting was not confirmed by authorities.',
  },
};

// ── Item ──────────────────────────────────────────────────────────────────────

function SightingItem({ item }: { item: SightingWithId }) {
  const config = STATUS_CONFIG[item.validationStatus] ?? STATUS_CONFIG.pending;

  return (
    <View style={styles.card}>
      {/* Status badge */}
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon as any} size={14} color={config.color} style={{ marginRight: 4 }} />
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>

      {/* Date */}
      <Text style={styles.date}>{formatDate(item.createdAt)}</Text>

      {/* Area */}
      {item.location.address ? (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color="#888" />
          <Text style={styles.locationText}>{item.location.address}</Text>
        </View>
      ) : null}

      {/* Description snippet */}
      <Text style={styles.description} numberOfLines={2}>
        "{item.description}"
      </Text>

      {/* Photo thumbnail */}
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.thumb} />
      ) : null}

      {/* Points (validated only) */}
      {item.validationStatus === 'validated' && item.pointsAwarded != null ? (
        <View style={styles.pointsRow}>
          <Ionicons name="star" size={14} color="#F4B942" />
          <Text style={styles.pointsText}>
            +{item.pointsAwarded * item.pointsMultiplier} pts
            {item.pointsMultiplier > 1 ? ` (×${item.pointsMultiplier} multiplier)` : ''}
          </Text>
        </View>
      ) : null}

      {/* Status note */}
      {config.note ? (
        <Text style={styles.statusNote}>{config.note}</Text>
      ) : null}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MySightingsScreen() {
  const router = useRouter();
  const { sightings, loading, error } = useBOLOSightings();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Sightings</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color="#999" />
          <Text style={styles.emptyText}>Could not load sightings.</Text>
        </View>
      ) : sightings.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="eye-off-outline" size={48} color="#CCC" />
          <Text style={styles.emptyTitle}>No Sightings Yet</Text>
          <Text style={styles.emptyText}>
            Your BOLO sightings will appear here after you submit them.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sightings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SightingItem item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  list: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  badge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 12, color: '#999', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 4 },
  locationText: { fontSize: 13, color: '#666' },
  description: { fontSize: 14, color: '#333', fontStyle: 'italic', lineHeight: 20, marginBottom: 10 },
  thumb: { width: '100%', height: 120, borderRadius: 8, marginBottom: 10 },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBE6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  pointsText: { fontSize: 13, fontWeight: '700', color: '#856404' },
  statusNote: { fontSize: 12, color: '#888', fontStyle: 'italic', marginTop: 4 },

  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 12, marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
});
