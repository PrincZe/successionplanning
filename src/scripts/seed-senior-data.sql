-- Senior leadership mock data for succession planning demo
-- Officers, positions (PS/DS/CE), and successor mappings

BEGIN;

-- ── Officers ────────────────────────────────────────────────────────────────

INSERT INTO officers (officer_id, name, mx_equivalent_grade, grade, date_of_birth, service_scheme) VALUES
  -- Incumbents — PS level (MX2, grade JR1)
  ('OFF010', 'Lim Chee Wee',      'MX2', 'JR1', '1968-03-15', 'PSL'),
  ('OFF011', 'Tan Kok Peng',      'MX2', 'JR1', '1970-07-22', 'PSL'),
  ('OFF014', 'Ng Bee Lian',       'MX2', 'JR1', '1964-01-20', 'PSL'),
  ('OFF017', 'Goh Wei Ming',      'MX2', 'JR1', '1966-08-14', 'PSL'),
  -- Incumbents — DS level (MX3, grade JR3)
  ('OFF012', 'Chua Mei Ling',     'MX3', 'JR3', '1972-11-05', 'PSL'),
  ('OFF013', 'Wong Chun Kiat',    'MX3', 'JR3', '1969-04-18', 'PSL'),
  -- Incumbents — CE level (MX3, grade JR3)
  ('OFF015', 'Ahmad Bin Ismail',  'MX3', 'JR3', '1971-09-12', 'PSL'),
  ('OFF016', 'Rajaratnam Siva',   'MX3', 'JR3', '1973-06-30', 'PSL'),
  -- Potential successors — 0-4 year horizon (MX3-MX4)
  ('OFF018', 'Chong Shu Yi',      'MX4', 'JR4', '1975-03-22', 'PSL'),
  ('OFF019', 'Teo Kian Huat',     'MX4', 'JR4', '1974-12-08', 'PSL'),
  ('OFF020', 'Aisha Binte Yusof', 'MX4', 'JR4', '1976-05-14', 'PSL'),
  ('OFF021', 'Ravi Chandran',     'MX3', 'JR3', '1971-02-28', 'PSL'),
  ('OFF022', 'Stephanie Koh',     'MX4', 'JR4', '1977-10-03', 'PSL'),
  -- Longer-term successors — 4-10 year horizon (MX5-MX6)
  ('OFF023', 'Daniel Ong',        'MX5', 'JR5', '1980-04-17', 'PSL'),
  ('OFF024', 'Nurul Huda',        'MX5', 'JR5', '1982-08-25', 'PSL'),
  ('OFF025', 'Kevin Lam',         'MX5', 'JR5', '1981-01-09', 'PSL'),
  ('OFF026', 'Grace Tay',         'MX6', 'JR6', '1983-11-30', 'PSL'),
  ('OFF027', 'Marcus Lee',        'MX5', 'JR5', '1979-06-21', 'PSL')
ON CONFLICT (officer_id) DO UPDATE SET
  name = EXCLUDED.name,
  mx_equivalent_grade = EXCLUDED.mx_equivalent_grade,
  grade = EXCLUDED.grade,
  date_of_birth = EXCLUDED.date_of_birth,
  service_scheme = EXCLUDED.service_scheme,
  updated_at = now();

-- ── Positions ───────────────────────────────────────────────────────────────

INSERT INTO positions (position_id, position_title, agency, jr_grade, incumbent_id, incumbent_start_date) VALUES
  -- Permanent Secretaries
  ('POS010', 'Permanent Secretary',           'MLAW', 'JR1', 'OFF010', '2020-04-01'),
  ('POS011', 'Permanent Secretary',           'SLA',  'JR2', 'OFF010', '2022-07-01'),  -- double-hat with MLAW
  ('POS012', 'Permanent Secretary',           'MOF',  'JR1', 'OFF011', '2021-01-15'),
  ('POS015', 'Permanent Secretary',           'MSF',  'JR1', 'OFF014', '2015-03-01'),  -- long tenure
  ('POS019', 'Permanent Secretary',           'MOH',  'JR1', 'OFF017', '2016-06-01'),  -- long tenure + near retirement
  -- Deputy Secretaries
  ('POS013', 'Deputy Secretary (Policy)',     'MOE',  'JR3', 'OFF012', '2022-01-01'),
  ('POS014', 'Deputy Secretary (Development)','MHA',  'JR3', 'OFF013', '2019-08-15'),
  ('POS018', 'Deputy Secretary (Trade)',      'MTI',  'JR3', NULL,     NULL),           -- VACANT
  -- Chief Executives
  ('POS016', 'Chief Executive',              'HDB',  'JR3', 'OFF015', '2021-10-01'),
  ('POS017', 'Chief Executive',              'EDB',  'JR3', 'OFF016', '2023-03-01')
ON CONFLICT (position_id) DO UPDATE SET
  position_title = EXCLUDED.position_title,
  agency = EXCLUDED.agency,
  jr_grade = EXCLUDED.jr_grade,
  incumbent_id = EXCLUDED.incumbent_id,
  incumbent_start_date = EXCLUDED.incumbent_start_date,
  updated_at = now();

-- ── Position Successors ─────────────────────────────────────────────────────

INSERT INTO position_successors (position_id, successor_id, succession_type) VALUES
  -- POS010 — PS MLAW: healthy pipeline
  ('POS010', 'OFF018', '0-4_years'),
  ('POS010', 'OFF019', '0-4_years'),
  ('POS010', 'OFF023', '4-10_years'),
  ('POS010', 'OFF024', '4-10_years'),
  -- POS011 — PS SLA (double-hat): shares some successors
  ('POS011', 'OFF018', '0-4_years'),
  ('POS011', 'OFF022', '0-4_years'),
  ('POS011', 'OFF027', '4-10_years'),
  -- POS012 — PS MOF: thin pipeline (1 short-term → triggers C1)
  ('POS012', 'OFF021', '0-4_years'),
  ('POS012', 'OFF025', '4-10_years'),
  -- POS015 — PS MSF: thin + incumbent 62yo (C1 + C2)
  ('POS015', 'OFF018', '0-4_years'),
  ('POS015', 'OFF024', '4-10_years'),
  -- POS019 — PS MOH: near retirement + long tenure (C2 + C3)
  ('POS019', 'OFF019', '0-4_years'),
  ('POS019', 'OFF020', '0-4_years'),
  ('POS019', 'OFF024', '4-10_years'),
  ('POS019', 'OFF027', '4-10_years'),
  -- POS013 — DS MOE: healthy
  ('POS013', 'OFF020', '0-4_years'),
  ('POS013', 'OFF022', '0-4_years'),
  ('POS013', 'OFF024', '4-10_years'),
  ('POS013', 'OFF026', '4-10_years'),
  -- POS014 — DS MHA: healthy
  ('POS014', 'OFF019', '0-4_years'),
  ('POS014', 'OFF021', '0-4_years'),
  ('POS014', 'OFF023', '4-10_years'),
  ('POS014', 'OFF025', '4-10_years'),
  -- POS016 — CE HDB: healthy
  ('POS016', 'OFF020', '0-4_years'),
  ('POS016', 'OFF022', '0-4_years'),
  ('POS016', 'OFF025', '4-10_years'),
  ('POS016', 'OFF026', '4-10_years'),
  -- POS017 — CE EDB: reasonable
  ('POS017', 'OFF018', '0-4_years'),
  ('POS017', 'OFF021', '0-4_years'),
  ('POS017', 'OFF023', '4-10_years'),
  -- POS018 — DS MTI: VACANT + thin (C4 + C1)
  ('POS018', 'OFF022', '0-4_years'),
  ('POS018', 'OFF026', '4-10_years')
ON CONFLICT (position_id, successor_id, succession_type) DO NOTHING;

COMMIT;
