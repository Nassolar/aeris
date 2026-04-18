import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useKycStore } from './kycStore';

const CITY_BLACK = '#000000';

const TIPS = [
  'Good lighting, face forward',
  'Remove sunglasses or hat',
  'Neutral expression',
];

export default function KycSelfie() {
  const router = useRouter();
  const { selfie, setField } = useKycStore();

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to take your selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.85,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setField('selfie', result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Identity Verification  ·  Step 2 of 4</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '50%' }]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Take a selfie</Text>
        <Text style={styles.subtitle}>We'll match this to your ID photo.</Text>

        {/* Oval face guide / preview */}
        {selfie ? (
          <View style={styles.ovalWrap}>
            <Image source={{ uri: selfie }} style={styles.selfiePreview} />
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => setField('selfie', null)}
            >
              <Ionicons name="refresh" size={16} color="#374151" />
              <Text style={styles.retakeBtnLabel}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ovalWrap}>
            <View style={styles.oval}>
              <Ionicons name="person" size={80} color="#D1D5DB" />
            </View>
            <Text style={styles.ovalHint}>Position your face in the oval</Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsWrap}>
          <Text style={styles.tipsHeader}>Tips:</Text>
          {TIPS.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        {!selfie ? (
          <TouchableOpacity style={styles.captureBtn} onPress={takeSelfie}>
            <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.captureBtnLabel}>Take Selfie</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.push('/kyc/residence')}
          >
            <Text style={styles.continueBtnLabel}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
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

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 28 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 32 },

  ovalWrap: { alignItems: 'center', marginBottom: 32 },
  oval: {
    width: 200,
    height: 240,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  selfiePreview: {
    width: 200,
    height: 240,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#000',
  },
  ovalHint: { fontSize: 13, color: '#9CA3AF', marginTop: 14 },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    padding: 6,
  },
  retakeBtnLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },

  tipsWrap: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  tipsHeader: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  tipRow: { flexDirection: 'row', marginBottom: 6 },
  tipBullet: { fontSize: 14, color: '#6B7280', marginRight: 8 },
  tipText: { fontSize: 13, color: '#6B7280', flex: 1 },

  footer: { paddingHorizontal: 24, paddingBottom: 8 },
  captureBtn: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  continueBtn: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueBtnLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
