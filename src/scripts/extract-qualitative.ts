import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { extractQualitativeSignalsForAll } from '../lib/qualitative-signals/extract'

async function main() {
  console.log('Extracting qualitative signals for all officers...')
  console.log('Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  const result = await extractQualitativeSignalsForAll()

  console.log(`\nProcessed: ${result.processed.length}`)
  for (const p of result.processed) {
    console.log(`  ${p.officer_id} → qualitative_score = ${p.qualitative_score}`)
  }

  if (result.errors.length > 0) {
    console.log(`\nErrors: ${result.errors.length}`)
    for (const e of result.errors) {
      console.log(`  ${e.officer_id}: ${e.error}`)
    }
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
