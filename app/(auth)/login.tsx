import { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { theme } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (text: string): string => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // Format as +63 XXX XXX XXXX (Philippine format)
    if (cleaned.startsWith('63')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+63${cleaned.substring(1)}`;
    } else if (cleaned.length > 0) {
      return `+63${cleaned}`;
    }
    return '';
  };

  const handleSendOTP = async () => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      if (!formattedPhone || formattedPhone.length < 13) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid Philippine phone number.');
        return;
      }

      setLoading(true);

      console.log('📱 Sending OTP to:', formattedPhone);

      // Native Firebase Phone Auth - no reCAPTCHA needed on mobile!
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);

      console.log('✅ OTP Sent. Confirmation received.');

      setLoading(false);

      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          phoneNumber: formattedPhone,
          verificationId: confirmation.verificationId
        }
      });

    } catch (error: unknown) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code. Please try again.';
      Alert.alert('Error', errorMessage);
      console.error('Phone auth error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>

        {/* Logo/Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>AERIS</Text>
          <Text style={styles.subtitle}>Home Services & Emergency Response</Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Enter your phone number</Text>
          <Text style={styles.helperText}>
            We'll send you a verification code
          </Text>

          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+63</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="9XX XXX XXXX"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
              editable={!loading}
            />
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl * 1.5,
  },
  logo: {
    fontSize: theme.fontSize.xxxl * 1.5,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  helperText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  countryCode: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
    borderRightWidth: 2,
    borderRightColor: theme.colors.border,
  },
  countryCodeText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
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
  terms: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
});
