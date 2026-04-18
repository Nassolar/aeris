import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Modal,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function LockScreen() {
    const { isLocked, setLocked, verifyPin, isBiometricsEnabled, hasPin } = useAuthStore();
    const [pin, setPin] = useState('');

    useEffect(() => {
        if (isLocked) {
            setPin('');
            if (isBiometricsEnabled) {
                authenticateBiometrics();
            }
        }
    }, [isLocked, isBiometricsEnabled]);

    const authenticateBiometrics = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock AERIS',
                fallbackLabel: 'Use PIN',
            });

            if (result.success) {
                setLocked(false);
            }
        } catch (error) {
            console.error('Biometric auth failed', error);
        }
    };

    const handleNumberPress = async (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);

            if (newPin.length === 4) {
                // Verify PIN
                const isValid = await verifyPin(newPin);
                if (isValid) {
                    setTimeout(() => {
                        setLocked(false);
                        setPin('');
                    }, 100);
                } else {
                    Alert.alert('Error', 'Incorrect PIN');
                    setPin('');
                }
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    if (!isLocked) return null;

    return (
        <Modal visible={isLocked} animationType="fade" transparent={false}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={40} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.title}>AERIS Locked</Text>
                    <Text style={styles.subtitle}>Enter PIN to unlock</Text>
                </View>

                <View style={styles.pinDisplay}>
                    <View style={styles.dotsContainer}>
                        {[0, 1, 2, 3].map((i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    i < pin.length && styles.dotFilled,
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Keypad */}
                <View style={styles.keypad}>
                    {[
                        ['1', '2', '3'],
                        ['4', '5', '6'],
                        ['7', '8', '9'],
                        ['biometric', '0', 'delete']
                    ].map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.keypadRow}>
                            {row.map((key, keyIndex) => (
                                <TouchableOpacity
                                    key={keyIndex}
                                    style={[
                                        styles.key,
                                        key === 'biometric' && !isBiometricsEnabled && styles.keyHidden
                                    ]}
                                    onPress={() => {
                                        if (key === 'delete') handleDelete();
                                        else if (key === 'biometric') authenticateBiometrics();
                                        else handleNumberPress(key);
                                    }}
                                    disabled={key === 'biometric' && !isBiometricsEnabled}
                                >
                                    {key === 'delete' ? (
                                        <Ionicons name="backspace-outline" size={28} color={theme.colors.text} />
                                    ) : key === 'biometric' ? (
                                        <Ionicons name="finger-print" size={32} color={theme.colors.primary} />
                                    ) : (
                                        <Text style={styles.keyText}>{key}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    pinDisplay: {
        alignItems: 'center',
        marginBottom: 60,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 24,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.textSecondary,
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    keypad: {
        paddingHorizontal: 40,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    keypadRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    key: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    keyHidden: {
        opacity: 0,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '500',
        color: theme.colors.text,
    },
});
