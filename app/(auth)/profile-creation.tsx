import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { saveUserProfile, getUserProfile } from '../../services/userService';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileCreationScreen() {
    const router = useRouter();
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [loading, setLoading] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        const currentUser = auth().currentUser;
        if (!currentUser) {
            // Should not happen if protected by _layout, but good for safety
            router.replace('/(auth)/login');
            return;
        }
        setUser(currentUser);
        // Pre-fill email/phone if available
        if (currentUser.email && !currentUser.email.endsWith('@aeris.test')) {
            setEmail(currentUser.email);
        }
    }, []);

    const handleSaveProfile = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Missing Information', 'Please enter your first and last name.');
            return;
        }

        if (!email.trim()) {
            Alert.alert('Missing Information', 'Please enter your email address.');
            return;
        }

        setLoading(true);

        try {
            await saveUserProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                address: address.trim(),
                updatedAt: new Date(),
            }, user?.uid);

            console.log('✅ Profile created successfully');

            // Navigate to security setup
            router.replace('/(auth)/security-setup');

        } catch (error: any) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.header}>
                        <Text style={styles.title}>Complete Your Profile</Text>
                        <Text style={styles.subtitle}>
                            Tell us a bit about yourself to get started with AERIS.
                        </Text>
                    </View>

                    <View style={styles.formContainer}>

                        {/* Phone Number (Read Only) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={user?.phoneNumber || ''}
                                editable={false}
                            />
                        </View>

                        {/* First Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Juan"
                                placeholderTextColor={theme.colors.textLight}
                                value={firstName}
                                onChangeText={setFirstName}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Last Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Dela Cruz"
                                placeholderTextColor={theme.colors.textLight}
                                value={lastName}
                                onChangeText={setLastName}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="juan@example.com"
                                placeholderTextColor={theme.colors.textLight}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Address (Optional) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Home Address (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Unit 123, Building Name, Street, City"
                                placeholderTextColor={theme.colors.textLight}
                                value={address}
                                onChangeText={setAddress}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSaveProfile}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={theme.colors.white} />
                            ) : (
                                <Text style={styles.buttonText}>Save Profile</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
    },
    header: {
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        lineHeight: 22,
    },
    formContainer: {
        marginBottom: theme.spacing.xl,
    },
    inputGroup: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    required: {
        color: theme.colors.error,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        backgroundColor: theme.colors.surface,
    },
    disabledInput: {
        backgroundColor: theme.colors.border,
        color: theme.colors.textSecondary,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    footer: {
        marginTop: 'auto',
        marginBottom: theme.spacing.xl,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        ...theme.shadows.md,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
    },
});
