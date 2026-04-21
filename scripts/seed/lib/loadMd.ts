/**
 * Markdown file loader for yesid.dev/src/content/.
 * Reads all .md files under a directory and parses frontmatter via gray-matter.
 */
import path from 'path'
import { readdir, readFile } from 'fs/promises'
import matter from 'gray-matter'

export interface ParsedMd {
  slug: string // filename without .md extension
  frontmatter: Record<string, unknown>
  body: string // markdown body without frontmatter
}

/**
 * Reads all markdown files in a directory (non-recursive) and parses frontmatter.
 * @param dirPath - absolute path to the directory containing .md files
 * @returns array of parsed entries
 */
export async function loadMdDir(dirPath: string): Promise<ParsedMd[]> {
  let files: string[] = []
  try {
    files = (await readdir(dirPath)).filter((f) => f.endsWith('.md'))
  } catch (err) {
    throw new Error(`[seed/loadMd] Failed to read ${dirPath}: ${(err as Error).message}`)
  }

  const entries: ParsedMd[] = []
  for (const file of files) {
    const slug = file.replace(/\.md$/, '')
    const raw = await readFile(path.join(dirPath, file), 'utf8')
    const parsed = matter(raw)
    entries.push({
      slug,
      frontmatter: parsed.data as Record<string, unknown>,
      body: parsed.content,
    })
  }
  return entries
}

/**
 * Reads blog-post structure: yesid.dev/src/content/blog/{professional,personal}/{slug}/index.md
 * Returns array with {slug, category, frontmatter, body}.
 */
export async function loadBlogPosts(
  blogRoot: string,
): Promise<Array<ParsedMd & { category: 'professional' | 'personal' }>> {
  const results: Array<ParsedMd & { category: 'professional' | 'personal' }> = []
  for (const category of ['professional', 'personal'] as const) {
    const catDir = path.join(blogRoot, category)
    let entries: string[] = []
    try {
      entries = await readdir(catDir)
    } catch {
      continue // category folder may not exist
    }
    for (const slug of entries) {
      const indexPath = path.join(catDir, slug, 'index.md')
      try {
        const raw = await readFile(indexPath, 'utf8')
        const parsed = matter(raw)
        results.push({
          slug,
          category,
          frontmatter: parsed.data as Record<string, unknown>,
          body: parsed.content,
        })
      } catch {
        // no index.md — skip
      }
    }
  }
  return results
}
