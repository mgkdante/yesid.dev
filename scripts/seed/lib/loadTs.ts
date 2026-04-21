/**
 * Dynamic-import helper for yesid.dev TS modules.
 * Bun runs TypeScript natively, so `import()` against a sibling repo's .ts file works.
 */
import path from 'path'

/**
 * Loads a TS module from the sibling yesid.dev repo via dynamic import.
 * @param sourceRepo - absolute path to the yesid.dev repo root
 * @param relativePath - path relative to yesid.dev root, e.g. 'src/lib/content/projects.ts'
 * @returns the module's exports
 */
export async function loadTsModule(
  sourceRepo: string,
  relativePath: string,
): Promise<Record<string, unknown>> {
  const fullPath = path.join(sourceRepo, relativePath)
  try {
    const mod = await import(fullPath)
    return mod
  } catch (err) {
    throw new Error(`[seed/loadTs] Failed to import ${fullPath}: ${(err as Error).message}`)
  }
}
