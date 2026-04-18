import type { ConductorAIClassification } from '../types/voiceSOS';

const CONDUCTOR_URL = process.env.EXPO_PUBLIC_CONDUCTOR_AI_URL;
const AI_TIMEOUT_MS = 3000;

interface ConductorAIRequest {
  trigger: 'voice_sos';
  transcript: string;
  audioUrl: string;
  incidentId: string;
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

const callConductorAI = async (
  payload: ConductorAIRequest,
): Promise<ConductorAIClassification | null> => {
  if (!CONDUCTOR_URL) throw new Error('EXPO_PUBLIC_CONDUCTOR_AI_URL is not configured');

  const response = await fetch(CONDUCTOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Conductor AI error ${response.status}: ${body}`);
  }

  return (await response.json()) as ConductorAIClassification;
};

export const classifyEmergency = async (
  transcript: string,
  audioUrl: string,
  incidentId: string,
): Promise<ConductorAIClassification | null> => {
  const result = await withTimeout(
    callConductorAI({ trigger: 'voice_sos', transcript, audioUrl, incidentId }),
    AI_TIMEOUT_MS,
  );
  return result;
};
