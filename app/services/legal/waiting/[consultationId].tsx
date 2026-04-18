import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  listenToConsultation,
  callCancelConsultation,
  Consultation,
} from '../../../../services/consultationService';

const TEAL = '#00C6AE';

const LEGAL_CATEGORY_LABELS: Record<string, string> = {
  family: 'Family Law', labor: 'Labor Law', criminal: 'Criminal Law',
  property: 'Property Law', immigration: 'Immigration',
  commercial: 'Commercial Law', administrative: 'Administrative Law',
  environmental: 'Environmental Law', cyber: 'Cyber Law', other: 'General',
};

export default function ConsultationWaitingScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
  const router = useRouter();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [cancelling, setCancelling]     = useState(false);

  // Pulsing animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 800, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, easing: Easing.ease, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  // Real-time listener — navigate on status change
  useEffect(() => {
    if (!consultationId) return;

    const unsubscribe = listenToConsultation(consultationId, (c) => {
      setConsultation(c);

      if (c.status === 'active') {
        // Lawyer accepted — navigate to chat
        router.replace({
          pathname: '/services/legal/chat/[consultationId]',
          params: { consultationId },
        });
      } else if (c.status === 'cancelled' || c.status === 'expired') {
        Alert.alert(
          c.status === 'expired' ? 'No Lawyers Available' : 'Consultation Cancelled',
          c.status === 'expired'
            ? 'We could not find an available lawyer. Please try again.'
            : 'Your consultation request has been cancelled.',
          [{ text: 'OK', onPress: () => router.replace('/') }],
        );
      }
    });

    return () => unsubscribe(); // clean up on unmount (spec requirement)
  }, [consultationId, router]);

  const handleCancel = () => {
    Alert.alert('Cancel Request', 'Cancel your legal consultation request?', [
      { text: 'Keep Waiting', style: 'cancel' },
      {
        text: 'Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await callCancelConsultation(consultationId!, 'citizen_cancelled');
            router.replace('/');
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed to cancel. Please try again.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const categoryLabel = consultation
    ? (LEGAL_CATEGORY_LABELS[consultation.category] ?? consultation.category)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Pulsing indicator */}
        <View style={styles.pulseContainer}>
          <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.pulseInner}>
            <Ionicons name="people" size={32} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.title}>Finding you a lawyer...</Text>

        {consultation && (
          <>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{categoryLabel}</Text>
            </View>
            {consultation.aiCategorySummary ? (
              <Text style={styles.aiSummary}>{consultation.aiCategorySummary}</Text>
            ) : null}
            <Text style={styles.subText}>
              {`We're matching you with a ${categoryLabel} lawyer.\nYou'll be notified when a lawyer accepts.`}
            </Text>
          </>
        )}

        <ActivityIndicator color={TEAL} size="large" style={styles.spinner} />

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: TEAL }]} />
          <Text style={styles.statusText}>
            {consultation?.status === 'matched' ? 'Lawyer found, waiting for acceptance...' : 'Searching for available lawyers...'}
          </Text>
        </View>
      </View>

      {/* Cancel */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          disabled={cancelling}
          activeOpacity={0.8}
        >
          {cancelling
            ? <ActivityIndicator color="#9E9E9E" size="small" />
            : <Text style={styles.cancelBtnText}>Cancel Request</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF' },
  content:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  pulseContainer:   { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 28 },
  pulseOuter:       { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: `${TEAL}25` },
  pulseInner:       { width: 72, height: 72, borderRadius: 36, backgroundColor: TEAL, justifyContent: 'center', alignItems: 'center' },
  title:            { fontSize: 22, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 14 },
  categoryChip:     { backgroundColor: `${TEAL}15`, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12 },
  categoryChipText: { color: TEAL, fontSize: 13, fontWeight: '600' },
  aiSummary:        { fontSize: 14, color: '#616161', textAlign: 'center', lineHeight: 21, marginBottom: 10, fontStyle: 'italic' },
  subText:          { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  spinner:          { marginBottom: 20 },
  statusRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot:        { width: 8, height: 8, borderRadius: 4 },
  statusText:       { fontSize: 13, color: '#616161' },
  footer:           { padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  cancelBtn:        { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText:    { fontSize: 15, color: '#9E9E9E', fontWeight: '600' },
});
