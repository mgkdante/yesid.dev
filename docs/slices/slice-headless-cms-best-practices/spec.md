# slice-headless-cms-best-practices — Spec

> **Single-level slice.** The slice IS the PR boundary (D19) — no sub-slice decomposition. All artifacts live at this level: `spec.md` (this file), `plan.md`, `research.md`, `devlog.md`, `handoff.md`.

## Metadata

| Field        | Value                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| Parent slice | none (top-level standalone — informs Slice 18 sub-slices but not a child of it)       |
| Status       | draft                                                                                 |
| Depends on   | Slice 18a + Slice 18b (both shipped 2026-04-21 — Payload infra + content model + seed) |
| Unblocks     | Slice 18c / 18d / 18e / 18f (they adopt this slice's FORMULA)                          |
| Size         | L — 3 sessions research, docs only, no code                                           |
| Sessions     | 3 (per user-selected deep-dive budget)                                                |
| Branch       | `slice-headless-cms-best-practices`                                                   |
| Sandbox      | sibling worktree at `~/Yesito/Projects/yesid-dev-cms-ux`, branch `slice-cms-ux-redesign` (experiment playground for Payload pattern verification; never merged without a dedicated downstream slice) |

## Goal

Research best practices for pairing a headless CMS with a modern frontend framework — **SvelteKit primary**, with comparative learnings from React/Next, Astro, Vue, Angular — and distill a **FORMULA** that:

1. Reshapes Slice 18b's currently-shipped flat-field schema (e.g., `home-content.heroTitle`, `home-content.bentoCard1Title`) into a composable authoring system.
2. Produces reusable patterns for future Payload + SvelteKit projects in the **custom / low-cost client** segment (the wedge where code-ownership and moderate budget both matter).

Output is docs only — no site or CMS code changes ship from this slice. Slice 18c–18f downstream will adopt the FORMULA.

## Why this slice

Slice 18a (PR [#29](https://github.com/mgkdante/yesid.dev/pull/29)) shipped Payload 3 + Neon + Vercel Blob infrastructure. Slice 18b (PR [#30](https://github.com/mgkdante/yesid.dev/pull/30)) shipped 5 collections + 10 globals + 73 seeded rows. The shape of those globals — flat fields like `heroTitle`, `heroSubtitle`, `heroCtaLabel`, `bentoCard1Title` — is a **1:1 port** of yesid.dev's previously hardcoded TypeScript data.

It works. It is also **form-hell**: the same hardcoded content, relocated to a different surface. Editors see a long form that maps one-to-one to a rigid page layout. No composition. No reuse. No drag-and-drop. Redesigning the home page = CMS schema migration.

Before any frontend service flips onto Payload (Slice 18c onward), the content model needs grounding in patterns that proven headless CMSes use at scale — blocks, portable text, dynamic zones, design tokens, visual preview, reusable content chunks. The research produces that grounding AND the reusable FORMULA for the custom/low-cost client offering.

## Non-goals

- **No CMS or frontend code changes on mainline.** This slice ships documentation. Sandbox experiments on the `yesid-dev-cms-ux` worktree branch are allowed but never merge without a dedicated downstream slice.
- **No stack change away from Payload.** Payload remains baseline; comparative research informs patterns we adopt INTO Payload.
- **No sales, proposal, pricing, or commercial-model research.** Deferred to a later project per user instruction.
- **No firm-operating-model or customer-journey research.** Deferred per user instruction.
- **No multi-stack delivery research** (Webflow / Shopify / WordPress client work). Those are different offerings in different slices.
- **No migration of the 73 seeded rows.** They stay as-is until Slice 18c–18f adopt the FORMULA.
- **No adoption of the FORMULA in yesid.dev or client code within this slice.** That's Slice 18c+ work.

## Research axes

Five axes executed across three sessions, producing sections of `research.md`.

| Axis | Focus | Sources to study |
|------|-------|------------------|
| **R1 — Content modeling patterns** | Blocks / portable text / dynamic zones / singletons / globals vs collections / embedded vs referenced. Heuristic: when does each pattern earn its complexity? | Payload, Sanity, Storyblok, Strapi, Prismic, TinaCMS, WordPress Gutenberg (authoring-UX reference only) |
| **R2 — Authoring ergonomics** | Visual preview, conditional fields, grouped/tabbed layouts, array UI + item previews, rich-text editors, reusable content chunks. What makes an editor feel at home. | Payload Live Preview, Sanity Studio V3 Presentation, Storyblok Visual Editor, Gutenberg block inserter |
| **R3 — Design tokens + theming in-CMS** | Editors pick from brand palette / type scale / spacing tokens (not raw hex/px). Theming variants (dark mode, campaign themes). Content-vs-style separation. | Sanity theme UI, Storyblok components, Payload custom fields, Tailwind v4 tokens |
| **R4 — CMS ↔ framework wiring** | SvelteKit primary; React/Next, Astro, Vue, Angular comparative. SSR vs ISR vs static, preview flows, type-safe integration, webhook revalidation, form actions, localized loads. What transfers across frameworks vs what's framework-specific. | Payload REST / Local API / GraphQL; SvelteKit adapter-vercel + `revalidateTag`; Next 15 app router; Astro content collections; Nuxt 3 content; comparative docs |
| **R5 — Recommendations for yesid.dev + custom/low-cost clients** | Distillation. (a) SvelteKit-specific content-model shape. (b) Concrete refactor direction for 18b's flat-field schema. (c) Reusable patterns for future Payload + SvelteKit custom/low-cost client projects. | Outputs of R1–R4 |

## Design decisions

### D1 — Single-level slice, slice IS the PR boundary

No sub-slice decomposition. The deliverable is a single cohesive research document with a distilled FORMULA. Splitting it into sub-slices would artificially fragment findings. One PR, one review, one merge. Aligns with the workflow plugin's D19 single-level-slice pattern.

### D2 — Comparative research, not landscape survey

Each axis studies 3–5 CMS products that solve the problem differently, extracting transferable patterns — not an exhaustive matrix of every CMS's feature list. Authoring UX is the criterion: every pattern answers *"does this make the editor's life better than a flat form?"*

### D3 — Payload remains baseline

Comparative research informs patterns we adopt INTO Payload — not stack migration. 18b's 73 seeded rows + the cms.yesid.dev deploy are load-bearing; moving off Payload would be a different (much larger) slice. If research surfaces a compelling reason to migrate, that's a **new slice proposal**, not an in-slice scope change.

### D4 — Pragmatic, actionable FORMULA

The FORMULA must be actionable — specific schema shapes, block definitions, refactor steps — not abstract principles. Acceptance requires a refactor table mapping each of 18b's 10 globals to a FORMULA-compliant shape (stays-as-is / convert-to-blocks / merge / split / drop).

### D5 — Sandbox worktree for pattern verification

An isolated worktree on yesid.dev-cms (`~/Yesito/Projects/yesid-dev-cms-ux`, branch `slice-cms-ux-redesign`) serves as a pattern-testing playground. Anything committed there stays on its branch. Never merges without a deliberate downstream slice under 18c+ explicitly adopting the verified pattern. Prevents research that says "X works" without evidence it works in Payload 3 specifically.

### D6 — Output is docs + memory updates, not code

On slice close, the PR contains: `spec.md`, `plan.md` (with FORMULA), `research.md`, `devlog.md`, `handoff.md`. Memory updates: `project_slice_18_status` (reshaped sub-slice sequence) and possibly `project_upcoming_slices`. Zero code diffs on the yesid.dev or yesid.dev-cms main branches.

## File-touch summary

- `docs/slices/slice-headless-cms-best-practices/spec.md` — this file
- `docs/slices/slice-headless-cms-best-practices/plan.md` — task-by-task research plan + FORMULA as final section (drafted after spec approval)
- `docs/slices/slice-headless-cms-best-practices/research.md` — accumulating working notes with citations (new file, beyond the workflow template)
- `docs/slices/slice-headless-cms-best-practices/devlog.md` — session-by-session history
- `docs/slices/slice-headless-cms-best-practices/handoff.md` — PR body, finalized at close

On slice close (outside this PR's code-diff surface):
- Memory: `project_slice_18_status.md` updated with reshaped 18c–18f sequence reflecting FORMULA
- Memory (possibly new): `project_webdev_formula.md` capturing durable pipeline patterns

No files touched in `src/` or `cms/` on mainline. Sandbox worktree commits live only on the `slice-cms-ux-redesign` branch of yesid.dev-cms.

## Acceptance criteria

- [ ] `research.md` exists, cited, with substantive findings for R1, R2, R3, R4 — each section has concrete examples from ≥3 CMS products
- [ ] `plan.md` has task-by-task research plan (one task per research axis + one distillation task) AND the final **FORMULA** section
- [ ] FORMULA specifies: block library shape, content-modeling heuristics, theming/token integration approach, authoring-UX conventions, framework-wiring patterns
- [ ] FORMULA includes a **refactor table** mapping each of 18b's 10 globals (`home-content`, `services-page`, `projects-page`, `blog-page`, `tech-stack-page`, `about-content`, `contact-content`, `nav-links`, `error-pages`, `site-meta`) to a FORMULA-compliant shape (stays-as-is / convert-to-blocks / merge / split / drop)
- [ ] `project_slice_18_status` memory updated with reshaped 18c–18f sub-slice sequence reflecting FORMULA
- [ ] Codex peer review captured in `handoff.md` per slice-close convention (per user's durable preference `feedback_codex_review_at_slice_close`)
- [ ] No code changes in yesid.dev or yesid.dev-cms main branches during this slice

## Open questions

- **Q1** — Is a separate `research.md` the right shape, or should raw findings live inline in `plan.md`? Default: separate `research.md` for readability. Resolve in Session 1 before R1 notes accumulate.
- **Q2** — Should the FORMULA include a concrete block-library schema (specific block definitions like `Hero`, `Bento`, `ServiceGrid` with field lists) or stay at heuristic level? Default per D4: concrete schema. Resolve in Session 3 distillation.
- **Q3** — Does the FORMULA keep `services-page` / `projects-page` / `blog-page` / `tech-stack-page` as intro-meta globals, or absorb them into a `pages` collection with blocks? Resolve in R5 distillation.
- **Q4** — Does Payload Live Preview require a published SvelteKit route before it's testable, or can we wire it against a dev-only route? Resolve during R2 / R4 sandbox experimentation.
- **Q5** — Should the FORMULA explicitly address localization (en / fr / es) as a first-class concern, or assume Payload's `localized: true` is sufficient and the FORMULA is locale-agnostic? Resolve in R1.

## Risks

- **Risk:** Research expands into firm-operating-model or commercial-strategy territory.
  **Impact:** Scope drift, slice never closes.
  **Mitigation:** Strict axes R1–R5, explicit non-goals list, reference them when scope pressure appears mid-session.

- **Risk:** FORMULA too abstract to be actionable for Slice 18c+ adoption.
  **Impact:** Slice ships docs that don't enable the next slice.
  **Mitigation:** D4 concrete-schema requirement + refactor-table acceptance criterion force specificity.

- **Risk:** Payload 3's actual API diverges from documented patterns in unexpected ways.
  **Impact:** FORMULA prescribes something Payload can't cleanly support.
  **Mitigation:** D5 sandbox worktree lets us verify each key pattern (blocks, conditional fields, Live Preview, hooks) against a real Payload deploy before committing it to the FORMULA.

- **Risk:** Research findings suggest migrating off Payload.
  **Impact:** Major scope change mid-slice.
  **Mitigation:** Payload is baseline per D3; any migration proposal becomes a separate slice with explicit cost/benefit, not an in-slice pivot.

- **Risk:** Three sessions is too optimistic for the scope.
  **Impact:** Slice spans 5+ sessions, loses momentum.
  **Mitigation:** R5 distillation is time-boxed to one session; if R1–R4 haven't produced enough material by then, we ship a narrower FORMULA and log unresolved axes as follow-up slice proposals rather than extending.

## Amendments log

Append-only record of spec changes after slice begins.

(empty at draft — first amendment lands post-approval if anything changes)
