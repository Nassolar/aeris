/**
 * serviceCatalog.ts — AERIS Phase 0.3
 * 41-service LGU catalog for the City tab preview.
 * Phase 2 will hydrate this from Supabase service_templates.
 */

export type ServicePhase = 1 | 2 | 3;

export interface LGUService {
  id: string;
  label: string;
  description: string;
  fee: number | null;        // null = free
  processingDays: number;    // 0 = same day
  requiresKYC: boolean;
  requiresInPerson: boolean;
  phase: ServicePhase;
  specRef: string;
  categoryId: string;        // foreign key to ServiceCategory.id
}

export interface ServiceCategory {
  id: string;
  label: string;
  icon: string;              // Ionicons outline icon name
  services: LGUService[];
}

// ─── Documents ────────────────────────────────────────────────────────────────

const documentServices: LGUService[] = [
  {
    id: 'barangay_clearance',
    label: 'Barangay Clearance',
    description: 'Required for employment, travel, and legal transactions.',
    fee: null,
    processingDays: 1,
    requiresKYC: true,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 10',
    categoryId: 'documents',
  },
  {
    id: 'indigency_cert',
    label: 'Certificate of Indigency',
    description: 'For assistance programs, tuition discounts, and legal aid.',
    fee: null,
    processingDays: 1,
    requiresKYC: true,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 10',
    categoryId: 'documents',
  },
  {
    id: 'solo_parent_id',
    label: 'Solo Parent ID (RA 8972)',
    description: 'Government ID for solo parents granting access to benefits.',
    fee: null,
    processingDays: 3,
    requiresKYC: true,
    requiresInPerson: true,
    phase: 1,
    specRef: 'Spec 10',
    categoryId: 'documents',
  },
  {
    id: 'pwd_id',
    label: 'PWD ID Application (RA 7277)',
    description: 'Person with Disability ID for discounts and privileges.',
    fee: null,
    processingDays: 5,
    requiresKYC: true,
    requiresInPerson: true,
    phase: 1,
    specRef: 'Spec 26',
    categoryId: 'documents',
  },
  {
    id: 'senior_citizen_id',
    label: 'Senior Citizen ID / Booklet (RA 9994)',
    description: 'Senior Citizen ID granting 20% discount and other benefits.',
    fee: null,
    processingDays: 3,
    requiresKYC: true,
    requiresInPerson: true,
    phase: 1,
    specRef: 'Spec 27',
    categoryId: 'documents',
  },
  {
    id: 'cedula',
    label: 'Community Tax Certificate (Cedula)',
    description: 'Annual community tax certificate required for many transactions.',
    fee: 35,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 15',
    categoryId: 'documents',
  },
  {
    id: 'birth_registration',
    label: 'Birth / Late Birth Registration',
    description: 'Civil registry registration for newborns or late registrations.',
    fee: null,
    processingDays: 5,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 37',
    categoryId: 'documents',
  },
  {
    id: 'marriage_license',
    label: 'Marriage License Application',
    description: 'Apply for a marriage license required before solemnization.',
    fee: 200,
    processingDays: 10,
    requiresKYC: false,
    requiresInPerson: true,
    phase: 1,
    specRef: 'Spec 37',
    categoryId: 'documents',
  },
  {
    id: 'death_registration',
    label: 'Death Registration',
    description: 'Civil registry registration of death for deceased individuals.',
    fee: null,
    processingDays: 3,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 37',
    categoryId: 'documents',
  },
  {
    id: 'document_authentication',
    label: 'Document Authentication / Certified True Copy',
    description: 'Request certified true copies of official LGU documents.',
    fee: 100,
    processingDays: 1,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 37',
    categoryId: 'documents',
  },
];

// ─── Bills & Payments ─────────────────────────────────────────────────────────

const billsServices: LGUService[] = [
  {
    id: 'rpt_view',
    label: 'Real Property Tax — View Balance',
    description: 'Check your real property tax balance and payment history.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 07',
    categoryId: 'bills',
  },
  {
    id: 'rpt_payment',
    label: 'RPT Payment',
    description: 'Pay your real property tax online via Xendit.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 3,
    specRef: 'Spec 07',
    categoryId: 'bills',
  },
  {
    id: 'business_tax',
    label: 'Business Tax Payment',
    description: 'Pay annual business tax for your registered business.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 2,
    specRef: 'Spec 07',
    categoryId: 'bills',
  },
  {
    id: 'ebilling',
    label: 'eBilling — View All Bills',
    description: 'View all LGU bills and payment status in one place.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 16',
    categoryId: 'bills',
  },
  {
    id: 'payment_reference',
    label: 'Walk-In Payment Reference Number',
    description: 'Generate a reference number for paying bills at City Hall.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 16',
    categoryId: 'bills',
  },
];

// ─── Health ───────────────────────────────────────────────────────────────────

const healthServices: LGUService[] = [
  {
    id: 'vaccination_record',
    label: 'Vaccination Record Request',
    description: 'Request your official vaccination history from RHU.',
    fee: null,
    processingDays: 1,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 11',
    categoryId: 'health',
  },
  {
    id: 'philhealth_check',
    label: 'PhilHealth Coverage Verification',
    description: 'Verify your PhilHealth coverage and contribution status.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 11',
    categoryId: 'health',
  },
  {
    id: 'prenatal_record',
    label: 'Prenatal Visit Record',
    description: 'Access your prenatal check-up records from the health center.',
    fee: null,
    processingDays: 1,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 11',
    categoryId: 'health',
  },
  {
    id: 'health_certificate',
    label: 'Health Certificate',
    description: 'Required for employment and food handler clearance.',
    fee: 100,
    processingDays: 1,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 11',
    categoryId: 'health',
  },
];

// ─── Welfare ──────────────────────────────────────────────────────────────────

const welfareServices: LGUService[] = [
  {
    id: 'aics_assistance',
    label: 'AICS Crisis Assistance (Burial / Medical / Food)',
    description: 'Assistance from the City Social Welfare for crisis situations.',
    fee: null,
    processingDays: 3,
    requiresKYC: true,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 38',
    categoryId: 'welfare',
  },
  {
    id: 'scholarship_application',
    label: 'Scholarship Program Application',
    description: 'Apply for city scholarship programs for deserving students.',
    fee: null,
    processingDays: 10,
    requiresKYC: true,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 13',
    categoryId: 'welfare',
  },
  {
    id: '4ps_verification',
    label: '4Ps Beneficiary Verification',
    description: 'Verify your 4Ps beneficiary status (DSWD integration).',
    fee: null,
    processingDays: 3,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 3,
    specRef: 'Spec 38',
    categoryId: 'welfare',
  },
  {
    id: 'welfare_delivery',
    label: 'Welfare Delivery Code Lookup',
    description: 'Look up your welfare delivery pickup code.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 06',
    categoryId: 'welfare',
  },
];

// ─── Permits ──────────────────────────────────────────────────────────────────

const permitsServices: LGUService[] = [
  {
    id: 'business_permit_new',
    label: 'New Business Permit',
    description: 'Apply for a new business permit to operate legally.',
    fee: null,
    processingDays: 7,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 2,
    specRef: 'Spec 12',
    categoryId: 'permits',
  },
  {
    id: 'business_permit_renewal',
    label: 'Business Permit Renewal',
    description: 'Renew your existing business permit annually.',
    fee: null,
    processingDays: 3,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 2,
    specRef: 'Spec 12',
    categoryId: 'permits',
  },
  {
    id: 'building_permit',
    label: 'Building Permit (PD 1096)',
    description: 'Required permit before construction of any structure.',
    fee: null,
    processingDays: 15,
    requiresKYC: false,
    requiresInPerson: true,
    phase: 2,
    specRef: 'Spec 29',
    categoryId: 'permits',
  },
  {
    id: 'occupancy_permit',
    label: 'Certificate of Occupancy',
    description: 'Required before occupying a newly constructed building.',
    fee: null,
    processingDays: 10,
    requiresKYC: false,
    requiresInPerson: true,
    phase: 2,
    specRef: 'Spec 29',
    categoryId: 'permits',
  },
  {
    id: 'demolition_permit',
    label: 'Demolition Permit',
    description: 'Required before demolishing any existing structure.',
    fee: null,
    processingDays: 7,
    requiresKYC: false,
    requiresInPerson: true,
    phase: 2,
    specRef: 'Spec 36',
    categoryId: 'permits',
  },
  {
    id: 'fencing_permit',
    label: 'Fencing Permit',
    description: 'Required before constructing perimeter fences or walls.',
    fee: null,
    processingDays: 5,
    requiresKYC: false,
    requiresInPerson: true,
    phase: 2,
    specRef: 'Spec 36',
    categoryId: 'permits',
  },
  {
    id: 'electrical_permit',
    label: 'Electrical / MEPF Permit',
    description: 'Required for electrical, mechanical, and plumbing installations.',
    fee: null,
    processingDays: 5,
    requiresKYC: false,
    requiresInPerson: true,
    phase: 2,
    specRef: 'Spec 36',
    categoryId: 'permits',
  },
  {
    id: 'subdivision_clearance',
    label: 'Subdivision / Condo Clearance (HLURB)',
    description: 'Clearance for subdivision and condominium projects.',
    fee: null,
    processingDays: 15,
    requiresKYC: false,
    requiresInPerson: true,
    phase: 3,
    specRef: 'Spec 42',
    categoryId: 'permits',
  },
];

// ─── Concerns ─────────────────────────────────────────────────────────────────

const concernsServices: LGUService[] = [
  {
    id: 'concern_pothole',
    label: 'Report Pothole / Road Damage',
    description: 'Report road damage or potholes for LGU Engineer routing.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 04',
    categoryId: 'concerns',
  },
  {
    id: 'concern_flood',
    label: 'Report Flooding / Drainage',
    description: 'Report flooding or drainage issues to DRRMO.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 04',
    categoryId: 'concerns',
  },
  {
    id: 'concern_illegal_dumping',
    label: 'Report Illegal Dumping',
    description: 'Report illegal waste disposal to DENR or LGU.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 04',
    categoryId: 'concerns',
  },
  {
    id: 'concern_street_light',
    label: 'Report Street Light Outage',
    description: 'Report broken or missing street lights to LGU Engineer.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 04',
    categoryId: 'concerns',
  },
  {
    id: 'concern_noise',
    label: 'Noise Complaint',
    description: 'File a noise complaint routed to the barangay.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 04',
    categoryId: 'concerns',
  },
  {
    id: 'concern_other',
    label: 'Other Concern',
    description: 'Submit any other concern — AI-routed to the right department.',
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 04',
    categoryId: 'concerns',
  },
];

// ─── Legal ────────────────────────────────────────────────────────────────────

const legalServices: LGUService[] = [
  {
    id: 'notary_request',
    label: 'Notary / Document Authentication (IBP)',
    description: 'Request notarization through IBP-accredited partners.',
    fee: null,
    processingDays: 1,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 3,
    specRef: 'Spec 41',
    categoryId: 'legal',
  },
  {
    id: 'foi_request',
    label: 'Freedom of Information (FOI) Request',
    description: 'Request official government documents under RA 11313.',
    fee: null,
    processingDays: 15,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 2,
    specRef: 'Spec FOI',
    categoryId: 'legal',
  },
  {
    id: 'legal_instruments',
    label: 'Legal Instruments Filing',
    description: 'File legal instruments through the City Legal Office.',
    fee: null,
    processingDays: 3,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 3,
    specRef: 'Spec 41',
    categoryId: 'legal',
  },
  {
    id: 'transparency_ledger',
    label: 'View Public Transparency Ledger',
    description: "View the city's public spending and budget transparency data.",
    fee: null,
    processingDays: 0,
    requiresKYC: false,
    requiresInPerson: false,
    phase: 1,
    specRef: 'Spec 17',
    categoryId: 'legal',
  },
];

// ─── Catalog ──────────────────────────────────────────────────────────────────

export const SERVICE_CATALOG: ServiceCategory[] = [
  {
    id: 'documents',
    label: 'Documents',
    icon: 'document-text-outline',
    services: documentServices,
  },
  {
    id: 'bills',
    label: 'Bills & Payments',
    icon: 'receipt-outline',
    services: billsServices,
  },
  {
    id: 'health',
    label: 'Health',
    icon: 'medical-outline',
    services: healthServices,
  },
  {
    id: 'welfare',
    label: 'Welfare',
    icon: 'heart-outline',
    services: welfareServices,
  },
  {
    id: 'permits',
    label: 'Permits',
    icon: 'construct-outline',
    services: permitsServices,
  },
  {
    id: 'concerns',
    label: 'Concerns',
    icon: 'alert-circle-outline',
    services: concernsServices,
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: 'shield-checkmark-outline',
    services: legalServices,
  },
];

export default SERVICE_CATALOG;

/** Flat array of all 41 services — used for search filtering. */
export const SERVICE_CATALOG_FLAT: LGUService[] = SERVICE_CATALOG.flatMap(
  (cat) => cat.services,
);
