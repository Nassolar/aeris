import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { submitSighting } from '../../../services/boloService';

export default function SubmitSightingScreen() {
  const { boloId } = useLocalSearchParams<{ boloId: string }>();
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [barangay, setBarangay] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const pickPhoto = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        fromCamera
          ? 'Camera access is needed to take a photo.'
          : 'Gallery access is needed to attach a photo.'
      );
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe what you observed.');
      return;
    }

    setSubmitting(true);
    try {
      let coords: { latitude: number | null; longitude: number | null } = {
        latitude: null,
        longitude: null,
      };

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
      } catch {
        // Location is optional — submit without it
      }

      await submitSighting(boloId!, {
        description,
        barangay,
        isAnonymous,
        coords,
        photoUri,
      });

      setSuccess(true);
    } catch (error) {
      console.error('[SubmitSighting] error:', error);
      Alert.alert('Error', 'Failed to submit your sighting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Success modal */}
      <Modal visible={success} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={56} color="#06C167" />
            <Text style={styles.modalTitle}>Sighting Reported</Text>
            <Text style={styles.modalBody}>
              Thank you for helping keep your community safe.{'\n'}
              A supervisor will review your report shortly.{'\n'}
              You may earn points when your sighting is validated.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => router.back()}
              >
                <Text style={styles.modalBtnSecondaryText}>Back to Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={() => {
                  setSuccess(false);
                  router.push('/bolo/my-sightings');
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>My Sightings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report a Sighting</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Description */}
        <Text style={styles.label}>What did you see? *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what you observed... (location, direction of travel, behavior)"
          placeholderTextColor="#AAA"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* Location */}
        <Text style={styles.label}>Where did you see them?</Text>
        <TextInput
          style={styles.input}
          value={barangay}
          onChangeText={setBarangay}
          placeholder="Barangay / area name"
          placeholderTextColor="#AAA"
        />

        {/* Photo */}
        <Text style={styles.label}>Add Photo (optional)</Text>
        {photoUri ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <TouchableOpacity
              style={styles.removePhoto}
              onPress={() => setPhotoUri(null)}
            >
              <Ionicons name="close-circle" size={24} color="#C81919" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickPhoto(true)}>
              <Ionicons name="camera-outline" size={20} color="#000" />
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickPhoto(false)}>
              <Ionicons name="images-outline" size={20} color="#000" />
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Anonymous toggle */}
        <View style={styles.anonRow}>
          <View style={styles.anonLeft}>
            <Ionicons name="lock-closed-outline" size={18} color="#555" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.anonLabel}>Submit anonymously</Text>
              <Text style={styles.anonSub}>
                Your identity will be protected. You may still earn points if validated.
              </Text>
            </View>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: '#DDD', true: '#000' }}
            thumbColor="#FFF"
          />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="warning-outline" size={16} color="#E67E22" style={{ marginRight: 6 }} />
          <Text style={styles.disclaimerText}>
            By submitting you confirm this is a genuine sighting. False reports may be penalized.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.disabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>Submit Sighting</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },

  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    color: '#000',
  },
  textArea: { height: 120, textAlignVertical: 'top' },

  photoButtons: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  photoBtnText: { fontSize: 14, fontWeight: '600' },
  photoPreviewContainer: { position: 'relative' },
  photoPreview: { width: '100%', height: 180, borderRadius: 12 },
  removePhoto: { position: 'absolute', top: 8, right: 8 },

  anonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  anonLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 12 },
  anonLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  anonSub: { fontSize: 12, color: '#888', marginTop: 2, flexWrap: 'wrap' },

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9F0',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FDECC8',
  },
  disclaimerText: { fontSize: 12, color: '#666', flex: 1, lineHeight: 18 },

  submitBtn: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  disabled: { opacity: 0.6 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  modalBody: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  modalBtnPrimary: { backgroundColor: '#000' },
  modalBtnSecondary: { backgroundColor: '#F0F0F0' },
  modalBtnPrimaryText: { color: '#FFF', fontWeight: '700' },
  modalBtnSecondaryText: { color: '#333', fontWeight: '600' },
});
