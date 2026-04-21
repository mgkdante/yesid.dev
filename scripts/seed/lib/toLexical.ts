/**
 * Markdown → Lexical editor state converter.
 *
 * Strategy (per spec D7 + Q1):
 * - First, probe for Payload's official `convertMarkdownToLexical` in
 *   `@payloadcms/richtext-lexical/migrate`. If available, use it.
 * - Otherwise, fall back to a naive paragraph+heading splitter:
 *   - Split body on blank-line boundaries (\n\n+).
 *   - Each chunk becomes a Lexical paragraph, unless it starts with `#` / `##` / `###` etc.
 *     — those become heading nodes.
 *   - Everything else (code fences, inline formatting, lists, images) is lost on fallback.
 *
 * NOTE: At Payload 3.83.0, `@payloadcms/richtext-lexical/migrate` only exports
 * Slate-to-Lexical converters (convertSlateToLexical, migrateSlateToLexical, etc.).
 * It does NOT export `convertMarkdownToLexical`. The naive fallback is always used.
 *
 * Post-seed: Yesid re-authors affected blog posts in admin UI.
 */

// Payload's migrate helper may or may not be present depending on version.
// Dynamic import so we can fall back cleanly if missing.
let officialConverter: ((md: string) => unknown) | null = null

async function tryLoadOfficialConverter(): Promise<void> {
  if (officialConverter !== null) return
  try {
    // Cast through unknown: at Payload 3.83.0 this module does NOT export
    // convertMarkdownToLexical (it's Slate-only), but we probe at runtime for future
    // versions that may add it. TypeScript knows the current shape, so we widen to
    // unknown first to silence the overlap error.
    const mod = (await import('@payloadcms/richtext-lexical/migrate')) as unknown as {
      convertMarkdownToLexical?: (md: string) => unknown
    }
    if (typeof mod.convertMarkdownToLexical === 'function') {
      officialConverter = mod.convertMarkdownToLexical
      console.log('[seed/toLexical] Using official @payloadcms/richtext-lexical/migrate converter.')
    } else {
      console.log('[seed/toLexical] Official converter not found; using naive fallback.')
    }
  } catch {
    console.log('[seed/toLexical] Official converter not found; using naive fallback.')
  }
}

interface LexicalNode {
  type: string
  version: number
  [key: string]: unknown
}

interface LexicalState {
  root: {
    type: 'root'
    version: number
    format: string
    indent: number
    direction: 'ltr' | 'rtl'
    children: LexicalNode[]
  }
}

/**
 * Naive markdown → Lexical fallback.
 * Splits on double-newlines; each chunk = paragraph or heading.
 * Loses inline formatting, code fences, lists, images.
 */
function naiveMarkdownToLexical(md: string): LexicalState {
  const trimmed = md.trim()
  const blocks = trimmed
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean)

  const children: LexicalNode[] = blocks.map((block) => {
    const headingMatch = block.match(/^(#+)\s+(.*)$/s)
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 6)
      return {
        type: 'heading',
        version: 1,
        tag: `h${level}`,
        children: [{ type: 'text', version: 1, text: headingMatch[2] }],
      }
    }
    return {
      type: 'paragraph',
      version: 1,
      children: [{ type: 'text', version: 1, text: block }],
    }
  })

  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children,
    },
  }
}

/**
 * Public API. Prefer official converter if loaded; else naive fallback.
 */
export async function markdownToLexical(md: string): Promise<unknown> {
  await tryLoadOfficialConverter()
  if (officialConverter) {
    return officialConverter(md)
  }
  return naiveMarkdownToLexical(md)
}
