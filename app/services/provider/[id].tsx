import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import {
  fetchProviderById,
  fetchProviderReviews,
} from '../../../services/serviceMarketplaceService';
import { MarketplaceProvider, ServiceReview } from '../../../types/serviceMarketplace';

const TEAL = '#14B8A6';

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={14}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: ServiceReview }) {
  const date = review.createdAt?.toDate
    ? review.createdAt.toDate().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <StarRow rating={review.rating} />
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
      {review.comment ? <Text style={styles.reviewComment}>"{review.comment}"</Text> : null}
      {review.tags.length > 0 && (
        <View style={styles.reviewTags}>
          {review.tags.map(tag => (
            <View key={tag} style={styles.reviewTag}>
              <Text style={styles.reviewTagText}>{tag.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      )}
      {review.providerResponse && (
        <View style={styles.providerResponse}>
          <Text style={styles.responseLabel}>Provider reply:</Text>
          <Text style={styles.responseText}>{review.providerResponse.text}</Text>
        </View>
      )}
    </View>
  );
}

export default function ProviderProfileScreen() {
  const { id, requestId } = useLocalSearchParams<{ id: string; requestId?: string }>();
  const router = useRouter();

  const [provider, setProvider] = useState<MarketplaceProvider | null>(null);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchProviderById(id ?? ''),
      fetchProviderReviews(id ?? ''),
    ]).then(([prov, revs]) => {
      if (active) {
        setProvider(prov);
        setReviews(revs);
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  const handleBook = () => {
    if (!provider || !requestId) return;
    router.push({
      pathname: '/services/booking/confirm',
      params: { requestId, providerId: provider.id, providerName: provider.name },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Provider not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = provider.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const baseRate = provider.baseRates?.default ?? 500;
  const visibleReviews = reviewsExpanded ? reviews : reviews.slice(0, 3);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.surface }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Provider Profile</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroBigAvatar}>
            <Text style={styles.heroBigAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.heroName}>{provider.name}</Text>
          <View style={styles.heroRatingRow}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.heroRatingText}>
              {provider.stats.avgRating.toFixed(1)} · {provider.stats.reviewCount} reviews
            </Text>
          </View>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="briefcase-outline" size={13} color={TEAL} />
              <Text style={styles.heroBadgeText}>{provider.yearsExperience} yrs exp</Text>
            </View>
            {provider.distance != null && (
              <View style={styles.heroBadge}>
                <Ionicons name="location-outline" size={13} color={TEAL} />
                <Text style={styles.heroBadgeText}>{provider.distance} km away</Text>
              </View>
            )}
            <View style={styles.heroBadge}>
              <Ionicons name="flash-outline" size={13} color={TEAL} />
              <Text style={styles.heroBadgeText}>{provider.responseTime} response</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Jobs Done', value: String(provider.stats.completedJobs) },
            { label: 'Completion', value: `${provider.stats.completionRate}%` },
            { label: 'Repeat Clients', value: `${provider.stats.repeatCustomerRate}%` },
          ].map(stat => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Bio */}
        {provider.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{provider.bio}</Text>
          </View>
        ) : null}

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          {provider.services.map(svc => (
            <View key={svc} style={styles.serviceRow}>
              <Ionicons name="checkmark-circle" size={16} color={TEAL} />
              <Text style={styles.serviceText}>{svc.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>

        {/* Certifications */}
        {provider.certifications && provider.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications & Verification</Text>
            {provider.certifications.map((cert, i) => (
              <View key={i} style={styles.certRow}>
                <Ionicons name="shield-checkmark" size={16} color={TEAL} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certIssuer}>{cert.issuer}</Text>
                </View>
                {cert.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Portfolio Photos */}
        {provider.workPhotos && provider.workPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Work</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              {provider.workPhotos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.workPhoto} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
          </View>
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet — be the first!</Text>
          ) : (
            <>
              {visibleReviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
              {reviews.length > 3 && (
                <TouchableOpacity
                  style={styles.showMoreBtn}
                  onPress={() => setReviewsExpanded(e => !e)}
                >
                  <Text style={styles.showMoreText}>
                    {reviewsExpanded ? 'Show fewer' : `Show all ${reviews.length} reviews`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky Book CTA */}
      {requestId && (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
            <View>
              <Text style={styles.bookBtnText}>Book {provider.name.split(' ')[0]}</Text>
              <Text style={styles.bookBtnSub}>Base rate: ₱{baseRate}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 16, color: theme.colors.error, marginBottom: 12 },
  backLink: { fontSize: 15, color: TEAL, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.primary },
  heroSection: {
    backgroundColor: theme.colors.surface, alignItems: 'center',
    paddingVertical: 28, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  heroBigAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroBigAvatarText: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  heroName: { fontSize: 22, fontWeight: '800', color: theme.colors.primary, marginBottom: 6 },
  heroRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  heroRatingText: { fontSize: 15, fontWeight: '600', color: '#D97706', marginLeft: 6 },
  heroMetaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDFA', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: '#CCFBF1',
  },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: TEAL },
  statsRow: {
    flexDirection: 'row', backgroundColor: theme.colors.surface,
    marginVertical: 8, marginHorizontal: 16, borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden',
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRightWidth: 1, borderRightColor: theme.colors.border },
  statValue: { fontSize: 20, fontWeight: '800', color: theme.colors.primary },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  section: {
    backgroundColor: theme.colors.surface, margin: 16, marginTop: 0,
    borderRadius: theme.borderRadius.lg, padding: 16,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.primary, marginBottom: 12 },
  bioText: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  serviceText: { fontSize: 14, color: theme.colors.text, marginLeft: 8, textTransform: 'capitalize' },
  certRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  certName: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  certIssuer: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },
  verifiedBadge: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  verifiedText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  workPhoto: { width: 120, height: 120, borderRadius: 10, marginHorizontal: 4, backgroundColor: '#EEE' },
  reviewCard: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewDate: { fontSize: 12, color: theme.colors.textLight },
  reviewComment: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20, fontStyle: 'italic', marginBottom: 8 },
  reviewTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  reviewTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  reviewTagText: { fontSize: 11, color: theme.colors.textSecondary, textTransform: 'capitalize' },
  providerResponse: { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, marginTop: 4 },
  responseLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 2 },
  responseText: { fontSize: 13, color: theme.colors.textSecondary },
  noReviews: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
  showMoreBtn: { alignItems: 'center', paddingTop: 12 },
  showMoreText: { fontSize: 14, color: TEAL, fontWeight: '600' },
  footer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  bookBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  bookBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
});
