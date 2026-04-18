import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  AppState,
  type AppStateStatus,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Circle } from 'react-native-svg';
import { EmergencyService } from '../../services/emergencyService';
import { transcribeAudio } from '../../services/speechToTextService';
import { classifyEmergency } from '../../services/conductorAIService';
import { auth } from '../../firebaseConfig';

const BUTTON_SIZE = 160;
const STROKE_WIDTH = 6;
const RADIUS = (BUTTON_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SOS_RED = '#CD0E11';

type ButtonState = 'IDLE' | 'HOLDING' | 'COMMITTED' | 'PROCESSING';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const runPipeline = async (incidentId: string, audioUri: string): Promise<void> => {
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
    console.error('[SOSButton] Pipeline error:', err);
  }
};

export default function SOSButton() {
  const router = useRouter();
  const [state, setState] = useState<ButtonState>('IDLE');
  const [subLabel, setSubLabel] = useState('Hold 3 Seconds · State your emergency');

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recording = useRef<Audio.Recording | null>(null);
  const startTime = useRef<number>(0);
  const isActive = useRef(false);
  const progress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringGlowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next !== 'active' && isActive.current) cancelHold();
    });
    return () => {
      sub.remove();
      clearAllTimers();
      recording.current?.stopAndUnloadAsync();
    };
  }, []);

  const clearAllTimers = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const resetUI = () => {
    isActive.current = false;
    setState('IDLE');
    setSubLabel('Hold 3 Seconds · State your emergency');
    progress.setValue(0);
    pulseAnim.setValue(1);
    pulseAnim.stopAnimation();
    ringGlowAnim.setValue(1);
    ringGlowAnim.stopAnimation();
    startTime.current = 0;
  };

  const cancelHold = async () => {
    clearAllTimers();
    if (recording.current) {
      await recording.current.stopAndUnloadAsync().catch(() => null);
      recording.current = null;
    }
    resetUI();
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringGlowAnim, { toValue: 0.3, duration: 500, useNativeDriver: false }),
        Animated.timing(ringGlowAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      ]),
    ).start();
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recording.current = rec;
    } catch (err) {
      console.error('[SOSButton] Recording start error:', err);
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recording.current) return null;
    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;
      return uri;
    } catch {
      recording.current = null;
      return null;
    }
  };

  const handlePressIn = () => {
    if (state === 'PROCESSING') return;
    isActive.current = true;
    setState('HOLDING');
    setSubLabel('Reporting a fake emergency is a crime');
    startTime.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(progress, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true }).start();

    holdTimer.current = setTimeout(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await startRecording();
      holdTimer.current = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        holdTimer.current = setTimeout(() => commitSOS(), 1000);
      }, 1000);
    }, 1000);
  };

  const commitSOS = () => {
    setState('COMMITTED');
    setSubLabel('Speak now — recording...');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startPulse();
    holdTimer.current = setTimeout(() => handlePressOut(), 3000);
  };

  const handlePressOut = async () => {
    if (state === 'PROCESSING' || state === 'IDLE') return;
    clearAllTimers();
    const duration = Date.now() - startTime.current;

    if (duration < 3000) {
      if (recording.current) {
        await recording.current.stopAndUnloadAsync().catch(() => null);
        recording.current = null;
      }
      if (duration >= 1500) {
        setSubLabel('Hold for 3 full seconds to activate emergency');
        setState('IDLE');
        isActive.current = false;
        setTimeout(() => setSubLabel('Hold 3 Seconds · State your emergency'), 3000);
      } else {
        resetUI();
      }
      return;
    }

    setState('PROCESSING');
    setSubLabel('');
    pulseAnim.stopAnimation();
    ringGlowAnim.stopAnimation();

    const uri = await stopRecording();
    const voiceCaptured = !!uri;

    try {
      const user = auth.currentUser;
      const incidentId = await EmergencyService.createIncident(
        user?.uid ?? 'anonymous',
        user?.displayName ?? 'Citizen',
        voiceCaptured,
      );

      if (voiceCaptured && uri) {
        runPipeline(incidentId, uri);
      }

      resetUI();
      router.push(`/report/${incidentId}`);
    } catch (err) {
      console.error('[SOSButton] Dispatch error:', err);
      resetUI();
    }
  };

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.container}>
      <View style={styles.infoStack}>
        <Text style={styles.subLabel}>{subLabel}</Text>
      </View>

      <View style={styles.buttonWrapper}>
        <Svg width={BUTTON_SIZE} height={BUTTON_SIZE} style={styles.svg}>
          <Circle
            cx={BUTTON_SIZE / 2}
            cy={BUTTON_SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
          />
          <AnimatedCircle
            cx={BUTTON_SIZE / 2}
            cy={BUTTON_SIZE / 2}
            r={RADIUS}
            stroke="white"
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${BUTTON_SIZE / 2} ${BUTTON_SIZE / 2})`}
            opacity={state === 'COMMITTED' ? ringGlowAnim : 1}
          />
        </Svg>

        <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <Animated.View style={[styles.mainButton, { transform: [{ scale: pulseAnim }] }]}>
            {state === 'PROCESSING' ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              <Ionicons name="mic" size={48} color="#fff" />
            )}
            <Text style={styles.btnTitle}>
              {state === 'PROCESSING' ? 'Sending...' : 'EMERGENCY SOS'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
  },
  infoStack: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  subLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonWrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mainButton: {
    width: BUTTON_SIZE - 20,
    height: BUTTON_SIZE - 20,
    borderRadius: (BUTTON_SIZE - 20) / 2,
    backgroundColor: SOS_RED,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  btnTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
});
