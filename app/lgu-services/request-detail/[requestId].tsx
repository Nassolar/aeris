/**
 * Request Detail screen.
 * Shows the status timeline, form data summary, QR code, and actions.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { theme } from '../../../constants/theme';
import {
  AERIS_TEAL,
  AERIS_TEAL_LIGHT,
  SERVICE_STATUS_CONFIG,
} from '../../../constants/lguServices';
import { getServiceRequest } from '../../../services/lguServicesService';
import { LguServiceRequest, LguServiceStatusEvent } from '../../../types';

// ─── Status timeline builder ──────────────────────────────────────────────────

function buildTimeline(request: LguServiceRequest): LguServiceStatusEvent[] {
  const allSteps: Array<{
    status: LguServiceRequest['status'];
    label: string;
    note?: string;
  }> = [
    { status: 'pending', label: 'Submitted' },
    { status: 'under_review', label: 'Under review' },
    { status: 'approved', label: 'Approved' },
    { status: 'issued', label: 'Issued' },
  ];

  // Insert conditional steps
  const statusOrder: LguServiceRequest['status'][] = [
    'pending',
    'under_review',
    'docs_requested',
    'appointment_scheduled',
    'approved',
    'issued',
  ];

  const currentIdx = statusOrder.indexOf(request.status);

  return allSteps.map((step, idx) => {
    const stepIdx = statusOrder.indexOf(step.status);
    const isPast = stepIdx < currentIdx;
    const isCurrent = step.status === request.status;

    let timestamp = null;
    if (step.status === 'pending') {
      timestamp = request.submittedAt;
    } else if (step.status === 'issued' || step.status === 'approved') {
      timestamp = request.processedAt ?? null;
    }

    let note: string | undefined;
    if (isCurrent) {
      if (request.status === 'pending') note = 'Awaiting staff review';
      if (request.status === 'under_review') note = 'Staff is processing your request';
      if (request.status === 'approved') note = 'Ready for issuance';
    }
    if (step.status === 'issued' && request.status === 'issued') {
      note = 'Your document is ready';
    }

    return {
      status: step.status,
      label: step.label,
      timestamp: isPast || isCurrent ? timestamp : null,
      note,
    };
  });
}

function formatDatePH(ts: { seconds: number; nanoseconds: number } | null | undefined): string {
  if (!ts) return '';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RequestDetailScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  const [request, setRequest] = useState<LguServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      setError('Request not found.');
      setLoading(false);
      return;
    }
    getServiceRequest(requestId)
      .then((data) => {
        setRequest(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[RequestDetail]', err);
        setError('Could not load this request.');
        setLoading(false);
      });
  }, [requestId]);

  const handleShare = async () => {
    if (!request) return;
    try {
      await Share.share({
        message: `My ${request.serviceName} reference number: ${request.referenceNumber}`,
      });
    } catch {
      // dismissed
    }
  };

  const statusCfg = request
    ? SERVICE_STATUS_CONFIG[request.status] ?? {
        label: request.status.toUpperCase(),
        bg: theme.colors.border,
        text: theme.colors.textSecondary,
      }
    : null;

  const timeline = request ? buildTimeline(request) : [];
  const currentStepIdx = timeline.findIndex((s) => s.status === request?.status);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <SimpleHeader onBack={() => router.back()} title="Request Details" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AERIS_TEAL} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <SimpleHeader onBack={() => router.back()} title="Request Details" />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={theme.colors.error} />
          <Text style={styles.errorText}>{error ?? 'Request not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SimpleHeader onBack={() => router.back()} title={request.serviceName} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Reference + Status */}
        <View style={styles.topCard}>
          <Text style={styles.refNumber}>{request.referenceNumber}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusCfg?.bg }]}>
            <Text style={[styles.statusPillText, { color: statusCfg?.text }]}>
              {statusCfg?.label}
            </Text>
          </View>
          <Text style={styles.submittedAt}>
            Submitted {formatDatePH(request.submittedAt)}
          </Text>
        </View>

        {/* Status timeline */}
        <Text style={styles.sectionLabel}>STATUS TIMELINE</Text>
        <View style={styles.timelineCard}>
          {timeline.map((step, idx) => {
            const isPast = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const isFuture = idx > currentStepIdx;

            return (
              <View key={step.status} style={styles.timelineRow}>
                {/* Left track */}
                <View style={styles.timelineTrack}>
                  <View
                    style={[
                      styles.timelineDot,
                      isPast && styles.timelineDotPast,
                      isCurrent && styles.timelineDotCurrent,
                      isFuture && styles.timelineDotFuture,
                    ]}
                  >
                    {isPast && (
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    )}
                    {isCurrent && (
                      <View style={styles.timelineDotInner} />
                    )}
                  </View>
                  {idx < timeline.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        isPast ? styles.timelineLineActive : styles.timelineLineInactive,
                      ]}
                    />
                  )}
                </View>

                {/* Content */}
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      isFuture && styles.timelineLabelFuture,
                      isCurrent && styles.timelineLabelCurrent,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {step.timestamp && (
                    <Text style={styles.timelineTime}>
                      {formatDatePH(step.timestamp)}
                    </Text>
                  )}
                  {isCurrent && step.note && (
                    <Text style={styles.timelineNote}>{step.note}</Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Rejection note */}
          {request.status === 'rejected' && request.rejectionReason && (
            <View style={styles.rejectionNote}>
              <Ionicons name="close-circle-outline" size={16} color={theme.colors.error} />
              <Text style={styles.rejectionNoteText}>{request.rejectionReason}</Text>
            </View>
          )}
        </View>

        {/* Docs requested notice */}
        {request.status === 'docs_requested' && (
          <View style={styles.actionNotice}>
            <Ionicons name="document-attach-outline" size={20} color="#3B0764" />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionNoticeTitle}>Additional documents required</Text>
              <Text style={styles.actionNoticeText}>
                The office needs more information. Check your inbox for details.
              </Text>
            </View>
          </View>
        )}

        {/* Appointment notice */}
        {request.status === 'appointment_scheduled' && (
          <View style={[styles.actionNotice, { backgroundColor: '#E6F1FB' }]}>
            <Ionicons name="calendar-outline" size={20} color="#042C53" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionNoticeTitle, { color: '#042C53' }]}>
                Appointment scheduled
              </Text>
              <Text style={[styles.actionNoticeText, { color: '#042C53' }]}>
                Visit {request.office} for your appointment.
              </Text>
            </View>
          </View>
        )}

        {/* Form data summary */}
        {Object.keys(request.formData).filter((k) => !k.startsWith('kyc_')).length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>DETAILS</Text>
            <View style={styles.detailsCard}>
              {Object.entries(request.formData)
                .filter(([k]) => !k.startsWith('kyc_'))
                .map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Text>
                    <Text style={styles.detailValue}>
                      {Array.isArray(value) ? value.join(', ') : value}
                    </Text>
                  </View>
                ))}
              {request.feeAmount !== null && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fee</Text>
                  <Text style={styles.detailValue}>
                    {request.feeAmount === 0
                      ? 'Free'
                      : `PHP ${request.feeAmount.toFixed(2)}`}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* QR code section */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>REFERENCE QR</Text>
        <View style={styles.qrCard}>
          <QRCode
            value={request.referenceNumber}
            size={140}
            backgroundColor="#FFFFFF"
            color="#000000"
          />
          <Text style={styles.refNumberSmall}>{request.referenceNumber}</Text>
          {request.status !== 'issued' && (
            <Text style={styles.qrHint}>Show this at {request.office}</Text>
          )}
        </View>

        {/* Issued: view certificate */}
        {request.status === 'issued' && (
          <View style={styles.issuedActions}>
            {request.outputPdfUrl ? (
              <TouchableOpacity
                style={styles.viewCertBtn}
                onPress={() => Linking.openURL(request.outputPdfUrl!)}
                activeOpacity={0.85}
              >
                <Ionicons name="document-text-outline" size={18} color="#FFF" />
                <Text style={styles.viewCertBtnText}>View Certificate</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={AERIS_TEAL} />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Simple header ─────────────────────────────────────────────────────────────

function SimpleHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ width: 38 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Top card
  topCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'flex-start',
    gap: 8,
  },
  refNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  submittedAt: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  // Timeline
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  timelineTrack: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotPast: {
    backgroundColor: AERIS_TEAL,
  },
  timelineDotCurrent: {
    backgroundColor: AERIS_TEAL,
    borderWidth: 3,
    borderColor: AERIS_TEAL_LIGHT,
  },
  timelineDotFuture: {
    backgroundColor: theme.colors.border,
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 2,
  },
  timelineLineActive: {
    backgroundColor: AERIS_TEAL,
  },
  timelineLineInactive: {
    backgroundColor: theme.colors.border,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  timelineLabelFuture: {
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  timelineLabelCurrent: {
    color: AERIS_TEAL,
  },
  timelineTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  timelineNote: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  // Rejection note
  rejectionNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FCEBEB',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  rejectionNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#501313',
    fontWeight: '500',
    lineHeight: 18,
  },

  // Action notices
  actionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  actionNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B0764',
    marginBottom: 2,
  },
  actionNoticeText: {
    fontSize: 12,
    color: '#3B0764',
    lineHeight: 17,
    fontWeight: '500',
  },

  // Details card
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'right',
    flex: 1,
  },

  // QR card
  qrCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 10,
  },
  refNumberSmall: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  qrHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Issued actions
  issuedActions: {
    gap: 10,
    marginTop: 12,
  },
  viewCertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AERIS_TEAL,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 8,
  },
  viewCertBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: AERIS_TEAL,
    backgroundColor: theme.colors.surface,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: AERIS_TEAL,
  },
});
