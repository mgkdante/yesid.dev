import type { Payload } from 'payload'
import path from 'path'
import { loadBlogPosts } from '../lib/loadMd'
import { markdownToLexical } from '../lib/toLexical'

export async function upsertBlogPosts(args: { payload: Payload; sourceRepo: string }): Promise<void> {
  const { payload, sourceRepo } = args
  const blogRoot = path.join(sourceRepo, 'src/content/blog')
  const posts = await loadBlogPosts(blogRoot)

  for (const post of posts) {
    const { slug, category, frontmatter: fm, body } = post
    const lexicalBody = await markdownToLexical(body)

    // Payload local API localization notes:
    // - Localized `text`/`textarea` fields: accept `{ en: '...' }` object (multi-locale write).
    // - Localized `richText` fields: accept the raw Lexical state object directly —
    //   wrapping in `{ en: ... }` causes "This field is required." validation error.
    //   This is a Payload quirk at v3.83.0 with lexicalEditor().
    const payloadData: Record<string, unknown> = {
      slug,
      title: { en: (fm.title as string) ?? slug },
      excerpt: { en: (fm.excerpt as string) ?? '' },
      date: fm.date,
      lang: (fm.lang as string) ?? 'en',
      category,
      tags: (fm.tags as string[]) ?? [],
      animation: (fm.animation as string) ?? 'draw',
      svg: (fm.svg as string) ?? '',
      url: (fm.url as string) ?? '',
      external: (fm.external as boolean) ?? false,
      // Pass lexical state directly (no { en: ... } wrapper) — Payload handles locale implicitly.
      body: lexicalBody,
    }

    const found = await payload.find({
      collection: 'blog-posts',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (found.totalDocs > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.update({ collection: 'blog-posts', id: found.docs[0].id, data: payloadData as any, locale: 'all' as any })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.create({ collection: 'blog-posts', data: payloadData as any, locale: 'all' as any })
    }
  }

  console.log(`[seed]   blog-posts: ${posts.length} items processed`)
}
