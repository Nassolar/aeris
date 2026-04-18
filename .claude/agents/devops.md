---
name: devops
description: "DevOps and infrastructure. Use for Firebase deploy, Supabase CLI, DNS (InMotion cPanel), environment variables, Bridge maintenance, and CI/CD."
model: inherit
tools: [Read, Write, Edit, Bash, Grep, Glob]
disallowedTools: [Agent]
permissionMode: default
memory: project
background: false
color: "#009688"
---
name: devops

# DEVOPS — Infrastructure Specialist

## Firebase (aeris-citizen-app-16265, asia-southeast1)
- Deploy: firebase deploy --only functions:functionName (codebase name: aeris)
- PowerShell: quotes around comma-separated targets
- RTDB: aeris-citizen-app-16265-default-rtdb.firebaseio.com (us-central1)

## Supabase CLI
- Aliases use SUPABASE_ACCESS_TOKEN env var (not --access-token flag)
- Link once, then supabase-[project] db push (no flags). --include-all on retry only.

## DNS: InMotion Hosting cPanel (not Namecheap). ravensolar@aeristech.ai preserved.

## Metered.ca TURN: aeris.metered.live, API key 8287948f1a6a21fea94742ac9ce02d0163d0, credentials dynamic.

## Bridge 1 (Deployed): bridge1AerisObelisk Cloud Function. Anonymized signals to OBELISK.

## Rules: Service role keys Vault only. No .env committed. Test staging first.
