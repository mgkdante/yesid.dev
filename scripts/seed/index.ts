/**
 * Seed yesid.dev-cms from sibling yesid.dev content.
 *
 * Idempotent: re-run safe, upserts by natural key (slug/id).
 * Source: ../yesid.dev/src/lib/content/*.ts + ../yesid.dev/src/content/**\/*.md
 * Target: current Payload DB (Neon branch determined by DATABASE_URI).
 *
 * Usage:
 *   bun run seed:dev                        — seeds the current .env DATABASE_URI (dev)
 *   SEED_TARGET=prod bun run seed:prod      — gated, seeds prod branch
 *
 * Per spec D5/D13: one-shot reference recipe. NOT part of build.
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DEFAULT_SOURCE_REPO = path.resolve(__dirname, '../../..', 'yesid.dev')
const SOURCE_REPO = process.env.SEED_SOURCE_REPO_PATH ?? DEFAULT_SOURCE_REPO

async function main() {
  console.log(`[seed] Source repo: ${SOURCE_REPO}`)
  const target = process.env.SEED_TARGET ?? 'dev'
  const dbHint = process.env.DATABASE_URI?.split('@')[1]?.split('/')[0] ?? '<unknown>'
  console.log(`[seed] Target: ${target} (${dbHint})`)

  if (target === 'prod') {
    console.log('[seed] PROD TARGET — proceeding with explicit flag. Ctrl-C within 5s to abort.')
    await new Promise((r) => setTimeout(r, 5000))
  }

  const payload = await getPayload({ config })

  // Order matters: hub collections first, reverse-join collections after (D6).
  // Auto-stub-creation (D-rel-2) fires if a project/service references an id not yet present.
  console.log('\n[seed] 1/7 tech-stack (primary pass)')
  // TODO(18b-8b): import + call upsertTechStack({ payload, sourceRepo: SOURCE_REPO })
  console.log('[seed]   skipped — TODO(18b-8b)')

  console.log('\n[seed] 2/7 media (project images)')
  // TODO(18b-8b): import + call upsertMedia({ payload, sourceRepo: SOURCE_REPO })
  console.log('[seed]   skipped — TODO(18b-8b)')

  console.log('\n[seed] 3/7 services (+ auto-stub tech-stack if any)')
  // TODO(18b-8b): import + call upsertServices({ payload, sourceRepo: SOURCE_REPO })
  console.log('[seed]   skipped — TODO(18b-8b)')

  console.log('\n[seed] 4/7 projects (+ auto-stub tech-stack if any)')
  // TODO(18b-8b): import + call upsertProjects({ payload, sourceRepo: SOURCE_REPO })
  console.log('[seed]   skipped — TODO(18b-8b)')

  console.log('\n[seed] 5/7 blog-posts')
  // TODO(18b-8b): import + call upsertBlogPosts({ payload, sourceRepo: SOURCE_REPO })
  console.log('[seed]   skipped — TODO(18b-8b)')

  console.log('\n[seed] 6/7 stack-scenarios')
  // TODO(18b-8b): import + call upsertStackScenarios({ payload, sourceRepo: SOURCE_REPO })
  console.log('[seed]   skipped — TODO(18b-8b)')

  console.log('\n[seed] 7/7 globals')
  // TODO(18b-8b): import + call upsertGlobals({ payload, sourceRepo: SOURCE_REPO })
  console.log('[seed]   skipped — TODO(18b-8b)')

  console.log('\n[seed] DONE (scaffold mode — 18b-8b implements upserts)')
  process.exit(0)
}

main().catch((err) => {
  console.error('[seed] FAILED:', err)
  process.exit(1)
})
