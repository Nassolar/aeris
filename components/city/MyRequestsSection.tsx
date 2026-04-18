import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { theme } from '../../constants/theme';

// Status colors
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#9CA3AF',
  PROCESSING: '#3B82F6',
  READY: '#10B981',
  COMPLETED: '#6B7280',
  REJECTED: '#EF4444',
};

type RequestStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'REJECTED';

interface MockRequest {
  id: string;
  service: string;
  status: RequestStatus;
  ref: string;
  submitted: string;
  est?: string;
  pickupCode?: string;
  window?: string;
}

const MOCK_REQUESTS: MockRequest[] = [
  {
    id: '1',
    service: 'Barangay Clearance',
    status: 'PROCESSING',
    ref: 'BRGYCLR-2026-000001',
    submitted: 'Apr 5',
    est: 'Apr 7',
  },
  {
    id: '2',
    service: 'Health Certificate',
    status: 'READY',
    ref: 'HEALTHCRT-2026-000001',
    submitted: 'Apr 5',
    pickupCode: '4821',
    window: 'Window 3, City Hall',
  },
];

export interface MyRequestsSectionProps {
  isPreview: boolean;
  // Phase 2: accepts real requests from Cloud Functions.
}

function ReadyPulse({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity }}
    />
  );
}

function RequestCard({ request }: { request: MockRequest }) {
  const statusColor = STATUS_COLORS[request.status];
  const isReady = request.status === 'READY';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.service} numberOfLines={1}>{request.service}</Text>
        <View style={styles.statusRow}>
          {isReady && <ReadyPulse color={statusColor} />}
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {request.status}
          </Text>
        </View>
      </View>

      <Text style={styles.ref}>{request.ref}</Text>
      <Text style={styles.meta}>Submitted {request.submitted}</Text>

      {request.est && (
        <Text style={styles.meta}>Est. ready {request.est}</Text>
      )}

      {isReady && request.pickupCode && (
        <View style={styles.pickupBox}>
          <Text style={styles.pickupLabel}>Pickup Code</Text>
          <Text style={styles.pickupCode}>{request.pickupCode}</Text>
          {request.window && (
            <Text style={styles.pickupWindow}>{request.window}</Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function MyRequestsSection({ isPreview }: MyRequestsSectionProps) {
  // In preview mode always show mocks. In live mode, only show if there are real requests.
  if (!isPreview) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>MY REQUESTS</Text>
        <TouchableOpacity accessibilityRole="button">
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MOCK_REQUESTS.map((req) => (
          <RequestCard key={req.id} request={req} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textLight,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    gap: 12,
    paddingBottom: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: 14,
    width: 220,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  service: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ref: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace' as const,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  pickupBox: {
    marginTop: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    padding: 10,
  },
  pickupLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  pickupCode: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 3,
  },
  pickupWindow: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 3,
  },
});
