AERIS — Evidence Subcollection Fix + Responder Field Path Fix
==============================================================

PROJECT STRUCTURE — THREE SEPARATE APPS, ONE FIREBASE PROJECT:
aeris/             Citizen App (React Native/Expo)
aeris-responder/   Responder App (React Native/Expo)
aeris-web/         Web Portal (Next.js) + Cloud Functions

THIS PROMPT COVERS TWO SEPARATE APPS:
Part A → paste into aeris/ (Citizen App)
Part B → paste into aeris-responder/ (Responder App)

Both can be worked in parallel by separate agents if available,
or sequentially. Part A and Part B are fully independent.

═══════════════════════════════════════════════════════════════
PART A — aeris/ (Citizen App)
Evidence Subcollection Write
═══════════════════════════════════════════════════════════════
Conductor, please read CLAUDE.md and @.docs/AERIS_AGENTS.md before starting.
DO NOT MAKE ANY CHANGES YET. Research first, then present a plan for approval.
Problem
The Cloud Function onEvidenceUploaded triggers on:
reports/{reportId}/evidence/{evidenceId} (Firestore subcollection)
But the Citizen App currently writes uploaded photos as:
reports/{reportId}.imageUrls[] (array on root document)
Result: onEvidenceUploaded never fires. Gemini analysis never runs.
The evidence subcollection stays empty. Trust scores are never calculated.
Research Task (aeris/)

Find the report submission flow

Which file handles the final report submit?
Where does the image upload happen? (which hook, service, or screen)
What Firebase Storage path is used? (reports/{id}/...?)
After upload, what exactly is written to Firestore?

Is it imageUrls array on the root doc?
Or something else?




Find the SHA-256 hashing logic

Is there existing hash generation before upload?
Where is capturedInApp flag set?
How is the capturedInApp flag determined?
(camera capture vs gallery pick vs social media download)


Find existing evidence-related types

Is there an Evidence or EvidenceItem TypeScript interface?
What fields does it have?



Present findings, then await approval before any changes.
Fix — Write to Evidence Subcollection
After uploading each photo/video to Firebase Storage and getting the
download URL, ALSO write a document to the evidence subcollection.
Canonical Evidence Document Schema
typescript// reports/{reportId}/evidence/{auto-id}
{
  url:           string,        // download URL — field name is 'url' NOT 'fileUrl'
  mimeType:      string,        // 'image/jpeg' | 'image/png' | 'video/mp4'
  capturedInApp: boolean,       // true if taken with camera NOW, false if from gallery
  hash:          string | null, // SHA-256 of file bytes (if computable on device)
  uploadedAt:    Timestamp,
  trust: {
    score:            null,     // filled by Cloud Function after Gemini analysis
    level:            null,     // filled by Cloud Function
    capturedInApp:    boolean,  // mirrors root capturedInApp
    flags:            [],       // filled by Cloud Function
    geminiAnalysis:   null,     // filled by Cloud Function
    isSocialMedia:    boolean,  // true if downloaded from FB/TikTok/Instagram/YouTube
    isScreenshot:     boolean,  // true if detected as screenshot
    isScreenRecording: boolean, // true if detected as screen recording
    citizenContextNote: null,   // filled by Cloud Function if photo > 1hr old
  },
  updatedAt: Timestamp,
}
capturedInApp Detection Logic
typescriptfunction determineCapturedInApp(source: 'camera' | 'gallery' | 'unknown'): boolean {
  // Only true if citizen actively took the photo right now with the camera
  return source === 'camera';
}

function detectSocialMediaDownload(uri: string): boolean {
  const socialPatterns = [
    'facebook', 'fb.com', 'fbcdn',
    'tiktok', 'tiktokcdn',
    'instagram', 'cdninstagram',
    'youtube', 'youtu.be',
    'twitter', 'twimg',
  ];
  return socialPatterns.some(p => uri.toLowerCase().includes(p));
}
Implementation Pattern
typescript// After getting downloadUrl from Firebase Storage upload:

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const isCapturedInApp = source === 'camera'; // source from image picker
const isSocialMedia   = detectSocialMediaDownload(originalUri);

// Write to evidence subcollection — triggers onEvidenceUploaded Cloud Function
await addDoc(
  collection(db, 'reports', reportId, 'evidence'),
  {
    url:           downloadUrl,
    mimeType:      asset.mimeType ?? 'image/jpeg',
    capturedInApp: isCapturedInApp,
    hash:          null,          // hash on device is optional; CF will re-hash
    uploadedAt:    serverTimestamp(),
    trust: {
      score:             null,
      level:             null,
      capturedInApp:     isCapturedInApp,
      flags:             [],
      geminiAnalysis:    null,
      isSocialMedia:     isSocialMedia,
      isScreenshot:      false,   // Cloud Function detects this more reliably
      isScreenRecording: false,
      citizenContextNote: null,
    },
    updatedAt: serverTimestamp(),
  }
);

// Keep imageUrls array on root document for backward compatibility
// Evidence subcollection is the canonical path going forward
// Do NOT remove the existing imageUrls write — keep both
Important Rules

Field name is url — NOT fileUrl, NOT imageUrl, NOT downloadUrl
Always write to subcollection regardless of file type (image or video)
For video: same schema, mimeType will be video/mp4 or similar
Do NOT remove the existing imageUrls array write on the root document
Keep both — subcollection is canonical, imageUrls is backward-compatible
Do NOT add sub-category selection screens (unrelated, do not touch)
Do NOT modify the report submission form structure

Files Expected to Change (aeris/)

Whichever file/hook handles post-upload Firestore write
(likely in src/services/, src/hooks/, or src/screens/)
Possibly src/types/ if an Evidence interface needs updating

Approval Gate (Part A)
Before any changes present:

Which file handles the image upload + Firestore write?
What does it currently write after upload? (exact fields)
Is there existing SHA-256 hashing logic?
How is capturedInApp currently determined?

Wait for approval before changes.

// Part B removed - pasted directly to aeris-responder