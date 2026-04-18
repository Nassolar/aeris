/**
 * ServiceListCard — reusable card for displaying a single LGU service.
 * Used in the Services home search results, Browse All, and Situation Group screens.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../constants/theme';
import { AERIS_TEAL, AERIS_TEAL_LIGHT } from '../../constants/lguServices';
import { LguServiceTemplate } from '../../types';

interface ServiceListCardProps {
  service: LguServiceTemplate;
  onPress: () => void;
}

export function ServiceListCard({ service, onPress }: ServiceListCardProps) {
  const processingText =
    service.processingDays === 0
      ? 'Same day'
      : `${service.processingDays} day${service.processingDays === 1 ? '' : 's'}`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconWrap}>
        <Ionicons name={service.icon as any} size={22} color={AERIS_TEAL} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{service.name}</Text>
        <Text style={styles.office}>{service.office}</Text>
        <Text style={styles.meta}>
          {service.feeLabel} · {processingText}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {service.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
    gap: 12,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: AERIS_TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  office: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  meta: {
    fontSize: 11,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  desc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
});
