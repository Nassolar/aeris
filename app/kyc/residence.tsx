import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useKycStore } from './kycStore';

const CITY_BLACK = '#000000';

const DOC_TYPES = ['Barangay Certificate', 'Utility Bill', 'Lease Contract'];

export default function KycResidence() {
  const router = useRouter();
  const { residenceDocType, residenceDoc, setField } = useKycStore();

  const pickDocument = async () => {
    if (!residenceDocType) {
      Alert.alert('Select document type', 'Please select a document type first.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Gallery access is needed to upload your document.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setField('residenceDoc', result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Identity Verification  ·  Step 3 of 4</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '75%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Confirm your address</Text>
        <Text style={styles.subtitle}>Upload one of the following:</Text>

        {DOC_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.docTypeBtn, residenceDocType === type && styles.docTypeBtnActive]}
            onPress={() => setField('residenceDocType', type)}
          >
            <Text style={[styles.docTypeLabel, residenceDocType === type && styles.docTypeLabelActive]}>
              {type}
            </Text>
            {residenceDocType === type && (
              <Ionicons name="checkmark-circle" size={18} color="#000" />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.uploadBtn, !residenceDocType && styles.uploadBtnDisabled]}
          onPress={pickDocument}
          disabled={!residenceDocType}
          activeOpacity={0.7}
        >
          <Ionicons name="attach" size={20} color={residenceDocType ? '#374151' : '#9CA3AF'} style={{ marginRight: 8 }} />
          <Text style={[styles.uploadBtnLabel, !residenceDocType && { color: '#9CA3AF' }]}>
            {residenceDoc ? 'Document uploaded ✓' : 'Upload Document'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Must show your name and address. Document must be dated within the last 3 months.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => router.push('/kyc/household')}
        >
          <Text style={styles.continueBtnLabel}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => {
            setField('residenceDoc', null);
            setField('residenceDocType', '');
            router.push('/kyc/household');
          }}
        >
          <Text style={styles.skipBtnLabel}>Skip — I'll do this later</Text>
        </TouchableOpacity>
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

  content: { paddingHorizontal: 24, paddingTop: 28 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },

  docTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  docTypeBtnActive: { borderColor: '#000', backgroundColor: '#F3F4F6' },
  docTypeLabel: { fontSize: 15, fontWeight: '500', color: '#374151' },
  docTypeLabelActive: { color: '#000', fontWeight: '600' },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },

  note: { fontSize: 13, color: '#9CA3AF', lineHeight: 20 },

  footer: { paddingHorizontal: 24, paddingBottom: 8 },
  continueBtn: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  continueBtnLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  skipBtn: { paddingVertical: 12, alignItems: 'center' },
  skipBtnLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
});
