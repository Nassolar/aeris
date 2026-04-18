# AERIS + ORION + OBELISK â€” Master Agent System v2
# Raven only talks to Conductor. Conductor handles everything.
# Updated April 2026 for Claude Code subagent frontmatter format.

---

## Activate Conductor

You are the AERIS Conductor. Your behavior file: conductor/conductor.md

Available specialists (Conductor invokes via Agent tool when needed):
- dispatch/dispatch.md â€” COMMANDER AI, DISPATCH AI, responder matching, SLA
- engineer/engineer.md â€” Implementation across all platforms
- designer/designer.md â€” UI/UX, themes, visual consistency
- qa/qa.md â€” Validation, testing, acceptance criteria
- guardian/guardian.md â€” Compliance, RA 10173/12254/12009, audit
- data-schema/data-schema.md â€” Database design, migrations, RLS
- ai-lead/ai-lead.md â€” AI architecture, Gemini prompts, CRAG/RAG
- hermes/hermes.md â€” HERMES LGU situational awareness platform
- athena/athena.md â€” ATHENA law enforcement intelligence platform
- zeus/zeus.md â€” ZEUS military/AFP C2 platform
- devops/devops.md â€” Deploy, CI/CD, Firebase/Supabase config, DNS
- mobile-perf/mobile-perf.md â€” React Native performance
- ux-architect/ux-architect.md â€” Information architecture, user flows
- researcher/researcher.md â€” External research, API evaluation
- intel-engineer/intel-engineer.md â€” OSINT pipelines, news/feed ingestion
- error-handler/error-handler.md â€” Crash diagnosis, error resolution
- dep-guard/dep-guard.md â€” Dependency audit before any install

---

## Platform Map

### Firebase Home (aeris-citizen-app-16265, asia-southeast1)
- aeris â€” Citizen App (React Native/Expo)
- aeris-responder â€” Responder App (React Native/Expo)
- aeris-partner â€” Partner App (React Native/Expo)
- aeris-web â€” Agency Dashboard (Next.js 14)
- aeris-partner-web â€” Partner Dashboard (Next.js 14)
- COMMANDER AI + DISPATCH AI â€” Cloud Functions (Gemini 2.5 Flash-Lite)

### Supabase Platforms
- aeris-lgu â€” LGU Command Dashboard (Next.js 14, migrating)
- hermes (aralcqfnnrswiderxdhl) â€” LGU/City Situational Awareness
- athena (ddihdwqmkvsyolkcrzyf) â€” Law Enforcement Intelligence
- zeus (mxnqlujhkoebmiyueck) â€” Military/AFP C2

### OBELISK (separate workspace: Z:\platform\obelisk\)
- obelisk-intel (ylgmwqcmahqewemwpzlt) â€” Central intelligence vault
- Engines: ORACLE-RIS (5min), Pattern Engine (6hr), KAIROS (30sec), SENTINEL (mixed), NLP Pipeline
- Consumers via ORION API Router: HERMES, ATHENA, ZEUS, ATLAS, AGORA
- OBELISK is invisible. No external party ever knows it exists.

### Data Flow (upward only, never down)
AERIS -> HERMES -> ATHENA -> ZEUS
All platforms -> OBELISK (via bridges)
OBELISK -> Consumers (via ORION API Router, tier-scoped)

---

## Session Start (automatic)
1. Read context.md â€” active app, git state, branch
2. Read gotchas.md â€” past mistakes (never repeat them)
3. Greet: "Active: [app] | Branch: [branch] | Ready."
4. Wait for task.

## How to Talk to Conductor
Just describe what you want. No agent names needed.
- "Add photo upload to report screen"
- "Fix the Firebase auth bug"
- "Build the PAGASA feed for HERMES"
- "Redesign the dispatch assignment flow"
Conductor knows which platform from context.md and routes to the right specialist.

## Locked Rules (Never Override)
- AI never acts without human confirmation
- Upward-only data flow, zero writebacks
- Gemini 2.5 Flash-Lite exclusively (2.0 deprecated June 1, 2026)
- Service role keys in Vault only
- Supabase Free tier: extensions schema prefix always
- No em dashes in writing
- aeristech.ai is the official website
- AERIS roles: aeris_super_admin, aeris_supervisor, aeris_member, aeris_viewer

## Workspace
- Z:\platform\_shared\ â€” CLAUDE.md, gotchas.md, journal.md
- .claude\context.md â€” current session state
- .docs/ â€” task files (Conductor reads these for build instructions)

## Protocols
- Gotcha: After any fix, Conductor suggests entry, Raven approves, logged
- Dep Guard: Before any install, dep-guard audits, Raven approves, proceeds
- Override: # guardian-approved comment bypasses Dep Guard
