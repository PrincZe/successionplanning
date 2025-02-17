import { config } from 'dotenv'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/types/supabase'

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') })

// Create a Supabase client with the service role key for seeding
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function seedDatabase() {
  try {
    console.log('Starting database seeding...')
    console.log('Using URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    // Insert officers
    console.log('Inserting officers...')
    const { data: officers, error: officersError } = await supabase
      .from('officers')
      .insert([
        { 
          officer_id: 'OFF001',
          name: 'Sarah Tan',
          mx_equivalent_grade: 'MX9',
          grade: 'JR8',
          ihrp_certification: 'IHRP-MP',
          hrlp: 'Completed'
        },
        {
          officer_id: 'OFF002',
          name: 'James Lim',
          mx_equivalent_grade: 'MX8',
          grade: 'JR7',
          ihrp_certification: 'IHRP-SP',
          hrlp: 'In Progress'
        },
        {
          officer_id: 'OFF003',
          name: 'Priya Kumar',
          mx_equivalent_grade: 'MX8',
          grade: 'JR7',
          ihrp_certification: 'IHRP-SP',
          hrlp: 'Completed'
        }
      ])
      .select()

    if (officersError) {
      console.error('Error inserting officers:', officersError)
      throw officersError
    }
    console.log('Officers seeded successfully:', officers)

    // Insert positions
    console.log('Inserting positions...')
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .insert([
        { 
          position_id: 'POS001',
          position_title: 'Director(HC)',
          agency: 'PSD',
          jr_grade: 'JR8',
          incumbent_id: 'OFF001'
        },
        {
          position_id: 'POS002',
          position_title: 'Senior HR Business Partner',
          agency: 'MOE',
          jr_grade: 'JR7',
          incumbent_id: 'OFF002'
        },
        {
          position_id: 'POS003',
          position_title: 'HR Analytics Lead',
          agency: 'MHA',
          jr_grade: 'JR7',
          incumbent_id: 'OFF003'
        }
      ])
      .select()

    if (positionsError) {
      console.error('Error inserting positions:', positionsError)
      throw positionsError
    }
    console.log('Positions seeded successfully:', positions)

    // Insert position successors
    console.log('Inserting position successors...')
    const { error: successorsError } = await supabase
      .from('position_successors')
      .insert([
        { 
          position_id: 'POS001', 
          successor_id: 'OFF002', 
          succession_type: 'immediate'
        },
        { 
          position_id: 'POS001', 
          successor_id: 'OFF003', 
          succession_type: 'immediate'
        }
      ])

    if (successorsError) {
      console.error('Error inserting position successors:', successorsError)
      throw successorsError
    }
    console.log('Position successors seeded successfully')

    // Insert HR competencies
    console.log('Inserting HR competencies...')
    const { data: competencies, error: competenciesError } = await supabase
      .from('hr_competencies')
      .insert([
        {
          competency_name: 'HR Business Partnership',
          description: 'Ability to partner with business units effectively',
          max_pl_level: 5
        },
        {
          competency_name: 'Data Analytics',
          description: 'Proficiency in HR analytics and data-driven decision making',
          max_pl_level: 5
        },
        {
          competency_name: 'Change Management',
          description: 'Skills in managing organizational change',
          max_pl_level: 5
        }
      ])
      .select()

    if (competenciesError) {
      console.error('Error inserting HR competencies:', competenciesError)
      throw competenciesError
    }
    console.log('HR competencies seeded successfully:', competencies)

    // Insert officer competencies
    console.log('Inserting officer competencies...')
    const { error: officerCompetenciesError } = await supabase
      .from('officer_competencies')
      .insert([
        {
          officer_id: 'OFF001',
          competency_id: competencies![0].competency_id,
          achieved_pl_level: 4,
          assessment_date: new Date().toISOString().split('T')[0]
        },
        {
          officer_id: 'OFF002',
          competency_id: competencies![1].competency_id,
          achieved_pl_level: 3,
          assessment_date: new Date().toISOString().split('T')[0]
        },
        {
          officer_id: 'OFF003',
          competency_id: competencies![2].competency_id,
          achieved_pl_level: 5,
          assessment_date: new Date().toISOString().split('T')[0]
        }
      ])

    if (officerCompetenciesError) {
      console.error('Error inserting officer competencies:', officerCompetenciesError)
      throw officerCompetenciesError
    }
    console.log('Officer competencies seeded successfully')

    // Insert OOA stints
    console.log('Inserting OOA stints...')
    const { data: stints, error: stintsError } = await supabase
      .from('ooa_stints')
      .insert([
        {
          stint_name: 'Private Sector Attachment',
          stint_type: 'External',
          year: 2024
        },
        {
          stint_name: 'Cross-Ministry Project',
          stint_type: 'Internal',
          year: 2024
        },
        {
          stint_name: 'Leadership Development Program',
          stint_type: 'Training',
          year: 2024
        }
      ])
      .select()

    if (stintsError) {
      console.error('Error inserting OOA stints:', stintsError)
      throw stintsError
    }
    console.log('OOA stints seeded successfully:', stints)

    // Insert officer stints
    console.log('Inserting officer stints...')
    const { error: officerStintsError } = await supabase
      .from('officer_stints')
      .insert([
        {
          officer_id: 'OFF001',
          stint_id: stints![0].stint_id,
          completion_year: 2024
        },
        {
          officer_id: 'OFF002',
          stint_id: stints![1].stint_id,
          completion_year: 2024
        },
        {
          officer_id: 'OFF003',
          stint_id: stints![2].stint_id,
          completion_year: 2024
        }
      ])

    if (officerStintsError) {
      console.error('Error inserting officer stints:', officerStintsError)
      throw officerStintsError
    }
    console.log('Officer stints seeded successfully')

    console.log('Database seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error
  }
}

// Run the seeding
seedDatabase().catch(console.error) 