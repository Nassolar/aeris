import React, { useEffect, useRef } from 'react';
import {
    View,
    PanResponder,
    AppState,
    AppStateStatus,
    Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useAuthStore } from '../../store/authStore';

// 30 minutes in milliseconds
// const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export const InactivityProvider = ({ children }: { children: React.ReactNode }) => {
    const { setLocked, hasPin } = useAuthStore();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const appState = useRef(AppState.currentState);
    const lastActive = useRef(Date.now());

    const resetTimer = () => {
        lastActive.current = Date.now();
        if (timerRef.current) clearTimeout(timerRef.current);

        // If not logged in, no need to set timer
        if (!auth().currentUser) return;

        timerRef.current = setTimeout(() => {
            handleTimeout();
        }, INACTIVITY_TIMEOUT);
    };

    const handleTimeout = () => {
        if (auth().currentUser) {
            console.log("Inactivity timeout - Signing out");
            auth().signOut().then(() => {
                // Optional: Show alert
                //  Alert.alert("Session Expired", "You have been logged out due to inactivity.");
            });
        }
    };

    // PanResponder to detect touches on the screen
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponderCapture: () => {
                resetTimer();
                return false; // Don't capture, just detect
            },
        })
    ).current;

    // Handle App State Changes (Background/Foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {

            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App has come to the foreground!
                const elapsed = Date.now() - lastActive.current;
                console.log(`App foregrounded after ${elapsed / 1000}s`);

                if (elapsed > INACTIVITY_TIMEOUT) {
                    handleTimeout();
                } else if (elapsed > 30000) {
                    // Only lock if away for more than 30 seconds
                    // (camera/gallery returns quickly and shouldn't trigger lock)
                    if (auth().currentUser && hasPin) {
                        setLocked(true);
                    }
                    resetTimer();
                } else {
                    resetTimer();
                }
            } else if (nextAppState.match(/inactive|background/)) {
                // App going to background
                lastActive.current = Date.now();
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [hasPin]);

    // Initial timer start
    useEffect(() => {
        resetTimer();
    }, []);

    return (
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
            {children}
        </View>
    );
};
