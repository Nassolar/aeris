import { useState, useRef } from 'react';
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
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { theme } from '../../constants/theme';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { phoneNumber, verificationId } = useLocalSearchParams<{
    phoneNumber: string;
    verificationId?: string;
  }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const otpArray = value.slice(0, 6).split('');
      const newOtp = [...otp];
      otpArray.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);

      // Focus last filled input
      const lastFilledIndex = Math.min(index + otpArray.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const otpCode = otp.join('');

      if (otpCode.length !== 6) {
        Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code.');
        return;
      }

      if (!verificationId) {
        Alert.alert('Error', 'Verification ID not found. Please try logging in again.');
        return;
      }

      setLoading(true);

      console.log('🔐 Verifying OTP with Firebase Phone Auth');

      // Create credential with verification ID and OTP using native Firebase
      const credential = auth.PhoneAuthProvider.credential(verificationId, otpCode);

      // Sign in with credential
      const userCredential = await auth().signInWithCredential(credential);
      const user = userCredential.user;

      console.log('✅ Phone Auth successful:', user.uid);

      // Create or update user document in Firestore (using native SDK)
      const userRef = firestore().collection('users').doc(user.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // New user - create document
        await userRef.set({
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
          displayName: null,
          photoURL: null,
          role: 'customer',
          isOnline: false,
        });
        console.log('✅ New user created in Firestore:', user.uid);
      } else {
        // Existing user - update last login
        await userRef.set({
          updatedAt: firestore.FieldValue.serverTimestamp(),
          lastLoginAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log('✅ Existing user updated:', user.uid);
      }

      // Auth listener in _layout.tsx will handle navigation
      console.log('✅ Authentication successful');
      setLoading(false);

    } catch (error: unknown) {
      setLoading(false);
      console.error('OTP verification error:', error);

      // User-friendly error messages
      let errorMessage = 'Invalid verification code. Please try again.';

      if (error instanceof Error) {
        const errorCode = (error as { code?: string }).code;
        if (errorCode === 'auth/invalid-verification-code') {
          errorMessage = 'The code you entered is incorrect. Please try again.';
        } else if (errorCode === 'auth/code-expired') {
          errorMessage = 'This code has expired. Please request a new one.';
        } else if (errorCode === 'auth/too-many-requests') {
          errorMessage = 'Too many attempts. Please try again later.';
        }
      }

      Alert.alert('Verification Failed', errorMessage);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);

      if (!phoneNumber) {
        Alert.alert('Error', 'Phone number not found.');
        setLoading(false);
        return;
      }

      // Resend OTP using native Firebase
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);

      // Navigate back to this screen with new verificationId
      router.setParams({ verificationId: confirmation.verificationId });

      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend code. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a code to {phoneNumber}
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) {
                  inputRefs.current[index] = ref;
                }
              }}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled
              ]}
              value={digit}
              onChangeText={(value) => handleOTPChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        {/* Resend */}
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendOTP}
          disabled={loading}
        >
          <Text style={styles.resendText}>Didn't receive the code? Resend</Text>
        </TouchableOpacity>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.buttonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
  },
  backButton: {
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  backButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  header: {
    marginBottom: theme.spacing.xxl,
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
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    textAlign: 'center',
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  otpInputFilled: {
    borderColor: theme.colors.primary,
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  resendText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
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
