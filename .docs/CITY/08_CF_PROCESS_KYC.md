# AERIS Cloud Functions — processKYC
## Spec for: `aeris-web` (Cloud Functions, `asia-southeast1`)
## Triggered by: Citizen app KYC form submission (HTTPS callable)
## Status: Ready to build

---

## Overview

`processKYC` is the core identity verification function. It receives ID photos,
a selfie, and household data from the citizen app, runs Gemini Vision extraction,
hashes sensitive identifiers, geocodes the address, links the citizen to their
LGU scope and parcel, then deletes all raw images from Storage.

This function is the gatekeeper for all LGU features. No other LGU function
runs unless `citizens/{uid}/lguScopes.primary.kycStatus == 'verified'`.

---

## Function Signature

```typescript
// HTTPS Callable — invoked from citizen app via firebase/compat/functions
export const processKYC = functions
  .region('asia-southeast1')
  .runWith({ timeoutSeconds: 120, memory: '1GB' })
  .https.onCall(async (data: KYCSubmissionPayload, context) => { ... })
```

---

## Input Payload

```typescript
interface KYCSubmissionPayload {
  idType: 'umid' | 'philsys' | 'drivers_license' | 'passport' | 'postal' | 'voters_id'
  idFrontBase64: string       // base64 encoded image
  idBackBase64: string | null // null for passport
  selfieBase64: string
  residenceDocBase64: string | null  // optional
  residenceDocType: 'barangay_cert' | 'utility_bill' | 'lease' | null
  householdData: {
    dependents: number
    hasSenior: boolean
    hasPwd: boolean
    pwdType: string | null
    declaredAddress: string
  }
}
```

---

## Processing Steps

### Step 1: Auth Check
```typescript
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'Login required')
}
const uid = context.auth.uid
```

### Step 2: Duplicate Check
```typescript
// Prevent re-processing if already verified
const existing = await db.doc(`citizens/${uid}/kyc/data`).get()
if (existing.exists && existing.data()?.status === 'verified') {
  return { success: true, alreadyVerified: true }
}
```

### Step 3: Upload Images to Temp Storage
```typescript
// Upload to temporary paths — deleted after processing
const tempPaths = {
  idFront: `kyc-processing/${uid}/id-front-${Date.now()}.jpg`,
  idBack: `kyc-processing/${uid}/id-back-${Date.now()}.jpg`,
  selfie: `kyc-processing/${uid}/selfie-${Date.now()}.jpg`,
}

// Storage rule: only Cloud Functions can read kyc-processing/**
await bucket.file(tempPaths.idFront).save(Buffer.from(data.idFrontBase64, 'base64'))
if (data.idBackBase64) {
  await bucket.file(tempPaths.idBack).save(Buffer.from(data.idBackBase64, 'base64'))
}
await bucket.file(tempPaths.selfie).save(Buffer.from(data.selfieBase64, 'base64'))
```

### Step 4: Gemini Vision — ID Extraction
```typescript
const idExtractionPrompt = `
You are an ID verification system. Extract the following fields from this 
government-issued ID image. Return ONLY valid JSON, no other text.

Required fields:
{
  "fullName": "string or null",
  "dateOfBirth": "YYYY-MM-DD string or null",
  "idNumber": "string or null",
  "expiryDate": "YYYY-MM-DD string or null",
  "extractionConfidence": "high | medium | low"
}

If any field is not visible or readable, return null for that field.
Never guess or infer values — only extract what is clearly visible.
`

const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

const idImagePart = {
  inlineData: {
    data: data.idFrontBase64,
    mimeType: 'image/jpeg'
  }
}

let extractedData: IDExtractionResult
try {
  const result = await model.generateContent([idExtractionPrompt, idImagePart])
  const responseText = result.response.text()
  const clean = responseText.replace(/```json|```/g, '').trim()
  extractedData = JSON.parse(clean)
} catch (err) {
  // Extraction failed — flag for manual review, don't block citizen
  extractedData = {
    fullName: null,
    dateOfBirth: null,
    idNumber: null,
    expiryDate: null,
    extractionConfidence: 'low'
  }
}
```

### Step 5: Hash ID Number
```typescript
import * as crypto from 'crypto'

const idNumberHash = extractedData.idNumber
  ? crypto.createHash('sha256').update(extractedData.idNumber).digest('hex')
  : null

// The raw ID number is NEVER written to Firestore or logs
// Only the hash is stored
```

### Step 6: Geocode Declared Address
```typescript
const geocodeResponse = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?` +
  `address=${encodeURIComponent(data.householdData.declaredAddress)}` +
  `&key=${process.env.GOOGLE_MAPS_API_KEY}`
)
const geocodeData = await geocodeResponse.json()

let coordinates: GeoPoint | null = null
let resolvedPsgcCode: string | null = null

if (geocodeData.results?.[0]) {
  const { lat, lng } = geocodeData.results[0].geometry.location
  coordinates = new admin.firestore.GeoPoint(lat, lng)
  
  // Resolve PSGC code from address components
  resolvedPsgcCode = resolvePsgcFromComponents(geocodeData.results[0].address_components)
}
```

### Step 7: Match to LGU Parcel
```typescript
// Find nearest parcel within 50m of geocoded coordinates
let parcelRef: string | null = null

if (coordinates && resolvedPsgcCode) {
  const lguId = resolvedPsgcCode
  const parcelsSnap = await db
    .collection(`jurisdictions/${lguId}/parcels`)
    .where('coordinates', '!=', null)
    .get()

  let closestParcel: string | null = null
  let closestDistance = Infinity

  parcelsSnap.forEach(doc => {
    const parcelCoords = doc.data().coordinates as GeoPoint
    const distance = calculateDistance(
      coordinates!.latitude, coordinates!.longitude,
      parcelCoords.latitude, parcelCoords.longitude
    )
    if (distance < closestDistance && distance <= 50) {
      closestDistance = distance
      closestParcel = doc.id
    }
  })

  parcelRef = closestParcel

  // Append citizen UID to parcel occupants
  if (parcelRef) {
    await db.doc(`jurisdictions/${lguId}/parcels/${parcelRef}`).update({
      occupantUids: admin.firestore.FieldValue.arrayUnion(uid)
    })
  }
}
```

### Step 8: Write KYC Record to Firestore
```typescript
const kycStatus = extractedData.extractionConfidence === 'low'
  ? 'manual_review'
  : 'verified'

const kycRecord = {
  status: kycStatus,
  idType: data.idType,
  nameExtracted: extractedData.fullName,
  dobExtracted: extractedData.dateOfBirth,
  idNumberHash: idNumberHash,
  extractionConfidence: extractedData.extractionConfidence,
  verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
  householdData: {
    dependents: data.householdData.dependents,
    hasSenior: data.householdData.hasSenior,
    hasPwd: data.householdData.hasPwd,
    pwdType: data.householdData.pwdType ?? null,
    declaredAddress: data.householdData.declaredAddress,
  },
  coordinates: coordinates,
  parcelRef: parcelRef,
}

// Write KYC record — Cloud Functions only, citizen can read
await db.doc(`citizens/${uid}/kyc/data`).set(kycRecord)

// Update lguScopes on primary citizen document
await db.doc(`citizens/${uid}`).set({
  lguScopes: {
    primary: {
      psgcCode: resolvedPsgcCode,
      lguName: resolveLguName(resolvedPsgcCode),
      barangay: resolveBarangayName(resolvedPsgcCode),
      enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
      kycStatus: kycStatus,
    }
  }
}, { merge: true })
```

### Step 9: Delete All Images from Storage
```typescript
// CRITICAL — images must be deleted regardless of success/failure above
// Use finally block to guarantee deletion
const filesToDelete = [
  tempPaths.idFront,
  tempPaths.idBack,
  tempPaths.selfie,
].filter(Boolean) as string[]

await Promise.allSettled(
  filesToDelete.map(path => bucket.file(path).delete().catch(() => {
    // Log deletion failure but don't throw — KYC already succeeded
    logger.error(`Failed to delete KYC temp file: ${path}`)
  }))
)
```

### Step 10: Send FCM Push Notification
```typescript
const citizenDoc = await db.doc(`citizens/${uid}`).get()
const fcmToken = citizenDoc.data()?.fcmToken

if (fcmToken) {
  await admin.messaging().send({
    token: fcmToken,
    notification: {
      title: kycStatus === 'verified'
        ? 'Identity Verified'
        : 'Verification Under Review',
      body: kycStatus === 'verified'
        ? 'Your AERIS account is fully active. City services are now unlocked.'
        : 'Your verification is being reviewed. We will notify you shortly.',
    },
    data: {
      type: 'kyc_status_update',
      status: kycStatus,
    },
    apns: { payload: { aps: { sound: 'default' } } },
    android: { priority: 'high' },
  })
}
```

### Step 11: Return Result
```typescript
return {
  success: true,
  kycStatus,
  lguName: resolveLguName(resolvedPsgcCode),
  barangay: resolveBarangayName(resolvedPsgcCode),
  requiresManualReview: kycStatus === 'manual_review',
}
```

---

## Error Handling

```typescript
// Wrap entire function body in try/finally
// finally block always deletes images even on error

try {
  // ... all steps above
} catch (err) {
  logger.error('processKYC failed', { uid, error: err })

  // Mark as failed so LGU admin can investigate
  await db.doc(`citizens/${uid}/kyc/data`).set({
    status: 'failed',
    failedAt: admin.firestore.FieldValue.serverTimestamp(),
    errorMessage: 'Processing failed. Please try again.',
  }, { merge: true })

  throw new functions.https.HttpsError('internal', 'Verification failed. Please try again.')
} finally {
  // Always delete temp images
  await Promise.allSettled(filesToDelete.map(p => bucket.file(p).delete().catch(() => {})))
}
```

---

## Manual Review Handling

When `kycStatus == 'manual_review'`:
1. LGU admin sees the citizen in their KYC queue on `lgu.aeristech.ai`
2. Admin can approve or reject with a reason
3. On approval: `onKYCManualApproval` Cloud Function fires, updates status to `verified`, sends FCM

```typescript
// Firestore Trigger: when LGU admin approves
export const onKYCManualApproval = functions
  .region('asia-southeast1')
  .firestore.document('citizens/{uid}/kyc/data')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    if (before.status !== 'verified' && after.status === 'verified') {
      const uid = context.params.uid

      // Update lguScopes primary kycStatus
      await db.doc(`citizens/${uid}`).update({
        'lguScopes.primary.kycStatus': 'verified'
      })

      // Send FCM push
      // ... same FCM logic as above
    }
  })
```

---

## Firebase Storage Rules (add to existing rules)

```javascript
match /kyc-processing/{uid}/{fileName} {
  // Citizens cannot read their own temp KYC files directly
  // Only Cloud Functions (admin SDK) can access this path
  allow read, write: if false;
}
```

---

## Helper Functions

```typescript
function resolvePsgcFromComponents(components: GoogleAddressComponent[]): string | null {
  // Map Google Maps address components to Philippine PSGC codes
  // Uses a lookup table of city/municipality names to PSGC codes
  // Returns null if unresolvable
}

function resolveLguName(psgcCode: string | null): string {
  if (!psgcCode) return 'Unknown'
  return PSGC_LGU_MAP[psgcCode]?.name ?? 'Unknown'
}

function resolveBarangayName(psgcCode: string | null): string {
  if (!psgcCode) return 'Unknown'
  return PSGC_LGU_MAP[psgcCode]?.barangay ?? 'Unknown'
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula — returns distance in meters
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
```

---

## Acceptance Criteria

- [ ] Auth check rejects unauthenticated calls
- [ ] Duplicate verified citizens are not re-processed
- [ ] Gemini Vision extracts name, DOB from ID photo
- [ ] ID number is SHA-256 hashed — never written to Firestore as plaintext
- [ ] Raw ID number never appears in any log
- [ ] Address is geocoded to GeoPoint coordinates
- [ ] PSGC code resolved from geocoded address
- [ ] Parcel matched within 50m and citizen UID appended to occupantUids
- [ ] `citizens/{uid}/kyc/data` written with all fields
- [ ] `citizens/{uid}/lguScopes.primary` updated with kycStatus
- [ ] ALL temp images deleted from Storage in finally block
- [ ] FCM push sent on success and on manual_review
- [ ] Low-confidence extractions routed to manual_review, not rejected
- [ ] `onKYCManualApproval` trigger fires when LGU admin approves
- [ ] Function completes within 120s timeout
