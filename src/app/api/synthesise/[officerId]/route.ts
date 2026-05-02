import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
    const id = params.officerId

    // Fetch officer and remarks in parallel
    const [officerRes, remarksRes] = await Promise.all([
      supabaseServer
        .from('officers')
        .select('name, grade, mx_equivalent_grade, ihrp_certification, hrlp')
        .eq('officer_id', id)
        .single(),
      supabaseServer
        .from('officer_remarks')
        .select('remark_date, place, details')
        .eq('officer_id', id)
        .order('remark_date', { ascending: true }),
    ])

    if (officerRes.error || !officerRes.data) {
      return NextResponse.json({ error: 'Officer not found' }, { status: 404 })
    }
    if (remarksRes.error || !remarksRes.data || remarksRes.data.length === 0) {
      return NextResponse.json({ error: 'No remarks to synthesise' }, { status: 400 })
    }

    const officer = officerRes.data
    const remarks = remarksRes.data

    const remarkLines = remarks.map((r: any) =>
      `[${r.remark_date} | ${r.place}] ${r.details}`
    ).join('\n')

    const prompt = `You are an HR succession planning advisor. Based on the officer profile and management remarks below, provide a concise structured assessment.

Officer: ${officer.name} | Grade: ${officer.grade ?? 'N/A'} | IHRP: ${officer.ihrp_certification ?? 'None'} | HRLP: ${officer.hrlp ?? 'Not Started'}

REMARKS:
${remarkLines}

Respond in this exact format:

## Summary
[2 paragraphs: key themes, strengths, and development areas from the remarks.]

## Career Trajectory
[2–3 specific next role suggestions with rationale and timeframe.]

## Key Observations
[3–5 bullet points for succession planning.]`

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text()
      throw new Error(`Anthropic API error ${anthropicRes.status}: ${errBody}`)
    }

    const anthropicData = await anthropicRes.json()
    const text: string = anthropicData.content?.[0]?.text ?? ''
    const generated_at = new Date().toISOString()

    // Save to DB (non-blocking — don't let a save failure kill the response)
    supabaseServer
      .from('officer_synthesis')
      .upsert({ officer_id: id, synthesis: text, generated_at }, { onConflict: 'officer_id' })
      .then(() => {})
      .catch((e: any) => console.error('Synthesis save error:', e?.message))

    return NextResponse.json({ synthesis: text, generated_at })
  } catch (error: any) {
    console.error('Synthesise error:', error?.message ?? error)
    return NextResponse.json(
      { error: error?.message || 'AI synthesis failed' },
      { status: 500 }
    )
  }
}
