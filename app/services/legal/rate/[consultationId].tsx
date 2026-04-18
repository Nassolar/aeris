import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { callRateConsultation } from '../../../../services/consultationService';

const TEAL = '#00C6AE';

export default function ConsultationRatingScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
  const router = useRouter();

  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await callRateConsultation(consultationId!, rating, comment.trim() || undefined);
      Alert.alert('Thank you!', 'Your feedback helps improve the IBP consultation experience.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="star" size={36} color={TEAL} />
        </View>

        <Text style={styles.title}>Rate Your Consultation</Text>
        <Text style={styles.sub}>How was your legal consultation experience?</Text>

        {/* Stars */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn} activeOpacity={0.7}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={40}
                color={star <= rating ? '#FFB400' : '#E0E0E0'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <Text style={styles.ratingLabel}>
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </Text>
        )}

        {/* Optional comment */}
        <TextInput
          style={styles.commentInput}
          placeholder="Share your experience (optional)..."
          placeholderTextColor="#9E9E9E"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (rating === 0 || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.submitBtnText}>Submit Rating</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/')} disabled={submitting}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF' },
  content:          { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 40 },
  iconCircle:       { width: 80, height: 80, borderRadius: 40, backgroundColor: `${TEAL}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title:            { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  sub:              { fontSize: 14, color: '#616161', textAlign: 'center', marginBottom: 28 },
  starsRow:         { flexDirection: 'row', gap: 8, marginBottom: 10 },
  starBtn:          { padding: 4 },
  ratingLabel:      { fontSize: 16, fontWeight: '600', color: '#FFB400', marginBottom: 20 },
  commentInput:     { width: '100%', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A1A', minHeight: 100, backgroundColor: '#FAFAFA' },
  footer:           { padding: 20, gap: 8 },
  submitBtn:        { backgroundColor: TEAL, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled:{ backgroundColor: '#BDBDBD' },
  submitBtnText:    { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  skipBtn:          { alignItems: 'center', paddingVertical: 10 },
  skipBtnText:      { color: '#9E9E9E', fontSize: 14 },
});
