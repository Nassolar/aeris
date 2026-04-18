import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import {
  fetchServiceRequest,
  fetchProviders,
} from '../../services/serviceMarketplaceService';
import { MarketplaceProvider, ServiceRequest } from '../../types/serviceMarketplace';

type SortMode = 'distance' | 'rating' | 'price' | 'response';

const TEAL = '#14B8A6';
const BADGE_COLORS: Record<string, string> = {
  top_rated: '#FEF3C7',
  fast_reply: '#EFF6FF',
  verified: '#F0FDF4',
  licensed: '#F5F3FF',
  new_provider: '#FFF7ED',
};
const BADGE_TEXT_COLORS: Record<string, string> = {
  top_rated: '#D97706',
  fast_reply: '#2563EB',
  verified: '#16A34A',
  licensed: '#7C3AED',
  new_provider: '#EA580C',
};

function ProviderCard({
  provider,
  onBook,
  onProfile,
}: {
  provider: MarketplaceProvider;
  onBook: () => void;
  onProfile: () => void;
}) {
  const initials = provider.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const baseRate = provider.baseRates?.default ?? 500;

  return (
    <View style={styles.card}>
      {/* Avatar + Name row */}
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardTopInfo}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {provider.stats.avgRating.toFixed(1)} ({provider.stats.reviewCount})
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={theme.colors.textLight} />
            <Text style={styles.metaText}>{provider.distance} km</Text>
            <Ionicons name="flash-outline" size={12} color={theme.colors.textLight} style={{ marginLeft: 8 }} />
            <Text style={styles.metaText}>{provider.eta} min ETA</Text>
          </View>
        </View>
        <View style={styles.rateBox}>
          <Text style={styles.rateAmount}>₱{baseRate}</Text>
          <Text style={styles.rateLabel}>base</Text>
        </View>
      </View>

      {/* Badges */}
      {provider.badges && provider.badges.length > 0 && (
        <View style={styles.badgeRow}>
          {provider.badges.slice(0, 3).map(badge => (
            <View
              key={badge.type}
              style={[styles.badge, { backgroundColor: BADGE_COLORS[badge.type] ?? '#F3F4F6' }]}
            >
              <Text style={[styles.badgeText, { color: BADGE_TEXT_COLORS[badge.type] ?? '#374151' }]}>
                {badge.label}
              </Text>
            </View>
          ))}
          {provider.isLicensed && (
            <View style={[styles.badge, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.badgeText, { color: '#16A34A' }]}>✅ Licensed</Text>
            </View>
          )}
        </View>
      )}

      {/* Recent review snippet */}
      {provider.recentReview && (
        <View style={styles.reviewSnippet}>
          <Ionicons name="chatbubble-ellipses-outline" size={13} color={theme.colors.textLight} />
          <Text style={styles.reviewText} numberOfLines={1}>
            "{provider.recentReview.text}" — {provider.recentReview.author}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.profileBtn} onPress={onProfile}>
          <Text style={styles.profileBtnText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookBtn} onPress={onBook}>
          <Text style={styles.bookBtnText}>Book</Text>
          <Ionicons name="arrow-forward" size={15} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ProvidersScreen() {
  const { requestId, subcategory, subcategoryName, userLat, userLng } = useLocalSearchParams<{
    requestId: string; subcategory: string; subcategoryName: string;
    userLat: string; userLng: string;
  }>();
  const router = useRouter();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [providers, setProviders] = useState<MarketplaceProvider[]>([]);
  const [sortedProviders, setSortedProviders] = useState<MarketplaceProvider[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('distance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lat = parseFloat(userLat ?? '14.5547');
  const lng = parseFloat(userLng ?? '121.0244');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [req, provs] = await Promise.all([
        fetchServiceRequest(requestId ?? ''),
        fetchProviders(subcategory ?? '', lat, lng, 20),
      ]);
      setRequest(req);
      setProviders(provs);
    } catch {
      setError('Failed to load providers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [requestId, subcategory, lat, lng]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const sorted = [...providers];
    switch (sortMode) {
      case 'distance': sorted.sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99)); break;
      case 'rating':   sorted.sort((a, b) => b.stats.avgRating - a.stats.avgRating); break;
      case 'price':    sorted.sort((a, b) => (a.baseRates?.default ?? 999) - (b.baseRates?.default ?? 999)); break;
      case 'response': sorted.sort((a, b) => (a.stats.responseTime ?? 99) - (b.stats.responseTime ?? 99)); break;
    }
    setSortedProviders(sorted);
  }, [providers, sortMode]);

  const handleBook = (provider: MarketplaceProvider) => {
    router.push({
      pathname: '/services/booking/confirm',
      params: { requestId: requestId ?? '', providerId: provider.id, providerName: provider.name },
    });
  };

  const handleProfile = (provider: MarketplaceProvider) => {
    router.push({
      pathname: '/services/provider/[id]',
      params: { id: provider.id, requestId: requestId ?? '' },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.surface }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{subcategoryName ?? 'Providers'}</Text>
            {!loading && (
              <Text style={styles.headerSub}>
                {providers.length} available within 20 km
              </Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Sort tabs */}
        <View style={styles.sortRow}>
          {([
            { value: 'distance', label: 'Nearest' },
            { value: 'rating',   label: 'Top Rated' },
            { value: 'price',    label: 'Cheapest' },
            { value: 'response', label: 'Fastest' },
          ] as { value: SortMode; label: string }[]).map(s => (
            <TouchableOpacity
              key={s.value}
              style={[styles.sortBtn, sortMode === s.value && styles.sortBtnActive]}
              onPress={() => setSortMode(s.value)}
            >
              <Text style={[styles.sortText, sortMode === s.value && styles.sortTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Finding providers near you…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : sortedProviders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No providers available</Text>
          <Text style={styles.emptyText}>
            No {subcategoryName ?? 'service'} providers are available in your area right now.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedProviders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ProviderCard
              provider={item}
              onBook={() => handleBook(item)}
              onProfile={() => handleProfile(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.primary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' },
  sortRow: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 6,
    backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  sortBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border,
  },
  sortBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sortText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  sortTextActive: { color: '#FFF' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  cardTopInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: '700', color: theme.colors.primary, marginBottom: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  ratingText: { fontSize: 13, fontWeight: '600', color: '#D97706', marginLeft: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: theme.colors.textSecondary, marginLeft: 3 },
  rateBox: { alignItems: 'flex-end' },
  rateAmount: { fontSize: 18, fontWeight: '800', color: theme.colors.primary },
  rateLabel: { fontSize: 11, color: theme.colors.textSecondary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
  reviewSnippet: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewText: { flex: 1, fontSize: 12, color: theme.colors.textSecondary, marginLeft: 6, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 10 },
  profileBtn: {
    flex: 1, paddingVertical: 11, borderRadius: theme.borderRadius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  profileBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  bookBtn: {
    flex: 2, paddingVertical: 11, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  bookBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: theme.colors.textSecondary },
  errorText: { fontSize: 15, color: theme.colors.error, textAlign: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.primary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
  },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
