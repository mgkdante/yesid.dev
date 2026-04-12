# Handoff: Slice 02 — Data Layer

## Summary

Created the typed, i18n-ready data layer that powers every page on the site. All content now lives in strongly-typed data files with full localization support (en/fr/es). Helper functions are tested, data integrity is validated automatically, and a barrel export gives future slices a single import path.

## What Was Built

- `src/lib/data/types.ts`: TypeScript interfaces — `Locale`, `LocalizedString`, `Project`, `Service`, `SiteMeta`, `ProjectStatus`, `ProjectSection`, `SiteLinks`
- `src/lib/data/locale.ts`: `resolveLocale()` function, `DEFAULT_LOCALE`, `SUPPORTED_LOCALES`
- `src/lib/data/locale.test.ts`: 10 tests for locale resolution and fallback behavior
- `src/lib/data/projects.ts`: 2 seed projects + `getProjectBySlug`, `getFeaturedProjects`, `getPublicProjects`, `getAllTags`
- `src/lib/data/projects.test.ts`: 14 tests for all 4 helper functions
- `src/lib/data/services.ts`: 4 seed services (SQL dev, pipeline architecture, analytics, performance tuning)
- `src/lib/data/meta.ts`: Site metadata (name, tagline, description, links)
- `src/lib/data/data-integrity.test.ts`: 13 data validation tests (unique slugs, no empty fields, valid enums)
- `src/lib/data/index.ts`: Barrel re-export for all types, constants, data, and helpers

## Files Modified

- `docs/reference/ARCHITECTURE.md`: Added stack table, data layer section, and dependency listing
- `tree.txt`: Regenerated to reflect all new files

## How It Works

The data layer has three layers:

**1. Types (`types.ts`)** — The contract. `LocalizedString` is the key type: `{ en: string; fr?: string; es?: string }`. Every user-visible text field on `Project`, `Service`, and `SiteMeta` is a `LocalizedString` instead of a plain `string`. English is required; other locales are optional.

**2. Resolver (`locale.ts`)** — The bridge between data and UI. Components never read `project.title.en` directly. They call `resolveLocale(project.title, currentLocale)` and get back a plain `string`. The resolver checks the requested locale, treats empty strings as missing, and falls back to English. Simple, testable, centralized.

**3. Data files (`projects.ts`, `services.ts`, `meta.ts`)** — The content. English-only seed data today. French and Spanish will be added by filling in the optional `fr` and `es` fields — no interface changes needed.

**Using data in a component:**
```ts
import { getFeaturedProjects, resolveLocale } from '$lib/data';

const featured = getFeaturedProjects();
// In a Svelte 5 component:
// resolveLocale(project.title, 'fr') → French if present, English otherwise
```

## Decisions Made

| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| Helpers co-located in `projects.ts` | Tightly coupled to the projects array; co-location reduces indirection | Separate `helpers.ts` |
| Tests co-located in `src/lib/data/` | Follows Vitest glob pattern and slice 01 convention | Separate `tests/` dir |
| `readonly Project[]` not `as const` | Prevents literal-type over-narrowing that makes data incompatible with interfaces | `as const` assertion |
| Direct en fallback (no chain) | Predictable; no surprise French showing up when requesting Spanish | es → fr → en chain |
| Empty strings treated as missing | An empty `fr: ""` means "not translated", not intentional blank | Trust any non-undefined value |
| String icon identifiers in services | Decouples data from icon library — slice 03 picks the library | Import icons directly |

## What Yesid Should Know

**LocalizedString pattern:** Instead of `title: string`, you write `title: { en: "Transit Ops", fr: "Ops Transit" }`. It is like a lookup table: key is locale, value is the text. Components always go through `resolveLocale()` so fallback logic lives in one place. Think of it as `COALESCE(fr_text, en_text)` in SQL.

**Why bake i18n into the data layer now:** If you add it later, you refactor every interface, every data file, every component. Designing for it now means the pipes are ready. Adding French or Spanish later is just filling in optional fields — no schema migration needed.

**readonly arrays:** `readonly Project[]` means the array cannot be mutated after creation. This is enforced by TypeScript, not at runtime. It prevents accidental `projects.push(...)` calls elsewhere in the codebase.

**Data integrity tests:** `data-integrity.test.ts` is a guardrail. Add a duplicate slug, leave an `en` field empty, or misspell a status value — the test suite catches it at `bun run test`, not when a user sees a broken page.

**Resources:**
- TypeScript type aliases: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases
- SvelteKit i18n patterns: https://svelte.dev/docs/kit/i18n

## What Comes Next

**Slice 03 — Components:** Build the Svelte UI components (ProjectCard, ServiceCard, Nav, Footer) that consume this data layer. These components will call `resolveLocale()` and render the strings. Slice 02 gives them a complete, typed API to code against.

## How to Verify

1. `bun run test` — 41 tests pass (38 new + 3 from slice 01)
2. `bun run check` — 0 TypeScript errors, 0 warnings
3. TypeScript guard: add `const bad: Project = { ...project, title: { fr: "only french" } }` to any file and `bun run check` reports an error (missing required `en`)
4. Fallback: open the browser console and run `resolveLocale({ en: "Hello", fr: "Bonjour" }, 'es')` — returns `"Hello"`
