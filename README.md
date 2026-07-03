# Succession Planning

A succession-planning application for a government (PSD) context. It helps HR
teams track key positions across agencies, identify at-risk positions via
pipeline-health scoring, and manage evidence-based successor recommendations
with a human-in-the-loop review and endorsement workflow.

## Key features

- **Pipeline health** — positions scored against binary risk criteria (successor
  depth, incumbent retirement proximity, tenure, vacancy).
- **Successor recommendations** — a deterministic engine scores the officer pool
  against a position (competency fit, qualitative signals, stint diversity,
  aspiration alignment, grade proximity, leadership potential), with an AI rerank
  layered on top. Every score is explainable: the UI shows how each sub-score and
  weight contributes to the composite, plus plain-English reasons.
- **Human override** — reviewers can add/override successors with a documented
  rationale; changes are audited and flagged as "Human decision".
- **Submission workflow** — agency HR draft and submit plans; PSD reviews and
  endorses or returns. Endorsement captures an immutable plan snapshot; past
  endorsed plans are browsable per-position and across agencies.
- **Officer profiles** — grade, service scheme, leadership potential (ceiling),
  competencies, out-of-agency stints, career/posting history, and remarks.

## Tech stack

- Next.js 14 (App Router) + React 18 + TypeScript
- TailwindCSS + Radix UI primitives
- Supabase (Postgres) — data, accessed via server actions
- Anthropic (via Vercel AI SDK) for AI rerank and qualitative synthesis

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

Create a `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_COOKIE_DOMAIN=
ANTHROPIC_API_KEY=
```

Other scripts:

```bash
npm run build    # production build
npm run lint     # eslint
npm run seed     # seed sample data (src/scripts/seed-data.ts)
```

## Access & roles

Login is OTP/email based; a session cookie (`chronos_session`) gates the app via
middleware. Three roles: `agency_hr` (edit + submit own agency), `psd` (review,
endorse/return, manage cycles & users), and `admin` (superuser).

## Data model

The full schema is documented in [`schema.sql`](./schema.sql). Migrations live in
`src/scripts/*.sql`. See [`BACKLOG.md`](./BACKLOG.md) for feature history and
what's pending.

## Deployment

The deployment target is GovPaaS (GovTech's Northflank-based PaaS), built from a
Dockerfile. Supabase remains the database. See project notes for the GitLab
(SHIP-HATS) → GovPaaS setup.
