import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebaseConfig';

export interface Message {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  image?: string;
  video?: string;
  read?: boolean;
}

// 1. Define a specific type for the user details to prevent errors
export interface ChatUserDetail {
  // New Partner Schema
  fullName?: string;
  photoURL?: string;
  serviceType?: string;
  rating?: number;
  phoneNumber?: string;
  email?: string;
  
  // Common Fields
  role?: string;
  
  // Legacy Fields (kept to prevent errors with old data)
  name?: string;
  image?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: { [userId: string]: number };
  bookingId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  otherUserRole?: string;
  otherUserRating?: number;
  
  // 2. Use the specific type here
  userDetails?: {
    [uid: string]: ChatUserDetail;
  };
}

/**
 * Create a chat linked strictly to a Booking ID
 */
export const createChat = async (
  currentUserId: string,
  otherUser: { id: string; name: string; image?: string; role?: string; rating?: number },
  bookingId: string
): Promise<string> => {
  try {
    const chatRef = doc(db, "chats", bookingId);
    const chatSnap = await getDoc(chatRef);

    // 1. DETERMINE IF THIS IS A RESPONDER OR A SERVICE PARTNER
    // If the role involves 'medical', 'police', 'fire', or explicitly 'responder'
    const isResponder = ['responder', 'police', 'medical', 'fire', 'emergency'].some(r => 
      otherUser.role?.toLowerCase().includes(r)
    );

    // 2. PREPARE DYNAMIC DATA
    const providerSchemaData: ChatUserDetail = {
      fullName: otherUser.name || (isResponder ? "Emergency Responder" : "Service Partner"),
      photoURL: otherUser.image || 'https://i.pravatar.cc/150',
      // If it's a responder, use their specific role (e.g. "Medical Unit"), otherwise default to "Service Partner"
      serviceType: isResponder ? (otherUser.role?.toUpperCase() || "EMERGENCY") : (otherUser.role || "Service Partner"),
      // Only show rating for service partners
      rating: isResponder ? undefined : (otherUser.rating || 5.0),
      role: isResponder ? "responder" : "provider",
      
      // Legacy fields
      name: otherUser.name,
      image: otherUser.image || 'https://i.pravatar.cc/150'
    };

    const clientSchemaData: ChatUserDetail = {
      fullName: "Client",
      photoURL: "https://i.pravatar.cc/150?u=client",
      role: "client",
      name: "Client",
      image: "https://i.pravatar.cc/150?u=client"
    };

    if (!chatSnap.exists()) {
      const setPayload: Record<string, unknown> = {
        id: bookingId,
        bookingId: bookingId,
        participants: [currentUserId, otherUser.id],
        
        // FLAT FIELDS (Updated to use the dynamic variables)
        otherUserName: providerSchemaData.fullName,
        otherUserAvatar: providerSchemaData.photoURL,
        otherUserRole: providerSchemaData.serviceType,

        userDetails: {
          [currentUserId]: clientSchemaData,
          [otherUser.id]: providerSchemaData
        },
        
        unreadCount: { [currentUserId]: 0, [otherUser.id]: 0 },
        createdAt: serverTimestamp(),
        lastMessage: {
          text: isResponder ? "Emergency Channel Open" : "Chat started",
          createdAt: serverTimestamp(),
          user: { _id: "system", name: "System" }
        }
      };
      if (providerSchemaData.rating !== undefined) {
        setPayload.otherUserRating = providerSchemaData.rating;
      }
      await setDoc(chatRef, setPayload);
    } else {
      // Update existing chat with new schema details (omit otherUserRating if undefined — Firestore rejects undefined)
      const updatePayload: Record<string, unknown> = {
        otherUserName: providerSchemaData.fullName,
        otherUserAvatar: providerSchemaData.photoURL,
        otherUserRole: providerSchemaData.serviceType,
        [`userDetails.${otherUser.id}`]: providerSchemaData
      };
      if (providerSchemaData.rating !== undefined) {
        updatePayload.otherUserRating = providerSchemaData.rating;
      }
      await updateDoc(chatRef, updatePayload);
    }

    return bookingId;
  } catch (error) {
    console.error('❌ Error creating/updating chat:', error);
    throw error;
  }
};

/**
 * Send a text message
 */
export const sendMessage = async (
  chatId: string,
  text: string,
  senderType: 'user' | 'provider'
): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const messagesRef = collection(db, 'chats', chatId, 'messages');

    await addDoc(messagesRef, {
      text,
      createdAt: serverTimestamp(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.phoneNumber || 'Anonymous',
      senderType,
      read: false,
    });

    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
    });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
};

/**
 * Upload image and send as message
 */
export const sendImageMessage = async (
  chatId: string,
  imageUri: string,
  senderType: 'user' | 'provider'
): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const response = await fetch(imageUri);
    const blob = await response.blob();

    const filename = `chat-images/${chatId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    const messagesRef = collection(db, 'chats', chatId, 'messages');

    await addDoc(messagesRef, {
      text: '',
      image: downloadURL,
      createdAt: serverTimestamp(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.phoneNumber || 'Anonymous',
      senderType,
      read: false,
    });

    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: '📷 Image',
      lastMessageTime: serverTimestamp(),
    });
  } catch (error) {
    console.error('❌ Error sending image:', error);
    throw error;
  }
};

/**
 * Subscribe to messages in real-time
 */
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      messages.push({
        _id: docSnap.id,
        text: data.text || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        user: {
          _id: data.senderId,
          name: data.senderName,
        },
        image: data.image,
        video: data.video,
        read: data.read,
      });
    });

    callback(messages);
  });

  return unsubscribe;
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  chatId: string,
  userId: string
): Promise<void> => {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    // Firestore does not support != compound queries — filter sender client-side
    const q = query(messagesRef, where('read', '==', false));

    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs
      .filter((docSnap) => docSnap.data().senderId !== userId)
      .map((docSnap) => updateDoc(docSnap.ref, { read: true }));

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
  }
};