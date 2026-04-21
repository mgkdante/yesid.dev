# Sub-Slice 17c — Zod Schema Validation

**Parent slice:** Slice 17 — Standardization (`../README.md`)
**Status:** planning (2026-04-20)
**Depends on:** 17b (hexagonal data layer + LocalizedString) merged, 15a (PageSeoSchema established at adapter boundary) merged, 15b (SchemaOrgNode discriminated union) merged
**Unblocks:** Slice 18 (Payload CMS) — Payload adapter must emit data that survives the same `.parse()` calls the static adapter does today
**Size:** M (single session, focused, decisions are mostly settled patterns from 15a/15b/17b)
**Est. Sessions:** 1

## Goal

Every adapter port returns data validated by a Zod schema. The schema layer is the runtime contract that any future adapter (Payload in Slice 18, mock in tests) must honor — not just a TypeScript build-time check.

## Why now

Three forces converge:

1. **17b shipped the seam.** `staticAdapter` is the single module that touches `$lib/content/*`. Every read flows through it. That's exactly one place to wire validation.
2. **15a/15b proved the pattern.** `PageSeoSchema.parse(raw)` runs inside `meta.forRoute` today (`src/lib/adapters/static.ts:121`). Repository + components consume already-parsed data with no extra ceremony. The pattern works; this slice generalizes it.
3. **Slice 18 needs the contract.** Payload's REST/Local API will deliver `unknown`-shaped JSON. Without Zod at the adapter, malformed Payload data would reach components silently (TypeScript trusts the cast). With Zod, the Payload adapter swap fails loudly at the boundary, which is where contract violations belong.

## Non-goals (deliberate scope guards)

- **Don't replace TypeScript interfaces.** Keep `src/lib/types.ts` as the primary type surface; schemas mirror those interfaces. Inferred Zod types stay internal to the schema module — components keep importing from `$lib/types`. Reason: switching to `z.infer` everywhere is a 200-file ripple that adds zero contract value over what the parse call already provides.
- **Don't validate the large site-content literals.** `heroContent`, `manifestoContent`, `proofReelContent`, etc. are already type-safe via `satisfies LocalizedString` (109 hits in `site-content.ts` alone). The `ContentPort` typing strategy (`typeof import('...').x`) preserves their exact shape. Re-encoding them as Zod adds maintenance cost with no Payload benefit (these are page chrome, not CMS-managed content).
- **Don't change error UX.** Loaders that today throw on missing data continue to throw; this slice swaps the throw type from `TypeError`/silent-undefined to a Zod parse error. Loader-level fallback logic (e.g., 404 redirects) stays unchanged.
- **Don't introduce `Result<T, E>` envelopes.** SvelteKit loaders catch thrown errors via the framework's `error()` helper. Returning `Result` would force every caller to unwrap. Throw-on-invalid is consistent with the existing `meta.forRoute` precedent.
- **Defer schema-derived test factories** to 17f (Test Architecture). 17c writes contract schemas; 17f wires them into mock builders.
- **Defer learning doc** (`docs/learn/data-layer/zod-validation.md`) to 17g (Learning Docs Refactor) — that slice owns the entire `docs/learn/` sweep.

## Design decisions

### D1 — Mirror, don't replace

Zod schemas live alongside TS interfaces. The TS interface in `$lib/types.ts` stays the authoritative shape; the Zod schema in `$lib/schemas/<domain>.ts` is the runtime mirror. A type-level `satisfies` check at the bottom of each schema module proves the two stay in lockstep:

```ts
// proof: schema.parse output is assignable to the TS interface
type _ProjectSchemaCheck = z.infer<typeof ProjectSchema> extends Project ? true : false;
const _projectSchemaCheck: _ProjectSchemaCheck = true;
```

When the TS interface evolves and the schema doesn't (or vice versa), this line fails to compile. Cheap drift detector, no runtime cost.

### D2 — Validate at the adapter boundary, never below

Every port method that returns content data ends with a `.parse()` call. Already true for `meta.forRoute` (PageSeoSchema). Generalize to:

- `projects.all()` → `z.array(ProjectSchema).parse(projects)`
- `projects.bySlug()` → `ProjectSchema.optional().parse(found)` (or `ProjectSchema.parse(found)` post-existence-guard)
- `services.all()`, `services.byId()`, …
- `blog.all()`, `blog.bySlug()`, …
- `meta.site()` → `SiteMetaSchema.parse(siteMeta)` (already-parsed for `forRoute`)
- `techStack.all()`, `techStack.byId()`, `techStack.allScenarios()`, `techStack.scenarioForDomains()`
- `content.aboutPage()` → `AboutContentSchema.parse(...)`
- `content.contactPage()` → `ContactContentSchema.parse(...)`
- `content.techStackPage()` → `TechStackPageContentSchema.parse(...)` *(new seam — added to `ContentPort` in Task 17c-2b; replaces direct import at `routes/tech-stack/+page.svelte`)*
- `content.skillsJourneyPanels()` → `z.array(JourneyPanelSchema).parse(...)`
- `content.heroMock()`, `content.initialHeroData()` → `HeroDataSchema.parse(...)`
- `content.navLinks()`, `content.menuItems()`, `content.metroBookends()`, `content.errorPage()` → respective schemas

Pure derived/utility ports (`projects.allTags`, `projects.allStackItems`, `blog.tagsForCategory`, `blog.html`, `blog.svgContent`, `techStack.connections`, etc.) return primitives or strings — no schema needed. The `content` site-chrome ports (`hero`, `manifesto`, `proofReel`, `servicesGrid`, `about`, `cta`, `closer`, `skillsJourneyCta`) keep `typeof import` typing per non-goal above.

### D3 — Strictness budget: mirror TS, don't tighten

Schemas match the TS interface as-is. We don't add `z.string().url()`, slug regex, email format, etc. unless the TS interface already encodes that constraint or the integrity test already enforces it. Reason: tightening at this slice introduces false positives for content that TypeScript accepts today, derailing the rollout. Tightening lives in a future "schema audit" pass (or per-field as needs arise).

Two narrow exceptions, already established in 15a:
- `LocalizedString.en` — enforces non-whitespace via `.refine` (matches integrity test invariant).
- Discriminated unions on existing TS string-literal types (`ProjectStatus`, `BlogCategory`, `BlogAnimation`, `Locale`, `InfraLayer`, `DomainCluster`, `Proficiency`, `HighlightEffect`, `SkillIcon`) — mirror as `z.enum([...])`. Free safety, no scope creep.

### D4 — Error shape: `z.ZodError` direct, with named entry points

Adapter parse calls let `ZodError` propagate. SvelteKit's error boundary handles them like any thrown error. To make stack traces readable, every parse call goes through a one-line wrapper that prefixes the port + method name:

```ts
// $lib/schemas/parse.ts
export function parsePort<T>(label: string, schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`[adapter.${label}] ${result.error.message}`);
  }
  return result.data;
}
```

Used as `parsePort('projects.all', z.array(ProjectSchema), projects)`. Error messages are immediately attributable to the port that produced bad data — critical for Payload debugging in Slice 18.

### D5 — Schema modules: one file per domain

Schemas group by domain, not by ad-hoc concerns. Final layout:

```
src/lib/schemas/
  jsonld.ts            (existing, 15b)        — SchemaOrgNode union
  seo.ts               (existing, 15a)        — PageSeoSchema, LocalizedStringSchema
  parse.ts             (new)                  — parsePort helper
  shared.ts            (new)                  — re-exports LocalizedStringSchema, common primitives (URL, slug, etc. if needed)
  project.ts           (new)                  — ProjectSchema, ProjectSectionSchema, ImpactMetricSchema, ProjectStatus enum
  service.ts           (new)                  — ServiceSchema, ServiceSectionSchema
  blog.ts              (new)                  — BlogPostSchema, BlogCategory + BlogAnimation enums
  meta.ts              (new)                  — SiteMetaSchema (+ SiteLinks/SiteAddress/SiteOwner)
  tech-stack.ts        (new)                  — TechStackItemSchema, TechRelationSchema, StackScenarioSchema, enums
  about-page.ts        (new)                  — AboutContentSchema (+ all nested About* schemas)
  contact-page.ts      (new)                  — ContactContentSchema (+ all nested Contact* schemas)
  nav.ts               (new)                  — NavLinkSchema, MenuItemSchema, MetroBookendsSchema, ErrorPageContentSchema
  hero-data.ts         (new)                  — HeroDataSchema (+ HeroMetric, HeroQueryRow)
  journey.ts           (new)                  — JourneyPanelSchema (+ JourneySkill, enums)
  tech-stack-page.ts   (new)                  — TechStackPageContentSchema (meta + hero + actions + cta; closes 17b seam leak)
  index.ts             (new barrel)           — re-export everything
```

`LocalizedStringSchema` lives in `seo.ts` today; move-or-re-export from `shared.ts` so the rest of the schema files can import it without dragging the SEO graph along. Existing `seo.ts` keeps its own re-export for back-compat.

### D6 — Integrity tests: keep, but layer

`src/lib/content/integrity.test.ts` (380 lines) stays. It encodes cross-entity invariants Zod cannot express (e.g., "every project's `relatedServices` IDs reference an existing service ID"). What it loses is the per-field assertions (slug regex, status enum, LocalizedString.en non-empty) that a parse call now covers. Trim those to one parse-pass-success test per data file plus the cross-entity invariants. Net: ~150 lines down, semantics unchanged.

### D7 — `image` field semantics for projects

`Project.image` is `string | undefined` (filename of a static asset). The existing TS interface accepts any string. Zod mirror keeps this — we DON'T tighten to `.url()` (would break local filenames) or `.regex(/\.(png|jpg|webp)$/)` (out of strictness budget per D3).

### D8 — Close two 17b seam leaks found by pre-implementation audit

A parallel audit (Claude Explore + Codex) before implementation confirmed the plan's wrap matrix is correct (55/55 port methods) and seed data is schema-ready, but surfaced two direct-import leaks from `$lib/content/*` that bypass `staticAdapter`:

1. **`src/routes/tech-stack/+page.svelte:6`** runtime-imports `techStackPageContent` — an orphan chrome blob structurally identical to `aboutPage`/`contactPage` but never exposed as an adapter port. **Fix:** add `content.techStackPage()` to `ContentPort` + `TechStackPageContentSchema` (Task 17c-2b); route consumes it via `repositories/content.ts`.
2. **`src/lib/utils/service-svg.ts:11`** runtime-imports the `services` array to filter `s.svg`. **Fix:** change `fetchServiceSvgContents(fetchFn)` → `fetchServiceSvgContents(fetchFn, services: readonly Service[])`; the 3 callers (route loaders for projects, services listing, service detail) already load services via the adapter and thread the array in (Task 17c-6).

Why address here, not defer: both leaks falsify D2's "adapter is the only seam" claim. Deferring means the `TechStackPageContentSchema` entry stays empty and the `service-svg` util silently bypasses whatever validation 17c adds. A 5-step task + 1 util refactor preserves the contract. M-size discipline holds (9 tasks instead of 8).

## File-touch summary

**New** (~15 files): everything in `src/lib/schemas/` listed above plus colocated `*.test.ts` for the schemas with non-trivial logic (parse.ts, the discriminated unions, LocalizedString refinement re-test if not covered by 15a).

**Modified**:
- `src/lib/adapters/types.ts` — extend `ContentPort` with `techStackPage: () => Promise<TechStackPageContent>` (Task 17c-2b)
- `src/lib/adapters/static.ts` — add `parsePort()` wrappers around each content-returning port method (~13 wrap sites incl. new `techStackPage`)
- `src/lib/repositories/content.ts` — add `getTechStackPageContent()` delegator (Task 17c-2b)
- `src/lib/utils/service-svg.ts` — refactor `fetchServiceSvgContents` signature to accept `services: readonly Service[]` instead of importing `$lib/content/services` directly (Task 17c-6)
- `src/routes/tech-stack/+page.ts` (create if absent) / `+page.svelte` — consume `techStackPageContent` via repository rather than direct import (Task 17c-6)
- `src/routes/projects/+page.ts`, `src/routes/services/+page.ts`, `src/routes/services/[id]/+page.ts` — thread services array into `fetchServiceSvgContents` call (Task 17c-6)
- `src/lib/content/integrity.test.ts` — trim per-field assertions superseded by Zod, keep cross-entity invariants, add one "parses through schema" smoke test per data file
- `src/lib/schemas/seo.ts` — re-export `LocalizedStringSchema` from `shared.ts` (no behavior change)
- `docs/reference/ARCHITECTURE.md` — one paragraph + table row noting the schema layer between adapter and repository

**Untouched** by design: `$lib/types.ts`, every component outside the tech-stack route, every test outside `integrity.test.ts` and `schemas/*.test.ts`. Components that import site-chrome literals (`heroContent`, `manifestoContent`, etc.) stay direct-import per D2 non-goal — those are `typeof import(...)` literal types, not runtime data through the seam.

## Acceptance criteria

- `bun run test` passes (incl. new schema test files + trimmed integrity tests).
- `bun run check` passes (incl. the `_SchemaCheck` proof lines).
- `bun run build` succeeds.
- Every `ContentAdapter` port method that returns content data parses through a schema (verified by grep: `parsePort\|\.parse(` in `static.ts` covers every non-utility return).
- Schema files exist for all 15 domain areas listed in D5.
- `src/lib/utils/service-svg.ts` contains zero imports from `$lib/content/*` (verified by grep) — 17b seam leak closed.
- `src/routes/tech-stack/+page.svelte` contains zero imports from `$lib/content/*` — chrome content arrives via `+page.ts` load function through the repository (17b seam leak closed).
- Drift detector lines (`type _XSchemaCheck = ... extends ... ? true : false`) compile in every schema file.
- A deliberately broken seed value (e.g., temporarily setting a project's `status` to `'archived'`) produces a parse error tagged `[adapter.projects.all] ...` — sanity-checked manually during implementation, no automated test for this (the `safeParse` wrapper itself is unit-tested in `parse.test.ts`).
- ARCHITECTURE.md table reflects the schema layer.

## Open questions (resolve at implementation time)

- **Q1.** When `projects.bySlug` returns `undefined` (not-found), do we wrap `ProjectSchema.optional()` or guard externally? Decision: wrap `.optional()` — it's one parse call covering both branches, mirrors the `Promise<Project | undefined>` port signature exactly.
- **Q2.** Should `parsePort` log to console on failure before throwing? Decision: no — SvelteKit logs the thrown error already; double-logging clutters dev console.
- **Q3.** Does the `ContentPort` (site-chrome) get any schemas? Decision: no, per non-goal. If a Payload field ever supersedes one of these (e.g., site-wide `heroContent` becomes CMS-managed), add a schema then.

## Amendments log

| Date | Change | Why |
|------|--------|-----|
| 2026-04-20 | Initial spec | Plan 17c at session open |
| 2026-04-20 | +D8 scope expansion: `content.techStackPage()` port + `service-svg.ts` param injection | Pre-implementation audit (Claude Explore + Codex) flagged two pre-existing 17b seam leaks. Fixing in 17c keeps spec D2's "adapter is the only seam" claim honest; still M-size (9 tasks vs 8). |
