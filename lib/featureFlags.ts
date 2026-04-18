/**
 * featureFlags.ts — Centralized Firestore-based feature flag system.
 *
 * Single onSnapshot listener (via FeatureFlagsContext) on /config/featureFlags.
 * Reads from the shared AERIS Firebase project — same document as aeris-web.
 */
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlobalFlags {
  maintenanceMode: boolean;
  betaMode: boolean;
  betaBannerMessage: string;
}

export interface CitizenFlags {
  emergencySOS: boolean;
  medicalRequest: boolean;
  policeRequest: boolean;
  fireRequest: boolean;
  rescueRequest: boolean;
  trafficViolation: boolean;
  generalEmergency: boolean;
  reportHistory: boolean;
  ibpLegalAssist: boolean;
  communityAlerts: boolean;
  kycVerification: boolean;
  rewardsWallet: boolean;
}

export interface ResponderFlags {
  receiveDispatch: boolean;
  conductorAI: boolean;
  goLiveFeed: boolean;
  boloAlerts: boolean;
  postIncidentReport: boolean;
  divisionManagement: boolean;
  teamLeaderReview: boolean;
}

export interface PartnerFlags {
  standbyShifts: boolean;
  partnerPromos: boolean;
  earningsDashboard: boolean;
  zoneManagement: boolean;
}

export interface WebFlags {
  dispatchConsole: boolean;
  systemHealthDashboard: boolean;
  hermesFeed: boolean;
  analyticsReports: boolean;
  userManagement: boolean;
  lguPortalLink: boolean;
}

export interface FeatureFlags {
  updatedAt?: unknown;
  updatedBy?: string;
  global: GlobalFlags;
  citizen: CitizenFlags;
  responder: ResponderFlags;
  partner: PartnerFlags;
  web: WebFlags;
}

export type AppScope = keyof Omit<FeatureFlags, 'updatedAt' | 'updatedBy'>;

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_FLAGS: FeatureFlags = {
  global: {
    maintenanceMode: false,
    betaMode: true,
    betaBannerMessage: 'You are on AERIS Beta v0.9. Thank you for testing!',
  },
  citizen: {
    emergencySOS: true,
    medicalRequest: true,
    policeRequest: false,
    fireRequest: false,
    rescueRequest: false,
    trafficViolation: true,
    generalEmergency: true,
    reportHistory: true,
    ibpLegalAssist: false,
    communityAlerts: false,
    kycVerification: false,
    rewardsWallet: false,
  },
  responder: {
    receiveDispatch: true,
    conductorAI: false,
    goLiveFeed: false,
    boloAlerts: false,
    postIncidentReport: true,
    divisionManagement: false,
    teamLeaderReview: false,
  },
  partner: {
    standbyShifts: true,
    partnerPromos: false,
    earningsDashboard: true,
    zoneManagement: false,
  },
  web: {
    dispatchConsole: true,
    systemHealthDashboard: true,
    hermesFeed: false,
    analyticsReports: false,
    userManagement: true,
    lguPortalLink: false,
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

export function isEnabled<S extends AppScope>(
  flags: FeatureFlags | null,
  scope: S,
  key: keyof FeatureFlags[S],
): boolean {
  const source = flags ?? DEFAULT_FLAGS;
  return Boolean((source[scope] as unknown as Record<string, boolean>)[key as string]);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFeatureFlags(): {
  flags: FeatureFlags | null;
  loading: boolean;
} {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // db is a compat Firestore instance; doc/onSnapshot from firebase/firestore
    // work with compat instances via Firebase's interop layer.
    const ref = doc(db as Parameters<typeof doc>[0], 'config', 'featureFlags');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setFlags(snap.data() as FeatureFlags);
        } else {
          setFlags(DEFAULT_FLAGS);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[FeatureFlags] onSnapshot error:', err);
        setFlags(DEFAULT_FLAGS);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { flags, loading };
}
