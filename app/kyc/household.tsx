import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useKycStore } from './kycStore';


export default function KycHousehold() {
  const router = useRouter();
  const store = useKycStore();

  const changeDependents = (delta: number) => {
    const val = Math.max(0, store.dependents + delta);
    store.setField('dependents', val);
  };

  // Auto-fill address from GPS
  useEffect(() => {
    if (store.homeAddress) return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocode) {
          const parts = [
            geocode.streetNumber,
            geocode.street,
            geocode.district,
            geocode.city,
          ].filter(Boolean);
          store.setField('homeAddress', parts.join(', '));
        }
      } catch {
        // GPS unavailable — leave blank, user fills manually
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Identity Verification  ·  Step 4 of 4</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '100%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Household Details</Text>
        <Text style={styles.subtitle}>Help us determine your eligibility for benefits.</Text>

        <View style={styles.section}>
          <Text style={styles.label}>HOW MANY DEPENDENTS LIVE WITH YOU?</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity style={styles.countBtn} onPress={() => changeDependents(-1)}>
              <Ionicons name="remove" size={20} color="#000" />
            </TouchableOpacity>
            <Text style={styles.countValue}>{store.dependents}</Text>
            <TouchableOpacity style={styles.countBtn} onPress={() => changeDependents(1)}>
              <Ionicons name="add" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>SPECIAL STATUS</Text>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => store.setField('hasSenior', !store.hasSenior)}
          >
            <Text style={styles.toggleText}>Senior Citizen in household</Text>
            <Ionicons
              name={store.hasSenior ? 'checkbox' : 'square-outline'}
              size={24}
              color={store.hasSenior ? '#000' : '#D1D5DB'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => store.setField('hasPwd', !store.hasPwd)}
          >
            <Text style={styles.toggleText}>PWD (Person with Disability)</Text>
            <Ionicons
              name={store.hasPwd ? 'checkbox' : 'square-outline'}
              size={24}
              color={store.hasPwd ? '#000' : '#D1D5DB'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>HOME ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full address"
            placeholderTextColor="#9CA3AF"
            value={store.homeAddress}
            onChangeText={(txt) => store.setField('homeAddress', txt)}
            multiline
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !store.homeAddress && styles.continueBtnDisabled]}
          onPress={() => router.push('/kyc/review')}
          disabled={!store.homeAddress}
        >
          <Text style={styles.continueBtnLabel}>Finalize & Review</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  stepLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  progressTrack: { height: 4, backgroundColor: '#F3F4F6' },
  progressFill: { height: 4, backgroundColor: '#000' },

  content: { padding: 24, paddingTop: 28 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 32 },

  section: { marginBottom: 32 },
  label: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, marginBottom: 12 },

  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  countBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  countValue: { fontSize: 22, fontWeight: '700', color: '#111827', minWidth: 20, textAlign: 'center' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleText: { fontSize: 15, color: '#374151', fontWeight: '500' },

  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top',
  },

  footer: { paddingHorizontal: 24, paddingBottom: 8 },
  continueBtn: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
