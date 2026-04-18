import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useKycStore } from './kycStore';

const CITY_BLACK = '#000000';

const ID_TYPES = ['UMID', 'PhilSys', "Driver's License", 'Passport', 'Postal ID', "Voter's ID"];

export default function KycIdUpload() {
  const router = useRouter();
  const { idType, idFront, idBack, setField } = useKycStore();

  const pickImage = async (side: 'front' | 'back') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryStatus.status !== 'granted') {
        Alert.alert('Permission required', 'Camera or gallery access is needed to capture your ID.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        base64: false,
      });
      if (!result.canceled && result.assets[0]) {
        setField(side === 'front' ? 'idFront' : 'idBack', result.assets[0].uri);
      }
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setField(side === 'front' ? 'idFront' : 'idBack', result.assets[0].uri);
    }
  };

  const isPassport = idType === 'Passport';
  const canContinue = !!idType && !!idFront && (isPassport || !!idBack);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Identity Verification  ·  Step 1 of 4</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '25%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Upload a government-issued ID</Text>
        <Text style={styles.subtitle}>Select the type of ID you have:</Text>

        {/* ID type grid */}
        <View style={styles.idGrid}>
          {ID_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.idPill, idType === type && styles.idPillActive]}
              onPress={() => setField('idType', type)}
            >
              <Text style={[styles.idPillLabel, idType === type && styles.idPillLabelActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Front photo */}
        <PhotoCapture
          label="Take Photo — Front"
          uri={idFront}
          onCapture={() => pickImage('front')}
          onRetake={() => setField('idFront', null)}
        />

        {/* Back photo (not required for passport) */}
        <PhotoCapture
          label={`Take Photo — Back${isPassport ? ' (optional)' : ''}`}
          uri={idBack}
          onCapture={() => pickImage('back')}
          onRetake={() => setField('idBack', null)}
        />

        <Text style={styles.tip}>
          Tip: Ensure all text is readable and the ID is fully in frame.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={() => router.push('/kyc/selfie')}
          disabled={!canContinue}
        >
          <Text style={styles.continueBtnLabel}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function PhotoCapture({
  label,
  uri,
  onCapture,
  onRetake,
}: {
  label: string;
  uri: string | null;
  onCapture: () => void;
  onRetake: () => void;
}) {
  if (uri) {
    return (
      <View style={styles.photoPreviewWrap}>
        <Image source={{ uri }} style={styles.photoPreview} resizeMode="cover" />
        <TouchableOpacity style={styles.retakeBtn} onPress={onRetake}>
          <Ionicons name="refresh" size={16} color="#374151" />
          <Text style={styles.retakeBtnLabel}>Retake</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <TouchableOpacity style={styles.photoBtn} onPress={onCapture} activeOpacity={0.7}>
      <Ionicons name="camera" size={22} color="#374151" style={{ marginRight: 10 }} />
      <Text style={styles.photoBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  stepLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  progressTrack: { height: 4, backgroundColor: '#F3F4F6' },
  progressFill: { height: 4, backgroundColor: '#000' },

  content: { padding: 24, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },

  idGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  idPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  idPillActive: { borderColor: '#000', backgroundColor: '#F3F4F6' },
  idPillLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  idPillLabelActive: { color: '#000' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },

  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 14,
    backgroundColor: '#F9FAFB',
  },
  photoBtnLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },

  photoPreviewWrap: { marginBottom: 14 },
  photoPreview: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#F3F4F6' },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
    gap: 4,
    padding: 4,
  },
  retakeBtnLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },

  tip: { fontSize: 13, color: '#9CA3AF', lineHeight: 20, marginTop: 8 },

  footer: { paddingHorizontal: 24, paddingBottom: 8, paddingTop: 8 },
  continueBtn: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueBtnDisabled: { backgroundColor: '#E5E7EB' },
  continueBtnLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
