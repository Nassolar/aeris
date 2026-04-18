/**
 * Test Credentials for Development
 *
 * IMPORTANT: These are for DEVELOPMENT ONLY
 * Never use in production builds
 */

export const TEST_CREDENTIALS = {
  // Test Phone Number (for Firebase Phone Auth testing)
  PHONE_NUMBER: '+639175551234',

  // Test OTP Code (works in development mode)
  OTP_CODE: '123456',

  // Android App Signing Keys (for Firebase Console)
  ANDROID_KEYS: {
    SHA1: '5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25',
    SHA256: 'FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C',
  },
} as const;

// Environment variable accessors (use these in production)
export const getTestPhoneNumber = (): string => {
  return process.env.EXPO_PUBLIC_TEST_PHONE_NUMBER || TEST_CREDENTIALS.PHONE_NUMBER;
};

export const getTestOTP = (): string => {
  return process.env.EXPO_PUBLIC_TEST_OTP || TEST_CREDENTIALS.OTP_CODE;
};

// Type exports
export type TestCredentials = typeof TEST_CREDENTIALS;
