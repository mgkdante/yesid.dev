# slice-headless-cms-best-practices — Handoff

> **Slice is the PR boundary (single-level).** This handoff IS the PR body.

## PR body

### Summary

Research slice closing with a **PIVOT DECISION: Payload → Directus**. Originally scoped as "research best practices for pairing a headless CMS with a modern frontend framework; produce a FORMULA for yesid.dev and custom/low-cost clients." Through 6 parallel research agents across 3 dimensions + 2 live WebFetches + an interstitial 3-stack sanity-check + a Payload-vs-Directus deep dive, the research concluded that Directus 11+ is a materially better fit than Payload 3 for Yesid's specific constraints: SvelteKit-committed frontend, AI-native workflow via MCP, small-business clients (flower shop / restaurant / political candidate / blogger), $3-5k CAD/mo revenue target, "procurement over scratch" values alignment.

Slice 18a + 18b shipped on Payload 2026-04-21. On 2026-04-22, after an overnight read-through of the consolidated decision brief, Yesid decided to pivot. This PR ships the research bundle as permanent reference AND cascades the pivot through forward-looking docs (Slice 18 direction, ARCHITECTURE.md, roadmap PLAN.md, FUTURE_PHASES.md) + memory (new `project_cms_directus.md`, amended `project_cms_payload.md` marked historical, rewritten `project_slice_18_status.md`).

### What changed

**Research bundle (this slice — created):**
- `docs/slices/slice-headless-cms-best-practices/spec.md` — single-level slice spec, 6 design decisions, Q3/Q4/Q5 resolved; amendments log now reflects pivot decision
- `docs/slices/slice-headless-cms-best-practices/plan.md` — 6 tasks across 3 sessions; Tasks 3-5 marked superseded by pivot; FORMULA section rewritten to reflect pivot-as-deliverable
- `docs/slices/slice-headless-cms-best-practices/research.md` — ~1000 lines cited across §R1 (content modeling 7 CMSes), §R2 (authoring ergonomics + real user sentiment), §Decision Outcome, §DNS & Infrastructure Migration Inventory
- `docs/slices/slice-headless-cms-best-practices/decision-brief.md` — comprehensive self-contained brief (~4500 words) designed for bedtime AI-assisted reflection; includes 9 probe questions
- `docs/slices/slice-headless-cms-best-practices/devlog.md` — session-by-session history including Tasks 2.5 + 2.5b interstitials + close
- `docs/slices/slice-headless-cms-best-practices/handoff.md` — this file

**Slice 18 rewritten for Directus:**
- `docs/slices/slice-18/README.md` — Level 1 direction doc rewritten: 18a/18b marked HISTORICAL; new 18c (`slice-directus-research`) + 18d (scorched-earth rebuild) + 18e (content migration) + 18f (frontend rewire) + 18g (DNS cutover + parallel-run + Payload sunset)

**Forward-looking docs updated:**
- `docs/roadmap/PLAN.md` — Slice 18 row + Execution Sequence diagram + decision log entry for 2026-04-22 pivot
- `docs/roadmap/FUTURE_PHASES.md` — stack-builder architecture note + Hex Grid tech stack CMS tier
- `docs/reference/ARCHITECTURE.md` — Two-repo topology pivot notice + migration pipeline rewrite + content-model historical framing

**Forward-looking docs NOT updated (intentionally historical):**
- Slice 14/15/17 bundle docs — truthful record of past work
- Historical decision log entries in PLAN.md dated 2026-04-16 — preserved (new 2026-04-22 entry supersedes)
- Research bundle itself references Payload throughout — required for decision rationale
- `src/lib/schemas/` + `src/lib/adapters/` + `src/lib/repositories/` TS files — Payload references are in code that swaps during 18f execution, not docs-close

**Memory updates:**
- `project_slice_18_status.md` — fully rewritten for Directus sub-slice sequence 18c-18g, with open questions for `slice-directus-research` + DNS inventory summary
- `project_cms_payload.md` — amended with SUPERSEDED notice at top; historical body preserved
- `project_cms_directus.md` — NEW memory capturing forward direction (Directus architecture, trade-offs accepted, sub-slice plan, reference URLs)
- `project_cms_research_bundle.md` — status updated to SHIPPED with PIVOT
- `MEMORY.md` — index updated with new `project_cms_directus` entry

**Sandbox commits (CMS-UX worktree, branch `slice-cms-ux-redesign`, never merged):**
- `67c14e1` — TestBlocks collection for R1 block admin UX verification
- `613579a` — `admin.livePreview` config shape for R2 Q4 verification

### Key research findings (durable outputs)

1. **12 content-modeling heuristics** (research.md §R1) — CMS-agnostic, transferable to Directus's primitives.
2. **22-item ergonomics checklist** (research.md §R2.5) — most items are Directus defaults; Directus equivalent checklist is ~5-7 items.
3. **Cross-CMS pattern map** — polymorphic section array is universal (Payload blocks = Sanity page-builder array = Storyblok bloks = Strapi dynamic zones = Prismic SliceZone = TinaCMS templates).
4. **Q3 resolution** (globals vs pages-collection) — transferable as design principle; re-opens under Directus primitives in `slice-directus-research`.
5. **Q5 resolution** (field-level localized inside blocks) — transferable principle; Directus's `_translations` junction tables express it with different schema footprint.
6. **Brutal Payload calibration** — Lexical a11y Issue #8653, internal-link bloat Issue #6547, blocks-at-scale Discussion #12099, #7164 SvelteKit postMessage.
7. **Decisive Directus evidence** — Agent J 23/25 admin UX, Agent K 7.5/10 vs 5/10 commercial risk, native MCP v11.13, 7 official SvelteKit tutorials, $19.5M VC-funded founder-led trajectory.

### Load-bearing corrections to earlier research (flagged for PR reviewer)

- **Figma acquired Payload June 2025** (not October 2025 as earlier claimed)
- **Directus MCP is first-party GA v11.13 Nov 2025** (not community / absent as initially claimed by Agent F; WebFetched directus.io/mcp to verify)
- **Migration cost is 18-22 realistic days** (not the optimistic 6-9 days of Agent F's initial estimate; Agent K's phase breakdown found Zod rewrite + i18n reshape drive cost)

### Verification

**Docs-only slice — no code changes in main branches.**

- Spec + plan + research + decision-brief + handoff all committed to `slice-headless-cms-best-practices` branch
- Slice 18 README + ARCHITECTURE.md + roadmap PLAN.md + FUTURE_PHASES.md cascade-updated in same branch
- Memory files updated in `C:\Users\otalo\.claude\projects\C--Users-otalo-Yesito-Projects-yesid-dev\memory\` (outside PR diff — Claude Code user-memory scope)
- Sandbox commits `67c14e1` + `613579a` stay on `slice-cms-ux-redesign` branch of yesid.dev-cms, never merged
- No new npm packages; no schema changes; no DB migrations
- cms.yesid.dev Payload production untouched during research

### Follow-ups

**Immediate next slice:** `slice-directus-research` (Slice 18c) — comprehensive Directus architecture + repo audit + migration strategy + 10 open questions (hosting / storage / schema approach / Q3 re-open / Q5 re-open / email adapter / MCP config / type-gen pipeline / Flows / extensions). Docs-only; sandbox on `slice-cms-ux-redesign` branch OK; no main-branch code.

**Subsequent execution slices:** 18d (scorched-earth rebuild) → 18e (content migration) → 18f (frontend rewire) → 18g (DNS cutover + parallel-run + Payload sunset with `cms-legacy.yesid.dev` 2-week escrow + Codex peer review).

**Infrastructure that survives the pivot:**
- Neon Postgres (same project)
- Resend (same API key + sender domain + DKIM/SPF DNS)
- Cloudflare zone `yesid.dev` (DNS records updated at 18g cutover)
- MCP-via-Claude-Code connection (re-pointed at Directus native MCP endpoint in 18d/18f)

**Deferred (out of scope this slice, still pending in research/execution slices):**
- Hosting decision (Railway / Hetzner / Directus Cloud) — 18c
- Storage decision (Vercel Blob / Cloudflare R2 / Directus Files) — 18c
- Schema introspection vs fresh-rebuild decision — 18c
- Custom Vue admin extensions (likely unnecessary given Directus's 569 marketplace extensions) — 18d as needed
- Block-based page builder work — deferred until post-launch; design is locked near-term

## Peer review notes

*Codex adversarial peer review per `feedback_codex_review_at_slice_close.md` convention — scheduled for Yesid to run on this PR before merge. Findings captured here.*

**Status:** PENDING — awaiting Codex review after PR open.

## Deferred risks

- **Directus Vue-extension cognitive tax** — if custom admin extensions needed, Yesid writes Vue SFCs (framework context switch from TypeScript+Svelte). Mitigation: Directus's 569 marketplace extensions cover ~90% of cases; Flows + Insights + existing interfaces cover most custom needs. Deferred to `slice-directus-research` to evaluate whether any extension is genuinely required.
- **BSL license $5M ARR threshold** — irrelevant for Yesid's freelance scale today; becomes relevant IF Yesid ever builds SaaS on top of Directus crossing $5M ARR. At that point: negotiate commercial license OR fork the then-GPL version. Not near-term. Tracked in `project_cms_directus.md`.
- **Migration worst case 28-32 days** (vs realistic 18-22) — if Lexical→WYSIWYG content reshape + Directus Translations i18n migration both misfire. Mitigation: parallel-run escrow + rollback plan in 18g. Rollback cost low while Payload stays live on `cms-legacy.yesid.dev`.
- **TypeScript DX regression** — permanent loss from Payload's auto-regenerated types; Directus's community-tooled `directus-sdk-typegen` is looser. Mitigation: accepted as pivot cost; if the regression bites daily dev flow more than expected, `slice-directus-research` evaluates workarounds.
- **Payload plan docs in src/ code** — Payload references remain in `src/lib/services/*.service.ts`, `src/lib/schemas/`, `src/lib/adapters/`. Intentionally NOT scrubbed during docs-close: those files change during 18f execution (frontend rewire) as part of the active migration, not as part of research-slice close.
