/**
 * Browse All Services screen.
 * Shows all services grouped by category with search filter.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../constants/theme';
import {
  AERIS_TEAL,
  AERIS_TEAL_LIGHT,
  DEFAULT_SERVICE_CATALOG,
} from '../../constants/lguServices';
import { LguServiceTemplate } from '../../types';
import { ServiceListCard } from '../../components/lgu/ServiceListCard';

export default function BrowseServicesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Group by category
  const sections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? DEFAULT_SERVICE_CATALOG.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.office.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q)
        )
      : DEFAULT_SERVICE_CATALOG;

    const map = new Map<string, LguServiceTemplate[]>();
    filtered.forEach((s) => {
      const existing = map.get(s.category) ?? [];
      map.set(s.category, [...existing, s]);
    });

    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Services</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={17} color={theme.colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={17} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={40} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>No services found for "{searchQuery}"</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.templateKey}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.categoryHeader}>{title.toUpperCase()}</Text>
          )}
          renderItem={({ item }) => (
            <ServiceListCard
              service={item}
              onPress={() => router.push(`/lgu-services/request/${item.templateKey}`)}
            />
          )}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    textAlign: 'center',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  categoryHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textLight,
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
