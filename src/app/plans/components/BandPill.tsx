import type { Band } from '@/lib/queries/pipeline-health'

const STYLES: Record<Band, string> = {
  green: 'bg-green-100 text-green-900 border-green-300',
  amber: 'bg-amber-100 text-amber-900 border-amber-300',
  red: 'bg-red-100 text-red-900 border-red-300',
}

const LABELS: Record<Band, string> = {
  green: 'Green',
  amber: 'Amber',
  red: 'Red',
}

export default function BandPill({ band, score }: { band: Band; score?: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border rounded-full ${STYLES[band]}`}
    >
      <span className="inline-block w-2 h-2 rounded-full bg-current opacity-70" />
      {LABELS[band]}
      {typeof score === 'number' && <span className="ml-1 font-normal">{score.toFixed(0)}</span>}
    </span>
  )
}
