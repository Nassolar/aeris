import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { createChat } from '../../services/chatService';

const theme = {
  bg: '#0B1121',
  card: '#151e32',
  text: '#fff',
  subText: '#94a3b8',
  accent: '#EF4444', 
  button: '#3B82F6',
};

export default function EmergencyDetailScreen() {
  // Use 'id' to match the filename [id].tsx
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingChat, setProcessingChat] = useState(false); // New state for button loading

  useEffect(() => {
    if (!id) return;

    // Listen to real-time updates for this specific report
    const unsub = onSnapshot(doc(db, "reports", id as string), (doc) => {
      if (doc.exists()) {
        setReport({ id: doc.id, ...doc.data() });
      } else {
        Alert.alert("Error", "Report not found");
        router.back();
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  const handleMessage = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to chat.");
        return;
      }

      setProcessingChat(true);

      // 1. INITIALIZE CHAT ROOM
      // We explicitly create/ensure the chat document exists with the correct Responder Name
      await createChat(
        currentUser.uid,
        {
          id: "responder_system",       // Placeholder ID for the responder entity
          name: "Emergency Responder",  // Fixes the "Partner" name issue
          role: "responder",            // Ensures no rating stars are shown
          image: "https://cdn-icons-png.flaticon.com/512/1032/1032989.png" // Shield Icon
        },
        report.id // The Chat ID matches the Report ID
      );

      setProcessingChat(false);

      // 2. NAVIGATE
      router.push({ pathname: '/chat/[chatId]', params: { chatId: report.id } });

    } catch (error) {
      setProcessingChat(false);
      console.error("Chat Init Error:", error);
      Alert.alert("Error", "Could not open chat channel.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Details</Text>
        <View style={{width: 24}} /> 
      </View>

      <ScrollView contentContainerStyle={{padding: 20}}>
        
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <View style={[styles.badge, { backgroundColor: report.status === 'resolved' ? '#10B981' : theme.accent }]}>
              <Text style={styles.badgeText}>{report.status?.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.timeText}>
             Reported: {report.timestamp?.seconds ? new Date(report.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
          </Text>
        </View>

        {/* Message Responder Button (Only if active) */}
        {report.status !== 'pending' && report.status !== 'resolved' && (
          <TouchableOpacity 
            style={[styles.msgButton, processingChat && { opacity: 0.7 }]} 
            onPress={handleMessage}
            disabled={processingChat}
          >
            {processingChat ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <>
                    <Ionicons name="chatbubble-ellipses" size={20} color="#fff" style={{marginRight: 8}} />
                    <Text style={styles.msgButtonText}>Message Responder</Text>
                </>
            )}
          </TouchableOpacity>
        )}

        {/* Description Section */}
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.card}>
          <Text style={styles.descriptionText}>{report.description}</Text>
          {report.additionalInfo ? <Text style={styles.subText}>{report.additionalInfo}</Text> : null}
        </View>

        {/* Photo Evidence */}
        {report.imageUrl && (
          <>
            <Text style={styles.sectionTitle}>Photo Evidence</Text>
            <Image source={{ uri: report.imageUrl }} style={styles.evidenceImage} resizeMode="cover" />
          </>
        )}

        {/* Location Map */}
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{flex: 1}}
            initialRegion={{
              latitude: report.location?.latitude || 14.5547,
              longitude: report.location?.longitude || 121.0244,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
          >
            <Marker coordinate={report.location} />
          </MapView>
        </View>
        {(report.incidentLocation?.address || report.location?.address) ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={theme.subText} />
            <Text style={styles.addressText} numberOfLines={2}>
              {report.incidentLocation?.address || report.location?.address}
            </Text>
          </View>
        ) : null}
        
        <View style={styles.idContainer}>
            <Text style={styles.idText}>REPORT ID: {report.reportId}</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: 50, 
    paddingBottom: 15, 
    paddingHorizontal: 20, 
    backgroundColor: theme.card 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  backBtn: { padding: 5 },
  
  statusCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: theme.accent
  },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusLabel: { color: theme.subText, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  timeText: { color: '#fff', fontSize: 14 },

  msgButton: {
    flexDirection: 'row',
    backgroundColor: theme.button,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  msgButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  sectionTitle: { color: theme.subText, fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  card: { backgroundColor: theme.card, padding: 15, borderRadius: 12, marginBottom: 5 },
  descriptionText: { color: '#fff', fontSize: 16, lineHeight: 24 },
  subText: { color: theme.subText, marginTop: 8 },

  evidenceImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10, backgroundColor: '#333' },
  
  mapContainer: { height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 24 },
  addressText: { flex: 1, color: theme.subText, fontSize: 13, lineHeight: 18 },
  
  idContainer: { alignItems: 'center', marginBottom: 30 },
  idText: { color: theme.subText, fontSize: 12, letterSpacing: 1 }
});