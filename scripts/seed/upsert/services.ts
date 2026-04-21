import type { Payload } from 'payload'
import { loadTsModule } from '../lib/loadTs'
import { deriveStack } from '../lib/deriveStack'
import { ensureTechStackStub } from './tech-stack'

export async function upsertServices(args: { payload: Payload; sourceRepo: string }): Promise<void> {
  const { payload, sourceRepo } = args

  const mod = await loadTsModule(sourceRepo, 'src/lib/content/services.ts')
  const services = (mod.services as Array<Record<string, unknown>>) ?? []

  // Derive service.stack from yesid.dev's tech-stack.relatedServices (D-rel-1).
  const { serviceToTechs } = await deriveStack(sourceRepo)

  let created = 0
  let updated = 0

  for (const svc of services) {
    const serviceId = svc.id as string
    if (!serviceId) continue

    const derivedStack = serviceToTechs.get(serviceId) ?? []
    // Auto-stub any referenced tech not yet present (D-rel-2).
    for (const techId of derivedStack) {
      await ensureTechStackStub(payload, techId)
    }

    // title/subtitle/description are LocalizedString { en: '...' } in TS.
    // Payload localized text fields expect a string (the localized version) or the
    // object shape depending on whether locale is set. We pass the object directly —
    // Payload's local API with no locale context accepts { en: '...' } objects for
    // localized fields when locale is not specified.
    // NOTE: `id` is NOT included in baseData — on update the beforeChange hook deletes it
    // anyway, but Payload's uniqueness validator fires first and would fail (duplicate).
    const baseData: Record<string, unknown> = {
      title: svc.title,
      subtitle: svc.subtitle,
      description: svc.description,
      longDescription: svc.longDescription,
      valueProposition: svc.valueProposition,
      station: svc.station,
      icon: svc.icon ?? '',
      svg: svc.svg ?? '',
      lottieReverse: svc.lottieReverse ?? false,
      visible: svc.visible ?? true,
      benefitHeadline: svc.benefitHeadline,
      impactMetric: svc.impactMetric,
      // D-rel-1 source-of-truth: stack ids reference tech-stack docs.
      stack: derivedStack,
    }

    // deliverables: TS is LocalizedString[]; Payload array expects [{ text: LocalizedString }].
    if (Array.isArray(svc.deliverables)) {
      baseData.deliverables = (svc.deliverables as unknown[]).map((d) => ({ text: d }))
    }

    // sections: TS is ServiceSection[] with { title, content } LocalizedString fields.
    if (Array.isArray(svc.sections)) {
      baseData.sections = svc.sections
    }

    const found = await payload.find({
      collection: 'services',
      where: { id: { equals: serviceId } },
      limit: 1,
    })

    if (found.totalDocs > 0) {
      // Upsert: update existing docs (primary key preserved via silent-override hook in the collection)
      // or create if absent. Seed is idempotent: re-runs propagate source changes without rename risk.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.update({ collection: 'services', id: found.docs[0].id, data: { id: serviceId, ...baseData } as any })
      updated += 1
    } else {
      // On create, include `id` so the stable slug is set.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.create({ collection: 'services', data: { id: serviceId, ...baseData } as any })
      created += 1
    }
  }

  console.log(`[seed]   services: ${created} created, ${updated} updated`)
}
