# AERIS Citizen App — KYC Onboarding Flow
## Spec for: `aeris` (React Native / Expo)
## Depends on: NAV_RESTRUCTURE.md, CITY_TAB.md
## Status: Ready to build

---

## Trigger

KYC is NOT shown on login. It is triggered when a citizen taps into a KYC-gated feature (Bills, Welfare, document requests) and has no verified KYC for that LGU scope.

**Gate check logic:**
```typescript
const isKycVerified = citizen?.lguScopes?.primary?.kycStatus === 'verified';
```

If not verified, show the KYC gate bottom sheet (see CITY_TAB.md). Tapping "Start Verification" launches this flow as a modal stack navigator — it slides up over the City tab and can be dismissed.

---

## Screen Flow

```
KYC Gate Bottom Sheet
  → [Start Verification]
      → Screen 1: Welcome
      → Screen 2: ID Upload
      → Screen 3: Selfie
      → Screen 4: Proof of Residence
      → Screen 5: Household Declaration
      → Screen 6: Review and Submit
      → Processing / Success State
```

---

## Screen 1: Welcome

```
┌─────────────────────────────────────────┐
│  ← [X]                                  │
│                                         │
│  [Shield icon — large, centered]        │
│                                         │
│  Verify your identity to               │
│  unlock all AERIS city services         │
│                                         │
│  ✓  Pay your bills without queuing     │
│  ✓  Request certificates from home     │
│  ✓  Receive welfare delivery codes     │
│  ✓  Get DOST hazard alerts for         │
│     your barangay                       │
│                                         │
│  Your information is protected under   │
│  RA 10173 (Data Privacy Act).          │
│                                         │
│  [Start Verification]                   │
│  [Skip for now]                         │
└─────────────────────────────────────────┘
```

- Progress bar not shown on this screen (it's a welcome, not a step)
- "Skip for now" dismisses the entire KYC modal

---

## Screen 2: ID Upload

```
┌─────────────────────────────────────────┐
│  ← Identity Verification    Step 1 of 4│
│  ████░░░░░░░░░░░░░ 25%                 │
│                                         │
│  Upload a government-issued ID          │
│  Select the type of ID you have:        │
│                                         │
│  [UMID]          [PhilSys]             │
│  [Driver's License]  [Passport]        │
│  [Postal ID]     [Voter's ID]          │
│                                         │
│  ─────────────────────────────────     │
│                                         │
│  [📷 Take Photo — Front]               │
│  [📷 Take Photo — Back]                │
│                                         │
│  Tip: Ensure all text is readable      │
│  and the ID is fully in frame.         │
│                                         │
│  [Continue]  ← disabled until both    │
│                photos captured         │
└─────────────────────────────────────────┘
```

- ID type selection is single-select pill buttons
- Uses `expo-image-picker` (already in app) — camera mode preferred, gallery as fallback
- Both front and back required (except Passport — back optional)
- Thumbnail previews shown after capture with option to retake
- Images stored temporarily in local state only — NOT uploaded until Step 6 submission

---

## Screen 3: Selfie / Liveness Check

```
┌─────────────────────────────────────────┐
│  ← Identity Verification    Step 2 of 4│
│  ████████░░░░░░░░ 50%                  │
│                                         │
│  Take a selfie                          │
│  We'll match this to your ID photo.    │
│                                         │
│  [Camera viewfinder — oval frame]       │
│  Position your face in the oval         │
│                                         │
│  Tips:                                  │
│  • Good lighting, face forward          │
│  • Remove sunglasses or hat             │
│  • Neutral expression                   │
│                                         │
│  [Take Selfie]                          │
└─────────────────────────────────────────┘
```

- Uses front-facing camera
- Oval face guide overlay on viewfinder
- Phase 1: static selfie only (no liveness animation)
- Phase 2: add blink/turn head liveness detection

---

## Screen 4: Proof of Residence

```
┌─────────────────────────────────────────┐
│  ← Identity Verification    Step 3 of 4│
│  ████████████░░░░ 75%                  │
│                                         │
│  Confirm your address                   │
│  Upload one of the following:           │
│                                         │
│  [Barangay Certificate]                 │
│  [Utility Bill]                         │
│  [Lease Contract]                       │
│                                         │
│  [📎 Upload Document]                   │
│                                         │
│  Must show your name and address.      │
│  Document must be dated within         │
│  the last 3 months.                    │
│                                         │
│  [Continue]                             │
│  [Skip — I'll do this later]           │
└─────────────────────────────────────────┘
```

- Document type selection required before upload button activates
- "Skip" allowed — citizen can complete KYC without residence proof initially
- LGU admin can flag residence proof as required for specific services

---

## Screen 5: Household Declaration

```
┌─────────────────────────────────────────┐
│  ← Identity Verification    Step 4 of 4│
│  ████████████████ 100%                 │
│                                         │
│  Tell us about your household          │
│  This helps us route welfare programs  │
│  and evacuation priority to you.       │
│                                         │
│  Number of dependents                  │
│  [  0  ]  [−]  [+]                    │
│                                         │
│  Senior citizen in household           │
│  [Toggle]                              │
│                                         │
│  PWD in household                      │
│  [Toggle]                              │
│  PWD type: [text input — if toggle on] │
│                                         │
│  Home address                          │
│  [Auto-filled from GPS if available]   │
│  [Text input — editable]               │
│                                         │
│  [Continue to Review]                  │
└─────────────────────────────────────────┘
```

- Number of dependents: min 0, integer stepper
- Address auto-filled via `expo-location` reverse geocode if permission granted
- All fields optional — citizen can proceed without filling

---

## Screen 6: Review and Submit

```
┌─────────────────────────────────────────┐
│  ← Review                              │
│                                         │
│  Review your information               │
│  ─────────────────────────────────     │
│  ID TYPE        PhilSys                │
│  NAME           Juan R. Dela Cruz      │
│                 (extracted from ID)    │
│  ADDRESS        456 Matandang Bayan St │
│                 Batasan Hills, QC      │
│  HOUSEHOLD      3 dependents           │
│                 Senior citizen: Yes    │
│                 PWD: No                │
│  ─────────────────────────────────     │
│                                         │
│  Your ID photos will be processed     │
│  and deleted immediately after        │
│  verification. We never store your    │
│  raw ID images.                        │
│                                         │
│  [Submit for Verification]             │
│  [Go Back and Edit]                    │
└─────────────────────────────────────────┘
```

- Name field shows "Will be extracted from ID" if Gemini extraction hasn't run yet
- Privacy note about image deletion is mandatory — must be visible before submit button

---

## Processing State

After submit:

```
┌─────────────────────────────────────────┐
│                                         │
│  [Animated spinner or progress]         │
│                                         │
│  Verifying your identity...            │
│  This usually takes less than           │
│  a minute.                              │
│                                         │
│  You can close this screen.            │
│  We'll notify you when it's done.      │
│                                         │
│  [Close]                               │
└─────────────────────────────────────────┘
```

---

## Success State (via push notification or on next app open)

```
┌─────────────────────────────────────────┐
│                                         │
│  [Green checkmark — large]              │
│                                         │
│  Identity Verified                      │
│                                         │
│  Your AERIS account is fully active.   │
│  City services are now unlocked.       │
│                                         │
│  [Go to City Services]                 │
└─────────────────────────────────────────┘
```

---

## Cloud Function: processKYC

**Trigger:** HTTPS callable, invoked on form submission

**Steps:**
1. Receive: ID front/back images (base64), selfie image, residence doc (optional), household data
2. Upload images to Firebase Storage under `kyc-processing/{uid}/` (temporary path)
3. Call Gemini Vision on ID front → extract name, DOB, ID number
4. SHA-256 hash the ID number — store hash only, never plaintext
5. Delete all images from Storage immediately after extraction
6. Write to Firestore:
   ```
   citizens/{uid}/kyc: {
     status: 'verified',
     idType: 'philsys',
     nameExtracted: 'Juan R. Dela Cruz',
     idNumberHash: 'sha256...',
     verifiedAt: Timestamp,
     householdData: { dependents: 3, hasSenior: true, hasPwd: false }
   }
   citizens/{uid}/lguScopes.primary.kycStatus: 'verified'
   ```
7. Send FCM push: "Identity Verified — City services are now unlocked."

**Error handling:**
- Gemini extraction fails → set `kycStatus: 'manual_review'`, notify LGU admin
- Image quality too low → return error to client, prompt retake
- Timeout (> 60s) → set `kycStatus: 'processing'`, retry via Cloud Task

---

## Firestore Security Rules (additions)

```javascript
// Citizens can read their own KYC status but not write directly
match /citizens/{uid}/kyc/{document=**} {
  allow read: if request.auth.uid == uid;
  allow write: if false; // Only Cloud Functions write here
}
```

---

## Privacy Compliance Notes (RA 10173)

- ID images are never persisted in Firestore or permanent Storage
- Only the SHA-256 hash of the ID number is stored — original number is never written anywhere
- Household data is stored only for welfare routing and DRRM evacuation prioritization
- Citizens can request deletion of their KYC data via Profile > Privacy Settings (Phase 2)
- Consent is implicit in the KYC flow — the Review screen privacy note is the consent disclosure

---

## Acceptance Criteria

- [ ] KYC flow triggers only when tapping a gated feature, not on login
- [ ] Gate shown as bottom sheet modal, not full-screen navigation
- [ ] All 6 screens complete and navigable
- [ ] Image capture uses expo-image-picker (camera preferred)
- [ ] Review screen shows extracted/declared data
- [ ] Cloud Function `processKYC` called on submit
- [ ] Success state shown after verification
- [ ] `citizens/{uid}/lguScopes.primary.kycStatus` updated to `verified`
- [ ] City tab unlocks after KYC completes (no app restart required)
