import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function SecuritySetupScreen() {
    const router = useRouter();
    const { setPin, enableBiometrics } = useAuthStore();

    const [pin, setPinCode] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [biometricsAvailable, setBiometricsAvailable] = useState(false);
    const [useBiometrics, setUseBiometrics] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricsAvailable(hasHardware && isEnrolled);
    };

    const handleNumberPress = (num: string) => {
        if (step === 'create') {
            if (pin.length < 4) setPinCode(prev => prev + num);
            if (pin.length + 1 === 4) setStep('confirm');
        } else {
            if (confirmPin.length < 4) setConfirmPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (step === 'create') {
            setPinCode(prev => prev.slice(0, -1));
        } else {
            setConfirmPin(prev => prev.slice(0, -1));
            if (confirmPin.length === 0) {
                setStep('create');
                setPinCode('');
            }
        }
    };

    const handleSave = async () => {
        // Validate PINs match
        if (pin !== confirmPin) {
            Alert.alert('Error', 'PINs do not match. Please try again.');
            setPinCode('');
            setConfirmPin('');
            setStep('create');
            return;
        }

        if (pin.length !== 4) {
            Alert.alert('Error', 'PIN must be 4 digits.');
            return;
        }

        setLoading(true);
        try {
            await setPin(pin);

            if (useBiometrics) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Authenticate to enable biometrics',
                });

                if (result.success) {
                    enableBiometrics(true);
                } else {
                    Alert.alert('Warning', 'Biometric authentication failed. Biometrics will be disabled.');
                    enableBiometrics(false);
                }
            } else {
                enableBiometrics(false);
            }

            Alert.alert('Success', 'Security settings saved!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (error) {
            console.error('Error saving security settings:', error);
            Alert.alert('Error', 'Failed to save settings.');
        } finally {
            setLoading(false);
        }
    };

    const renderPinDots = (value: string) => (
        <View style={styles.dotsContainer}>
            {[0, 1, 2, 3].map((i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        i < value.length && styles.dotFilled,
                        step === 'confirm' && i < confirmPin.length && styles.dotFilledConfirm,
                    ]}
                />
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Secure Your Account</Text>
                <Text style={styles.subtitle}>
                    {step === 'create' ? 'Create a 4-digit PIN' : 'Confirm your PIN'}
                </Text>
            </View>

            <View style={styles.pinDisplay}>
                {renderPinDots(step === 'create' ? pin : confirmPin)}
            </View>

            <View style={styles.controlsContainer}>
                {biometricsAvailable && step === 'confirm' && confirmPin.length === 4 && (
                    <View style={styles.biometricRow}>
                        <Text style={styles.biometricText}>Enable Biometrics (FaceID/TouchID)</Text>
                        <Switch
                            value={useBiometrics}
                            onValueChange={setUseBiometrics}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                        />
                    </View>
                )}

                {step === 'confirm' && confirmPin.length === 4 && (
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Set PIN & Continue</Text>}
                    </TouchableOpacity>
                )}
            </View>

            {/* Keypad */}
            <View style={styles.keypad}>
                {[
                    ['1', '2', '3'],
                    ['4', '5', '6'],
                    ['7', '8', '9'],
                    ['', '0', 'delete']
                ].map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.keypadRow}>
                        {row.map((key, keyIndex) => (
                            <TouchableOpacity
                                key={keyIndex}
                                style={[styles.key, key === '' && styles.keyEmpty]}
                                onPress={() => {
                                    if (key === 'delete') handleDelete();
                                    else if (key !== '') handleNumberPress(key);
                                }}
                                disabled={key === ''}
                            >
                                {key === 'delete' ? (
                                    <Ionicons name="backspace-outline" size={28} color={theme.colors.text} />
                                ) : (
                                    <Text style={styles.keyText}>{key}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingTop: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        marginTop: 40,
    },
    title: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    pinDisplay: {
        marginTop: 40,
        alignItems: 'center',
        marginBottom: 40,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.textSecondary,
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    dotFilledConfirm: {
        backgroundColor: theme.colors.success,
        borderColor: theme.colors.success,
    },
    controlsContainer: {
        paddingHorizontal: theme.spacing.lg,
        minHeight: 100,
        justifyContent: 'center',
    },
    biometricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    biometricText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    saveButtonText: {
        color: "#FFF",
        fontSize: theme.fontSize.lg,
        fontWeight: 'bold',
    },
    keypad: {
        marginTop: 'auto',
        paddingBottom: 40,
        paddingHorizontal: 40,
    },
    keypadRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    key: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    keyEmpty: {
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '500',
        color: theme.colors.text,
    },
});
