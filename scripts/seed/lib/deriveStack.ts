/**
 * Per D-rel-1: the yesid.dev TS tech-stack source has arrays like
 *   tech: { id, name, relatedProjects: ['yesid-dev', ...], relatedServices: ['sql-dev', ...] }
 * These are the SOURCE-OF-TRUTH from TS, but in Payload the edges flow the other way:
 *   project.stack: [techId, ...]  (source-of-truth in Payload)
 *   tech-stack.relatedProjects: auto-computed via `join` field
 *
 * This helper inverts the TS arrays into per-project + per-service stack[] arrays.
 */
import { loadMdDir } from './loadMd'
import path from 'path'

export interface StackDerivation {
  projectToTechs: Map<string, string[]> // project slug → [tech id, ...]
  serviceToTechs: Map<string, string[]> // service id → [tech id, ...]
}

/**
 * Reads yesid.dev/src/content/stack/*.md, parses each tech's relatedProjects + relatedServices,
 * and returns inverted maps.
 */
export async function deriveStack(sourceRepo: string): Promise<StackDerivation> {
  const stackDir = path.join(sourceRepo, 'src/content/stack')
  const entries = await loadMdDir(stackDir)

  const projectToTechs = new Map<string, string[]>()
  const serviceToTechs = new Map<string, string[]>()

  for (const entry of entries) {
    const techId = entry.frontmatter.id as string | undefined
    if (!techId) continue

    const relatedProjects = (entry.frontmatter.relatedProjects as string[]) ?? []
    const relatedServices = (entry.frontmatter.relatedServices as string[]) ?? []

    for (const projSlug of relatedProjects) {
      if (!projectToTechs.has(projSlug)) projectToTechs.set(projSlug, [])
      projectToTechs.get(projSlug)!.push(techId)
    }
    for (const serviceId of relatedServices) {
      if (!serviceToTechs.has(serviceId)) serviceToTechs.set(serviceId, [])
      serviceToTechs.get(serviceId)!.push(techId)
    }
  }

  return { projectToTechs, serviceToTechs }
}
