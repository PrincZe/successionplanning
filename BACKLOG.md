# Succession Planning — Feature Backlog

## Completed

### 1. Consolidate Succession Bands (2026-05-09)
Streamlined from 4 time horizons (immediate, 1-2yr, 3-5yr, 5+yr) to 2 bands: **0-4 years** and **4-10 years**. Updated DB, scoring, UI, exports, and seed data.

### 2. Pipeline Health Scoring Overhaul (2026-05-09)
Replaced 5-dimension weighted scoring (A-E with green/amber/red) with **4 binary criteria** (red/green only):
- C1: Less than 2 successors in 0-4yr band
- C2: Incumbent ≤3 years from retirement (SPSL/PSL)
- C3: Incumbent approaching/exceeding 10-year mark on job
- C4: Position is vacant

### 3. Officer Data Enhancements (2026-05-09)
- Added date of birth, service scheme (SPSL/PSL) to officers
- Added incumbent start date to positions
- Updated all officer IDs to NRIC-style format
- Age displayed on officer detail page

### 4. Role-Based Access + Submission Workflow (2026-05-09)
- 3 roles: `agency_hr`, `psd`, `admin`
- Agency HR: view own agency positions, edit successors, submit plan
- PSD: review all agencies, endorse or return with notes
- Admin: manage users, create/close submission cycles
- Full audit trail: who added/removed whom, when, and why

### 5. Workflow States + Task Page (2026-05-09)
- States: draft → submitted → in_review → endorsed (or returned → re-editable)
- `/agency` task page with active cycle, deadline countdown, submission status
- `/agency/plan` editor with searchable officer picker, submit confirmation modal
- `/psd` dashboard with submission counts by status
- `/psd/submissions/[id]` review page with full plan + change log

### 6. Position Status Visibility + PSD Inline Editing (2026-05-11)
- Positions list shows submission status column per agency
- Position detail shows status badge in header
- PSD/admin can add successors inline from the succession tree (when submitted)

---

## Pending

### 7. AI Report Verbosity — Low Priority
Business users said the AI-generated pipeline narration is too wordy. Reduce output length and simplify language.

### 8. AI Successor Recommendation UX Redesign
Currently the AI recommender sits at the bottom of position detail. Users want:
- Side panel next to the succession tree
- Click into officer profiles from recommendations
- Compare officers side by side

### 9. LDS vs CHROO Distinction
Both are currently `psd` role. Need to split so:
- LDS manages Apex positions
- CHROO manages HR Leaders
- Approach TBD (tag per position, or derive from grade)

---

## Tech Debt / Notes
- `openai` API routes removed (were unused, broke Vercel build)
- Supabase MCP blocked by GovTech enterprise policy — using CLI instead
- Retirement ages configurable in `pipeline_criteria` table: `{"SPSL": 62, "PSL": 65}`
- C3 tenure criterion triggers at ≥8 years (approaching 10-year mark)
