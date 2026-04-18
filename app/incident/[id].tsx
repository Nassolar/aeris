import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import type { ConductorAIClassification, DispatchUnit } from '../../types/voiceSOS';

interface SOSIncident {
  id: string;
  caseNumber: string;
  status: string;
  trigger: string;
  voiceCaptured: boolean;
  voiceTranscript: string | null;
  audioUrl: string | null;
  aiClassification: ConductorAIClassification | null;
  location: {
    lat: number;
    lng: number;
    address: string | null;
    barangay: string | null;
  };
  citizenName: string;
  priority: string;
  createdAt: { seconds: number; toDate?: () => Date } | null;
}

const SOS_RED = '#CD0E11';
const DARK_BG = '#0B1121';
const CARD_BG = '#151e32';
const TEXT = '#ffffff';
const SUBTEXT = '#94a3b8';

const UNIT_COLORS: Record<DispatchUnit, string> = {
  Police: '#3B82F6',
  Medical: '#10B981',
  Fire: '#F97316',
  Rescue: '#8B5CF6',
};

const statusLabel = (status: string): string => {
  switch (status) {
    case 'dispatched': return 'Dispatched';
    case 'responding': return 'Responding';
    case 'on_scene': return 'On Scene';
    case 'resolved': return 'Resolved';
    default: return status.toUpperCase();
  }
};

const statusColor = (status: string): string => {
  switch (status) {
    case 'resolved': return '#10B981';
    case 'on_scene': return '#F97316';
    case 'responding': return '#3B82F6';
    default: return SOS_RED;
  }
};

export default function SOSIncidentTrackerScreen() {
  const { id, caseNumber: initialCaseNumber } = useLocalSearchParams<{ id: string; caseNumber: string }>();
  const router = useRouter();
  const [incident, setIncident] = useState<SOSIncident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsub = firestore()
      .collection('incidents')
      .doc(id)
      .onSnapshot(
        (snap) => {
          if (snap.exists) {
            setIncident({ id: snap.id, ...(snap.data() as Omit<SOSIncident, 'id'>) });
          } else {
            Alert.alert('Error', 'Incident not found');
            router.back();
          }
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
      );
    return () => unsub();
  }, [id]);

  const displayCaseNumber = incident?.caseNumber ?? initialCaseNumber ?? id;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={SOS_RED} />
        <Text style={styles.loadingText}>Connecting to dispatch...</Text>
      </View>
    );
  }

  if (!incident) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Case Number Banner */}
        <View style={styles.caseCard}>
          <Text style={styles.caseLabel}>CASE NUMBER</Text>
          <Text style={styles.caseNumber}>{displayCaseNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(incident.status) }]}>
            <Text style={styles.statusText}>{statusLabel(incident.status)}</Text>
          </View>
        </View>

        {/* Dispatched Units */}
        {incident.aiClassification?.dispatchUnits?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UNITS DISPATCHED</Text>
            <View style={styles.unitRow}>
              {incident.aiClassification.dispatchUnits.map((unit) => (
                <View key={unit} style={[styles.unitBadge, { backgroundColor: UNIT_COLORS[unit] ?? '#64748b' }]}>
                  <Text style={styles.unitText}>{unit}</Text>
                </View>
              ))}
            </View>
            {incident.aiClassification.summary ? (
              <View style={styles.aiCard}>
                <Ionicons name="sparkles" size={14} color="#a78bfa" style={{ marginRight: 6 }} />
                <Text style={styles.aiSummary}>{incident.aiClassification.summary}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UNITS DISPATCHED</Text>
            <View style={styles.unitRow}>
              {(['Police', 'Medical', 'Fire', 'Rescue'] as DispatchUnit[]).map((unit) => (
                <View key={unit} style={[styles.unitBadge, { backgroundColor: UNIT_COLORS[unit] }]}>
                  <Text style={styles.unitText}>{unit}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.allUnitsNote}>General emergency — all units notified</Text>
          </View>
        )}

        {/* Voice Transcript */}
        {incident.voiceTranscript ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>YOUR VOICE REPORT</Text>
            <View style={styles.transcriptCard}>
              <Ionicons name="mic" size={14} color={SUBTEXT} style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.transcriptText}>{incident.voiceTranscript}</Text>
            </View>
          </View>
        ) : null}

        {/* Location */}
        {(incident.location?.address || incident.location?.barangay) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LOCATION</Text>
            <View style={styles.locationCard}>
              <Ionicons name="location" size={16} color={SOS_RED} style={{ marginRight: 8 }} />
              <Text style={styles.locationText}>
                {[incident.location.address, incident.location.barangay].filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Timestamp */}
        <View style={styles.timestampRow}>
          <Ionicons name="time-outline" size={13} color={SUBTEXT} />
          <Text style={styles.timestampText}>
            Reported:{' '}
            {incident.createdAt?.seconds
              ? new Date(incident.createdAt.seconds * 1000).toLocaleString()
              : 'Just now'}
          </Text>
        </View>

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={SUBTEXT} style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>
            Keep this screen open to track your emergency status in real-time.
            Save your case number for follow-up.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: SUBTEXT, marginTop: 12, fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: CARD_BG,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: TEXT },
  backBtn: { padding: 5 },

  scroll: { padding: 20, paddingBottom: 40 },

  caseCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(205,14,17,0.3)',
  },
  caseLabel: { color: SUBTEXT, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  caseNumber: { color: TEXT, fontSize: 22, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  section: { marginBottom: 16 },
  sectionTitle: { color: SUBTEXT, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },

  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  unitBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  unitText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  allUnitsNote: { color: SUBTEXT, fontSize: 12 },

  aiCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
  },
  aiSummary: { flex: 1, color: TEXT, fontSize: 13, lineHeight: 20 },

  transcriptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 12,
  },
  transcriptText: { flex: 1, color: TEXT, fontSize: 13, lineHeight: 20 },

  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 12,
  },
  locationText: { flex: 1, color: TEXT, fontSize: 13, lineHeight: 20 },

  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 20,
  },
  timestampText: { color: SUBTEXT, fontSize: 12 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(148,163,184,0.08)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
  },
  infoText: { flex: 1, color: SUBTEXT, fontSize: 12, lineHeight: 18 },
});
