import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AppState,
  ActivityIndicator,
  PanResponder,
  type AppStateStatus,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { MicIcon } from '../icons/WireframeIcons';
import { EmergencyService } from '../../services/emergencyService';
import { transcribeAudio } from '../../services/speechToTextService';
import { classifyEmergency } from '../../services/conductorAIService';
import auth from '@react-native-firebase/auth';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const CIRCLE_RADIUS = 28;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const SOS_RED = '#CD0E11';

type SOSState = 'IDLE' | 'HOLDING' | 'COMMITTED' | 'PROCESSING';

const runPipeline = async (
  incidentId: string,
  audioUri: string,
): Promise<void> => {
  try {
    const { audioUrl, audioHash } = await EmergencyService.uploadSOSAudio(incidentId, audioUri);
    await EmergencyService.updateIncidentWithAudio(incidentId, audioUrl, audioHash);
    const transcript = await transcribeAudio(audioUri);
    if (!transcript) return;
    const classification = await classifyEmergency(transcript, audioUrl, incidentId);
    if (classification) {
      await EmergencyService.updateIncidentWithClassification(incidentId, transcript, classification);
    }
  } catch (err) {
    console.error('[SOSBar] Pipeline error:', err);
  }
};

export default function SOSBar() {
  const router = useRouter();
  const [state, setState] = useState<SOSState>('IDLE');
  const [subLabel, setSubLabel] = useState('Hold 3 Seconds · State your emergency');

  // Refs so timers/callbacks always see fresh values without stale closures
  const stateRef = useRef<SOSState>('IDLE');
  const timer3s = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer6s = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recording = useRef<Audio.Recording | null>(null);
  const startTime = useRef<number>(0);
  const isActive = useRef(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const ringGlowAnim = useRef(new Animated.Value(1)).current;

  const setSOSState = (s: SOSState) => {
    stateRef.current = s;
    setState(s);
  };

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next !== 'active' && isActive.current) cancelHold();
    });
    return () => {
      sub.remove();
      clearTimers();
      recording.current?.stopAndUnloadAsync();
    };
  }, []);

  const clearTimers = () => {
    if (timer3s.current) { clearTimeout(timer3s.current); timer3s.current = null; }
    if (timer6s.current) { clearTimeout(timer6s.current); timer6s.current = null; }
  };

  const resetUI = () => {
    isActive.current = false;
    setSOSState('IDLE');
    setSubLabel('Hold 3 Seconds · State your emergency');
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    ringGlowAnim.stopAnimation();
    ringGlowAnim.setValue(1);
    startTime.current = 0;
  };

  const cancelHold = async () => {
    clearTimers();
    if (recording.current) {
      await recording.current.stopAndUnloadAsync().catch(() => null);
      recording.current = null;
    }
    resetUI();
  };

  const startRecording = async () => {
    if (recording.current) return; // Guard: only one recording at a time
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return; // Scenario A — dispatch proceeds without audio
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recording.current = rec;
    } catch (err) {
      console.error('[SOSBar] Recording start error:', err);
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recording.current) return null;
    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;
      return uri ?? null;
    } catch {
      recording.current = null;
      return null;
    }
  };

  const commitSOS = () => {
    if (!isActive.current) return;
    setSOSState('COMMITTED');
    setSubLabel('Emergency confirmed · Keep speaking...');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Ring switches to pulsing glow — keep progress ring full (value stays at 1)
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringGlowAnim, { toValue: 0.15, duration: 500, useNativeDriver: false }),
        Animated.timing(ringGlowAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      ]),
    ).start();
  };

  const processDispatch = async () => {
    if (stateRef.current === 'PROCESSING') return;
    clearTimers();
    isActive.current = false;
    setSOSState('PROCESSING');
    setSubLabel('');
    ringGlowAnim.stopAnimation();

    const uri = await stopRecording();
    const voiceCaptured = !!uri;

    try {
      const user = auth().currentUser;
      const { incidentId, caseNumber } = await EmergencyService.createIncident(
        user?.uid ?? 'anonymous',
        user?.displayName ?? 'Citizen',
        voiceCaptured,
      );

      if (voiceCaptured && uri) {
        runPipeline(incidentId, uri); // fire-and-forget parallel track
      }

      resetUI();
      router.push({ pathname: '/incident/[id]', params: { id: incidentId, caseNumber } });
    } catch (err) {
      console.error('[SOSBar] Dispatch error:', err);
      resetUI();
    }
  };

  const handlePressIn = () => {
    if (stateRef.current === 'PROCESSING') return;
    isActive.current = true;
    setSOSState('HOLDING');
    setSubLabel('Speak now — recording...');
    startTime.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Recording starts immediately — fire-and-forget
    startRecording();

    // Ring fills 0→100% over 3 seconds
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // At 3s: commit (emergency locked in, strong haptic, pulsing ring)
    timer3s.current = setTimeout(() => commitSOS(), 3000);

    // At 6s: auto-dispatch (user still holding)
    timer6s.current = setTimeout(() => processDispatch(), 6000);
  };

  const handlePressOut = async () => {
    const current = stateRef.current;
    if (current === 'PROCESSING' || current === 'IDLE') return;
    clearTimers();

    const duration = Date.now() - startTime.current;

    if (duration < 1500) {
      // Silent cancel — discard audio, no toast
      await cancelHold();
      return;
    }

    if (duration < 3000) {
      // Early release — discard audio, show warning toast
      if (recording.current) {
        await recording.current.stopAndUnloadAsync().catch(() => null);
        recording.current = null;
      }
      progressAnim.stopAnimation();
      Animated.timing(progressAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
      isActive.current = false;
      setSOSState('IDLE');
      setSubLabel('Hold for 3 full seconds to activate emergency');
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSubLabel('Hold 3 Seconds · State your emergency'), 3000);
      return;
    }

    // Released at 3s–6s — dispatch with whatever audio was captured
    await processDispatch();
  };

  // PanResponder is used instead of Pressable because state updates cause
  // Pressable to lose the gesture on Android — PanResponder is re-render safe.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => stateRef.current !== 'PROCESSING',
      onPanResponderGrant: () => handlePressIn(),
      onPanResponderRelease: () => handlePressOut(),
      onPanResponderTerminate: () => cancelHold(), // e.g. another gesture steals it
    }),
  ).current;

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCLE_CIRCUMFERENCE, 0],
  });

  const isIdle = state === 'IDLE';
  const iconColor = isIdle ? SOS_RED : '#ffffff';
  const ringTrack = isIdle ? 'rgba(205,14,17,0.15)' : 'rgba(255,255,255,0.2)';
  const ringStroke = isIdle ? SOS_RED : '#ffffff';

  return (
    <View style={styles.container}>
      <Text style={styles.crimeWarning}>
        Reporting a fake emergency is a crime
      </Text>
      <View
        style={[styles.button, isIdle ? styles.buttonIdle : styles.buttonActive]}
        {...panResponder.panHandlers}
      >
        <View style={styles.contentRow}>
          <View style={styles.iconContainer}>
            <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
              <Circle
                cx="32"
                cy="32"
                r={CIRCLE_RADIUS}
                stroke={ringTrack}
                strokeWidth={3}
              />
              <AnimatedCircle
                cx="32"
                cy="32"
                r={CIRCLE_RADIUS}
                stroke={ringStroke}
                strokeWidth={3}
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
                opacity={ringGlowAnim}
              />
            </Svg>
            <View style={styles.innerIcon}>
              {state === 'PROCESSING' ? (
                <ActivityIndicator color={iconColor} size="small" />
              ) : (
                <MicIcon color={iconColor} size={24} />
              )}
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, isIdle ? styles.titleDark : styles.titleLight]}>
              {state === 'PROCESSING' ? 'Sending...' : 'EMERGENCY SOS'}
            </Text>
            {subLabel ? (
              <Text style={[styles.subtitle, isIdle ? styles.subtitleDark : styles.subtitleLight]}>
                {subLabel}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  crimeWarning: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(205, 14, 17, 0.7)',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  button: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIdle: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(205, 14, 17, 0.2)',
  },
  buttonActive: {
    backgroundColor: SOS_RED,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  innerIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  titleDark: {
    color: '#1a1a1a',
  },
  titleLight: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  subtitleDark: {
    color: 'rgba(26, 26, 26, 0.65)',
  },
  subtitleLight: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
