# Sub-Slice 15c — Per-Route OG Image Generation (Satori)

**Status:** deferred — book it, build after Slice 18 (Payload CMS)
**Parent slice:** Slice 15 (`../README.md`)
**Depends on:** 15a ✓ required, 15b ✓ required, **Slice 18 (Payload CMS)** recommended
**Est. Sessions:** 1

## Why deferred

Per the Slice 15 brainstorm (2026-04-19): auto-generating OG images per blog / project at build time is a polish layer. Payload will supply `coverImage` fields for blog posts and projects once Slice 18 lands; the Satori generator should draw from those fields rather than from TypeScript sources that are about to be retired. Shipping 15c before Payload means re-plumbing the image generator's data source. Shipping after means one-and-done.

Meanwhile 15a ships a good-enough default (one branded 1200×630 that every route falls back to) and 15b ships the structured-data win. Client-visible results already land without 15c.

## Intended scope (for when it's time)

- Add `@vercel/og` or `satori` + `resvg-js` to dev dependencies
- Build a `scripts/generate-og-images.ts` that iterates blog posts + projects, renders a branded template (title + date/summary + wordmark on dark card with orange accent), emits to `static/og/{type}-{slug}.{locale}.png`
- Extend `PageSeoSchema.ogImage` override path to point at generated files
- Per-locale variants: regenerate when FR/ES translations land
- Wire into build: `bun run generate:og` before `bun run build`; changes committed as content
- Cache generated images via content hash so unchanged posts don't regenerate

## Acceptance criteria (when built)

- [ ] Every public blog post has a generated OG image at `static/og/blog-{slug}.en.png` (plus locale variants for published locales)
- [ ] Every public project has a generated OG image at `static/og/project-{slug}.en.png`
- [ ] `SeoHead` picks up the generated image when no explicit `ogImage` override is set
- [ ] Share-preview tests (LinkedIn / Twitter / Slack / opengraph.xyz) render the generated image correctly for 3 blog posts + 3 projects
- [ ] Image generation is deterministic: same input produces byte-identical output so git diffs are clean across rebuilds

## Amendments log

| Date | Change | Why |
|------|--------|-----|
| 2026-04-19 | Created as deferred placeholder | Locked in during Slice 15 brainstorm so the follow-up is booked, not forgotten |
