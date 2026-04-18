import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LGUService, SERVICE_CATALOG } from '../../constants/serviceCatalog';
import { theme } from '../../constants/theme';

// Brand-specific colors
const SUBMIT_GREEN = '#2ECC71';
const LOCK_BG = '#F3F4F6';
const LOCK_TEXT = '#6B7280';
const DISABLED_BG = '#E5E7EB';
const DISABLED_TEXT = '#9CA3AF';
const DIVIDER = '#F3F4F6';

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

export interface ServiceDetailSheetProps {
  service: LGUService | null;
  isPreview: boolean;
  visible: boolean;
  onClose: () => void;
  onVerifyIdentity: () => void;
}

export default function ServiceDetailSheet({
  service,
  isPreview,
  visible,
  onClose,
  onVerifyIdentity,
}: ServiceDetailSheetProps) {
  if (!service) return null;

  const iconName = getCategoryIcon(service.categoryId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name={iconName as 'key'} size={22} color="#2ECC71" />
              </View>
              <Text style={styles.title} numberOfLines={2}>{service.label}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {/* Description */}
            <Text style={styles.description}>{service.description}</Text>

            {/* Detail rows */}
            <View style={styles.detailSection}>
              <DetailRow label="Fee" value={formatFee(service.fee)} />
              <DetailRow label="Processing" value={formatProcessingDays(service.processingDays)} />
              <DetailRow
                label="Pickup"
                value={service.requiresInPerson ? 'In-person required' : 'Digital delivery'}
              />
            </View>

            {/* Requirements */}
            <Text style={styles.sectionHeader}>Requirements</Text>
            <View style={styles.requirementsBlock}>
              {service.requiresKYC && (
                <Text style={styles.requirement}>Verified identity (KYC)</Text>
              )}
              {service.requiresInPerson && (
                <Text style={styles.requirement}>Valid government ID</Text>
              )}
              <Text style={styles.requirement}>Purpose of request</Text>
            </View>

            {/* Preview lock box */}
            {isPreview && (
              <View style={styles.lockBox}>
                <Ionicons name="lock-closed-outline" size={22} color={LOCK_TEXT} />
                <Text style={styles.lockText}>
                  Available when your city deploys AERIS
                </Text>
                <TouchableOpacity onPress={onVerifyIdentity} accessibilityRole="button">
                  <Text style={styles.lockCta}>Verify Identity →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit button */}
            {isPreview ? (
              <View style={styles.submitDisabled}>
                <Text style={styles.submitDisabledLabel}>Request This Service</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.submitEnabled}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.submitEnabledLabel}>Request This Service</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={detailRowStyles.row}>
      <Text style={detailRowStyles.label}>{label}</Text>
      <Text style={detailRowStyles.value}>{value}</Text>
    </View>
  );
}

const detailRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  label: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
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
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 22,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingBottom: 16,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textLight,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  requirementsBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    marginBottom: 20,
    gap: 6,
  },
  requirement: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 20,
  },
  lockBox: {
    backgroundColor: LOCK_BG,
    borderRadius: theme.borderRadius.sm,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  lockText: {
    fontSize: 13,
    color: LOCK_TEXT,
    textAlign: 'center',
    lineHeight: 18,
  },
  lockCta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  submitEnabled: {
    backgroundColor: SUBMIT_GREEN,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitEnabledLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  submitDisabled: {
    backgroundColor: DISABLED_BG,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabledLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: DISABLED_TEXT,
  },
});
