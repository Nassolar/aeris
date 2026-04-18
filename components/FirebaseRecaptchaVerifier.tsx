import { useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { theme } from '../constants/theme';

interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
}

interface RecaptchaVerifierHandle {
  type: 'recaptcha';
  verify: () => Promise<string>;
}

interface Props {
  firebaseConfig: FirebaseConfig;
  title?: string;
  cancelLabel?: string;
  onVerify?: (token: string) => void;
  onError?: (error: Error) => void;
}

const FirebaseRecaptchaVerifier = forwardRef<RecaptchaVerifierHandle, Props>(
  ({ firebaseConfig, title = 'Verify you are human', cancelLabel = 'Cancel', onVerify, onError }, ref) => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const resolveRef = useRef<((token: string) => void) | null>(null);
    const rejectRef = useRef<((error: Error) => void) | null>(null);

    const verify = useCallback((): Promise<string> => {
      return new Promise((resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;
        setVisible(true);
        setLoading(true);
      });
    }, []);

    // Expose verify method via ref - this makes it compatible with Firebase's ApplicationVerifier
    useImperativeHandle(ref, () => ({
      verify,
      // Firebase expects a 'type' property on ApplicationVerifier
      type: 'recaptcha',
    }), [verify]);

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'verify' && data.token) {
          setVisible(false);
          onVerify?.(data.token);
          resolveRef.current?.(data.token);
          resolveRef.current = null;
          rejectRef.current = null;
        } else if (data.type === 'error') {
          const error = new Error(data.message || 'reCAPTCHA verification failed');
          setVisible(false);
          onError?.(error);
          rejectRef.current?.(error);
          resolveRef.current = null;
          rejectRef.current = null;
        } else if (data.type === 'loaded') {
          setLoading(false);
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    }, [onVerify, onError]);

    const handleCancel = useCallback(() => {
      setVisible(false);
      const error = new Error('reCAPTCHA verification cancelled');
      rejectRef.current?.(error);
      resolveRef.current = null;
      rejectRef.current = null;
    }, []);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #recaptcha-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <div id="recaptcha-container"></div>

  <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js"></script>

  <script>
    const firebaseConfig = {
      apiKey: "${firebaseConfig.apiKey || ''}",
      authDomain: "${firebaseConfig.authDomain || ''}",
      projectId: "${firebaseConfig.projectId || ''}"
    };

    try {
      firebase.initializeApp(firebaseConfig);

      const recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'normal',
        callback: function(token) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verify', token: token }));
        },
        'expired-callback': function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'reCAPTCHA expired' }));
        }
      });

      recaptchaVerifier.render().then(function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
      });

    } catch (error) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: error.message }));
    }
  </script>
</body>
</html>
`;

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.webviewContainer}>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading verification...</Text>
              </View>
            )}
            <WebView
              source={{
                html,
                baseUrl: `https://${firebaseConfig.authDomain || 'localhost'}`
              }}
              style={styles.webview}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              incognito={false}
              originWhitelist={['*']}
              mixedContentMode="compatibility"
              cacheEnabled
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  cancelButton: {
    padding: theme.spacing.sm,
  },
  cancelText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});

export default FirebaseRecaptchaVerifier;
export type { RecaptchaVerifierHandle };
