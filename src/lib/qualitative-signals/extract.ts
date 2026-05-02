import { supabaseServer } from '@/lib/supabase'

export type SentimentTrajectory = 'improving' | 'stable' | 'declining' | 'unknown'

export type QualitativeSignal = {
  type: 'endorsement' | 'concern' | 'domain_strength' | 'development_need'
  summary: string
  evidence_remark_id: number | null
  endorser_seniority?: 'perm_sec_or_chro' | 'director' | 'manager' | 'peer' | 'unspecified'
}

export type QualitativeSignals = {
  endorsement_count: number
  endorsement_specificity_score: number
  endorsement_seniority_score: number
  domain_match_keywords: string[]
  concerns_count: number
  sentiment_trajectory: SentimentTrajectory
  qualitative_score: number
  signals: QualitativeSignal[]
}

const EXTRACT_TOOL = {
  name: 'record_qualitative_signals',
  description:
    'Record structured qualitative signals extracted from an officer profile and their forum/management remarks. Use this for every officer.',
  input_schema: {
    type: 'object',
    properties: {
      endorsement_count: {
        type: 'integer',
        minimum: 0,
        description:
          'Count of distinct positive endorsements within the lookback window. A vague approval ("good guy") still counts but contributes less to specificity.',
      },
      endorsement_specificity_score: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description:
          'How specific endorsements are. Vague praise ("not too bad") => low. Concrete claims naming a project, domain, or behaviour ("led the WOG analytics framework review across 10 agencies") => high.',
      },
      endorsement_seniority_score: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description:
          'Weighted score for the seniority of endorsers mentioned in the remark text. Perm Sec / CHRO / DS endorsements => high. Director-level => medium. Peer / unspecified => low. If no endorser is named, assume the remark itself is from a senior committee and score moderate.',
      },
      domain_match_keywords: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Lowercase keywords/phrases naming domains or strengths the officer is endorsed for (e.g., "workforce planning", "hr analytics", "stakeholder management", "change management"). Used downstream to match against position requirements.',
      },
      concerns_count: {
        type: 'integer',
        minimum: 0,
        description:
          'Count of cautious, negative, or development-flagging remarks ("needs more exposure", "rough around the edges", "not yet ready").',
      },
      sentiment_trajectory: {
        type: 'string',
        enum: ['improving', 'stable', 'declining', 'unknown'],
        description:
          'Overall direction across remarks ordered by date. "unknown" if fewer than 2 remarks or no clear trend.',
      },
      qualitative_score: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description:
          'Blended composite. Rough rubric: weight specificity (35%), seniority (30%), endorsement_count saturating at 5 (20%), penalize concerns (-10 each, floor 0), trajectory adjustment (+5 improving, -5 declining). Round to integer.',
      },
      signals: {
        type: 'array',
        description:
          'Per-remark structured findings. Include 1-2 entries per remark; skip if a remark contains no signal.',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['endorsement', 'concern', 'domain_strength', 'development_need'],
            },
            summary: {
              type: 'string',
              description: 'One short sentence (<= 25 words) capturing the signal.',
            },
            evidence_remark_id: {
              type: ['integer', 'null'],
              description: 'remark_id of the source remark, or null if synthesised across multiple.',
            },
            endorser_seniority: {
              type: 'string',
              enum: ['perm_sec_or_chro', 'director', 'manager', 'peer', 'unspecified'],
            },
          },
          required: ['type', 'summary', 'evidence_remark_id'],
        },
      },
    },
    required: [
      'endorsement_count',
      'endorsement_specificity_score',
      'endorsement_seniority_score',
      'domain_match_keywords',
      'concerns_count',
      'sentiment_trajectory',
      'qualitative_score',
      'signals',
    ],
  },
}

type Officer = {
  officer_id: string
  name: string
  grade: string | null
  mx_equivalent_grade: string | null
  ihrp_certification: string | null
  hrlp: string | null
}

type Remark = {
  remark_id: number
  remark_date: string
  place: string
  details: string
}

const LOOKBACK_YEARS = 3

function buildPrompt(officer: Officer, remarks: Remark[]): string {
  const today = new Date().toISOString().slice(0, 10)
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - LOOKBACK_YEARS)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const remarksBlock = remarks
    .map(
      (r) =>
        `[remark_id=${r.remark_id} | date=${r.remark_date} | place=${r.place}]\n${r.details}`
    )
    .join('\n\n')

  return `Today is ${today}. Lookback window: ${cutoffStr} to ${today} (${LOOKBACK_YEARS} years).

You are scoring an HR officer's qualitative profile from forum/management remarks for a succession-planning prototype. Senior HR leaders (Perm Sec, CHRO, DS, Director) leave these remarks during talent committee meetings and similar forums.

## Officer
- ID: ${officer.officer_id}
- Name: ${officer.name}
- Grade: ${officer.grade ?? 'N/A'} (MX equiv: ${officer.mx_equivalent_grade ?? 'N/A'})
- IHRP cert: ${officer.ihrp_certification ?? 'None'}
- HRLP: ${officer.hrlp ?? 'Not Started'}

## Remarks (chronological)
${remarksBlock}

## Task
Extract structured qualitative signals using the record_qualitative_signals tool. Be calibrated — vague praise ("not too bad guy") should produce low specificity and a modest qualitative_score, even if technically positive. Concrete, senior-attributed praise ("Perm Sec commended his framework adopted across 10 agencies") should score high on specificity and seniority. If a remark explicitly names an endorser's role (Perm Sec, CHRO, DS, MOF CHRO, etc.), reflect that in endorsement_seniority_score.`
}

async function callClaudeExtract(
  officer: Officer,
  remarks: Remark[]
): Promise<QualitativeSignals> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: 'tool', name: EXTRACT_TOOL.name },
      messages: [{ role: 'user', content: buildPrompt(officer, remarks) }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Anthropic API ${res.status}: ${body}`)
  }

  const data = await res.json()
  const toolUse = (data.content ?? []).find((b: any) => b.type === 'tool_use')
  if (!toolUse) {
    throw new Error('No tool_use block in Claude response')
  }
  return toolUse.input as QualitativeSignals
}

export async function extractQualitativeSignalsForOfficer(
  officerId: string
): Promise<QualitativeSignals & { source_remark_ids: number[] }> {
  const [officerRes, remarksRes] = await Promise.all([
    supabaseServer
      .from('officers')
      .select('officer_id, name, grade, mx_equivalent_grade, ihrp_certification, hrlp')
      .eq('officer_id', officerId)
      .single(),
    supabaseServer
      .from('officer_remarks')
      .select('remark_id, remark_date, place, details')
      .eq('officer_id', officerId)
      .order('remark_date', { ascending: true }),
  ])

  if (officerRes.error || !officerRes.data) throw new Error(`Officer ${officerId} not found`)
  if (remarksRes.error) throw new Error(`Remarks fetch failed: ${remarksRes.error.message}`)

  const officer = officerRes.data as Officer
  const remarks = (remarksRes.data ?? []) as Remark[]

  if (remarks.length === 0) {
    const empty: QualitativeSignals & { source_remark_ids: number[] } = {
      endorsement_count: 0,
      endorsement_specificity_score: 0,
      endorsement_seniority_score: 0,
      domain_match_keywords: [],
      concerns_count: 0,
      sentiment_trajectory: 'unknown',
      qualitative_score: 0,
      signals: [],
      source_remark_ids: [],
    }
    await persistSignals(officerId, empty, [])
    return empty
  }

  const signals = await callClaudeExtract(officer, remarks)
  const remarkIds = remarks.map((r) => r.remark_id)
  await persistSignals(officerId, signals, remarkIds)
  return { ...signals, source_remark_ids: remarkIds }
}

async function persistSignals(
  officerId: string,
  s: QualitativeSignals,
  source_remark_ids: number[]
) {
  const { error } = await supabaseServer.from('officer_qualitative_signals').upsert(
    {
      officer_id: officerId,
      endorsement_count: s.endorsement_count,
      endorsement_specificity_score: s.endorsement_specificity_score,
      endorsement_seniority_score: s.endorsement_seniority_score,
      domain_match_keywords: s.domain_match_keywords,
      concerns_count: s.concerns_count,
      sentiment_trajectory: s.sentiment_trajectory,
      qualitative_score: s.qualitative_score,
      signals: s.signals,
      source_remark_ids,
      generated_at: new Date().toISOString(),
      generation_method: 'ai',
    },
    { onConflict: 'officer_id' }
  )
  if (error) throw new Error(`Upsert failed: ${error.message}`)
}

export async function extractQualitativeSignalsForAll(): Promise<{
  processed: { officer_id: string; qualitative_score: number }[]
  errors: { officer_id: string; error: string }[]
}> {
  const { data: officers, error } = await supabaseServer
    .from('officers')
    .select('officer_id')
    .order('officer_id')
  if (error) throw new Error(`Officer list fetch failed: ${error.message}`)

  const processed: { officer_id: string; qualitative_score: number }[] = []
  const errors: { officer_id: string; error: string }[] = []

  for (const o of officers ?? []) {
    try {
      const result = await extractQualitativeSignalsForOfficer(o.officer_id)
      processed.push({ officer_id: o.officer_id, qualitative_score: result.qualitative_score })
    } catch (e: any) {
      errors.push({ officer_id: o.officer_id, error: e?.message ?? String(e) })
    }
  }

  return { processed, errors }
}
