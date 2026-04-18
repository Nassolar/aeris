# AERIS Cloud Functions — Certificate Generation
## Spec for: `aeris-web` (Cloud Functions, `asia-southeast1`)
## Functions: `requestCertificate`, `onCertificateReady`, `generateCertificatePDF`
## Status: Ready to build

---

## Overview

Three functions that power the City Services document request flows:
1. `requestCertificate` — citizen submits a request, creates queue entry
2. `onCertificateReady` — Firestore trigger when LGU marks a cert as ready,
   generates PDF and notifies citizen
3. `generateCertificatePDF` — shared PDF generator used by onCertificateReady

---

## Function 1: requestCertificate

### Signature
```typescript
export const requestCertificate = functions
  .region('asia-southeast1')
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (data: CertificateRequestPayload, context) => { ... })
```

### Input Payload
```typescript
interface CertificateRequestPayload {
  certType: 'indigency' | 'barangay_clearance' | 'ctc' | 'solo_parent_id'
  purpose: string
  purposeDetail: string | null      // employer name, school name, etc.
  additionalNotes: string | null
  incomeDeclared: number | null     // for CTC fee calculation
  incomeSource: string | null       // for CTC
  numberOfChildren: number | null   // for solo parent
  youngestChildDob: string | null   // ISO date, for solo parent
  soloParentCircumstance: string | null
  supportDocBase64: string | null   // solo parent supporting doc
  supportDocType: string | null
}
```

### Processing Steps

```typescript
// 1. Auth + KYC check
if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')
const uid = context.auth.uid

const citizenDoc = await db.doc(`citizens/${uid}`).get()
const kycStatus = citizenDoc.data()?.lguScopes?.primary?.kycStatus
if (kycStatus !== 'verified') {
  throw new functions.https.HttpsError('failed-precondition', 'KYC verification required')
}

// 2. Generate queue number
const queuePrefix = {
  indigency: 'IND',
  barangay_clearance: 'CLR',
  ctc: 'CTC',
  solo_parent_id: 'SPI',
}[data.certType]

const year = new Date().getFullYear()
const sequence = await getNextSequenceNumber(`cert_sequence_${queuePrefix}_${year}`)
const queueNumber = `${queuePrefix}-${year}-${String(sequence).padStart(4, '0')}`

// 3. Calculate fee (for CTC)
let feeAmount = 0
if (data.certType === 'ctc') {
  const income = data.incomeDeclared ?? 0
  feeAmount = calculateCedulaFee(income)
}

// 4. Create issued_certificates document
const certRef = db.collection('issued_certificates').doc()
await certRef.set({
  citizenUid: uid,
  lguPsgcCode: citizenDoc.data()?.lguScopes?.primary?.psgcCode,
  certType: data.certType,
  status: 'pending',
  queueNumber,
  purpose: data.purpose,
  purposeDetail: data.purposeDetail ?? null,
  additionalNotes: data.additionalNotes ?? null,
  feeAmount,
  feePaid: false,
  requestedAt: admin.firestore.FieldValue.serverTimestamp(),
  readyAt: null,
  releasedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  documentUrl: null,
  verificationCode: null,
  metadata: buildMetadata(data),
})

// 5. Upload supporting document if provided (solo parent)
if (data.supportDocBase64 && data.certType === 'solo_parent_id') {
  const docPath = `cert-support-docs/${uid}/${certRef.id}/support-doc.jpg`
  await bucket.file(docPath).save(Buffer.from(data.supportDocBase64, 'base64'))
  await certRef.update({ supportDocPath: docPath })
}

// 6. Notify LGU admin (Firestore write triggers LGU portal real-time update)
// No FCM to LGU needed — the LGU portal listens via Firestore onSnapshot

// 7. Return
return {
  success: true,
  certId: certRef.id,
  queueNumber,
  feeAmount,
}
```

### Fee Calculation: Cedula
```typescript
function calculateCedulaFee(annualIncome: number): number {
  // RA 7160 Section 157-162
  const basicTax = 5.00
  const additionalTax = Math.floor(annualIncome / 1000) * 1.00
  const total = basicTax + additionalTax
  return Math.min(total, 5000.00) // Cap at ₱5,000
}
```

### Queue Sequence Counter
```typescript
async function getNextSequenceNumber(counterName: string): Promise<number> {
  const counterRef = db.doc(`system_counters/${counterName}`)
  const result = await db.runTransaction(async (tx) => {
    const doc = await tx.get(counterRef)
    const current = doc.exists ? (doc.data()?.count ?? 0) : 0
    const next = current + 1
    tx.set(counterRef, { count: next }, { merge: true })
    return next
  })
  return result
}
```

### Metadata Builder
```typescript
function buildMetadata(data: CertificateRequestPayload): object {
  switch (data.certType) {
    case 'barangay_clearance':
      return { employerName: data.purposeDetail }
    case 'ctc':
      return {
        incomeDeclared: data.incomeDeclared,
        incomeSource: data.incomeSource,
      }
    case 'solo_parent_id':
      return {
        numberOfChildren: data.numberOfChildren,
        youngestChildDob: data.youngestChildDob,
        circumstance: data.soloParentCircumstance,
      }
    default:
      return {}
  }
}
```

---

## Function 2: onCertificateReady

Fires when LGU admin updates `issued_certificates/{certId}.status` to `'ready'`.

```typescript
export const onCertificateReady = functions
  .region('asia-southeast1')
  .firestore.document('issued_certificates/{certId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    // Only trigger on transition to 'ready'
    if (before.status === after.status || after.status !== 'ready') return

    const certId = context.params.certId
    const uid = after.citizenUid

    // Generate PDF
    const { pdfBuffer, verificationCode } = await generateCertificatePDF(certId, after)

    // Upload PDF to Storage
    const pdfPath = `issued-certificates/${uid}/${certId}/certificate.pdf`
    await bucket.file(pdfPath).save(pdfBuffer, { contentType: 'application/pdf' })

    // Generate signed download URL (valid 1 year)
    const [signedUrl] = await bucket.file(pdfPath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    })

    // Update certificate with URL and verification code
    await change.after.ref.update({
      documentUrl: signedUrl,
      verificationCode,
      readyAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Send FCM push to citizen
    const citizenDoc = await db.doc(`citizens/${uid}`).get()
    const fcmToken = citizenDoc.data()?.fcmToken

    const certNames = {
      indigency: 'Indigency Certificate',
      barangay_clearance: 'Barangay Clearance',
      ctc: 'Community Tax Certificate',
      solo_parent_id: 'Solo Parent ID',
    }

    if (fcmToken) {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: `${certNames[after.certType as keyof typeof certNames]} Ready`,
          body: 'Your document is ready. Download it from the City Services tab.',
        },
        data: {
          type: 'certificate_ready',
          certId,
          certType: after.certType,
        },
        apns: { payload: { aps: { sound: 'default' } } },
        android: { priority: 'high' },
      })
    }
  })
```

---

## Function 3: generateCertificatePDF

```typescript
async function generateCertificatePDF(
  certId: string,
  certData: FirebaseFirestore.DocumentData
): Promise<{ pdfBuffer: Buffer; verificationCode: string }> {

  // Fetch citizen data for the certificate
  const citizenDoc = await db.doc(`citizens/${certData.citizenUid}`).get()
  const kycDoc = await db.doc(`citizens/${certData.citizenUid}/kyc/data`).get()
  const citizen = citizenDoc.data()
  const kyc = kycDoc.data()

  // Fetch LGU config for official header (LGU name, seal, signatory)
  const lguConfig = await db.doc(`lgu_config/${certData.lguPsgcCode}`).get()
  const lgu = lguConfig.data()

  // Generate verification code (UUID v4 shortened)
  const verificationCode = generateVerificationCode(certId)
  const verificationUrl = `https://lgu.aeristech.ai/verify/cert/${verificationCode}`

  // Use pdf-lib to generate the PDF
  const { PDFDocument, rgb, StandardFonts } = require('pdf-lib')
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // Letter size

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Build certificate content based on certType
  switch (certData.certType) {
    case 'indigency':
      buildIndigencyCertificate(page, { citizen, kyc, lgu, certData, verificationUrl,
        fonts: { bold: helveticaBold, regular: helvetica } })
      break
    case 'barangay_clearance':
      buildClearanceCertificate(page, { citizen, kyc, lgu, certData, verificationUrl,
        fonts: { bold: helveticaBold, regular: helvetica } })
      break
    case 'ctc':
      buildCTCCertificate(page, { citizen, kyc, lgu, certData, verificationUrl,
        fonts: { bold: helveticaBold, regular: helvetica } })
      break
    case 'solo_parent_id':
      buildSoloParentID(page, { citizen, kyc, lgu, certData, verificationUrl,
        fonts: { bold: helveticaBold, regular: helvetica } })
      break
  }

  const pdfBuffer = Buffer.from(await pdfDoc.save())
  return { pdfBuffer, verificationCode }
}

function generateVerificationCode(certId: string): string {
  // Deterministic short code from certId
  const hash = crypto.createHash('sha256').update(certId).digest('hex')
  return hash.substring(0, 16).toUpperCase()
}
```

### PDF Layout per Certificate Type

**Indigency Certificate layout:**
```
[LGU Official Seal — centered]
Republic of the Philippines
[LGU Name] — [Province]
Office of the Punong Barangay

CERTIFICATE OF INDIGENCY

TO WHOM IT MAY CONCERN:

This is to certify that [FULL NAME], [AGE], [CIVIL STATUS], a resident of
[ADDRESS], is a bonafide resident of this barangay and belongs to an
indigent family.

This certification is issued for [PURPOSE] purposes.

Issued this [DATE] at [BARANGAY], [CITY].

_________________________
[PUNONG BARANGAY NAME]
Punong Barangay

[QR CODE]
Verify: lgu.aeristech.ai/verify/cert/[CODE]
Certificate No.: [QUEUE_NUMBER]
```

**CTC (Cedula) layout:**
```
[Republic header]
COMMUNITY TAX CERTIFICATE
No.: [QUEUE_NUMBER]

Name: [FULL NAME]
Address: [ADDRESS]
Date of Birth: [DOB]
Civil Status: [STATUS]

This certifies payment of Community Tax

Basic Community Tax:     ₱5.00
Additional Tax:          ₱[AMOUNT]
Total:                   ₱[TOTAL]

Date Issued: [DATE]
Place of Issue: [LGU NAME]

[QR CODE]
```

---

## npm Dependencies (Dep Guard approval required)

```
pdf-lib          — PDF generation
qrcode           — QR code generation for verification URLs (server-side)
```

Add to `aeris-web/functions/package.json`. Run through Dep Guard before install.

---

## Firestore Security Rules (additions)

```javascript
match /issued_certificates/{certId} {
  // Citizens can read only their own certificates
  allow read: if request.auth.uid == resource.data.citizenUid;
  // Only Cloud Functions write (no direct client writes)
  allow write: if false;
}

match /system_counters/{counterId} {
  // Only Cloud Functions read/write counters
  allow read, write: if false;
}
```

---

## Acceptance Criteria

- [ ] `requestCertificate` rejects unauthenticated and non-KYC-verified callers
- [ ] Queue numbers generated sequentially and correctly formatted
- [ ] CTC fee calculated correctly per RA 7160 formula, capped at ₱5,000
- [ ] Solo parent supporting doc uploaded to Storage on submission
- [ ] `onCertificateReady` fires only on status transition to 'ready'
- [ ] PDF generated for all 4 certificate types
- [ ] PDF uploaded to Storage with signed URL (1 year expiry)
- [ ] Verification code written to Firestore
- [ ] FCM push sent to citizen on certificate ready
- [ ] Verification URL format: `lgu.aeristech.ai/verify/cert/{code}`
- [ ] Citizens cannot read other citizens' certificates (security rules)
- [ ] Counters use Firestore transactions (no race conditions)
