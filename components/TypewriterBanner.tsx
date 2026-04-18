import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Type definitions
interface TypewriterMessage {
  type: 'full' | 'cycling';
  text?: string;           // for 'full' type
  prefix?: string;         // for 'cycling' type
  words?: string[];        // for 'cycling' type
}

interface TypewriterBannerProps {
  messages: TypewriterMessage[];
  ctaText: string;
  onCtaPress: () => void;
  typingSpeed?: number;    // ms per char, default 50
  deletingSpeed?: number;  // ms per char, default 30
  pauseDuration?: number;  // ms after full message, default 2000
  cyclingPauseDuration?: number; // ms after cycling word, default 1500
  nextMessagePause?: number; // ms before next message, default 500
}

// Animation states for the state machine
type AnimationPhase =
  | 'typing'
  | 'pausing'
  | 'deleting'
  | 'nextMessage';

// Default messages array
const defaultMessages: TypewriterMessage[] = [
  {
    type: 'full',
    text: "Know someone who can help — or maybe that's you?",
  },
  {
    type: 'cycling',
    prefix: 'Help your neighbors. Are you a skilled ',
    words: ['Medic?', 'Mechanic?', 'Plumber?', 'Electrician?', 'Painter?'],
  },
  {
    type: 'full',
    text: 'Earn by doing what you\'re good at.',
  },
];

export const TypewriterBanner: React.FC<TypewriterBannerProps> = ({
  messages = defaultMessages,
  ctaText,
  onCtaPress,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 2000,
  cyclingPauseDuration = 1500,
  nextMessagePause = 500,
}) => {
  // Current message index
  const [messageIndex, setMessageIndex] = useState(0);
  // For cycling messages, current word index
  const [wordIndex, setWordIndex] = useState(0);
  // Current displayed text
  const [displayedText, setDisplayedText] = useState('');
  // Current animation phase
  const [phase, setPhase] = useState<AnimationPhase>('typing');
  // Cursor visibility for blinking effect
  const [cursorVisible, setCursorVisible] = useState(true);

  // Refs to track current position in typing/deleting
  const charIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get the current message
  const currentMessage = messages[messageIndex];

  // Get the target text based on message type
  const getTargetText = useCallback((): string => {
    if (currentMessage.type === 'full') {
      return currentMessage.text || '';
    } else {
      const prefix = currentMessage.prefix || '';
      const words = currentMessage.words || [];
      const currentWord = words[wordIndex] || '';
      return prefix + currentWord;
    }
  }, [currentMessage, wordIndex]);

  // Get the portion to delete for cycling messages (just the word part)
  const getDeleteLength = useCallback((): number => {
    if (currentMessage.type === 'full') {
      return currentMessage.text?.length || 0;
    } else {
      // Only delete the cycling word, not the prefix
      const words = currentMessage.words || [];
      return words[wordIndex]?.length || 0;
    }
  }, [currentMessage, wordIndex]);

  // Blinking cursor effect
  useEffect(() => {
    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, []);

  // Main animation state machine
  useEffect(() => {
    const clearCurrentTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const targetText = getTargetText();

    switch (phase) {
      case 'typing': {
        if (charIndexRef.current < targetText.length) {
          timeoutRef.current = setTimeout(() => {
            charIndexRef.current += 1;
            setDisplayedText(targetText.substring(0, charIndexRef.current));
          }, typingSpeed);
        } else {
          // Finished typing, move to pause
          const pauseTime = currentMessage.type === 'cycling'
            ? cyclingPauseDuration
            : pauseDuration;
          timeoutRef.current = setTimeout(() => {
            setPhase('pausing');
          }, pauseTime);
        }
        break;
      }

      case 'pausing': {
        // After pause, start deleting
        setPhase('deleting');
        break;
      }

      case 'deleting': {
        const deleteLength = getDeleteLength();
        const prefixLength = currentMessage.type === 'cycling'
          ? (currentMessage.prefix?.length || 0)
          : 0;
        const minLength = currentMessage.type === 'cycling' ? prefixLength : 0;

        if (charIndexRef.current > minLength) {
          timeoutRef.current = setTimeout(() => {
            charIndexRef.current -= 1;
            setDisplayedText(targetText.substring(0, charIndexRef.current));
          }, deletingSpeed);
        } else {
          // Finished deleting, determine next action
          timeoutRef.current = setTimeout(() => {
            setPhase('nextMessage');
          }, nextMessagePause);
        }
        break;
      }

      case 'nextMessage': {
        if (currentMessage.type === 'cycling') {
          // Move to next word in the cycle
          const words = currentMessage.words || [];
          const nextWordIndex = (wordIndex + 1) % words.length;

          if (nextWordIndex === 0) {
            // Completed all words, move to next message
            const nextMessageIndex = (messageIndex + 1) % messages.length;
            setMessageIndex(nextMessageIndex);
            setWordIndex(0);
            charIndexRef.current = 0;
            setDisplayedText('');
          } else {
            // Stay on same message, cycle to next word
            setWordIndex(nextWordIndex);
            // Keep the prefix, just start typing the new word
            charIndexRef.current = currentMessage.prefix?.length || 0;
          }
        } else {
          // Full message, move to next message
          const nextMessageIndex = (messageIndex + 1) % messages.length;
          setMessageIndex(nextMessageIndex);
          setWordIndex(0);
          charIndexRef.current = 0;
          setDisplayedText('');
        }
        setPhase('typing');
        break;
      }
    }

    return clearCurrentTimeout;
  }, [
    phase,
    displayedText,
    messageIndex,
    wordIndex,
    currentMessage,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    cyclingPauseDuration,
    nextMessagePause,
    getTargetText,
    getDeleteLength,
    messages.length,
  ]);

  // Handle CTA press with useCallback for performance
  const handleCtaPress = useCallback(() => {
    onCtaPress();
  }, [onCtaPress]);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.typewriterText}>
          {displayedText}
          <Text style={[styles.cursor, !cursorVisible && styles.cursorHidden]}>|</Text>
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleCtaPress}
        style={styles.ctaContainer}
        activeOpacity={0.7}
      >
        <Text style={styles.ctaText}>{ctaText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  textContainer: {
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  typewriterText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',
    lineHeight: 20,
  },
  cursor: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '300',
  },
  cursorHidden: {
    opacity: 0,
  },
  ctaContainer: {
    paddingVertical: 4,
  },
  ctaText: {
    fontSize: 14,
    color: '#14B8A6',
    fontWeight: '600',
  },
});

export default TypewriterBanner;
