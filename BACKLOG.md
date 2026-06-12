# Succession Planning — Feature Backlog

## Completed

### 1. Consolidate Succession Bands (2026-05-09)
Streamlined from 4 time horizons (immediate, 1-2yr, 3-5yr, 5+yr) to 2 bands: **0-4 years** and **5-10 years**. Updated DB, scoring, UI, exports, and seed data.

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
- Agency HR scoped: pipeline health filtered to own agency
- Agency HR lands on /successionplanning after login (not /home)
- Role badge in header (Agency HR / PSD / Admin)

### 8. Cycle Management (2026-05-11)
- Only one open cycle at a time (block creating new if one exists)
- Auto-create draft submissions for all agencies when cycle is created
- PSD can create cycles directly from /successionplanning dashboard (inline form)

### 9. C2 Retirement Criterion Simplified (2026-05-11)
- Simple **age >= 60** cut-off (prevailing statutory requirement 64, with ~4yr buffer)

### 10. AI Successor Recommendation UX (2026-05-17)
- Side panel next to succession tree (toggleable)
- Click into officer profiles from recommendations
- Compare officers side by side
- Manual add button to include officers alongside AI picks

### 11. Business Feedback Round 2 (2026-05-20)
- Renamed 4-10yr → 5-10yr band everywhere
- Section labels: "Near Term (0-4 years)" / "Longer Term (5-10 years)"
- Service scheme shown on successor names (PSL/SPSL/AO)
- Ranking with drag-and-drop reorder (@dnd-kit)
- Parent agency + current agency fields on officers
- DOB displayed in officer profile
- Leadership Potential (LP) field added
- CV/Posting history tab on officer profile
- Manual add to AI recommendations panel

### 12. Manual Successor Tagging (2026-06-10)
- Tag column: Immediate / Contingency / Blank (agency HR's choice, not auto-derived from rank)
- Multiple successors can share same tag
- Longer-term band: no tags shown
- "Leave Rank #1 vacant" toggle with visible empty slot placeholder
- Hard limits enforced: 5 max near-term, 10 max longer-term

### 13. Always-Open Editing (2026-06-12)
- Agency HR can access /positions (filtered to own agency) and edit successors anytime
- Editing no longer gated behind active cycle or submission status
- Cycle remains as an SLC submission checkpoint, not an editing window
- Audit trail records all changes even without linked submission

### 14. Endorsement Snapshots (2026-06-12)
- On PSD endorsement, full successor state captured as JSONB snapshot
- Viewable at `/successionplanning/snapshots/[id]` — read-only historical record
- "Endorsed Plans" section on agency landing page links to past snapshots

### 15. Post-Submission Edit Notifications (2026-06-12)
- Agency HR sees warning: "X changes since last submission on [date]"
- PSD sees per-agency badge: "X edits since" next to submission status

### 16. Officer Succession Tab (2026-06-12)
- New "Succession" tab on officer profile
- Shows all positions where officer is listed as successor (with band, rank, tag)
- Full change history timeline: added/removed/reordered with who/when/why
- Surfaces PSD recommendations that were later removed (historical visibility)

### 17. Position Change History (2026-06-12)
- "Change History" section on position detail page
- Chronological log of who was added/removed/reordered/tagged
- Shows officer name (linked), action, reason, timestamp, and who made the change

### 18. Comment Composer for Submissions (2026-06-12)
- Both agency HR and PSD can post comments anytime on a submission
- Flat chronological thread with role badges (Agency / PSD)
- Replaces previous read-only display with interactive composer

---

## Pending

### AI Report Verbosity — Low Priority
Business users said the AI-generated pipeline narration is too wordy. Reduce output length and simplify language.

### LDS vs CHROO Distinction
Both are currently `psd` role. Need to split so:
- LDS manages Apex positions
- CHROO manages HR Leaders
- Approach TBD (tag per position, or derive from grade)

### Ad-hoc Succession Plan for Specific Position
Ability to create a one-off succession plan for a specific position outside the regular cycle. Parked — revisit later.

---

## Tech Debt / Notes
- Supabase MCP blocked by GovTech enterprise policy — using CLI instead
- C3 tenure criterion triggers at ≥8 years (approaching 10-year mark)
- HUS officers (MHA) retire at 57 — may need per-scheme override for C2 later
- schema.sql is stale (uses '4-10_years', missing rank/tag columns) — live DB is source of truth
- Endorsed snapshots only exist from 2026-06-12 onward — older endorsed plans have no snapshot
