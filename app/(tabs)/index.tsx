import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Modal, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, SafeAreaView,
  Dimensions, Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import {
  SearchIcon, WrenchIcon, SparklesIcon, TruckIcon, PaintbrushIcon,
  ScissorsIcon, PawIcon, MonitorIcon, BriefcaseIcon
} from '../../components/icons/WireframeIcons';

import LocationHeader from '../../components/dashboard/LocationHeader';
import LiveTicker from '../../components/dashboard/LiveTicker';
import TopTabSwitcher from '../../components/dashboard/TopTabSwitcher';
import SOSBar from '../../components/dashboard/SOSBar';
import { PartnerOnboardingModal } from '../../components/PartnerOnboardingModal';

import { ServiceProvider } from '../../types';
import { createBooking } from '../../services/bookingService';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../services/imageService';
import firestore from '@react-native-firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons'; // Keeping Ionicons for standard small UI icons like stars where filled might still be needed or fallback.

const { height } = Dimensions.get('window');

const SERVICES_GRID = [
  { id: 'repair', name: 'Repair', Icon: WrenchIcon },
  { id: 'cleaning', name: 'Cleaning', Icon: SparklesIcon },
  { id: 'moving', name: 'Moving', Icon: TruckIcon },
  { id: 'painting', name: 'Painting', Icon: PaintbrushIcon },
  { id: 'beauty', name: 'Beauty', Icon: ScissorsIcon },
  { id: 'petCare', name: 'Pet Care', Icon: PawIcon },
  { id: 'tech', name: 'Tech', Icon: MonitorIcon },
  { id: 'professional', name: 'Professional', Icon: BriefcaseIcon },
];

export default function ServicesScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Modal & Booking State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobPhotos, setJobPhotos] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);

  // --- FETCH REAL PARTNERS ---
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('providers')
      .where('role', 'in', ['responder', 'agency_admin', 'team_leader'])
      .where('isOnline', '==', true)
      .onSnapshot(
        (snapshot) => {
          if (snapshot) {
            setProviders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        },
        (error) => {
          console.warn('Providers listener error:', error.message);
        }
      );
    return () => unsubscribe();
  }, []);

  // --- FETCH REAL NOTIFICATIONS ---
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = firestore()
      .collection('notifications')
      .where('recipientId', '==', auth.currentUser.uid)
      .where('read', '==', false)
      .onSnapshot((snap) => setNotificationCount(snap.size));
    return () => unsubscribe();
  }, []);

  const handleTabChange = (tab: 'emergency' | 'services') => {
    if (tab === 'emergency') {
      router.push('/(tabs)/emergency');
    }
  };

  const handleBookPress = (provider: any) => {
    setSelectedProvider(provider);
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setJobPhotos([...jobPhotos, result.assets[0].uri]);
  };

  const submitBooking = async () => {
    if (!selectedProvider) return;
    setIsBooking(true);
    try {
      const uploadedPhotoUrls: string[] = [];
      for (const localUri of jobPhotos) {
        const url = await uploadImage(localUri, 'job-photos');
        uploadedPhotoUrls.push(url);
      }

      const providerData: ServiceProvider = {
        id: selectedProvider.id,
        name: selectedProvider.displayName || selectedProvider.name || 'Provider',
        role: selectedProvider.serviceType || 'General',
        rating: selectedProvider.rating || 5.0,
        distance: 2.5,
        price: selectedProvider.price || 0,
        imageUrl: selectedProvider.photoURL || 'https://i.pravatar.cc/150',
        isOnline: true,
        latitude: 0, longitude: 0
      };

      await createBooking(providerData, jobDescription, uploadedPhotoUrls);
      setModalVisible(false);
      setJobDescription('');
      setJobPhotos([]);
      Alert.alert("Success", `Request sent to ${providerData.name}!`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to send request.");
    } finally {
      setIsBooking(false);
    }
  };

  const removePhoto = (index: number) => setJobPhotos(jobPhotos.filter((_, i) => i !== index));

  return (
    <SafeAreaView style={styles.safeArea}>
      <LocationHeader
        notificationCount={notificationCount}
        onNotificationPress={() => router.push('/(tabs)/inbox')}
      />
      <LiveTicker messages={['7 EMS UNITS DEPLOYED', 'AVG RESPONSE: 4.2 MIN', '12 PNP UNITS ACTIVE']} />
      <TopTabSwitcher activeTab="services" onTabChange={handleTabChange} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={theme.colors.textLight} strokeWidth={2.5} />
          <TextInput
            style={styles.searchInput}
            placeholder="What help do you need today?"
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Services Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Services</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          {SERVICES_GRID.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/services/[category]', params: { category: item.id } })}
            >
              <View style={styles.gridIconWrap}>
                <item.Icon size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.gridLabel}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Near You Providers List */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Near You</Text>
          <View style={styles.distanceBadge}>
            <Ionicons name="location-outline" size={12} color={theme.colors.uberGreen} />
            <Text style={styles.distanceText}>Within 5 km</Text>
          </View>
        </View>

        {providers.length > 0 ? (
          providers.map((provider) => (
            <View key={provider.id} style={styles.providerCard}>
              <View style={[styles.avatarBox, { backgroundColor: getInitialsColor(provider.displayName || 'Unknown') }]}>
                <Text style={styles.avatarText}>{getInitials(provider.displayName || 'U')}</Text>
              </View>
              <View style={styles.providerInfo}>
                <View style={styles.providerNameRow}>
                  <Text style={styles.providerName}>{provider.displayName || 'Unknown'}</Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>VERIFIED</Text>
                  </View>
                </View>
                <Text style={styles.providerDetails}>
                  {provider.serviceType || 'Pro'} • {provider.distance || '1.2'} km • {provider.jobsCompleted || 201} jobs
                </Text>
              </View>
              <View style={styles.providerAction}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F5A623" />
                  <Text style={styles.ratingText}>{provider.rating?.toFixed(1) || '4.9'}</Text>
                </View>
                <TouchableOpacity style={styles.bookBtn} onPress={() => handleBookPress(provider)} activeOpacity={0.8}>
                  <Text style={styles.bookBtnText}>Book</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No online partners found nearby.</Text>
          </View>
        )}

        {/* Partner CTA */}
        <TouchableOpacity style={styles.partnerCta} onPress={() => setPartnerModalVisible(true)} activeOpacity={0.9}>
          <View style={{ flex: 1 }}>
            <Text style={styles.partnerTitle}>Become an AERIS Partner</Text>
            <Text style={styles.partnerDesc}>Skilled professional? Help your neighbors.</Text>
          </View>
          <View style={styles.joinBtn}>
            <Text style={styles.joinText}>Join →</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.sosWrapper}>
        <SOSBar />
      </View>

      {/* BOOKING MODAL */}
      <Modal visible={modalVisible} transparent={true} onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.dismissArea} onPress={closeModal} activeOpacity={1} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request {selectedProvider?.serviceType}</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <Text style={styles.label}>TASK DESCRIPTION</Text>
                <TextInput style={styles.textArea} placeholder="Describe the issue..." multiline numberOfLines={4} value={jobDescription} onChangeText={setJobDescription} />
              </View>
              <View style={styles.section}>
                <Text style={styles.label}>PHOTOS</Text>
                <ScrollView horizontal style={styles.photoList} showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}><Ionicons name="camera" size={24} color="#666" /></TouchableOpacity>
                  {jobPhotos.map((uri, i) => (
                    <View key={i} style={styles.photoContainer}>
                      <Image source={{ uri }} style={styles.photoThumb} />
                      <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(i)}><Ionicons name="close-circle" size={20} color={theme.colors.error} /></TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={{ height: 60 }} />
            </ScrollView>
            <TouchableOpacity style={[styles.confirmButton, isBooking && styles.disabledBtn]} onPress={submitBooking} disabled={isBooking}>
              {isBooking ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmText}>Confirm Request</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <PartnerOnboardingModal
        visible={partnerModalVisible}
        onClose={() => setPartnerModalVisible(false)}
        onBecomePartner={() => setPartnerModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// Helpers
function getInitials(name: string) {
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
function getInitialsColor(name: string) {
  const colors = ['#1A56DB', '#06C167', '#C81919', '#B45309', '#9B59B6'];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  scrollContent: { padding: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.colors.primary,
    fontFamily: 'Barlow',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.uberGreen,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginLeft: 4,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '23%',
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  gridIconWrap: {
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  providerInfo: { flex: 1 },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary,
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(6, 193, 103, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.uberGreen,
    letterSpacing: 0.5,
  },
  providerDetails: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  providerAction: {
    alignItems: 'flex-end',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
    marginLeft: 4,
  },
  bookBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookBtnText: {
    color: theme.colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  partnerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    marginBottom: 30,
  },
  partnerTitle: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  partnerDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  joinBtn: {
    backgroundColor: theme.colors.uberGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  joinText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: theme.colors.textLight, fontSize: 14 },
  sosWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },

  // Modal reused styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  section: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 8 },
  textArea: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 16, fontSize: 16, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E8E8E8' },
  photoList: { flexDirection: 'row' },
  addPhotoBtn: { width: 80, height: 80, backgroundColor: '#F5F5F5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#CCC', borderStyle: 'dashed' },
  photoContainer: { marginRight: 12 },
  photoThumb: { width: 80, height: 80, borderRadius: 12 },
  removePhotoBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FFF', borderRadius: 12 },
  confirmButton: { backgroundColor: theme.colors.primary, padding: 18, borderRadius: 12, alignItems: 'center', position: 'absolute', bottom: 30, left: 20, right: 20 },
  disabledBtn: { opacity: 0.7 },
  confirmText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});