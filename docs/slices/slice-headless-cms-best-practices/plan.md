# slice-headless-cms-best-practices — Plan

> **Single-level slice plan.** This slice's spec (`spec.md`) is the only spec — no parent slice. Tasks below run directly; they are the full research plan. FORMULA section at the bottom is the durable output, populated during Task 5.

**Spec:** [spec.md](spec.md)
**Devlog:** [devlog.md](devlog.md)
**Handoff (PR body):** [handoff.md](handoff.md)
**Research notes (created in Task 1):** [research.md](research.md)

## Canonical commands

This slice is docs-only — no production build, test, or lint of yesid.dev code. Verification is reviewing markdown content quality + confirming sandbox experiments behave as research claims.

| Purpose                   | Command                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Preview docs              | read files directly in editor                                                                        |
| Commit slice artifacts    | `git add docs/slices/slice-headless-cms-best-practices/ && git commit -m "..."`                      |
| Sandbox — CMS dev server  | `cd ~/Yesito/Projects/yesid-dev-cms-ux && bun dev` (Payload admin at http://localhost:3000/admin)    |
| Sandbox — CMS build check | `cd ~/Yesito/Projects/yesid-dev-cms-ux && bun run build`                                             |
| Sandbox — yesid.dev route | `bun dev` in this worktree (for scratch SvelteKit routes verifying R4 wiring)                        |
| Codex peer review         | manual — Yesid runs Codex against the slice on close per `feedback_codex_review_at_slice_close.md`   |

Sandbox commits stay on the `slice-cms-ux-redesign` branch of yesid.dev-cms and are reference-only — never merge without a downstream implementation slice.

## Session layout

**Original plan (pre-pivot, now historical):**
- Session 1 — R1 content modeling (Task 1) ✅ SHIPPED
- Session 2 — R2 + R3 authoring UX + theming (Tasks 2–3) — R2 shipped; R3 superseded
- Session 3 — R4 + R5 + close (Tasks 4–6) — R4/R5 superseded; Task 6 = close

**Actual execution (post-pivot 2026-04-22):**
- Session 1 — Task 1 shipped (R1 content modeling)
- Session 2 — Task 2 shipped (R2 authoring ergonomics + real-user sentiment)
- Session 2.5 + 2.5b — interstitial 3-stack sanity-check + Payload-vs-Directus deep dive (not in original plan — added after Task 2's brutal Payload calibration prompted re-evaluation)
- Session 3 — **PIVOT DECIDED** — Tasks 3–5 superseded as Payload-specific; equivalent Directus research goes to new slice `slice-directus-research`. Task 6 (close) executed with pivot decision as the slice's deliverable.

Each session starts by appending a block to `devlog.md`. Each task follows the Iteration Protocol: implement, verify, **STOP**, await approval, next.

## Tasks

### Task 1 — R1: Content modeling patterns research

- **Goal:** Populate `research.md` §R1 with cited findings on content modeling patterns across Payload, Sanity, Storyblok, Strapi, Prismic, TinaCMS, Gutenberg. Answer the heuristic: *when does each pattern (blocks / portable text / dynamic zones / singletons / globals-vs-collections / embedded-vs-referenced) earn its complexity, and when is it tax?*
- **Steps:**
  1. Create `research.md` with section skeleton: §R1–§R5 + §Sources + §Open questions.
  2. Read Payload 3 docs on: Blocks field, Array fields, globals vs collections, Relationships, Nested Docs plugin, versions/drafts, localization (`localized: true`).
  3. Read comparative docs: Sanity portable text + object/array schema; Storyblok nestable blocks + components; Strapi dynamic zones + components; Prismic slices + slice machine; TinaCMS templates + inline edit; WordPress Gutenberg (authoring-UX reference only — not for adoption).
  4. Tag each pattern by: *when it earns complexity* (use case + evidence) vs *when it adds tax* (over-engineering sign).
  5. Sandbox-verify (CMS-UX worktree): add a throwaway `Test_Blocks` collection with 2 block types (e.g., `Hero`, `TextSection`) to confirm Payload 3's block field behaviors match docs. Note any Payload-specific surprises in research.md.
  6. Synthesize §R1 conclusion: heuristics table for when to use each pattern. Resolve spec Q3 (globals vs pages-collection) and Q5 (localization) if R1 gives enough material; otherwise flag for R5 distillation.
- **Verification:** `research.md` §R1 has ≥3 CMS products cited with concrete examples; heuristics table written; Q3 + Q5 resolved or flagged; sandbox experiment builds cleanly (`bun run build` in CMS-UX worktree). Append session block to `devlog.md`.

**STOP. Yesid reviews R1 findings before Task 2.**

### Task 2 — R2: Authoring ergonomics research

- **Goal:** Populate `research.md` §R2 with study of visual preview, conditional fields, grouped/tabbed layouts, array UI + item previews, rich-text editors, reusable content chunks. Criterion: *what makes an editor feel at home vs lost.* **Expanded scope (2026-04-22 user request):** include real user reviews, not just vendor docs.
- **Steps:**
  1. **Vendor docs:** Study Payload Live Preview plugin docs + its SvelteKit integration notes.
  2. **Vendor docs:** Study Sanity Studio V3 Presentation (visual editing) for vocabulary: document types, references vs inline, preview targets.
  3. **Vendor docs:** Study Storyblok Visual Editor's block drag-drop + inline editing.
  4. **Vendor docs:** Study Gutenberg block inserter as authoring-UX reference (NOT adoption — just vocabulary).
  5. **Real user reviews (NEW):** Pull editor + developer sentiment from: r/webdev, r/payloadcms, r/Sanity, r/headlessCMS, Payload/Sanity/Storyblok Discord communities, Twitter/X, Dev.to posts, G2 / Capterra reviews, freelancer forums. Specifically hunt for: (a) what editors actually complain about in production (not what vendors claim); (b) what devs say about admin UX DX; (c) learning-curve pain points. Parallel-dispatch 2–3 research agents to triangulate.
  6. Catalog field-level ergonomics across these CMSes: conditional fields, field groups, tabs, row layouts, array UI + item previews, Lexical rich text, embedded content, admin custom components.
  7. Sandbox-verify (CMS-UX worktree): install Payload Live Preview plugin, wire against a scratch SvelteKit preview route in this slice's worktree. Resolve spec Q4 (Live Preview testability before a route is published).
  8. Synthesize §R2: the authoring-ergonomics checklist the FORMULA's schema must enable, **calibrated against real user pain points — not just docs claims**.
- **Verification:** `research.md` §R2 complete with ≥3 CMS studied via docs AND ≥2 cited user-review sources per CMS; ergonomics checklist written; Q4 resolved; Live Preview sandbox wiring verified end-to-end. Append `devlog.md` block.

**STOP. Yesid reviews R2 findings before Task 3.**

### Task 3 — R3: Design tokens + theming in-CMS research — **SUPERSEDED BY PIVOT 2026-04-22**

> Task 3 was Payload-specific. After Task 2 + Task 2.5 + Task 2.5b research concluded Directus is the better stack, equivalent design-token-in-CMS research for Directus moves to new slice `slice-directus-research`. Task 3 closed as `n/a — pivot`.

#### Original Task 3 definition (preserved for historical record)

- **Goal:** Populate `research.md` §R3. How do editors pick from a brand palette / type scale / spacing tokens rather than raw hex/px? How are theming variants (dark mode, campaign themes) exposed? How cleanly can content be separated from style?
- **Steps:**
  1. Study Sanity's theme UI customization + Studio custom input components.
  2. Study Storyblok components with select-from-token-list fields.
  3. Study Payload's custom-field API (`ui.Field` components) — what it takes to surface a token picker vs raw color input.
  4. Study Tailwind v4 `@theme` token exposure + CSS var distribution (yesid.dev's existing approach per memory `reference_tailwind_v4_theme`).
  5. Propose integration shape: CMS field surfaces token *keys* (e.g., `"accent-strong"`); frontend resolves via CSS var (`var(--accent-strong)`). Compare against raw-value alternative.
  6. Catalog theming-variants patterns (light/dark, campaign/season, brand-level) in each CMS.
  7. Sandbox-verify (CMS-UX worktree): add a `ColorToken` custom field to one throwaway block; confirm editor UX is sensible (select from project tokens, not unbounded color picker). Capture screenshot path in research.md.
  8. Synthesize §R3: the tokens-in-CMS integration shape + theming-variants pattern for the FORMULA.
- **Verification:** `research.md` §R3 complete with integration shape + sandbox confirmation + screenshot. Append `devlog.md` block.

**STOP. Yesid reviews R3 findings before Task 4.**

### Task 4 — R4: CMS ↔ framework wiring research — **SUPERSEDED BY PIVOT 2026-04-22**

> Task 4 was Payload-centric (SvelteKit + Payload Live Preview + Zod boundary). Directus equivalent moves to new slice `slice-directus-research`. Task 4 closed as `n/a — pivot`. Enough Payload+SvelteKit wiring evidence surfaced during Task 2.5 interstitial (Issue #7164 postMessage bug, archived community starter Nov 2025) to inform the pivot; no need to complete the full R4 treatment on Payload.

#### Original Task 4 definition (preserved for historical record)

- **Goal:** Populate `research.md` §R4. SvelteKit-primary integration patterns; React/Next/Astro/Vue/Angular comparative. What transfers across frameworks vs what's SvelteKit-specific?
- **Steps:**
  1. SvelteKit deep dive: Payload REST vs Local API vs GraphQL trade-offs; `+page.server.ts` load with `fetch`; ISR via `adapter-vercel` + `revalidateTag`; form actions with Payload Form Builder plugin; image optimization for Vercel Blob-hosted media; Lexical → HTML rendering in Svelte; preview route wiring; localized load flow.
  2. Comparative read (lighter): Next.js 15 app router + Payload (primary reference docs); Astro content collections; Nuxt 3 content. Extract what transfers (fetch-then-cache, webhook-to-revalidate) vs what's SvelteKit-specific.
  3. Decide REST vs Local API vs GraphQL for yesid.dev: Local API only available if we run SvelteKit inside the Payload Next.js app (not our topology — separate repos); so REST + GraphQL are the two live options. Pick one + rationale.
  4. Sandbox-verify (THIS worktree — yesid.dev slice worktree): build a scratch SvelteKit route that fetches a Payload doc via the chosen API, renders it, and invalidates cache via `revalidateTag` on a mock publish. Just enough to confirm wiring.
  5. Synthesize §R4: SvelteKit-wiring recipe + transfer-map for other frameworks.
- **Verification:** `research.md` §R4 complete; scratch SvelteKit route works (renders fetched doc; revalidation flushes cache); chosen API justified. Append `devlog.md` block.

**STOP. Yesid reviews R4 findings before Task 5.**

### Task 5 — R5: Distillation → FORMULA — **SUPERSEDED BY PIVOT 2026-04-22**

> Task 5 was the Payload FORMULA distillation + 18b globals refactor table. Under the pivot, the Payload FORMULA has no target — 18b's 10 globals become migration-source for the Directus rebuild (18e), not a refactor target under Payload's primitives. Equivalent Directus FORMULA distillation moves to `slice-directus-research`. Task 5 closed as `n/a — pivot`.

#### Original Task 5 definition (preserved for historical record)

- **Goal:** Synthesize R1–R4 into the **FORMULA** section of this `plan.md` (the section below). Must be actionable — concrete schemas, named blocks, refactor table — not abstract principles (spec D4).
- **Steps:**
  1. Draft the FORMULA section below. Sections per the expected structure: block library baseline, content-modeling heuristics, design-token integration, authoring-UX conventions, SvelteKit-wiring recipe, localization treatment, archetype-fit notes.
  2. Build the **refactor table**: each of 18b's 10 globals (`home-content`, `services-page`, `projects-page`, `blog-page`, `tech-stack-page`, `about-content`, `contact-content`, `nav-links`, `error-pages`, `site-meta`) → FORMULA-compliant shape (`stays-as-is` / `convert-to-blocks` / `merge` / `split` / `drop`). Include rationale per row.
  3. Resolve remaining open questions Q1–Q5 into design decisions; promote to spec's Amendments log.
  4. Walk FORMULA mentally through an adversarial archetype (politician+merch from earlier brainstorming) — does it handle platform pages + events + forms + small commerce? If not, note gap as follow-up slice proposal (not in-slice work).
- **Verification:** FORMULA section complete with refactor table; all Q1–Q5 closed; spec Amendments log updated; devlog updated.

**STOP. Yesid reviews FORMULA before Task 6 (close).**

### Task 6 — Slice close (EXECUTED 2026-04-22 with PIVOT DECISION)

> Task 6 reshaped at execution to reflect the pivot-to-Directus outcome. Memory updates, PR body, and Slice 18 roadmap reshape now codify the pivot rather than the Payload-specific FORMULA originally planned.

#### Original Task 6 definition (adapted for pivot close)

- **Goal:** Reshape Slice 18 roadmap in memory, capture Codex adversarial peer review, finalize `handoff.md`, open PR.
- **Steps:**
  1. Update `project_slice_18_status.md` memory: 18c–18f sub-slice sequence reshaped to adopt the FORMULA. Specifically — 18c narrows to "type-sync infra + first global flip on FORMULA-compliant shape"; 18d/18e/18f absorb FORMULA's block library.
  2. If warranted, create new memory `project_webdev_formula.md` with durable pipeline patterns for future Payload+SvelteKit custom/low-cost clients.
  3. Draft `handoff.md` PR body: **Summary** (research artifacts + reshaped roadmap) / **What changed** (spec, plan w/ FORMULA, research.md, reshaped 18c-18f) / **Verification** (docs-only, no code diffs in mainline) / **Follow-ups** (Slice 18c adoption; possible new slices for block-library implementation, archetype-specific pipelines, etc.).
  4. Trigger Codex peer review per `feedback_codex_review_at_slice_close.md`. Capture findings in `handoff.md` §Peer review notes. Address or accept-with-rationale.
  5. Open PR via `gh pr create` targeting `main`. Bundle includes: `spec.md`, `plan.md` (with FORMULA), `research.md`, `devlog.md`, `handoff.md`.
  6. Append final close block to `devlog.md`.
  7. Archive slice bundle to cloud per project convention (memory `project_completed_slices.md` pattern).
- **Verification:** PR opened; `handoff.md` finalized with peer review; memories updated; **every acceptance criterion in `spec.md`** checked.

**STOP. Yesid approves PR. Slice close complete on merge.**

---

## FORMULA — SUPERSEDED BY PIVOT TO DIRECTUS

The original intent was a **Payload-specific FORMULA** distilled in Task 5. That output is moot under the pivot — the formula for this stack is pivoting, and the Payload-specific patterns (block library, Zod boundary shapes for Payload's response formats, Lexical-constrained-for-short-form, 22-item ergonomics checklist against Payload's bare-bones defaults, etc.) become **migration-relevant facts** rather than the shipped formula.

### The actual FORMULA output of this slice

**The FORMULA this slice produced is the pivot decision itself**, grounded in:

1. **12 content-modeling heuristics** (research.md §R1) — transferable to Directus; they are CMS-agnostic principles
2. **22-item ergonomics checklist** (research.md §R2.5) — most items are Directus defaults; the checklist simplifies from 22 to ~5-7 items for a Directus FORMULA
3. **Q3 resolution (globals vs pages-collection)** — transferable as a content-modeling decision; Directus has both patterns (singletons + collections) so Q3 re-opens under `slice-directus-research` with the same question against Directus's primitives
4. **Q5 resolution (localization inside blocks)** — transferable as a principle; Directus's Translations pattern expresses it differently (junction tables) but the principle (locale-per-field, shared layout) holds
5. **Cross-CMS pattern map** — universal headless-CMS vocabulary (polymorphic section array = blocks = M2A = dynamic zones = slices = templates)
6. **Brutal Payload calibration evidence** — Lexical a11y Issue #8653, blocks-at-scale Discussion #12099, #7164 SvelteKit postMessage, Figma acquisition trajectory
7. **Decisive Directus evidence** — Agent J admin UX 23/25 win, Agent K 3-year risk 7.5/10, native MCP v11.13, 7 official SvelteKit tutorials, $19.5M VC-funded founder-led trajectory

### The actual refactor table — 18b's 10 globals

Under the pivot, the table is **not "refactor in Payload"** but **"migrate to Directus"**:

| 18b global | Payload state (2026-04-21) | Directus target | Migration notes |
|------------|----------------------------|------------------|------------------|
| `home-content` | flat fields on global | TBD — Directus singleton OR row in `pages` collection (decided in `slice-directus-research` Q3 re-open) | Migrate fields as-is; decide pages-collection shape first |
| `services-page` | flat fields on global | Same decision | Same |
| `projects-page` | flat fields on global | Same decision | Same |
| `blog-page` | flat fields on global | Same decision | Same |
| `tech-stack-page` | flat fields on global | Same decision | Same |
| `about-content` | flat fields on global | Same decision | Same |
| `contact-content` | flat fields on global | Same decision | Same |
| `nav-links` | global (true singleton) | Directus singleton | 1:1 mapping |
| `error-pages` | global (true singleton) | Directus singleton | 1:1 mapping |
| `site-meta` | global (true singleton) | Directus singleton | 1:1 mapping |

**Full migration spec:** `slice-directus-research` produces the definitive mapping after the Q3 re-open decision.

### Reshape of Slice 18c–18g

See `docs/slices/slice-18/README.md` for the rewritten roadmap (18c = research, 18d = scorched-earth rebuild, 18e = content migration, 18f = frontend rewire, 18g = DNS cutover + parallel run + sunset).

### Archetype-fit notes

**Still out of scope** this slice per original spec non-goals. Follow-up slices post-launch when real clients surface.

---

*Task 5's original FORMULA structure (below, preserved for historical record) is no longer applicable — its output shape is a Payload FORMULA that the pivot makes moot.*

### Expected structure (ORIGINAL plan, not executed — pivot made it moot)

1. Block library baseline
2. Content-modeling heuristics
3. Design-token integration
4. Authoring-UX conventions
5. SvelteKit-wiring recipe
6. Commercial viability snapshot
7. Refactor table for 18b's 10 globals
8. Reshape of Slice 18c–18f
9. Archetype-fit notes

### Expected structure (filled in Task 5)

1. **Block library baseline** — the named blocks every Payload + SvelteKit project starts with, with field schemas. Candidates (to be validated by research): `Hero`, `Bento`, `ServiceGrid`, `Marquee`, `TextSection`, `CTA`, `ImageGallery`, `Quote`, `Stat`, `LogoRow`, `FAQ`, `Timeline`, `FeatureList`. R1 + R2 findings determine which earn baseline status vs archetype-specific addons.

2. **Content-modeling heuristics** — decision rules with worked examples:
   - When to use blocks vs flat fields
   - When to use globals vs collections vs "pages collection with blocks" (resolves spec Q3)
   - When to use embedded arrays vs referenced relationships
   - When to use localized fields vs locale-specific documents (resolves spec Q5)

3. **Design-token integration** — from R3:
   - How tokens surface in CMS (select fields keyed to named tokens, NOT raw hex/px)
   - How frontend resolves (CSS vars via Tailwind v4 `@theme`)
   - How theming variants (dark mode, campaign themes) are exposed

4. **Authoring-UX conventions** — from R2:
   - Live Preview wiring recipe
   - Conditional-field patterns (show/hide based on other field values)
   - Array UI rules (item previews, reorder, duplicate)
   - Reusable-chunk patterns (testimonials, feature cards shared across pages)

5. **SvelteKit-wiring recipe** — from R4:
   - Chosen API (REST vs GraphQL) + rationale
   - Canonical `+page.server.ts` fetch pattern
   - Zod-at-the-boundary validation (17c continuation)
   - Preview route shape
   - Form Builder → form actions wiring
   - Lexical → HTML rendering in Svelte
   - Webhook-to-`revalidateTag` flow
   - Localization load flow

6. **Commercial viability snapshot** (per Task 5 step 3): Payload hosting costs (self vs Cloud), Vercel Blob + Neon free-tier ceilings, Payload+SvelteKit freelancer billing rates, community size indicators. Answers: can Yesid economically deliver this stack to custom/low-cost clients?

7. **Refactor table for 18b's 10 globals**

   | Global | Current shape | FORMULA shape | Action | Rationale |
   |--------|---------------|---------------|--------|-----------|
   | `home-content` | flat fields | TBD | TBD | TBD |
   | `services-page` | flat fields | TBD | TBD | TBD |
   | `projects-page` | flat fields | TBD | TBD | TBD |
   | `blog-page` | flat fields | TBD | TBD | TBD |
   | `tech-stack-page` | flat fields | TBD | TBD | TBD |
   | `about-content` | flat fields | TBD | TBD | TBD |
   | `contact-content` | flat fields | TBD | TBD | TBD |
   | `nav-links` | relationships | TBD | TBD | TBD |
   | `error-pages` | flat fields | TBD | TBD | TBD |
   | `site-meta` | flat fields | TBD | TBD | TBD |

8. **Reshape of Slice 18c–18f** — one paragraph each on what each sub-slice does under the FORMULA (drives the memory update in Task 6 step 1).

9. **Archetype-fit notes** — placeholder for future multi-archetype validation (politician+merch, restaurant, flower shop, etc.). **Explicitly out of scope this slice** per spec non-goals; noted here as follow-up slice material.

### FORMULA (populated in Task 5)

*[TBD — Session 3]*
