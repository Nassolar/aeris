# TASK: Seed Agencies Collection + Tagalog Urgency Keywords

**Priority:** CRITICAL -- Beta launch blocker (the LAST one)
**Codebase:** aeris-web (Firebase codebase name: `aeris`)
**Project:** aeris-citizen-app-16265
**Date:** April 15, 2026

---

## Context

The dispatch pipeline (classifyReport + dispatchReport) is now deployed and functioning correctly. The sequential chain works: classifyReport fires on creation, sets classificationComplete, dispatchReport fires on update. Region migration is complete. Gemini migration is complete.

However, beta test report VP94971207 ("May sinasaksak" -- someone being stabbed near Grand Hyatt BGC) failed to reach the responder app because:

1. The `agencies` collection in Firestore is EMPTY. dispatchReport found zero agencies, wrote `routingStatus: "pending_manual"` and `routingNote: "No active agencies in Firestore. Please seed agencies collection."` The responder app shows "No pending incidents" because no `responderInbox` entry was created.

2. Tagalog violence keywords ("saksak", "sinasaksak", "pinagsaksak") are not in classifyReport's urgency signals list, causing the keyword fallback to miss the severity of a stabbing report.

---

## Phase 1: Seed the Agencies Collection

### 1.1 Determine the Schema

Before seeding, inspect how `dispatchReport` queries the `agencies` collection. Read `functions/src/dispatchReport.ts` and find:
- What fields it queries on (agencyTypeKey? jurisdiction? city? barangay? active?)
- What fields it reads from matched documents (stationId? name? responderIds?)
- The exact fallback chain logic (4-step: barangay > city > department > default)

The seed documents MUST match the query patterns in dispatchReport exactly. Do NOT guess the schema -- read the code first.

### 1.2 Seed for Taguig (BGC area -- active beta testing)

At minimum, seed these agencies:

**Law Enforcement (PNP):**
- BGC Police Precinct -- Fort Bonifacio (covers BGC barangays)
- Taguig City Police Station (city-level fallback)

**Fire (BFP):**
- Taguig City Fire Station (or BFP Sub-Station covering BGC)

**EMS/Medical:**
- Taguig City Emergency Medical Services

### 1.3 Seed for Quezon City (pilot city)

QC is the primary pilot. Seed at minimum:

**Law Enforcement (PNP):**
- QC Police District (QCPD) -- city-level
- At least 2-3 precinct stations covering different QC areas

**Fire (BFP):**
- QC Fire District -- city-level

**EMS/Medical:**
- QC Disaster Risk Reduction and Management Office (DRRMO)

### 1.4 Create a Seed Script

Write a seed script that can be run from the terminal. Use Firebase Admin SDK. The script should:

1. Be idempotent -- running it twice should not create duplicates (use deterministic document IDs like `agency_pnp_bgc`)
2. Log what it creates
3. Be stored at `functions/scripts/seedAgencies.ts` (or similar) so it can be re-run for new pilot cities

```ts
// Example structure -- adapt to match dispatchReport's actual query patterns
const agencies = [
  {
    id: "agency_pnp_bgc",
    name: "BGC Police Precinct - Fort Bonifacio",
    type: "law_enforcement",
    agencyTypeKey: "law_enforcement",
    department: "pnp",
    city: "taguig",
    // Add whatever jurisdiction fields dispatchReport queries
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  // ... more agencies
];
```

### 1.5 Verify

After seeding, confirm:
```bash
# Count agencies
firebase firestore:get agencies --project aeris-citizen-app-16265
```

Or check in Firebase Console: Firestore > agencies collection > should have documents.

---

## Phase 2: Link Responders to Agencies

The responder "D. Cruz, John R." (Station 3, Central) is ONLINE in the responder app but received nothing. After agencies are seeded, verify that:

1. The responder's user document in Firestore has a field linking them to an agency (e.g., `agencyId`, `stationId`, or similar)
2. `dispatchReport` creates `responderInbox` entries that match the responder's agency/station assignment
3. The responder app queries `responderInbox` filtered by the logged-in responder's agency/station

If the responder-to-agency linkage doesn't exist, this is the second reason dispatches don't reach responders. Check:
- What field does the responder app use to filter incoming dispatches?
- Does D. Cruz's user document have a stationId or agencyId that matches the seeded agency?

Fix any mismatch.

---

## Phase 3: Tagalog Urgency Keywords

### 3.1 Add to classifyReport's Urgency Signals

Find the urgency detection logic in `functions/src/classifyReport.ts` and add these Tagalog keywords:

**Violence/Assault:**
- saksak, sinasaksak, pinagsaksak, sinaksak (stabbing)
- barilin, binabaril, pinaputukan, putok (shooting/gunfire)
- patay, pinatay, namatay, bangkay (death/killed/corpse)
- hostage, kidnap, dinukot, kinidnap (kidnapping)
- holdup, holdap, nakawan, ninakawan (robbery)
- away, rambol, gulo, riot (brawl/disturbance)
- sugat, nasugatan, dumudugo (wounded/bleeding)
- armas, baril, patalim, kutsilyo (weapons: gun, blade, knife)
- sunog, nasusunog (fire)

**Medical Emergency:**
- hindi humihinga, walang pulso (not breathing, no pulse)
- atake sa puso, heart attack (heart attack)
- stroke, seizure, kombulsyon (stroke/seizure/convulsion)
- nalulunod, drowning (drowning)
- naaksidente, aksidente, nabangga (accident/collision)
- buntis, nanganganak, labor (pregnant/giving birth)

**Disaster:**
- baha, bumabaha, tubig (flood/flooding/water)
- lindol, lumindol (earthquake)
- landslide, gumuho (landslide/collapsed)

### 3.2 These keywords should trigger:
- `track: "live_dispatch"` (not `admin_concern`)
- Higher urgency score in the Gemini prompt context
- If Gemini is down and keyword fallback runs, these keywords alone should force `live_dispatch` track

### 3.3 Also update the Gemini prompt

In the classification prompt sent to Gemini, add explicit instruction:

```
CRITICAL: Philippine Tagalog violence keywords indicate LIVE emergencies, not administrative concerns.
"sinasaksak" = someone is being STABBED right now = live_dispatch, NOT admin_concern.
"binabaril" = someone is being SHOT right now = live_dispatch, NOT admin_concern.
Always classify Tagalog violence terms as live_dispatch with maximum urgency.
```

---

## Phase 3.5: Default-to-Police Fallback (HARD RULE)

The Philippine operational reality is that ~90% of citizen reports are law enforcement matters. A report sitting in `pending_manual` with no agency assignment is a report that nobody sees. That is unacceptable, especially for emergencies.

### Rule: Every report MUST be dispatched. The final fallback is ALWAYS PNP.

Update `dispatchReport` so the fallback chain is:

1. **Exact barangay match** in `agencies` collection
2. **City-level fallback** (e.g., Taguig City Police Station)
3. **Department-level fallback** (e.g., any PNP station in the region)
4. **DEFAULT: Route to the nearest PNP station.** If no agency matches at all, route to the city-level PNP station for the report's GPS location. If even that doesn't exist, route to a hardcoded default PNP desk.

The fallback must write a real `dispatch_records` entry and a real `responderInbox` entry. The report must appear in the responder app. The report must appear in aeris-web.

`pending_manual` should only exist as a status when GPS is completely unavailable (the manual triage path from Phase 2 of the dispatch pipeline task). If GPS exists, the report MUST be dispatched somewhere. PNP is always the safe default.

### In classifyReport:

If Gemini fails AND keyword fallback finds no strong match, default to:
```
agencyTypeKey: "law_enforcement"
track: "live_dispatch"
category: "unclassified"
routingMeta.method: "default_pnp_fallback"
```

Do NOT default to `admin_concern`. A citizen who opened an emergency app and submitted a report is reporting something that needs a response. Default to treating it as a police matter and let the desk officer triage from there.

### In dispatchReport:

If the agency lookup returns zero results, do NOT write `pending_manual`. Instead:
1. Find the city-level PNP station for the report's GPS (or the hardcoded default)
2. Create the dispatch record and responderInbox entry
3. Set `routingMeta.method: "default_pnp_fallback"` so supervisors can see it was a fallback route
4. Log a warning: "No matching agency found. Defaulted to PNP fallback."

The only acceptable reason for `pending_manual` is: no GPS available at all.

---

## Phase 4: Re-test

After Phases 1-3 are complete:

1. Submit a new test report from the citizen app in BGC with description "May sinasaksak" (or similar Tagalog violence keyword)
2. Confirm in logs:
   - `classifyReport` fires, classifies as `crime`/`law_enforcement` with `track: "live_dispatch"`
   - `dispatchReport` fires, finds the seeded BGC agency, creates `dispatch_records` + `responderInbox`
   - Responder app (D. Cruz) shows the incoming request
   - aeris-web shows the report with correct classification
3. Submit a second test report with valid GPS but non-violent description (e.g., "Illegal parking sa 35th Street")
   - Should classify as non-emergency, route to correct agency, appear in both apps

---

## Hard Rules

- **Every report with GPS MUST be dispatched. No exceptions. The final fallback is PNP.**
- **`pending_manual` is ONLY acceptable when GPS is completely unavailable.**
- Seed script must be idempotent (deterministic IDs, no duplicates on re-run)
- Every agency document must have `active: true` to be queryable by dispatchReport
- Tagalog keywords must trigger `live_dispatch`, never `admin_concern`
- "sinasaksak" (stabbing) is ALWAYS a live emergency, regardless of what Gemini thinks
- If Gemini fails and keyword fallback finds no match, default to `law_enforcement` / `live_dispatch`, NOT `admin_concern`
- Do not modify dispatchReport's trigger or chain logic -- that's already fixed and deployed
- Seed agencies for BOTH Taguig (active beta) and Quezon City (pilot city)
- region: "asia-southeast1" on any new or modified Cloud Functions
- No em dashes in code, comments, or UI strings
- Gemini model: gemini-2.5-flash-lite only
- region: "asia-southeast1" on any new or modified Cloud Functions
- No em dashes in code, comments, or UI strings
- Gemini model: gemini-2.5-flash-lite only
