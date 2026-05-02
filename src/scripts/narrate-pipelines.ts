import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { narrateAllPipelines } from '../lib/pipeline-narration/narrate'

async function main() {
  console.log('Generating AI narration + interventions for all pipelines...')
  const result = await narrateAllPipelines()
  console.log(`\nOK: ${result.ok.length}`)
  for (const p of result.ok) console.log(`  ${p}`)
  if (result.errors.length > 0) {
    console.log(`\nErrors: ${result.errors.length}`)
    for (const e of result.errors) console.log(`  ${e.position_id}: ${e.error}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
