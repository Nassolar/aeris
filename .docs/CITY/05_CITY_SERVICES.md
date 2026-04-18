# AERIS Citizen App — City Services: Document Request Flows
## Spec for: `aeris` (React Native / Expo)
## Depends on: CITY_TAB.md, KYC_FLOW.md (KYC verified required for all)
## Status: Ready to build

---

## Overview

Four document request flows accessible from `City > Services`. Each follows the same pattern:

```
Services List
  → Request Screen (form + requirements)
  → Review and Submit
  → Processing / Queue State
  → Ready for Pickup / Download State
```

All four share a common `DocumentRequestCard` component and a common `DocumentStatusScreen`.

---

## Shared Architecture

### Firestore Collection

```
issued_certificates/{certId}
  citizenUid: string
  lguPsgcCode: string
  certType: 'indigency' | 'barangay_clearance' | 'ctc' | 'solo_parent_id'
  status: 'pending' | 'processing' | 'ready' | 'released' | 'rejected'
  requestedAt: Timestamp
  readyAt: Timestamp | null
  releasedAt: Timestamp | null
  rejectedAt: Timestamp | null
  rejectionReason: string | null
  purpose: string
  documentUrl: string | null        // PDF download when ready
  verificationCode: string | null   // QR code data
  queueNumber: string | null        // e.g., "IND-2026-0042"
  metadata: object                  // cert-specific fields
```

### Cloud Functions

```
requestCertificate(certType, purpose, metadata)
  → creates issued_certificates doc
  → notifies LGU admin (barangay captain or treasurer)
  → returns certId + queueNumber

onCertificateReady (triggered by LGU admin marking as ready)
  → generates PDF with QR verification code
  → uploads to Storage
  → updates documentUrl
  → sends FCM push to citizen
```

### Shared Components

```
DocumentRequestCard — shows status, queue number, download button
DocumentStatusBadge — PENDING / PROCESSING / READY / RELEASED / REJECTED
DocumentPurposeSelector — common purpose picker used across all 4 flows
```

---

## Screen 1: Indigency Certificate

**Route:** `app/city/services/indigency.tsx`

### Purpose
Proof of low-income status. Most common barangay document. Used for:
- Hospital fee reduction (PhilHealth)
- Scholarship applications
- Legal aid
- Government housing applications

### Request Screen

```
┌─────────────────────────────────────────┐
│  ← Indigency Certificate               │
│                                         │
│  Request an Indigency Certificate      │
│  Issued by: Brgy. Batasan Hills        │
│  Processing time: 1-3 business days    │
│                                         │
│  REQUIREMENTS                          │
│  ✓ Verified AERIS account (you're set) │
│  ✓ Proof of residency on file         │
│                                         │
│  PURPOSE OF REQUEST                    │
│  [Hospital/Medical]                    │
│  [Scholarship Application]             │
│  [Legal Aid / PAO]                     │
│  [Government Housing]                  │
│  [Other — specify]                     │
│                                         │
│  Additional notes (optional)           │
│  [text input]                          │
│                                         │
│  FREE OF CHARGE                        │
│  This certificate is issued free       │
│  under Republic Act 11261.             │
│                                         │
│  [Request Certificate]                 │
└─────────────────────────────────────────┘
```

### Status Screen (after submission)

```
┌─────────────────────────────────────────┐
│  ← Indigency Certificate               │
│                                         │
│  [PENDING REVIEW]                      │
│                                         │
│  Queue No.: IND-2026-0042              │
│  Requested: March 23, 2026             │
│  For: Hospital/Medical                 │
│                                         │
│  What happens next:                    │
│  1. Barangay captain reviews           │
│  2. Certificate generated (1-3 days)   │
│  3. You get a push notification        │
│  4. Download or pick up at hall        │
│                                         │
│  [Cancel Request]                      │
└─────────────────────────────────────────┘
```

### Ready State

```
┌─────────────────────────────────────────┐
│  ← Indigency Certificate               │
│                                         │
│  ✓ READY FOR DOWNLOAD                  │
│                                         │
│  Queue No.: IND-2026-0042              │
│  Issued: March 25, 2026               │
│  Valid for: 6 months                   │
│                                         │
│  [QR Code — verification]              │
│  Verify at: lgu.aeristech.ai/verify/   │
│                                         │
│  [Download PDF]                        │
│  [Share]                               │
│  [View at Hall instead]               │
└─────────────────────────────────────────┘
```

---

## Screen 2: Barangay Clearance

**Route:** `app/city/services/clearance.tsx`

### Purpose
General-purpose clearance. Used for:
- Employment requirements
- Business permit applications
- School enrollment
- Loan applications

### Request Screen

```
┌─────────────────────────────────────────┐
│  ← Barangay Clearance                  │
│                                         │
│  Request a Barangay Clearance          │
│  Issued by: Brgy. Batasan Hills        │
│  Processing time: Same day – 2 days    │
│                                         │
│  REQUIREMENTS                          │
│  ✓ Verified AERIS account (you're set) │
│  ✓ No pending barangay cases           │
│                                         │
│  PURPOSE OF REQUEST                    │
│  [Employment]                          │
│  [Business Permit]                     │
│  [School / Enrollment]                 │
│  [Loan Application]                    │
│  [Travel / Visa]                       │
│  [Other — specify]                     │
│                                         │
│  For employment, enter employer name:  │
│  [text input — appears if Employment  │
│   selected]                            │
│                                         │
│  FEE: ₱50.00                          │
│  Payable at the barangay hall          │
│  (online payment coming soon)          │
│                                         │
│  [Request Clearance]                   │
└─────────────────────────────────────────┘
```

**Fee note:** Barangay clearance fee varies per LGU. Amount shown is pulled from
`lgu_config/{lguPsgcCode}/fees.barangay_clearance`. Default ₱50 if not configured.

### Conditional Field
- "Employer name" field appears only when PURPOSE = Employment
- "School name" field appears only when PURPOSE = School/Enrollment

---

## Screen 3: Community Tax Certificate (Cedula)

**Route:** `app/city/services/cedula.tsx`

### Purpose
Annual community tax certificate. Required for most notarized transactions.
Must be renewed every calendar year.

### Request Screen

```
┌─────────────────────────────────────────┐
│  ← Community Tax Certificate           │
│  (Cedula 2026)                         │
│                                         │
│  Get your Cedula for 2026              │
│  Issued by: Quezon City                │
│                                         │
│  COMPUTED FEE                          │
│  Basic community tax:     ₱5.00        │
│  Additional (income-based): ₱100.00   │
│  ─────────────────────────────────     │
│  Total:                   ₱105.00      │
│                                         │
│  Fee is based on your declared         │
│  income. Update income info:           │
│  [Edit Income Declaration →]           │
│                                         │
│  INCOME DECLARATION                    │
│  Annual income: ₱180,000               │
│  Source: Employment                    │
│  [Edit]                                │
│                                         │
│  HOW TO PAY                            │
│  [Pay at City Hall — ₱105]             │
│  [GCash]  Coming Soon                  │
│                                         │
│  [Request and Pay at Hall]             │
└─────────────────────────────────────────┘
```

**Fee calculation:**
```
Basic: ₱5.00 (fixed)
Additional: ₱1.00 per ₱1,000 of income + ₱1.00 per ₱1,000 of real property value
Cap: ₱5,000 total per RA 7160
```

**Income Declaration fields (stored in `citizens/{uid}/taxDeclaration`):**
- Annual income (number)
- Income source (employment / business / mixed / none)
- Real property value if applicable

**Already has cedula this year:**
```
┌─────────────────────────────────────────┐
│  ← Community Tax Certificate           │
│                                         │
│  ✓ Cedula 2026 already issued          │
│                                         │
│  CTC No.: QC-2026-1234567              │
│  Issued: January 15, 2026             │
│                                         │
│  [Download PDF]                        │
│  [Need a replacement?]                 │
└─────────────────────────────────────────┘
```

---

## Screen 4: Solo Parent ID

**Route:** `app/city/services/solo-parent.tsx`

### Purpose
Government ID for solo parents. Entitles holder to:
- 10% discount on baby products and services
- Flexible work arrangements
- Priority in government housing programs
- Parental leave benefits

### Request Screen

```
┌─────────────────────────────────────────┐
│  ← Solo Parent ID                      │
│                                         │
│  Apply for a Solo Parent ID            │
│  Under Republic Act 8972              │
│                                         │
│  ELIGIBILITY                           │
│  You qualify if you are raising a      │
│  child alone due to:                   │
│  • Death of spouse                     │
│  • Legal separation / annulment        │
│  • Spouse detained or incapacitated    │
│  • Unmarried parent                    │
│  • Other circumstances under RA 8972   │
│                                         │
│  REQUIRED DOCUMENTS                    │
│  Upload at least one of:               │
│                                         │
│  [Death Certificate of spouse]     +   │
│  [Marriage Certificate]            +   │
│  [Court Order / Legal Separation]  +   │
│  [Birth Certificate of child]      +   │
│                                         │
│  CHILD INFORMATION                     │
│  Number of children: [stepper]        │
│  Youngest child DOB: [date picker]    │
│                                         │
│  CIRCUMSTANCE                          │
│  [dropdown — select reason]            │
│                                         │
│  Processing time: 5-7 business days   │
│  FREE OF CHARGE                        │
│                                         │
│  [Submit Application]                  │
└─────────────────────────────────────────┘
```

**Document uploads:**
- Uses `expo-image-picker` (same as KYC flow)
- At least 1 document required before submit activates
- Images stored temporarily, uploaded with form submission
- Processed by LGU DSWD officer (not automated — requires human review)

**Validity:** Solo Parent ID is valid for 1 year, renewable annually.

**Renewal flow:**
- If existing ID found in `issued_certificates` where `certType == 'solo_parent_id'`:
  - Show renewal option instead of new application
  - Pre-fill all data from previous application
  - Only request updated documents if expired

---

## My Documents Screen

**Route:** `app/city/services/my-documents.tsx`
Also linked from Profile tab.

Shows all issued certificates for the current citizen:

```
┌─────────────────────────────────────────┐
│  ← My Documents                        │
│                                         │
│  ACTIVE DOCUMENTS                      │
│                                         │
│  Barangay Clearance                    │
│  Issued Jan 2026 · Valid 6 months  [↓] │
│                                         │
│  Cedula 2026                           │
│  CTC No. QC-2026-1234567           [↓] │
│                                         │
│  Solo Parent ID                        │
│  Valid until Dec 2026              [↓] │
│                                         │
│  PENDING                               │
│                                         │
│  Indigency Certificate                 │
│  Queue IND-2026-0042 · Processing  [→] │
│                                         │
│  EXPIRED / PAST                        │
│                                         │
│  Cedula 2025                           │
│  Expired Dec 2025                  [↓] │
│                                         │
└─────────────────────────────────────────┘
```

- `[↓]` = download PDF
- `[→]` = view status screen
- Firestore query: `issued_certificates` where `citizenUid == uid`, ordered by `requestedAt desc`

---

## Design Notes

- All request screens use the same card/form style as existing report screens
- Requirements checklist uses green checkmarks (same `#2ECC71` as LIVE badge)
- Fee amounts in bold black
- "Coming Soon" payment options: grey text, not disabled buttons
- Document type selector: same pill button style as KYC ID type selector
- Processing time shown prominently — sets expectations before submission
- FREE OF CHARGE label: green badge, prominent placement

---

## Acceptance Criteria

- [ ] All 4 service screens implement request form with validation
- [ ] Purpose selector required before submit activates on all screens
- [ ] Conditional fields appear/disappear correctly (employer name, school name)
- [ ] Cedula shows existing certificate if already issued this year
- [ ] Solo Parent ID requires at least 1 document upload
- [ ] Solo Parent ID shows renewal flow if existing record found
- [ ] Status screen shows queue number after submission
- [ ] Ready state shows download button and QR code
- [ ] My Documents screen lists all certificates with correct status
- [ ] `requestCertificate` Cloud Function called on submit
- [ ] Real-time Firestore listener updates status without app restart
- [ ] FCM push notification received when certificate is ready
