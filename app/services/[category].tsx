import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { fetchSubcategories, STATIC_SUBCATEGORIES } from '../../services/serviceMarketplaceService';
import { ServiceSubcategory } from '../../types/serviceMarketplace';

type SortMode = 'popular' | 'rating' | 'price';

const CATEGORY_LABELS: Record<string, string> = {
  repair: 'Repair Services',
  cleaning: 'Cleaning Services',
  moving: 'Moving Services',
  painting: 'Painting Services',
  beauty: 'Beauty Services',
  petCare: 'Pet Care',
  tech: 'Tech Services',
  professional: 'Professional Services',
};

export default function SubcategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();

  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [filtered, setFiltered] = useState<ServiceSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('popular');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchSubcategories(category ?? '')
      .then(data => { if (active) { setSubcategories(data); setLoading(false); } })
      .catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category]);

  useEffect(() => {
    let result = [...subcategories];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.searchKeywords.some(k => k.toLowerCase().includes(q))
      );
    }

    switch (sortMode) {
      case 'popular': result.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)); break;
      case 'rating':  result.sort((a, b) => b.avgRating - a.avgRating); break;
      case 'price':   result.sort((a, b) => a.basePrice - b.basePrice); break;
    }

    setFiltered(result);
  }, [subcategories, search, sortMode]);

  const handleSelect = useCallback((sub: ServiceSubcategory) => {
    // IBP legal consultation uses a dedicated flow instead of the standard request form
    if (sub.id === 'legal' || sub.id === 'lawyer') {
      router.push({ pathname: '/services/legal/request' });
      return;
    }
    router.push({
      pathname: '/services/request',
      params: { category: category ?? '', subcategory: sub.id, subcategoryName: sub.name, basePrice: String(sub.basePrice) },
    });
  }, [category, router]);

  const renderItem = ({ item }: { item: ServiceSubcategory }) => (
    <TouchableOpacity
      style={[styles.card, item.isPopular && styles.cardPopular]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.75}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardName}>{item.name}</Text>
            {item.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Popular</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardDesc}>{item.description}</Text>
          <View style={styles.cardMeta}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.cardMetaText}>{item.avgRating.toFixed(1)}</Text>
            <Text style={styles.cardMetaDot}>·</Text>
            <Text style={styles.cardMetaText}>{item.providerCount} providers</Text>
            <Text style={styles.cardMetaDot}>·</Text>
            <Text style={styles.cardMetaText}>From ₱{item.basePrice}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{CATEGORY_LABELS[category ?? ''] ?? 'Services'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={theme.colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services…"
            placeholderTextColor={theme.colors.textLight}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Tabs */}
        <View style={styles.sortRow}>
          {(['popular', 'rating', 'price'] as SortMode[]).map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.sortBtn, sortMode === mode && styles.sortBtnActive]}
              onPress={() => setSortMode(mode)}
            >
              <Text style={[styles.sortBtnText, sortMode === mode && styles.sortBtnTextActive]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No services found for "{search}"</Text>
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearText}>Clear search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.countLabel}>
              {filtered.length} service{filtered.length !== 1 ? 's' : ''} available
            </Text>
          }
        />
      )}
    </View>
  );
}

const TEAL = '#14B8A6';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  safeTop: { backgroundColor: theme.colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.primary },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: theme.colors.text },
  sortRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  sortBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  sortBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sortBtnText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
  sortBtnTextActive: { color: theme.colors.white },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  countLabel: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardPopular: { borderColor: TEAL },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 32, marginRight: 14 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
  popularBadge: {
    backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  popularText: { fontSize: 10, fontWeight: '700', color: TEAL },
  cardDesc: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  cardMetaText: { fontSize: 12, color: theme.colors.textSecondary, marginLeft: 3 },
  cardMetaDot: { fontSize: 12, color: theme.colors.textLight, marginHorizontal: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  clearText: { fontSize: 15, color: TEAL, fontWeight: '600' },
});
