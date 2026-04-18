import { addDoc, collection, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Alert } from 'react-native';
import { Timestamp } from 'firebase/firestore';

export const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();
export interface Booking {
  id: string;
  userId: string;
  
  // Partner Details
  providerId?: string;
  providerName?: string;
  providerImage?: string;
  providerRating?: number;
  
  // Partner Schema Fields
  providerFullName?: string; 
  providerPhotoURL?: string; 
  
  // Job Details
  serviceType: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DECLINED';
  price: number;
  description: string;
  location: string;
  photos?: string[];
  
  // Security
  completionPin?: string; // <--- The 4-digit Key

  // Dates & Meta
  createdAt: any; 
  completedAt?: any;
  isRated?: boolean;
  rating?: number;
  feedback?: string;
}
// 1. Function to Create a New Booking
export const createBooking = async (
  provider: any, 
  description: string, 
  photos: string[]
) => {
  const user = auth.currentUser;
  
  if (!user) {
    Alert.alert("Error", "You must be logged in to book.");
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, "bookings"), {
      userId: user.uid,
      providerId: provider.id || 'mock_provider_1',
      providerName: provider.name,
      providerImage: provider.imageUrl || 'https://i.pravatar.cc/150',
      serviceType: provider.role,
      price: provider.price,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      description: description || "No description provided",
      photos: photos || [], 
      location: "Taguig City" // Hardcoded for now (or pass dynamic location)
    });
    
    console.log("Booking created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding booking: ", error);
    throw error;
  }
};

// 2. Function to Listen to My Bookings (Real-time)
export const subscribeToMyBookings = (callback: (bookings: Booking[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  const q = query(
    collection(db, "bookings"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const bookings: Booking[] = [];
    snapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    callback(bookings);
  });

  return unsubscribe;
};

// NEW: Listen specifically for status changes
export const subscribeToBookingUpdates = (
  userId: string, 
  onAccepted: (booking: Booking) => void
) => {
  const q = query(
    collection(db, "bookings"),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      // We only care if a booking was MODIFIED (changed status)
      if (change.type === "modified") {
        const booking = change.doc.data() as Booking;
        
        // If the new status is ACCEPTED, trigger the alert
        if (booking.status === "ACCEPTED") {
          onAccepted(booking);
        }
      }
    });
  });
};