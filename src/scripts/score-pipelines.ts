import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { scoreAllPipelines } from '../lib/pipeline-scoring/score'

async function main() {
  console.log('Scoring all pipelines...')
  const results = await scoreAllPipelines()

  console.log('\nResults:')
  console.log('band   position_id')
  console.log('-----  -------------')
  const summary = results.map((r) => ({ id: r.position_id, band: r.overall_band }))
  for (const r of summary) {
    console.log(`${r.band.padEnd(5)}  ${r.id}`)
  }

  console.log('\nCriteria breakdown:')
  for (const r of results) {
    const triggered = r.criteria.filter((c) => c.triggered).map((c) => c.key)
    console.log(
      `  ${r.position_id.padEnd(12)} band=${r.overall_band.padEnd(5)} ` +
      (triggered.length > 0 ? `triggered: ${triggered.join(', ')}` : 'all pass')
    )
  }
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
