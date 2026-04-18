import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Linking,
  Platform,
  Alert,
  Animated,
  Dimensions,
  ListRenderItemInfo,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface CarouselSlide {
  id: string;
  headline: string;
  subtext: string;
  statBadge: string;
  statLabel: string;
  icon: string;
  iconFamily: string;
  accentColor: string;
}

interface PartnerOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  onBecomePartner: () => void;
}

interface ServiceIconData {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  label: string;
}

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES: CarouselSlide[] = [
  {
    id: 'slide1',
    headline: 'Earn On Your Own Terms',
    subtext: 'Set your own schedule. Accept only the jobs you want. Work when it suits you — not the other way around.',
    statBadge: '₱500+/day',
    statLabel: 'Average earnings',
    icon: 'briefcase',
    iconFamily: 'Ionicons',
    accentColor: '#14B8A6',
  },
  {
    id: 'slide2',
    headline: 'Get Paid for Skills You Already Have',
    subtext: 'Whether you\'re an electrician, plumber, cleaner, or tech specialist — your neighbors need you.',
    statBadge: 'Within 5km',
    statLabel: 'Serve customers in your area',
    icon: 'grid',
    iconFamily: 'Ionicons',
    accentColor: '#3B82F6',
  },
  {
    id: 'slide3',
    headline: 'Earn Even When You\'re Not Working',
    subtext: 'Our Standby program pays you ₱50/hour just for being available in your zone. Complete jobs on top for bonus earnings.',
    statBadge: '₱200+',
    statLabel: 'Guaranteed per shift',
    icon: 'wallet',
    iconFamily: 'Ionicons',
    accentColor: '#F59E0B',
  },
];

const SERVICE_ICONS: ServiceIconData[] = [
  { icon: 'construct', color: '#EA580C', bgColor: '#FFF7ED', label: 'Repair' },
  { icon: 'sparkles', color: '#16A34A', bgColor: '#F0FDF4', label: 'Cleaning' },
  { icon: 'car', color: '#0891B2', bgColor: '#ECFEFF', label: 'Moving' },
  { icon: 'color-palette', color: '#9333EA', bgColor: '#FAF5FF', label: 'Painting' },
  { icon: 'cut', color: '#DB2777', bgColor: '#FDF2F8', label: 'Beauty' },
  { icon: 'paw', color: '#CA8A04', bgColor: '#FEFCE8', label: 'Pet Care' },
];

const PARTNER_APP_URL = 'aeris-partner://signup';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.aeris.partner';
const APP_STORE_URL = 'https://apps.apple.com/app/aeris-partner/idXXXXXXXXXX';

// ============================================================================
// Component
// ============================================================================

export function PartnerOnboardingModal({
  visible,
  onClose,
  onBecomePartner,
}: PartnerOnboardingModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<CarouselSlide>>(null);

  // Animation values
  const statBadgeScale = useRef(new Animated.Value(0)).current;
  const ctaPulse = useRef(new Animated.Value(1)).current;
  const iconAnimations = useRef(SERVICE_ICONS.map(() => new Animated.Value(0))).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      statBadgeScale.setValue(0);
      iconAnimations.forEach(anim => anim.setValue(0));
      flatListRef.current?.scrollToIndex({ index: 0, animated: false });
      animateStatBadge();
    }
  }, [visible]);

  // Animate stat badge when slide changes
  useEffect(() => {
    animateStatBadge();

    if (currentIndex === 1) {
      animateServiceIcons();
    }

    if (currentIndex === 2) {
      animateCTAPulse();
    }
  }, [currentIndex]);

  const animateStatBadge = useCallback(() => {
    statBadgeScale.setValue(0);
    Animated.spring(statBadgeScale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [statBadgeScale]);

  const animateServiceIcons = useCallback(() => {
    iconAnimations.forEach(anim => anim.setValue(0));
    const staggeredAnimations = iconAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, staggeredAnimations).start();
  }, [iconAnimations]);

  const animateCTAPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, {
          toValue: 1.03,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 3 }
    ).start();
  }, [ctaPulse]);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleSkip = () => {
    flatListRef.current?.scrollToIndex({ index: 2, animated: true });
  };

  const handleBecomePartner = async () => {
    try {
      const canOpen = await Linking.canOpenURL(PARTNER_APP_URL);
      if (canOpen) {
        await Linking.openURL(PARTNER_APP_URL);
      } else {
        const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
        await Linking.openURL(storeUrl);
      }
      onBecomePartner();
    } catch (error) {
      const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
      await Linking.openURL(storeUrl);
    }
  };

  const handleOpenPartnerApp = async () => {
    try {
      await Linking.openURL(PARTNER_APP_URL);
    } catch {
      Alert.alert(
        'App Not Found',
        'AERIS Partner app is not installed. Would you like to download it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => Linking.openURL(Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL) },
        ]
      );
    }
  };

  const renderSlide1Hero = () => (
    <View style={[styles.heroContainer, { backgroundColor: '#E6FFFA' }]}>
      <View style={[styles.heroIconCircle, { backgroundColor: '#14B8A6' }]}>
        <Ionicons name="briefcase" size={48} color="#FFF" />
        <View style={styles.clockBadge}>
          <Ionicons name="time" size={20} color="#14B8A6" />
        </View>
      </View>
    </View>
  );

  const renderSlide2Hero = () => (
    <View style={styles.serviceIconGrid}>
      {SERVICE_ICONS.map((service, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const translateY = iconAnimations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        });

        return (
          <Animated.View
            key={service.label}
            style={[
              styles.serviceIconWrapper,
              {
                opacity: iconAnimations[index],
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={[styles.serviceIconCircle, { backgroundColor: service.bgColor }]}>
              <Ionicons name={service.icon} size={28} color={service.color} />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );

  const renderSlide3Hero = () => (
    <View style={[styles.heroContainer, { backgroundColor: '#FFFBEB' }]}>
      <View style={[styles.heroIconCircle, { backgroundColor: '#F59E0B' }]}>
        <Ionicons name="phone-portrait" size={40} color="#FFF" />
        <View style={[styles.clockBadge, { backgroundColor: '#FEF3C7', right: -8 }]}>
          <Ionicons name="wallet" size={18} color="#F59E0B" />
        </View>
        <View style={[styles.mapPinBadge, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="location" size={16} color="#F59E0B" />
        </View>
      </View>
    </View>
  );

  const renderSlide = ({ item, index }: ListRenderItemInfo<CarouselSlide>) => {
    const isLastSlide = index === 2;
    const statBadgeBgColor =
      index === 0 ? '#DCFCE7' : index === 1 ? '#DBEAFE' : '#FEF3C7';

    return (
      <View style={styles.slideContainer}>
        {/* Skip Button (slides 1-2 only) */}
        {!isLastSlide && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>

        {/* Hero Area */}
        <View style={styles.heroArea}>
          {index === 0 && renderSlide1Hero()}
          {index === 1 && renderSlide2Hero()}
          {index === 2 && renderSlide3Hero()}
        </View>

        {/* Content */}
        <View style={styles.contentArea}>
          <Text style={styles.headline}>{item.headline}</Text>
          <Text style={styles.subtext}>{item.subtext}</Text>

          {/* Stat Badge */}
          <Animated.View
            style={[
              styles.statBadge,
              { backgroundColor: statBadgeBgColor },
              { transform: [{ scale: statBadgeScale }] },
            ]}
          >
            <Text style={[styles.statBadgeValue, { color: item.accentColor }]}>
              {item.statBadge}
            </Text>
            <Text style={styles.statBadgeLabel}>{item.statLabel}</Text>
          </Animated.View>
        </View>

        {/* Bottom Area */}
        <View style={styles.bottomArea}>
          {!isLastSlide ? (
            // Dot Indicators
            <View style={styles.dotsContainer}>
              {SLIDES.map((_, dotIndex) => (
                <View
                  key={dotIndex}
                  style={[
                    styles.dot,
                    dotIndex === currentIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          ) : (
            // CTA Buttons on Slide 3
            <View style={styles.ctaContainer}>
              <Animated.View style={{ transform: [{ scale: ctaPulse }] }}>
                <TouchableOpacity
                  style={styles.primaryCta}
                  onPress={handleBecomePartner}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryCtaText}>Become an AERIS Partner</Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.secondaryCta}
                onPress={handleOpenPartnerApp}
              >
                <Text style={styles.secondaryCtaText}>
                  Already have the app? <Text style={styles.secondaryCtaLink}>Open AERIS Partner</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />
      </View>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#FFF',
    paddingTop: 60,
    paddingHorizontal: 24,
  },

  // Header Buttons
  skipButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    padding: 8,
  },

  // Hero Area
  heroArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: SCREEN_HEIGHT * 0.35,
  },
  heroContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  clockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  mapPinBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },

  // Service Icons Grid (Slide 2)
  serviceIconGrid: {
    width: SCREEN_WIDTH * 0.8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  serviceIconWrapper: {
    width: (SCREEN_WIDTH * 0.8 - 32) / 3 - 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Content Area
  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 24,
    maxHeight: SCREEN_HEIGHT * 0.35,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },

  // Stat Badge
  statBadge: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  statBadgeValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statBadgeLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },

  // Bottom Area
  bottomArea: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingBottom: 40,
  },

  // Dot Indicators
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: '#000',
  },

  // CTA Buttons (Slide 3)
  ctaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCta: {
    width: '100%',
    height: 56,
    backgroundColor: '#000',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryCtaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryCta: {
    paddingVertical: 8,
  },
  secondaryCtaText: {
    fontSize: 14,
    color: '#666',
  },
  secondaryCtaLink: {
    color: '#14B8A6',
    fontWeight: '600',
  },
});

export default PartnerOnboardingModal;
