import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

// ── Types ──────────────────────────────────────────────────────────────────

export type BOLOSeverity = 'critical' | 'serious' | 'minor';
export type BOLOStatus = 'active' | 'resolved' | 'expired';
export type SightingValidationStatus = 'pending' | 'validated' | 'dismissed';

export interface BOLODocument {
  id: string;
  status: BOLOStatus;
  broadcastToCitizens: boolean;
  severity: BOLOSeverity;
  subjectPhoto?: string | null;
  // General physical description only — E4 never sees clothing or plate
  subjectDescription?: string | null;
  lastSeenAt?: FirebaseFirestoreTypes.Timestamp | null;
  lastSeenBarangay?: string | null;
  lastSeenCity?: string | null;
  sightingCount: number;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface BOLOSighting {
  id?: string;
  boloId: string;
  // reporterId always stores the real uid (isAnonymous controls display in aeris-web)
  reporterId: string;
  reporterName: string;
  reporterTier: 'E4';
  isAnonymous: boolean;
  location: {
    lat: number | null;
    lng: number | null;
    address: string | null;
    distanceFromLastKnownKm: number;
  };
  description: string;
  actionTaken: null; // always null for E4
  photoUrl: string | null;
  validationStatus: SightingValidationStatus;
  pointsAwarded: number | null;
  pointsMultiplier: number;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export type SightingWithId = BOLOSighting & { id: string };

// ── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch a single BOLO for citizen display.
 * Returns null if the BOLO is inactive or not broadcast to citizens.
 */
export const getBOLO = async (boloId: string): Promise<BOLODocument | null> => {
  try {
    const doc = await firestore().collection('bolos').doc(boloId).get();
    if (!doc.exists) return null;

    const data = doc.data() as Omit<BOLODocument, 'id'>;

    // E4 access guard — enforce in client AND Firestore rules
    if (!data.broadcastToCitizens || data.status !== 'active') return null;

    return { id: doc.id, ...data };
  } catch (error) {
    console.error('[BOLOService] getBOLO error:', error);
    return null;
  }
};

/**
 * Real-time listener for the current user's own sightings across all BOLOs.
 * Uses collectionGroup — Firestore index already deployed.
 */
export const subscribeMySightings = (
  uid: string,
  onData: (sightings: SightingWithId[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  return firestore()
    .collectionGroup('sightings')
    .where('reporterId', '==', uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        const sightings: SightingWithId[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<BOLOSighting, 'id'>),
        }));
        onData(sightings);
      },
      (error) => {
        console.error('[BOLOService] subscribeMySightings error:', error);
        onError?.(error);
      }
    );
};

// ── Writes ───────────────────────────────────────────────────────────────────

const uploadSightingPhoto = async (boloId: string, localUri: string): Promise<string> => {
  const ref = storage().ref(`bolos/${boloId}/sightings/${Date.now()}.jpg`);
  await ref.putFile(localUri);
  return ref.getDownloadURL();
};

export interface SubmitSightingInput {
  description: string;
  barangay: string;
  isAnonymous: boolean;
  coords: { latitude: number | null; longitude: number | null };
  photoUri: string | null;
}

/**
 * Write a sighting subcollection document and atomically increment sightingCount.
 */
export const submitSighting = async (
  boloId: string,
  input: SubmitSightingInput
): Promise<void> => {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');

  let photoUrl: string | null = null;
  if (input.photoUri) {
    photoUrl = await uploadSightingPhoto(boloId, input.photoUri);
  }

  const now = FirebaseFirestoreTypes.Timestamp.now();

  const sightingData: Omit<BOLOSighting, 'id'> = {
    boloId,
    reporterId: user.uid,
    reporterName: input.isAnonymous ? 'Anonymous' : (user.displayName ?? 'Citizen'),
    reporterTier: 'E4',
    isAnonymous: input.isAnonymous,
    location: {
      lat: input.coords.latitude,
      lng: input.coords.longitude,
      address: input.barangay.trim() || null,
      distanceFromLastKnownKm: 0,
    },
    description: input.description.trim(),
    actionTaken: null,
    photoUrl,
    validationStatus: 'pending',
    pointsAwarded: null,
    pointsMultiplier: 1,
    createdAt: now,
    updatedAt: now,
  };

  const batch = firestore().batch();
  const sightingRef = firestore()
    .collection('bolos')
    .doc(boloId)
    .collection('sightings')
    .doc();
  batch.set(sightingRef, sightingData);

  const boloRef = firestore().collection('bolos').doc(boloId);
  batch.update(boloRef, { sightingCount: firestore.FieldValue.increment(1) });

  await batch.commit();
};
