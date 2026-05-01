import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params

  // Fetch officer profile
  const { data: officer, error: officerError } = await supabaseServer
    .from('officers')
    .select(`
      *,
      competencies:officer_competencies(
        achieved_pl_level,
        competency:hr_competencies(competency_name)
      ),
      stints:officer_stints(
        completion_year,
        stint:ooa_stints(stint_name, stint_type)
      )
    `)
    .eq('officer_id', id)
    .single()

  if (officerError || !officer) {
    return Response.json({ error: 'Officer not found' }, { status: 404 })
  }

  // Fetch all remarks
  const { data: remarks, error: remarksError } = await supabaseServer
    .from('officer_remarks')
    .select('*')
    .eq('officer_id', id)
    .order('remark_date', { ascending: true })

  if (remarksError) {
    return Response.json({ error: 'Failed to fetch remarks' }, { status: 500 })
  }

  if (!remarks || remarks.length === 0) {
    return Response.json({ error: 'No remarks to synthesise' }, { status: 400 })
  }

  // Build officer context
  const competencyLines = officer.competencies?.map((c: any) =>
    `  - ${c.competency?.competency_name}: PL${c.achieved_pl_level}`
  ).join('\n') || '  None recorded'

  const stintLines = officer.stints?.map((s: any) =>
    `  - ${s.stint?.stint_name} (${s.stint?.stint_type}), completed ${s.completion_year}`
  ).join('\n') || '  None recorded'

  const remarkLines = remarks.map((r: any) =>
    `[${r.remark_date} | ${r.place}]\n${r.details}`
  ).join('\n\n')

  const prompt = `You are an HR succession planning advisor for a government HR department. Analyse the following officer profile and management remarks, then provide a structured assessment.

OFFICER PROFILE
Name: ${officer.name}
Grade: ${officer.grade ?? 'Not specified'}
MX Equivalent Grade: ${officer.mx_equivalent_grade ?? 'Not specified'}
IHRP Certification: ${officer.ihrp_certification ?? 'None'}
HRLP Status: ${officer.hrlp ?? 'Not Started'}

COMPETENCIES ACHIEVED
${competencyLines}

OOA STINTS COMPLETED
${stintLines}

MANAGEMENT REMARKS (${remarks.length} entries, chronological order)
${remarkLines}

---

Provide your response in exactly this format:

## Summary
[2–3 paragraph synthesis of all remarks. Identify recurring themes, notable strengths, areas for development, and any consistent observations across different meetings and occasions.]

## Career Trajectory
[Based on the officer's profile, competencies, stints, and the pattern of remarks, suggest 2–3 specific career development recommendations. For each, state the suggested next role or posting type, the rationale, and the expected timeframe.]

## Key Observations
[3–5 bullet points highlighting the most critical insights for succession planning purposes.]`

  try {
    const { text } = await generateText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      prompt,
      maxTokens: 1024,
    })

    return Response.json({ synthesis: text })
  } catch (error: any) {
    console.error('Claude API error:', error)
    return Response.json({ error: 'AI synthesis failed. Check ANTHROPIC_API_KEY.' }, { status: 500 })
  }
}
