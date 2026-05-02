# AI Succession Planning — Implementation Plan

Living document. Update at end of each phase. Last updated: 2026-05-02.

## Goal

Build prototype AI features mapping to CHROO workflow steps 9–12:
- **Step 9**: Assess pipeline strength + flag at-risk positions against pre-defined criteria
- **Step 10a**: Recommend/rank successors based on competencies + career trajectory
- **Step 10b**: Generate development pathways for HRL officers
- **Step 10c**: Identify skill gaps + recommend interventions
- **Step 11**: CHROO review/edit AI output (UI affordance, woven into every phase — not a standalone phase)
- **Step 12**: Generate succession plan in required format + real-time traffic-light dashboard

## Guiding principles

1. **Deterministic engine first, AI on top.** Score with rules, narrate with LLM. Don't burn tokens computing things SQL can compute.
2. **Qualitative remarks are the load-bearing signal.** CHROO trusts what senior leaders say in forums more than competency scores. The rubric reflects this with 35% weight on qualitative endorsement.
3. **Human-in-the-loop everywhere.** Every AI output is editable by HR. Audit log every recommendation (input snapshot, prompt version, model, timestamp).
4. **Cache aggressively.** Pipeline scores + AI narration cached in tables, regenerated on input change. Dashboard reads cache, not live LLM.
5. **Mock first, replace later.** Prototype seeds use mocked criteria/values. Real CHROO criteria swap in via the `pipeline_criteria` config table — no code change.

## Phase status

- [x] **Phase 1**: Rubric design — LOCKED below
- [ ] **Phase 2**: Schema additions + mock seed — *next*
- [ ] **Phase 3**: Deterministic scoring engine
- [ ] **Phase 4**: Traffic-light dashboard
- [ ] **Phase 5**: AI qualitative extraction + narration + intervention ranking
- [ ] **Phase 6**: Successor recommender (step 10a)
- [ ] **Phase 7**: Skill gap + dev pathway (step 10b/c)
- [ ] **Phase 8**: Plan generation + export (step 12)

---

## Phase 1 — Pipeline Strength Rubric (LOCKED)

A pipeline = the set of identified successors for a single position across readiness bands. Pipeline strength score is a weighted composite of five sub-scores, each producing 0–100, mapped to a traffic-light band.

### Five dimensions

| Dimension | Weight | Source |
|---|---|---|
| **A. Qualitative endorsement** | 35% | AI extraction from `officer_remarks` |
| **B. Competency fit** | 25% | `position_required_competencies` × `officer_competencies` |
| **C. Coverage** | 20% | `position_successors` band counts |
| **D. Urgency match** | 15% | `incumbent_risk.risk_horizon_months` vs. coverage |
| **E. Development momentum** | 5% | `officer_stints` recency |

### A. Qualitative endorsement (35%)

For each successor in `immediate` + `1-2_years` bands, compute a per-officer **qualitative score 0–100** by extracting from their remarks:

- **Endorsement count** — distinct positive remarks in last 3 years
- **Endorsement specificity** — vague ("good officer") vs. specific ("strong in workforce planning, led the X review") — specific is stronger
- **Endorsement seniority** — Perm Sec / DS > Director > Peer (weighted)
- **Domain match** — do the endorsed strengths align with the *target position's* required competencies?
- **Concerns/flags** — negative or cautious remarks (e.g., "needs more exposure to operations") — penalize
- **Sentiment trajectory** — improving / stable / declining over time

Per-officer qualitative score = weighted blend of the above. Pipeline qualitative = weighted average of successor scores (immediate band weighted 2×, 1-2yr band weighted 1×).

- Green ≥75, Amber 50–74, Red <50

**Phase 2 mock**: deterministic rule (count of remarks + crude positive-word match) seeds `officer_qualitative_signals`. **Phase 5** replaces with real Claude extraction.

### B. Competency fit (25%)

Per successor: `fit_pct = sum(min(achieved_pl_level, required_pl_level) × weight) / sum(required_pl_level × weight)` across the position's `required_competencies`.

Pipeline fit = weighted average across immediate + 1-2yr successors.

- Green ≥80%, Amber 60–79%, Red <60%

### C. Coverage (20%)

| Band | Red | Amber | Green |
|---|---|---|---|
| Immediate | 0 | 1 | ≥2 |
| 1–2 years | 0–1 | 2 | ≥3 |
| 3–5 years | 0–2 | 3 | ≥4 |

Score = average of three band scores (Red=20, Amber=60, Green=100).

### D. Urgency match (15%)

| Incumbent risk horizon | Required immediate band | Score if missing |
|---|---|---|
| ≤12 months | ≥1 successor | 20 (Red) |
| 13–24 months | ≥1 in immediate OR ≥2 in 1-2yr | 60 (Amber) |
| 25–36 months | ≥2 in 1-2yr band | 60 (Amber) |
| >36 months | any | 100 (Green) |

### E. Development momentum (5%)

Proxy for prototype: % of successors (any band) with an OOA stint completed in last 3 years.

- Green ≥50%, Amber 25–49%, Red <25%

### Overall band

`overall_score = 0.35×A + 0.25×B + 0.20×C + 0.15×D + 0.05×E`

- Green ≥75, Amber 50–74, Red <50

**Hard override rules** (apply after weighted score):
1. If D (urgency) is Red → overall is Red regardless.
2. If A (qualitative) is Red AND immediate band has only 1 successor → cap overall at Amber.

### Reasons engine

Every score returns a `reasons[]` array of short strings. Examples:
- `"Immediate band empty"`
- `"Avg fit 64% — gaps in [C7 Workforce Planning, C12 Strategic HR]"`
- `"Incumbent retiring in 8mo, no immediate successor"`
- `"Only 1 senior endorsement in last 3 years for immediate successor"`
- `"3 successors but none with OOA stint exposure"`

These feed directly into the dashboard tooltip and into the AI narration prompt in Phase 5.

---

## Phase 2 — Schema Additions + Mock Seed (NEXT)

### New tables

```sql
-- 1. What each role requires (currently missing — biggest gap)
create table position_required_competencies (
  position_id varchar references positions(position_id) on delete cascade,
  competency_id integer references hr_competencies(competency_id),
  required_pl_level integer not null check (required_pl_level between 1 and 5),
  weight numeric not null default 1.0,
  primary key (position_id, competency_id)
);

-- 2. When does the incumbent likely leave
create table incumbent_risk (
  position_id varchar primary key references positions(position_id) on delete cascade,
  risk_horizon_months integer not null,
  risk_reason text,
  updated_at timestamptz not null default now()
);

-- 3. CHROO criteria as editable config (so thresholds can be tuned without code)
create table pipeline_criteria (
  criterion_key varchar primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

-- 4. AI-extracted signals from officer_remarks (cached)
create table officer_qualitative_signals (
  officer_id varchar primary key references officers(officer_id) on delete cascade,
  endorsement_count integer not null default 0,
  endorsement_specificity_score numeric not null default 0,  -- 0-100
  endorsement_seniority_score numeric not null default 0,    -- 0-100
  concerns_count integer not null default 0,
  sentiment_trajectory varchar check (sentiment_trajectory in ('improving','stable','declining','unknown')),
  qualitative_score numeric not null default 0,              -- 0-100, blended
  signals jsonb,                                             -- raw extracted bullets
  source_remark_ids integer[],                               -- traceability
  generated_at timestamptz not null default now(),
  generation_method varchar not null default 'mock'          -- 'mock' | 'ai'
);

-- 5. Cached pipeline assessments (so dashboard is fast)
create table pipeline_assessments (
  position_id varchar primary key references positions(position_id) on delete cascade,
  overall_score numeric not null,
  overall_band varchar not null check (overall_band in ('green','amber','red')),
  sub_scores jsonb not null,            -- {A: {score, band, ...}, B: {...}, ...}
  reasons jsonb not null,               -- string[]
  ai_narration text,                    -- filled in Phase 5
  ai_interventions jsonb,               -- filled in Phase 5
  computed_at timestamptz not null default now()
);
```

### Tables deferred to later phases

- `officer_aspirations`, `officer_availability` — Phase 6 (successor recommender)
- `development_offerings` — Phase 7 (interventions)

Add when needed; keeps Phase 2 lean.

### Mock seed strategy

- **`position_required_competencies`**: assign 3–5 competencies per existing position with random `required_pl_level` (3–5) and `weight` (1–3). Use a deterministic hash of position_id so seed is reproducible.
- **`incumbent_risk`**: random `risk_horizon_months` in [6, 60] per position with incumbent. Bias ~15% to ≤12mo to create "red" cases for testing.
- **`pipeline_criteria`**: insert the rubric thresholds from Phase 1 as JSONB rows (one per dimension + one for weights + one for hard overrides).
- **`officer_qualitative_signals`**: deterministic mock — for each officer, count their `officer_remarks`, score specificity by remark length proxy (>200 chars = specific), seniority based on `place` field keyword match (Perm Sec / DS / Director keywords). Sets `generation_method='mock'`. Phase 5 replaces with AI.
- **`pipeline_assessments`**: empty initially; populated by scoring engine in Phase 3.

### Migration application

Apply via Supabase MCP `apply_migration` to project `ealhuhtvfjylzmgrxipx`. Mirror into `schema.sql` for source-controlled record. Seed via separate `execute_sql` calls.

---

## Phase 3 — Scoring Engine (after Phase 2)

Pure TS module: `src/lib/pipeline-scoring/score.ts`

```ts
type SubScore = { score: number; band: 'green'|'amber'|'red'; reasons: string[] }
type PipelineAssessment = {
  position_id: string
  overall_score: number
  overall_band: 'green'|'amber'|'red'
  sub_scores: { A: SubScore; B: SubScore; C: SubScore; D: SubScore; E: SubScore }
  reasons: string[]      // flattened top reasons
}

scorePipeline(position_id: string): Promise<PipelineAssessment>
scoreAllPipelines(): Promise<PipelineAssessment[]>  // for dashboard
```

Reads from existing tables + new tables. Writes result to `pipeline_assessments`. No AI yet.

Trigger: on-demand recompute via API route + scheduled refresh (Phase 4 detail).

---

## Phase 4 — Traffic-Light Dashboard

Route: `/dashboard/pipeline-health` (or wherever existing dashboards live).

- Grid: positions (rows) × readiness bands (cols), cell colored by overall band, drilldown opens position detail with sub-scores + reasons.
- Filters: agency, jr_grade, band.
- "At-risk" tab: only Red + Amber positions sorted by urgency horizon.
- Reads `pipeline_assessments` cache; "Recompute" button calls Phase 3 engine.

---

## Phase 5 — AI Qualitative + Narration + Interventions

Three Claude calls, each cached:

1. **Qualitative extractor** (replaces mock in `officer_qualitative_signals`):
   Input: officer remarks. Output: structured signals JSON via tool use. Re-run when new remarks added.
2. **Pipeline narrator**:
   Input: a `PipelineAssessment` + officer summaries. Output: 2–3 paragraph plain-English explanation of why the pipeline is green/amber/red. Stored in `pipeline_assessments.ai_narration`.
3. **Intervention ranker**:
   Input: assessment + reasons. Output: ranked list of suggested interventions with rationale. Stored in `pipeline_assessments.ai_interventions`.

Model: Haiku for extraction (volume), Sonnet for narration/ranking (quality). Zero-retention enabled. Audit-log every call.

---

## Phase 6 — Successor Recommender (step 10a)

Adds `officer_aspirations` + `officer_availability` tables.

Flow per position:
1. Engine filters: grade band match, available, hard competency floors → top ~20 candidates
2. Engine scores each: competency fit + qualitative score + stint diversity + aspiration alignment
3. AI rerank top 10 with structured reasoning (tool use → JSON)
4. UI shows ranked list with sub-scores, reasoning, one-click "add as successor at band X"

---

## Phase 7 — Skill Gap + Dev Pathway (step 10b/c)

Adds `development_offerings` table (mock catalog of stints, training, mentorships, rotations).

Per (officer, target_position):
1. Engine: gap = required_pl - achieved_pl per competency, weighted
2. AI: pick interventions from catalog matching the gaps, rank by ROI/duration/feasibility
3. Output: structured "development plan" with timeline, stored on officer or in new `officer_development_plans` table

---

## Phase 8 — Plan Generation + Export (step 12)

- Per-pipeline, per-agency, organization-wide plan documents
- Composes: traffic-light snapshot + AI narration + recommended successors + intervention plans
- Export: PDF via `react-pdf` or HTML → print, plus markdown for emails
- Real-time dashboard already covered in Phase 4

---

## Open questions / decisions log

- **2026-05-02**: Locked rubric weights at 35/25/20/15/5 — qualitative leads, per CHROO emphasis on forum remarks. May tune.
- **2026-05-02**: Hard overrides chosen (urgency-red beats weighted score) to prevent gaming.
- **TBD**: Should `pipeline_criteria` thresholds be admin-editable in UI or remain SQL-only for prototype? *Default: SQL-only for now.*
- **TBD**: How to surface qualitative score traceability in UI — show source remarks behind score? *Likely yes — defensibility.*
- **TBD**: Bias audit pass — currently deferred until after Phase 5. Risk: remark sentiment may encode bias.
