/**
 * Service Request Form screen.
 * Shows KYC pre-filled fields (locked) and service-specific fields.
 * Dynamic fields loaded from service_templates via Supabase — see TODO below.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

import { theme } from '../../../constants/theme';
import {
  AERIS_TEAL,
  AERIS_TEAL_LIGHT,
  DEFAULT_SERVICE_CATALOG,
} from '../../../constants/lguServices';
import {
  submitServiceRequest,
} from '../../../services/lguServicesService';
import { LguServiceTemplate } from '../../../types';

// ─── Types for static form fields ─────────────────────────────────────────────

interface StaticDropdownField {
  type: 'dropdown';
  key: string;
  label: string;
  required: boolean;
  options: string[];
}

interface StaticTextField {
  type: 'text' | 'textarea';
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
  showWhen?: { field: string; includes: string[] };
}

type StaticFormField = StaticDropdownField | StaticTextField;

// ─── Static field definitions per template key ────────────────────────────────
// TODO: Dynamic fields loaded from service_templates via Supabase.
// Replace STATIC_FIELDS[templateKey] lookup with a Supabase Edge Function call:
//   const fields = await fetchFromSupabase('render-service-form', { templateKey, lguId })
// until then, these static fields cover the most common requests.

const STATIC_FIELDS: Record<string, StaticFormField[]> = {
  brgy_clearance: [
    {
      type: 'dropdown',
      key: 'purpose',
      label: 'Purpose',
      required: true,
      options: [
        'Employment — private company',
        'Employment — government',
        'Business permit / Mayor\'s permit',
        'School enrollment',
        'Residency proof',
        'Other',
      ],
    },
    {
      type: 'text',
      key: 'employer_school',
      label: 'Employer / School name',
      required: false,
      placeholder: 'Optional',
      showWhen: {
        field: 'purpose',
        includes: ['Employment — private company', 'Employment — government', 'School enrollment'],
      },
    },
  ],
  good_moral: [
    {
      type: 'dropdown',
      key: 'purpose',
      label: 'Purpose',
      required: true,
      options: ['Employment', 'School / scholarship', 'Government application', 'Other'],
    },
  ],
  indigency_cert: [
    {
      type: 'dropdown',
      key: 'purpose',
      label: 'Purpose',
      required: true,
      options: [
        'Medical assistance',
        'Scholarship application',
        'Legal aid',
        'Social welfare program',
        'Other',
      ],
    },
    {
      type: 'text',
      key: 'amount_requested',
      label: 'Amount of assistance requested (if applicable)',
      required: false,
      placeholder: 'e.g. PHP 5,000',
    },
  ],
  cert_residency: [
    {
      type: 'dropdown',
      key: 'purpose',
      label: 'Purpose',
      required: true,
      options: ['School enrollment', 'Employment', 'Government application', 'Banking', 'Other'],
    },
    {
      type: 'text',
      key: 'years_resident',
      label: 'Years living in this barangay',
      required: false,
      placeholder: 'e.g. 5',
    },
  ],
  medical_cert: [
    {
      type: 'dropdown',
      key: 'purpose',
      label: 'Purpose',
      required: true,
      options: ['Employment', 'School enrollment', 'Travel / passport', 'Insurance', 'Other'],
    },
  ],
  brgy_business_permit: [
    {
      type: 'text',
      key: 'business_name',
      label: 'Business name',
      required: true,
      placeholder: 'Registered business name',
    },
    {
      type: 'dropdown',
      key: 'business_type',
      label: 'Type of business',
      required: true,
      options: ['Retail / Sari-sari', 'Food / Restaurant', 'Services', 'Manufacturing', 'Other'],
    },
    {
      type: 'text',
      key: 'business_address',
      label: 'Business address',
      required: true,
      placeholder: 'Address within the barangay',
    },
  ],
  first_time_job_seeker: [
    {
      type: 'text',
      key: 'school_last_attended',
      label: 'School last attended',
      required: true,
      placeholder: 'Name of school',
    },
    {
      type: 'dropdown',
      key: 'highest_education',
      label: 'Highest educational attainment',
      required: true,
      options: [
        'High school graduate',
        'College undergraduate',
        'College graduate',
        'Vocational / technical',
        'Post-graduate',
      ],
    },
  ],
};

function getFieldsForTemplate(templateKey: string): StaticFormField[] {
  return STATIC_FIELDS[templateKey] ?? [];
}

// ─── KYC Pre-fill ─────────────────────────────────────────────────────────────

interface KycPrefill {
  fullName: string;
  address: string;
  barangay: string;
  dateOfBirth: string;
}

async function fetchKycPrefill(): Promise<KycPrefill | null> {
  const user = auth().currentUser;
  if (!user) return null;

  try {
    const kycDoc = await firestore()
      .collection('citizens')
      .doc(user.uid)
      .collection('kyc')
      .doc('data')
      .get();

    if (!kycDoc.exists) {
      // Fall back to user profile
      const profileDoc = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();
      const profile = profileDoc.data();
      if (!profile) return null;
      return {
        fullName: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || '',
        address: profile.address || '',
        barangay: profile.barangay || '',
        dateOfBirth: '',
      };
    }

    const kyc = kycDoc.data();
    const profileDoc = await firestore().collection('users').doc(user.uid).get();
    const profile = profileDoc.data();

    return {
      fullName: kyc?.nameExtracted || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || '',
      address: kyc?.householdData?.homeAddress || profile?.address || '',
      barangay: profile?.barangay || kyc?.householdData?.barangay || '',
      dateOfBirth: kyc?.dateOfBirth || '',
    };
  } catch (err) {
    console.warn('[LguServices] KYC prefill fetch failed:', err);
    return null;
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ServiceRequestFormScreen() {
  const router = useRouter();
  const { templateKey } = useLocalSearchParams<{ templateKey: string }>();

  const [kyc, setKyc] = useState<KycPrefill | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const template: LguServiceTemplate | undefined = DEFAULT_SERVICE_CATALOG.find(
    (s) => s.templateKey === templateKey
  );

  const fields = getFieldsForTemplate(templateKey ?? '');

  useEffect(() => {
    setKycLoading(true);
    fetchKycPrefill()
      .then(setKyc)
      .catch((err) => console.warn('[LguServices] prefill err:', err))
      .finally(() => setKycLoading(false));
  }, []);

  const isFieldVisible = useCallback(
    (field: StaticFormField): boolean => {
      if (field.type === 'text' || field.type === 'textarea') {
        if (!field.showWhen) return true;
        const currentVal = formValues[field.showWhen.field] ?? '';
        return field.showWhen.includes.some((v) => currentVal.startsWith(v));
      }
      return true;
    },
    [formValues]
  );

  const handleSubmit = async () => {
    // Validate required fields
    for (const field of fields) {
      if (!isFieldVisible(field)) continue;
      if (field.required && !formValues[field.key]?.trim()) {
        Alert.alert('Required field', `Please fill in "${field.label}".`);
        return;
      }
    }

    if (!template) {
      Alert.alert('Error', 'Service template not found.');
      return;
    }

    setSubmitting(true);
    try {
      const { referenceNumber, requestId } = await submitServiceRequest({
        templateKey: templateKey!,
        serviceName: template.name,
        office: template.office,
        feeAmount: template.feeAmount,
        formData: {
          ...formValues,
          kyc_fullName: kyc?.fullName ?? '',
          kyc_address: kyc?.address ?? '',
          kyc_barangay: kyc?.barangay ?? '',
          kyc_dateOfBirth: kyc?.dateOfBirth ?? '',
        },
        lguPsgcCode: kyc?.barangay ?? 'unknown',
      });

      router.replace({
        pathname: '/lgu-services/confirmation',
        params: {
          referenceNumber,
          requestId,
          serviceName: template.name,
          office: template.office,
          feeLabel: template.feeLabel,
          processingDays: String(template.processingDays),
        },
      });
    } catch (err: any) {
      Alert.alert('Submission failed', err?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!template) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service not found</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>This service is not available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {template.name}
          </Text>
          <Text style={styles.headerSub}>
            {template.office} · {template.feeLabel}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* KYC Pre-filled fields */}
          <Text style={styles.sectionLabel}>PRE-FILLED FROM YOUR PROFILE</Text>

          {kycLoading ? (
            <View style={styles.kycLoading}>
              <ActivityIndicator size="small" color={AERIS_TEAL} />
              <Text style={styles.kycLoadingText}>Loading your profile...</Text>
            </View>
          ) : (
            <View style={styles.kycCard}>
              <KycReadOnlyField
                label="Full name"
                value={kyc?.fullName || 'Not set'}
                missing={!kyc?.fullName}
              />
              <KycReadOnlyField
                label="Address"
                value={kyc?.address || 'Not set'}
                missing={!kyc?.address}
              />
              <KycReadOnlyField
                label="Barangay"
                value={kyc?.barangay || 'Not set'}
                missing={!kyc?.barangay}
              />
              {kyc?.dateOfBirth ? (
                <KycReadOnlyField label="Date of birth" value={kyc.dateOfBirth} />
              ) : null}
              <TouchableOpacity
                style={styles.updateKycBtn}
                onPress={() => router.push('/kyc')}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={13} color={AERIS_TEAL} />
                <Text style={styles.updateKycText}>Update your profile</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Dynamic / static fields */}
          {fields.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>REQUEST DETAILS</Text>
              {fields.map((field) => {
                if (!isFieldVisible(field)) return null;
                if (field.type === 'dropdown') {
                  return (
                    <DropdownField
                      key={field.key}
                      field={field}
                      value={formValues[field.key] ?? ''}
                      isOpen={dropdownOpen === field.key}
                      onToggle={() =>
                        setDropdownOpen(dropdownOpen === field.key ? null : field.key)
                      }
                      onSelect={(val) => {
                        setFormValues((prev) => ({ ...prev, [field.key]: val }));
                        setDropdownOpen(null);
                      }}
                    />
                  );
                }
                if (field.type === 'text' || field.type === 'textarea') {
                  return (
                    <TextFormField
                      key={field.key}
                      field={field}
                      value={formValues[field.key] ?? ''}
                      onChange={(val) =>
                        setFormValues((prev) => ({ ...prev, [field.key]: val }))
                      }
                    />
                  );
                }
                return null;
              })}

              {/* TODO: Dynamic fields loaded from service_templates via Supabase.
                   When Supabase integration is live, replace STATIC_FIELDS lookup above
                   with a call to the render-service-form Edge Function and render fields
                   here using the DynamicFieldRenderer component (to be built in Phase 2). */}
            </>
          )}

          {/* Fee and payment info */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>FEE</Text>
          <View style={styles.feeCard}>
            <Text style={styles.feeAmount}>{template.feeLabel}</Text>
            {template.feeAmount !== null && template.feeAmount > 0 && (
              <View style={styles.paymentOption}>
                <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.paymentText}>
                  Pay at {template.office} using your reference number
                </Text>
              </View>
            )}
            {template.feeAmount === 0 && (
              <View style={styles.paymentOption}>
                <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.success} />
                <Text style={[styles.paymentText, { color: theme.colors.success }]}>
                  No fee required
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.gcashBtn} activeOpacity={0.7} disabled>
              <Ionicons name="phone-portrait-outline" size={16} color={theme.colors.textLight} />
              <Text style={styles.gcashText}>Pay online with GCash</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>COMING SOON</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit button */}
        <View style={styles.submitWrapper}>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#FFF" />
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function KycReadOnlyField({
  label,
  value,
  missing = false,
}: {
  label: string;
  value: string;
  missing?: boolean;
}) {
  return (
    <View style={kycStyles.row}>
      <View style={kycStyles.left}>
        <Ionicons name="lock-closed-outline" size={12} color={theme.colors.textLight} />
        <Text style={kycStyles.label}>{label}</Text>
      </View>
      <Text style={[kycStyles.value, missing && kycStyles.missingValue]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const kycStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  missingValue: {
    color: theme.colors.error,
    fontStyle: 'italic',
  },
});

function DropdownField({
  field,
  value,
  isOpen,
  onToggle,
  onSelect,
}: {
  field: StaticDropdownField;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (val: string) => void;
}) {
  return (
    <View style={formStyles.fieldWrap}>
      <Text style={formStyles.fieldLabel}>
        {field.label}
        {field.required && <Text style={formStyles.required}> *</Text>}
      </Text>
      <TouchableOpacity style={formStyles.dropdownTrigger} onPress={onToggle} activeOpacity={0.7}>
        <Text style={[formStyles.dropdownValue, !value && formStyles.placeholder]}>
          {value || `Select ${field.label.toLowerCase()}...`}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={formStyles.dropdownList}>
          {field.options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[formStyles.dropdownItem, value === option && formStyles.dropdownItemSelected]}
              onPress={() => onSelect(option)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  formStyles.dropdownItemText,
                  value === option && formStyles.dropdownItemTextSelected,
                ]}
              >
                {option}
              </Text>
              {value === option && (
                <Ionicons name="checkmark" size={16} color={AERIS_TEAL} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function TextFormField({
  field,
  value,
  onChange,
}: {
  field: StaticTextField;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <View style={formStyles.fieldWrap}>
      <Text style={formStyles.fieldLabel}>
        {field.label}
        {field.required ? (
          <Text style={formStyles.required}> *</Text>
        ) : (
          <Text style={formStyles.optional}> (optional)</Text>
        )}
      </Text>
      <TextInput
        style={[formStyles.textInput, field.type === 'textarea' && formStyles.textArea]}
        value={value}
        onChangeText={onChange}
        placeholder={field.placeholder ?? ''}
        placeholderTextColor={theme.colors.textLight}
        multiline={field.type === 'textarea'}
        numberOfLines={field.type === 'textarea' ? 4 : 1}
        textAlignVertical={field.type === 'textarea' ? 'top' : 'center'}
      />
    </View>
  );
}

const formStyles = StyleSheet.create({
  fieldWrap: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  required: {
    color: theme.colors.error,
  },
  optional: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontWeight: '400',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  placeholder: {
    color: theme.colors.textLight,
  },
  dropdownList: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: AERIS_TEAL_LIGHT,
  },
  dropdownItemText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#005049',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 48,
  },
  textArea: {
    height: 100,
    paddingTop: 13,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  kycLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 4,
  },
  kycLoadingText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  kycCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  updateKycBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  updateKycText: {
    fontSize: 12,
    fontWeight: '600',
    color: AERIS_TEAL,
  },
  feeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  feeAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  gcashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    opacity: 0.6,
  },
  gcashText: {
    fontSize: 13,
    color: theme.colors.textLight,
    fontWeight: '600',
    flex: 1,
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  submitWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.md,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AERIS_TEAL,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    ...theme.shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
