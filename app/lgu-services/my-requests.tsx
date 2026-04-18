/**
 * My Requests — service request tracker for citizens.
 * Shows active and completed requests with status pills.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../constants/theme';
import {
  AERIS_TEAL,
  AERIS_TEAL_LIGHT,
  SERVICE_STATUS_CONFIG,
} from '../../constants/lguServices';
import {
  subscribeToMyRequests,
} from '../../services/lguServicesService';
import { LguServiceRequest } from '../../types';

const ACTIVE_STATUSES: LguServiceRequest['status'][] = [
  'pending',
  'under_review',
  'appointment_scheduled',
  'docs_requested',
  'approved',
];
const COMPLETED_STATUSES: LguServiceRequest['status'][] = ['issued', 'rejected'];

function formatRelativeTime(ts: { seconds: number; nanoseconds: number } | undefined): string {
  if (!ts) return '';
  const date = new Date(ts.seconds * 1000);
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MyRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<LguServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToMyRequests(
      (data) => {
        setRequests(data);
        setLoading(false);
        setRefreshing(false);
        setError(null);
      },
      (err) => {
        console.error('[MyRequests]', err);
        setError('Could not load your requests. Please try again.');
        setLoading(false);
        setRefreshing(false);
      }
    );
    return () => unsub();
  }, []);

  const activeRequests = requests.filter((r) =>
    ACTIVE_STATUSES.includes(r.status)
  );
  const completedRequests = requests.filter((r) =>
    COMPLETED_STATUSES.includes(r.status)
  );

  const handleRefresh = () => {
    setRefreshing(true);
    // Listener will fire automatically on reconnect
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
        <TouchableOpacity
          style={styles.newRequestBtn}
          onPress={() => router.push('/(tabs)/lgu-services')}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={20} color={AERIS_TEAL} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AERIS_TEAL} />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={AERIS_TEAL}
            />
          }
        >
          {/* Active requests */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>ACTIVE</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{activeRequests.length}</Text>
            </View>
          </View>

          {activeRequests.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="checkmark-done-outline" size={32} color={theme.colors.textLight} />
              <Text style={styles.emptySectionText}>No active requests.</Text>
              <TouchableOpacity
                style={styles.newServiceBtn}
                onPress={() => router.push('/(tabs)/lgu-services')}
                activeOpacity={0.8}
              >
                <Text style={styles.newServiceBtnText}>Browse services</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onPress={() =>
                  router.push(`/lgu-services/request-detail/${req.id}`)
                }
              />
            ))
          )}

          {/* Completed requests */}
          <TouchableOpacity
            style={styles.completedToggle}
            onPress={() => setShowCompleted((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionLabel}>COMPLETED</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{completedRequests.length}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Ionicons
              name={showCompleted ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.textLight}
            />
          </TouchableOpacity>

          {showCompleted &&
            (completedRequests.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>No completed requests yet.</Text>
              </View>
            ) : (
              completedRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onPress={() =>
                    router.push(`/lgu-services/request-detail/${req.id}`)
                  }
                />
              ))
            ))}

          <View style={{ height: 48 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Request Card ──────────────────────────────────────────────────────────────

function RequestCard({
  request,
  onPress,
}: {
  request: LguServiceRequest;
  onPress: () => void;
}) {
  const statusCfg = SERVICE_STATUS_CONFIG[request.status] ?? {
    label: request.status.toUpperCase(),
    bg: theme.colors.border,
    text: theme.colors.textSecondary,
  };

  return (
    <TouchableOpacity style={styles.requestCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.requestTop}>
        <Text style={styles.requestName} numberOfLines={1}>
          {request.serviceName}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusPillText, { color: statusCfg.text }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>
      <Text style={styles.requestRef}>{request.referenceNumber}</Text>
      <View style={styles.requestMeta}>
        <Text style={styles.requestTime}>
          {formatRelativeTime(request.submittedAt)}
        </Text>
        <View style={styles.viewBtn}>
          <Text style={styles.viewBtnText}>View details</Text>
          <Ionicons name="chevron-forward" size={12} color={AERIS_TEAL} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  newRequestBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: AERIS_TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textLight,
    letterSpacing: 0.8,
  },
  countBadge: {
    backgroundColor: AERIS_TEAL_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: AERIS_TEAL,
  },
  completedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  requestRef: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestTime: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: AERIS_TEAL,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptySectionText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  newServiceBtn: {
    backgroundColor: AERIS_TEAL_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  newServiceBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: AERIS_TEAL,
  },
});

