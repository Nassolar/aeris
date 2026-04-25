import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { ReportService, CapturedVideoData } from '../../services/reportService';
import { queueRequest } from '../../services/offlineQueueService';
import type { IntentHint } from '../../constants/intentHintMap';
import AnonymousWaiverModal from '../../components/AnonymousWaiverModal';

interface CapturedImage {
  uri: string;
  capturedInApp: boolean;
  exifTimestampMs: number | null;
  citizenContextNote: string | null;
}

const theme = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#111827',
  textDim: '#6B7280',
  textLight: '#9CA3AF',
  primary: '#EF4444',
  warning: '#F59E0B',
  border: '#E5E7EB',
  inputBg: '#F9FAFB',
};

const STEPS = ['Details', 'Evidence', 'Location', 'Submit'];

const GUIDELINES = {
  page1: [
    { title: "Responsibility First", text: "This is an official channel. Submit honest, accurate reports only. False reporting is a serious offense." },
    { title: "Be Specific", text: 'Identify the target/victim clearly (e.g., "Silver Vios, Plate ABC-1234" vs "A car").' },
    { title: "Provide Context", text: 'Use landmarks or specific location markers (e.g., "Northbound lane, under the MRT station").' },
    { title: "Facts Only", text: "Describe exactly what happened. Avoid opinions or emotional language." },
    { title: "Stay Safe", text: "Observe from a distance. Do not put yourself in danger to get details." },
  ],
  page2: [
    { title: "Capture the Plate", text: "Ensure the license plate is fully visible, readable, and unblurred." },
    { title: "Establish the Scene", text: "For violations (e.g., Illegal Parking), fit both the car and the 'No Parking' sign in one frame." },
    { title: "Street Signs", text: "Whenever possible, include a street name signage or a distinct landmark in the background." },
    { title: "Multiple Angles", text: "Take a close-up for details (plate/damage) and a wide shot for context." },
    { title: "Review Before Uploading", text: "Check your photos immediately. If they are dark or blurry, please retake them." },
  ],
  page3: [
    { title: "Auto-Geolocated", text: "We have automatically pulled the location data from your uploaded photos." },
    { title: "Verify the Pin", text: "GPS can drift. Please look at the map and ensure the pin is on the exact spot." },
    { title: "Drag to Adjust", text: "If the pin is slightly off (e.g., wrong side of the street), drag it to the correct position." },
    { title: "Precision Saves Time", text: "A precise pin helps responders or enforcement teams arrive minutes faster." },
    { title: "Final Confirmation", text: 'Once the pin is exactly on the target, tap "Submit Request".' },
  ]
};

export default function ReportWizard() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const category = (params.category as string) || 'violation';

  const getPageTitle = () => {
    if (category === 'medical') return 'Request Medical Help';
    if (category === 'police') return 'Request Police';
    if (category === 'fire') return 'Request Fire Response';
    if (category === 'rescue') return 'Request Rescue';
    return 'Report Violation';
  };

  const [description, setDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [images, setImages] = useState<CapturedImage[]>([]);
  const [reportId, setReportId] = useState('');
  const [videos, setVideos] = useState<CapturedVideoData[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showWaiver, setShowWaiver] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [location, setLocation] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [locationName, setLocationName] = useState('Locating...');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<MapView>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reverseGeocode = (lat: number, lng: number) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (results.length > 0) {
          const g = results[0];
          const name = [g.name, g.street, g.district, g.city]
            .filter(Boolean)
            .join(', ');
          setLocationName(name || 'Unknown Location');
        }
      } catch {
        setLocationName('Unknown Location');
      }
    }, 600);
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await Location.geocodeAsync(searchQuery.trim());
      if (results.length === 0) {
        Alert.alert('Not Found', 'No location found for that search. Try a more specific address.');
        return;
      }
      const { latitude, longitude } = results[0];
      const newRegion = { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 };
      setLocation(newRegion);
      reverseGeocode(latitude, longitude);
      mapRef.current?.animateToRegion(newRegion, 600);
    } catch {
      Alert.alert('Search Error', 'Could not search for that location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const centerOnMyLocation = async () => {
    const loc = await ReportService.getCurrentLocation();
    if (!loc) {
      Alert.alert('Location Unavailable', 'Could not get your current location.');
      return;
    }
    const newRegion = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 };
    setLocation(newRegion);
    reverseGeocode(loc.coords.latitude, loc.coords.longitude);
    mapRef.current?.animateToRegion(newRegion, 600);
  };

  useEffect(() => {
    (async () => {
      const hasPermission = await ReportService.requestPermissions();
      if (!hasPermission) { setLocationReady(true); return; }
      const loc = await ReportService.getCurrentLocation();
      if (loc) {
        setLocation(prev => ({ ...prev, latitude: loc.coords.latitude, longitude: loc.coords.longitude }));
        reverseGeocode(loc.coords.latitude, loc.coords.longitude);
      }
      setLocationReady(true);
    })();
  }, []);

  const pickImage = async (useCamera: boolean) => {
    let result: ImagePicker.ImagePickerResult;
    if (useCamera) {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        exif: true,
      });
    } else {
      // Gallery: allow selecting multiple photos at once
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        exif: true,
      });
    }
    if (result.canceled) return;

    const newImages: CapturedImage[] = result.assets.map(asset => {
      let exifTimestampMs: number | null = null;
      if (asset.exif?.DateTime) {
        const exifStr = (asset.exif.DateTime as string).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
        const parsed = Date.parse(exifStr);
        if (!isNaN(parsed)) exifTimestampMs = parsed;
      }
      // Update map location from first asset with GPS
      if (asset.exif?.GPSLatitude && asset.exif?.GPSLongitude) {
        let lat = asset.exif.GPSLatitude as number;
        let long = asset.exif.GPSLongitude as number;
        if (asset.exif.GPSLatitudeRef === 'S') lat = -lat;
        if (asset.exif.GPSLongitudeRef === 'W') long = -long;
        setLocation(prev => ({ ...prev, latitude: lat, longitude: long }));
      }
      return { uri: asset.uri, capturedInApp: useCamera, exifTimestampMs, citizenContextNote: null };
    });

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  const pickVideo = async (useCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.8,
      videoMaxDuration: 60,
    };
    let result: ImagePicker.ImagePickerResult;
    if (useCamera) {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (result.canceled) return;
    const asset = result.assets[0];
    setVideos(prev => [...prev, { uri: asset.uri, capturedInApp: useCamera, durationMs: asset.duration ?? null, citizenContextNote: null }]);
  };

  const removeVideo = (index: number) => setVideos(videos.filter((_, i) => i !== index));

  // Simplified: show alert with Camera / Gallery options
  const showMediaOptions = (type: 'photo' | 'video') => {
    Alert.alert(
      type === 'photo' ? 'Add Photo' : 'Add Video',
      undefined,
      [
        { text: type === 'photo' ? 'Take Photo' : 'Record Video', onPress: () => type === 'photo' ? pickImage(true) : pickVideo(true) },
        { text: 'Choose from Gallery', onPress: () => type === 'photo' ? pickImage(false) : pickVideo(false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const generateReportID = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomLetters = letters.charAt(Math.floor(Math.random() * 26)) + letters.charAt(Math.floor(Math.random() * 26));
    const randomNumbers = Math.floor(10000000 + Math.random() * 90000000);
    return `${randomLetters}${randomNumbers}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const newReportId = generateReportID();
    setReportId(newReportId);
    // Queue always succeeds — uploads immediately if online, retries silently when offline
    await queueRequest({ reportId: newReportId, category, description, additionalInfo, images, videos, location, isAnonymous, intentHint: category as IntentHint, submissionMode: 'button_assisted' });
    setLoading(false);
    setStep(4);
  };

  const renderGuidelines = (data: typeof GUIDELINES.page1) => (
    <View style={styles.guidelineBox}>
      <View style={styles.guidelineHeader}>
        <Ionicons name="information-circle" size={18} color={theme.primary} />
        <Text style={styles.guidelineTitle}>Reporting Guidelines</Text>
      </View>
      {data.map((item, index) => (
        <View key={index} style={styles.guidelineRow}>
          <Text style={styles.guidelineNum}>{index + 1}.</Text>
          <Text style={styles.guidelineText}>
            <Text style={styles.guidelineBold}>{item.title}: </Text>
            {item.text}
          </Text>
        </View>
      ))}
    </View>
  );

  // STEP 1 — Details
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.headerTitle}>{getPageTitle()}</Text>
      <Text style={styles.headerSub}>Provide details to help us respond faster.</Text>

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder={category === 'medical' ? "e.g. Difficulty breathing, severe pain..." : "e.g. Reckless driving... Witness a crime?... Need Rescue?"}
        placeholderTextColor={theme.textLight}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Additional Information</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Landmarks, floor number, specific condition..."
        placeholderTextColor={theme.textLight}
        multiline
        value={additionalInfo}
        onChangeText={setAdditionalInfo}
      />

      {renderGuidelines(GUIDELINES.page1)}

      <TouchableOpacity
        style={[styles.btnPrimary, !description && styles.btnDisabled]}
        disabled={!description}
        onPress={() => setStep(2)}
      >
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  // STEP 2 — Evidence
  const renderStep2 = () => {
    const hasMedia = images.length > 0 || videos.length > 0;
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.headerTitle}>Add Evidence</Text>
        <Text style={styles.headerSub}>Photos and videos help authorities understand the situation.</Text>

        {/* Media previews */}
        {hasMedia && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
            {images.map((img, index) => (
              <View key={`img-${index}`} style={styles.previewThumb}>
                <Image source={{ uri: img.uri }} style={styles.thumbImg} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                  <Ionicons name="close-circle" size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>
            ))}
            {videos.map((vid, index) => (
              <View key={`vid-${index}`} style={styles.previewThumb}>
                <Video source={{ uri: vid.uri }} style={styles.thumbImg} resizeMode={ResizeMode.COVER} useNativeControls={false} />
                <View style={styles.videoBadge}>
                  <Ionicons name="videocam" size={12} color="#fff" />
                </View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeVideo(index)}>
                  <Ionicons name="close-circle" size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Simplified 2-button picker */}
        <View style={styles.mediaRow}>
          <TouchableOpacity style={styles.mediaBtn} onPress={() => showMediaOptions('photo')}>
            <Ionicons name="camera" size={22} color={theme.primary} />
            <Text style={styles.mediaBtnText}>Add Photo</Text>
          </TouchableOpacity>
          <View style={styles.mediaDivider} />
          <TouchableOpacity style={styles.mediaBtn} onPress={() => showMediaOptions('video')}>
            <Ionicons name="videocam" size={22} color={theme.text} />
            <Text style={styles.mediaBtnText}>Add Video</Text>
          </TouchableOpacity>
        </View>

        {!hasMedia && (
          <Text style={styles.mediaHint}>At least one photo or video is required to continue.</Text>
        )}

        {renderGuidelines(GUIDELINES.page2)}

        <TouchableOpacity
          style={[styles.btnPrimary, !hasMedia && styles.btnDisabled]}
          disabled={!hasMedia}
          onPress={() => setStep(3)}
        >
          <Text style={styles.btnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // STEP 3 — Location
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.headerTitle}>Confirm Location</Text>
      <Text style={styles.headerSub}>Drag the map to pinpoint the exact incident location.</Text>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={18} color={theme.textDim} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search address or landmark..."
            placeholderTextColor={theme.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchLocation}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={searchLocation} disabled={isSearching}>
          {isSearching
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.searchBtnText}>Go</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        {locationReady ? (
          <>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={location}
              onRegionChangeComplete={(region) => {
                setLocation(region);
                reverseGeocode(region.latitude, region.longitude);
              }}
            />
            <View style={styles.centerMarker} pointerEvents="none">
              <Ionicons name="location" size={40} color={theme.primary} />
            </View>
            {/* My Location button */}
            <TouchableOpacity style={styles.myLocationBtn} onPress={centerOnMyLocation}>
              <Ionicons name="locate" size={20} color={theme.primary} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.mapLoadingText}>Getting your location...</Text>
          </View>
        )}
      </View>

      <View style={styles.coordsRow}>
        <Ionicons name="location-outline" size={16} color={theme.textDim} />
        <Text style={styles.coordsText} numberOfLines={2}>{locationName}</Text>
      </View>

      {renderGuidelines(GUIDELINES.page3)}

      {/* Anonymous option */}
      <View style={styles.sectionBlock}>
        <Text style={styles.label}>Privacy Options</Text>
        <TouchableOpacity
          style={[styles.anonCard, isAnonymous && styles.anonCardActive]}
          activeOpacity={0.7}
          onPress={() => { if (isAnonymous) { setIsAnonymous(false); } else { setShowWaiver(true); } }}
        >
          <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
            {isAnonymous && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.anonTitle}>Report Anonymously</Text>
            <Text style={styles.anonSub}>Your identity will be protected.</Text>
          </View>
          <Ionicons name="lock-closed" size={20} color={isAnonymous ? theme.warning : theme.textLight} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Submit Report</Text>
        }
      </TouchableOpacity>

      <AnonymousWaiverModal
        visible={showWaiver}
        onClose={() => setShowWaiver(false)}
        onAgree={() => { setIsAnonymous(true); setShowWaiver(false); }}
      />
    </View>
  );

  // STEP 4 — Success
  const renderStep4 = () => {
    if (isAnonymous) {
      return (
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: theme.warning }]}>
            <Ionicons name="lock-closed" size={36} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Submitted Anonymously</Text>
          <Text style={styles.successSub}>Your report has been received. Save your Report ID — it's the only way to track this report.</Text>

          <View style={styles.idBox}>
            <Text style={styles.idLabel}>REPORT ID</Text>
            <Text style={styles.idValue}>{reportId}</Text>
          </View>

          <TouchableOpacity style={styles.idSaveBtn} onPress={() => Alert.alert('Save Reference', 'Please take a screenshot to save your Report ID.')}>
            <Ionicons name="camera-outline" size={18} color={theme.text} style={{ marginRight: 6 }} />
            <Text style={styles.idSaveBtnText}>Take Screenshot</Text>
          </TouchableOpacity>

          <View style={styles.noteBox}>
            <View style={styles.noteRow}>
              <Ionicons name="close-circle-outline" size={18} color={theme.textDim} style={{ marginRight: 10 }} />
              <Text style={styles.noteText}>You will NOT receive email or SMS updates.</Text>
            </View>
            <View style={styles.noteRow}>
              <Ionicons name="search-outline" size={18} color={theme.textDim} style={{ marginRight: 10 }} />
              <Text style={styles.noteText}>This ID is the only way to track your report.</Text>
            </View>
            <View style={styles.noteRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.textDim} style={{ marginRight: 10 }} />
              <Text style={styles.noteText}>Your identity remains protected.</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.navigate({ pathname: '/(tabs)', params: { mode: 'emergency' } })}>
            <Text style={styles.btnText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Report Submitted!</Text>
        <Text style={styles.successSub}>Your report has been received and will be reviewed by the appropriate authorities.</Text>

        <View style={styles.idBox}>
          <Text style={styles.idLabel}>REPORT ID</Text>
          <Text style={styles.idValue}>{reportId}</Text>
        </View>

        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>What happens next?</Text>
          {[
            'Authorities will review your report',
            "You'll receive updates on your report status",
            'Track your report in the "My Reports" tab',
          ].map((text, i) => (
            <View key={i} style={styles.nextRow}>
              <View style={styles.nextNum}><Text style={styles.nextNumText}>{i + 1}</Text></View>
              <Text style={styles.nextText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.btnGroup}>
          <TouchableOpacity style={styles.btnOutline} onPress={() => router.push('/(tabs)/bookings')}>
            <Text style={styles.btnOutlineText}>View My Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.navigate({ pathname: '/(tabs)', params: { mode: 'emergency' } })}>
            <Text style={styles.btnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerShown: true,
        title: STEPS[step - 1],
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerShadowVisible: true,
        headerLeft: () => (
          step > 1 && step < 4 ?
            <TouchableOpacity onPress={() => setStep(step - 1)} style={{ marginLeft: 0, marginRight: 15 }}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity> : null
        )
      }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  stepContainer: { flex: 1, padding: 20 },

  headerTitle: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 6 },
  headerSub: { fontSize: 14, color: theme.textDim, marginBottom: 24 },

  label: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 },
  input: {
    backgroundColor: theme.inputBg,
    borderRadius: 12,
    padding: 14,
    color: theme.text,
    marginBottom: 18,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.border,
    fontSize: 15,
  },

  btnPrimary: {
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  btnOutline: {
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: theme.border,
    marginBottom: 12,
  },
  btnOutlineText: { color: theme.text, fontWeight: '600', fontSize: 16 },

  // Media pickers
  previewScroll: { marginBottom: 16 },
  previewThumb: { marginRight: 12, position: 'relative' },
  thumbImg: { width: 100, height: 100, borderRadius: 10, resizeMode: 'cover', backgroundColor: theme.border },
  removeBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: theme.card, borderRadius: 12 },
  videoBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: 3 },

  mediaRow: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  mediaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  mediaBtnText: { fontSize: 15, fontWeight: '600', color: theme.text },
  mediaDivider: { width: 1, backgroundColor: theme.border, marginVertical: 12 },
  mediaHint: { fontSize: 12, color: theme.textLight, textAlign: 'center', marginBottom: 16 },

  // Location search
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 10,
    height: 44,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: theme.text },
  searchBtn: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  myLocationBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: theme.card,
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  // Map
  mapContainer: {
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  map: { width: '100%', height: '100%' },
  centerMarker: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', paddingBottom: 35,
  },
  mapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.inputBg },
  mapLoadingText: { color: theme.textDim, marginTop: 10, fontSize: 14 },
  coordsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 20, gap: 6 },
  coordsText: { color: theme.textDim, fontSize: 13, flex: 1, textAlign: 'center' },

  sectionBlock: { marginTop: 8, marginBottom: 4 },
  anonCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonCardActive: { borderColor: theme.warning },
  anonTitle: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 },
  anonSub: { fontSize: 13, color: theme.textDim },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: theme.warning, borderColor: theme.warning },

  // Guidelines
  guidelineBox: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
    marginTop: 8,
  },
  guidelineHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  guidelineTitle: { fontSize: 14, fontWeight: 'bold', color: theme.text, marginLeft: 6 },
  guidelineRow: { flexDirection: 'row', marginBottom: 10 },
  guidelineNum: { fontSize: 13, fontWeight: 'bold', color: theme.primary, marginRight: 6, marginTop: 1 },
  guidelineText: { flex: 1, fontSize: 13, color: theme.textDim, lineHeight: 19 },
  guidelineBold: { fontWeight: '700', color: theme.text },

  // Success screen
  successContainer: { flex: 1, alignItems: 'center', padding: 24, paddingTop: 48 },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 26, fontWeight: 'bold', color: theme.text, marginBottom: 10, textAlign: 'center' },
  successSub: { fontSize: 14, color: theme.textDim, textAlign: 'center', marginBottom: 28, lineHeight: 21, paddingHorizontal: 10 },
  idBox: {
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  idLabel: { fontSize: 11, color: theme.textLight, letterSpacing: 1, marginBottom: 6 },
  idValue: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  idSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
    marginBottom: 24,
  },
  idSaveBtnText: { fontSize: 14, color: theme.text, fontWeight: '500' },
  noteBox: { width: '100%', backgroundColor: theme.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 8 },
  noteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  noteText: { flex: 1, fontSize: 13, color: theme.textDim, lineHeight: 18 },
  nextSteps: { width: '100%', backgroundColor: theme.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 24 },
  nextStepsTitle: { fontSize: 15, fontWeight: 'bold', color: theme.text, marginBottom: 14 },
  nextRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  nextNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  nextNumText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  nextText: { flex: 1, fontSize: 14, color: theme.textDim },
  btnGroup: { width: '100%', marginTop: 'auto', marginBottom: 8 },
});
