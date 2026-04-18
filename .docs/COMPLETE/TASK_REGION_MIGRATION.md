# TASK: Region Migration + Dispatch Pipeline Deploy

**Priority:** CRITICAL -- Beta launch blocker
**Codebase:** aeris-web (Firebase codebase name: `aeris`)
**Project:** aeris-citizen-app-16265
**Canonical Region:** asia-southeast1 (Manila)
**Date:** April 15, 2026

---

## PERMANENT RULE (Add to CLAUDE.md if not already present)

**Every Firebase Cloud Function in this project MUST specify `region: "asia-southeast1"` explicitly. No exceptions. Ever.**

`us-central1` is Firebase's silent default. It is NEVER acceptable for any AERIS function, even temporarily, even for testing, even if "it works anyway." This was flagged months ago and ignored. It is now a hard deployment blocker.

**Conductor: After completing this task, add this rule to CLAUDE.md under the Firebase Gotchas section if it is not already there:**

```
- EVERY Cloud Function must include explicit `region: "asia-southeast1"` in its options object. Firebase defaults to us-central1 silently. This is a deployment blocker -- PR/deploy will be rejected if any function is missing the region field. No exceptions. No "we'll fix it later."
```

**Conductor: Also add a PreToolUse hook or lint check that flags any Cloud Function definition missing `region: "asia-southeast1"`.** If a hook already exists for function definitions, extend it. If not, create one. The goal is to make it impossible to accidentally deploy a function without the region set.

---

## Execution Model

Conductor handles everything end-to-end. No manual Firebase Console steps required. The workflow is:

1. Update all function source files to include `region: "asia-southeast1"`
2. Delete old us-central1 functions via `firebase functions:delete` (batched)
3. Deploy updated functions via `firebase deploy` (batched, immediately after each delete batch)
4. Update all client-side `getFunctions()` calls to specify `asia-southeast1`
5. Verify with `firebase functions:list`
6. Run smoke tests

Conductor must execute the delete and deploy commands directly. Do not ask Raven to run them manually.

---

## Context

`firebase functions:list` reveals that roughly half of our Cloud Functions are deployed to `us-central1` (Firebase's default) instead of `asia-southeast1` (our locked canonical region). This adds unnecessary latency to every function invocation since Firestore, Auth, and Storage are all in `asia-southeast1`. The dispatch pipeline fix (classifyReport/dispatchReport) must deploy to `asia-southeast1`.

Firebase does not allow in-place region changes. A function deployed to `us-central1` must be deleted before it can be redeployed to `asia-southeast1`.

---

## Phase 1: Audit Every Function Definition

### 1.1 Find all function definitions missing explicit region

Search every Cloud Function source file for region configuration. Every function MUST have an explicit region set to `asia-southeast1`.

```bash
# Find all function definitions
grep -rn "onDocumentCreated\|onDocumentUpdated\|onDocumentWritten\|onCall\|onSchedule\|onObjectFinalized\|beforeUserCreated" functions/src/ --include="*.ts"

# Find which ones already specify asia-southeast1
grep -rn "asia-southeast1" functions/src/ --include="*.ts"
```

### 1.2 Fix every function definition

For v2 Cloud Functions, the region is set in the options object. Every function must include it explicitly.

**Firestore triggers:**
```ts
import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const myFunction = onDocumentCreated(
  {
    document: "reports/{reportId}",
    region: "asia-southeast1",
  },
  async (event) => { /* ... */ }
);
```

**Callable functions:**
```ts
import { onCall } from "firebase-functions/v2/https";

export const myFunction = onCall(
  {
    region: "asia-southeast1",
  },
  async (request) => { /* ... */ }
);
```

**Scheduled functions:**
```ts
import { onSchedule } from "firebase-functions/v2/scheduler";

export const myFunction = onSchedule(
  {
    schedule: "every 5 minutes",
    region: "asia-southeast1",
  },
  async (event) => { /* ... */ }
);
```

**Storage triggers:**
```ts
import { onObjectFinalized } from "firebase-functions/v2/storage";

export const myFunction = onObjectFinalized(
  {
    region: "asia-southeast1",
  },
  async (event) => { /* ... */ }
);
```

**Auth blocking triggers:**
```ts
import { beforeUserCreated } from "firebase-functions/v2/identity";

export const myFunction = beforeUserCreated(
  {
    region: "asia-southeast1",
  },
  async (event) => { /* ... */ }
);
```

Do this for EVERY function in the codebase. No exceptions. No function should be missing an explicit `region: "asia-southeast1"`.

---

## Phase 2: Delete us-central1 Functions

These functions are currently deployed to `us-central1` and must be deleted before redeploying to `asia-southeast1`. Delete them one batch at a time.

### Functions to delete (from us-central1):

```
addToWhitelist
askAerisAI
askAerisWithRAG
bulkWhitelistUpload
checkCaseCounters
checkPlatformConfigs
checkRecurringTasks
checkStalePresence
checkTaxonomyFields
checkUnacceptedDispatch
checkUnclassifiedReports
classifyReport
expireORIONAccounts
forceSignOutAll
onDispatchTimeout
onEvidenceUploaded
onNewThreadMessage
onReportCreated
onReportFinalized
onThreadExpiry
onTransferAccepted
onboardLGU
removeFromWhitelist
repairCaseCounters
repairPlatformConfigs
repairRecurringTasks
repairStalePresence
repairTaxonomyFields
repairUnclassifiedReports
resolvePendingAccount
runAllHealthChecks
scheduleForceSignOutReset
setLGUStaffClaims (us-central1 duplicate -- asia-southeast1 copy already exists)
toggleAppBeta
updateBetaLimits
updateBetaMessage
```

### Deletion process

**IMPORTANT:** Do NOT delete all functions at once. Do it in batches to minimize downtime.

**Batch 1 -- Dispatch-critical functions (deploy immediately after delete):**
```powershell
# Delete the old dispatch functions from us-central1
firebase functions:delete classifyReport onReportCreated --project aeris-citizen-app-16265 --force

# Immediately deploy the new versions to asia-southeast1
firebase deploy --only functions:aeris-classifyReport,functions:aeris-dispatchReport --project aeris-citizen-app-16265
```

Note: `onReportCreated` is being replaced by `dispatchReport`. Delete `onReportCreated`, deploy `dispatchReport`.

**Batch 2 -- Evidence and AI functions:**
```powershell
firebase functions:delete onEvidenceUploaded askAerisAI askAerisWithRAG --project aeris-citizen-app-16265 --force
firebase deploy --only functions:aeris-onEvidenceUploaded,functions:aeris-askAerisAI,functions:aeris-askAerisWithRAG --project aeris-citizen-app-16265
```

**Batch 3 -- Report lifecycle functions:**
```powershell
firebase functions:delete onReportFinalized onNewThreadMessage onThreadExpiry onTransferAccepted onDispatchTimeout --project aeris-citizen-app-16265 --force
firebase deploy --only functions:aeris-onReportFinalized,functions:aeris-onNewThreadMessage,functions:aeris-onThreadExpiry,functions:aeris-onTransferAccepted,functions:aeris-onDispatchTimeout --project aeris-citizen-app-16265
```

**Batch 4 -- Health check and repair functions (low risk, non-realtime):**
```powershell
firebase functions:delete checkCaseCounters checkPlatformConfigs checkRecurringTasks checkStalePresence checkTaxonomyFields checkUnacceptedDispatch checkUnclassifiedReports repairCaseCounters repairPlatformConfigs repairRecurringTasks repairStalePresence repairTaxonomyFields repairUnclassifiedReports runAllHealthChecks --project aeris-citizen-app-16265 --force
firebase deploy --only functions --project aeris-citizen-app-16265
```

**Batch 5 -- Admin/auth functions:**
```powershell
firebase functions:delete addToWhitelist bulkWhitelistUpload removeFromWhitelist forceSignOutAll scheduleForceSignOutReset toggleAppBeta updateBetaLimits updateBetaMessage onboardLGU resolvePendingAccount expireORIONAccounts --project aeris-citizen-app-16265 --force
firebase deploy --only functions --project aeris-citizen-app-16165
```

**Batch 6 -- Duplicate cleanup:**
```powershell
# setLGUStaffClaims exists in BOTH regions. Delete the us-central1 copy.
firebase functions:delete setLGUStaffClaims --region us-central1 --project aeris-citizen-app-16265 --force
```

---

## Phase 3: Verify

After all batches are deployed:

```powershell
firebase functions:list --project aeris-citizen-app-16265
```

**Success criteria:**
- Every single function shows `asia-southeast1` in the Location column
- Zero functions in `us-central1`
- `classifyReport` shows trigger `google.cloud.firestore.document.v1.created` (not `.written`)
- `dispatchReport` shows trigger `google.cloud.firestore.document.v1.updated`
- `onReportCreated` no longer exists in the function list

---

## Phase 4: Update Callable Function Client References

**CRITICAL:** Callable functions (onCall) that are invoked from client apps (citizen app, responder app, aeris-web) include the region in the client-side call. If the client code does not specify a region, the Firebase SDK defaults to `us-central1`.

Search all client codebases for callable function invocations:

```bash
# In aeris (citizen app)
grep -rn "httpsCallable\|getFunctions" src/ --include="*.ts" --include="*.tsx"

# In aeris-responder
grep -rn "httpsCallable\|getFunctions" src/ --include="*.ts" --include="*.tsx"

# In aeris-web
grep -rn "httpsCallable\|getFunctions" src/ --include="*.ts" --include="*.tsx"

# In aeris-partner, aeris-partner-web
grep -rn "httpsCallable\|getFunctions" src/ --include="*.ts" --include="*.tsx"
```

Every `getFunctions()` call must specify the region:

```ts
// WRONG -- defaults to us-central1
const functions = getFunctions(app);

// CORRECT
const functions = getFunctions(app, "asia-southeast1");
```

If there is a shared Firebase config/init file, fix it there once. If `getFunctions` is called in multiple places, fix each one. This is required for every callable function to work after the region migration.

### Also check for hardcoded function URLs

Some code might call Cloud Functions via direct HTTP URLs instead of the SDK:

```bash
grep -rn "cloudfunctions.net\|run.app" src/ --include="*.ts" --include="*.tsx"
```

Any URL containing `us-central1` must be updated to `asia-southeast1`.

---

## Phase 5: Smoke Tests (from TASK_DISPATCH_PIPELINE_AUDIT.md Phase 5.1)

Run all 6 smoke tests after deployment:

| # | Test Case | Expected Result |
|---|-----------|-----------------|
| 1 | Submit report with valid GPS | classifyReport fires in asia-southeast1, sets track. dispatchReport fires, creates dispatch_records + responderInbox. Responder receives push. |
| 2 | Submit report with null GPS | GPS fallback executes. routingStatus: manual_triage written. Citizen sees acknowledgment. |
| 3 | Submit report when Gemini API is down | classifyReport falls back to keyword classification. dispatchReport still fires. |
| 4 | Submit report with no matching agency | Fallback chain reaches default agency. Report not orphaned. |
| 5 | Two rapid reports | Both route independently. No cross-contamination. |
| 6 | Report with geotagged photos but no explicit GPS | Report routes (or goes to manual_triage if EXIF tier not yet built). |

---

## Hard Rules

- Every function must have explicit `region: "asia-southeast1"`. No exceptions.
- No function may remain in `us-central1` after this task.
- Delete before redeploy. Firebase cannot change regions in place.
- Deploy in batches. Do not delete all functions simultaneously.
- Update all client-side `getFunctions()` calls to specify `asia-southeast1`.
- `classifyReport` trigger must be `onDocumentCreated`, not `onDocumentWritten`.
- `dispatchReport` replaces `onReportCreated`. The old function must be deleted.
- No em dashes in code, comments, or UI strings.
- Gemini model must be `gemini-2.5-flash-lite` everywhere. No `gemini-1.5-flash` or `gemini-2.0-flash`.
