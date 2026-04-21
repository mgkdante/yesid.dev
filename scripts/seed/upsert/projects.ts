import type { Payload } from 'payload'
import { loadTsModule } from '../lib/loadTs'
import { deriveStack } from '../lib/deriveStack'
import { ensureTechStackStub } from './tech-stack'

export async function upsertProjects(args: { payload: Payload; sourceRepo: string }): Promise<void> {
  const { payload, sourceRepo } = args

  const mod = await loadTsModule(sourceRepo, 'src/lib/content/projects.ts')
  // projects is exported at the end of projects.ts via `export { projects }`.
  const projects = (mod.projects as Array<Record<string, unknown>>) ?? []

  const { projectToTechs } = await deriveStack(sourceRepo)

  // Pre-resolve Payload service doc IDs (so project.services: string[] can reference real docs).
  const allServices = await payload.find({ collection: 'services', limit: 500 })
  const serviceIdToDocId = new Map<string, string | number>(
    allServices.docs.map((s) => [s.id as string, s.id as string | number]),
  )

  // Pre-resolve Media doc IDs for project.image filename → Media doc.
  const allMedia = await payload.find({ collection: 'media', limit: 500 })
  const mediaFilenameToDocId = new Map<string, string | number>(
    allMedia.docs.map((m) => [
      (m as unknown as { filename?: string }).filename ?? '',
      m.id as string | number,
    ]),
  )

  for (const proj of projects) {
    const slug = proj.slug as string
    if (!slug) continue

    // Prefer derived stack from MD source-of-truth; fall back to TS projects.stack (string IDs).
    const derivedStack = projectToTechs.get(slug) ?? (proj.stack as string[] | undefined) ?? []
    for (const techId of derivedStack) {
      await ensureTechStackStub(payload, techId)
    }

    // Resolve relatedServices (TS string[] of service ids) → Payload service doc IDs.
    const serviceIds = Array.isArray(proj.relatedServices)
      ? (proj.relatedServices as string[])
          .map((sId) => serviceIdToDocId.get(sId))
          .filter((v): v is string | number => v != null)
      : []

    // Resolve image filename → Media doc ID (if image was seeded into Media).
    // TS projects.image is a string filename like 'yesid-dev.png'.
    // In Payload this is an upload field (relationTo: 'media') — needs a doc ID.
    const imageFilename = typeof proj.image === 'string' ? proj.image : undefined
    const imageDocId = imageFilename ? mediaFilenameToDocId.get(imageFilename) : undefined

    const payloadData: Record<string, unknown> = {
      slug,
      title: proj.title,
      oneLiner: proj.oneLiner,
      description: proj.description,
      status: proj.status,
      featured: proj.featured,
      tags: proj.tags ?? [],
      services: serviceIds,
      stack: derivedStack,
      repoUrl: proj.repoUrl,
      liveUrl: proj.liveUrl,
      readmeUrl: proj.readmeUrl,
      image: imageDocId,
      sections: proj.sections ?? [],
      impactMetric: proj.impactMetric,
      impactMetrics: proj.impactMetrics ?? [],
      location: proj.location,
      environment: proj.environment,
      version: proj.version,
    }

    const found = await payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (found.totalDocs > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.update({ collection: 'projects', id: found.docs[0].id, data: payloadData as any })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.create({ collection: 'projects', data: payloadData as any })
    }
  }

  console.log(`[seed]   projects: ${projects.length} items processed`)
}
