// Phase 1 — Preview Mode. Phase 2 adds Cloud Function calls.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../constants/theme';
import {
  SERVICE_CATALOG,
  SERVICE_CATALOG_FLAT,
  LGUService,
} from '../../constants/serviceCatalog';

import PreviewBanner from '../../components/city/PreviewBanner';
import ServiceCategoryTabs from '../../components/city/ServiceCategoryTabs';
import ServiceCard from '../../components/city/ServiceCard';
import ServiceDetailSheet from '../../components/city/ServiceDetailSheet';
import MyRequestsSection from '../../components/city/MyRequestsSection';

// Demo PSGC — Quezon City
const DEMO_CITY_LABEL = 'Quezon City';

export default function CityScreen() {
  const router = useRouter();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<LGUService | null>(null);

  const filteredServices = useMemo(() => {
    let results = SERVICE_CATALOG_FLAT;

    if (selectedCategoryId !== null) {
      results = results.filter((s) => s.categoryId === selectedCategoryId);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query.length > 0) {
      results = results.filter(
        (s) =>
          s.label.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query),
      );
    }

    return results;
  }, [selectedCategoryId, searchQuery]);

  function handleVerifyIdentity() {
    router.push('/kyc' as `/${string}`);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>City</Text>
          <View style={styles.cityPill}>
            <Text style={styles.cityPillText}>{DEMO_CITY_LABEL}</Text>
            <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
          </View>
        </View>

        {/* ── Preview Banner ── */}
        <PreviewBanner onVerifyIdentity={handleVerifyIdentity} />

        {/* ── My Requests (preview mocks) ── */}
        <MyRequestsSection isPreview />

        {/* ── Search ── */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search services"
          />
        </View>

        {/* ── Category Tabs ── */}
        <ServiceCategoryTabs
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        {/* ── Service Cards ── */}
        <View style={styles.cardsContainer}>
          {filteredServices.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={32} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>No services found</Text>
            </View>
          ) : (
            filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isPreview
                onPress={setSelectedService}
              />
            ))
          )}
        </View>

        {/* ── Footer ── */}
        <Text style={styles.footer}>
          {SERVICE_CATALOG_FLAT.length} services · Powered by AERIS · aeristech.ai
        </Text>
      </ScrollView>

      {/* ── Service Detail Sheet ── */}
      <ServiceDetailSheet
        service={selectedService}
        isPreview
        visible={selectedService !== null}
        onClose={() => setSelectedService(null)}
        onVerifyIdentity={() => {
          setSelectedService(null);
          handleVerifyIdentity();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 0,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  cityPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    padding: 0,
  },

  // Cards
  cardsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 8,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textLight,
  },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 24,
    paddingHorizontal: theme.spacing.md,
  },
});
