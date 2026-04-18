import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Image, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface RateModalProps {
  visible: boolean;
  booking: any;
  onClose: () => void;
  onSubmit: () => void;
}

const COMPLIMENTS = [
  { id: 'service', label: 'Excellent Service', icon: 'diamond-outline' },
  { id: 'expert', label: 'Expert', icon: 'ribbon-outline' },
  { id: 'chat', label: 'Great Chat', icon: 'chatbubbles-outline' },
  { id: 'punctual', label: 'Punctual', icon: 'time-outline' },
];

export function RateProviderModal({ visible, booking, onClose, onSubmit }: RateModalProps) {
  const [rating, setRating] = useState(5);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!booking) return null;

  const toggleCompliment = (id: string) => {
    if (selectedCompliments.includes(id)) {
      setSelectedCompliments(prev => prev.filter(c => c !== id));
    } else {
      setSelectedCompliments(prev => [...prev, id]);
    }
  };

  const submitRating = async () => {
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "bookings", booking.id), {
        rating: rating,
        feedback: feedback,
        compliments: selectedCompliments,
        isRated: true,
        ratedAt: serverTimestamp()
      });
      onSubmit();
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.popupCard}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Rate Service</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Provider Info */}
            <View style={styles.providerInfo}>
              <Image source={{ uri: booking.providerImage || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
              <Text style={styles.name}>{booking.providerName}</Text>
              <Text style={styles.role}>{booking.serviceType}</Text>
            </View>

            {/* Star Rating */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={32} 
                    color="#FFD700" 
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>
              {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Okay' : 'Poor'}
            </Text>

            {/* Compliments Chips */}
            <Text style={styles.sectionTitle}>Give a compliment?</Text>
            <View style={styles.chipContainer}>
              {COMPLIMENTS.map((item) => {
                const isSelected = selectedCompliments.includes(item.id);
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.chip, isSelected && styles.selectedChip]}
                    onPress={() => toggleCompliment(item.id)}
                  >
                    <Ionicons 
                      name={item.icon as any} 
                      size={14} 
                      color={isSelected ? "#FFF" : "#666"} 
                    />
                    <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.input}
              placeholder="Write a thank you note..."
              value={feedback}
              onChangeText={setFeedback}
              multiline
            />

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={submitRating} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitText}>SUBMIT RATING</Text>
              )}
            </TouchableOpacity>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20 
  },
  popupCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    width: '100%', 
    maxWidth: 340, // Limits width on tablets
    maxHeight: '85%', // Prevents overflow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10
  },
  scrollContent: { padding: 24 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800' },
  
  providerInfo: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginBottom: 8 },
  name: { fontSize: 18, fontWeight: '700' },
  role: { fontSize: 13, color: '#666' },

  starRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  ratingLabel: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginBottom: 20, color: '#555' },

  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 10, color: '#333' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { 
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, 
    borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EEE' 
  },
  selectedChip: { backgroundColor: '#000', borderColor: '#000' },
  chipText: { fontSize: 11, marginLeft: 6, fontWeight: '600', color: '#666' },
  selectedChipText: { color: '#FFF' },

  input: { 
    backgroundColor: '#F9F9F9', borderRadius: 12, padding: 12, 
    minHeight: 80, marginBottom: 20, textAlignVertical: 'top', fontSize: 14 
  },
  
  submitBtn: { backgroundColor: '#000', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: '800', fontSize: 14 }
});