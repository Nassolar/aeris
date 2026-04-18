# AERIS Citizen App — Voice SOS Emergency Button
**Feature Spec · Citizen App (`aeris`)**
**Status:** Ready for Implementation
**Authored:** 14 March 2026

---

## 1. Overview

The Emergency SOS button is upgraded from a passive hold-to-dispatch trigger into an active **voice-capture SOS** mechanism. The button is permanently styled red and always visible. When a citizen holds the button for 3 seconds, the emergency is **immediately committed — with or without voice**. If the user continues holding beyond 3 seconds (up to 6 seconds total), the app captures their voice, transcribes it via Google Speech-to-Text, and routes the transcript to Conductor AI to classify which emergency units to dispatch. Nearby responders receive the AI classification, the voice memo audio, and the full transcript as part of the incident.

---

## 2. Button Design

### 2.1 Permanent Idle State (Always Visible)
- **Background:** Red (`#CD0E11`) — full button, always, even at rest
- **Icon:** Microphone (replaces the hazard/warning triangle entirely)
- **Primary label:** `EMERGENCY SOS` — white, bold
- **Secondary label:** `Hold 3 Seconds · State your emergency` — white, smaller
- **Progress ring:** Circular ring around the mic icon, unfilled (empty) at rest

---

## 3. Interaction States

### 3.1 Press Begins (0s)
- Progress ring begins filling clockwise immediately
- Secondary label changes to → `Reporting a fake emergency is a crime`
- Haptic: light pulse

### 3.2 Background Recording Begins (1s)
- Audio recording opens silently in the background — no new visual indicator at this point
- Progress ring continues filling (~33% complete)
- Haptic: light pulse

### 3.3 2-Second Mark
- Progress ring continues filling (~66% complete)
- Haptic: light pulse

### 3.4 Commit Threshold Reached (3s) ✅
- **Emergency is committed regardless of whether the user releases or continues holding**
- Progress ring reaches 100%
- Haptic: strong buzz — signals to the user that the emergency has been registered
- Secondary label changes to → `Speak now — recording...`
- Mic icon switches to pulsing/breathing animation to indicate live active recording
- Ring switches from fill animation to pulsing glow

### 3.5 Voice Window (3s to 6s)
- User may continue holding to capture up to **3 more seconds of voice** (6 seconds total hold)
- At 6 seconds: recording stops automatically, button transitions to Processing state
- User may also release at any point between 3s and 6s — dispatch proceeds immediately on release
- If released exactly at 3s: emergency is committed but no usable voice is attached

### 3.6 Processing State (after release or at 6s)
- Primary label → `Sending...`
- Secondary label → blank
- Spinner replaces mic icon
- Button non-interactive until dispatch is confirmed

---

## 4. Early Release Behavior (Before 3 Seconds)

| Hold Duration | Audio | Toast | Incident |
|---|---|---|---|
| < 1.5s | Discarded immediately | None — silent cancel | Not created |
| 1.5s – 3s | Discarded immediately | ✅ `"Hold for 3 full seconds to activate emergency"` (auto-dismisses after 3s) | Not created |

- In all early release cases: audio buffer is wiped on release, nothing is uploaded or stored
- Button resets to idle state

---

## 5. UI States — Summary Table

| State | Background | Text | Icon | Secondary Label | Ring |
|---|---|---|---|---|---|
| Idle | Red `#CD0E11` | White | 🎙 Mic | `Hold 3 Seconds · State your emergency` | Empty |
| 0–1s hold | Red `#CD0E11` | White | 🎙 Mic | `Reporting a fake emergency is a crime` | Filling 0–33% |
| 1–3s hold (recording silently) | Red `#CD0E11` | White | 🎙 Mic | `Reporting a fake emergency is a crime` | Filling 33–100% |
| 3–6s hold (committed, recording active) | Red `#CD0E11` | White | 🎙 Pulsing | `Speak now — recording...` | Pulsing glow |
| Processing | Red `#CD0E11` | White | Spinner | `Sending...` | — |
| Released < 1.5s | Red `#CD0E11` | White | 🎙 Mic | `Hold 3 Seconds · State your emergency` | Resets |
| Released 1.5s–3s | Red `#CD0E11` | White | 🎙 Mic | `Hold 3 Seconds · State your emergency` | Resets + toast |

---

## 6. Dispatch Logic

### 6.1 Two Scenarios

**Scenario A — No voice (released exactly at 3s, or inaudible audio)**
- Dispatch immediately as **General Emergency** → all four units notified simultaneously: Police, Medical, Fire, Rescue
- Incident flagged: `voiceCaptured: false`
- No Conductor AI classification attempted
- Responders receive: location, timestamp, citizen profile

**Scenario B — Voice captured (held 3–6s with audible audio)**
- Audio sent to Google Speech-to-Text → transcript generated
- Transcript sent to Conductor AI for classification
- Conductor AI selects which unit(s) to dispatch from: Police, Medical, Fire, Rescue (one or more, up to all four)
- Responders receive: location, timestamp, citizen profile, voice memo (playable audio), AI transcript, AI summary

### 6.2 Dispatch is Never Blocked by AI
- AI classification runs **in parallel** with dispatch preparation — it does not gate dispatch
- If Conductor AI does not respond within **3 seconds** of processing start → dispatch as General Emergency immediately
- AI result is appended to the incident document when it arrives, and responders are notified of the update

---

## 7. Conductor AI Classification

### 7.1 Input
```json
{
  "trigger": "voice_sos",
  "transcript": "string",
  "audioUrl": "string",
  "location": { "lat": 0.0, "lng": 0.0, "address": "string" },
  "timestamp": "ISO8601"
}
```

### 7.2 Output
```json
{
  "dispatchUnits": ["Police", "Medical", "Fire", "Rescue"],
  "primaryUnit": "Police",
  "confidence": "high | medium | low",
  "summary": "Brief AI-generated description of the emergency",
  "transcript": "Full transcribed text of the voice memo"
}
```

### 7.3 Dispatch Unit Selection Rules
- Conductor AI selects **one or more** of the four units: Police, Medical, Fire, Rescue
- It may select all four if the emergency type is ambiguous or multi-agency
- `primaryUnit` is the first unit notified; all others follow simultaneously
- Low confidence or empty/inaudible transcript → dispatch all four units, flag `needsReview: true`
- Responder can re-classify incident type from the Responder App without affecting the citizen's tracker view

---

## 8. Responder Delivery

Once dispatch is confirmed, nearby responders in the matched unit(s) receive the following on their incident card:

| Field | Description |
|---|---|
| Incident location | GPS coordinates + address + barangay |
| Citizen profile | Name, photo, credibility tier (T0–T4) |
| AI summary | Plain-text description generated by Conductor AI |
| Voice memo | Playable audio file (Firebase Storage URL) |
| Transcript | Full text of what the citizen said |
| Dispatch reason | Which unit(s) were selected and AI confidence level |
| `needsReview` flag | Shown if AI confidence was low — responder can re-classify |

---

## 9. Data Flow

```
[User holds button]
        │
        ▼ (at 1s)
[Mic opens silently — audio buffer begins in memory]
        │
        ▼ (at 3s — COMMIT POINT)
[Emergency committed regardless of release]
[Strong haptic buzz → mic pulsing animation → "Speak now" label]
        │
        ├── User releases at exactly 3s
        │       → Scenario A: General Emergency, all four units dispatched
        │       → No audio uploaded
        │
        ├── User continues holding (3s–6s)
        │       → Scenario B: Voice captured
        │
        ▼ (on release between 3–6s OR automatically at 6s)
[Recording stops → audio buffer finalized]
        │
        ▼ [Parallel tracks begin]
        ├── Track 1: Audio → Firebase Storage → URL stored in incident
        └── Track 2: Audio → Google Speech-to-Text → transcript string
                              │
                              ▼
                    [Transcript → Conductor AI Cloud Function]
                    [3s timeout: if no response → General Emergency dispatched]
                              │
                              ▼
                    [Firestore incident updated with AI classification]
                    [Responders notified with voice memo + transcript + summary]
        │
        ▼
[Citizen tracker screen opens — live status]
```

---

## 10. Firestore Incident Document

```
incidents/{incidentId}
├── trigger: "voice_sos"
├── voiceCaptured: boolean
├── voiceTranscript: string | null        ← from Google Speech-to-Text
├── audioUrl: string | null               ← Firebase Storage URL
├── audioHash: string | null              ← SHA-256 computed on-device at record-end
├── aiClassification: {
│     dispatchUnits: string[]             ← ["Police", "Medical", "Fire", "Rescue"]
│     primaryUnit: string
│     confidence: "high" | "medium" | "low"
│     summary: string
│     needsReview: boolean
│   }
├── location: { lat, lng, address, barangay }
├── status: "dispatched"
├── createdAt: Timestamp
└── citizenId: string
```

> **Evidence integrity:** SHA-256 hash of the audio is computed on-device at the moment recording ends — before upload — consistent with AERIS's chain-of-custody architecture. Raw Firestore data is write-once and unaffected by any AI processing layer.

---

## 11. Firebase Storage

Audio files stored at:
```
/sos-audio/{incidentId}/{timestamp}.m4a
```

- Format: `.m4a` (AAC, compatible with `expo-av`)
- Retention: 10 years (same as all emergency evidence)
- Access: Authorized responders and AERIS admins only — not public

---

## 12. Permissions Required

| Permission | Platform | When Requested |
|---|---|---|
| `RECORD_AUDIO` | Android | On first Voice SOS attempt |
| `NSMicrophoneUsageDescription` | iOS | On first Voice SOS attempt |

- **If permission denied:** Dispatch still proceeds as Scenario A (General Emergency, no audio)
- Show one-time modal after dispatch: `"Enable microphone access in Settings to include your voice in future emergency reports."`
- Mic permission denial must **never block or delay dispatch**

---

## 13. Packages / APIs

| Dependency | Purpose |
|---|---|
| `expo-av` | On-device audio recording |
| `expo-haptics` | Pulse and buzz feedback during hold |
| Google Speech-to-Text API | Transcription of voice memo |
| Conductor AI (Cloud Function) | Emergency classification + unit selection |
| Firebase Storage | Voice memo file storage |
| Firestore | Incident document creation and updates |

---

## 14. Edge Cases

| Scenario | Behavior |
|---|---|
| Released exactly at 3s | Scenario A — General Emergency, all four units, no audio |
| Silent or inaudible recording | Conductor AI receives empty transcript → Scenario A behavior, `needsReview: true` |
| Mic permission denied | Dispatch as Scenario A without audio |
| Conductor AI timeout (>3s) | Dispatch as General Emergency immediately; AI result appended to incident when received |
| Released < 1.5s | Silent cancel, no incident, audio buffer discarded |
| Released 1.5s–3s | Toast shown, no incident, audio buffer discarded |
| App goes to background mid-hold | Cancel hold, discard audio buffer, reset to idle; toast if ≥1.5s held |
| Double-press during processing | Second press ignored until current dispatch completes |
| No internet during SOS | Queue locally via offline store-and-forward; dispatch when connection restores |

---

## 15. Legal & Compliance Notes

- The label **"Reporting a fake emergency is a crime"** is displayed during hold to deter abuse, aligned with RA 10211 (False Reporting Law) and PNP policy
- All SOS activations — including cancelled holds — are logged with timestamps for audit trail
- Audio is routed to Firebase Storage directly; Conductor AI receives transcript text only, not raw audio
- Citizens are not shown AI classification details — only the incident status tracker is displayed post-dispatch
- Cash rewards remain a placeholder pending COA/DBM clearance — not applicable to Voice SOS

---

## 16. Out of Scope (This Sprint)

- Live audio streaming to active responder during incident
- Multi-language voice classification beyond Filipino / English
- Noise filtering or audio enhancement
- BOLO integration via Voice SOS
- Voice SOS from the Services tab

---

*This spec is ready for Claude Code implementation handoff.*