import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, 
  ActivityIndicator, Alert, Linking, Platform, StatusBar 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { createChat } from '../../services/chatService';
import { generatePin } from '../../services/bookingService'; 
import { RateProviderModal } from '../../components/RateProviderModal';
import { PinRevealModal } from '../../components/PinRevealModal';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Modals
  const [showRateModal, setShowRateModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  // 1. Fetch Real-time Booking Data
  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, 'bookings', id as string);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Auto-Generate PIN if missing (for legacy data)
        // We do this even for Active/Pending jobs to ensure a PIN always exists
        if (!data.completionPin && data.status !== 'COMPLETED' && data.status !== 'CANCELLED') {
          const newPin = generatePin();
          await updateDoc(docRef, { completionPin: newPin });
        } else {
          setBooking({ id: docSnap.id, ...data });

          // --- PRODUCTION LOGIC: REACT TO PARTNER COMPLETION ---
          if (data.status === 'COMPLETED') {
            setShowPinModal(false); // Close PIN Modal automatically
            if (!data.isRated && !showRateModal) {
               setTimeout(() => setShowRateModal(true), 500); // Open Rating
            }
          }
        }
      } else {
        Alert.alert("Error", "Booking not found");
        router.back();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  // 2. Action Handlers
  const handleCall = () => Linking.openURL(`tel:09171234567`);

  const handleMessage = async () => {
    if (!booking.providerId) return;
    setProcessing(true);
    try {
      const chatId = await createChat(
        auth.currentUser!.uid,
        { 
          id: booking.providerId, 
          name: booking.providerFullName || booking.providerName || "Partner", 
          role: booking.serviceType,
          rating: booking.providerRating || 5.0,
          image: booking.providerPhotoURL || booking.providerImage
        },
        booking.id 
      );
      setProcessing(false);
      router.push({
        pathname: '/chat/[chatId]',
        params: { 
          chatId: chatId,
          otherUserName: booking.providerFullName || booking.providerName,
          otherUserRole: booking.serviceType,
          otherUserRating: (booking.providerRating || 5.0).toString()
        }
      });
    } catch (error) {
      setProcessing(false);
      Alert.alert("Error", "Could not open chat");
    }
  };

  const handleClientMarkComplete = () => {
    Alert.alert(
      "Confirm Completion",
      "Are you satisfied with the service? This will show the PIN to release payment.",
      [
        { text: "Not yet", style: "cancel" },
        { 
          text: "Yes, Show PIN", 
          onPress: async () => {
            // 1. Show PIN locally
            setShowPinModal(true);
            
            // 2. Signal Partner App
            try {
              await updateDoc(doc(db, 'bookings', booking.id), {
                clientReady: true 
              });
            } catch (err) {
              console.log("Error sending ready signal", err);
            }
          } 
        }
      ]
    );
  };

  const handleCancelJob = async () => {
    Alert.alert(
      "Cancel Job",
      "Are you sure? This cannot be undone.",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              await updateDoc(doc(db, 'bookings', booking.id), {
                status: 'CANCELLED',
                cancelledAt: serverTimestamp(),
                cancelledBy: 'client'
              });
              setProcessing(false);
              router.back(); 
            } catch (err) {
              setProcessing(false);
              Alert.alert("Error", "Failed to cancel job.");
            }
          }
        }
      ]
    );
  };

  const handleRatingSubmit = () => {
    setShowRateModal(false); 
    Alert.alert("Thank you!", "Your feedback helps us improve.", [
      { text: "OK", onPress: () => {
          router.replace('/(tabs)/bookings'); 
      }}
    ]);
  };

  const openMaps = () => {
    const label = encodeURIComponent(booking.location || "Job Location");
    const url = Platform.select({ ios: `maps:0,0?q=${label}`, android: `geo:0,0?q=${label}` });
    if (url) Linking.openURL(url);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
  if (!booking) return null;

  // --- LOGIC FLAGS ---
  const isJobActive = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(booking.status);
  const isAcceptedOrProgress = ['ACCEPTED', 'IN_PROGRESS'].includes(booking.status);
  const isCompleted = booking.status === 'COMPLETED';
  const isCancellable = ['PENDING', 'ACCEPTED'].includes(booking.status);
  
  // Data Display
  const displayName = booking.providerFullName || booking.providerName || "Waiting for Partner...";
  const displayRole = booking.serviceType || "Service";
  const displayImage = booking.providerPhotoURL || booking.providerImage || 'https://i.pravatar.cc/150';
  const displayRating = booking.providerRating || 5.0;
  const pin = booking.completionPin || "----";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Job Details</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* 1. Partner Details */}
          <View style={styles.profileSection}>
            <Image source={{ uri: displayImage }} style={styles.avatar} />
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.role}>{displayRole}</Text>
            
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F5A623" />
              <Text style={styles.ratingText}>{displayRating} (142 reviews)</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionBtn, !isAcceptedOrProgress && styles.disabledBtn]} 
                onPress={handleCall} disabled={!isAcceptedOrProgress}
              >
                <Ionicons name="call-outline" size={20} color={isAcceptedOrProgress ? "#007AFF" : "#CCC"} />
                <Text style={[styles.actionBtnText, !isAcceptedOrProgress && styles.disabledText]}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, !isAcceptedOrProgress && styles.disabledBtn]} 
                onPress={handleMessage} disabled={!isAcceptedOrProgress || processing}
              >
                {processing ? <ActivityIndicator size="small" color="#007AFF" /> : (
                  <>
                    <Ionicons name="chatbubble-outline" size={20} color={isAcceptedOrProgress ? "#007AFF" : "#CCC"} />
                    <Text style={[styles.actionBtnText, !isAcceptedOrProgress && styles.disabledText]}>Message</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. SECURITY PIN (Always Visible as a Record) */}
          {/* REMOVED isJobActive check so it appears in History too */}
          <View style={styles.securitySection}>
             <View style={styles.securityHeader}>
               <Ionicons name="shield-checkmark" size={20} color="#000" />
               <Text style={styles.securityTitle}>Security Code</Text>
             </View>
             <View style={styles.pinBox}>
               <Text style={styles.pinText}>PIN: {pin}</Text>
               <Text style={styles.pinSub}>Provide this to partner only when satisfied.</Text>
             </View>
          </View>

          {/* 3. Description & Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.infoBox}>
              <Text style={styles.bodyText}>{booking.description || "No description provided."}</Text>
            </View>
            
            {booking.photos && booking.photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                {booking.photos.map((photo: string, index: number) => (
                  <Image key={index} source={{ uri: photo }} style={styles.jobPhoto} />
                ))}
              </ScrollView>
            )}
          </View>

          {/* 4. Location (PRIVACY: Hidden if Job is Completed/Declined) */}
          {isJobActive && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.locationBox}>
                 <Ionicons name="location-outline" size={20} color="#007AFF" style={{marginRight: 8}}/>
                 <Text style={styles.locationText} numberOfLines={2}>{booking.location || "Address not specified"}</Text>
              </View>
              <TouchableOpacity style={styles.mapBtn} onPress={openMaps}>
                <Ionicons name="paper-plane-outline" size={16} color="#007AFF" />
                <Text style={styles.mapBtnText}>Open in Maps</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* 5. Booking Info */}
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Rate</Text>
              <Text style={styles.valueBold}>₱{booking.price}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Requested</Text>
              <Text style={styles.value}>{booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleString() : 'Just now'}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Status</Text>
              <Text style={[styles.value, { color: getStatusColor(booking.status), fontWeight: '700' }]}>{booking.status}</Text>
            </View>
          </View>

        </ScrollView>

        {/* --- FOOTER BUTTONS --- */}
        {isJobActive && (
          <View style={styles.footerRow}>
            {isCancellable && (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelJob}>
                <Text style={styles.cancelBtnText}>CANCEL JOB</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleClientMarkComplete}>
              <Text style={styles.primaryBtnText}>JOB COMPLETE</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCompleted && !booking.isRated && (
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowRateModal(true)}>
              <Text style={styles.primaryBtnText}>RATE PARTNER</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {isCompleted && booking.isRated && (
           <View style={styles.footerRow}>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.completedText}>You rated this job.</Text>
            </View>
          </View>
        )}

        {/* Modals */}
        <RateProviderModal 
          visible={showRateModal} 
          booking={booking}
          onClose={() => setShowRateModal(false)}
          onSubmit={handleRatingSubmit}
        />
        <PinRevealModal 
          visible={showPinModal}
          pin={pin}
          onClose={() => setShowPinModal(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch(status) {
    case 'PENDING': return '#FF9500';
    case 'ACCEPTED': return '#34C759';
    case 'IN_PROGRESS': return '#007AFF';
    case 'COMPLETED': return '#007AFF';
    case 'CANCELLED': return '#FF3B30';
    default: return '#999';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 8 },
  navTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingBottom: 120 },
  
  profileSection: { backgroundColor: '#FFF', padding: 20, alignItems: 'center', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, backgroundColor: '#EEE' },
  name: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  role: { fontSize: 14, color: '#666', marginBottom: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ratingText: { fontSize: 14, fontWeight: '600', color: '#F5A623', marginLeft: 4 },

  actionRow: { flexDirection: 'row', width: '100%', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFF' },
  disabledBtn: { backgroundColor: '#F9F9F9', borderColor: '#EEE' },
  actionBtnText: { marginLeft: 8, fontWeight: '600', color: '#007AFF', fontSize: 15 },
  disabledText: { color: '#CCC' },

  // Updated Security Section (No Conditional Rendering)
  securitySection: { backgroundColor: '#E8F5E9', margin: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#C8E6C9' },
  securityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  securityTitle: { fontWeight: '700', fontSize: 16, marginLeft: 8 },
  pinBox: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  pinText: { fontSize: 24, fontWeight: '800', letterSpacing: 4 },
  pinSub: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },

  section: { backgroundColor: '#FFF', padding: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#000' },
  infoBox: { backgroundColor: '#F5F7FA', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  bodyText: { fontSize: 14, color: '#444', lineHeight: 22 },
  photoRow: { flexDirection: 'row' },
  jobPhoto: { width: 120, height: 120, borderRadius: 8, marginRight: 10, backgroundColor: '#EEE' },
  locationBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#F9F9F9', padding: 12, borderRadius: 8 },
  locationText: { flex: 1, fontSize: 14, color: '#333' },
  mapBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#007AFF' },
  mapBtnText: { color: '#007AFF', fontWeight: '700', marginLeft: 8 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#888', fontSize: 14 },
  value: { fontSize: 14, color: '#333' },
  valueBold: { fontSize: 16, fontWeight: '700', color: '#000' },

  footerRow: { flexDirection: 'row', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#F5F5F5', paddingVertical: 16, alignItems: 'center', borderRadius: 12 },
  cancelBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  primaryBtn: { flex: 1, backgroundColor: '#000', paddingVertical: 16, alignItems: 'center', borderRadius: 12 },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  completedText: { color: '#34C759', fontWeight: '600', fontSize: 15 }
});