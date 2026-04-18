import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../../../firebaseConfig';
import {
  listenToConsultation,
  listenToConsultationMessages,
  sendCitizenMessage,
  sendCitizenImageMessage,
  Consultation,
  ConsultationMessage,
} from '../../../../services/consultationService';

const TEAL = '#00C6AE';

const LEGAL_CATEGORY_LABELS: Record<string, string> = {
  family: 'Family Law', labor: 'Labor Law', criminal: 'Criminal Law',
  property: 'Property Law', immigration: 'Immigration',
  commercial: 'Commercial Law', administrative: 'Administrative Law',
  environmental: 'Environmental Law', cyber: 'Cyber Law', other: 'General',
};

export default function ActiveConsultationScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
  const router = useRouter();
  const currentUser = auth.currentUser;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages]         = useState<ConsultationMessage[]>([]);
  const [inputText, setInputText]       = useState('');
  const [sending, setSending]           = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [showRating, setShowRating]     = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // ── Consultation status listener ───────────────────────────────────────────
  useEffect(() => {
    if (!consultationId) return;
    const unsubscribe = listenToConsultation(consultationId, (c) => {
      setConsultation(c);
      if (c.status === 'completed') {
        setShowRating(true);
      } else if (c.status === 'cancelled') {
        Alert.alert(
          'Consultation Ended',
          'This consultation has been cancelled.',
          [{ text: 'OK', onPress: () => router.replace('/') }],
        );
      }
    });
    return () => unsubscribe(); // spec: clean up on unmount
  }, [consultationId, router]);

  // ── Messages listener ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!consultationId) return;
    const unsubscribe = listenToConsultationMessages(consultationId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    });
    return () => unsubscribe(); // spec: clean up on unmount
  }, [consultationId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !currentUser) return;
    setSending(true);
    setInputText('');
    try {
      await sendCitizenMessage(consultationId!, currentUser.uid, text);
    } catch {
      setInputText(text);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleAttach = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets?.[0] || !currentUser) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      await sendCitizenImageMessage(
        consultationId!, currentUser.uid,
        asset.uri, asset.fileName ?? `img_${Date.now()}.jpg`, asset.mimeType ?? 'image/jpeg',
      );
    } catch {
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderMessage = ({ item }: { item: ConsultationMessage }) => {
    const isCitizen = item.senderRole === 'citizen';
    const isSystem  = item.senderRole === 'system';
    const ts = (item.timestamp as any)?.toDate?.();
    const timeStr = ts
      ? ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : '';

    if (isSystem) {
      return (
        <View style={styles.systemMsgRow}>
          <Text style={styles.systemMsgText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.bubbleRow, isCitizen ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        <View style={[styles.bubble, isCitizen ? styles.bubbleCitizen : styles.bubbleLawyer]}>
          {item.contentType === 'image' && item.documentUrl ? (
            <Image source={{ uri: item.documentUrl }} style={styles.msgImage} resizeMode="cover" />
          ) : item.contentType === 'document' ? (
            <View style={styles.docBubble}>
              <Ionicons name="document-text" size={18} color={isCitizen ? '#FFFFFF' : TEAL} />
              <Text style={[styles.docName, isCitizen && { color: '#FFFFFF' }]} numberOfLines={1}>
                {item.documentName ?? 'Document'}
              </Text>
            </View>
          ) : (
            <Text style={[styles.bubbleText, isCitizen && styles.bubbleTextLight]}>{item.content}</Text>
          )}
          <Text style={[styles.bubbleTime, isCitizen && styles.bubbleTimeLight]}>{timeStr}</Text>
        </View>
      </View>
    );
  };

  const categoryLabel = consultation
    ? (LEGAL_CATEGORY_LABELS[consultation.category] ?? consultation.category)
    : '';

  // Completion banner + rating CTA
  if (showRating) {
    return (
      <SafeAreaView style={styles.completedContainer} edges={['top', 'bottom']}>
        <View style={styles.completedContent}>
          <Ionicons name="checkmark-circle" size={64} color={TEAL} />
          <Text style={styles.completedTitle}>Consultation Complete</Text>
          <Text style={styles.completedSub}>Your legal consultation has ended. Would you like to rate your experience?</Text>
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => router.replace({ pathname: '/services/legal/rate/[consultationId]', params: { consultationId: consultationId! } })}
            activeOpacity={0.85}
          >
            <Text style={styles.rateBtnText}>Rate Consultation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/')}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Legal Consultation</Text>
            {categoryLabel ? (
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{categoryLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Consultation is active. Say hello to your lawyer.</Text>
            </View>
          }
        />

        {/* Input */}
        <SafeAreaView edges={['bottom']} style={styles.inputSafe}>
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.attachBtn} onPress={handleAttach} disabled={uploading} activeOpacity={0.7}>
              {uploading
                ? <ActivityIndicator size="small" color={TEAL} />
                : <Ionicons name="attach" size={22} color={TEAL} />}
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#9E9E9E"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={5000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
              activeOpacity={0.8}
            >
              {sending
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Ionicons name="send" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#F5F5F5' },
  safeArea:          { flex: 1 },
  header:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn:           { padding: 4, marginRight: 10 },
  headerInfo:        { flex: 1 },
  headerTitle:       { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  catBadge:          { backgroundColor: `${TEAL}15`, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 2 },
  catBadgeText:      { color: TEAL, fontSize: 11, fontWeight: '600' },
  messageList:       { flex: 1 },
  messageListContent:{ paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  systemMsgRow:      { alignItems: 'center', marginVertical: 6 },
  systemMsgText:     { fontSize: 12, color: '#9E9E9E', backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  bubbleRow:         { flexDirection: 'row', marginVertical: 2 },
  bubbleRowLeft:     { justifyContent: 'flex-start' },
  bubbleRowRight:    { justifyContent: 'flex-end' },
  bubble:            { maxWidth: '75%', borderRadius: 16, padding: 10 },
  bubbleCitizen:     { backgroundColor: TEAL, borderBottomRightRadius: 4 },
  bubbleLawyer:      { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  bubbleText:        { fontSize: 14, color: '#1A1A1A', lineHeight: 20 },
  bubbleTextLight:   { color: '#FFFFFF' },
  bubbleTime:        { fontSize: 10, color: '#9E9E9E', marginTop: 4, textAlign: 'right' },
  bubbleTimeLight:   { color: 'rgba(255,255,255,0.7)' },
  msgImage:          { width: 200, height: 150, borderRadius: 8 },
  docBubble:         { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 130 },
  docName:           { fontSize: 13, color: TEAL, fontWeight: '500' },
  emptyState:        { alignItems: 'center', paddingTop: 60 },
  emptyText:         { fontSize: 13, color: '#9E9E9E', textAlign: 'center' },
  inputSafe:         { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  inputBar:          { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  attachBtn:         { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  input:             { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 8, fontSize: 14, maxHeight: 100, color: '#1A1A1A' },
  sendBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: TEAL, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled:   { backgroundColor: '#BDBDBD' },
  // Completion
  completedContainer:{ flex: 1, backgroundColor: '#FFFFFF' },
  completedContent:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  completedTitle:    { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginTop: 16, marginBottom: 10 },
  completedSub:      { fontSize: 14, color: '#616161', textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  rateBtn:           { backgroundColor: TEAL, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginBottom: 12 },
  rateBtnText:       { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  skipBtn:           { padding: 10 },
  skipBtnText:       { color: '#9E9E9E', fontSize: 14 },
});
