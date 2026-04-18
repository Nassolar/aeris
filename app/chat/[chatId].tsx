import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView,
  Platform, StyleSheet, ActivityIndicator, Alert, Modal, StatusBar
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';
import firestore from '@react-native-firebase/firestore';

// Services & Config
import { auth, db } from '../../firebaseConfig';
import { subscribeToMessages, sendMessage, sendImageMessage, markMessagesAsRead, Message } from '../../services/chatService';
import { RateProviderModal } from '../../components/RateProviderModal';

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    chatId?: string;
    otherUserName?: string;
    otherUserRole?: string;
    otherUserRating?: string
  }>();

  const navigation = useNavigation();
  const chatId = params.chatId as string;
  const otherUserName = params.otherUserName || 'Partner';
  const otherUserRole = params.otherUserRole || 'Service Partner';
  const otherUserRating = params.otherUserRating || '5.0';

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Status State
  const [bookingStatus, setBookingStatus] = useState<string>('PENDING');
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const currentUser = auth.currentUser;

  // --- 1. LISTEN TO BOOKING ---
  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = firestore().collection("bookings").doc(chatId).onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data() as any;
        setBookingData({ id: docSnap.id, ...data });
        setBookingStatus(data.status);

        if (data.status === 'COMPLETED' && data.completedAt) {
          const completedDate = data.completedAt.toDate();
          setCompletedAt(completedDate);

          const now = new Date();
          const hoursDiff = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);

          // 3-Hour Chat Window
          if (hoursDiff > 3) {
            setIsExpired(true);
          } else {
            setIsExpired(false);
          }

          // Trigger Rating Modal
          if (!data.isRated && hoursDiff < 3) {
            setTimeout(() => setShowRateModal(true), 1500);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [chatId]);

  // --- 2. LISTEN TO MESSAGES ---
  useEffect(() => {
    if (!chatId || !currentUser) return;
    const unsubscribe = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
      markMessagesAsRead(chatId, currentUser.uid);
    });
    return () => unsubscribe();
  }, [chatId, currentUser]);

  // --- 3. HEADER (Dynamic Phone Icon) ---
  const handleCall = () => {
    Linking.openURL(`tel:09171234567`); // Replace with real phone field
  };

  useEffect(() => {
    // Only allow calling if Accepted or In Progress
    const isCallEnabled = ['ACCEPTED', 'IN_PROGRESS'].includes(bookingStatus);

    navigation.setOptions({
      headerTitleAlign: 'left',
      headerTitle: () => (
        <View style={{ alignItems: 'flex-start', marginLeft: -10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#000', marginRight: 6 }}>
              {otherUserName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF2CC', paddingHorizontal: 4, borderRadius: 4 }}>
              <Ionicons name="star" size={10} color="#F5A623" />
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#F5A623', marginLeft: 2 }}>
                {otherUserRating}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: '#666', fontWeight: '500' }}>
            {otherUserRole}
          </Text>
        </View>
      ),
      headerBackTitleVisible: false,
      headerTintColor: '#000',
      headerRight: () => (
        <TouchableOpacity
          onPress={isCallEnabled ? handleCall : undefined}
          disabled={!isCallEnabled}
          style={{
            backgroundColor: isCallEnabled ? '#F5F5F5' : '#FAFAFA',
            padding: 8,
            borderRadius: 20,
            marginRight: 8,
            opacity: isCallEnabled ? 1 : 0.2 // Gray out if disabled
          }}
        >
          <Ionicons name="call" size={20} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [otherUserName, otherUserRole, otherUserRating, navigation, bookingStatus]); // Re-run when status changes

  // --- HANDLERS ---
  const handleSend = async () => {
    if (!inputText.trim() || !chatId) return;
    const text = inputText.trim();
    setInputText('');
    try { await sendMessage(chatId, text, 'user'); } catch (error) { Alert.alert('Error', 'Failed to send.'); }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0].uri && chatId) {
      setIsUploading(true);
      await sendImageMessage(chatId, result.assets[0].uri, 'user');
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0].uri && chatId) {
      setIsUploading(true);
      await sendImageMessage(chatId, result.assets[0].uri, 'user');
      setIsUploading(false);
    }
  };

  const getExpirationTime = () => {
    if (!completedAt) return '';
    const expireTime = new Date(completedAt.getTime() + (3 * 60 * 60 * 1000));
    return expireTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.user._id === currentUser?.uid;
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {!isMyMessage && <Text style={styles.senderName}>{item.user.name}</Text>}
        {item.image ? (
          <TouchableOpacity activeOpacity={0.9} onPress={() => setViewingImage(item.image!)}>
            <Image source={{ uri: item.image }} style={styles.messageImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
            {item.text}
          </Text>
        )}
        <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.theirTimestamp]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (isLoading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#000" />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
    >

      {/* 1. TOP BANNERS */}
      {bookingStatus === 'IN_PROGRESS' && (
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerText}>👋 Please be at the location soon to avoid delays.</Text>
        </View>
      )}

      {/* 2. MESSAGES LIST */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        inverted
        contentContainerStyle={styles.messagesList}
      />

      {/* 3. BOTTOM AREA */}
      {!isExpired ? (
        <View style={{ backgroundColor: '#FFF' }}>

          {bookingStatus === 'COMPLETED' && (
            <View style={styles.bannerYellow}>
              <Text style={styles.bannerText}>
                This chat remains open for this job until {getExpirationTime()}.
                Partners may be busy with their next client.
              </Text>
            </View>
          )}

          <View style={[styles.inputContainer, { paddingBottom: Math.max(12, insets.bottom) }]}>
            <TouchableOpacity onPress={handleImagePick} style={styles.iconButton} disabled={isUploading}>
              <Ionicons name="images-outline" size={26} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTakePhoto} style={styles.iconButton} disabled={isUploading}>
              <Ionicons name="camera-outline" size={26} color="#666" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              multiline
            />
            <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()} style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.expiredFooter, { paddingBottom: Math.max(30, insets.bottom) }]}>
          <Ionicons name="lock-closed" size={20} color="#666" />
          <Text style={styles.expiredText}>This chat is now disabled. Thank you for choosing AERIS.</Text>
        </View>
      )}

      {/* 5. MODALS */}
      <Modal visible={!!viewingImage} transparent={true} animationType="fade" onRequestClose={() => setViewingImage(null)}>
        <View style={styles.fullScreenContainer}>
          <StatusBar hidden />
          <TouchableOpacity style={styles.closeButton} onPress={() => setViewingImage(null)}>
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {viewingImage && (
            <Image source={{ uri: viewingImage }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      <RateProviderModal
        visible={showRateModal}
        booking={bookingData}
        onClose={() => setShowRateModal(false)}
        onSubmit={() => {
          setShowRateModal(false);
          Alert.alert("Thank you!", "Your feedback helps us improve.");
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  messagesList: { padding: 16 },

  messageContainer: { maxWidth: '75%', marginBottom: 12, padding: 12, borderRadius: 16 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#000', borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#f0f0f0', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 12, color: '#666', marginBottom: 4 },
  messageText: { fontSize: 16, lineHeight: 22 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#000' },
  messageImage: { width: 200, height: 200, borderRadius: 8, backgroundColor: '#EEE' },
  timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  myTimestamp: { color: 'rgba(255,255,255,0.7)' },
  theirTimestamp: { color: '#999' },

  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0', backgroundColor: '#fff' },
  iconButton: { padding: 8, marginRight: 4 },
  input: { flex: 1, minHeight: 40, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f5f5f5', borderRadius: 20, fontSize: 16, marginHorizontal: 8 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#e0e0e0' },

  fullScreenContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  fullScreenImage: { width: '100%', height: '100%' },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },

  bannerContainer: { backgroundColor: '#E8F5E9', padding: 12, margin: 12, marginBottom: 0, borderRadius: 8, borderWidth: 1, borderColor: '#C8E6C9' },
  bannerYellow: { backgroundColor: '#FFF9C4', padding: 12, marginHorizontal: 12, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FFF59D' },
  bannerText: { fontSize: 12, color: '#333', lineHeight: 16, textAlign: 'center' },

  expiredFooter: { padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#EEE' },
  expiredText: { color: '#888', fontWeight: '600' }
});