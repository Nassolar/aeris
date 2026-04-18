# TASK: AERIS Dispatch Pipeline Audit and Fix

**Priority:** CRITICAL -- Beta launch blocker
**Codebase:** aeris-web (Firebase codebase name: `aeris`)
**Project:** aeris-citizen-app-16265
**Region:** asia-southeast1
**Date:** April 15, 2026

---

## Context

During beta testing, report `BT86173508` failed to route. The citizen submitted a report, but no `routingStatus` was written, no `dispatch_records` entry was created, and no responder received the task. Investigation revealed two Cloud Functions competing on the same Firestore document with no sequencing, a deprecated Gemini model still in production, and a silent GPS null exit that kills the entire dispatch chain without alerting anyone.

This is a full audit and fix of the AERIS Core dispatch pipeline before public beta launch.

---

## Phase 0: Diagnostics (Do This First)

**Goal:** Confirm the exact failure mode before writing any code.

### 0.1 Pull Function Logs

```bash
# Check onReportCreated logs for the failed report
firebase functions:log --only aeris-onReportCreated --project aeris-citizen-app-16265 | grep "BT86173508"

# Check classifyReport logs for the same report
firebase functions:log --only aeris-classifyReport --project aeris-citizen-app-16265 | grep "BT86173508"
```

Record which of these you see:
- `"no GPS. Skipping routing."` -- confirms GPS null exit (Gate 1 failure)
- An exception/stack trace -- confirms function error
- No log entry at all -- confirms function was not triggered (deployment issue)

### 0.2 Inspect the Firestore Document

Check `reports/BT86173508` in Firebase Console. Document the presence or absence of these fields:
- `routingStatus` (written by `onReportCreated`)
- `agencyTypeKey`, `track`, `routedTo`, `routingMeta` (written by `classifyReport`)
- `immutableEvidence.location.latitude` / `immutableEvidence.location.longitude`
- `location.latitude` / `location.longitude`

### 0.3 Check Deployed Function Versions

```bash
firebase functions:list --project aeris-citizen-app-16265
```

Confirm both `classifyReport` and `onReportCreated` are deployed and their last deploy timestamps are recent.

**Checkpoint:** Do not proceed to Phase 1 until Phase 0 findings are documented in a comment block at the top of this file.

---

## Phase 1: Eliminate the Race Condition

**Goal:** Establish a single, sequential dispatch pipeline. COMMANDER AI classifies first, then DISPATCH AI routes.

### Current (Broken) Architecture

```
Citizen submits report
  |
  v
Firestore write: reports/{id}
  |
  +---> classifyReport (onDocumentWritten) -- COMMANDER AI
  |       - Calls Gemini for AI classification
  |       - Writes agencyTypeKey, track, routedTo, routingMeta
  |
  +---> onReportCreated (onDocumentCreated) -- DISPATCH AI
          - Keyword classification (redundant)
          - Agency lookup + responder matching
          - Creates dispatch_records + responderInbox
          - Writes routingStatus

Both fire simultaneously. No dependency. Race condition on writes.
```

### Target Architecture

```
Citizen submits report
  |
  v
Firestore write: reports/{id}
  |
  v
classifyReport (onDocumentCreated) -- COMMANDER AI
  - Calls Gemini 2.5 Flash-Lite for AI classification
  - Writes: agencyTypeKey, track, routedTo, routingMeta
  - Sets: classificationComplete = true, classifiedAt = serverTimestamp()
  |
  v
dispatchReport (onDocumentUpdated) -- DISPATCH AI
  - Trigger condition: classificationComplete === true AND routingStatus === undefined
  - GPS validation (with fallback -- see Phase 2)
  - Agency lookup (4-step fallback chain using `agencies` collection)
  - Creates dispatch_records + responderInbox entries
  - Writes: routingStatus, dispatchedAt
  |
  v
aeris-responder receives push + reads responderInbox
aeris-web reads dispatch_records + reports
```

### Implementation Steps

1. **Rename `onReportCreated` to `dispatchReport`** and change its trigger from `onDocumentCreated` to `onDocumentUpdated`.

2. **Add a guard clause at the top of `dispatchReport`:**
   ```ts
   // Only fire when classifyReport has finished
   const after = change.after.data();
   const before = change.before.data();

   if (!after?.classificationComplete) return;
   if (before?.classificationComplete === true) return; // Already processed
   if (after?.routingStatus) return; // Already dispatched
   ```

3. **Change `classifyReport` trigger from `onDocumentWritten` to `onDocumentCreated`.** It should only fire once on report creation, not on every subsequent update.

4. **Remove the redundant keyword classification logic from `dispatchReport`.** It should read `agencyTypeKey` and `track` from the document (set by `classifyReport`) instead of computing its own.

5. **Add `classificationComplete: true` write at the end of `classifyReport`** to trigger the dispatch chain.

6. **Add error handling in `classifyReport`:** If Gemini fails, write `classificationComplete: true` anyway with a `classificationFallback: true` flag, so dispatch still proceeds with keyword-based fallback.

### Validation

- Deploy both functions to a staging environment first
- Submit a test report and confirm in logs:
  - `classifyReport` fires ONCE on creation
  - `classifyReport` writes `classificationComplete: true`
  - `dispatchReport` fires ONCE after classification
  - `dispatchReport` creates `dispatch_records` and `responderInbox`
  - No duplicate writes, no race

---

## Phase 2: Fix GPS Null Silent Failure

**Goal:** Never silently abandon a report. Always write `routingStatus`, even on failure.

### Current (Broken) Behavior

```ts
// onReportCreated.ts:53 (will be dispatchReport after Phase 1)
if (lat == null || lng == null) {
  console.warn(`[onReportCreated] Report ${reportId} has no GPS. Skipping routing.`);
  return;  // Silent exit. No routingStatus. No alert. Report is orphaned.
}
```

### Fix

Replace the silent exit with a multi-tier GPS resolution strategy:

```ts
// dispatchReport.ts -- GPS Resolution
let lat = reportData.immutableEvidence?.location?.latitude
  ?? reportData.location?.latitude
  ?? null;
let lng = reportData.immutableEvidence?.location?.longitude
  ?? reportData.location?.longitude
  ?? null;

// Tier 1: Try EXIF from evidence photos
if (lat == null || lng == null) {
  const exifCoords = await extractGPSFromEvidence(reportData.evidenceIds);
  if (exifCoords) {
    lat = exifCoords.latitude;
    lng = exifCoords.longitude;
    console.info(`[dispatchReport] GPS recovered from EXIF for ${reportId}`);
  }
}

// Tier 2: Try user's last known location
if (lat == null || lng == null) {
  const userLoc = await getLastKnownLocation(reportData.reporterUid);
  if (userLoc) {
    lat = userLoc.latitude;
    lng = userLoc.longitude;
    console.info(`[dispatchReport] GPS fallback to last known location for ${reportId}`);
  }
}

// Tier 3: If still null, route to manual triage -- never silently drop
if (lat == null || lng == null) {
  console.warn(`[dispatchReport] No GPS available for ${reportId}. Routing to manual triage.`);
  await db.collection('reports').doc(reportId).update({
    routingStatus: 'manual_triage',
    routingError: 'no_gps_available',
    routingErrorAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create a triage task for aeris-web supervisors
  await db.collection('dispatch_records').add({
    reportId,
    status: 'pending_manual_triage',
    reason: 'no_gps',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // TODO (Phase 3): Send push notification to on-duty supervisor
  return;
}
```

### Citizen-Side Feedback

In the citizen app, when `routingStatus` is `manual_triage`, show:

> "Your report has been received and is being reviewed by a supervisor. We could not determine your exact location automatically. You may be contacted for additional details."

Do NOT show an error or leave the status blank. The citizen must always see acknowledgment.

---

## Phase 3: Gemini Model Migration

**Goal:** Remove all `gemini-1.5-flash` references. Replace with `gemini-2.5-flash-lite`.

### Audit Steps

```bash
# Find all Gemini model references in the functions codebase
grep -rn "gemini-1.5-flash\|gemini-2.0-flash\|gemini-1.0" functions/src/
```

### In `classifyReport`:

1. Change model string from `gemini-1.5-flash` to `gemini-2.5-flash-lite`
2. Add a 10-second timeout guard on the Gemini API call
3. Add retry logic: 1 retry with 3-second backoff
4. On final failure: fall back to keyword classification and set `classificationFallback: true`

```ts
const MODEL = 'gemini-2.5-flash-lite';
const TIMEOUT_MS = 10000;
const MAX_RETRIES = 1;

async function classifyWithGemini(reportData: any): Promise<ClassificationResult> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: buildClassificationPrompt(reportData) }] }],
        // ... config
      });

      clearTimeout(timeoutId);
      return parseClassificationResult(result);
    } catch (err) {
      console.error(`[classifyReport] Gemini attempt ${attempt + 1} failed:`, err);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  // Fallback to keyword classification
  console.warn(`[classifyReport] Gemini failed after retries. Using keyword fallback.`);
  return keywordClassify(reportData);
}
```

### Hard Rule

After this task, `grep -rn "gemini-1.5\|gemini-2.0-flash[^-]" functions/src/` must return zero results. Any remaining old model references are a deployment blocker.

---

## Phase 4: Collection Name Alignment

**Goal:** Confirm which collection the dispatch pipeline reads for agency/station lookup.

### Known Issue

`classifyReport` looks up the `stations` collection.
`onReportCreated` (now `dispatchReport`) looks up the `agencies` collection with a 4-step fallback chain.

### Action

1. Determine which collection is canonical and populated in production Firestore:
   - `agencies` -- the 4-level hierarchy (Platform > Department > Agency > Station)
   - `stations` -- older flat structure

2. If `agencies` is canonical (most likely per the LGU Project spec's 4-level hierarchy), update `classifyReport` to use `agencies` instead of `stations`.

3. If both exist, document which one is the source of truth and add a migration note to deprecate the other.

4. The lookup in `dispatchReport` should use the `agencies` collection with the established fallback chain:
   - Step 1: Exact barangay match
   - Step 2: City-level fallback
   - Step 3: Department-level fallback
   - Step 4: Default/catch-all agency

---

## Phase 5: Pre-Beta Hardening Checklist

**Goal:** Ensure the dispatch pipeline is production-ready before public beta.

### 5.1 End-to-End Smoke Tests

Run these tests on a staging Firebase project (or with test report IDs in production):

| # | Test Case | Expected Result |
|---|-----------|-----------------|
| 1 | Submit report with valid GPS | `classifyReport` fires, sets track. `dispatchReport` fires, creates `dispatch_records` + `responderInbox`. Responder app receives push. |
| 2 | Submit report with null GPS (no location permission) | GPS fallback chain executes. If all fail, `routingStatus: manual_triage` written. Citizen sees acknowledgment. Supervisor sees triage task. |
| 3 | Submit report when Gemini API is down | `classifyReport` falls back to keyword classification. `classificationFallback: true` set. `dispatchReport` still fires and routes. |
| 4 | Submit report with no matching agency in area | Fallback chain reaches Step 4 (default agency). Report is not orphaned. |
| 5 | Submit two reports in rapid succession | Both reports get independent classification and dispatch. No cross-contamination. |
| 6 | Submit report with evidence photos but no explicit GPS | EXIF extraction recovers GPS. Report routes normally. |

### 5.2 Monitoring

- Confirm Cloud Functions error reporting is connected to a monitored channel (email, Slack, or Firebase Alerts)
- Add structured logging with these fields on every dispatch:
  - `reportId`
  - `classificationMethod` (`gemini` or `keyword_fallback`)
  - `gpsSource` (`immutableEvidence`, `location`, `exif`, `lastKnown`, `manual_triage`)
  - `agencyMatched` (agency ID or `none`)
  - `dispatchLatencyMs` (time from report creation to responderInbox write)

### 5.3 Deployment

```bash
# Deploy ONLY the updated functions (codebase name is "aeris", not the function export names)
firebase deploy --only functions:aeris-classifyReport,functions:aeris-dispatchReport --project aeris-citizen-app-16265
```

**IMPORTANT:** The `aeris-web` Firebase codebase name is `aeris`. Use the codebase name from `firebase.json`, not the function export name, in deploy commands.

### 5.4 Rollback Plan

If the new pipeline causes regressions:
1. Redeploy the previous function versions from git history
2. The old `onReportCreated` (document created trigger) will resume working immediately
3. Document the regression and root cause before attempting a second fix

---

## Phase 6: Bridge 1 Verification

**Goal:** Confirm the AERIS-to-OBELISK bridge still works with the new dispatch pipeline.

`bridge1AerisObelisk` Cloud Function in aeris-citizen-app-16265 sends anonymized report data to OBELISK (obelisk-intel Supabase project: ylgmwqcmahqewemwpzlt). Verify that:

1. The bridge function is not affected by the `classifyReport`/`dispatchReport` restructuring
2. The bridge still fires on report creation (it should have its own independent trigger)
3. Anonymized data still flows to `aeris_anonymized_signals` in obelisk-intel
4. No PII leaks into the bridge payload

```bash
# Check bridge function logs
firebase functions:log --only aeris-bridge1AerisObelisk --project aeris-citizen-app-16265
```

---

## Hard Rules (Do Not Violate)

- No `gemini-1.5-flash` or `gemini-2.0-flash` (non-Lite) anywhere in production code after this task
- No silent exits in the dispatch pipeline. Every code path must write `routingStatus`.
- No citizen report may be silently orphaned. If routing fails, `manual_triage` status must be set.
- `classifyReport` fires exactly once per report (onDocumentCreated, not onDocumentWritten)
- `dispatchReport` fires exactly once per report (guarded by `classificationComplete` flag)
- Data flows upward only. No ORION/OBELISK data writes back to AERIS Firestore.
- Service role keys server-side only. Never in `NEXT_PUBLIC_*` env vars.
- No em dashes in code, comments, or UI strings.

---

## Success Criteria

This task is complete when:

1. A test report submitted from the citizen app with valid GPS reaches the responder app within 3 seconds
2. A test report submitted with no GPS writes `routingStatus: manual_triage` and creates a supervisor triage task
3. `grep -rn "gemini-1.5\|gemini-2.0-flash[^-]" functions/src/` returns zero results
4. All 6 smoke tests in Phase 5.1 pass
5. Bridge 1 logs confirm anonymized data still flows to OBELISK
6. No race condition between classification and dispatch (verified via sequential log timestamps)
