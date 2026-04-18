import React, { createContext, useContext } from 'react';
import { useFeatureFlags, isEnabled } from '../lib/featureFlags';
import type { FeatureFlags, AppScope } from '../lib/featureFlags';

// ─── Context ──────────────────────────────────────────────────────────────────

interface FeatureFlagsContextValue {
  flags: FeatureFlags | null;
  loading: boolean;
  isEnabled: <S extends AppScope>(scope: S, key: keyof FeatureFlags[S]) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const { flags, loading } = useFeatureFlags();

  const check = <S extends AppScope>(scope: S, key: keyof FeatureFlags[S]): boolean =>
    isEnabled(flags, scope, key);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, isEnabled: check }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

export function useFlags(): FeatureFlagsContextValue {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) {
    throw new Error('useFlags must be used within a <FeatureFlagsProvider>');
  }
  return ctx;
}
