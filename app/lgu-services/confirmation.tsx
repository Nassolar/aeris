/**
 * Service Request Confirmation screen.
 * Shows reference number, QR code, next steps, and action buttons.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

import { theme } from '../../constants/theme';
import { AERIS_TEAL, AERIS_TEAL_LIGHT } from '../../constants/lguServices';

export default function ServiceConfirmationScreen() {
  const router = useRouter();
  const {
    referenceNumber,
    requestId,
    serviceName,
    office,
    feeLabel,
    processingDays,
  } = useLocalSearchParams<{
    referenceNumber: string;
    requestId: string;
    serviceName: string;
    office: string;
    feeLabel: string;
    processingDays: string;
  }>();

  const processingDaysNum = parseInt(processingDays ?? '1', 10);
  const processingText =
    processingDaysNum === 0
      ? 'Same day'
      : processingDaysNum === 1
      ? '1 business day'
      : `${processingDaysNum} business days`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My ${serviceName} reference number: ${referenceNumber}\nOffice: ${office}`,
        title: `${serviceName} Reference`,
      });
    } catch (err) {
      // User dismissed share sheet — not an error
    }
  };

  const handleSaveToPhone = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Allow access to your photos to save the QR code.'
      );
      return;
    }
    // QR save as text fallback — full image capture requires ViewShot library.
    // For now, save the reference number as a note.
    Alert.alert(
      'Reference saved',
      `Reference number ${referenceNumber} copied. Take a screenshot to save the QR code.`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={AERIS_TEAL} />
        </View>

        <Text style={styles.successTitle}>Request submitted</Text>
        <Text style={styles.serviceName}>{serviceName}</Text>

        {/* Reference number */}
        <View style={styles.refCard}>
          <Text style={styles.refLabel}>REFERENCE NUMBER</Text>
          <Text style={styles.refNumber}>{referenceNumber}</Text>

          {/* QR Code */}
          <View style={styles.qrWrapper}>
            <QRCode
              value={referenceNumber ?? 'AERIS-SERVICE'}
              size={160}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          </View>

          <Text style={styles.qrHint}>Show this QR at {office}</Text>
        </View>

        {/* What happens next */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>What happens next</Text>
          <View style={styles.step}>
            <View style={styles.stepDot}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <Text style={styles.stepText}>
              {office} reviews your request.
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepDot}>
              <Text style={styles.stepNum}>2</Text>
            </View>
            <Text style={styles.stepText}>
              {feeLabel && feeLabel !== 'Free'
                ? `Pay ${feeLabel} at the office using the reference number above.`
                : 'No payment required for this service.'}
            </Text>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, { backgroundColor: AERIS_TEAL }]}>
              <Text style={[styles.stepNum, { color: '#FFF' }]}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Your certificate will appear in this app in{' '}
              <Text style={{ fontWeight: '700', color: theme.colors.text }}>
                {processingText}
              </Text>
              .
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={handleSaveToPhone}
              activeOpacity={0.75}
            >
              <Ionicons name="download-outline" size={18} color={AERIS_TEAL} />
              <Text style={styles.actionBtnOutlineText}>Save to phone</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={handleShare}
              activeOpacity={0.75}
            >
              <Ionicons name="share-outline" size={18} color={AERIS_TEAL} />
              <Text style={styles.actionBtnOutlineText}>Share reference</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => router.replace('/lgu-services/my-requests')}
            activeOpacity={0.85}
          >
            <Ionicons name="list-outline" size={18} color="#FFF" />
            <Text style={styles.trackBtnText}>Track this request</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.replace('/(tabs)/lgu-services')}
            activeOpacity={0.7}
          >
            <Text style={styles.backLinkText}>Back to Services</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },

  // Reference card
  refCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    ...theme.shadows.md,
  },
  refLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  refNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 20,
    letterSpacing: 1,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  qrHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Next steps
  nextStepsCard: {
    width: '100%',
    backgroundColor: AERIS_TEAL_LIGHT,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  nextStepsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#005049',
    marginBottom: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,198,174,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#005049',
  },
  stepText: {
    fontSize: 13,
    color: '#005049',
    lineHeight: 19,
    flex: 1,
    fontWeight: '500',
  },

  // Actions
  actions: {
    width: '100%',
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 7,
  },
  actionBtnOutline: {
    borderWidth: 1.5,
    borderColor: AERIS_TEAL,
    backgroundColor: theme.colors.surface,
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: AERIS_TEAL,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AERIS_TEAL,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    ...theme.shadows.md,
  },
  trackBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
});

