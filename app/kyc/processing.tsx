import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';
import * as FileSystem from 'expo-file-system';
import auth from '@react-native-firebase/auth';
import { useKycStore } from './kycStore';

const CITY_BLACK = '#000000';

async function uriToBase64(uri: string): Promise<string> {
  return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export default function KycProcessing() {
  const router = useRouter();
  const store = useKycStore();
  const spinValue = useRef(new Animated.Value(0)).current;
  const submittedRef = useRef(false);

  // Spinner animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Submit to Cloud Function once on mount
  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    (async () => {
      const user = auth().currentUser;
      if (!user) return;

      try {
        const [idFrontB64, idBackB64, selfieB64, residenceB64] = await Promise.all([
          store.idFront ? uriToBase64(store.idFront) : Promise.resolve(null),
          store.idBack ? uriToBase64(store.idBack) : Promise.resolve(null),
          store.selfie ? uriToBase64(store.selfie) : Promise.resolve(null),
          store.residenceDoc ? uriToBase64(store.residenceDoc) : Promise.resolve(null),
        ]);

        const processKYC = firebase.functions().httpsCallable('processKYC');

        await processKYC({
          idType: store.idType,
          idFront: idFrontB64,
          idBack: idBackB64,
          selfie: selfieB64,
          residenceDoc: residenceB64,
          residenceDocType: store.residenceDocType,
          householdData: {
            dependents: store.dependents,
            hasSenior: store.hasSenior,
            hasPwd: store.hasPwd,
            pwdType: store.pwdType,
            homeAddress: store.homeAddress,
          },
        });

        store.reset();
      } catch (err) {
        console.error('[KYC] processKYC error:', err);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="shield-checkmark" size={72} color="#000" />
        </Animated.View>

        <Text style={styles.title}>Verifying your identity...</Text>
        <Text style={styles.subtitle}>This usually takes less than a minute.</Text>
        <Text style={styles.note}>You can close this screen.{'\n'}We'll notify you when it's done.</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.replace('/(tabs)/city')}
        >
          <Text style={styles.closeBtnLabel}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 28,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  note: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 24,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 12 },
  closeBtn: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtnLabel: { fontSize: 16, fontWeight: '600', color: '#374151' },
});
