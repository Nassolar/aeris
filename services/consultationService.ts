/**
 * Consultation service for the AERIS citizen app.
 * Uses Firebase compat API (firebase/compat/*) consistent with the rest of the app.
 * Cloud Functions scoped to asia-southeast1 via the `functions` export from firebaseConfig.
 */
import firebase from 'firebase/compat/app';
import { db, storage, functions } from '../firebaseConfig';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConsultationType = 'pro_bono' | 'paid';
export type ConsultationStatus =
  | 'pending' | 'matched' | 'active' | 'completed' | 'cancelled' | 'expired';

export interface Consultation {
  id: string;
  citizenId: string;
  lawyerId: string | null;
  type: ConsultationType;
  category: string;
  status: ConsultationStatus;
  citizenDescription: string;
  aiCategory?: string;
  aiCategorySummary?: string;
  displayedRate: number | null;
  lawyerRate: number | null;
  rating: number | null;
  ratingComment: string | null;
  proBonoMinutes: number;
  matchAttempts: number;
  documentUrls: string[];
  createdAt: firebase.firestore.Timestamp;
  matchedAt: firebase.firestore.Timestamp | null;
  matchExpiresAt: firebase.firestore.Timestamp | null;
  activatedAt: firebase.firestore.Timestamp | null;
  completedAt: firebase.firestore.Timestamp | null;
  cancelledAt: firebase.firestore.Timestamp | null;
  cancelReason: string | null;
}

export interface ConsultationMessage {
  id: string;
  senderId: string;
  senderRole: 'citizen' | 'lawyer' | 'system';
  content: string;
  contentType: 'text' | 'document' | 'image' | 'system';
  documentUrl?: string;
  documentName?: string;
  timestamp: firebase.firestore.Timestamp;
  readAt: firebase.firestore.Timestamp | null;
}

// ─── Cloud Function callables ─────────────────────────────────────────────────

export async function callCreateConsultation(payload: {
  description: string;
  category?: string;
  type: ConsultationType;
  documentUrls?: string[];
}): Promise<{ consultationId: string; aiCategory: string; aiSummary: string; status: string }> {
  const fn = functions.httpsCallable('ibp_createConsultation');
  const result = await fn(payload);
  return result.data as { consultationId: string; aiCategory: string; aiSummary: string; status: string };
}

export async function callCancelConsultation(
  consultationId: string,
  reason?: string,
): Promise<void> {
  const fn = functions.httpsCallable('ibp_cancelConsultation');
  await fn({ consultationId, reason });
}

export async function callRateConsultation(
  consultationId: string,
  rating: number,
  comment?: string,
): Promise<void> {
  const fn = functions.httpsCallable('ibp_rateConsultation');
  await fn({ consultationId, rating, comment });
}

// ─── Legal AI triage ──────────────────────────────────────────────────────────
// Direct Flowise call from the citizen app (triage only — not privileged).
// Conversation is NOT logged to Firestore (per spec).

const FLOWISE_URL  = process.env.EXPO_PUBLIC_FLOWISE_API_URL ?? '';
const FLOWISE_KEY  = process.env.EXPO_PUBLIC_FLOWISE_API_KEY ?? '';
const IBP_CHATFLOW = 'a699f292-1f81-4438-b7f7-b0ee48f86c1d';

const SYSTEM_CONTEXT = `System: You are the AERIS Legal Assistant, an AI tool that provides general legal information to Filipino citizens. You are NOT a lawyer and you do NOT provide legal advice. You help citizens understand their basic rights and suggest which type of lawyer they should consult. Always respond in the language the citizen uses (Filipino or English). Always end your response with: "Ito ay pangkalahatang impormasyon lamang at hindi legal na payo. / This is general information only and not legal advice." If the concern involves immediate danger, domestic violence, or threats to life, direct the citizen to call 911 or their local police station immediately, then suggest consulting a lawyer.`;

export async function queryLegalAITriage(question: string): Promise<string> {
  if (!FLOWISE_URL || !FLOWISE_KEY) {
    return 'Legal AI is currently unavailable. Proceed with your consultation request and a lawyer will assist you.\n\nIto ay pangkalahatang impormasyon lamang at hindi legal na payo. / This is general information only and not legal advice.';
  }
  try {
    const response = await fetch(`${FLOWISE_URL}/api/v1/prediction/${IBP_CHATFLOW}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FLOWISE_KEY}` },
      body: JSON.stringify({ question: `${SYSTEM_CONTEXT}\n\nCitizen question: ${question}` }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as { text?: string };
    return data.text ?? 'No response. Please try again.\n\nIto ay pangkalahatang impormasyon lamang at hindi legal na payo. / This is general information only and not legal advice.';
  } catch {
    return 'Legal AI is temporarily unavailable.\n\nIto ay pangkalahatang impormasyon lamang at hindi legal na payo. / This is general information only and not legal advice.';
  }
}

// ─── Firestore listeners ──────────────────────────────────────────────────────

/** Listen to a single consultation document */
export function listenToConsultation(
  consultationId: string,
  onData: (c: Consultation) => void,
): () => void {
  return db.collection('consultations').doc(consultationId)
    .onSnapshot((snap) => {
      if (snap.exists) {
        onData({ id: snap.id, ...snap.data() } as Consultation);
      }
    });
}

/** Listen to messages in a consultation (attorney-client privilege — citizen only) */
export function listenToConsultationMessages(
  consultationId: string,
  onData: (messages: ConsultationMessage[]) => void,
): () => void {
  return db.collection('consultations').doc(consultationId).collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot((snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConsultationMessage)));
    });
}

/** Listen to all consultations for this citizen */
export function listenToCitizenConsultations(
  citizenId: string,
  onData: (items: Consultation[]) => void,
): () => void {
  return db.collection('consultations')
    .where('citizenId', '==', citizenId)
    .orderBy('createdAt', 'desc')
    .onSnapshot((snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Consultation)));
    });
}

/** Send a text message as the citizen */
export async function sendCitizenMessage(
  consultationId: string,
  citizenId: string,
  content: string,
): Promise<void> {
  await db.collection('consultations').doc(consultationId).collection('messages').add({
    senderId: citizenId,
    senderRole: 'citizen',
    content,
    contentType: 'text',
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    readAt: null,
  });
}

/** Upload a file and send it as a message */
export async function sendCitizenImageMessage(
  consultationId: string,
  citizenId: string,
  fileUri: string,
  fileName: string,
  fileType: string,
): Promise<void> {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const docId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const storagePath = `consultations/${consultationId}/docs/${docId}/${fileName}`;
  const ref = storage.ref(storagePath);
  await ref.put(blob, { contentType: fileType });
  const downloadUrl = await ref.getDownloadURL();

  const isImage = fileType.startsWith('image/');
  await db.collection('consultations').doc(consultationId).collection('messages').add({
    senderId: citizenId,
    senderRole: 'citizen',
    content: isImage ? '[Image]' : `[Document: ${fileName}]`,
    contentType: isImage ? 'image' : 'document',
    documentUrl: downloadUrl,
    documentName: fileName,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    readAt: null,
  });
}

/** Upload files before creating consultation (pre-flight uploads) */
export async function uploadConsultationDocument(
  fileUri: string,
  fileName: string,
  fileType: string,
  consultationId = 'preflight',
): Promise<string> {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const docId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const ref = storage.ref(`consultations/${consultationId}/docs/${docId}/${fileName}`);
  await ref.put(blob, { contentType: fileType });
  return ref.getDownloadURL();
}
