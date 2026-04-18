export type DispatchUnit = 'Police' | 'Medical' | 'Fire' | 'Rescue';

export interface SOSLocation {
  lat: number;
  lng: number;
  address: string | null;
  barangay: string | null;
}

export interface ConductorAIClassification {
  dispatchUnits: DispatchUnit[];
  primaryUnit: DispatchUnit;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  needsReview: boolean;
}

export interface SOSIncidentPayload {
  citizenId: string;
  citizenName: string;
  voiceCaptured: boolean;
}
