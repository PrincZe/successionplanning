# Succession Planning — Product Backlog (Blank-Slate View)

This backlog reimagines the succession-planning product from zero, organized
into delivery phases. It is written as user stories grouped by epic. Some of
these capabilities already exist in the live application (see `BACKLOG.md` for
build history) — this document captures the *product* view, not the build
order that actually happened, so it can be used to re-baseline scope,
re-prioritize, or onboard new stakeholders.

**Guiding constraint from the business:** the agency submission workflow
(draft → submit → review → endorse/return) is a Phase 1 must-have, not a
later enhancement. Nothing about tracking positions and successors is useful
to PSD until agencies can actually submit a plan for review.

Format: `As a <role>, I want <capability>, so that <benefit>.`
Roles: **Agency HR** (submits plans for their own agency), **PSD**
(reviews/endorses across all agencies), **Admin** (system configuration).

---

## Phase 1 — Foundations & Submission Workflow (MVP)

Goal: stand up the core data model and get a real plan through the full
submission-review-endorsement loop, even with minimal scoring/AI. This phase
alone should be usable end-to-end.

### Epic 1.1 — Access & Roles
1. As an Admin, I want to create user accounts and assign them to a role
   (Agency HR / PSD / Admin) and an agency, so that access is scoped
   correctly from day one.
2. As a user, I want to log in via a one-time-passcode sent to my work email,
   so that I don't need to manage a separate password.
3. As an Agency HR user, I want to only see and edit data for my own agency,
   so that I can't view or change another agency's succession data.
4. As a PSD user, I want to see data across all agencies, so that I can
   review submissions organization-wide.

### Epic 1.2 — Core Data: Officers & Positions
5. As an Agency HR user, I want to create and maintain officer records
   (name, ID, grade, current agency), so that I have a pool of people to
   consider as successors.
6. As an Agency HR user, I want to create and maintain key position records
   (title, agency, incumbent), so that I know which roles need succession
   coverage.
7. As an Agency HR / PSD user, I want to search and filter officers and
   positions by agency, grade, or name, so that I can find records quickly
   as the dataset grows.

### Epic 1.3 — Successor Assignment
8. As an Agency HR user, I want to add one or more officers as successors to
   a position, so that I can record who could take over the role.
9. As an Agency HR user, I want to rank or reorder successors for a
   position, so that the priority order is clear to reviewers.
10. As an Agency HR user, I want to remove a successor from a position, so
    that I can keep the plan current as circumstances change.

### Epic 1.4 — Submission Cycles
11. As a PSD user, I want to open a new submission cycle, so that all
    agencies are prompted to submit an updated plan on a known timeline.
12. As a PSD user, I want the system to prevent opening a second cycle while
    one is already open, so that agencies aren't confused by overlapping
    submission windows.
13. As an Agency HR user, I want a draft submission auto-created for my
    agency when a cycle opens, so that I have a clear starting point to work
    from.

### Epic 1.5 — Submission Workflow (Draft → Submit → Review → Endorse/Return)
14. As an Agency HR user, I want a single task page showing my agency's plan
    status (draft, submitted, in review, endorsed, returned), so that I
    always know what's expected of me next.
15. As an Agency HR user, I want to submit my agency's succession plan when
    it's ready, so that PSD can begin their review.
16. As an Agency HR user, I want submission blocked until minimum required
    fields are filled in (e.g., every key position has at least one
    successor), so that I don't submit an incomplete plan by mistake.
17. As a PSD user, I want a review dashboard listing all agency submissions
    and their status, so that I can track which ones need my attention.
18. As a PSD user, I want to open a submitted plan and review every position
    and successor within it, so that I have full visibility before deciding.
19. As a PSD user, I want to endorse a plan, so that it's marked as approved
    and the agency knows no further action is needed.
20. As a PSD user, I want to return a plan with a note explaining why, so
    that the agency knows exactly what to fix before resubmitting.
21. As an Agency HR user, I want a returned plan to become editable again
    with the PSD's notes visible, so that I can address the feedback and
    resubmit.

### Epic 1.6 — Basic Audit Trail
22. As a PSD user, I want every successor addition/removal/reorder logged
    with who made the change and when, so that I can trust the plan's
    history during review.
23. As an Agency HR user, I want to optionally record a reason when I change
    a successor, so that context isn't lost by the time PSD reviews it.

---

## Phase 2 — Risk Visibility & Governance Trail

Goal: once plans are flowing through submission, give PSD the ability to
triage risk and trust the historical record.

### Epic 2.1 — Pipeline Health Scoring
24. As a PSD user, I want each position flagged red/green against simple,
    objective risk criteria (e.g., fewer than 2 near-term successors,
    incumbent nearing retirement age, incumbent long tenure in role, vacant
    position), so that I can prioritize attention without reading every
    record.
25. As an Agency HR user, I want to see my own agency's pipeline health
    score, so that I know which of my positions are most at risk before I
    submit.
26. As a PSD user, I want an org-wide pipeline health view across all
    agencies, so that I can spot systemic risk areas.

### Epic 2.2 — Status Visibility
27. As a PSD user, I want a status column on the positions list showing each
    position's current submission status, so that I don't have to open each
    one individually.
28. As an Agency HR / PSD user, I want a status badge on a position's detail
    page, so that the state is obvious in context.

### Epic 2.3 — Endorsement Snapshots
29. As a PSD user, I want the full successor list captured as a permanent,
    read-only snapshot the moment I endorse a plan, so that later edits
    can't retroactively alter what was actually approved.
30. As an Agency HR user, I want to browse my agency's past endorsed plans,
    so that I can see what was approved historically.

### Epic 2.4 — Post-Submission Change Notifications
31. As a PSD user, I want to see a badge indicating how many edits an agency
    has made since their last submission, so that I know if a "submitted"
    plan is now stale.
32. As an Agency HR user, I want a warning showing how many changes I've
    made since my last submission, so that I remember to resubmit before
    the cycle closes.

### Epic 2.5 — Change History
33. As a PSD / Agency HR user, I want a chronological change-history log on
    each position (who added/removed/reordered/tagged whom, and why), so
    that I can understand how the current plan came to be.
34. As an Agency HR / PSD user, I want to see, from an officer's own
    profile, every position where they're listed as a successor (past and
    present), so that I can assess an individual's succession footprint
    without hunting through every position.

---

## Phase 3 — Decision Support & AI-Assisted Recommendations

Goal: reduce the manual effort of finding successors and make the
recommendation logic transparent enough for PSD and agencies to trust it.

### Epic 3.1 — Deterministic Successor Scoring
35. As an Agency HR user, I want the system to suggest candidate successors
    for a position based on objective factors (competency fit, grade
    proximity, stint/rotation diversity, aspiration alignment), so that I
    don't have to manually recall every eligible officer.
36. As an Agency HR / PSD user, I want to see a breakdown of why an officer
    was recommended (each sub-score and its weight), so that I can trust and
    explain the suggestion rather than treat it as a black box.

### Epic 3.2 — AI-Assisted Rerank & Narration
37. As an Agency HR user, I want an AI layer to rerank the deterministic
    shortlist using qualitative signals, so that recommendations account for
    nuance that a pure formula misses.
38. As a PSD user, I want a short, plain-English narrative summarizing a
    position's succession risk, so that I can grasp the situation without
    reading raw scores.

### Epic 3.3 — Human Override
39. As an Agency HR user, I want to manually add an officer as a successor
    even if they weren't AI-recommended, so that local knowledge always
    overrides the algorithm.
40. As an Agency HR user, I want a required rationale field when I override
    or add outside the AI's suggestions, so that reviewers understand the
    judgment call.
41. As a PSD user, I want overridden/human-added entries visibly flagged as
    "human decision" in the audit trail, so that I can distinguish
    algorithmic from judgment-based choices.

### Epic 3.4 — Comparison & Tagging
42. As an Agency HR user, I want to view two or more candidate officers
    side-by-side, so that I can compare their strengths before deciding.
43. As an Agency HR user, I want to tag each successor as Immediate or
    Contingency (my own judgment, not auto-derived), so that PSD understands
    readiness at a glance.
44. As an Agency HR user, I want to explicitly leave the #1 rank vacant with
    a visible placeholder, so that an intentional gap isn't confused with an
    incomplete plan.

---

## Phase 4 — Officer Profile Depth & Development Planning

Goal: make the officer record itself rich enough to support real talent
decisions, not just a name attached to a position.

### Epic 4.1 — Extended Officer Profile
45. As an Agency HR user, I want to record date of birth, service scheme,
    and leadership potential rating on an officer, so that eligibility
    criteria (like retirement-linked risk scoring) can be calculated
    automatically.
46. As an Agency HR user, I want to record an officer's parent agency and
    current posting agency separately, so that cross-agency rotations are
    tracked accurately.
47. As an Agency HR / PSD user, I want an officer's age and tenure
    auto-computed and displayed on their profile, so that reviewers don't
    have to do the math themselves.

### Epic 4.2 — Career & Competency History
48. As an Agency HR user, I want to record an officer's posting/stint
    history, so that rotation diversity can inform succession decisions.
49. As an Agency HR / PSD user, I want to maintain a competency framework
    and assess officers against it, so that "competency fit" scoring has
    real underlying data rather than a guess.
50. As an Agency HR user, I want to attach free-text remarks to an officer's
    profile, so that qualitative context not captured by structured fields
    isn't lost.

### Epic 4.3 — Development Plans
51. As an Agency HR user, I want to record a development plan for an officer
    (e.g., stretch assignments, training, exposure needed), so that
    succession isn't just about picking a name but growing the pipeline.
52. As a PSD user, I want to see an officer's development plan alongside
    their succession candidacy, so that I can judge readiness, not just
    eligibility.

---

## Phase 5 — Collaboration, Differentiated Governance & Reporting

Goal: round out the workflow with discussion, finer-grained governance
roles, exceptions to the standard cycle, and reporting for leadership.

### Epic 5.1 — Collaboration on Submissions
53. As an Agency HR / PSD user, I want to post comments on a submission at
    any time (not just during formal review), so that clarifying questions
    don't require a separate email thread.
54. As an Agency HR / PSD user, I want comments shown in a single
    chronological thread with role badges, so that I can follow the
    conversation easily.

### Epic 5.2 — Differentiated Reviewer Roles
55. As an Admin, I want to distinguish between reviewer sub-roles (e.g., one
    group managing top-tier/apex positions, another managing HR-leader
    positions), so that review responsibility matches organizational
    structure rather than a single flat "PSD" role.
56. As a differentiated reviewer, I want to see only the positions in my
    remit, so that my review queue isn't cluttered with positions outside my
    mandate.

### Epic 5.3 — Ad-hoc / Out-of-Cycle Plans
57. As a PSD user, I want to trigger a one-off succession review for a
    single position outside the regular cycle (e.g., an unexpected
    vacancy), so that urgent gaps don't have to wait for the next scheduled
    cycle.
58. As an Agency HR user, I want an ad-hoc request to follow the same
    submit/review/endorse workflow as a regular cycle, so that the
    governance standard doesn't get diluted for exceptions.

### Epic 5.4 — Reporting & Admin
59. As a PSD / Admin user, I want to export a submission or the org-wide
    pipeline health view (e.g., to spreadsheet/PDF), so that I can share
    findings with leadership outside the system.
60. As an Admin, I want to manage the list of agencies and users, so that
    onboarding a new agency doesn't require a database change.
61. As an Admin, I want to view system-wide audit logs across all agencies
    and cycles, so that I can investigate any data-integrity concern.

---

## Notes on Sequencing

- **Phase 1 is the hard requirement from the business**: nothing ships
  before agencies can submit and PSD can endorse/return, even if scoring is
  crude and AI doesn't exist yet.
- Phases 2–3 can interleave in practice (risk scoring and recommendations
  are somewhat independent), but risk visibility (Phase 2) is lower-risk to
  build and validate first since it's deterministic and easier to trust.
- Phase 4 (officer depth) is what *feeds* Phase 3's scoring quality — teams
  sometimes want to pull specific Phase 4 stories (e.g., DOB/service scheme)
  earlier if Phase 3 scoring depends on them. Call this out explicitly if
  re-sequencing.
- Phase 5 items are largely independent of each other and can be
  reprioritized freely based on stakeholder feedback once Phases 1–3 are
  live.
