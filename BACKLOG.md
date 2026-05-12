# Succession Planning — Feature Backlog

## Completed

### 1. Consolidate Succession Bands (2026-05-09)
Streamlined from 4 time horizons (immediate, 1-2yr, 3-5yr, 5+yr) to 2 bands: **0-4 years** and **4-10 years**. Updated DB, scoring, UI, exports, and seed data.

### 2. Pipeline Health Scoring Overhaul (2026-05-09)
Replaced 5-dimension weighted scoring (A-E with green/amber/red) with **4 binary criteria** (red/green only):
- C1: Less than 2 successors in 0-4yr band
- C2: Incumbent is 60 years old or above
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
- PSD: review all agencies, endorse or return with notes, create cycles, manage users
- Admin: superuser access to everything
- Full audit trail: who added/removed whom, when, and why

### 5. Workflow States + Task Page (2026-05-09)
- States: draft → submitted → in_review → endorsed (or returned → re-editable)
- `/successionplanning` — unified page: agency HR sees task page, PSD sees review dashboard
- `/successionplanning/plan` — agency plan editor with searchable officer picker, submit confirmation
- `/successionplanning/submissions/[id]` — PSD review page with full plan + change log
- Past endorsed submissions shown for agency HR

### 6. Position Status Visibility + PSD Inline Editing (2026-05-11)
- Positions list shows submission status column per agency
- Position detail shows status badge in header
- PSD/admin can add successors inline from the succession tree (when submitted)

### 7. Unified Navigation + Data Scoping (2026-05-11)
- Nav bar: People (dropdown), Development (dropdown), Pipeline Health, Succession Planning, Admin
- Agency HR nav: only Pipeline Health + Succession Planning (no Home, People, Development, Admin)
- Agency HR scoped: pipeline health filtered to own agency, blocked from /positions /officers etc.
- Agency HR lands on /successionplanning after login (not /home)
- Role badge in header (Agency HR / PSD / Admin)

### 8. Cycle Management (2026-05-11)
- Only one open cycle at a time (block creating new if one exists)
- Auto-create draft submissions for all agencies when cycle is created
- PSD can create cycles directly from /successionplanning dashboard (inline form)
- Agency HR accounts created for all 8 agencies (agency_hr@xxx.gov.sg)

### 9. C2 Retirement Criterion Simplified (2026-05-11)
- Changed from scheme-specific retirement ages to simple **age >= 60** cut-off
- Per business user: based on prevailing statutory requirement age of 64, with ~4yr buffer

---

## Pending

### 10. AI Report Verbosity — Low Priority
Business users said the AI-generated pipeline narration is too wordy. Reduce output length and simplify language.

### 11. AI Successor Recommendation UX Redesign
Currently the AI recommender sits at the bottom of position detail. Users want:
- Side panel next to the succession tree
- Click into officer profiles from recommendations
- Compare officers side by side

### 12. LDS vs CHROO Distinction
Both are currently `psd` role. Need to split so:
- LDS manages Apex positions
- CHROO manages HR Leaders
- Approach TBD (tag per position, or derive from grade)

### 13. Ad-hoc Succession Plan for Specific Position
Ability to create a one-off succession plan for a specific position outside the regular cycle. Parked — revisit later.

### 14. Cycle Overlap Policy
Currently blocked (one open at a time). Business user to confirm if they need:
- Auto-close previous cycle when creating new one
- Or keep the current block-and-close-first approach

---

## Tech Debt / Notes
- Supabase MCP blocked by GovTech enterprise policy — using CLI instead
- C3 tenure criterion triggers at ≥8 years (approaching 10-year mark)
- ETL service scheme not yet in DB (only SPSL/PSL) — add when needed
- HUS officers (MHA) retire at 57 — may need per-scheme override for C2 later
- PSD review page is read-only for successors — needs edit capability (in progress)
