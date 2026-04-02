# Slice 02 — Data Layer

**Status:** ready
**Priority:** 1
**Estimated effort:** 1 session
**Depends on:** 01 (complete)

## Objective

Create the typed, i18n-ready data layer that powers every page on the site. After this slice, all content lives in data files with localization support, all interfaces are defined, and helper functions are tested.

## Context

The site is data-driven and multilingual. The owner is a Colombian based in Montreal (Quebec), targeting transit industry employers (French-speaking) and Upwork clients (English + Spanish-speaking). The data layer must support English, French, and Spanish from day one, even if only English is filled initially.

The interfaces defined here become the contract between data and UI. Components (slice 03) and pages (slices 05-07) will consume this data through helper functions that accept a locale parameter.

## Acceptance Criteria

- [ ] A `LocalizedString` type defined (supports `en`, optional `fr` and `es`)
- [ ] TypeScript interfaces defined for Project, Service, and SiteMeta using LocalizedString for user-facing text
- [ ] `src/lib/data/projects.ts` exports a typed Project array with at least 2 seed projects (English only is fine)
- [ ] `src/lib/data/services.ts` exports a typed Service array with 4 services
- [ ] `src/lib/data/meta.ts` exports a typed SiteMeta object
- [ ] A locale utility that resolves a LocalizedString to the best available language (requested locale, fallback to `en`)
- [ ] Helper functions: `getProjectBySlug`, `getFeaturedProjects`, `getPublicProjects`, `getAllTags`
- [ ] Unit tests for all helper functions (including edge cases: invalid slug, no featured projects, empty tags)
- [ ] Unit tests for locale resolution (returns French when available, falls back to English when not, handles missing locale gracefully)
- [ ] Unit tests validating data integrity (unique slugs, required fields present, no empty strings on required fields)
- [ ] All tests pass with `bun run test`
- [ ] tree.txt updated
- [ ] Dev log written
- [ ] Handoff report written (include "What Was Built" and "Files Modified" sections)

## Technical Spec

### Localization Approach

Define a `LocalizedString` type. English is always required, French and Spanish are optional. When a component asks for text in French but only English exists, it gets English. No crashes, no empty strings.

Supported locales: `en`, `fr`, `es`
Default locale: `en`

Create a resolver function that takes a `LocalizedString` and a locale code, returns the best available string.

### Interfaces

Create a types file at `src/lib/data/types.ts`.

**LocalizedString:**
- en (string, required)
- fr (optional string)
- es (optional string)

**Project:**
- slug (string, unique, URL-safe, NOT localized)
- title (LocalizedString)
- oneLiner (LocalizedString)
- description (LocalizedString)
- stack (string array, NOT localized, tech names are universal)
- tags (string array, NOT localized)
- status ('public' | 'private' | 'wip')
- featured (boolean)
- repoUrl (optional string)
- liveUrl (optional string)
- sections (array of { title: LocalizedString, content: LocalizedString })

**Service:**
- title (LocalizedString)
- description (LocalizedString)
- icon (optional string)

**SiteMeta:**
- name (string, NOT localized, brand name is always "yesid.")
- tagline (LocalizedString)
- description (LocalizedString, for SEO meta)
- links object with: email, github, linkedin (optional), upwork (optional), all strings NOT localized

### Data Files

**`src/lib/data/projects.ts`** — Seed with at least 2 projects. English content only for now, French and Spanish fields left undefined. Include one `featured: true` and one `status: 'private'` to exercise filters.

**`src/lib/data/services.ts`** — Four services:
- SQL development & optimization
- Data pipeline architecture
- Analytics & reporting systems
- Database performance tuning

English descriptions only for now. 1-2 sentences each.

**`src/lib/data/meta.ts`** — Site metadata:
- name: "yesid."
- tagline: "Data infrastructure that moves." (English, French and Spanish to be added later)
- links: contact@yesid.dev, github.com/mgkdante, https://www.upwork.com/freelancers/~011ba4ec420b4cdd82, https://www.linkedin.com/in/otaloray/

### Helper Functions

- `getProjectBySlug(slug)` — returns Project or undefined
- `getFeaturedProjects()` — returns Project[] where featured === true
- `getPublicProjects()` — returns Project[] where status !== 'private'
- `getAllTags()` — returns deduplicated, sorted string[]
- `resolveLocale(localizedString, locale)` — returns the best available string for the given locale

Claude Code decides where helpers live (separate file or co-located).

### Tests

Cover:
- Each helper function with valid and invalid inputs
- `resolveLocale` with: locale available, locale missing (fallback to en), all three locales
- Data integrity: unique slugs, no empty required fields, valid status values

## Out of Scope

- No locale routing (`/fr/`, `/es/` URL prefixes) in this slice. That's a layout/routing concern for slices 04-06.
- No components consuming this data
- No translation of content into French or Spanish (just the structure)
- No API routes
- No markdown rendering

## Learning Notes

**LocalizedString pattern:** Instead of `title: string`, you write `title: { en: "Transit Ops", fr: "Ops Transit" }`. It's like having a lookup table: the key is the locale, the value is the text. Components always call `resolveLocale(project.title, currentLocale)` to get the right string. If French isn't filled in yet, they get English. No crashes.

**Why bake i18n into the data layer now:** If you add it later, you refactor every interface, every data file, every component that touches text. Designing for it now means the pipes are ready. You fill in French and Spanish when you're ready. It's like adding nullable columns to a table at creation time vs altering 50 tables later.

**Fallback chain:** `resolveLocale({ en: "Hello", fr: "Bonjour" }, 'es')` returns "Hello" because Spanish isn't available, so it falls back to English. English is the guaranteed fallback. Think of it like `COALESCE(es_text, fr_text, en_text)` in SQL.

- TypeScript handbook (type aliases): https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases
- SvelteKit i18n patterns: https://svelte.dev/docs/kit/i18n

## Verification Steps

1. `bun run test` passes all new tests
2. `bun run check` passes (TypeScript compiles)
3. Adding a Project with a missing `en` field in title causes a TypeScript error
4. Adding a Project with only `en` filled compiles fine (fr/es are optional)
5. `resolveLocale` returns correct fallback behavior
6. tree.txt reflects the new data files
