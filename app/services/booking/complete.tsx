import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Alert, Image, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../../constants/theme';
import {
  subscribeToBooking,
  confirmPayment,
  submitReview,
} from '../../../services/serviceMarketplaceService';
import { uploadImage } from '../../../services/imageService';
import { ServiceBooking } from '../../../types/serviceMarketplace';

const TEAL = '#14B8A6';

type PaymentMethod = 'cash' | 'gcash' | 'credit_card';

const REVIEW_TAGS = [
  { key: 'on_time',        label: 'On time' },
  { key: 'professional',   label: 'Professional' },
  { key: 'quality_work',   label: 'Quality work' },
  { key: 'fair_price',     label: 'Fair price' },
  { key: 'clean_workspace', label: 'Clean workspace' },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash',        label: 'Cash',        icon: 'cash-outline' },
  { value: 'gcash',       label: 'GCash',       icon: 'phone-portrait-outline' },
  { value: 'credit_card', label: 'Credit Card', icon: 'card-outline' },
];

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={36}
            color={n <= value ? '#F59E0B' : theme.colors.textLight}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ServiceCompleteScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<ServiceBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    const unsub = subscribeToBooking(bookingId, (b) => {
      setBooking(b);
      setLoading(false);
      // Prefill payment method from booking
      if (b.payment?.method) setPaymentMethod(b.payment.method);
    });
    return () => unsub();
  }, [bookingId]);

  const toggleTag = (key: string) => {
    setSelectedTags(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    );
  };

  const addReviewPhoto = async () => {
    if (reviewPhotos.length >= 3) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setReviewPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please rate your experience before submitting.');
      return;
    }
    if (!booking) return;

    setSubmitting(true);
    try {
      // Upload review photos
      const uploadedPhotos: string[] = [];
      for (const uri of reviewPhotos) {
        const url = await uploadImage(uri, 'review-photos');
        uploadedPhotos.push(url);
      }

      // Confirm payment + submit review in parallel
      await Promise.all([
        confirmPayment(bookingId ?? '', paymentMethod),
        submitReview({
          bookingId: bookingId ?? '',
          providerId: booking.providerId,
          rating,
          tags: selectedTags,
          comment,
          photos: uploadedPhotos,
        }),
      ]);

      Alert.alert(
        '🎉 Thank you!',
        'Your booking is complete and your review has been submitted.',
        [{ text: 'Done', onPress: () => router.replace('/(tabs)/bookings') }]
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to submit. Please try again.');
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

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Booking not found.</Text>
      </View>
    );
  }

  const finalAmount = booking.pricing.finalQuote?.finalQuote ?? booking.pricing.total;
  const initials = booking.providerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.surface }}>
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Service Completed</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Completion Badge */}
        <View style={styles.completionHero}>
          <View style={styles.completionIcon}>
            <Ionicons name="checkmark-circle" size={56} color={TEAL} />
          </View>
          <Text style={styles.completionTitle}>Work Done!</Text>
          <Text style={styles.completionSub}>
            {booking.providerName.split(' ')[0]} has completed the job.
          </Text>
        </View>

        {/* Provider */}
        <View style={styles.section}>
          <View style={styles.providerRow}>
            <View style={styles.providerAvatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.providerName}>{booking.providerName}</Text>
              <Text style={styles.serviceType}>
                {booking.service.subcategory.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Before/After Photos */}
        {(booking.beforePhotos?.length || booking.afterPhotos?.length) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Before & After</Text>
            <View style={styles.photoCompareRow}>
              {booking.beforePhotos?.[0] ? (
                <View style={styles.compareBox}>
                  <Image source={{ uri: booking.beforePhotos[0] }} style={styles.comparePhoto} />
                  <Text style={styles.compareLabel}>Before</Text>
                </View>
              ) : null}
              {booking.afterPhotos?.[0] ? (
                <View style={styles.compareBox}>
                  <Image source={{ uri: booking.afterPhotos[0] }} style={styles.comparePhoto} />
                  <Text style={styles.compareLabel}>After</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Work Completed */}
        {booking.workCompleted && booking.workCompleted.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Completed</Text>
            {booking.workCompleted.map((item, i) => (
              <View key={i} style={styles.workItem}>
                <Ionicons name="checkmark-circle" size={16} color={TEAL} />
                <Text style={styles.workItemText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Provider Notes */}
        {booking.providerNotes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider Notes</Text>
            <Text style={styles.providerNotes}>{booking.providerNotes}</Text>
          </View>
        ) : null}

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.payAmountRow}>
            <Text style={styles.payAmountLabel}>Final amount:</Text>
            <Text style={styles.payAmountValue}>₱{finalAmount}</Text>
          </View>
          <Text style={styles.payNote}>Payment method:</Text>
          <View style={styles.payOptions}>
            {PAYMENT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.payOption, paymentMethod === opt.value && styles.payOptionActive]}
                onPress={() => setPaymentMethod(opt.value)}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={18}
                  color={paymentMethod === opt.value ? TEAL : theme.colors.textSecondary}
                />
                <Text style={[styles.payOptionText, paymentMethod === opt.value && styles.payOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Your Experience</Text>
          <Text style={styles.rateQuestion}>How was your service with {booking.providerName.split(' ')[0]}?</Text>
          <View style={styles.starRow}>
            <StarRating value={rating} onChange={setRating} />
          </View>

          <Text style={styles.tagsLabel}>What went well?</Text>
          <View style={styles.tagsRow}>
            {REVIEW_TAGS.map(tag => (
              <TouchableOpacity
                key={tag.key}
                style={[styles.tag, selectedTags.includes(tag.key) && styles.tagActive]}
                onPress={() => toggleTag(tag.key)}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag.key) && styles.tagTextActive]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.tagsLabel}>Additional feedback <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.commentInput}
            placeholder={`Share your experience with ${booking.providerName.split(' ')[0]}…`}
            placeholderTextColor={theme.colors.textLight}
            multiline
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />

          <Text style={styles.tagsLabel}>Add photos <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.reviewPhotoRow}>
            {reviewPhotos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.reviewPhoto} />
            ))}
            {reviewPhotos.length < 3 && (
              <TouchableOpacity style={styles.addPhotoBtn} onPress={addReviewPhoto}>
                <Ionicons name="camera-outline" size={20} color={theme.colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Submit Review & Pay ₱{finalAmount}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)/bookings')}>
          <Text style={styles.skipBtnText}>Skip for now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: theme.colors.error },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.primary },
  scroll: { padding: 16 },
  completionHero: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl,
    padding: 28, alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  completionIcon: { marginBottom: 12 },
  completionTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.primary, marginBottom: 6 },
  completionSub: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' },
  section: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.primary, marginBottom: 12 },
  providerRow: { flexDirection: 'row', alignItems: 'center' },
  providerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  providerName: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
  serviceType: { fontSize: 13, color: theme.colors.textSecondary, textTransform: 'capitalize', marginTop: 2 },
  photoCompareRow: { flexDirection: 'row', gap: 12 },
  compareBox: { flex: 1, alignItems: 'center' },
  comparePhoto: { width: '100%', height: 140, borderRadius: 10, backgroundColor: '#EEE' },
  compareLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 6 },
  workItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  workItemText: { fontSize: 14, color: theme.colors.text, marginLeft: 8 },
  providerNotes: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 21 },
  payAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  payAmountLabel: { fontSize: 15, color: theme.colors.textSecondary },
  payAmountValue: { fontSize: 24, fontWeight: '800', color: theme.colors.primary },
  payNote: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 10 },
  payOptions: { flexDirection: 'row', gap: 8 },
  payOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 6,
    borderRadius: theme.borderRadius.md, borderWidth: 1.5, borderColor: theme.colors.border,
  },
  payOptionActive: { borderColor: TEAL, backgroundColor: '#F0FDFA' },
  payOptionText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
  payOptionTextActive: { color: TEAL },
  rateQuestion: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16 },
  starRow: { alignItems: 'center', marginBottom: 20 },
  tagsLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.primary, marginBottom: 10 },
  optional: { fontWeight: '400', color: theme.colors.textLight },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: theme.borderRadius.full, borderWidth: 1.5, borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  tagActive: { backgroundColor: '#F0FDFA', borderColor: TEAL },
  tagText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
  tagTextActive: { color: TEAL },
  commentInput: {
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md,
    padding: 12, fontSize: 14, color: theme.colors.text, minHeight: 80,
    backgroundColor: theme.colors.background, marginBottom: 16,
  },
  reviewPhotoRow: { flexDirection: 'row', gap: 8 },
  reviewPhoto: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#EEE' },
  addPhotoBtn: {
    width: 72, height: 72, borderRadius: 10,
    borderWidth: 1.5, borderColor: theme.colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background,
  },
  footer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg,
    paddingVertical: 16, gap: 8, marginBottom: 10,
  },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { fontSize: 14, color: theme.colors.textSecondary },
});
