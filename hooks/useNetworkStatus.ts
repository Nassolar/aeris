import { useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { processQueue } from '../services/offlineQueueService';

/**
 * Listens for network reconnection and triggers background queue sync.
 * Mount this once in the root layout — it needs no return value for callers.
 */
export function useNetworkSync(): void {
  useEffect(() => {
    let wasOffline = false;

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isOnline = state.isConnected === true && state.isInternetReachable === true;

      if (isOnline && wasOffline) {
        // Connection just restored — drain the queue
        processQueue();
      }

      wasOffline = !isOnline;
    });

    return () => unsubscribe();
  }, []);
}
