import type { Payload } from 'payload'
import path from 'path'
import { loadMdDir } from '../lib/loadMd'

export async function upsertStackScenarios(args: { payload: Payload; sourceRepo: string }): Promise<void> {
  const { payload, sourceRepo } = args
  const scenariosDir = path.join(sourceRepo, 'src/content/scenarios')
  const entries = await loadMdDir(scenariosDir)

  // Pre-resolve project slug → Payload project doc ID.
  const allProjects = await payload.find({ collection: 'projects', limit: 500 })
  const projectSlugToDocId = new Map<string, string | number>(
    allProjects.docs.map((p) => [(p as unknown as { slug: string }).slug, p.id as string | number]),
  )

  // Pre-resolve tech-stack id → Payload tech-stack doc ID.
  const allTechs = await payload.find({ collection: 'tech-stack', limit: 500 })
  const techIdToDocId = new Map<string, string | number>(
    allTechs.docs.map((t) => [(t as unknown as { id: string }).id, t.id as string | number]),
  )

  let created = 0
  let skipped = 0

  for (const entry of entries) {
    const fm = entry.frontmatter
    const id = fm.id as string | undefined
    if (!id) continue

    const relatedProjectIds = Array.isArray(fm.relatedProjects)
      ? (fm.relatedProjects as string[])
          .map((ps) => projectSlugToDocId.get(ps))
          .filter((v): v is string | number => v != null)
      : []

    // 'recommended' in MD frontmatter maps to 'techs' in Payload schema (renamed per Q7).
    const techDocIds = Array.isArray(fm.recommended)
      ? (fm.recommended as string[])
          .map((tid) => techIdToDocId.get(tid))
          .filter((v): v is string | number => v != null)
      : []

    // NOTE: `id` is NOT included in baseData — on update the beforeChange hook deletes it
    // anyway, but Payload's uniqueness validator fires first and would fail (duplicate).
    const baseData: Record<string, unknown> = {
      domains: (fm.domains as string[]) ?? [],
      // techs field in Payload schema (renamed from TS 'recommended' per Q7).
      // MD frontmatter uses 'recommended'; Payload collection uses 'techs'.
      techs: techDocIds,
      relatedProjects: relatedProjectIds,
      // scenarios store body as summary; localized text field expects { en: '...' } object.
      summary: { en: entry.body.trim() },
    }

    const found = await payload.find({
      collection: 'stack-scenarios',
      where: { id: { equals: id } },
      limit: 1,
    })

    if (found.totalDocs > 0) {
      // SKIP existing docs: same `id` text field + beforeChange hook conflict as tech-stack.
      // Seed idempotency = skip-if-exists; no duplicates are created on re-runs.
      skipped += 1
      continue
    }
    // On create, include `id` so the stable slug is set.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: 'stack-scenarios', data: { id, ...baseData } as any })
    created += 1
  }

  console.log(`[seed]   stack-scenarios: ${created} created, ${skipped} already present`)
}
