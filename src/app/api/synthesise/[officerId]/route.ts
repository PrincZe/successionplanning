import { NextRequest, NextResponse } from 'next/server'
import { getOfficerById } from '@/lib/queries/officers'
import { getOfficerRemarks } from '@/lib/queries/remarks'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { officerId: string } }
) {
  const { data } = await supabaseServer
    .from('officer_synthesis')
    .select('synthesis, generated_at')
    .eq('officer_id', params.officerId)
    .single()

  return NextResponse.json(data ?? null)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { officerId: string } }
) {
  try {
    const officer = await getOfficerById(params.officerId)
    if (!officer) {
      return NextResponse.json({ error: 'Officer not found' }, { status: 404 })
    }

    const remarks = await getOfficerRemarks(params.officerId)
    if (!remarks || remarks.length === 0) {
      return NextResponse.json({ error: 'No remarks to synthesise' }, { status: 400 })
    }

    // Build context
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

    // Dynamic import so module-level failures don't break GET
    const { generateText } = await import('ai')
    const { anthropic } = await import('@ai-sdk/anthropic')

    const { text } = await generateText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      prompt,
      maxTokens: 1200,
    })

    const generated_at = new Date().toISOString()

    await supabaseServer
      .from('officer_synthesis')
      .upsert(
        { officer_id: params.officerId, synthesis: text, generated_at },
        { onConflict: 'officer_id' }
      )

    return NextResponse.json({ synthesis: text, generated_at })
  } catch (error: any) {
    console.error('Synthesise error:', error?.message ?? error)
    return NextResponse.json(
      { error: error?.message || 'AI synthesis failed' },
      { status: 500 }
    )
  }
}
