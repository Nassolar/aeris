/**
 * LGU Services Tab — Services home screen.
 * Displays search, quick access grid, situation groups, and browse all.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../constants/theme';
import {
  AERIS_TEAL,
  AERIS_TEAL_LIGHT,
  DEFAULT_SERVICE_CATALOG,
  QUICK_ACCESS_DEFAULTS,
  SITUATION_GROUPS,
} from '../../constants/lguServices';
import { LguServiceTemplate } from '../../types';
import { ServiceListCard } from '../../components/lgu/ServiceListCard';

export default function LguServicesHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  // Search filter across all services
  const searchResults = useMemo<LguServiceTemplate[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return DEFAULT_SERVICE_CATALOG.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.office.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const quickAccessServices = QUICK_ACCESS_DEFAULTS.map((key) =>
    DEFAULT_SERVICE_CATALOG.find((s) => s.templateKey === key)
  ).filter(Boolean) as LguServiceTemplate[];

  const handleServicePress = (templateKey: string) => {
    router.push(`/lgu-services/request/${templateKey}`);
  };

  const handleSituationPress = (groupId: string) => {
    router.push(`/lgu-services/situation/${groupId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>SERVICES</Text>
          <Text style={styles.headerSubtitle}>What do you need today?</Text>
        </View>
        <TouchableOpacity
          style={styles.myRequestsBtn}
          onPress={() => router.push('/lgu-services/my-requests')}
          activeOpacity={0.7}
        >
          <Ionicons name="list-outline" size={18} color={AERIS_TEAL} />
          <Text style={styles.myRequestsText}>My Requests</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={theme.colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results overlay */}
      {searchQuery.length > 0 ? (
        <ScrollView
          style={styles.searchResults}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.searchResultsContent}
        >
          {searchResults.length === 0 ? (
            <View style={styles.emptySearch}>
              <Ionicons name="search-outline" size={36} color={theme.colors.textLight} />
              <Text style={styles.emptySearchText}>No services found for "{searchQuery}"</Text>
            </View>
          ) : (
            searchResults.map((service) => (
              <ServiceListCard
                key={service.templateKey}
                service={service}
                onPress={() => handleServicePress(service.templateKey)}
              />
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Access 2x3 Grid */}
          <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
          <View style={styles.quickGrid}>
            {quickAccessServices.map((service) => (
              <TouchableOpacity
                key={service.templateKey}
                style={styles.quickTile}
                onPress={() => handleServicePress(service.templateKey)}
                activeOpacity={0.75}
              >
                <View style={styles.quickIconWrap}>
                  <Ionicons
                    name={service.icon as any}
                    size={22}
                    color={AERIS_TEAL}
                  />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  {service.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* By Situation */}
          <Text style={[styles.sectionLabel, { marginTop: 28 }]}>BY SITUATION</Text>
          {SITUATION_GROUPS.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.situationRow}
              onPress={() => handleSituationPress(group.id)}
              activeOpacity={0.7}
            >
              <View style={styles.situationIconWrap}>
                <Ionicons name={group.icon as any} size={20} color={theme.colors.text} />
              </View>
              <View style={styles.situationInfo}>
                <Text style={styles.situationLabel}>{group.label}</Text>
                <Text style={styles.situationCount}>
                  {group.services.length} services
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textLight} />
            </TouchableOpacity>
          ))}

          {/* Browse All */}
          <TouchableOpacity
            style={styles.browseAllBtn}
            onPress={() => router.push('/lgu-services/browse')}
            activeOpacity={0.8}
          >
            <Text style={styles.browseAllText}>Browse all services</Text>
            <Ionicons name="arrow-forward" size={16} color={AERIS_TEAL} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  myRequestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AERIS_TEAL_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginTop: 2,
  },
  myRequestsText: {
    fontSize: 12,
    fontWeight: '700',
    color: AERIS_TEAL,
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
    height: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Quick Access Grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickTile: {
    width: '31%',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AERIS_TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 15,
  },

  // Situation Rows
  situationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  situationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  situationInfo: {
    flex: 1,
  },
  situationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  situationCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  // Browse All
  browseAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: AERIS_TEAL,
    gap: 8,
  },
  browseAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: AERIS_TEAL,
  },

  // Search Results
  searchResults: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchResultsContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptySearch: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptySearchText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

});
