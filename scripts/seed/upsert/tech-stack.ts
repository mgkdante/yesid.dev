import type { Payload } from 'payload'
import path from 'path'
import { loadMdDir } from '../lib/loadMd'

export async function upsertTechStack(args: { payload: Payload; sourceRepo: string }): Promise<void> {
  const { payload, sourceRepo } = args
  const stackDir = path.join(sourceRepo, 'src/content/stack')
  const entries = await loadMdDir(stackDir)

  let created = 0
  let updated = 0
  let skippedConnects = 0

  for (const entry of entries) {
    const data = entry.frontmatter
    const techId = data.id as string | undefined
    if (!techId) {
      console.warn(`[seed/tech-stack] Skipping ${entry.slug} — missing frontmatter.id`)
      continue
    }

    // D-rel-2: drop connectsTo + connectionNotes (inter-tech graph deferred to engine slice).
    if (Array.isArray(data.connectsTo) && data.connectsTo.length > 0) {
      console.log(`[seed]   Skipping tech-stack.connectsTo for ${techId} (deferred to engine-builder slice)`)
      skippedConnects += 1
    }

    // Cast to any: Payload's generic types narrow layer/domains/proficiency to literal
    // unions, but MD frontmatter is parsed as `string`. Runtime values are valid;
    // cast avoids TS2322 without widening the Payload schema.
    const baseData = {
      name: (data.name as string) ?? techId,
      layer: (data.layer as string) ?? 'data',
      domains: (data.domains as string[]) ?? [],
      icon: (data.icon as string) ?? '',
      proficiency: (data.proficiency as string) ?? 'familiar',
    }

    const found = await payload.find({
      collection: 'tech-stack',
      where: { id: { equals: techId } },
      limit: 1,
    })

    if (found.totalDocs > 0) {
      // Upsert: update existing docs (primary key preserved via silent-override hook in the collection)
      // or create if absent. Seed is idempotent: re-runs propagate source changes without rename risk.
      await payload.update({
        collection: 'tech-stack',
        id: found.docs[0].id,
        data: { id: techId, ...baseData } as any,
      })
      updated += 1
    } else {
      // On create, include `id` so the stable slug is set.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.create({
        collection: 'tech-stack',
        data: { id: techId, ...baseData } as any,
      })
      created += 1
    }
  }

  console.log(`[seed]   tech-stack: ${created} created, ${updated} updated${skippedConnects ? ` (${skippedConnects} connectsTo blocks dropped per D-rel-2)` : ''}`)
}

/**
 * Auto-stub-creation helper (D-rel-2).
 * Called from projects + services upserts when their stack array references an id
 * not yet present in tech-stack. Creates a minimal stub doc (id + name only).
 */
export async function ensureTechStackStub(payload: Payload, id: string): Promise<void> {
  const found = await payload.find({
    collection: 'tech-stack',
    where: { id: { equals: id } },
    limit: 1,
  })
  if (found.totalDocs === 0) {
    console.warn(`[seed]   Stub-created tech-stack <${id}> (no TS source) — fill fields in admin UI`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({
      collection: 'tech-stack',
      data: { id, name: id, layer: 'data', proficiency: 'familiar' } as any,
    })
  }
}
