-- Replace OFFxxx IDs with NRIC-format IDs that correlate to date of birth
-- NRIC format: S + YY (birth year) + 5 digits + checksum letter

BEGIN;

-- 1. Remove old successor mappings for these positions
DELETE FROM position_successors WHERE position_id IN
  ('POS010','POS011','POS012','POS013','POS014','POS015','POS016','POS017','POS018','POS019');

-- 2. Remove old positions
DELETE FROM positions WHERE position_id IN
  ('POS010','POS011','POS012','POS013','POS014','POS015','POS016','POS017','POS018','POS019');

-- 3. Remove old OFFxxx officers
DELETE FROM officers WHERE officer_id IN
  ('OFF010','OFF011','OFF012','OFF013','OFF014','OFF015','OFF016','OFF017','OFF018','OFF019',
   'OFF020','OFF021','OFF022','OFF023','OFF024','OFF025','OFF026','OFF027');

-- 4. Insert officers with NRIC IDs (SYY = birth year)
INSERT INTO officers (officer_id, name, mx_equivalent_grade, grade, date_of_birth, service_scheme) VALUES
  -- Incumbents — PS level (MX2, JR1)
  ('S6831520A', 'Lim Chee Wee',      'MX2', 'JR1', '1968-03-15', 'PSL'),   -- 58yo
  ('S7072241B', 'Tan Kok Peng',      'MX2', 'JR1', '1970-07-22', 'PSL'),   -- 56yo
  ('S6412083C', 'Ng Bee Lian',       'MX2', 'JR1', '1964-01-20', 'PSL'),   -- 62yo (retirement trigger)
  ('S6681430D', 'Goh Wei Ming',      'MX2', 'JR1', '1966-08-14', 'PSL'),   -- 60yo (retirement trigger)
  -- Incumbents — DS level (MX3, JR3)
  ('S7211054E', 'Chua Mei Ling',     'MX3', 'JR3', '1972-11-05', 'PSL'),   -- 54yo
  ('S6941827F', 'Wong Chun Kiat',    'MX3', 'JR3', '1969-04-18', 'PSL'),   -- 57yo
  -- Incumbents — CE level (MX3, JR3)
  ('S7191254G', 'Ahmad Bin Ismail',  'MX3', 'JR3', '1971-09-12', 'PSL'),   -- 55yo
  ('S7363012H', 'Rajaratnam Siva',   'MX3', 'JR3', '1973-06-30', 'PSL'),   -- 53yo
  -- Successors — 0-4 year horizon (MX3-MX4)
  ('S7532286J', 'Chong Shu Yi',      'MX4', 'JR4', '1975-03-22', 'PSL'),   -- 51yo
  ('S7412087K', 'Teo Kian Huat',     'MX4', 'JR4', '1974-12-08', 'PSL'),   -- 52yo
  ('S7651471L', 'Aisha Binte Yusof', 'MX4', 'JR4', '1976-05-14', 'PSL'),   -- 50yo
  ('S7122815A', 'Ravi Chandran',     'MX3', 'JR3', '1971-02-28', 'PSL'),   -- 55yo
  ('S7710035B', 'Stephanie Koh',     'MX4', 'JR4', '1977-10-03', 'PSL'),   -- 49yo
  -- Successors — 4-10 year horizon (MX5-MX6)
  ('S8041762C', 'Daniel Ong',        'MX5', 'JR5', '1980-04-17', 'PSL'),   -- 46yo
  ('S8282547D', 'Nurul Huda',        'MX5', 'JR5', '1982-08-25', 'PSL'),   -- 44yo
  ('S8110972E', 'Kevin Lam',         'MX5', 'JR5', '1981-01-09', 'PSL'),   -- 45yo
  ('S8311302F', 'Grace Tay',         'MX6', 'JR6', '1983-11-30', 'PSL'),   -- 43yo
  ('S7962153G', 'Marcus Lee',        'MX5', 'JR5', '1979-06-21', 'PSL')    -- 47yo
ON CONFLICT (officer_id) DO UPDATE SET
  name = EXCLUDED.name,
  mx_equivalent_grade = EXCLUDED.mx_equivalent_grade,
  grade = EXCLUDED.grade,
  date_of_birth = EXCLUDED.date_of_birth,
  service_scheme = EXCLUDED.service_scheme,
  updated_at = now();

-- 5. Insert positions with NRIC incumbent references
INSERT INTO positions (position_id, position_title, agency, jr_grade, incumbent_id, incumbent_start_date) VALUES
  ('POS010', 'Permanent Secretary',            'MLAW', 'JR1', 'S6831520A', '2020-04-01'),
  ('POS011', 'Permanent Secretary',            'SLA',  'JR2', 'S6831520A', '2022-07-01'),  -- double-hat
  ('POS012', 'Permanent Secretary',            'MOF',  'JR1', 'S7072241B', '2021-01-15'),
  ('POS015', 'Permanent Secretary',            'MSF',  'JR1', 'S6412083C', '2015-03-01'),  -- long tenure
  ('POS019', 'Permanent Secretary',            'MOH',  'JR1', 'S6681430D', '2016-06-01'),  -- long tenure + near retirement
  ('POS013', 'Deputy Secretary (Policy)',      'MOE',  'JR3', 'S7211054E', '2022-01-01'),
  ('POS014', 'Deputy Secretary (Development)', 'MHA',  'JR3', 'S6941827F', '2019-08-15'),
  ('POS018', 'Deputy Secretary (Trade)',       'MTI',  'JR3', NULL,        NULL),           -- VACANT
  ('POS016', 'Chief Executive',                'HDB',  'JR3', 'S7191254G', '2021-10-01'),
  ('POS017', 'Chief Executive',                'EDB',  'JR3', 'S7363012H', '2023-03-01')
ON CONFLICT (position_id) DO UPDATE SET
  position_title = EXCLUDED.position_title,
  agency = EXCLUDED.agency,
  jr_grade = EXCLUDED.jr_grade,
  incumbent_id = EXCLUDED.incumbent_id,
  incumbent_start_date = EXCLUDED.incumbent_start_date,
  updated_at = now();

-- 6. Insert successor mappings
INSERT INTO position_successors (position_id, successor_id, succession_type) VALUES
  -- POS010 — PS MLAW: healthy
  ('POS010', 'S7532286J', '0-4_years'),
  ('POS010', 'S7412087K', '0-4_years'),
  ('POS010', 'S8041762C', '4-10_years'),
  ('POS010', 'S8282547D', '4-10_years'),
  -- POS011 — PS SLA (double-hat)
  ('POS011', 'S7532286J', '0-4_years'),
  ('POS011', 'S7710035B', '0-4_years'),
  ('POS011', 'S7962153G', '4-10_years'),
  -- POS012 — PS MOF: thin (C1)
  ('POS012', 'S7122815A', '0-4_years'),
  ('POS012', 'S8110972E', '4-10_years'),
  -- POS015 — PS MSF: thin + age 62 (C1 + C2)
  ('POS015', 'S7532286J', '0-4_years'),
  ('POS015', 'S8282547D', '4-10_years'),
  -- POS019 — PS MOH: age 60 + long tenure (C2 + C3)
  ('POS019', 'S7412087K', '0-4_years'),
  ('POS019', 'S7651471L', '0-4_years'),
  ('POS019', 'S8282547D', '4-10_years'),
  ('POS019', 'S7962153G', '4-10_years'),
  -- POS013 — DS MOE: healthy
  ('POS013', 'S7651471L', '0-4_years'),
  ('POS013', 'S7710035B', '0-4_years'),
  ('POS013', 'S8282547D', '4-10_years'),
  ('POS013', 'S8311302F', '4-10_years'),
  -- POS014 — DS MHA: healthy
  ('POS014', 'S7412087K', '0-4_years'),
  ('POS014', 'S7122815A', '0-4_years'),
  ('POS014', 'S8041762C', '4-10_years'),
  ('POS014', 'S8110972E', '4-10_years'),
  -- POS016 — CE HDB: healthy
  ('POS016', 'S7651471L', '0-4_years'),
  ('POS016', 'S7710035B', '0-4_years'),
  ('POS016', 'S8110972E', '4-10_years'),
  ('POS016', 'S8311302F', '4-10_years'),
  -- POS017 — CE EDB: reasonable
  ('POS017', 'S7532286J', '0-4_years'),
  ('POS017', 'S7122815A', '0-4_years'),
  ('POS017', 'S8041762C', '4-10_years'),
  -- POS018 — DS MTI: VACANT + thin (C4 + C1)
  ('POS018', 'S7710035B', '0-4_years'),
  ('POS018', 'S8311302F', '4-10_years')
ON CONFLICT (position_id, successor_id, succession_type) DO NOTHING;

COMMIT;
