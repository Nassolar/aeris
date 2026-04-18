import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Image, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { theme } from '../../constants/theme';
import { createServiceRequest } from '../../services/serviceMarketplaceService';
import { ServiceUrgency } from '../../types/serviceMarketplace';
import { uploadImage } from '../../services/imageService';

const URGENCY_OPTIONS: { value: ServiceUrgency; label: string; sub: string; fee?: number }[] = [
  { value: 'now',       label: 'Now',            sub: 'Provider dispatched immediately', fee: 100 },
  { value: 'today',     label: 'Today',           sub: 'Anytime today' },
  { value: 'tomorrow',  label: 'Tomorrow',        sub: 'Next available slot' },
  { value: 'scheduled', label: 'Schedule',        sub: 'Pick a date & time' },
];

const TEAL = '#14B8A6';

export default function ServiceRequestScreen() {
  const { category, subcategory, subcategoryName, basePrice } = useLocalSearchParams<{
    category: string; subcategory: string; subcategoryName: string; basePrice: string;
  }>();
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<ServiceUrgency>('now');
  const [address, setAddress] = useState('Fetching your location…');
  const [userLat, setUserLat] = useState(14.5547);  // Metro Manila default
  const [userLng, setUserLng] = useState(121.0244);
  const [locationReady, setLocationReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tipsExpanded, setTipsExpanded] = useState(false);

  // Fetch GPS location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setAddress('Location permission denied — tap to set manually');
          setLocationReady(true);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserLat(loc.coords.latitude);
        setUserLng(loc.coords.longitude);

        const [place] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (place) {
          const parts = [place.streetNumber, place.street, place.district, place.city].filter(Boolean);
          setAddress(parts.join(', '));
        }
        setLocationReady(true);
      } catch {
        setAddress('Could not get location — tap to set manually');
        setLocationReady(true);
      }
    })();
  }, []);

  const pickPhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit reached', 'You can add up to 5 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPhotos(prev => [...prev, compressed.uri]);
    }
  };

  const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!locationReady || !address || address.startsWith('Fetching')) {
      Alert.alert('Location required', 'Please wait for your location to load or set it manually.');
      return;
    }
    if (!urgency) {
      Alert.alert('Required', 'Please select when you need the service.');
      return;
    }

    setSubmitting(true);
    try {
      // Upload photos first
      const uploadedUrls: string[] = [];
      for (const uri of photos) {
        const url = await uploadImage(uri, 'service-requests');
        uploadedUrls.push(url);
      }

      const requestId = await createServiceRequest({
        category: category ?? '',
        subcategory: subcategory ?? '',
        description,
        photos: uploadedUrls,
        urgency,
        location: { address, latitude: userLat, longitude: userLng },
      });

      router.push({
        pathname: '/services/providers',
        params: {
          requestId,
          category: category ?? '',
          subcategory: subcategory ?? '',
          subcategoryName: subcategoryName ?? '',
          userLat: String(userLat),
          userLng: String(userLng),
        },
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const urgencyPrice = urgency === 'now' ? 100 : 0;
  const basePriceNum = Number(basePrice) || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.surface }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{subcategoryName ?? 'Service Request'}</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Add Photos <Text style={styles.optionalLabel}>(Optional)</Text></Text>
            <Text style={styles.sectionSub}>Help providers understand the issue before arriving</Text>
            <View style={styles.photoRow}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(i)}>
                    <Ionicons name="close-circle" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 5 && (
                <TouchableOpacity style={styles.photoAdd} onPress={pickPhoto}>
                  <Ionicons name="camera-outline" size={24} color={theme.colors.textLight} />
                  <Text style={styles.photoAddText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.photoCount}>{photos.length}/5 photos</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 Describe the Issue <Text style={styles.optionalLabel}>(Optional)</Text></Text>
            <TextInput
              style={styles.descInput}
              placeholder={`e.g. "Kitchen faucet has been leaking for 2 days, water drips from the base"`}
              placeholderTextColor={theme.colors.textLight}
              multiline
              maxLength={500}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Urgency */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ When do you need this?</Text>
            {URGENCY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.urgencyRow, urgency === opt.value && styles.urgencyRowActive]}
                onPress={() => setUrgency(opt.value)}
              >
                <View style={[styles.radio, urgency === opt.value && styles.radioActive]}>
                  {urgency === opt.value && <View style={styles.radioDot} />}
                </View>
                <View style={styles.urgencyLabel}>
                  <Text style={styles.urgencyTitle}>{opt.label}</Text>
                  <Text style={styles.urgencySub}>{opt.sub}</Text>
                </View>
                {opt.fee && (
                  <View style={styles.feeBadge}>
                    <Text style={styles.feeText}>+₱{opt.fee}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Service Location</Text>
            <View style={styles.locationBox}>
              <Ionicons name="location" size={18} color={TEAL} />
              <Text style={styles.locationText} numberOfLines={2}>{address}</Text>
            </View>
            <TouchableOpacity style={styles.changeLocation} onPress={() => Alert.alert('Coming soon', 'Manual address entry will be added.')}>
              <Ionicons name="pencil-outline" size={15} color={TEAL} />
              <Text style={styles.changeLocationText}>Change location</Text>
            </TouchableOpacity>
          </View>

          {/* Price Preview */}
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Estimated starting price</Text>
            <Text style={styles.priceAmount}>₱{basePriceNum + urgencyPrice}</Text>
            {urgencyPrice > 0 && (
              <Text style={styles.priceNote}>Includes ₱{urgencyPrice} urgent booking fee</Text>
            )}
            <Text style={styles.priceNote}>Final price confirmed after provider inspection</Text>
          </View>

          {/* Tips */}
          <TouchableOpacity style={styles.tipsHeader} onPress={() => setTipsExpanded(e => !e)}>
            <Text style={styles.tipsTitle}>💡 Tips for better service</Text>
            <Ionicons name={tipsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          {tipsExpanded && (
            <View style={styles.tipsBody}>
              {['Take clear, well-lit photos of the issue', 'Describe any sounds, smells, or recent changes', 'Note how long the problem has been happening', 'Mention if you have already tried any fixes'].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer CTA */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Find Providers</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const TEAL_LIGHT = '#CCFBF1';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.primary },
  scroll: { padding: 16 },
  section: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.primary, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 12 },
  optionalLabel: { fontWeight: '400', color: theme.colors.textLight },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  photoThumb: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 4, right: 4 },
  photoAdd: {
    width: 80, height: 80, borderRadius: 10,
    borderWidth: 1.5, borderColor: theme.colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background,
  },
  photoAddText: { fontSize: 11, color: theme.colors.textLight, marginTop: 4 },
  photoCount: { fontSize: 12, color: theme.colors.textLight },
  descInput: {
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md,
    padding: 12, fontSize: 14, color: theme.colors.text, minHeight: 100,
    backgroundColor: theme.colors.background,
  },
  charCount: { fontSize: 12, color: theme.colors.textLight, textAlign: 'right', marginTop: 6 },
  urgencyRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  urgencyRowActive: { backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 8 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  radioActive: { borderColor: TEAL },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: TEAL },
  urgencyLabel: { flex: 1 },
  urgencyTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.primary },
  urgencySub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },
  feeBadge: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  feeText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  locationBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: theme.colors.background, padding: 12,
    borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: 8,
  },
  locationText: { flex: 1, marginLeft: 8, fontSize: 14, color: theme.colors.text, lineHeight: 20 },
  changeLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeLocationText: { fontSize: 13, color: TEAL, fontWeight: '600' },
  priceBox: {
    backgroundColor: '#F0FDF4', borderRadius: theme.borderRadius.lg,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  priceLabel: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 },
  priceAmount: { fontSize: 28, fontWeight: '800', color: theme.colors.primary },
  priceNote: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
  tipsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 16, marginBottom: 2, borderWidth: 1, borderColor: theme.colors.border,
  },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  tipsBody: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border,
    borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0,
  },
  tipRow: { flexDirection: 'row', marginBottom: 8 },
  tipBullet: { color: TEAL, marginRight: 8, fontWeight: '700' },
  tipText: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19 },
  footer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg,
    paddingVertical: 16, gap: 8,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
