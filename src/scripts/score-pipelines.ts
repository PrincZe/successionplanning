import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { scoreAllPipelines } from '../lib/pipeline-scoring/score'

async function main() {
  console.log('Scoring all pipelines...')
  const results = await scoreAllPipelines()

  console.log('\nResults sorted by overall_score:')
  console.log('band   score   position_id    title')
  console.log('-----  ------  -------------  -----')
  const summary = results
    .map((r) => ({ id: r.position_id, score: r.overall_score, band: r.overall_band }))
    .sort((a, b) => a.score - b.score)
  for (const r of summary) {
    const colored = r.band.padEnd(5)
    console.log(`${colored}  ${r.score.toString().padStart(5)}  ${r.id}`)
  }

  console.log('\nSub-score breakdown (A=qual, B=fit, C=cov, D=urg, E=mom):')
  for (const r of results) {
    const sb = r.sub_scores
    console.log(
      `  ${r.position_id.padEnd(12)} band=${r.overall_band.padEnd(5)} ` +
      `A=${sb.A.score.toFixed(0).padStart(3)}/${sb.A.band[0]} ` +
      `B=${sb.B.score.toFixed(0).padStart(3)}/${sb.B.band[0]} ` +
      `C=${sb.C.score.toFixed(0).padStart(3)}/${sb.C.band[0]} ` +
      `D=${sb.D.score.toFixed(0).padStart(3)}/${sb.D.band[0]} ` +
      `E=${sb.E.score.toFixed(0).padStart(3)}/${sb.E.band[0]}`
    )
  }
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
