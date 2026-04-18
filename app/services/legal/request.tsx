import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../../firebaseConfig';
import {
  callCreateConsultation,
  queryLegalAITriage,
  uploadConsultationDocument,
  ConsultationType,
} from '../../../services/consultationService';

const TEAL = '#00C6AE';
const MAX_DESCRIPTION = 2000;
const MIN_DESCRIPTION = 50;

const LEGAL_CATEGORIES = [
  { id: 'family',         label: 'Family' },
  { id: 'labor',          label: 'Labor' },
  { id: 'criminal',       label: 'Criminal' },
  { id: 'property',       label: 'Property' },
  { id: 'immigration',    label: 'Immigration' },
  { id: 'commercial',     label: 'Commercial' },
  { id: 'administrative', label: 'Administrative' },
  { id: 'environmental',  label: 'Environmental' },
  { id: 'cyber',          label: 'Cyber' },
  { id: 'other',          label: 'Other' },
];

interface AttachedFile {
  uri: string;
  name: string;
  type: string;
}

export default function LegalConsultationRequestScreen() {
  const router = useRouter();
  const currentUser = auth.currentUser;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription]           = useState('');
  const [attachments, setAttachments]           = useState<AttachedFile[]>([]);
  const [consultationType, setConsultationType] = useState<ConsultationType | null>(null);
  const [aiExpanded, setAiExpanded]             = useState(false);
  const [aiQuestion, setAiQuestion]             = useState('');
  const [aiAnswer, setAiAnswer]                 = useState('');
  const [aiLoading, setAiLoading]               = useState(false);
  const [submitting, setSubmitting]             = useState(false);

  const descriptionLength = description.length;
  const canSubmit = descriptionLength >= MIN_DESCRIPTION && consultationType !== null && !submitting;

  const handleAttach = async () => {
    if (attachments.length >= 5) {
      Alert.alert('Limit reached', 'You can attach up to 5 files.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const name = asset.fileName ?? `attachment_${Date.now()}.jpg`;
      const type = asset.mimeType ?? 'image/jpeg';
      setAttachments(prev => [...prev, { uri: asset.uri, name, type }]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const answer = await queryLegalAITriage(aiQuestion.trim());
      setAiAnswer(answer);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !currentUser) return;
    if (descriptionLength < MIN_DESCRIPTION) {
      Alert.alert('Too short', `Please describe your concern in at least ${MIN_DESCRIPTION} characters.`);
      return;
    }
    if (!consultationType) {
      Alert.alert('Required', 'Please select Pro Bono or Paid consultation.');
      return;
    }

    setSubmitting(true);
    try {
      // Upload attachments first
      const documentUrls: string[] = [];
      for (const file of attachments) {
        const url = await uploadConsultationDocument(file.uri, file.name, file.type);
        documentUrls.push(url);
      }

      const result = await callCreateConsultation({
        description,
        category: selectedCategory ?? undefined,
        type: consultationType,
        documentUrls,
      });

      router.replace({
        pathname: '/services/legal/waiting/[consultationId]',
        params: { consultationId: result.consultationId },
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal Consultation</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Category selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What area of law is your concern about?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {LEGAL_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
                onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.helperText}>Optional -- our AI will suggest a category if you skip.</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Describe your concern</Text>
          <TextInput
            style={[
              styles.descriptionInput,
              descriptionLength > 0 && descriptionLength < MIN_DESCRIPTION && styles.descriptionInputWarn,
            ]}
            placeholder="Describe your legal concern in detail..."
            placeholderTextColor="#9E9E9E"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            maxLength={MAX_DESCRIPTION}
            textAlignVertical="top"
          />
          <View style={styles.charCountRow}>
            {descriptionLength > 0 && descriptionLength < MIN_DESCRIPTION && (
              <Text style={styles.charCountWarn}>{MIN_DESCRIPTION - descriptionLength} more characters needed</Text>
            )}
            <Text style={[styles.charCount, descriptionLength > MAX_DESCRIPTION * 0.9 && styles.charCountNear]}>
              {descriptionLength}/{MAX_DESCRIPTION}
            </Text>
          </View>
          <Text style={styles.helperText}>The more detail you provide, the better your lawyer can prepare.</Text>
        </View>

        {/* Document upload */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Supporting Documents (optional)</Text>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttach} activeOpacity={0.8}>
            <Ionicons name="attach" size={18} color={TEAL} />
            <Text style={styles.attachBtnText}>Attach Documents</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>Contracts, demand letters, photos of documents, etc. Max 5 files.</Text>
          {attachments.map((file, idx) => (
            <View key={idx} style={styles.attachedFile}>
              {file.type.startsWith('image/') ? (
                <Image source={{ uri: file.uri }} style={styles.attachThumb} />
              ) : (
                <Ionicons name="document-text" size={24} color="#616161" />
              )}
              <Text style={styles.attachedFileName} numberOfLines={1}>{file.name}</Text>
              <TouchableOpacity onPress={() => handleRemoveAttachment(idx)}>
                <Ionicons name="close-circle" size={18} color="#9E9E9E" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Consultation type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Consultation Type</Text>
          <View style={styles.typeCards}>
            <TouchableOpacity
              style={[styles.typeCard, consultationType === 'pro_bono' && styles.typeCardActiveGreen]}
              onPress={() => setConsultationType('pro_bono')}
              activeOpacity={0.8}
            >
              <View style={styles.typeCardTop}>
                <Text style={styles.typeCardIcon}>🤝</Text>
                {consultationType === 'pro_bono' && (
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                )}
              </View>
              <Text style={[styles.typeCardTitle, consultationType === 'pro_bono' && { color: '#4CAF50' }]}>
                Pro Bono
              </Text>
              <Text style={styles.typeCardSub}>Free Legal Consultation</Text>
              <Text style={styles.typeCardNote}>Subject to lawyer availability</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeCard, consultationType === 'paid' && styles.typeCardActiveBlue]}
              onPress={() => setConsultationType('paid')}
              activeOpacity={0.8}
            >
              <View style={styles.typeCardTop}>
                <Text style={styles.typeCardIcon}>💼</Text>
                {consultationType === 'paid' && (
                  <Ionicons name="checkmark-circle" size={18} color="#2196F3" />
                )}
              </View>
              <Text style={[styles.typeCardTitle, consultationType === 'paid' && { color: '#2196F3' }]}>
                Paid
              </Text>
              <Text style={styles.typeCardSub}>Paid Consultation</Text>
              <Text style={styles.typeCardNote}>Rate set by your matched lawyer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal AI Triage */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.aiToggleRow}
            onPress={() => setAiExpanded(!aiExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.aiToggleLeft}>
              <Ionicons name="sparkles" size={16} color={TEAL} />
              <Text style={styles.aiToggleLabel}>Get quick guidance from Legal AI</Text>
            </View>
            <Ionicons name={aiExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9E9E9E" />
          </TouchableOpacity>

          {aiExpanded && (
            <View style={styles.aiPanel}>
              <View style={styles.aiDisclaimer}>
                <Ionicons name="information-circle" size={14} color="#FF9800" />
                <Text style={styles.aiDisclaimerText}>
                  This is for triage only and is not a substitute for legal consultation.
                </Text>
              </View>
              <TextInput
                style={styles.aiInput}
                placeholder="Ask a quick legal question..."
                placeholderTextColor="#9E9E9E"
                value={aiQuestion}
                onChangeText={setAiQuestion}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.aiAskBtn, (!aiQuestion.trim() || aiLoading) && styles.aiAskBtnDisabled]}
                onPress={handleAskAI}
                disabled={!aiQuestion.trim() || aiLoading}
                activeOpacity={0.8}
              >
                {aiLoading
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.aiAskBtnText}>Ask Legal AI</Text>}
              </TouchableOpacity>
              {aiAnswer ? (
                <View style={styles.aiAnswer}>
                  <Text style={styles.aiAnswerText}>{aiAnswer}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Submit */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.submitBtnText}>Request Consultation</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F8F8F8' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn:          { padding: 4 },
  headerTitle:      { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  body:             { flex: 1 },
  section:          { backgroundColor: '#FFFFFF', marginTop: 10, marginHorizontal: 0, paddingHorizontal: 16, paddingVertical: 16 },
  sectionLabel:     { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 10 },
  helperText:       { fontSize: 12, color: '#9E9E9E', marginTop: 6 },
  chipScroll:       { marginBottom: 6 },
  chip:             { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F5F5F5', marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  chipActive:       { backgroundColor: `${TEAL}15`, borderColor: TEAL },
  chipText:         { fontSize: 13, color: '#616161' },
  chipTextActive:   { color: TEAL, fontWeight: '600' },
  descriptionInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A1A', minHeight: 120, backgroundColor: '#FAFAFA' },
  descriptionInputWarn: { borderColor: '#FF9800' },
  charCountRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  charCount:        { fontSize: 11, color: '#9E9E9E', textAlign: 'right', flex: 1 },
  charCountNear:    { color: '#FF9800' },
  charCountWarn:    { fontSize: 11, color: '#FF9800' },
  attachBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: TEAL, borderRadius: 10, padding: 12, justifyContent: 'center' },
  attachBtnText:    { color: TEAL, fontSize: 14, fontWeight: '600' },
  attachedFile:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10 },
  attachThumb:      { width: 40, height: 40, borderRadius: 6 },
  attachedFileName: { flex: 1, fontSize: 13, color: '#424242' },
  typeCards:        { flexDirection: 'row', gap: 12 },
  typeCard:         { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA', padding: 14 },
  typeCardActiveGreen: { borderColor: '#4CAF50', backgroundColor: '#F1F8F1' },
  typeCardActiveBlue:  { borderColor: '#2196F3', backgroundColor: '#EEF6FF' },
  typeCardTop:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  typeCardIcon:     { fontSize: 22 },
  typeCardTitle:    { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  typeCardSub:      { fontSize: 12, color: '#424242', marginTop: 4 },
  typeCardNote:     { fontSize: 11, color: '#9E9E9E', marginTop: 4 },
  aiToggleRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  aiToggleLeft:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiToggleLabel:    { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  aiPanel:          { marginTop: 12, gap: 10 },
  aiDisclaimer:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FFF8E1', borderRadius: 8, padding: 10 },
  aiDisclaimerText: { flex: 1, fontSize: 12, color: '#E65100', lineHeight: 17 },
  aiInput:          { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, fontSize: 13, color: '#1A1A1A', minHeight: 70, backgroundColor: '#FAFAFA' },
  aiAskBtn:         { backgroundColor: TEAL, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  aiAskBtnDisabled: { backgroundColor: '#BDBDBD' },
  aiAskBtnText:     { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  aiAnswer:         { backgroundColor: '#F0FFFE', borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: TEAL },
  aiAnswerText:     { fontSize: 13, color: '#1A1A1A', lineHeight: 20 },
  footer:           { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  submitBtn:        { backgroundColor: TEAL, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled:{ backgroundColor: '#BDBDBD' },
  submitBtnText:    { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
