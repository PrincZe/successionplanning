import { config } from 'dotenv'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/types/supabase'

config({ path: join(process.cwd(), '.env.local') })

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function seedSeniorData() {
  console.log('Seeding senior leadership data...')

  // ── Officers ──────────────────────────────────────────────────────────────

  const officers = [
    // Incumbents — PS level (MX2, grade JR1)
    { officer_id: 'OFF010', name: 'Lim Chee Wee', mx_equivalent_grade: 'MX2', grade: 'JR1', date_of_birth: '1968-03-15', service_scheme: 'PSL' },
    { officer_id: 'OFF011', name: 'Tan Kok Peng', mx_equivalent_grade: 'MX2', grade: 'JR1', date_of_birth: '1970-07-22', service_scheme: 'PSL' },
    { officer_id: 'OFF014', name: 'Ng Bee Lian', mx_equivalent_grade: 'MX2', grade: 'JR1', date_of_birth: '1964-01-20', service_scheme: 'PSL' },
    { officer_id: 'OFF017', name: 'Goh Wei Ming', mx_equivalent_grade: 'MX2', grade: 'JR1', date_of_birth: '1966-08-14', service_scheme: 'PSL' },

    // Incumbents — DS level (MX3, grade JR3)
    { officer_id: 'OFF012', name: 'Chua Mei Ling', mx_equivalent_grade: 'MX3', grade: 'JR3', date_of_birth: '1972-11-05', service_scheme: 'PSL' },
    { officer_id: 'OFF013', name: 'Wong Chun Kiat', mx_equivalent_grade: 'MX3', grade: 'JR3', date_of_birth: '1969-04-18', service_scheme: 'PSL' },

    // Incumbents — CE level (MX3, grade JR3)
    { officer_id: 'OFF015', name: 'Ahmad Bin Ismail', mx_equivalent_grade: 'MX3', grade: 'JR3', date_of_birth: '1971-09-12', service_scheme: 'PSL' },
    { officer_id: 'OFF016', name: 'Rajaratnam Siva', mx_equivalent_grade: 'MX3', grade: 'JR3', date_of_birth: '1973-06-30', service_scheme: 'PSL' },

    // Potential successors — 0-4 year horizon (MX4, grade JR4)
    { officer_id: 'OFF018', name: 'Chong Shu Yi', mx_equivalent_grade: 'MX4', grade: 'JR4', date_of_birth: '1975-03-22', service_scheme: 'PSL' },
    { officer_id: 'OFF019', name: 'Teo Kian Huat', mx_equivalent_grade: 'MX4', grade: 'JR4', date_of_birth: '1974-12-08', service_scheme: 'PSL' },
    { officer_id: 'OFF020', name: 'Aisha Binte Yusof', mx_equivalent_grade: 'MX4', grade: 'JR4', date_of_birth: '1976-05-14', service_scheme: 'PSL' },
    { officer_id: 'OFF021', name: 'Ravi Chandran', mx_equivalent_grade: 'MX3', grade: 'JR3', date_of_birth: '1971-02-28', service_scheme: 'PSL' },
    { officer_id: 'OFF022', name: 'Stephanie Koh', mx_equivalent_grade: 'MX4', grade: 'JR4', date_of_birth: '1977-10-03', service_scheme: 'PSL' },

    // Longer-term successors — 4-10 year horizon (MX5-MX6, grade JR5-JR6)
    { officer_id: 'OFF023', name: 'Daniel Ong', mx_equivalent_grade: 'MX5', grade: 'JR5', date_of_birth: '1980-04-17', service_scheme: 'PSL' },
    { officer_id: 'OFF024', name: 'Nurul Huda', mx_equivalent_grade: 'MX5', grade: 'JR5', date_of_birth: '1982-08-25', service_scheme: 'PSL' },
    { officer_id: 'OFF025', name: 'Kevin Lam', mx_equivalent_grade: 'MX5', grade: 'JR5', date_of_birth: '1981-01-09', service_scheme: 'PSL' },
    { officer_id: 'OFF026', name: 'Grace Tay', mx_equivalent_grade: 'MX6', grade: 'JR6', date_of_birth: '1983-11-30', service_scheme: 'PSL' },
    { officer_id: 'OFF027', name: 'Marcus Lee', mx_equivalent_grade: 'MX5', grade: 'JR5', date_of_birth: '1979-06-21', service_scheme: 'PSL' },
  ]

  console.log(`Inserting ${officers.length} officers...`)
  const { error: offErr } = await supabase.from('officers').upsert(officers, { onConflict: 'officer_id' })
  if (offErr) throw offErr
  console.log('Officers OK')

  // ── Positions ─────────────────────────────────────────────────────────────

  const positions = [
    // Permanent Secretaries (JR1)
    { position_id: 'POS010', position_title: 'Permanent Secretary', agency: 'MLAW', jr_grade: 'JR1', incumbent_id: 'OFF010', incumbent_start_date: '2020-04-01' },
    { position_id: 'POS011', position_title: 'Permanent Secretary', agency: 'SLA', jr_grade: 'JR2', incumbent_id: 'OFF010', incumbent_start_date: '2022-07-01' }, // double-hat
    { position_id: 'POS012', position_title: 'Permanent Secretary', agency: 'MOF', jr_grade: 'JR1', incumbent_id: 'OFF011', incumbent_start_date: '2021-01-15' },
    { position_id: 'POS015', position_title: 'Permanent Secretary', agency: 'MSF', jr_grade: 'JR1', incumbent_id: 'OFF014', incumbent_start_date: '2015-03-01' }, // long tenure
    { position_id: 'POS019', position_title: 'Permanent Secretary', agency: 'MOH', jr_grade: 'JR1', incumbent_id: 'OFF017', incumbent_start_date: '2016-06-01' }, // long tenure + near retirement

    // Deputy Secretaries (JR3)
    { position_id: 'POS013', position_title: 'Deputy Secretary (Policy)', agency: 'MOE', jr_grade: 'JR3', incumbent_id: 'OFF012', incumbent_start_date: '2022-01-01' },
    { position_id: 'POS014', position_title: 'Deputy Secretary (Development)', agency: 'MHA', jr_grade: 'JR3', incumbent_id: 'OFF013', incumbent_start_date: '2019-08-15' },
    { position_id: 'POS018', position_title: 'Deputy Secretary (Trade)', agency: 'MTI', jr_grade: 'JR3', incumbent_id: null, incumbent_start_date: null }, // VACANT

    // Chief Executives (JR3)
    { position_id: 'POS016', position_title: 'Chief Executive', agency: 'HDB', jr_grade: 'JR3', incumbent_id: 'OFF015', incumbent_start_date: '2021-10-01' },
    { position_id: 'POS017', position_title: 'Chief Executive', agency: 'EDB', jr_grade: 'JR3', incumbent_id: 'OFF016', incumbent_start_date: '2023-03-01' },
  ]

  console.log(`Inserting ${positions.length} positions...`)
  const { error: posErr } = await supabase.from('positions').upsert(positions, { onConflict: 'position_id' })
  if (posErr) throw posErr
  console.log('Positions OK')

  // ── Position Successors ───────────────────────────────────────────────────

  const successors = [
    // POS010 — PS MLAW: healthy pipeline (2 short-term, 2 long-term)
    { position_id: 'POS010', successor_id: 'OFF018', succession_type: '0-4_years' },
    { position_id: 'POS010', successor_id: 'OFF019', succession_type: '0-4_years' },
    { position_id: 'POS010', successor_id: 'OFF023', succession_type: '4-10_years' },
    { position_id: 'POS010', successor_id: 'OFF024', succession_type: '4-10_years' },

    // POS011 — PS SLA (double-hat): shares some successors with MLAW
    { position_id: 'POS011', successor_id: 'OFF018', succession_type: '0-4_years' },
    { position_id: 'POS011', successor_id: 'OFF022', succession_type: '0-4_years' },
    { position_id: 'POS011', successor_id: 'OFF027', succession_type: '4-10_years' },

    // POS012 — PS MOF: thin pipeline (only 1 short-term → triggers C1)
    { position_id: 'POS012', successor_id: 'OFF021', succession_type: '0-4_years' },
    { position_id: 'POS012', successor_id: 'OFF025', succession_type: '4-10_years' },

    // POS015 — PS MSF: thin pipeline + incumbent 62yo (triggers C1 + C2)
    { position_id: 'POS015', successor_id: 'OFF018', succession_type: '0-4_years' },
    { position_id: 'POS015', successor_id: 'OFF024', succession_type: '4-10_years' },

    // POS019 — PS MOH: incumbent near retirement + long tenure (triggers C2 + C3)
    { position_id: 'POS019', successor_id: 'OFF019', succession_type: '0-4_years' },
    { position_id: 'POS019', successor_id: 'OFF020', succession_type: '0-4_years' },
    { position_id: 'POS019', successor_id: 'OFF024', succession_type: '4-10_years' },
    { position_id: 'POS019', successor_id: 'OFF027', succession_type: '4-10_years' },

    // POS013 — DS MOE: healthy
    { position_id: 'POS013', successor_id: 'OFF020', succession_type: '0-4_years' },
    { position_id: 'POS013', successor_id: 'OFF022', succession_type: '0-4_years' },
    { position_id: 'POS013', successor_id: 'OFF024', succession_type: '4-10_years' },
    { position_id: 'POS013', successor_id: 'OFF026', succession_type: '4-10_years' },

    // POS014 — DS MHA: incumbent approaching retirement (DOB 1969 → 57yo, close)
    { position_id: 'POS014', successor_id: 'OFF019', succession_type: '0-4_years' },
    { position_id: 'POS014', successor_id: 'OFF021', succession_type: '0-4_years' },
    { position_id: 'POS014', successor_id: 'OFF023', succession_type: '4-10_years' },
    { position_id: 'POS014', successor_id: 'OFF025', succession_type: '4-10_years' },

    // POS016 — CE HDB: healthy
    { position_id: 'POS016', successor_id: 'OFF020', succession_type: '0-4_years' },
    { position_id: 'POS016', successor_id: 'OFF022', succession_type: '0-4_years' },
    { position_id: 'POS016', successor_id: 'OFF025', succession_type: '4-10_years' },
    { position_id: 'POS016', successor_id: 'OFF026', succession_type: '4-10_years' },

    // POS017 — CE EDB: reasonable
    { position_id: 'POS017', successor_id: 'OFF018', succession_type: '0-4_years' },
    { position_id: 'POS017', successor_id: 'OFF021', succession_type: '0-4_years' },
    { position_id: 'POS017', successor_id: 'OFF023', succession_type: '4-10_years' },

    // POS018 — DS MTI: VACANT + thin pipeline (triggers C4 + C1)
    { position_id: 'POS018', successor_id: 'OFF022', succession_type: '0-4_years' },
    { position_id: 'POS018', successor_id: 'OFF026', succession_type: '4-10_years' },
  ]

  console.log(`Inserting ${successors.length} successor mappings...`)
  const { error: sucErr } = await supabase
    .from('position_successors')
    .upsert(successors, { onConflict: 'position_id,successor_id,succession_type' })
  if (sucErr) throw sucErr
  console.log('Successors OK')

  console.log('\nSenior leadership seed data complete!')
  console.log('Summary:')
  console.log(`  ${officers.length} officers (8 incumbents + 10 successor pool)`)
  console.log(`  ${positions.length} positions (5 PS, 3 DS, 2 CE)`)
  console.log(`  ${successors.length} successor mappings`)
  console.log('\nExpected pipeline health triggers:')
  console.log('  POS012 (PS MOF)  — C1: only 1 short-term successor')
  console.log('  POS015 (PS MSF)  — C1: only 1 short-term + C2: incumbent age 62')
  console.log('  POS019 (PS MOH)  — C2: incumbent age 60 + C3: tenure ~10 years')
  console.log('  POS018 (DS MTI)  — C1: only 1 short-term + C4: vacant')
  console.log('  POS010/POS011    — double-hat: OFF010 is PS for both MLAW & SLA')
}

seedSeniorData().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
