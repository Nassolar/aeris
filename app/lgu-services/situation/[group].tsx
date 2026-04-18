/**
 * Situation Group screen.
 * Shows all services relevant to a citizen situation (e.g. "Looking for work").
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../../constants/theme';
import {
  AERIS_TEAL,
  AERIS_TEAL_LIGHT,
  DEFAULT_SERVICE_CATALOG,
  SITUATION_GROUPS,
  SituationGroupId,
} from '../../../constants/lguServices';
import { ServiceListCard } from '../../../components/lgu/ServiceListCard';

export default function SituationGroupScreen() {
  const router = useRouter();
  const { group } = useLocalSearchParams<{ group: string }>();

  const groupData = SITUATION_GROUPS.find((g) => g.id === group);

  if (!groupData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Services</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Group not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const services = groupData.services
    .map((key) => DEFAULT_SERVICE_CATALOG.find((s) => s.templateKey === key))
    .filter(Boolean) as (typeof DEFAULT_SERVICE_CATALOG)[number][];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupData.label}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Situation hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name={groupData.icon as any} size={28} color={AERIS_TEAL} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{groupData.label}</Text>
            <Text style={styles.heroDesc}>{groupData.description}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>
          {services.length} SERVICE{services.length === 1 ? '' : 'S'} AVAILABLE
        </Text>

        {services.map((service) => (
          <ServiceListCard
            key={service.templateKey}
            service={service}
            onPress={() => router.push(`/lgu-services/request/${service.templateKey}`)}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AERIS_TEAL_LIGHT,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,198,174,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#005049',
    marginBottom: 3,
  },
  heroDesc: {
    fontSize: 13,
    color: '#005049',
    lineHeight: 18,
    opacity: 0.8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
