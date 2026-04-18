import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** SHA-256 hash via Web Crypto API (supported in Hermes / Expo SDK 47+). */
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface AuthState {
  hasPin: boolean;
  isBiometricsEnabled: boolean;
  isLocked: boolean;

  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  enableBiometrics: (enabled: boolean) => void;
  setLocked: (locked: boolean) => void;
  resetAuth: () => Promise<void>;
}

// Custom storage adapter for SecureStore
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(name);
      }
      return await SecureStore.getItemAsync(name);
    } catch (e) {
      console.error('SecureStore get error:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(name, value);
        return;
      }
      await SecureStore.setItemAsync(name, value);
    } catch (e) {
      console.error('SecureStore set error:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(name);
        return;
      }
      await SecureStore.deleteItemAsync(name);
    } catch (e) {
      console.error('SecureStore delete error:', e);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      hasPin: false,
      isBiometricsEnabled: false,
      isLocked: false,

      setPin: async (pin: string) => {
        const hashed = await hashPin(pin);
        await secureStorage.setItem('user_pin', hashed);
        set({ hasPin: true });
      },

      verifyPin: async (inputPin: string) => {
        const stored = await secureStorage.getItem('user_pin');
        if (!stored) return false;
        const hashed = await hashPin(inputPin);
        return stored === hashed;
      },

      enableBiometrics: (enabled: boolean) => {
        set({ isBiometricsEnabled: enabled });
      },

      setLocked: (locked: boolean) => {
        set({ isLocked: locked });
      },

      resetAuth: async () => {
        await secureStorage.removeItem('user_pin');
        set({ hasPin: false, isBiometricsEnabled: false, isLocked: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        hasPin: state.hasPin,
        isBiometricsEnabled: state.isBiometricsEnabled
      }),
    }
  )
);
