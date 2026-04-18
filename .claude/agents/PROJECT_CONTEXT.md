# AERIS Project Context v2
# Loaded once per session. All agents reference this shared context.

## Mission
AI-powered neutral coordination layer between agencies in the Philippines. Augments existing enforcement teams and DRRM capabilities through real-time data integration, AI-assisted dispatch, and seamless citizen-to-responder communication.

## Company
AERIS Technologies Inc. (aeristech.ai). Solo founder: Raven. IPOPHL patent pending (24 claims, 5 functional layers).

## Revenue Model
"Robin Hood" cross-subsidy. Commercial service marketplace funds free emergency response for government agencies. Free is a liability in LGU procurement. AERIS competes on owned infrastructure and institutional accountability.

## Tech Stack
- Mobile: React Native, Expo Router (citizen) / React Navigation (responder, partner)
- Web: Next.js 14, TypeScript, Tailwind CSS
- Backend: Firebase (citizen-scale real-time), Supabase (intelligence platforms)
- AI: Gemini 2.5 Flash-Lite (all platforms), Claude Sonnet (Responder Copilot only)
- Maps: Google Maps Platform (JS API, Geocoding, Distance Matrix, 3D Tiles)
- Knowledge Base: Flowise + Qdrant Cloud (gemini-embedding-001, 768-dim)
- WebRTC: Metered.ca TURN + Firebase RTDB signaling

## Gamification (Two Systems)
1. Vigilance Score Tier (lifetime): Watcher 0-1499 / Guardian 1500-3999 / Shield 4000-9999 / Sentinel 10000+
2. Active Status (rolling 90d): Inactive (1x) / Active (1.25x) / Sharp (1.5x) / On Fire (2x)
- 1pt = PHP 0.10 (never disclosed publicly)
- Responder caps: 1000pts/mo. Citizen caps: 600pts/mo.

## Demo Cities
Quezon City (primary pilot), Taguig, Pasig.

## Key Partnerships
- PNP: ATHENA primary partner. Small Value Procurement pilot (ABC <= PHP 2M, RA 12009 Section 34).
- IBP: Free Admin + Lawyer Portal. 8% commission on paid consults. Framed as IBP Official Digital Pro Bono Compliance Platform.
- MMDA, DENR, DOST, Senator Bam Aquino, Development Gateway: proposals in circulation.

## Regulatory Blockers
- NPC registration: blocks all KYC/citizen data features
- QC Data Sharing Agreement: blocks jurisdiction layer with citizen data
- ATHENA legal opinion: required before any agency demo
- Gemini 2.0 Flash migration: must complete before June 1, 2026

## Competitive Moat
Accumulated RIS baseline data, integration complexity, and relationship ownership with government partners. Not features.
