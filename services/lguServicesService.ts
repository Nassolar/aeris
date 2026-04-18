/**
 * LGU Services — Firestore read/write for citizen service requests.
 * Writes go to custom_service_requests collection.
 * Templates are read from service_templates.
 *
 * NOTE: Full dynamic form templates are loaded from Supabase in Phase 2.
 * This layer reads from Firestore for now, consistent with the rest of the app.
 */

// FIRESTORE RULES NOTE: service_request_counters/{counterId}
// allow read, write: if request.auth != null;
// (any authenticated citizen can increment — atomic transaction prevents abuse)

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { LguServiceRequest, LguServiceRequestStatus } from '../types';

const REQUESTS_COLLECTION = 'service_requests';
const COUNTERS_COLLECTION = 'service_request_counters';

// ─── Generate Reference Number (atomic, sequential) ───────────────────────────

async function generateReferenceNumberAtomic(
  templateKey: string,
  lguPsgcCode: string
): Promise<string> {
  const prefixMap: Record<string, string> = {
    brgy_clearance: 'CLR',
    cedula: 'CTC',
    good_moral: 'GMC',
    indigency_cert: 'IND',
    cert_residency: 'RES',
    barangay_clearance: 'CLR',
    brgy_business_permit: 'BBP',
    mayors_permit: 'BPL',
    medical_cert: 'MED',
    senior_citizen_id: 'SCI',
    pwd_id: 'PWD',
    solo_parent_id: 'SPI',
    rpt: 'RPT',
    birth_endorsement: 'BEN',
    first_time_job_seeker: 'FJS',
    ftjs: 'FJS',
    burial_permit: 'BUR',
    building_permit: 'BLD',
    environmental_clearance: 'ENV',
    ptr: 'PTR',
  };

  const prefix = prefixMap[templateKey] ?? 'SVC';
  const year = new Date().getFullYear();
  const counterKey = `${lguPsgcCode}_${templateKey}`;
  const counterRef = firestore().collection(COUNTERS_COLLECTION).doc(counterKey);

  const seq = await firestore().runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists ? (snap.data()?.seq ?? 0) : 0;
    const next = current + 1;
    tx.set(
      counterRef,
      {
        seq: next,
        templateKey,
        lguPsgcCode,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return next;
  });

  return `${prefix}-${year}-${seq.toString().padStart(6, '0')}`;
}

// ─── Submit a new service request ────────────────────────────────────────────

export interface SubmitServiceRequestParams {
  templateKey: string;
  serviceName: string;
  office: string;
  feeAmount: number | null;
  formData: Record<string, string | string[]>;
  lguPsgcCode: string;
}

export const submitServiceRequest = async (
  params: SubmitServiceRequestParams
): Promise<{ referenceNumber: string; requestId: string }> => {
  const user = auth().currentUser;
  if (!user) throw new Error('You must be signed in to submit a request.');

  const referenceNumber = await generateReferenceNumberAtomic(
    params.templateKey,
    params.lguPsgcCode
  );
  const now = firestore.FieldValue.serverTimestamp();

  const docRef = await firestore().collection(REQUESTS_COLLECTION).add({
    citizenUid: user.uid,
    templateKey: params.templateKey,
    serviceName: params.serviceName,
    office: params.office,
    referenceNumber,
    status: 'pending' as LguServiceRequestStatus,
    formData: params.formData,
    feeAmount: params.feeAmount,
    lguPsgcCode: params.lguPsgcCode,
    submittedAt: now,
    updatedAt: now,
    processedAt: null,
    rejectionReason: null,
    outputPdfUrl: null,
    certNumber: null,
  });

  return { referenceNumber, requestId: docRef.id };
};

// ─── Listen to citizen's own requests ────────────────────────────────────────

export const subscribeToMyRequests = (
  onUpdate: (requests: LguServiceRequest[]) => void,
  onError: (err: Error) => void
): (() => void) => {
  const user = auth().currentUser;
  if (!user) {
    onError(new Error('Not authenticated.'));
    return () => {};
  }

  return firestore()
    .collection(REQUESTS_COLLECTION)
    .where('citizenUid', '==', user.uid)
    .orderBy('submittedAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        const requests: LguServiceRequest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<LguServiceRequest, 'id'>),
        }));
        onUpdate(requests);
      },
      (err) => onError(err)
    );
};

// ─── Get a single request by ID ───────────────────────────────────────────────

export const getServiceRequest = async (
  requestId: string
): Promise<LguServiceRequest | null> => {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated.');

  const doc = await firestore()
    .collection(REQUESTS_COLLECTION)
    .doc(requestId)
    .get();

  if (!doc.exists) return null;
  const data = doc.data() as Omit<LguServiceRequest, 'id'>;

  // Guard: only owner can read
  if (data.citizenUid !== user.uid) throw new Error('Access denied.');

  return { id: doc.id, ...data };
};
