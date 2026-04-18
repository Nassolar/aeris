import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc, Timestamp, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  body: string;
  type: 'promo' | 'booking' | 'system' | 'info';
  targetGroup: 'client' | 'partner' | 'responders' | 'all'; // <--- ADD THIS for clarity
  read: boolean;
  createdAt: Timestamp;
  data?: any; // For linking (e.g., { bookingId: '123' })
}

/**
 * Subscribe to notifications for the current user
 */
export const subscribeToNotifications = (
  userId: string, 
  callback: (notifs: Notification[]) => void
) => {
  // Matches the index in your screenshot: recipientId ASC, createdAt DESC
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Notification));
    callback(list);
  }, (error) => {
    console.error("Notification Error:", error);
  });
};

/**
 * Mark a single notification as read
 */
export const markNotificationRead = async (id: string) => {
  try {
    const ref = doc(db, 'notifications', id);
    await updateDoc(ref, { read: true });
  } catch (error) {
    console.error("Error marking read:", error);
  }
};

/**
 * (Dev Tool) Helper to send a test notification
 */
export const sendTestNotification = async (userId: string) => {
  await addDoc(collection(db, 'notifications'), {
    recipientId: userId,
    title: "Welcome to AERIS!",
    body: "Thanks for joining. Click here to claim your 10% discount on your first booking.",
    type: 'promo',
    read: false,
    createdAt: serverTimestamp(),
    // ADD THIS DATA FIELD FOR LINKS
    data: {
      url: 'https://www.google.com' // Replace with your real promo link later
    }
  });
};