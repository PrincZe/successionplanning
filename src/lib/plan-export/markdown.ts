import {
  composePositionPlan,
  composeAgencyPlan,
  composeOrgPlan,
  type PositionPlan,
  type AgencyPlan,
  type OrgPlan,
  type AgencyPlanRow,
} from './compose'
import type { Band } from '@/lib/queries/pipeline-health'

// =============================================================================
// Phase 8 — markdown export.
// Plain-markdown rendering of the same data the print routes show, for pasting
// into emails / Slack / docs.
// =============================================================================

const BAND_EMOJI: Record<Band, string> = {
  red: 'RED',
  amber: 'AMBER',
  green: 'GREEN',
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toISOString().slice(0, 10)
}

function bandTag(band: Band, score?: number): string {
  return score !== undefined ? `**${BAND_EMOJI[band]} ${score.toFixed(0)}**` : `**${BAND_EMOJI[band]}**`
}

function rowLine(p: AgencyPlanRow): string {
  const counts = `${p.successor_count.immediate}/${p.successor_count['1-2_years']}/${p.successor_count['3-5_years']}`
  const risk = p.risk_horizon_months !== null ? `${p.risk_horizon_months}mo` : '—'
  return `| ${p.position_title} (${p.jr_grade}) | ${p.incumbent_name ?? 'Vacant'} | ${risk} | ${counts} | ${bandTag(p.overall_band, p.overall_score)} |`
}

const SUB_LABELS: Record<'A' | 'B' | 'C' | 'D' | 'E', string> = {
  A: 'Qualitative endorsement (35%)',
  B: 'Competency fit (25%)',
  C: 'Coverage (20%)',
  D: 'Urgency match (15%)',
  E: 'Development momentum (5%)',
}

export function renderPositionPlanMarkdown(p: PositionPlan): string {
  const { detail, recommendations, development_plans, generated_at } = p
  const out: string[] = []

  out.push(`# Succession Plan — ${detail.position_title}`)
  out.push('')
  out.push(
    `**Agency:** ${detail.agency} · **Grade:** ${detail.jr_grade} · **Position ID:** ${detail.position_id} · **Generated:** ${fmtDate(generated_at)}`
  )
  out.push('')
  out.push(`## Pipeline strength — ${bandTag(detail.overall_band, detail.overall_score)}`)
  out.push('')
  out.push(`- **Incumbent:** ${detail.incumbent_name ?? 'Vacant'}`)
  out.push(
    `- **Risk horizon:** ${detail.risk_horizon_months !== null ? `${detail.risk_horizon_months} months` : 'Not set'}`
  )
  out.push(
    `- **Coverage:** Immediate ${detail.successor_count.immediate} · 1–2yr ${detail.successor_count['1-2_years']} · 3–5yr ${detail.successor_count['3-5_years']} · 5+yr ${detail.successor_count.more_than_5_years}`
  )
  out.push('')

  out.push(`### Sub-scores`)
  out.push('')
  for (const k of ['A', 'B', 'C', 'D', 'E'] as const) {
    const sub = detail.sub_scores[k]
    out.push(`- **${SUB_LABELS[k]}** — ${bandTag(sub.band, sub.score)}`)
    for (const r of sub.reasons.slice(0, 3)) out.push(`  - ${r}`)
  }
  out.push('')

  if (detail.ai_narration) {
    out.push(`## Assessment narrative`)
    out.push('')
    out.push(detail.ai_narration)
    out.push('')
  }

  if (detail.ai_interventions && detail.ai_interventions.length > 0) {
    out.push(`## Recommended interventions`)
    out.push('')
    for (const iv of detail.ai_interventions) {
      out.push(`- **${iv.title}** _(${iv.priority} · ${iv.kind.replace('_', ' ')})_ — ${iv.detail}`)
    }
    out.push('')
  }

  if (recommendations && recommendations.candidates.length > 0) {
    out.push(`## Successor recommendations`)
    out.push('')
    if (recommendations.summary) {
      out.push(`> ${recommendations.summary}`)
      out.push('')
    }
    out.push('| Rank | Officer | Grade | Score | Reasoning |')
    out.push('|---|---|---|---:|---|')
    const sorted = recommendations.candidates
      .slice()
      .sort((a, b) => {
        const ar = a.ai_rank ?? Number.MAX_SAFE_INTEGER
        const br = b.ai_rank ?? Number.MAX_SAFE_INTEGER
        if (ar !== br) return ar - br
        return b.composite_score - a.composite_score
      })
    for (let i = 0; i < sorted.length; i++) {
      const c = sorted[i]
      const reason = (c.ai_reasoning ?? c.reasons.slice(0, 2).join('; ')).replace(/\|/g, '\\|')
      out.push(`| ${c.ai_rank ?? i + 1} | ${c.name} | ${c.grade ?? '—'} | ${c.composite_score.toFixed(0)} | ${reason} |`)
    }
    out.push('')
  }

  const withPlan = development_plans.filter((d) => d.plan)
  if (withPlan.length > 0) {
    out.push(`## Development pathways for top successors`)
    out.push('')
    for (const { candidate, plan } of withPlan) {
      if (!plan) continue
      out.push(`### ${candidate.name} (${candidate.grade ?? '—'}) — status: ${plan.status}`)
      out.push('')
      if (plan.plan.summary) {
        out.push(plan.plan.summary)
        out.push('')
      }
      const ivs = plan.plan.interventions.slice().sort((a, b) => a.sequence - b.sequence)
      for (const iv of ivs) {
        const window = `M${iv.starts_after_month}–M${iv.starts_after_month + iv.runs_for_months}`
        out.push(`${iv.sequence}. **${iv.offering_name}** _(${iv.kind} · ${window})_ — ${iv.rationale}`)
      }
      if (plan.plan.caveats?.length) {
        out.push('')
        out.push(`> Caveats: ${plan.plan.caveats.join(' · ')}`)
      }
      out.push('')
    }
  }

  out.push('---')
  out.push('_AI-assisted draft. CHROO/HR review required before action._')
  return out.join('\n')
}

export function renderAgencyPlanMarkdown(a: AgencyPlan): string {
  const out: string[] = []
  out.push(`# Succession Plan — ${a.agency}`)
  out.push('')
  out.push(`**${a.summary.total} positions** · Generated ${fmtDate(a.generated_at)}`)
  out.push('')
  out.push(`## Pipeline mix`)
  out.push('')
  out.push(`- **Red:** ${a.summary.red}`)
  out.push(`- **Amber:** ${a.summary.amber}`)
  out.push(`- **Green:** ${a.summary.green}`)
  out.push('')

  out.push(`## At-risk positions (${a.at_risk.length})`)
  out.push('')
  if (a.at_risk.length === 0) {
    out.push('_None._')
  } else {
    out.push('| Position | Incumbent | Risk | Imm/1–2/3–5 | Band |')
    out.push('|---|---|---|---|---|')
    for (const p of a.at_risk) out.push(rowLine(p))
  }
  out.push('')

  const withNarration = a.at_risk.filter((p) => p.ai_narration)
  if (withNarration.length > 0) {
    out.push(`## At-risk narratives`)
    out.push('')
    for (const p of withNarration) {
      out.push(`### ${p.position_title} — ${bandTag(p.overall_band, p.overall_score)}`)
      out.push('')
      out.push(p.ai_narration!)
      out.push('')
    }
  }

  out.push(`## All positions (${a.positions.length})`)
  out.push('')
  out.push('| Position | Incumbent | Risk | Imm/1–2/3–5 | Band |')
  out.push('|---|---|---|---|---|')
  for (const p of a.positions) out.push(rowLine(p))
  out.push('')

  out.push('---')
  out.push('_AI-assisted draft. Coverage shown as Immediate / 1–2yr / 3–5yr counts._')
  return out.join('\n')
}

export function renderOrgPlanMarkdown(o: OrgPlan): string {
  const out: string[] = []
  out.push(`# Succession Plan — Whole-of-Government Roll-up`)
  out.push('')
  out.push(
    `**${o.summary.total} positions** across **${o.agencies.length} agencies** · Generated ${fmtDate(o.generated_at)}`
  )
  out.push('')
  out.push(`## Pipeline mix`)
  out.push('')
  out.push(`- **Red:** ${o.summary.red}`)
  out.push(`- **Amber:** ${o.summary.amber}`)
  out.push(`- **Green:** ${o.summary.green}`)
  out.push('')

  out.push(`## By agency`)
  out.push('')
  out.push('| Agency | Positions | Red | Amber | Green | Worst band |')
  out.push('|---|---:|---:|---:|---:|---|')
  for (const a of o.agencies) {
    out.push(
      `| ${a.agency} | ${a.summary.total} | ${a.summary.red} | ${a.summary.amber} | ${a.summary.green} | ${BAND_EMOJI[a.worst_band]} |`
    )
  }
  out.push('')

  const top = o.at_risk.slice(0, 25)
  out.push(`## Top at-risk positions (${top.length} of ${o.at_risk.length})`)
  out.push('')
  if (top.length === 0) {
    out.push('_None._')
  } else {
    out.push('| Position | Agency | Risk | Band |')
    out.push('|---|---|---|---|')
    for (const p of top) {
      const risk = p.risk_horizon_months !== null ? `${p.risk_horizon_months}mo` : '—'
      out.push(`| ${p.position_title} (${p.jr_grade}) | ${p.agency} | ${risk} | ${bandTag(p.overall_band, p.overall_score)} |`)
    }
  }
  out.push('')
  if (o.at_risk.length > top.length) {
    out.push(`_${o.at_risk.length - top.length} additional at-risk positions not shown — see per-agency plans._`)
    out.push('')
  }

  out.push('---')
  out.push('_AI-assisted draft for the CHROO talent committee._')
  return out.join('\n')
}

export async function renderScopeMarkdown(scope: 'position' | 'agency' | 'organization', key: string): Promise<string | null> {
  if (scope === 'position') {
    const data = await composePositionPlan(key)
    if (!data) return null
    return renderPositionPlanMarkdown(data)
  }
  if (scope === 'agency') {
    const data = await composeAgencyPlan(key)
    if (!data) return null
    return renderAgencyPlanMarkdown(data)
  }
  const data = await composeOrgPlan()
  return renderOrgPlanMarkdown(data)
}
