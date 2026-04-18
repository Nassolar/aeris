import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SOSButton from './SOSButton';
import ServiceGrid from './ServiceGrid';
import { searchIncidents, SearchResult } from '../../services/searchService';

const COLORS = {
  bg: '#0B132B',
  card: '#1E293B',
  cardDark: '#0F172A',
  border: 'rgba(255,255,255,0.08)',
  text: '#F8FAFC',
  textSecondary: '#94a3b8',
  accent: '#E85D4D',
  blue: '#5B8DEE',
  green: '#4CAF50',
  searchBg: '#1E293B',
  searchBorder: '#334155',
};

const InstructionItem = ({ title, description, color }: { title: string; description: string; color: string }) => (
  <View style={styles.instructionItem}>
    <Text style={[styles.instructionTitle, { color }]}>{title}</Text>
    <Text style={styles.instructionDesc}>{description}</Text>
  </View>
);

export default function EmergencyView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setSearchResults(searchIncidents(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleIncidentSelect = (incidentKey: string) => {
    Keyboard.dismiss();
    setSearchQuery('');
    router.push({ pathname: '/report', params: { type: incidentKey } });
  };

  const handleReportPress = () => {
    router.push({ pathname: '/report' });
  };

  return (
    <View style={styles.container}>
      {/* PAGE TITLE */}
      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>Emergency Response</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* SMART SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="What's happening? (e.g., holdap, sunog, aksidente)"
            placeholderTextColor="#4A5568"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* SEARCH RESULTS */}
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={result.key}
                style={[styles.resultItem, index < searchResults.length - 1 && styles.resultBorder]}
                onPress={() => handleIncidentSelect(result.key)}
                activeOpacity={0.7}
              >
                <View style={styles.resultLeft}>
                  <Text style={styles.resultIcon}>{result.config.icon ?? '🚨'}</Text>
                  <View style={styles.resultText}>
                    <Text style={styles.resultLabel}>{result.config.citizenLabel}</Text>
                    <Text style={styles.resultTagalog}>{result.config.tagalog}</Text>
                  </View>
                </View>
                <View style={styles.resultRight}>
                  {result.config.isEmergency && (
                    <View style={styles.emergencyBadge}>
                      <Text style={styles.emergencyBadgeText}>EMERGENCY</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#4A5568" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* REPORT VIOLATION BANNER */}
        <TouchableOpacity style={styles.actionBanner} onPress={handleReportPress} activeOpacity={0.85}>
          <View style={styles.actionIconCircle}>
            <Ionicons name="camera" size={26} color="#FFF" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Report a Violation</Text>
            <Text style={styles.actionSubtitle}>Illegal parking, reckless driving, etc.</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={30} color={COLORS.text} />
        </TouchableOpacity>

        {/* NOTICES */}
        <View style={styles.protocolCard}>
          <View style={styles.protocolRow}>
            <Ionicons name="warning" size={16} color={COLORS.accent} style={styles.protocolIcon} />
            <Text style={styles.protocolText}>False reporting is a crime punishable by law.</Text>
          </View>
          <View style={styles.protocolRow}>
            <Ionicons name="time" size={16} color={COLORS.blue} style={styles.protocolIcon} />
            <Text style={styles.protocolText}>Reports are reviewed within 24 hours.</Text>
          </View>
          <View style={[styles.protocolRow, styles.protocolRowLast]}>
            <Ionicons name="location" size={16} color={COLORS.green} style={styles.protocolIcon} />
            <Text style={styles.protocolText}>Location captured automatically.</Text>
          </View>
        </View>

        {/* REQUEST ASSISTANCE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REQUEST ASSISTANCE</Text>
          <ServiceGrid />

          <View style={styles.instructionsContainer}>
            <InstructionItem
              title="Select POLICE for Crimes & Safety Threats"
              description="Tap this when you or others are in immediate danger due to human conflict. Use it for reporting domestic violence, road rage, theft, assault, or any ongoing crime where law enforcement is needed to secure the scene."
              color={COLORS.blue}
            />
            <InstructionItem
              title="Select MEDICAL for Health Emergencies"
              description="Tap this when a life is at risk and you need an ambulance. Use it for severe injuries, difficulty breathing, unconsciousness, heart attacks, or any situation requiring paramedics and advanced life support."
              color={COLORS.accent}
            />
            <InstructionItem
              title="Select RESCUE for Fire & Entrapment"
              description="Tap this when special equipment is needed to physically save someone. Use it for fires, floods, earthquakes, or vehicular accidents where someone is trapped inside a car or debris and cannot get out on their own."
              color="#FBBF24"
            />
          </View>
        </View>

        {/* SOS BUTTON */}
        <View style={styles.bottomSection}>
          <SOSButton />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  titleContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 200,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.searchBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.searchBorder,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },

  // Search Results
  searchResults: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.searchBorder,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  resultBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.searchBorder,
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  resultText: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  resultTagalog: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  resultRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emergencyBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  emergencyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },

  // Action Banner
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Protocol Card
  protocolCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 16,
    padding: 14,
    marginBottom: 28,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  protocolRowLast: {
    marginBottom: 0,
  },
  protocolIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  protocolText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },

  // Instructions
  instructionsContainer: {
    marginTop: 24,
    gap: 16,
  },
  instructionItem: {
    marginBottom: 4,
  },
  instructionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  instructionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Bottom
  bottomSection: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
});
