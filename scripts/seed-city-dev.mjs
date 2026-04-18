/**
 * AERIS — City Tab Dev Seed
 *
 * Seeds the test account (09171234567 / +639171234567) with verified KYC,
 * sample bills, a welfare program, a DOST alert, and a platform announcement
 * so the City tab can be fully exercised without going through the real KYC flow.
 *
 * Prerequisites:
 *   1. npm install -D firebase-admin          (one-time)
 *   2. Place your service account key at scripts/.service-account.json
 *      Firebase Console → Project Settings → Service accounts → Generate new private key
 *      (this file is gitignored)
 *
 * Run:
 *   node scripts/seed-city-dev.mjs
 *
 * To reset / wipe seed data:
 *   node scripts/seed-city-dev.mjs --reset
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// ─── Init ─────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SA_PATH = path.join(__dirname, '.service-account.json');

if (!existsSync(SA_PATH)) {
  console.error('✗  Service account key not found at scripts/.service-account.json');
  console.error('   Generate one at: Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'aeris-citizen-app-16265',
});

const auth = admin.auth();
const db = admin.firestore();
const PHONE = '+639171234567';
const RESET = process.argv.includes('--reset');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ts(date) {
  return admin.firestore.Timestamp.fromDate(new Date(date));
}
const now = admin.firestore.Timestamp.now();

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Resolve UID
  let uid;
  try {
    const user = await auth.getUserByPhoneNumber(PHONE);
    uid = user.uid;
    console.log(`✓  Found account: ${uid}  (${PHONE})`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`✗  No account for ${PHONE} — log in once via the app first.`);
      process.exit(1);
    }
    throw err;
  }

  // ── Reset mode ──────────────────────────────────────────────────────────────
  if (RESET) {
    console.log('  Resetting seed data...');
    const bills = await db.collection('bills').where('citizenUid', '==', uid).get();
    const welfare = await db.collection('welfare_programs').where('citizenUid', '==', uid).get();
    const batch = db.batch();
    bills.docs.forEach((d) => batch.delete(d.ref));
    welfare.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(db.doc('dost_alerts/active-dev-alert'));
    batch.delete(db.doc('announcements/aeris-welcome-dev'));
    batch.delete(db.doc(`citizens/${uid}`));
    await batch.commit();
    console.log('✓  Seed data wiped.');
    return;
  }

  // ── Write seed data ─────────────────────────────────────────────────────────
  const batch = db.batch();

  // 2. citizens/{uid} — KYC verified, Quezon City primary scope
  batch.set(
    db.doc(`citizens/${uid}`),
    {
      lguScopes: {
        primary: {
          psgcCode: '137404000',
          lguName: 'Quezon City',
          barangay: 'Batasan Hills',
          enrolledAt: now,
          kycStatus: 'verified',
        },
        secondary: [],
      },
      kyc: {
        status: 'verified',
        idType: 'philsys',
        nameExtracted: 'Dev Seed Account',
        idNumberHash: 'dev-hash-not-real',
        verifiedAt: now,
        householdData: {
          dependents: 2,
          hasSenior: true,
          hasPwd: false,
          homeAddress: '123 Matandang Bayan St, Batasan Hills, Quezon City',
        },
      },
    },
    { merge: true },  // merge so we don't clobber existing profile fields
  );

  // 3. Bills
  //    - 1 OVERDUE real property tax
  //    - 2 UNPAID (business permit + cedula) due soon
  const billRPT = db.collection('bills').doc();
  batch.set(billRPT, {
    citizenUid: uid,
    lguPsgcCode: '137404000',
    billType: 'rpt',
    description: 'Real Property Tax — LOT-356',
    propertyRef: 'LOT-356, Brgy. Batasan Hills, QC',
    principal: 8000,
    penalties: 1600,
    totalAmount: 9600,
    dueDate: ts('2025-12-31'),
    taxYear: 2025,
    status: 'overdue',
    paidAt: null,
    paidAmount: null,
    referenceNumber: null,
    receiptNumber: null,
    receiptUrl: null,
    createdAt: now,
    updatedAt: now,
  });

  const billBP = db.collection('bills').doc();
  batch.set(billBP, {
    citizenUid: uid,
    lguPsgcCode: '137404000',
    billType: 'business_permit',
    description: 'Business Permit Renewal',
    propertyRef: null,
    principal: 1200,
    penalties: 0,
    totalAmount: 1200,
    dueDate: ts('2026-03-31'),
    taxYear: 2026,
    status: 'unpaid',
    paidAt: null,
    paidAmount: null,
    referenceNumber: null,
    receiptNumber: null,
    receiptUrl: null,
    createdAt: now,
    updatedAt: now,
  });

  const billCTC = db.collection('bills').doc();
  batch.set(billCTC, {
    citizenUid: uid,
    lguPsgcCode: '137404000',
    billType: 'ctc',
    description: 'Community Tax Certificate',
    propertyRef: null,
    principal: 500,
    penalties: 0,
    totalAmount: 500,
    dueDate: ts('2026-04-15'),
    taxYear: 2026,
    status: 'unpaid',
    paidAt: null,
    paidAmount: null,
    referenceNumber: null,
    receiptNumber: null,
    receiptUrl: null,
    createdAt: now,
    updatedAt: now,
  });

  // 4. Welfare program — pending delivery
  const welfare = db.collection('welfare_programs').doc();
  batch.set(welfare, {
    citizenUid: uid,
    lguPsgcCode: '137404000',
    programName: 'Senior Citizen Cash Gift',
    period: 'March 2026',
    deliveryCode: '7429',
    status: 'pending_delivery',
    deliveredAt: null,
    expiresAt: ts('2026-04-05'),
    createdAt: now,
  });

  // 5. DOST alert — active flood warning for Batasan Hills
  batch.set(db.doc('dost_alerts/active-dev-alert'), {
    psgcCode: '137404000',
    barangay: 'Batasan Hills',
    alertType: 'FLOOD WARNING',
    title: 'FLOOD WARNING — Batasan Hills',
    body:
      'DOST-NOAH: High rainfall intensity expected in the next 6 hours. Residents near low-lying areas are advised to prepare and monitor water levels closely.',
    isActive: true,
    publishedAt: now,
    expiresAt: ts('2026-03-27'),
    evacuationCenters: [
      { name: 'Batasan Hills National High School', address: 'Batasan Road, Batasan Hills, QC' },
      { name: 'Brgy. Batasan Hills Hall', address: 'Batasan Hills, Quezon City' },
    ],
    hotlines: [
      { label: 'DOST-PAGASA', number: '(02) 8284-0800' },
      { label: 'QC Disaster Risk Reduction', number: '(02) 8988-4242' },
      { label: 'Emergency Hotline', number: '911' },
    ],
  });

  // 6. Platform-wide announcement
  batch.set(db.doc('announcements/aeris-welcome-dev'), {
    title: 'City Services Now Available',
    body: 'Pay your bills, request barangay documents, and receive welfare delivery codes directly from the AERIS app. No queuing required.',
    source: 'AERIS',
    psgcCode: null,       // null = platform-wide, shows for all citizens
    publishedAt: now,
    expiresAt: null,
    readBy: [],
    priority: 'normal',
  });

  await batch.commit();

  console.log('');
  console.log('✓  Seed complete for', uid);
  console.log('   citizens/{uid}          — KYC verified, Quezon City / Batasan Hills');
  console.log('   bills (3)               — 1 overdue RPT ₱9,600 | 1 BP ₱1,200 | 1 CTC ₱500');
  console.log('   welfare_programs (1)    — Senior Citizen Cash Gift, code: 7429');
  console.log('   dost_alerts (1)         — FLOOD WARNING active (Batasan Hills)');
  console.log('   announcements (1)       — AERIS platform-wide');
  console.log('');
  console.log('   Open the app, log in as 09171234567, tap CITY tab.');
  console.log('   To reset: node scripts/seed-city-dev.mjs --reset');
}

main().catch((err) => {
  console.error('\n✗  Seed failed:', err.message);
  process.exit(1);
});
