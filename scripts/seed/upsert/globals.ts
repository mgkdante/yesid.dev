import type { Payload } from 'payload'
import path from 'path'
import { readFile } from 'fs/promises'
import { loadTsModule } from '../lib/loadTs'

/**
 * Extracts static `export const` objects from a TS file that uses Vite-only APIs
 * (import.meta.glob). We read the file as text, take only lines before the first
 * `import.meta.glob` call, strip TS-specific syntax, and evaluate the remaining
 * pure-JS `const` declarations via `new Function`.
 *
 * Works for: blog.ts (blogListingContent + blogDetailContent) and
 *            tech-stack.ts (techStackPageContent).
 * These are all pure `as const` objects with no runtime dependencies before the
 * import.meta.glob lines.
 */
/**
 * Extracts static `export const` objects from a TS file that uses Vite-only APIs
 * (import.meta.glob). Strategy:
 * 1. Read file as text.
 * 2. Stop at the first `import.meta.glob` OR `function ` line (TS functions have type
 *    annotations that break plain JS eval).
 * 3. Strip import statements and TS-specific syntax.
 * 4. Eval just the `const` block declarations via `new Function`.
 *
 * Works for: blog.ts and tech-stack.ts where the target exports are defined
 * before any function definitions or Vite API usage.
 */
async function extractStaticExports(
  filePath: string,
  exportNames: string[],
): Promise<Record<string, unknown>> {
  const src = await readFile(filePath, 'utf8')

  const lines = src.split('\n')
  // Stop at the first import.meta.glob line OR first function/class definition
  // (both are either Vite-only or contain TS type annotations we can't eval).
  const stopIdx = lines.findIndex(
    (l) => l.includes('import.meta.glob') || /^function\s+|^export function\s+|^class\s+/.test(l.trim()),
  )
  const rawSlice = (stopIdx > 0 ? lines.slice(0, stopIdx) : lines).join('\n')

  const excerpt = rawSlice
    // Strip entire multi-line import blocks: `import { ... } from '...'`
    // and single-line imports: `import ... from '...'`
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]*['"]\s*;?\n?/gm, '')
    // Strip `import type { ... } from '...'` (multi-line)
    .replace(/^import\s+type\s[\s\S]*?from\s+['"][^'"]*['"]\s*;?\n?/gm, '')
    // Remove TypeScript-specific syntax before eval.
    // IMPORTANT: `satisfies Type,` — the comma is the JS object separator, must be preserved.
    // The type name can include generic params with braces: `Record<K, { a: T }>`.
    // We match ` satisfies ` followed by everything to the end of the line,
    // capturing any trailing comma/semicolon before the newline.
    .replace(/\s+as\s+const\s+satisfies\s+[^\n]*?([,;]?\s*)$/gm, '$1') // compound form (end of line)
    .replace(/\s+satisfies\s+[^\n]*?([,;]?\s*)$/gm, '$1')               // simple form (end of line)
    .replace(/\bas\s+const\b/g, '')                                      // remaining `as const`
    .replace(/export\s+const\s+/g, 'const ')                            // `export const` → `const`

  const returnExpr = `return { ${exportNames.join(', ')} };`
  // eslint-disable-next-line no-new-func
  const fn = new Function(`${excerpt}\n${returnExpr}`)

  try {
    return fn() as Record<string, unknown>
  } catch (err) {
    console.warn(`[seed/globals] extractStaticExports(${filePath.split('/').pop()}) failed:`, (err as Error).message)
    console.warn('[seed/globals] Excerpt preview:', excerpt.slice(0, 300))
    return {}
  }
}

export async function upsertGlobals(args: { payload: Payload; sourceRepo: string }): Promise<void> {
  const { payload, sourceRepo } = args

  // ── site-meta ────────────────────────────────────────────────────────────────
  // Extends the 18a heartbeat with brand + footer fields.
  const metaMod = await loadTsModule(sourceRepo, 'src/lib/content/meta.ts')
  const siteContentMod = await loadTsModule(sourceRepo, 'src/lib/content/site-content.ts')
  const siteMeta = (metaMod.siteMeta as Record<string, unknown>) ?? {}
  const footerContent = (siteContentMod.footerContent as Record<string, unknown>) ?? {}
  await payload.updateGlobal({
    slug: 'site-meta',
    data: {
      siteName: (siteMeta.name as string) ?? 'yesid.',
      tagline: siteMeta.tagline,
      description: siteMeta.description,
      links: siteMeta.links,
      footer: {
        tagline: (footerContent.tagline as Record<string, unknown>) ?? undefined,
        location: (footerContent.location as Record<string, unknown>) ?? undefined,
        statusPrefix: (footerContent.statusPrefix as Record<string, unknown>) ?? undefined,
      },
    } as Record<string, unknown>,
  })
  console.log('[seed]     site-meta ✓')

  // ── home-content ─────────────────────────────────────────────────────────────
  // 7 exports from site-content.ts map 1:1 to the HomeContent global field groups.
  // Cast through Record<string, unknown> to avoid TS literal-type narrowing conflicts.
  await payload.updateGlobal({
    slug: 'home-content',
    data: {
      heroAnim: siteContentMod.heroAnimContent,
      hero: siteContentMod.heroContent,
      manifesto: siteContentMod.manifestoContent,
      journey: siteContentMod.skillsJourneyPanels,
      journeyCta: siteContentMod.skillsJourneyCta,
      proofReel: siteContentMod.proofReelContent,
      servicesGrid: siteContentMod.servicesGridContent,
      closer: siteContentMod.closerContent,
    } as Record<string, unknown>,
  })
  console.log('[seed]     home-content ✓')

  // ── services-page ─────────────────────────────────────────────────────────────
  const servicesMod = await loadTsModule(sourceRepo, 'src/lib/content/services.ts')
  await payload.updateGlobal({
    slug: 'services-page',
    data: {
      meta: servicesMod.servicesPageMeta,
      listing: servicesMod.servicesListingContent,
      detail: servicesMod.servicesDetailContent,
    } as Record<string, unknown>,
  })
  console.log('[seed]     services-page ✓')

  // ── projects-page ─────────────────────────────────────────────────────────────
  const projectsMod = await loadTsModule(sourceRepo, 'src/lib/content/projects.ts')
  await payload.updateGlobal({
    slug: 'projects-page',
    data: {
      meta: projectsMod.projectsPageMeta,
      listing: projectsMod.projectsListingContent,
      detail: projectsMod.projectsDetailContent,
    } as Record<string, unknown>,
  })
  console.log('[seed]     projects-page ✓')

  // ── blog-page ─────────────────────────────────────────────────────────────────
  // blog.ts uses import.meta.glob (Vite-only — cannot `import()` in Bun).
  // extractStaticExports reads the file as text, stops before the Vite API call,
  // and evaluates just the pure-const exports we need.
  const blogExports = await extractStaticExports(
    path.join(sourceRepo, 'src/lib/content/blog.ts'),
    ['blogListingContent', 'blogDetailContent'],
  )
  await payload.updateGlobal({
    slug: 'blog-page',
    data: {
      listing: blogExports.blogListingContent,
      detail: blogExports.blogDetailContent,
    } as Record<string, unknown>,
  })
  console.log('[seed]     blog-page ✓')

  // ── tech-stack-page ───────────────────────────────────────────────────────────
  // tech-stack.ts also uses import.meta.glob (same pattern as blog.ts).
  // techStackPageContent is defined before the first import.meta.glob call.
  const techStackExports = await extractStaticExports(
    path.join(sourceRepo, 'src/lib/content/tech-stack.ts'),
    ['techStackPageContent'],
  )
  await payload.updateGlobal({
    slug: 'tech-stack-page',
    data: techStackExports.techStackPageContent as Record<string, unknown>,
  })
  console.log('[seed]     tech-stack-page ✓')

  // ── about-content ─────────────────────────────────────────────────────────────
  const aboutMod = await loadTsModule(sourceRepo, 'src/lib/content/about-page.ts')
  await payload.updateGlobal({
    slug: 'about-content',
    data: aboutMod.aboutPageContent as Record<string, unknown>,
  })
  console.log('[seed]     about-content ✓')

  // ── contact-content ───────────────────────────────────────────────────────────
  const contactMod = await loadTsModule(sourceRepo, 'src/lib/content/contact-page.ts')
  await payload.updateGlobal({
    slug: 'contact-content',
    data: contactMod.contactContent as Record<string, unknown>,
  })
  console.log('[seed]     contact-content ✓')

  // ── nav-links ─────────────────────────────────────────────────────────────────
  // nav.ts exports: navLinks, menuItems, metroBookends, navDirections, sharedChromeContent.
  // EXCLUDING errorPageContent — that goes to error-pages global.
  const navMod = await loadTsModule(sourceRepo, 'src/lib/content/nav.ts')
  await payload.updateGlobal({
    slug: 'nav-links',
    data: {
      navLinks: navMod.navLinks,
      menuItems: navMod.menuItems,
      metroBookends: navMod.metroBookends,
      navDirections: navMod.navDirections,
      // Payload field is named 'sharedChrome' (NavLinks.ts); TS source exports 'sharedChromeContent'.
      sharedChrome: navMod.sharedChromeContent,
    } as Record<string, unknown>,
  })
  console.log('[seed]     nav-links ✓')

  // ── error-pages ───────────────────────────────────────────────────────────────
  await payload.updateGlobal({
    slug: 'error-pages',
    data: {
      notFound: navMod.errorPageContent,
    } as Record<string, unknown>,
  })
  console.log('[seed]     error-pages ✓')
}
