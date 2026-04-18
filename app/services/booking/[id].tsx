import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Alert, Modal, Linking, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { theme } from '../../../constants/theme';
import {
  subscribeToBooking,
  subscribeToProviderLocation,
  cancelServiceBooking,
  approvePriceQuote,
  declinePriceQuote,
} from '../../../services/serviceMarketplaceService';
import { ServiceBooking, ServiceBookingStatus, ProviderLocation } from '../../../types/serviceMarketplace';

const TEAL = '#14B8A6';

const STATUS_LABELS: Record<ServiceBookingStatus, string> = {
  pending_confirmation: '⏳ Waiting for provider to accept…',
  confirmed:            '✅ Booking Confirmed!',
  provider_en_route:    '🚗 Provider is on the way',
  provider_arrived:     '📍 Provider has arrived',
  inspecting:           '🔍 Inspecting the issue',
  price_approval_pending: '💬 Price update — your action needed',
  price_approved:       '✅ Price approved — work starting',
  in_progress:          '🛠️ Work in progress',
  work_completed:       '✅ Work done — please verify',
  payment_pending:      '💳 Ready to pay',
  completed:            '🎉 Booking complete!',
  cancelled:            '❌ Booking cancelled',
};

const TIMELINE_STEPS = [
  { key: 'confirmed',            label: 'Booking confirmed' },
  { key: 'provider_en_route',    label: 'Provider on the way' },
  { key: 'provider_arrived',     label: 'Provider arrived' },
  { key: 'inspecting',           label: 'Inspection' },
  { key: 'price_approval_pending', label: 'Price agreed' },
  { key: 'in_progress',          label: 'Work in progress' },
  { key: 'work_completed',       label: 'Work completed' },
  { key: 'payment_pending',      label: 'Payment' },
  { key: 'completed',            label: 'Done' },
];

const STATUS_ORDER = TIMELINE_STEPS.map(s => s.key);

function getStepIndex(status: ServiceBookingStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export default function LiveBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<ServiceBooking | null>(null);
  const [providerLoc, setProviderLoc] = useState<ProviderLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!id) return;

    const unsubBooking = subscribeToBooking(id, (b) => {
      setBooking(b);
      setLoading(false);
      if (b.status === 'price_approval_pending') setShowPriceModal(true);
      if (b.status === 'work_completed' || b.status === 'payment_pending') {
        router.replace({ pathname: '/services/booking/complete', params: { bookingId: id } });
      }
    });

    return () => unsubBooking();
  }, [id]);

  useEffect(() => {
    if (!booking?.providerId) return;
    const unsubLoc = subscribeToProviderLocation(booking.providerId, setProviderLoc);
    return () => unsubLoc();
  }, [booking?.providerId]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel? Cancellation is free within 5 minutes.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelServiceBooking(id ?? '', 'Cancelled by user');
              router.replace('/(tabs)/bookings');
            } catch {
              Alert.alert('Error', 'Failed to cancel. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleApprovePrice = async () => {
    setShowPriceModal(false);
    try {
      await approvePriceQuote(id ?? '');
    } catch {
      Alert.alert('Error', 'Failed to approve. Please try again.');
    }
  };

  const handleDeclinePrice = async () => {
    setShowPriceModal(false);
    try {
      await declinePriceQuote(id ?? '');
      router.replace('/(tabs)/bookings');
    } catch {
      Alert.alert('Error', 'Failed to decline. Please try again.');
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:+63917000000');
  };

  const handleChat = () => {
    router.push({ pathname: '/chat/[chatId]', params: { chatId: id ?? '' } });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading booking…</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Booking not found.</Text>
      </View>
    );
  }

  const isActive = !['completed', 'cancelled'].includes(booking.status);
  const canCancel = ['pending_confirmation', 'confirmed'].includes(booking.status);
  const currentStep = getStepIndex(booking.status);

  // Map region: center on user or provider
  const mapLat = providerLoc?.latitude ?? booking.location.latitude ?? 14.5547;
  const mapLng = providerLoc?.longitude ?? booking.location.longitude ?? 121.0244;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />

      {/* Price Approval Modal */}
      <Modal visible={showPriceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Price Update</Text>
            {booking.pricing.finalQuote ? (
              <>
                <View style={styles.modalPriceLine}>
                  <Text style={styles.modalPriceKey}>Original estimate</Text>
                  <Text style={styles.modalPriceVal}>₱{booking.pricing.subtotal}</Text>
                </View>
                <View style={styles.modalPriceLine}>
                  <Text style={[styles.modalPriceKey, { fontWeight: '700' }]}>New quote</Text>
                  <Text style={[styles.modalPriceVal, { color: TEAL, fontSize: 20, fontWeight: '800' }]}>
                    ₱{booking.pricing.finalQuote.finalQuote}
                  </Text>
                </View>
                <Text style={styles.modalReason}>{booking.pricing.finalQuote.reason}</Text>
                {booking.pricing.finalQuote.additionalWork?.map((w, i) => (
                  <Text key={i} style={styles.modalBullet}>• {w}</Text>
                ))}
              </>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalDeclineBtn} onPress={handleDeclinePrice}>
                <Text style={styles.modalDeclineBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalApproveBtn} onPress={handleApprovePrice}>
                <Text style={styles.modalApproveBtnText}>
                  Approve ₱{booking.pricing.finalQuote?.finalQuote ?? booking.pricing.total}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.surface }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking #{id?.slice(-6).toUpperCase()}</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>{STATUS_LABELS[booking.status] ?? booking.status}</Text>
        </View>

        {/* Live Map */}
        {isActive && (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: mapLat,
              longitude: mapLng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation
          >
            {/* Provider pin */}
            {providerLoc && (
              <Marker
                coordinate={{ latitude: providerLoc.latitude, longitude: providerLoc.longitude }}
                title={booking.providerName}
              >
                <View style={styles.providerPin}>
                  <Ionicons name="person" size={14} color="#FFF" />
                </View>
              </Marker>
            )}
            {/* Destination pin */}
            <Marker
              coordinate={{ latitude: booking.location.latitude, longitude: booking.location.longitude }}
              title="Your location"
              pinColor={TEAL}
            />
          </MapView>
        )}

        {/* Provider Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROVIDER</Text>
          <View style={styles.providerRow}>
            <View style={styles.providerAvatar}>
              <Text style={styles.avatarText}>
                {booking.providerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{booking.providerName}</Text>
              <Text style={styles.etaText}>
                {booking.status === 'provider_en_route' ? 'On the way to you' : 'Tracking active'}
              </Text>
            </View>
            <View style={styles.providerActions}>
              <TouchableOpacity style={styles.actionCircle} onPress={handleCall}>
                <Ionicons name="call-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCircle} onPress={handleChat}>
                <Ionicons name="chatbubble-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Progress Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT'S NEXT</Text>
          {TIMELINE_STEPS.map((step, idx) => {
            const done = idx < currentStep;
            const active = idx === currentStep;
            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={[
                  styles.timelineDot,
                  done && styles.timelineDotDone,
                  active && styles.timelineDotActive,
                ]}>
                  {done ? <Ionicons name="checkmark" size={12} color="#FFF" /> : null}
                </View>
                {idx < TIMELINE_STEPS.length - 1 && (
                  <View style={[styles.timelineLine, done && styles.timelineLineDone]} />
                )}
                <Text style={[
                  styles.timelineLabel,
                  done && styles.timelineLabelDone,
                  active && styles.timelineLabelActive,
                ]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <TouchableOpacity style={styles.actionRow} onPress={handleChat}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionLabel}>Chat with {booking.providerName.split(' ')[0]}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={handleCall}>
            <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionLabel}>Call provider</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => Alert.alert('Report Issue', 'Please describe the issue.', [{ text: 'OK' }])}
          >
            <Ionicons name="warning-outline" size={20} color={theme.colors.error} />
            <Text style={[styles.actionLabel, { color: theme.colors.error }]}>Report an issue</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Service Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SERVICE</Text>
          <Text style={styles.serviceType}>
            {booking.service.subcategory.replace(/_/g, ' ')}
          </Text>
          <Text style={styles.serviceDesc}>{booking.service.description || 'No description provided.'}</Text>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRICING</Text>
          <View style={styles.priceLine}>
            <Text style={styles.priceKey}>Subtotal</Text>
            <Text style={styles.priceVal}>₱{booking.pricing.subtotal}</Text>
          </View>
          {booking.pricing.finalQuote?.status === 'approved' && (
            <View style={styles.priceLine}>
              <Text style={[styles.priceKey, { fontWeight: '700' }]}>Approved Final Quote</Text>
              <Text style={[styles.priceVal, { fontWeight: '800', color: TEAL }]}>
                ₱{booking.pricing.finalQuote.finalQuote}
              </Text>
            </View>
          )}
        </View>

        {/* Cancel option */}
        {canCancel && (
          <View style={styles.cancelSection}>
            <Text style={styles.cancelTitle}>⚠️ Need to cancel?</Text>
            <Text style={styles.cancelSub}>Free cancellation within 5 minutes of booking</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={cancelling}>
              {cancelling ? (
                <ActivityIndicator size="small" color={theme.colors.error} />
              ) : (
                <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: theme.colors.textSecondary },
  errorText: { fontSize: 16, color: theme.colors.error },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.primary },
  statusBanner: {
    backgroundColor: '#F0FDF4', padding: 16, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#BBF7D0',
  },
  statusText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary, textAlign: 'center' },
  map: { width: '100%', height: 220 },
  section: {
    backgroundColor: theme.colors.surface, margin: 16, marginBottom: 0,
    borderRadius: theme.borderRadius.lg, padding: 16,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, letterSpacing: 0.8, marginBottom: 12 },
  providerRow: { flexDirection: 'row', alignItems: 'center' },
  providerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
  etaText: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  providerActions: { flexDirection: 'row', gap: 8 },
  actionCircle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  // Timeline
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, position: 'relative' },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.surface, marginRight: 12, zIndex: 1,
  },
  timelineDotDone: { backgroundColor: TEAL, borderColor: TEAL },
  timelineDotActive: { borderColor: theme.colors.primary, backgroundColor: '#F0FDF4' },
  timelineLine: {
    position: 'absolute', left: 10, top: 22,
    width: 2, height: 28, backgroundColor: theme.colors.border, zIndex: 0,
  },
  timelineLineDone: { backgroundColor: TEAL },
  timelineLabel: { fontSize: 13, color: theme.colors.textSecondary, paddingTop: 3 },
  timelineLabelDone: { color: theme.colors.textSecondary },
  timelineLabelActive: { color: theme.colors.primary, fontWeight: '700' },
  // Quick actions
  actionRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  actionLabel: { flex: 1, fontSize: 15, color: theme.colors.primary, marginLeft: 12 },
  // Service
  serviceType: { fontSize: 15, fontWeight: '600', color: theme.colors.primary, textTransform: 'capitalize', marginBottom: 4 },
  serviceDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19 },
  // Pricing
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceKey: { fontSize: 14, color: theme.colors.textSecondary },
  priceVal: { fontSize: 14, color: theme.colors.primary },
  // Cancel
  cancelSection: {
    margin: 16, marginTop: 16, padding: 16,
    backgroundColor: '#FFF7F7', borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: '#FECACA', alignItems: 'center',
  },
  cancelTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.primary, marginBottom: 4 },
  cancelSub: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 12, textAlign: 'center' },
  cancelBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: theme.borderRadius.md, borderWidth: 1.5, borderColor: theme.colors.error,
  },
  cancelBtnText: { color: theme.colors.error, fontWeight: '700', fontSize: 14 },
  // Provider pin on map
  providerPin: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  // Price modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 32,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.primary, marginBottom: 16 },
  modalPriceLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  modalPriceKey: { fontSize: 15, color: theme.colors.textSecondary },
  modalPriceVal: { fontSize: 16, color: theme.colors.primary },
  modalReason: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8 },
  modalBullet: { fontSize: 13, color: theme.colors.textSecondary, marginLeft: 8, marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalDeclineBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: theme.colors.border, alignItems: 'center',
  },
  modalDeclineBtnText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
  modalApproveBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: TEAL, alignItems: 'center' },
  modalApproveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
