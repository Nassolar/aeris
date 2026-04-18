import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getUserProfile } from '../services/userService';
import { InactivityProvider } from '../components/auth/InactivityProvider';
import LockScreen from '../components/auth/LockScreen';
import { processQueue } from '../services/offlineQueueService';
import { useNetworkSync } from '../hooks/useNetworkStatus';
import { NetworkStatusBar } from '../components/NetworkStatusBar';
import * as Notifications from 'expo-notifications';
import { FeatureFlagsProvider } from '../context/FeatureFlagsContext';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);

  // Drain offline queue on app start
  useEffect(() => {
    processQueue();
  }, []);

  // Route BOLO push notifications to the correct screen
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.screen === 'BOLOAlert' && data?.boloId) {
        router.push(`/bolo/${data.boloId}`);
      }
    });
    return () => subscription.remove();
  }, []);

  // Drain queue whenever network reconnects
  useNetworkSync();

  const [isProfileChecking, setIsProfileChecking] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      // Reset navigation flag when auth state changes
      hasNavigated.current = false;

      setUser(currentUser);
      if (currentUser) {
        setIsProfileChecking(true);
        try {
          const profile = await getUserProfile();
          if (profile?.firstName && profile?.lastName) {
            setProfileComplete(true);
          } else {
            setProfileComplete(false);
          }
        } catch (e) {
          console.error("Profile check failed", e);
          setProfileComplete(false);
        } finally {
          setIsProfileChecking(false);
        }
      } else {
        setProfileComplete(false);
        setIsProfileChecking(false);
      }
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing || isProfileChecking || hasNavigated.current) return;

    const segmentArray = segments as string[];
    const inAuthGroup = segmentArray[0] === '(auth)';
    const inProfileCreation = segmentArray.length > 1 && segmentArray[1] === 'profile-creation';
    // Helper to perform navigation safely
    const navTo = (path: any) => {
      hasNavigated.current = true;
      router.replace(path);
    };

    if (user) {
      if (profileComplete) {
        if (inAuthGroup) {
          navTo('/(tabs)');
        }
      } else {
        // Profile not complete
        if (!inProfileCreation) {
          navTo('/(auth)/profile-creation');
        }
      }
    } else if (!user && !inAuthGroup) {
      navTo('/(auth)/login');
    }
  }, [user, initializing, isProfileChecking, profileComplete, segments]);

  if (initializing || (user && isProfileChecking)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color={Colors.primary || '#FFF'} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FeatureFlagsProvider>
        <InactivityProvider>
          <NetworkStatusBar />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="kyc" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="city" options={{ headerShown: false }} />
          </Stack>
          <LockScreen />
        </InactivityProvider>
      </FeatureFlagsProvider>
    </GestureHandlerRootView>
  );
}
