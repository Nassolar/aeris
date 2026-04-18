import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Brand-specific colors not in theme
const BANNER_BG = '#FFF8E1';
const BANNER_BORDER = '#F59E0B';
const BANNER_ACCENT = '#F59E0B';

export interface PreviewBannerProps {
  onVerifyIdentity: () => void;
}

export default function PreviewBanner({ onVerifyIdentity }: PreviewBannerProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="eye-outline" size={20} color={BANNER_ACCENT} style={styles.icon} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>PREVIEW MODE</Text>
        <Text style={styles.body}>
          These services will be available once your city deploys AERIS.
        </Text>
        <TouchableOpacity onPress={onVerifyIdentity} accessibilityRole="button">
          <Text style={styles.cta}>Verify Identity →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BANNER_BG,
    borderLeftWidth: 3,
    borderLeftColor: BANNER_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
    marginTop: 1,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  body: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 6,
  },
  cta: {
    fontSize: 13,
    fontWeight: '600',
    color: BANNER_ACCENT,
  },
});
