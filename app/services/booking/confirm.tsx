import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Alert, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import {
  fetchServiceRequest,
  fetchProviderById,
  createServiceBooking,
  URGENT_FEE,
  calcServiceFee,
} from '../../../services/serviceMarketplaceService';
import { ServiceRequest, MarketplaceProvider } from '../../../types/serviceMarketplace';

type PaymentMethod = 'cash' | 'gcash' | 'credit_card';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string; sub: string }[] = [
  { value: 'cash',        label: 'Cash',         icon: 'cash-outline',       sub: 'Pay on completion' },
  { value: 'gcash',       label: 'GCash',        icon: 'phone-portrait-outline', sub: 'Coming soon' },
  { value: 'credit_card', label: 'Credit Card',  icon: 'card-outline',       sub: 'Coming soon' },
];

const TEAL = '#14B8A6';

export default function BookingConfirmScreen() {
  const { requestId, providerId, providerName } = useLocalSearchParams<{
    requestId: string; providerId: string; providerName: string;
  }>();
  const router = useRouter();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [provider, setProvider] = useState<MarketplaceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchServiceRequest(requestId ?? ''),
      fetchProviderById(providerId ?? ''),
    ]).then(([req, prov]) => {
      if (active) { setRequest(req); setProvider(prov); setLoading(false); }
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestId, providerId]);

  const handleConfirm = async () => {
    if (!agreedToTerms) {
      Alert.alert('Agreement Required', 'Please agree to the terms before confirming.');
      return;
    }
    if (!request || !provider) return;

    setSubmitting(true);
    try {
      const bookingId = await createServiceBooking({
        requestId: requestId ?? '',
        provider,
        request,
        paymentMethod,
        specialInstructions: specialInstructions.trim() || undefined,
      });
      router.replace({
        pathname: '/services/booking/[id]',
        params: { id: bookingId },
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to confirm booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!request || !provider) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load booking details.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const baseRate = provider.baseRates?.[request.subcategory] ?? provider.baseRates?.default ?? 500;
  const urgentFee = request.urgency === 'now' ? URGENT_FEE : 0;
  const serviceFee = calcServiceFee(baseRate);
  const subtotal = baseRate + urgentFee + serviceFee;
  const initials = provider.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const urgencyLabel: Record<string, string> = {
    now: 'As soon as possible',
    today: 'Today',
    tomorrow: 'Tomorrow',
    scheduled: 'Scheduled',
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.surface }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Provider */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROVIDER</Text>
          <View style={styles.providerRow}>
            <View style={styles.providerAvatar}>
              <Text style={styles.providerAvatarText}>{initials}</Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingText}>{provider.stats.avgRating.toFixed(1)}</Text>
                {provider.eta && (
                  <Text style={styles.etaText}> · Arrives in ~{provider.eta} min</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Service Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SERVICE REQUEST</Text>
          <Text style={styles.serviceType}>
            {request.subcategory.replace(/_/g, ' ')} — {request.category}
          </Text>
          {request.description ? (
            <Text style={styles.serviceDesc} numberOfLines={3}>{request.description}</Text>
          ) : null}
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SCHEDULE</Text>
          <View style={styles.row}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.rowText}>{urgencyLabel[request.urgency] ?? request.urgency}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOCATION</Text>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.rowText}>{request.location.address}</Text>
          </View>
          {request.location.unit ? (
            <Text style={styles.subText}>{request.location.unit}</Text>
          ) : null}
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRICING</Text>
          <View style={styles.priceLine}>
            <Text style={styles.priceKey}>Base rate</Text>
            <Text style={styles.priceVal}>₱{baseRate}</Text>
          </View>
          {urgentFee > 0 && (
            <View style={styles.priceLine}>
              <Text style={styles.priceKey}>Urgent booking fee</Text>
              <Text style={styles.priceVal}>₱{urgentFee}</Text>
            </View>
          )}
          <View style={styles.priceLine}>
            <Text style={styles.priceKey}>AERIS service fee</Text>
            <Text style={styles.priceVal}>₱{serviceFee}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceLine}>
            <Text style={styles.priceTotal}>Subtotal</Text>
            <Text style={styles.priceTotalVal}>₱{subtotal}</Text>
          </View>
          <Text style={styles.priceNote}>💡 Final price confirmed after provider inspection</Text>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          {PAYMENT_OPTIONS.map(opt => {
            const disabled = opt.value !== 'cash';
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.paymentRow, paymentMethod === opt.value && styles.paymentRowActive, disabled && styles.paymentRowDisabled]}
                onPress={() => { if (!disabled) setPaymentMethod(opt.value); }}
                disabled={disabled}
              >
                <View style={[styles.payRadio, paymentMethod === opt.value && styles.payRadioActive]}>
                  {paymentMethod === opt.value && <View style={styles.payRadioDot} />}
                </View>
                <Ionicons name={opt.icon as any} size={18} color={disabled ? theme.colors.textLight : theme.colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.payLabel, disabled && styles.payLabelDisabled]}>{opt.label}</Text>
                  <Text style={styles.paySub}>{opt.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SPECIAL INSTRUCTIONS <Text style={styles.optional}>(Optional)</Text></Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder={`e.g. "Gate code: 1234, park in Visitor slot B3"`}
            placeholderTextColor={theme.colors.textLight}
            multiline
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            textAlignVertical="top"
          />
        </View>

        {/* Terms */}
        <View style={styles.termsBox}>
          <TouchableOpacity style={styles.checkRow} onPress={() => setAgreedToTerms(v => !v)}>
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={styles.checkText}>I agree to AERIS Terms of Service</Text>
          </TouchableOpacity>
          <View style={styles.checkRow}>
            <View style={[styles.checkbox, styles.checkboxChecked]}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
            <Text style={styles.checkText}>Free cancellation within 5 minutes of booking</Text>
          </View>
        </View>

        {/* Security note */}
        <View style={styles.securityRow}>
          <Ionicons name="lock-closed-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.securityText}> Secure booking · Money-back guarantee if provider no-show</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer CTA */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, (!agreedToTerms || submitting) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!agreedToTerms || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Confirm Booking</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 16, color: theme.colors.error, marginBottom: 12 },
  backLink: { fontSize: 15, color: TEAL, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.primary },
  scroll: { padding: 16 },
  section: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, letterSpacing: 0.8, marginBottom: 10 },
  providerRow: { flexDirection: 'row', alignItems: 'center' },
  providerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  providerAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: '700', color: theme.colors.primary, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, fontWeight: '600', color: '#D97706', marginLeft: 4 },
  etaText: { fontSize: 13, color: theme.colors.textSecondary },
  serviceType: { fontSize: 15, fontWeight: '600', color: theme.colors.primary, textTransform: 'capitalize', marginBottom: 6 },
  serviceDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  rowText: { fontSize: 14, color: theme.colors.text, marginLeft: 8, flex: 1 },
  subText: { fontSize: 13, color: theme.colors.textSecondary, marginLeft: 24, marginTop: 4 },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceKey: { fontSize: 14, color: theme.colors.textSecondary },
  priceVal: { fontSize: 14, color: theme.colors.primary },
  priceDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 8 },
  priceTotal: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
  priceTotalVal: { fontSize: 18, fontWeight: '800', color: theme.colors.primary },
  priceNote: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 8 },
  paymentRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  paymentRowActive: { backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 4 },
  paymentRowDisabled: { opacity: 0.45 },
  payRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  payRadioActive: { borderColor: TEAL },
  payRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: TEAL },
  payLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.primary },
  payLabelDisabled: { color: theme.colors.textLight },
  paySub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },
  optional: { fontWeight: '400', color: theme.colors.textLight },
  instructionsInput: {
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md,
    padding: 12, fontSize: 14, color: theme.colors.text, minHeight: 80,
    backgroundColor: theme.colors.background,
  },
  termsBox: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  checkboxChecked: { backgroundColor: TEAL, borderColor: TEAL },
  checkText: { flex: 1, fontSize: 13, color: theme.colors.text, lineHeight: 18 },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  securityText: { fontSize: 12, color: theme.colors.textSecondary },
  footer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg,
    paddingVertical: 16, gap: 8,
  },
  confirmBtnDisabled: { backgroundColor: '#999' },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
