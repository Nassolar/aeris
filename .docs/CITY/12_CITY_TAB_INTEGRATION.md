# CITY TAB — Full LGU Services Integration
## Claude Code Task File | aeris (citizen app)

**Conductor Entry:** `Conductor: @docs/CITY_TAB_INTEGRATION.md`
**Scope:** City tab in AERIS citizen app — full 41-service integration with demo preview mode
**Firebase Project:** aeris-citizen-app-16265 (asia-southeast1)
**aeris-lgu Supabase ref:** vcfbcbwfichaitwlmqzm (ap-southeast-1)
**Stack:** React Native / Expo
**AI Model:** Gemini 2.5 Flash-Lite (all AI calls — never 2.0 Flash, deprecated June 1 2026)

---

## UI RULES (Non-Negotiable)

### Bottom Nav Icons
- All five icons (EMERGENCY, SERVICES, CITY, INBOX, PROFILE) use **outline/stroke only**
- **Never use filled icons** — not even on active state
- Active state = icon color changes to brand green only. Stroke weight unchanged.
- Inactive state = same outline icon, black/dark gray
- This is the Uber pattern. Do not deviate.
- Confirm which icon library is in use (likely `@expo/vector-icons` Ionicons outline
  variant or MaterialCommunityIcons outline variant) and enforce outline throughout.

---

## Two Modes

| Mode | Condition | Behavior |
|---|---|---|
| **Preview** | No live LGU for citizen's PSGC | Full catalog visible, "Preview" banner, no real submissions |
| **Live** | LGU deployed AERIS + `is_live: true` | Full catalog functional, real submissions to Supabase |

Citizens are detected by their registered PSGC from KYC. If no KYC yet, default to
Metro Manila preview with a prompt to verify identity to unlock their city's services.

---

## Phase 0 — Foundation

### 0.1 Three New Firebase Cloud Functions

Create in `functions/src/lgu/`:

- `getLGUServices` — Returns catalog + LGU live status + citizen's active requests
- `submitServiceRequest` — Citizen submits a request (hard-blocked in preview mode)
- `getCitizenRequests` — Returns citizen's active + recent request statuses

The citizen app NEVER calls Supabase directly. These functions are the only bridge.
All use service role key stored in Firebase Functions config — never exposed to client.

### 0.2 Supabase Migration 024

File: `aeris-lgu/supabase/migrations/024_service_requests.sql`

```sql
SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.service_requests (
  id                UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  lgu_psgc_code     TEXT NOT NULL,
  citizen_uid       TEXT NOT NULL,         -- Firebase UID only. Zero PII stored here.
  service_id        TEXT NOT NULL,
  reference_number  TEXT UNIQUE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN (
                        'pending','processing','ready','completed','rejected'
                      )),
  form_data         JSONB NOT NULL DEFAULT '{}',
  attachments       TEXT[] DEFAULT '{}',   -- Firebase Storage URLs
  pickup_code       TEXT,                  -- 4-digit code, NULL until status = 'ready'
  lgu_message       TEXT,
  assigned_to       UUID REFERENCES public.lgu_users(id),
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lgu_staff_read_requests"
  ON public.service_requests FOR SELECT
  USING (true);

-- No citizen-direct writes. All writes via Cloud Function service role only.

CREATE OR REPLACE FUNCTION public.generate_reference_number(
  p_service_code TEXT,
  p_psgc TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  v_seq  INT;
  v_year TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.service_requests
  WHERE service_id = p_service_code
    AND lgu_psgc_code = p_psgc
    AND EXTRACT(YEAR FROM submitted_at) = EXTRACT(YEAR FROM NOW());
  RETURN UPPER(REPLACE(p_service_code, '_', '')) || '-' || v_year || '-'
         || LPAD(v_seq::TEXT, 6, '0');
END;
$$;
```

### 0.3 Service Catalog Constant

Create `constants/serviceCatalog.ts` in the citizen app. This is the canonical list.
Preview mode returns this as-is. Live mode merges with LGU's `active_services` config.

```typescript
export type ServicePhase = 1 | 2 | 3;

export interface LGUService {
  id: string;
  label: string;
  description: string;
  fee: number | null;          // null = free
  processingDays: number;
  requiresKYC: boolean;
  requiresInPerson: boolean;
  phase: ServicePhase;
  specRef: string;
}

export interface ServiceCategory {
  id: string;
  label: string;
  icon: string;                // outline icon name
  services: LGUService[];
}
```

### 0.4 Env Vars

Add to Firebase Functions config. Never commit these values.

```
AERIS_LGU_SUPABASE_URL=https://vcfbcbwfichaitwlmqzm.supabase.co
AERIS_LGU_SUPABASE_SERVICE_ROLE_KEY=[from Supabase dashboard]
```

---

## Phase 1 — City Tab Shell + Preview Mode

**Goal:** Replace the empty state with the full service catalog UI in preview mode.
No real submissions yet. This is what the demo will show.

### 1.1 City Tab Screen Layout

Replace `screens/CityScreen.tsx` entirely. New layout top to bottom:

```
┌─────────────────────────────────────────────────────┐
│ City                          [Quezon City ▾]       │  ← Header
├─────────────────────────────────────────────────────┤
│ 👁  PREVIEW MODE                                    │  ← Preview Banner
│ These services will be available once your city     │     (amber, dismissible: NO)
│ deploys AERIS.          [Verify Identity →]         │
├─────────────────────────────────────────────────────┤
│ MY REQUESTS                              [See All]  │  ← Requests Section
│ ← [card] [card] →  (horizontal scroll)             │     (hidden if none)
├─────────────────────────────────────────────────────┤
│ [ 🔍  Search services...                       ]   │  ← Search Bar
├─────────────────────────────────────────────────────┤
│ All | Documents | Bills | Health | Welfare | ...   │  ← Category Tabs (H-scroll)
├─────────────────────────────────────────────────────┤
│  service cards list...                              │  ← Service List
│                                                     │
│  41 services · Powered by AERIS · aeristech.ai      │  ← Footer
└─────────────────────────────────────────────────────┘
```

### 1.2 Preview Banner

Component: `components/city/PreviewBanner.tsx`

- Background: `#FFF8E1` (amber-50)
- Left border: 3px solid `#F59E0B`
- Icon: outline eye icon, amber
- "Verify Identity" CTA routes to existing KYC flow
- Not dismissible — stays until LGU goes live
- Hidden completely in live mode

### 1.3 Category Tabs

Component: `components/city/ServiceCategoryTabs.tsx`

Horizontally scrollable. 9 tabs: All + 8 categories.
Active tab: green underline, black text. Inactive: gray text.

```
All  Documents  Bills  Health  Welfare  Permits  Concerns  Legal
```

### 1.4 Service Cards

Component: `components/city/ServiceCard.tsx`

```
┌─────────────────────────────────────────────────────┐
│ [icon]  Barangay Clearance             FREE    →   │
│         Ready in 1 working day                      │
│         Requires identity verification              │
└─────────────────────────────────────────────────────┘
```

Rules:
- Phase 3 services: show "Coming Soon" badge, card grayed out, not tappable
- Preview mode: all cards tappable (to open detail sheet) but submit is disabled
- Fee display: `null` = "Free", `0` = "Free", number = "₱{amount}"
- Processing: `0` = "Same day", `1` = "1 working day", `n` = "{n} working days"

### 1.5 Service Detail Bottom Sheet

Component: `components/city/ServiceDetailSheet.tsx`

Opens on card tap. Full detail + requirements + disabled submit in preview mode.

```
┌─────────────────────────────────────────────────────┐
│  [icon]  Barangay Clearance                   [×]  │
├─────────────────────────────────────────────────────┤
│  Required for employment, travel, and legal         │
│  transactions.                                      │
│                                                     │
│  Fee            Free                                │
│  Processing     1 working day                       │
│  Pickup         Not required — digital delivery     │
│                                                     │
│  Requirements                                       │
│  ✓ Verified identity (KYC)                         │
│  ✓ Valid government ID                             │
│  ✓ Purpose of request                              │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  🔒  Available when your city deploys AERIS │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [       Request This Service       ]  ← disabled  │
└─────────────────────────────────────────────────────┘
```

In live mode: lock removed, button active green, routes to Phase 3 form.

### 1.6 Full Service Catalog (All 41)

Hardcode in `constants/serviceCatalog.ts`:

**DOCUMENTS & CERTIFICATES**
1. `barangay_clearance` — Barangay Clearance — Free — 1 day — KYC required — Spec 10
2. `indigency_cert` — Certificate of Indigency — Free — 1 day — KYC required — Spec 10
3. `solo_parent_id` — Solo Parent ID (RA 8972) — Free — 3 days — KYC + in-person — Spec 10
4. `pwd_id` — PWD ID Application (RA 7277) — Free — 5 days — KYC + in-person — Spec 26
5. `senior_citizen_id` — Senior Citizen ID / Booklet (RA 9994) — Free — 3 days — KYC + in-person — Spec 27
6. `cedula` — Community Tax Certificate (Cedula) — ₱35 base — Same day — Spec 15
7. `birth_registration` — Birth / Late Birth Registration — Free — 5 days — Spec 37
8. `marriage_license` — Marriage License Application — ₱200 — 10 days — in-person — Spec 37
9. `death_registration` — Death Registration — Free — 3 days — Spec 37
10. `document_authentication` — Document Authentication / Certified True Copy — ₱100 — 1 day — Spec 37

**BILLS & PAYMENTS**
11. `rpt_view` — Real Property Tax — View balance — Same day — Spec 07
12. `rpt_payment` — RPT Payment — Variable — Same day — Phase 3 (Xendit) — Spec 07
13. `business_tax` — Business Tax Payment — Variable — Same day — Spec 07
14. `ebilling` — eBilling — View all bills — Same day — Spec 16
15. `payment_reference` — Walk-In Payment Reference Number — Free — Same day — Spec 16

**HEALTH**
16. `vaccination_record` — Vaccination Record Request — Free — 1 day — Spec 11
17. `philhealth_check` — PhilHealth Coverage Verification — Free — Same day — Spec 11
18. `prenatal_record` — Prenatal Visit Record — Free — 1 day — Spec 11
19. `health_certificate` — Health Certificate — ₱100 — 1 day — Spec 11

**WELFARE & SOCIAL SERVICES**
20. `aics_assistance` — AICS Crisis Assistance (Burial / Medical / Food) — Free — 3 days — Spec 38
21. `scholarship_application` — Scholarship Program Application — Free — 10 days — Spec 13
22. `4ps_verification` — 4Ps Beneficiary Verification — Free — 3 days — Phase 3 (DSWD MOU) — Spec 38
23. `welfare_delivery` — Welfare Delivery Code Lookup — Free — Same day — Spec 06

**PERMITS & LICENSING**
24. `business_permit_new` — New Business Permit — Variable — 7 days — Spec 12
25. `business_permit_renewal` — Business Permit Renewal — Variable — 3 days — Spec 12
26. `building_permit` — Building Permit (PD 1096) — Variable — 15 days — in-person — Spec 29
27. `occupancy_permit` — Certificate of Occupancy — Variable — 10 days — in-person — Spec 29
28. `demolition_permit` — Demolition Permit — Variable — 7 days — in-person — Spec 36
29. `fencing_permit` — Fencing Permit — Variable — 5 days — in-person — Spec 36
30. `electrical_permit` — Electrical / MEPF Permit — Variable — 5 days — in-person — Spec 36
31. `subdivision_clearance` — Subdivision / Condo Clearance — Phase 3 (HLURB) — Spec 42

**CONCERNS & REPORTS**
32. `concern_pothole` — Report Pothole / Road Damage — Free — Routed to LGU Engineer — Spec 04
33. `concern_flood` — Report Flooding / Drainage — Free — Routed to DRRMO — Spec 04
34. `concern_illegal_dumping` — Report Illegal Dumping — Free — Routed to DENR/LGU — Spec 04
35. `concern_street_light` — Report Street Light Outage — Free — Routed to LGU Engineer — Spec 04
36. `concern_noise` — Noise Complaint — Free — Routed to Barangay — Spec 04
37. `concern_other` — Other Concern — Free — AI-routed — Spec 04

**LEGAL & TRANSPARENCY**
38. `notary_request` — Notary / Document Authentication (IBP) — Variable — 1–3 days — IBP integration — Spec 41
39. `foi_request` — Freedom of Information (FOI) Request — Free — 15 working days — Spec FOI
40. `legal_instruments` — Legal Instruments Filing — Variable — 3 days — Phase 3 — Spec 41
41. `transparency_ledger` — View Public Transparency Ledger — Free — Live — Spec 17

### 1.7 Mock Requests for Preview Mode

Show two hardcoded mock requests in "My Requests". Flag as `isPreviewMock: true`.
Never persist these to Firestore or Supabase.

```
MY REQUESTS  (PREVIEW)
─────────────────────────────────────────────────
📄 Barangay Clearance              PROCESSING
   Ref: BRGYCLR-2026-000001
   Submitted Apr 5 · Est. Apr 7
─────────────────────────────────────────────────
🏥 Health Certificate              READY
   Ref: HEALTHCRT-2026-000001
   Code: 4821 · Window 3, City Hall
─────────────────────────────────────────────────
```

### 1.8 Demo Checklist — Phase 1 Complete When:

- [ ] Empty state fully replaced
- [ ] Preview banner visible, not dismissible
- [ ] All 8 category tabs render and filter correctly
- [ ] Search filters across all 41 service names and descriptions
- [ ] Phase 3 services show "Coming Soon" badge, grayed, not tappable
- [ ] Tapping any Phase 1/2 service opens the bottom sheet
- [ ] Submit button is disabled in preview mode
- [ ] Two mock requests appear in My Requests section
- [ ] All 5 nav icons are outline only — active = green color change, no fill
- [ ] City pill shows "Quezon City" hardcoded for demo (PSGC 137404000)

---

## Phase 2 — Cloud Functions + Live Submission

**Goal:** Wire up all three Cloud Functions. Enable real submissions when `is_live: true`.
KYC gate enforced server-side — cannot be bypassed from client.

### 2.1 getLGUServices

```typescript
// functions/src/lgu/getLGUServices.ts
export const getLGUServices = functions
  .region('asia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

    const { psgcCode } = data;

    const { data: lguConfig } = await supabase
      .from('lgu_configs')
      .select('lgu_name, is_live, active_services')
      .eq('psgc_code', psgcCode)
      .single();

    const isLive = lguConfig?.is_live === true;

    let activeRequests = [];
    if (isLive) {
      const { data: requests } = await supabase
        .from('service_requests')
        .select('*')
        .eq('citizen_uid', context.auth.uid)
        .eq('lgu_psgc_code', psgcCode)
        .neq('status', 'completed')
        .order('submitted_at', { ascending: false })
        .limit(10);
      activeRequests = requests ?? [];
    }

    return {
      lguName: lguConfig?.lgu_name ?? 'Your City',
      isLive,
      isPreview: !isLive,
      catalog: applyLGUOverrides(SERVICE_CATALOG, lguConfig?.active_services),
      activeRequests,
    };
  });
```

### 2.2 submitServiceRequest

```typescript
export const submitServiceRequest = functions
  .region('asia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

    const { serviceId, psgcCode, formData, attachments } = data;

    // Hard block — no submissions in preview mode
    const { data: lguConfig } = await supabase
      .from('lgu_configs').select('is_live, lgu_name')
      .eq('psgc_code', psgcCode).single();

    if (!lguConfig?.is_live) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This service is not yet available in your city.'
      );
    }

    // KYC gate — check Firestore
    const citizenDoc = await admin.firestore()
      .collection('citizens').doc(context.auth.uid).get();

    const service = findService(serviceId);
    if (service?.requiresKYC && citizenDoc.data()?.kycStatus !== 'verified') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Identity verification required to request this service.'
      );
    }

    const { data: refData } = await supabase.rpc('generate_reference_number', {
      p_service_code: serviceId,
      p_psgc: psgcCode,
    });

    const { data: request, error } = await supabase
      .from('service_requests')
      .insert({
        lgu_psgc_code: psgcCode,
        citizen_uid: context.auth.uid,
        service_id: serviceId,
        reference_number: refData,
        form_data: formData ?? {},
        attachments: attachments ?? [],
      })
      .select().single();

    if (error) throw new functions.https.HttpsError('internal', error.message);

    // FCM push to citizen
    const token = citizenDoc.data()?.fcmToken;
    if (token) {
      await admin.messaging().send({
        token,
        notification: {
          title: 'Request Submitted',
          body: `Your ${service?.label} request has been received. Ref: ${refData}`,
        },
      });
    }

    return {
      requestId: request.id,
      referenceNumber: refData,
      estimatedDays: service?.processingDays ?? 3,
      message: `Your request has been received by ${lguConfig.lgu_name}.`,
    };
  });
```

### 2.3 getCitizenRequests

```typescript
export const getCitizenRequests = functions
  .region('asia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

    const { data: requests } = await supabase
      .from('service_requests')
      .select('*')
      .eq('citizen_uid', context.auth.uid)
      .eq('lgu_psgc_code', data.psgcCode)
      .order('submitted_at', { ascending: false })
      .limit(20);

    return { requests: requests ?? [] };
  });
```

---

## Phase 3 — Service Request Forms

**Goal:** Schema-driven form renderer for all 41 services. One component, 19 form schemas.

### 3.1 Form Architecture

`components/city/ServiceRequestForm.tsx` — reads a `FormSchema`, renders the right fields.
No 41 separate screens. Form schemas live in `constants/formSchemas.ts`.

```typescript
interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'phone' | 'id_upload' | 'file_upload' | 'map_pin';
  required: boolean;
  placeholder?: string;
  options?: string[];
  hint?: string;
  prefilledFrom?: 'kyc.name' | 'kyc.address' | 'kyc.birthdate' | 'kyc.contact';
  conditional?: { fieldId: string; value: string };
}
```

### 3.2 Form Schemas by Service Group

**Documents (barangay_clearance, indigency_cert, solo_parent_id, pwd_id, senior_citizen_id)**
- `purpose_of_request` (select): Employment / Travel / Legal / School / Other
- `other_purpose` (text, conditional on "Other")
- `valid_id` (id_upload, required)
- `additional_docs` (file_upload, optional)

**Civil Registry (birth_registration, marriage_license, death_registration, document_authentication)**
- `document_type` (select)
- `full_name_on_record` (text)
- `date_of_event` (date)
- `place_of_event` (text)
- `relationship_to_subject` (select): Self / Parent / Spouse / Child / Legal Representative
- `purpose` (text)

**Cedula**
- `civil_status` (select, pre-filled from KYC)
- `occupation` (text)
- `employer` (text)
- `gross_income` (text)
- `has_real_property` (select): Yes / No
- `property_location` (text, conditional on "Yes")

**Health (vaccination_record, philhealth_check, prenatal_record, health_certificate)**
- `full_name` (text, pre-filled from KYC)
- `date_of_birth` (date, pre-filled from KYC)
- `philhealth_number` (text, for PhilHealth queries)
- `purpose` (text, for health certificate)

**AICS Crisis Assistance**
- `assistance_type` (select): Burial / Medical / Food / Educational
- `situation_description` (textarea, min 50 chars)
- `amount_requested` (text)
- `supporting_docs` (file_upload): Medical cert, death cert, etc.

**Scholarship**
- `school_name` (text)
- `year_level` (select)
- `gwa` (text): General Weighted Average
- `household_income` (text): Monthly household income
- `parent_names` (text)

**Business Permits**
- `business_name` (text)
- `business_address` (text)
- `business_nature` (select): Retail / Food / Services / Manufacturing / Other
- `estimated_capital` (text)

**Construction Permits (building, occupancy, demolition, fencing, electrical)**
- `lot_number` (text)
- `block_number` (text)
- `project_description` (textarea)
- `estimated_cost` (text)
- `architect_name` (text)
- `plan_upload` (file_upload, required)

**Concerns (pothole, flood, dumping, street_light, noise, other)**
- `location_description` (text): Street address or landmark
- `location_pin` (map_pin): Google Maps picker — GPS coordinates
- `description` (textarea, min 20 chars)
- `photo_upload` (file_upload, optional but encouraged)

**FOI Request**
- `agency` (select): List of QC agencies
- `document_requested` (textarea): Specific document + period
- `purpose` (textarea)
- `preferred_format` (select): Digital / Physical

### 3.3 Form UX Rules

- Pre-fill fields from KYC where `prefilledFrom` is set. Show label: "Pre-filled from your verified profile"
- File uploads → Firebase Storage: `service_requests/{uid}/{serviceId}/{timestamp}_{filename}`
- Max 5MB per file, 3 files max per request
- Show upload progress bar
- Confirm bottom sheet before calling `submitServiceRequest`
- On success: show reference number screen, offer to add to wallet/notes

---

## Phase 4 — My Requests Tracker

**Goal:** Citizens track all service requests in real time.

### 4.1 My Requests Section

Shown above the catalog. Horizontal scroll. Hidden if no requests.

```
MY REQUESTS                                [See All →]
─────────────────────────────────────
← swipe →

┌──────────────────────┐  ┌──────────────────────┐
│ 📄 Brgy Clearance    │  │ 🏥 Health Cert        │
│ ● PROCESSING         │  │ ● READY               │
│ BRGYCLR-2026-000023  │  │ Code: 4821            │
│ Est. Apr 10          │  │ Window 3, City Hall   │
└──────────────────────┘  └──────────────────────┘
```

Status pill colors:
- `pending` → gray
- `processing` → blue
- `ready` → green + pulse animation
- `completed` → muted gray
- `rejected` → red

### 4.2 Request Detail Screen

Tapping a request card opens a full detail screen:

```
← Back                        Barangay Clearance

Reference Number
BRGYCLR-2026-000023

Status
● READY FOR PICKUP

Timeline
✓ Submitted          Apr 5 · 9:14 AM
✓ Received           Apr 5 · 9:15 AM
✓ Processing         Apr 6 · 10:30 AM
✓ Ready              Apr 7 · 2:00 PM

Pickup Instructions
───────────────────────────────────────
Your code: 4821
Barangay Hall · Window 3
Mon–Fri 8AM–5PM

Message from Barangay Office:
"Your clearance is ready. Please bring
a valid ID upon pickup."
───────────────────────────────────────

[  Download Receipt  ]
```

### 4.3 Push Notifications (FCM)

Trigger on every status transition:
- `pending → processing`: "Your [service] request is being processed."
- `processing → ready`: "Your [service] is ready! Code: [4-digit]"
- `processing → rejected`: "Update on your [service] request — tap to view."
- `completed`: "Your [service] request is complete."

Poll `getCitizenRequests` every 60 seconds while the City tab is open.
Use Supabase Realtime via the Cloud Function for push when the tab is backgrounded.

---

## Phase 5 — Live Mode Polish

**Goal:** Final features that only apply when QC pilot goes live.

### 5.1 LGU Announcements

Show above My Requests. Max 2 announcements. Dismissible per session (not persisted).

```
QUEZON CITY
───────────────────────────────────────────────
📢  City Hall closed Apr 9 (Holy Wednesday).
    Services resume Apr 14. — QC City Hall
───────────────────────────────────────────────
```

Source: `lgu_announcements` table in aeris-lgu Supabase, returned via `getLGUServices`.

### 5.2 Queue Depth on Service Cards (Live Only)

```
📄 Barangay Clearance               FREE  →
   Usually ready in 1 day  ·  23 requests today
```

Source: COUNT from `service_requests` WHERE `service_id` = this AND submitted today.

### 5.3 KYC Identity Banner

If citizen is not KYC-verified, show above the catalog (below announcements):

```
┌─────────────────────────────────────────────────────┐
│ 🔐  Verify your identity to unlock all services      │
│     Takes 2 minutes. Required for most certificates. │
│                               [Verify Now →]        │
└─────────────────────────────────────────────────────┘
```

Hidden once `kycStatus === 'verified'`.

### 5.4 Transparency Ledger Deep Link

`transparency_ledger` (service 41) opens WebView:
`https://lgu.aeristech.ai/public/{lguSlug}`

No auth required. Public ISR page.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `screens/CityScreen.tsx` | Replace — full redesign |
| `components/city/PreviewBanner.tsx` | New |
| `components/city/ServiceCategoryTabs.tsx` | New |
| `components/city/ServiceCard.tsx` | New |
| `components/city/ServiceDetailSheet.tsx` | New |
| `components/city/MyRequestsSection.tsx` | New |
| `components/city/RequestDetailScreen.tsx` | New |
| `components/city/ServiceRequestForm.tsx` | New |
| `constants/serviceCatalog.ts` | New |
| `constants/formSchemas.ts` | New |
| `hooks/useLGUServices.ts` | New |
| `hooks/useCitizenRequests.ts` | New |
| `navigation/BottomTabNavigator.tsx` | Modify — outline icons, all 5 tabs |
| `functions/src/lgu/getLGUServices.ts` | New |
| `functions/src/lgu/submitServiceRequest.ts` | New |
| `functions/src/lgu/getCitizenRequests.ts` | New |
| `aeris-lgu/supabase/migrations/024_service_requests.sql` | New |

---

## Phase Summary

| Phase | Deliverable | Dependency |
|---|---|---|
| **0** | Migration 024 + Cloud Function scaffolds + service catalog constant | Nothing |
| **1** | Full City tab UI in preview mode — all 41 services, mock requests, outline nav icons | Phase 0 |
| **2** | Cloud Functions live + real submissions enabled + KYC gate | Phase 0 + LGU `is_live` flag |
| **3** | Schema-driven request forms for all 41 services | Phase 2 |
| **4** | My Requests tracker + request detail + FCM push on status change | Phase 2 |
| **5** | Announcements + queue depth + KYC banner + transparency ledger link | Phase 2 + QC pilot live |
