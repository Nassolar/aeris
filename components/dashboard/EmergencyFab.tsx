import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    withRepeat,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

interface Props {
    isActive: boolean;
    onPress: () => void;
    children: React.ReactNode;
}

type SOSState = 'IDLE' | 'REVEALED' | 'COUNTDOWN';

export default function EmergencyFab({ isActive, onPress, children }: Props) {
    const [status, setStatus] = useState<SOSState>('IDLE');
    const [timer, setTimer] = useState(9);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Animation Values
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    // Countdown Pulse
    const ringScale = useSharedValue(1);
    const ringOpacity = useSharedValue(0.5);
    const buttonScale = useSharedValue(1); // Heartbeat

    const resetState = useCallback(() => {
        setStatus('IDLE');
        scale.value = withTiming(0);
        opacity.value = withTiming(0);
        translateY.value = withTiming(20);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimer(9);
        // Reset Pulse
        ringScale.value = 1;
        ringOpacity.value = 0.5;
        buttonScale.value = 1;
    }, []);

    const finalizeGesture = () => {
        if (status === 'REVEALED') {
            setTimeout(() => {
                setStatus(current => {
                    if (current === 'REVEALED') {
                        resetState();
                        return 'IDLE';
                    }
                    return current;
                });
            }, 3000);
        }
    };

    const handleLongPress = Gesture.LongPress()
        .minDuration(500)
        .shouldCancelWhenOutside(true)
        .onStart(() => {
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
            runOnJS(setStatus)('REVEALED');

            // Pop Up Animation (Spring)
            scale.value = withSpring(1, { damping: 12 });
            opacity.value = withTiming(1);
            translateY.value = withSpring(-85, { damping: 12 });
        })
        .onFinalize(() => {
            runOnJS(finalizeGesture)();
        });

    const handleTap = Gesture.Tap()
        .onEnd(() => {
            runOnJS(onPress)();
        });

    const composedGesture = Gesture.Race(handleTap, handleLongPress);

    const handleSosTap = () => {
        if (status === 'REVEALED') {
            setStatus('COUNTDOWN');
            startCountdownLogic();
        } else if (status === 'COUNTDOWN') {
            // Panic Mode: Immediate Trigger
            triggerSOS();
        }
    };

    const startCountdownLogic = () => {
        // 1. Ring Pulse (Background) - BIGGER & FASTER
        ringScale.value = withRepeat(
            withTiming(2.2, { duration: 800 }), // Increased scale
            -1,
            false
        );
        ringOpacity.value = withRepeat(
            withTiming(0, { duration: 800 }),
            -1,
            false
        );

        // 2. Button Heartbeat (Foreground)
        buttonScale.value = withRepeat(
            withTiming(1.15, { duration: 400 }), // Fast throb
            -1,
            true
        );

        setTimer(9);
        intervalRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    triggerSOS();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const [showSuccess, setShowSuccess] = useState(false);

    // ... (rest of the state and handlers)

    const triggerSOS = async () => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        try {
            // FIREBASE BOOKING LOGIC
            await firestore().collection('reports').add({
                category: 'Police',
                status: 'pending',
                description: 'SOS Emergency Alert',
                reportId: `SOS-${Date.now().toString().slice(-6)}`,
                timestamp: firestore.FieldValue.serverTimestamp(),
                userId: auth().currentUser?.uid || 'anonymous',
                updatedAt: firestore.FieldValue.serverTimestamp(),
                location: {
                    latitude: 0,
                    longitude: 0,
                    address: 'Current Location'
                }
            });

            // Show Custom Success Message
            resetState(); // Reset Pulse/Timers
            setShowSuccess(true);

            // Auto-Dismiss after 9 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 9000);

        } catch (error) {
            console.error("SOS Booking Failed:", error);
            Alert.alert("Error", "Could not create booking. Please call 911.");
            resetState();
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
            { translateX: -70 } // Center relative to FAB if needed or 0 if centered
        ],
        opacity: opacity.value,
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }],
        opacity: ringOpacity.value,
    }));

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }]
    }));

    return (
        <View style={styles.container}>
            {/* SUCCESS OVERLAY */}
            {showSuccess && (
                <Animated.View exiting={FadeOut} entering={FadeIn} style={styles.successOverlay}>
                    <View style={styles.successBox}>
                        <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                        <Text style={styles.successTitle}>SOS SENT</Text>
                        <Text style={styles.successMessage}>
                            Request sent. Watch for a call or text. We are dispatching units to your location if we do not hear from you.
                        </Text>
                        <TouchableOpacity onPress={() => setShowSuccess(false)} style={styles.dismissBtn}>
                            <Text style={styles.dismissText}>DISMISS</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            {/* SOS POPUP (Absolute) */}
            <Animated.View style={[styles.sosContainer, animatedStyle]}>
                {status === 'COUNTDOWN' ? (
                    <View style={styles.countdownContainer}>
                        <Animated.View style={[styles.pulseRing, ringStyle]} />
                        <Animated.View style={buttonStyle}>
                            <TouchableOpacity onPress={handleSosTap} activeOpacity={1} style={styles.sosButtonActive}>
                                <Ionicons name="alert-circle-outline" size={38} color="#FFF" style={{ marginBottom: -4 }} />
                                <Text style={styles.sosText}>{timer}s</Text>
                                <Text style={styles.sosSubText}>TO CANCEL</Text>
                            </TouchableOpacity>
                        </Animated.View>
                        <Text style={styles.statusText}>TAP SOS AGAIN TO REQUEST HELP</Text>
                    </View>
                ) : (
                    <TouchableOpacity onPress={handleSosTap} activeOpacity={0.8} style={styles.sosButtonIdle}>
                        <Ionicons name="finger-print" size={40} color="#FFF" />
                        <Text style={styles.sosLabel}>SOS</Text>
                    </TouchableOpacity>
                )}
                {status === 'REVEALED' && (
                    <Text style={styles.statusText}>TAP SOS AGAIN TO REQUEST HELP</Text>
                )}
            </Animated.View>

            <GestureDetector gesture={composedGesture}>
                <View style={styles.triggerContainer}>
                    <View>
                        {children}
                    </View>
                </View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    // ... Existing Styles ...
    triggerContainer: {
        // Wrapper
    },
    sosContainer: {
        position: 'absolute',
        bottom: 25,
        alignItems: 'center',
        zIndex: 1000,
        width: 200,
        overflow: 'visible',
    },
    sosButtonIdle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: 8,
    },
    sosLabel: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 20,
        marginTop: 2,
    },
    countdownContainer: {
        alignItems: 'center',
        marginBottom: 8,
        overflow: 'visible',
    },
    sosButtonActive: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 5,
        borderColor: '#FFF',
    },
    pulseRing: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        zIndex: -1,
    },
    sosText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
    },
    sosSubText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 0,
    },
    statusText: {
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        fontSize: 10,
        marginTop: 4,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    // NEW STYLES
    successOverlay: {
        position: 'absolute',
        bottom: 0,
        left: -150, // Center relative to container if container is small, or specialized positioning
        width: 300,
        alignItems: 'center',
        zIndex: 2000, // Top of everything
    },
    successBox: {
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 20
    },
    successTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        marginTop: 10,
        marginBottom: 5
    },
    successMessage: {
        color: '#cbd5e1',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 20
    },
    dismissBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20
    },
    dismissText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    }
});
