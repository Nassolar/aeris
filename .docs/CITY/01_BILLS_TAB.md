# AERIS Citizen App — Bills Screens
## Spec for: `aeris` (React Native / Expo)
## Depends on: CITY_TAB.md, KYC_FLOW.md (KYC must be verified to access)
## Status: Ready to build (Phase 1 + Phase 2 scaffold)

---

## Bills Inbox Screen

**Route:** `City > Bills`
**Auth gate:** Logged in + KYC verified

### Layout

Three sections, ordered by urgency:

```
MY BILLS
[LGU scope switcher if multiple scopes]
────────────────────────────────────────
OVERDUE  (badge count)

  [BillCard — overdue]

DUE SOON  (badge count)

  [BillCard — due soon]
  [BillCard — due soon]

PAID — last 90 days  (badge count)

  [BillCard — paid]
  [BillCard — paid]
  [BillCard — paid]
────────────────────────────────────────
```

### Firestore Query

```typescript
// Active bills
db.collection('bills')
  .where('citizenUid', '==', currentUser.uid)
  .where('lguPsgcCode', '==', activeScopeCode)
  .orderBy('dueDate', 'asc')

// Paid bills (last 90 days)
db.collection('bills')
  .where('citizenUid', '==', currentUser.uid)
  .where('status', '==', 'paid')
  .where('paidAt', '>=', ninetyDaysAgo)
  .orderBy('paidAt', 'desc')
```

### Bill Card Component

```
┌─────────────────────────────────────────┐
│  Real Property Tax — LOT-356            │
│  ₱9,600.00                  [OVERDUE]  │
│  Due Dec 31, 2025 · 82 days overdue    │
│                                         │
│  [Pay Now]                             →│
└─────────────────────────────────────────┘
```

**Status badge colors:**
- OVERDUE: `#E84040` red background, white text
- DUE SOON: `#FF9500` orange background, white text
- PAID: `#888888` grey background, white text

**Amount color:**
- OVERDUE: `#E84040`
- DUE SOON / UNPAID: `#1A1A1A`
- PAID: `#888888` strikethrough

---

## Bill Detail Screen

**Route:** `City > Bills > [bill]`

```
┌─────────────────────────────────────────┐
│  ← Real Property Tax                    │
│                                         │
│  LOT-356 — Brgy. Batasan Hills          │
│  ─────────────────────────────────     │
│  AMOUNT DUE                            │
│  Principal          ₱8,000.00          │
│  Penalties          ₱1,600.00          │
│  ─────────────────────────────────     │
│  Total              ₱9,600.00          │
│                                         │
│  PAYMENT OPTIONS                       │
│  [Pay Full — ₱9,600]                   │
│  [Pay in Installments]                  │
│                                         │
│  HOW TO PAY                            │
│  [🏦 Pay at City Hall]                  │
│  [📱 GCash]          Coming Soon       │
│  [📱 Maya]           Coming Soon       │
│  [🏧 Bank Transfer]  Coming Soon       │
│                                         │
│  ─────────────────────────────────     │
│  TAX YEAR 2025                         │
│  LOT-356 · 120 sqm · Residential      │
│  Assessed value: ₱480,000              │
│                                         │
│  [Download Bill]  [View History]       │
└─────────────────────────────────────────┘
```

**Online payment buttons:**
- Present but show "Coming Soon" label below each
- Tapping shows toast: "Online payment coming soon. Pay at the city hall for now."
- Do NOT disable buttons entirely — show the option, indicate status
- Xendit integration activates in Phase 3

---

## Pay at Hall Screen

**Route:** `City > Bills > [bill] > Pay at Hall`

```
┌─────────────────────────────────────────┐
│  ← Pay at City Hall                     │
│                                         │
│  Show this to the cashier               │
│  ─────────────────────────────────     │
│                                         │
│  REFERENCE NUMBER                      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  ARS-2026-RPT-003421              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [QR CODE — large, centered]            │
│                                         │
│  ─────────────────────────────────     │
│  Real Property Tax — LOT-356           │
│  Amount: ₱9,600.00                     │
│  Quezon City Treasurer's Office        │
│                                         │
│  All fields are pre-filled for the     │
│  cashier. Just show this screen.       │
│                                         │
│  [Share / Save]                        │
└─────────────────────────────────────────┘
```

**Reference number format:** `ARS-{YEAR}-{BILL_TYPE_CODE}-{6-DIGIT-SEQUENCE}`
- Bill type codes: `RPT` (real property tax), `BP` (business permit), `CTC` (cedula), `MISC`
- Generated client-side from bill ID — deterministic, not random
- QR code encodes: reference number + bill ID + amount + citizen UID

**After cashier confirms payment:**
- Cloud Function `onPaymentSuccess` writes `bills/{billId}.status = 'paid'`
- Citizen app receives real-time Firestore update
- Screen transitions to Receipt Screen automatically

---

## Receipt Screen

**Route:** `City > Bills > [bill] > Receipt`
Also accessible from Bills Inbox PAID section.

```
┌─────────────────────────────────────────┐
│  ← Official Receipt                     │
│                                         │
│  ✓ PAYMENT CONFIRMED                   │
│  ─────────────────────────────────     │
│                                         │
│  OFFICIAL RECEIPT                      │
│  OR No.: QC-2026-OR-019842             │
│  Date: March 23, 2026                  │
│                                         │
│  Received from:                        │
│  Juan R. Dela Cruz                     │
│                                         │
│  Amount: ₱9,600.00                     │
│  For: Real Property Tax — Tax Year 2025│
│  Property: LOT-356, Brgy. Batasan Hills│
│                                         │
│  [QR CODE — verification]              │
│  Verify at: lgu.aeristech.ai/verify/or/│
│                                         │
│  ─────────────────────────────────     │
│                                         │
│  [Download PDF]    [Share]             │
│  [Back to Bills]                       │
└─────────────────────────────────────────┘
```

---

## Welfare Delivery Code Screen

**Route:** `City > Welfare > [program]`
Also reachable from push notification tap.

```
┌─────────────────────────────────────────┐
│  ← Delivery Code                        │
│                                         │
│  YOUR DELIVERY CODE                    │
│  Senior Citizen Cash Gift              │
│  March 2026                            │
│  ─────────────────────────────────     │
│                                         │
│     ┌───┐  ┌───┐  ┌───┐  ┌───┐        │
│     │ 7 │  │ 4 │  │ 2 │  │ 9 │        │
│     └───┘  └───┘  └───┘  └───┘        │
│                                         │
│  Show this 4-digit code to the         │
│  barangay worker when they deliver     │
│  your benefit.                         │
│                                         │
│  Do not share this code before         │
│  delivery.                             │
│                                         │
│  Expires: April 5, 2026               │
│  ─────────────────────────────────     │
│  Status: PENDING DELIVERY              │
└─────────────────────────────────────────┘
```

**After worker confirms:**
```
  Status: CONFIRMED ✓
  Delivered: March 23, 2026 — 10:23 AM
  [View Delivery Record]
```

**Design requirements:**
- Each digit in its own large box: font size 48, bold, monospaced
- Box border: 2px `#1A1A1A`, border radius 8px
- Background: white
- Code text: `#1A1A1A` black — maximum contrast for senior citizens
- "PENDING DELIVERY" badge: `#FF9500` orange
- "CONFIRMED" badge: `#2ECC71` green

---

## Firestore Schema: Bills

```
bills/{billId}
  citizenUid: string
  lguPsgcCode: string          // "137404000" for QC
  billType: 'rpt' | 'business_permit' | 'ctc' | 'misc'
  description: string          // "Real Property Tax — LOT-356"
  propertyRef: string | null   // "LOT-356, Brgy. Batasan Hills"
  principal: number
  penalties: number
  totalAmount: number
  dueDate: Timestamp
  taxYear: number | null
  status: 'unpaid' | 'paid' | 'overdue' | 'partial'
  paidAt: Timestamp | null
  paidAmount: number | null
  referenceNumber: string | null   // set on Pay at Hall generation
  receiptNumber: string | null     // set on payment confirmation
  receiptUrl: string | null        // PDF download URL
  createdAt: Timestamp
  updatedAt: Timestamp
```

---

## Acceptance Criteria

- [ ] Bills Inbox shows OVERDUE, DUE SOON, PAID sections with correct colors
- [ ] Status badges render with correct colors per status
- [ ] Bill Detail screen shows full breakdown and all payment options
- [ ] "Coming Soon" overlay/label on GCash, Maya, Bank Transfer
- [ ] Pay at Hall screen generates reference number and QR code
- [ ] QR code is scannable and encodes correct data
- [ ] Receipt screen shows full OR details
- [ ] Welfare code screen renders 4 large digits in individual boxes
- [ ] Welfare code screen shows CONFIRMED state after delivery
- [ ] LGU scope switcher appears on Bills Inbox if citizen has 2+ scopes
- [ ] All Firestore reads scoped to `currentUser.uid` only
