# AERIS Cloud Functions — Bills, Payments & Welfare
## Spec for: `aeris-web` (Cloud Functions, `asia-southeast1`)
## Functions: `generateBillReferenceNumber`, `onPaymentSuccess`,
##             `confirmWelfareDelivery`, `onWelfareProgramPublished`
## Status: Ready to build

---

## Function 1: generateBillReferenceNumber

Called when citizen taps "Pay at Hall" on any bill. Generates a deterministic
reference number and stores it on the bill document.

### Signature
```typescript
export const generateBillReferenceNumber = functions
  .region('asia-southeast1')
  .runWith({ timeoutSeconds: 15, memory: '128MB' })
  .https.onCall(async (data: { billId: string }, context) => { ... })
```

### Processing
```typescript
if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')
const uid = context.auth.uid

// Fetch and validate bill ownership
const billDoc = await db.doc(`bills/${data.billId}`).get()
if (!billDoc.exists) throw new functions.https.HttpsError('not-found', 'Bill not found')
if (billDoc.data()?.citizenUid !== uid) {
  throw new functions.https.HttpsError('permission-denied', 'Not your bill')
}

// Idempotent — return existing ref number if already generated
if (billDoc.data()?.referenceNumber) {
  return {
    referenceNumber: billDoc.data()?.referenceNumber,
    qrPayload: buildQRPayload(billDoc.data()!, data.billId),
  }
}

// Generate reference number
const billTypeCode = {
  rpt: 'RPT',
  business_permit: 'BP',
  ctc: 'CTC',
  misc: 'MISC',
}[billDoc.data()!.billType as string] ?? 'MISC'

const year = new Date().getFullYear()
const sequence = await getNextSequenceNumber(`bill_ref_${billTypeCode}_${year}`)
const referenceNumber = `ARS-${year}-${billTypeCode}-${String(sequence).padStart(6, '0')}`

// Build QR payload
const qrPayload = buildQRPayload(billDoc.data()!, data.billId, referenceNumber)

// Update bill
await db.doc(`bills/${data.billId}`).update({ referenceNumber, qrPayload })

return { referenceNumber, qrPayload }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQRPayload(
  bill: FirebaseFirestore.DocumentData,
  billId: string,
  referenceNumber?: string
): string {
  // QR encodes a JSON payload the cashier app scans
  const payload = {
    ref: referenceNumber ?? bill.referenceNumber,
    billId,
    amount: bill.totalAmount,
    uid: bill.citizenUid,
    type: bill.billType,
    lgu: bill.lguPsgcCode,
  }
  return JSON.stringify(payload)
}
```

---

## Function 2: onPaymentSuccess

**Triggered by:** LGU cashier confirming payment in the LGU portal (Firestore write).
This is NOT a Xendit webhook yet — that is Phase 3. For Phase 1/2, payment
confirmation comes from the cashier's action in the LGU web portal.

### Firestore Trigger
```typescript
export const onPaymentSuccess = functions
  .region('asia-southeast1')
  .firestore.document('bills/{billId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    // Only process transition from unpaid/overdue to paid
    const wasUnpaid = ['unpaid', 'overdue', 'partial'].includes(before.status)
    const isNowPaid = after.status === 'paid'
    if (!wasUnpaid || !isNowPaid) return

    const billId = context.params.billId
    const uid = after.citizenUid

    // Generate official receipt number
    const lguCode = after.lguPsgcCode?.substring(0, 4) ?? 'QC'
    const year = new Date().getFullYear()
    const orSequence = await getNextSequenceNumber(`or_sequence_${lguCode}_${year}`)
    const receiptNumber = `${lguCode}-${year}-OR-${String(orSequence).padStart(6, '0')}`

    // Generate receipt PDF
    const { pdfBuffer } = await generateReceiptPDF(billId, after, receiptNumber)

    // Upload receipt PDF
    const pdfPath = `receipts/${uid}/${billId}/receipt.pdf`
    await bucket.file(pdfPath).save(pdfBuffer, { contentType: 'application/pdf' })

    const [receiptUrl] = await bucket.file(pdfPath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    })

    // Update bill with receipt info
    await change.after.ref.update({
      receiptNumber,
      receiptUrl,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Write to collections (payment ledger)
    await db.collection('collections').add({
      billId,
      taxpayerUid: uid,
      lguPsgcCode: after.lguPsgcCode,
      billType: after.billType,
      amount: after.totalAmount,
      receiptNumber,
      receiptUrl,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentMethod: after.paymentMethod ?? 'pay_at_hall',
    })

    // Update contribution tracker (for Contribution Card)
    await updateContributionTracker(uid, after.lguPsgcCode, after.totalAmount)

    // Send FCM to citizen
    const citizenDoc = await db.doc(`citizens/${uid}`).get()
    const fcmToken = citizenDoc.data()?.fcmToken
    if (fcmToken) {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: 'Payment Confirmed',
          body: `₱${after.totalAmount.toLocaleString()} received. Your receipt is ready.`,
        },
        data: {
          type: 'payment_confirmed',
          billId,
          receiptNumber,
        },
        apns: { payload: { aps: { sound: 'default' } } },
        android: { priority: 'high' },
      })
    }
  })
```

### Contribution Tracker Update
```typescript
async function updateContributionTracker(
  uid: string,
  lguPsgcCode: string,
  amount: number
): Promise<void> {
  const year = new Date().getFullYear()
  const trackerRef = db.doc(`contribution_tracker/${uid}_${lguPsgcCode}_${year}`)

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(trackerRef)
    const current = doc.exists ? doc.data()! : {
      uid,
      lguPsgcCode,
      year,
      totalPaid: 0,
      paymentCount: 0,
    }
    tx.set(trackerRef, {
      ...current,
      totalPaid: current.totalPaid + amount,
      paymentCount: current.paymentCount + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  })
}
```

### Receipt PDF Generator
```typescript
async function generateReceiptPDF(
  billId: string,
  bill: FirebaseFirestore.DocumentData,
  receiptNumber: string
): Promise<{ pdfBuffer: Buffer }> {
  const citizenDoc = await db.doc(`citizens/${bill.citizenUid}`).get()
  const kyc = await db.doc(`citizens/${bill.citizenUid}/kyc/data`).get()

  const { PDFDocument, StandardFonts } = require('pdf-lib')
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 396]) // Half-letter (receipt size)

  // Layout:
  // [LGU Header]
  // OFFICIAL RECEIPT
  // OR No.: [receiptNumber]
  // Date: [paidAt]
  // Received from: [citizen name from KYC]
  // Amount: ₱[totalAmount]
  // For: [bill description]
  // Property: [propertyRef if applicable]
  // [QR CODE]
  // Verify at: lgu.aeristech.ai/verify/or/[verificationCode]

  const pdfBuffer = Buffer.from(await pdfDoc.save())
  return { pdfBuffer }
}
```

---

## Function 3: onWelfareProgramPublished

Firestore trigger. When LGU publishes a welfare program with beneficiaries,
generates unique 4-digit delivery codes for each beneficiary and sends
push notifications.

```typescript
export const onWelfareProgramPublished = functions
  .region('asia-southeast1')
  .firestore.document('welfare_programs/{programId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    // Only trigger when status changes to 'active'
    if (before.status === after.status || after.status !== 'active') return

    const programId = context.params.programId

    // Fetch all beneficiaries
    const beneficiariesSnap = await db
      .collection(`welfare_programs/${programId}/beneficiaries`)
      .where('deliveryCode', '==', null)
      .get()

    // Generate unique codes and send push notifications in batches
    const batch = db.batch()
    const fcmMessages: admin.messaging.Message[] = []

    for (const benefDoc of beneficiariesSnap.docs) {
      const benefData = benefDoc.data()
      const deliveryCode = await generateUniqueDeliveryCode(programId)

      batch.update(benefDoc.ref, {
        deliveryCode,
        codeGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        deliveryStatus: 'pending',
      })

      // Queue FCM push for this beneficiary
      const citizenDoc = await db.doc(`citizens/${benefData.uid}`).get()
      const fcmToken = citizenDoc.data()?.fcmToken
      if (fcmToken) {
        fcmMessages.push({
          token: fcmToken,
          notification: {
            title: `Delivery Code Ready — ${after.programName}`,
            body: `A barangay worker will visit you soon. Your delivery code is ready.`,
          },
          data: {
            type: 'welfare_code_ready',
            programId,
            programName: after.programName,
          },
          apns: { payload: { aps: { sound: 'default' } } },
          android: { priority: 'high' },
        })
      }
    }

    await batch.commit()

    // Send FCM in batches of 500 (FCM limit)
    for (let i = 0; i < fcmMessages.length; i += 500) {
      await admin.messaging().sendEach(fcmMessages.slice(i, i + 500))
    }
  })

async function generateUniqueDeliveryCode(programId: string): Promise<string> {
  // 4-digit numeric code, unique within this program
  // Retry up to 10 times if collision detected
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = String(Math.floor(1000 + Math.random() * 9000))

    const existing = await db
      .collection(`welfare_programs/${programId}/beneficiaries`)
      .where('deliveryCode', '==', code)
      .limit(1)
      .get()

    if (existing.empty) return code
  }
  throw new Error('Could not generate unique delivery code after 10 attempts')
}
```

---

## Function 4: confirmWelfareDelivery

Called by the barangay field worker (via LGU portal or field app) when they
deliver a welfare benefit and the beneficiary shows their code.

```typescript
export const confirmWelfareDelivery = functions
  .region('asia-southeast1')
  .runWith({ timeoutSeconds: 15, memory: '128MB' })
  .https.onCall(async (data: {
    programId: string
    enteredCode: string
    workerNotes: string | null
  }, context) => {

    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')

    // Verify caller is an LGU worker (custom claim check)
    const callerClaims = context.auth.token
    if (!callerClaims.lguRole) {
      throw new functions.https.HttpsError('permission-denied', 'LGU worker access required')
    }

    // Find beneficiary with this code in this program
    const matchSnap = await db
      .collection(`welfare_programs/${data.programId}/beneficiaries`)
      .where('deliveryCode', '==', data.enteredCode)
      .where('deliveryStatus', '==', 'pending')
      .limit(1)
      .get()

    if (matchSnap.empty) {
      // Code not found or already used
      return { success: false, reason: 'invalid_code' }
    }

    const benefDoc = matchSnap.docs[0]
    const benefData = benefDoc.data()

    // Mark as delivered
    await benefDoc.ref.update({
      deliveryStatus: 'confirmed',
      confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      confirmedByUid: context.auth.uid,
      workerNotes: data.workerNotes ?? null,
    })

    // Send FCM to citizen confirming delivery
    const citizenDoc = await db.doc(`citizens/${benefData.uid}`).get()
    const fcmToken = citizenDoc.data()?.fcmToken

    const programDoc = await db.doc(`welfare_programs/${data.programId}`).get()
    const programName = programDoc.data()?.programName ?? 'Welfare Program'

    if (fcmToken) {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: 'Benefit Delivered',
          body: `Your ${programName} benefit has been confirmed as delivered.`,
        },
        data: {
          type: 'welfare_delivery_confirmed',
          programId: data.programId,
        },
        apns: { payload: { aps: { sound: 'default' } } },
        android: { priority: 'high' },
      })
    }

    return {
      success: true,
      beneficiaryName: benefData.citizenName,
      programName,
    }
  })
```

---

## Firestore Schema: Welfare Programs

```
welfare_programs/{programId}
  programName: string               // "Senior Citizen Cash Gift"
  lguPsgcCode: string
  benefitType: 'cash' | 'goods' | 'voucher'
  benefitAmount: number | null
  status: 'draft' | 'active' | 'completed'
  deliveryMonth: string             // "2026-03"
  publishedAt: Timestamp | null
  createdAt: Timestamp

welfare_programs/{programId}/beneficiaries/{uid}
  uid: string
  citizenName: string
  deliveryCode: string | null       // 4-digit, null until program published
  deliveryStatus: 'pending' | 'confirmed' | 'undeliverable'
  codeGeneratedAt: Timestamp | null
  codeExpiresAt: Timestamp          // typically 30 days after generation
  confirmedAt: Timestamp | null
  confirmedByUid: string | null
  workerNotes: string | null
```

---

## Firestore Security Rules (additions)

```javascript
match /welfare_programs/{programId}/beneficiaries/{uid} {
  // Citizens can only read their own beneficiary record
  allow read: if request.auth.uid == uid;
  allow write: if false; // Only Cloud Functions write
}

match /collections/{txId} {
  // Citizens read own payment records
  allow read: if request.auth.uid == resource.data.taxpayerUid;
  allow write: if false;
}

match /contribution_tracker/{trackerId} {
  // Citizens read own tracker
  allow read: if trackerId.matches(request.auth.uid + '_.*');
  allow write: if false;
}
```

---

## Acceptance Criteria

### generateBillReferenceNumber
- [ ] Rejects unauthenticated calls
- [ ] Rejects calls for bills not owned by caller
- [ ] Reference number format: `ARS-{YEAR}-{TYPE}-{6DIGITS}`
- [ ] Idempotent — same reference returned if called twice
- [ ] QR payload encodes ref, billId, amount, uid, type, lgu

### onPaymentSuccess
- [ ] Only triggers on status transition to 'paid'
- [ ] Generates sequential OR number per LGU per year
- [ ] Receipt PDF generated and uploaded to Storage
- [ ] Signed URL written to bill document
- [ ] Payment written to `collections` ledger
- [ ] Contribution tracker updated via transaction (no race conditions)
- [ ] FCM push sent to citizen with amount

### onWelfareProgramPublished
- [ ] Only triggers on status transition to 'active'
- [ ] Unique 4-digit codes generated for all beneficiaries
- [ ] Collision-safe code generation with retry logic
- [ ] FCM push sent to all beneficiaries (batched at 500)

### confirmWelfareDelivery
- [ ] Rejects non-LGU-worker callers (custom claim check)
- [ ] Returns `invalid_code` for non-existent or already-used codes
- [ ] Marks beneficiary as confirmed with timestamp + worker ID
- [ ] FCM push sent to citizen on confirmation
