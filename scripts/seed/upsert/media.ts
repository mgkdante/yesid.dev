import type { Payload } from 'payload'
import path from 'path'
import { readdir } from 'fs/promises'

export async function upsertMedia(args: { payload: Payload; sourceRepo: string }): Promise<void> {
  const { payload, sourceRepo } = args
  // Project images live in yesid.dev/static/images/work/
  const imagesDir = path.join(sourceRepo, 'static/images/work')

  let files: string[] = []
  try {
    files = (await readdir(imagesDir)).filter((f) => /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(f))
  } catch {
    console.log('[seed]   media: no project images directory found (static/images/work) — skipping')
    return
  }

  let uploaded = 0
  let skipped = 0

  for (const filename of files) {
    const found = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    })
    if (found.totalDocs > 0) {
      skipped += 1
      continue // idempotent — skip existing
    }

    const filePath = path.join(imagesDir, filename)
    // Derive alt text from filename: 'yesid-dev.png' → 'yesid dev'
    const altText = filename.replace(/\.\w+$/, '').replace(/[-_]/g, ' ')
    try {
      await payload.create({
        collection: 'media',
        // alt is a localized text field. locale: 'all' + object value writes per-locale maps correctly.
        // Cast to any: generated types expect `string` for localized text, not an object.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { alt: { en: altText } } as any,
        filePath,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        locale: 'all' as any,
      })
      uploaded += 1
    } catch (err) {
      console.warn(`[seed]   Failed to upload ${filename}: ${(err as Error).message}`)
    }
  }

  console.log(`[seed]   media: ${uploaded} uploaded, ${skipped} already present, ${files.length} total files`)
}
