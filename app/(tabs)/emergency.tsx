import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import {
  PoliceIcon, MedicalIcon, FireIcon, RescueIcon, ChevronRightIcon, CameraIcon
} from '../../components/icons/WireframeIcons';
import LocationHeader from '../../components/dashboard/LocationHeader';
import LiveTicker from '../../components/dashboard/LiveTicker';
import TopTabSwitcher from '../../components/dashboard/TopTabSwitcher';
import SOSBar from '../../components/dashboard/SOSBar';

const { height } = Dimensions.get('window');

export default function EmergencyScreen() {
  const router = useRouter();

  const handleTabChange = (tab: 'emergency' | 'services') => {
    if (tab === 'services') {
      router.push('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LocationHeader
        notificationCount={3}
        onNotificationPress={() => router.push('/(tabs)/inbox')}
      />
      <LiveTicker messages={['12 PNP UNITS ACTIVE - TAGUIG', '4 BFP UNITS ON STANDBY', 'AVG RESPONSE: 4.2 MIN']} />
      <TopTabSwitcher activeTab="emergency" onTabChange={handleTabChange} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

        <View style={styles.headerBlock}>
          <Text style={styles.sectionLabel}>REQUEST ASSISTANCE</Text>
          <Text style={styles.heading}>Who do you need?</Text>
        </View>

        {/* Police Card */}
        <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => router.push({ pathname: '/report', params: { category: 'police' } })}>
          <View style={[styles.cardAccent, { backgroundColor: theme.colors.policeBlue }]} />
          <View style={[styles.iconBox, { backgroundColor: 'rgba(26, 86, 219, 0.08)' }]}>
            <PoliceIcon color={theme.colors.policeBlue} size={28} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Police</Text>
              <View style={[styles.tag, { backgroundColor: 'rgba(26, 86, 219, 0.1)' }]}>
                <Text style={[styles.tagText, { color: theme.colors.policeBlue }]}>CRIMES & SAFETY</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>Active crime • Assault • Domestic violence • Road rage</Text>
          </View>
          <ChevronRightIcon color={theme.colors.border} size={20} />
        </TouchableOpacity>

        {/* Medical Card */}
        <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => router.push({ pathname: '/report', params: { category: 'medical' } })}>
          <View style={[styles.cardAccent, { backgroundColor: theme.colors.medicalRed }]} />
          <View style={[styles.iconBox, { backgroundColor: 'rgba(200, 25, 25, 0.08)' }]}>
            <MedicalIcon color={theme.colors.medicalRed} size={28} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Medical</Text>
              <View style={[styles.tag, { backgroundColor: 'rgba(200, 25, 25, 0.1)' }]}>
                <Text style={[styles.tagText, { color: theme.colors.medicalRed }]}>HEALTH EMERGENCY</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>Ambulance • Cardiac arrest • Severe injury • Unconscious</Text>
          </View>
          <ChevronRightIcon color={theme.colors.border} size={20} />
        </TouchableOpacity>

        {/* Fire Card */}
        <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => router.push({ pathname: '/report', params: { category: 'fire' } })}>
          <View style={[styles.cardAccent, { backgroundColor: theme.colors.rescueAmber }]} />
          <View style={[styles.iconBox, { backgroundColor: 'rgba(180, 83, 9, 0.08)' }]}>
            <FireIcon color={theme.colors.rescueAmber} size={28} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Fire</Text>
              <View style={[styles.tag, { backgroundColor: 'rgba(180, 83, 9, 0.1)' }]}>
                <Text style={[styles.tagText, { color: theme.colors.rescueAmber }]}>FIRE EMERGENCY</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>Structure fire • Gas leak • Explosion • Vehicle fire</Text>
          </View>
          <ChevronRightIcon color={theme.colors.border} size={20} />
        </TouchableOpacity>

        {/* Rescue Card */}
        <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => router.push({ pathname: '/report', params: { category: 'rescue' } })}>
          <View style={[styles.cardAccent, { backgroundColor: theme.colors.rescueAmber }]} />
          <View style={[styles.iconBox, { backgroundColor: 'rgba(180, 83, 9, 0.08)' }]}>
            <RescueIcon color={theme.colors.rescueAmber} width={28} height={28} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Rescue</Text>
              <View style={[styles.tag, { backgroundColor: 'rgba(180, 83, 9, 0.1)' }]}>
                <Text style={[styles.tagText, { color: theme.colors.rescueAmber }]}>ENTRAPMENT & DISASTER</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>Flood • Earthquake • Vehicular entrapment • Drowning</Text>
          </View>
          <ChevronRightIcon color={theme.colors.border} size={20} />
        </TouchableOpacity>

        <View style={styles.dividerBox}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>NON-EMERGENCY</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Report a Violation */}
        <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => router.push('/report')}>
          <View style={[styles.iconBox, { backgroundColor: theme.colors.background, marginLeft: 16 }]} >
            <CameraIcon color={theme.colors.textSecondary} size={28} />
          </View>
          <View style={[styles.cardBody, { marginLeft: 16 }]}>
            <Text style={styles.cardTitle}>Report a Violation</Text>
            <Text style={styles.cardDesc}>Illegal parking • Reckless driving • Drug-related information • Domestic violence</Text>
          </View>
          <ChevronRightIcon color={theme.colors.border} size={20} />
        </TouchableOpacity>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>📍 Location captured automatically</Text>
          <Text style={styles.disclaimerText}>False reporting is a crime punishable by law</Text>
        </View>

        {/* Padding for SOS Bar floating above Bottom Nav */}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.sosWrapper}>
        <SOSBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerBlock: {
    marginBottom: 20,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    paddingRight: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 24,
    bottom: 24,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  cardBody: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary,
    marginRight: 8,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textLight,
    letterSpacing: 1,
  },
  disclaimerBox: {
    marginTop: 24,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 10,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  sosWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  }
});
