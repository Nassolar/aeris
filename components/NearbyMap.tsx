/**
 * TEMPORARY: Maps disabled until Google Maps API configuration
 *
 * What was disabled:
 * - MapView component
 * - Marker components
 * - Map-related imports (react-native-maps)
 *
 * To re-enable:
 * 1. Configure Google Maps API key in app.json
 * 2. Rebuild with: eas build --profile development --platform android
 * 3. Uncomment all map-related code marked with "Temporarily disabled"
 *
 * Re-enable date: Feb 1, 2026 (when EAS builds reset)
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
// Temporarily disabled - Google Maps API not configured
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ServiceProvider } from '../types';

const { width } = Dimensions.get('window');

// Mock nearby providers (replace with real data from Firestore)
const MOCK_PROVIDERS: ServiceProvider[] = [
  {
    id: '1',
    name: 'Alex Morgan',
    role: 'Electrician',
    rating: 4.9,
    distance: 2.5,
    price: 85,
    imageUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    isOnline: true,
    latitude: 14.5995,
    longitude: 120.9842,
  },
];

interface NearbyMapProps {
  providers?: ServiceProvider[];
  onMarkerPress?: (provider: ServiceProvider) => void;
}

export const NearbyMap: React.FC<NearbyMapProps> = ({
  providers = MOCK_PROVIDERS,
  onMarkerPress,
}) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        Alert.alert(
          'Location Permission Required',
          'AERIS needs your location to show nearby service providers.'
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);
      setLoading(false);
    } catch (error) {
      console.error('Location error:', error);
      setErrorMsg('Could not fetch current location');
      setLoading(false);
      Alert.alert('Location Error', 'Could not fetch your current location.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Locating you...</Text>
      </View>
    );
  }

  if (errorMsg || !location) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="location-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.errorText}>{errorMsg || 'Location unavailable'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestLocationPermission}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Near You</Text>
        <View style={styles.distanceTag}>
          <Ionicons name="location" size={14} color={Colors.textSecondary} />
          <Text style={styles.subtitle}>Within 5km</Text>
        </View>
      </View>

      <View style={styles.mapWrapper}>
        {/* Temporarily disabled - Google Maps not configured */}
        {/* Will be re-enabled after rebuild on Feb 1st */}
        <View
          style={[
            styles.map,
            {
              backgroundColor: '#f5f5f5',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#e0e0e0',
              borderStyle: 'dashed',
            },
          ]}
        >
          <Text style={{ fontSize: 48, marginBottom: 8 }}>📍</Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#424242',
              marginBottom: 4,
            }}
          >
            Map View
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#9e9e9e',
              textAlign: 'center',
              paddingHorizontal: 32,
            }}
          >
            Google Maps will appear here{'\n'}(Temporarily disabled)
          </Text>
        </View>

        {/* Expand button for fullscreen map */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => Alert.alert('Expand Map', 'Open fullscreen map view')}
        >
          <Ionicons name="expand" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  errorText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  distanceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  expandButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.white,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
