import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LGUService, SERVICE_CATALOG } from '../../constants/serviceCatalog';
import { theme } from '../../constants/theme';

const SERVICE_ICON_COLOR = '#2ECC71';
const COMING_SOON_BG = '#E5E7EB';
const COMING_SOON_TEXT = '#6B7280';
const SUBTEXT_COLOR = '#9CA3AF';

function formatFee(fee: number | null): string {
  if (fee === null || fee === 0) return 'Free';
  return `₱${fee}`;
}

function formatProcessingDays(days: number): string {
  if (days === 0) return 'Same day';
  if (days === 1) return '1 working day';
  return `${days} working days`;
}

function getCategoryIcon(categoryId: string): string {
  const category = SERVICE_CATALOG.find((cat) => cat.id === categoryId);
  return category?.icon ?? 'grid-outline';
}

export interface ServiceCardProps {
  service: LGUService;
  isPreview: boolean;
  onPress: (service: LGUService) => void;
}

export default function ServiceCard({ service, isPreview: _isPreview, onPress }: ServiceCardProps) {
  const isComingSoon = service.phase === 3;
  const iconName = getCategoryIcon(service.categoryId);

  return (
    <TouchableOpacity
      style={[styles.card, isComingSoon && styles.cardDisabled]}
      onPress={() => !isComingSoon && onPress(service)}
      disabled={isComingSoon}
      activeOpacity={isComingSoon ? 1 : 0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: isComingSoon }}
    >
      {/* Coming Soon badge */}
      {isComingSoon && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      )}

      <View style={styles.row}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name={iconName as 'key'} size={24} color={SERVICE_ICON_COLOR} />
        </View>

        {/* Text block */}
        <View style={styles.textBlock}>
          <Text style={styles.label} numberOfLines={1}>{service.label}</Text>

          <Text style={styles.meta}>
            {formatProcessingDays(service.processingDays)}
            {'  ·  '}
            {formatFee(service.fee)}
          </Text>

          {service.requiresKYC && (
            <Text style={styles.subtext}>Requires identity verification</Text>
          )}
          {service.requiresInPerson && (
            <Text style={styles.subtext}>In-person required</Text>
          )}
        </View>

        {/* Arrow */}
        {!isComingSoon && (
          <Ionicons name="chevron-forward-outline" size={18} color={SUBTEXT_COLOR} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: 14,
    marginBottom: 8,
    ...theme.shadows.sm,
  },
  cardDisabled: {
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  subtext: {
    fontSize: 11,
    color: SUBTEXT_COLOR,
    marginTop: 1,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COMING_SOON_BG,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 1,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: COMING_SOON_TEXT,
  },
});
