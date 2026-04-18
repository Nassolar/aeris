import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import * as Location from 'expo-location';
import type { ConductorAIClassification } from '../types/voiceSOS';

export type EmergencyCategory = 'POLICE' | 'MEDICAL' | 'RESCUE' | 'GENERAL_SOS';

const generateCaseNumber = (): string => {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SOS-${date}-${suffix}`;
};

const computeAudioHash = async (uri: string): Promise<string | null> => {
  try {
    const buffer = await fetch(uri).then((r) => r.arrayBuffer());
    const subtle = (global as { crypto?: Crypto }).crypto?.subtle;
    if (!subtle) return null;
    const hashBuffer = await subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
};

const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<{ address: string | null; barangay: string | null }> => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const r = results[0];
    if (!r) return { address: null, barangay: null };
    const parts = [r.streetNumber, r.street, r.name].filter(Boolean);
    return {
      address: parts.length > 0 ? parts.join(' ') : null,
      barangay: r.subregion ?? r.district ?? null,
    };
  } catch {
    return { address: null, barangay: null };
  }
};

export const EmergencyService = {
  createIncident: async (
    citizenId: string,
    citizenName: string,
    voiceCaptured: boolean,
  ): Promise<{ incidentId: string; caseNumber: string }> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('PERMISSION_DENIED');

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    const { address, barangay } = await reverseGeocode(
      loc.coords.latitude,
      loc.coords.longitude,
    );

    const caseNumber = generateCaseNumber();
    const now = firestore.Timestamp.now();

    const docRef = await firestore().collection('incidents').add({
      trigger: 'voice_sos',
      caseNumber,
      voiceCaptured,
      voiceTranscript: null,
      audioUrl: null,
      audioHash: null,
      aiClassification: null,
      location: {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        geoPoint: new firestore.GeoPoint(loc.coords.latitude, loc.coords.longitude),
        address,
        barangay,
      },
      locationMetadata: {
        accuracy: loc.coords.accuracy,
        heading: loc.coords.heading,
        speed: loc.coords.speed,
      },
      status: 'dispatched',
      citizenId,
      citizenName,
      priority: 'CRITICAL',
      createdAt: now,
      updatedAt: now,
    });

    return { incidentId: docRef.id, caseNumber };
  },

  uploadSOSAudio: async (
    incidentId: string,
    audioUri: string,
  ): Promise<{ audioUrl: string; audioHash: string | null }> => {
    const path = `sos-audio/${incidentId}/${firestore.Timestamp.now().toMillis()}.m4a`;
    const audioHash = await computeAudioHash(audioUri);
    const ref = storage().ref(path);
    await ref.putFile(audioUri);
    const audioUrl = await ref.getDownloadURL();
    return { audioUrl, audioHash };
  },

  updateIncidentWithAudio: async (
    incidentId: string,
    audioUrl: string,
    audioHash: string | null,
  ): Promise<void> => {
    await firestore().collection('incidents').doc(incidentId).update({
      audioUrl,
      audioHash,
      updatedAt: firestore.Timestamp.now(),
    });
  },

  updateIncidentWithClassification: async (
    incidentId: string,
    transcript: string,
    classification: ConductorAIClassification,
  ): Promise<void> => {
    await firestore().collection('incidents').doc(incidentId).update({
      voiceTranscript: transcript,
      aiClassification: classification,
      updatedAt: firestore.Timestamp.now(),
    });
  },
};
