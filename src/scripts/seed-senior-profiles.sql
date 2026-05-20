-- Populate officer profiles: competencies, OOA stints, and remarks
-- for the 18 senior leadership officers

BEGIN;

-- ── Additional OOA Stints (senior-level) ────────────────────────────────────

INSERT INTO ooa_stints (stint_name, stint_type, year) VALUES
  ('Private Sector Attachment – McKinsey & Company', 'External', 2024),
  ('Private Sector Attachment – GIC', 'External', 2023),
  ('Cross-Ministry Project – Public Sector Transformation', 'Internal', 2024),
  ('Cross-Ministry Project – National AI Strategy', 'Internal', 2025),
  ('Overseas Study Trip – London (Governance Innovation)', 'International', 2024),
  ('Overseas Study Trip – Washington DC (Policy Design)', 'International', 2025),
  ('Executive Leadership Programme (ELP)', 'Training', 2025),
  ('Senior Leaders Programme – Harvard Kennedy School', 'Training', 2024),
  ('HRLP Attachment – PMO', 'Internal', 2024),
  ('HRLP Attachment – MND', 'Internal', 2025)
ON CONFLICT DO NOTHING;

-- ── Officer Competencies ────────────────────────────────────────────────────
-- Competency IDs: 1=HR Business Partnership, 2=Data Analytics, 3=Change Mgmt,
-- 4=Talent Mgmt, 5=L&D, 6=C&B, 7=Employee Relations, 8=HR Digital Transformation

-- PS-level incumbents: strong across the board (PL 4-5)
INSERT INTO officer_competencies (officer_id, competency_id, achieved_pl_level, assessment_date) VALUES
  -- S6831520A - Lim Chee Wee (PS MLAW/SLA)
  ('S6831520A', 1, 5, '2025-03-15'), ('S6831520A', 3, 5, '2025-03-15'),
  ('S6831520A', 4, 5, '2025-03-15'), ('S6831520A', 7, 4, '2025-03-15'),
  ('S6831520A', 8, 4, '2025-03-15'),
  -- S7072241B - Tan Kok Peng (PS MOF)
  ('S7072241B', 1, 5, '2025-04-01'), ('S7072241B', 2, 5, '2025-04-01'),
  ('S7072241B', 3, 4, '2025-04-01'), ('S7072241B', 6, 5, '2025-04-01'),
  ('S7072241B', 8, 4, '2025-04-01'),
  -- S6412083C - Ng Bee Lian (PS MSF)
  ('S6412083C', 1, 5, '2024-11-20'), ('S6412083C', 4, 5, '2024-11-20'),
  ('S6412083C', 5, 5, '2024-11-20'), ('S6412083C', 7, 5, '2024-11-20'),
  -- S6681430D - Goh Wei Ming (PS MOH)
  ('S6681430D', 1, 5, '2024-09-10'), ('S6681430D', 3, 5, '2024-09-10'),
  ('S6681430D', 4, 4, '2024-09-10'), ('S6681430D', 6, 4, '2024-09-10'),
  ('S6681430D', 7, 5, '2024-09-10'),

  -- DS-level incumbents: strong in key areas (PL 3-5)
  -- S7211054E - Chua Mei Ling (DS MOE)
  ('S7211054E', 1, 4, '2025-01-15'), ('S7211054E', 3, 4, '2025-01-15'),
  ('S7211054E', 4, 5, '2025-01-15'), ('S7211054E', 5, 5, '2025-01-15'),
  ('S7211054E', 8, 3, '2025-01-15'),
  -- S6941827F - Wong Chun Kiat (DS MHA)
  ('S6941827F', 1, 4, '2025-02-20'), ('S6941827F', 3, 5, '2025-02-20'),
  ('S6941827F', 7, 4, '2025-02-20'), ('S6941827F', 8, 4, '2025-02-20'),

  -- CE-level incumbents
  -- S7191254G - Ahmad Bin Ismail (CE HDB)
  ('S7191254G', 1, 4, '2025-03-01'), ('S7191254G', 2, 4, '2025-03-01'),
  ('S7191254G', 3, 5, '2025-03-01'), ('S7191254G', 8, 5, '2025-03-01'),
  -- S7363012H - Rajaratnam Siva (CE EDB)
  ('S7363012H', 1, 5, '2025-02-10'), ('S7363012H', 2, 3, '2025-02-10'),
  ('S7363012H', 4, 4, '2025-02-10'), ('S7363012H', 6, 4, '2025-02-10'),

  -- 0-4 year successors: developing (PL 3-4)
  -- S7532286J - Chong Shu Yi
  ('S7532286J', 1, 4, '2025-06-01'), ('S7532286J', 3, 4, '2025-06-01'),
  ('S7532286J', 4, 3, '2025-06-01'), ('S7532286J', 8, 4, '2025-06-01'),
  -- S7412087K - Teo Kian Huat
  ('S7412087K', 1, 4, '2025-05-15'), ('S7412087K', 2, 4, '2025-05-15'),
  ('S7412087K', 6, 3, '2025-05-15'), ('S7412087K', 7, 4, '2025-05-15'),
  -- S7651471L - Aisha Binte Yusof
  ('S7651471L', 1, 3, '2025-04-20'), ('S7651471L', 3, 4, '2025-04-20'),
  ('S7651471L', 4, 4, '2025-04-20'), ('S7651471L', 5, 4, '2025-04-20'),
  -- S7122815A - Ravi Chandran
  ('S7122815A', 1, 4, '2025-03-10'), ('S7122815A', 2, 5, '2025-03-10'),
  ('S7122815A', 3, 3, '2025-03-10'), ('S7122815A', 8, 5, '2025-03-10'),
  -- S7710035B - Stephanie Koh
  ('S7710035B', 1, 4, '2025-05-01'), ('S7710035B', 4, 4, '2025-05-01'),
  ('S7710035B', 5, 3, '2025-05-01'), ('S7710035B', 7, 3, '2025-05-01'),

  -- 4-10 year successors: earlier in development (PL 2-3)
  -- S8041762C - Daniel Ong
  ('S8041762C', 1, 3, '2025-06-10'), ('S8041762C', 2, 3, '2025-06-10'),
  ('S8041762C', 3, 3, '2025-06-10'), ('S8041762C', 4, 2, '2025-06-10'),
  -- S8282547D - Nurul Huda
  ('S8282547D', 1, 3, '2025-05-20'), ('S8282547D', 3, 2, '2025-05-20'),
  ('S8282547D', 5, 3, '2025-05-20'), ('S8282547D', 8, 3, '2025-05-20'),
  -- S8110972E - Kevin Lam
  ('S8110972E', 1, 3, '2025-04-05'), ('S8110972E', 2, 4, '2025-04-05'),
  ('S8110972E', 6, 3, '2025-04-05'), ('S8110972E', 8, 3, '2025-04-05'),
  -- S8311302F - Grace Tay
  ('S8311302F', 1, 2, '2025-06-15'), ('S8311302F', 4, 3, '2025-06-15'),
  ('S8311302F', 5, 3, '2025-06-15'), ('S8311302F', 7, 2, '2025-06-15'),
  -- S7962153G - Marcus Lee
  ('S7962153G', 1, 3, '2025-03-25'), ('S7962153G', 3, 4, '2025-03-25'),
  ('S7962153G', 7, 3, '2025-03-25'), ('S7962153G', 8, 3, '2025-03-25')
ON CONFLICT (officer_id, competency_id) DO UPDATE SET
  achieved_pl_level = EXCLUDED.achieved_pl_level,
  assessment_date = EXCLUDED.assessment_date;

-- ── Officer Stints ──────────────────────────────────────────────────────────
-- Mix of existing stints (1-10) and new ones (11-20)

INSERT INTO officer_stints (officer_id, stint_id, completion_year) VALUES
  -- PS incumbents: multiple senior stints
  ('S6831520A', 6, 2023), ('S6831520A', 7, 2023), ('S6831520A', 18, 2024),
  ('S7072241B', 1, 2022), ('S7072241B', 6, 2023), ('S7072241B', 15, 2024),
  ('S6412083C', 3, 2023), ('S6412083C', 7, 2023),
  ('S6681430D', 4, 2022), ('S6681430D', 6, 2023), ('S6681430D', 8, 2024),
  -- DS incumbents
  ('S7211054E', 5, 2024), ('S7211054E', 3, 2023), ('S7211054E', 16, 2025),
  ('S6941827F', 2, 2023), ('S6941827F', 4, 2022), ('S6941827F', 15, 2024),
  -- CE incumbents
  ('S7191254G', 11, 2024), ('S7191254G', 13, 2024), ('S7191254G', 5, 2024),
  ('S7363012H', 12, 2023), ('S7363012H', 14, 2025), ('S7363012H', 8, 2024),
  -- 0-4 year successors: building experience
  ('S7532286J', 5, 2024), ('S7532286J', 13, 2024),
  ('S7412087K', 9, 2022), ('S7412087K', 17, 2025),
  ('S7651471L', 3, 2023), ('S7651471L', 5, 2024), ('S7651471L', 14, 2025),
  ('S7122815A', 1, 2022), ('S7122815A', 4, 2022), ('S7122815A', 11, 2024),
  ('S7710035B', 10, 2023), ('S7710035B', 5, 2024),
  -- 4-10 year successors: early stints
  ('S8041762C', 5, 2024), ('S8041762C', 13, 2024),
  ('S8282547D', 3, 2023), ('S8282547D', 17, 2025),
  ('S8110972E', 4, 2022), ('S8110972E', 12, 2023),
  ('S8311302F', 5, 2024),
  ('S7962153G', 2, 2023), ('S7962153G', 13, 2024), ('S7962153G', 19, 2024)
ON CONFLICT (officer_id, stint_id) DO NOTHING;

-- ── Officer Remarks ─────────────────────────────────────────────────────────
-- Realistic appraisal-style remarks from senior leaders

INSERT INTO officer_remarks (officer_id, remark_date, place, details) VALUES
  -- S6831520A - Lim Chee Wee (PS MLAW/SLA)
  ('S6831520A', '2024-12-15', 'PSD Leadership Review',
   'Chee Wee continues to provide exceptional leadership across both MLAW and SLA. His ability to manage the dual PS role is commendable. He has driven significant reforms in the legal sector and land administration. Strong strategic thinker with deep policy instincts.'),
  ('S6831520A', '2024-06-10', 'PS Peer Review',
   'Well-regarded by fellow PS colleagues. His cross-domain expertise in law and land policy is a unique asset. Could benefit from deeper engagement with the tech transformation agenda.'),
  ('S6831520A', '2023-12-20', 'Annual Performance Review',
   'Outstanding year. Successfully led the MLAW digital transformation initiative and the SLA OneMap refresh. Demonstrated strong stakeholder management across multiple agencies.'),

  -- S7072241B - Tan Kok Peng (PS MOF)
  ('S7072241B', '2025-01-20', 'PSD Leadership Review',
   'Kok Peng brings analytical rigour to the PS MOF role. Has strengthened the fiscal policy framework and improved inter-ministry budget coordination. His background in economics serves MOF well.'),
  ('S7072241B', '2024-07-15', 'Mid-Year Review',
   'Strong performance in the budget cycle. Effective at translating complex fiscal positions into clear narratives for political leadership. Could develop his people leadership further — tends to be highly task-oriented.'),
  ('S7072241B', '2024-01-10', 'Annual Performance Review',
   'Solid first full year as PS MOF. Managed a challenging budget environment with skill. His data-driven approach is refreshing but needs to balance with political sensitivity.'),

  -- S6412083C - Ng Bee Lian (PS MSF)
  ('S6412083C', '2024-11-20', 'PSD Leadership Review',
   'Bee Lian has been a steady hand at MSF for nearly a decade. Deep institutional knowledge of social policy. However, succession planning for her own role is urgent given her age. She should be actively developing her deputies.'),
  ('S6412083C', '2024-05-15', 'PS Peer Review',
   'Deeply respected for her commitment to social welfare. Has built strong relationships with community partners. The long tenure has given her unmatched domain expertise but may also mean fresh perspectives are needed.'),
  ('S6412083C', '2023-06-10', 'Annual Performance Review',
   'Another strong year of social policy delivery. Led the ComCare reform and the Early Childhood Development Agency review. Her experience is invaluable during policy transitions.'),

  -- S6681430D - Goh Wei Ming (PS MOH)
  ('S6681430D', '2025-02-15', 'PSD Leadership Review',
   'Wei Ming has been instrumental in healthcare reform over his tenure at MOH. His leadership during post-pandemic restructuring was exemplary. Approaching retirement — transition planning is a priority.'),
  ('S6681430D', '2024-08-20', 'Mid-Year Review',
   'Continues to drive Healthier SG with energy and conviction. Well-regarded by the healthcare sector. His long tenure means deep networks but we need to ensure knowledge transfer to successors.'),
  ('S6681430D', '2024-01-15', 'Annual Performance Review',
   'Strong year managing the MOH transformation agenda. Successfully launched several new healthcare financing initiatives. Mentoring of DS-level officers has been commendable.'),

  -- S7211054E - Chua Mei Ling (DS MOE)
  ('S7211054E', '2025-03-01', 'PSD Leadership Review',
   'Mei Ling has grown rapidly in the DS role. Her education policy work is sharp and well-received by schools. Shows strong potential for PS-level appointment within 3-4 years. Should broaden exposure beyond education.'),
  ('S7211054E', '2024-09-10', 'Mid-Year Review',
   'Driving the SkillsFuture integration with MOE effectively. Good at building consensus with school leaders. Communication is clear and persuasive. Recommend cross-ministry stint to broaden perspective.'),

  -- S6941827F - Wong Chun Kiat (DS MHA)
  ('S6941827F', '2025-01-10', 'PSD Leadership Review',
   'Chun Kiat has been solid at MHA. His security policy background gives him credibility with uniformed services. Operational judgement is sound. Could benefit from exposure to social-sector ministries to round out his leadership profile.'),
  ('S6941827F', '2024-06-20', 'Mid-Year Review',
   'Good handling of the border security review. Works well under pressure. His team speaks highly of his mentoring approach. Potential PS candidate if given broader policy experience.'),

  -- S7191254G - Ahmad Bin Ismail (CE HDB)
  ('S7191254G', '2025-02-01', 'PSD Leadership Review',
   'Ahmad has brought fresh energy to HDB. His background in urban planning is a strong fit. The BTO reform programme is ambitious and well-executed. Stakeholder engagement with town councils has improved markedly.'),
  ('S7191254G', '2024-08-05', 'Board Review',
   'HDB board members note Ahmad''s strong performance. The organisation is more innovative under his leadership. Good balance of operational discipline and strategic vision.'),

  -- S7363012H - Rajaratnam Siva (CE EDB)
  ('S7363012H', '2025-03-10', 'PSD Leadership Review',
   'Siva has positioned EDB well for the next phase of economic development. Strong international network and effective in engaging MNCs. His leadership on the semiconductor strategy has been widely recognised.'),
  ('S7363012H', '2024-07-20', 'Mid-Year Review',
   'Excellent first year. Has refreshed EDB''s sector strategy and strengthened the investment pipeline. Team morale is high. Recommended for broader strategic planning roles in future.'),

  -- S7532286J - Chong Shu Yi (successor)
  ('S7532286J', '2025-04-01', 'PSD Talent Review',
   'Shu Yi is a high-potential officer who has consistently exceeded expectations. Her policy work at MLAW was exemplary. Currently being groomed for DS-level roles. Recommend early exposure to statutory board leadership.'),
  ('S7532286J', '2024-10-15', 'Supervisor Review',
   'Demonstrates excellent strategic thinking and stakeholder management. Led the legal tech transformation workstream with minimal guidance. Strong candidate for accelerated progression.'),

  -- S7412087K - Teo Kian Huat (successor)
  ('S7412087K', '2025-03-20', 'PSD Talent Review',
   'Kian Huat brings strong analytical capability and operational discipline. His financial background is a differentiator. Would benefit from a people-facing policy role to develop his engagement skills.'),
  ('S7412087K', '2024-11-01', 'Supervisor Review',
   'Reliable and thorough in his work. Budget coordination has been flawless. Needs to develop his communication and influence skills to prepare for DS/CE-level roles.'),

  -- S7651471L - Aisha Binte Yusof (successor)
  ('S7651471L', '2025-04-15', 'PSD Talent Review',
   'Aisha is one of the strongest officers in her cohort. Her work on social policy at MSF was outstanding. Empathetic leader with strong conviction. Ready for DS-level accountability in the next posting cycle.'),
  ('S7651471L', '2024-09-20', 'Supervisor Review',
   'Exceptional at navigating complex stakeholder environments. Built strong rapport with community organisations. Her facilitation and negotiation skills are among the best I have seen at this level.'),

  -- S7122815A - Ravi Chandran (successor)
  ('S7122815A', '2025-02-28', 'PSD Talent Review',
   'Ravi is a technically strong officer with deep expertise in data and digital transformation. His private sector attachment at DBS was highly valued by both sides. Should take on more leadership-heavy roles to balance his technical profile.'),
  ('S7122815A', '2024-08-15', 'Supervisor Review',
   'Ravi''s digital transformation work has been transformative for the ministry. He built the analytics capability from scratch. Peer feedback is strong — seen as approachable and knowledgeable. Potential CE candidate for a tech-oriented statutory board.'),

  -- S7710035B - Stephanie Koh (successor)
  ('S7710035B', '2025-05-01', 'PSD Talent Review',
   'Stephanie has shown strong growth in her current role. Good at building team capability and nurturing junior officers. Her education policy work shows nuanced understanding of implementation challenges. Needs more strategic planning exposure.'),
  ('S7710035B', '2024-12-10', 'Supervisor Review',
   'Steady and dependable. Stephanie managed the school leadership framework review with care and thoroughness. Well-liked by school leaders. Could push herself more on innovation and bold policy proposals.'),

  -- S8041762C - Daniel Ong (longer-term successor)
  ('S8041762C', '2025-06-01', 'PSD Talent Review',
   'Daniel is an emerging talent with strong analytical and communication skills. Still early in his senior career but showing excellent trajectory. His cross-ministry project work demonstrates adaptability and initiative.'),
  ('S8041762C', '2024-12-20', 'Supervisor Review',
   'Daniel has impressed in his current policy role. Quick learner who asks the right questions. Recommend a rotation to an operational agency to develop execution skills alongside his policy strengths.'),

  -- S8282547D - Nurul Huda (longer-term successor)
  ('S8282547D', '2025-05-15', 'PSD Talent Review',
   'Nurul shows strong potential in L&D and organisational development. Her recent work on the public service learning framework was well-received. Needs broader policy exposure and more leadership of cross-functional teams.'),
  ('S8282547D', '2024-10-01', 'Supervisor Review',
   'Nurul is thoughtful and diligent. Her research on future workforce capabilities was outstanding. She should seek out more high-stakes assignments to build resilience and confidence under pressure.'),

  -- S8110972E - Kevin Lam (longer-term successor)
  ('S8110972E', '2025-04-10', 'PSD Talent Review',
   'Kevin has a strong economics background that serves him well in fiscal and economic policy. His analytical output is consistently high quality. Should develop his people leadership — tends to work through individual contribution rather than team mobilisation.'),
  ('S8110972E', '2024-09-05', 'Supervisor Review',
   'Kevin''s budget analysis work was instrumental in this year''s fiscal planning. Precise and data-driven. Recommend a stint in a service delivery agency to develop operational empathy and frontline understanding.'),

  -- S8311302F - Grace Tay (longer-term successor)
  ('S8311302F', '2025-06-10', 'PSD Talent Review',
   'Grace is at an early stage but demonstrates strong fundamentals. Her talent management project showed good instincts for people and organisational dynamics. Needs more seasoning — recommend a structured rotation through at least two more agencies over the next 4-5 years.'),
  ('S8311302F', '2025-01-15', 'Supervisor Review',
   'Grace is eager to learn and takes feedback well. Her work on the succession planning process improvement was solid. She has the right disposition for senior leadership in the longer term — nurture carefully.'),

  -- S7962153G - Marcus Lee (longer-term successor)
  ('S7962153G', '2025-03-30', 'PSD Talent Review',
   'Marcus is a versatile officer with a good mix of policy and operational experience. His cross-ministry project on public sector transformation was one of the stronger outputs this year. Well-positioned for DS-level roles in 3-4 years.'),
  ('S7962153G', '2024-11-20', 'Supervisor Review',
   'Marcus handled the policy review with maturity beyond his grade. Good at synthesising complex inputs and presenting clear options. His change management skills are a strength — led a difficult organisational restructuring with minimal friction.')
ON CONFLICT DO NOTHING;

COMMIT;
