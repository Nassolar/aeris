import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { TypewriterBanner } from '../TypewriterBanner';

// Move the constant here
const SERVICE_CATEGORIES = [
  { id: '1', name: 'Repair', icon: 'hammer', color: '#FF9500' },
  { id: '2', name: 'Cleaning', icon: 'sparkles', color: '#34C759' },
  { id: '3', name: 'Moving', icon: 'car', color: '#00C7BE' },
  { id: '4', name: 'Painting', icon: 'color-palette', color: '#AF52DE' },
  { id: '5', name: 'Beauty', icon: 'cut', color: '#FF2D55' },
  { id: '6', name: 'Pet Care', icon: 'paw', color: '#FFCC00' },
  { id: '7', name: 'Tech', icon: 'laptop', color: '#007AFF' },
  { id: '8', name: 'More', icon: 'ellipsis-horizontal', color: '#007AFF' },
];

interface ServiceViewProps {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  providers: any[];
  onBookPress: (provider: any) => void;
  onPartnerBannerPress?: () => void;
}

export default function ServiceView({ searchQuery, setSearchQuery, providers, onBookPress, onPartnerBannerPress }: ServiceViewProps) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* 1. SEARCH BAR - Moved from Header to here for the "Fixed Header" look */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="What help do you need today?" 
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 2. SERVICES GRID */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Services</Text>
        <Text style={styles.seeAll}>See all</Text>
      </View>

      <View style={styles.gridContainer}>
        {SERVICE_CATEGORIES.map((service) => (
          <TouchableOpacity key={service.id} style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: service.color }]}>
              <Ionicons name={service.icon as any} size={24} color="#FFF" />
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. MAP SECTION */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Near You</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="location-sharp" size={12} color="#999" />
          <Text style={styles.distanceText}>Within 5km</Text>
        </View>
      </View>

      <View style={styles.mapCard}>
        {location ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {providers.map((provider) => provider.latitude && provider.longitude && (
              <Marker
                key={provider.id}
                coordinate={{ latitude: provider.latitude, longitude: provider.longitude }}
                title={provider.displayName || provider.name}
                description={provider.serviceType}
              />
            ))}
          </MapView>
        ) : (
          <>
            <View style={styles.pinIcon}><Ionicons name="pin" size={24} color="#D00" /></View>
            <Text style={styles.mapText}>{locationError || 'Loading map...'}</Text>
            <Text style={styles.mapSubText}>Requesting location access</Text>
          </>
        )}
        <TouchableOpacity style={styles.expandIcon}><Ionicons name="expand" size={16} color="#000" /></TouchableOpacity>
      </View>

      {/* 4. PARTNER RECRUITMENT BANNER - Always visible below map */}
      <TypewriterBanner
        messages={[
          { type: 'full', text: "Know someone who can help — or maybe that's you?" },
          { type: 'cycling', prefix: 'Help your neighbors. Are you a skilled ', words: ['Medic?', 'Mechanic?', 'Plumber?', 'Electrician?', 'Painter?'] },
          { type: 'full', text: "Earn by doing what you're good at." },
        ]}
        ctaText="Become an AERIS Partner →"
        onCtaPress={onPartnerBannerPress || (() => {})}
        typingSpeed={18}
        deletingSpeed={9}
        pauseDuration={1200}
      />

      {/* 5. PROVIDER LIST */}
      {providers.length > 0 && (
        providers.map((provider) => (
          <View key={provider.id} style={styles.partnerCard}>
            <Image source={{ uri: provider.photoURL || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.partnerName}>{provider.displayName || provider.name || 'Partner'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={12} color="#F5A623" />
                  <Text style={styles.rating}>{provider.rating ? provider.rating.toFixed(1) : '5.0'}</Text>
                </View>
              </View>
              <Text style={styles.partnerRole}>{provider.serviceType || 'Service'} • {provider.distance || '2.5'}km away</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.price}>₱{provider.price || 0}</Text>
                  <Text style={styles.perHr}>/hr</Text>
                  <View style={styles.onlineDot} />
                </View>
                <TouchableOpacity style={styles.bookBtn} onPress={() => onBookPress(provider)}>
                  <Text style={styles.bookBtnText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 100 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  searchInput: { flex: 1, color: '#000', fontSize: 14, marginLeft: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  seeAll: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  distanceText: { color: '#999', fontSize: 12, marginLeft: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '23%', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  serviceName: { fontSize: 11, fontWeight: '600', color: '#333' },
  partnerCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEE' },
  partnerName: { fontWeight: '700', fontSize: 15 },
  partnerRole: { fontSize: 12, color: '#666', marginTop: 2 },
  rating: { fontSize: 12, fontWeight: '700', marginLeft: 2 },
  price: { fontWeight: '800', fontSize: 16 },
  perHr: { fontSize: 11, color: '#666', marginRight: 6 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759' },
  bookBtn: { backgroundColor: '#000', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  bookBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  mapCard: { backgroundColor: '#F5F5F5', height: 150, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject, borderRadius: 16 },
  pinIcon: { marginBottom: 8 },
  mapText: { fontWeight: '700', color: '#333' },
  mapSubText: { fontSize: 11, color: '#999' },
  expandIcon: { position: 'absolute', top: 12, right: 12, padding: 4, backgroundColor: '#FFF', borderRadius: 12 },
});