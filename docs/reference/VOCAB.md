# yesid. Vocabulary — Shared Lexicon (Yesid ⇄ Claude)

**Version:** 0.1 — skeleton drafted 2026-04-17 in Slice 17j Task 9a | co-edit during 17j closing
**Purpose:** single source of truth for every term Yesid and Claude reach for during development. Prevents drift ("what did we call that again?"), accelerates communication, and teaches industry vocab by proximity.

## How to use this doc

- **Yesid:** skim the Industry + Claude Code sections to pick up standard vocabulary. When you see a term you don't recognize in a session, grep this file first.
- **Claude (me):** load this file every session (it's in `docs/reference/`, Tier 1). When Yesid uses a brand term I don't know, check here before asking for clarification.
- **Adding a term:** brand vocab lives in Section 2, industry in Section 3, tool vocab in Section 4, process vocab in Section 5. Add during slice close in the closing checklist. Absolute dates only.
- **First-person, opinionated, yesid-specific.** This is a private lexicon (trade secret). Not a wiki, not a public glossary.

---

## 1. How terms are structured

Each entry:
- **Term** — the word we use
- **Category** — brand / industry / tool / process
- **Meaning** — one-sentence working definition
- **Where to find it** — file path or reference for the full story

When a brand term has an industry equivalent, both entries cross-link (e.g. "station tab" ↔ "tab interface pattern").

---

## 2. Brand vocabulary — yesid.dev-specific

Names invented for this project. If I (Claude) see these words in a spec or a conversation, I should know exactly which code, pattern, or concept you mean.

### Layout & structure

| Term | Meaning | Where |
|------|---------|-------|
| **Edge-to-edge** | Full-bleed layout model — viewport is the canvas, `<main>` has no horizontal constraints. | `CONSTITUTION.md §2`, `CSS.md §Layout` |
| **Edge rail** | Rotated vertical text labels on page edges (the "awwwards-style" ambient labels). Used on home Projects, home Terminus, blog listing, projects listing, contact. | `CONSTITUTION.md §6`, `EdgeLabel.svelte` |
| **Contained** | One of the 4 CSS grid recipes — content lives in a max-width container centered in the viewport. | `CONSTITUTION.md §2` |
| **Full-Bleed** | Grid recipe where content spans the full viewport width. | `CONSTITUTION.md §2` |
| **Content+Sidebars** | Grid recipe with a main content column and one or two sidebar columns. | `CONSTITUTION.md §2` |
| **Edge Title Grid** | Grid recipe with a rotated section title on the left or right edge. | `CONSTITUTION.md §2` |
| **Blueprint header** | The oversized section heading pattern (architectural-drawing aesthetic). | home sections, services pages |
| **Hazard stripes** | Diagonal stripe pattern used as a brand primitive (construction-site visual language). | `brand/foundations/color.md` |

### Home page vocabulary

| Term | Meaning | Where |
|------|---------|-------|
| **Metro System** | The home-hero visual language — lines, nodes, connectors evoking a transit map. | `MetroNetwork.svelte`, hero section |
| **Transit HUD** | The data-panel overlay on the hero showing live metrics. | `HeroBanner.svelte` |
| **Manifesto** | The second section after hero — principles stated bluntly. | `Manifesto.svelte` |
| **Proof reel** | The scrolling impact-metric cards with B&W imagery. | `FeaturedProjects.svelte` (proof cards) |
| **Services grid** | The 6-service block on home with SVG panels. | `HomeServices.svelte` |
| **Construction-site closer** | The final home section — DrawSVG graffiti letters, construction props, floodlight. | `HomeCloser.svelte`, `CloserTerminalBoard.svelte` |
| **Departure board** | The split-flap-style board in the closer showing "what's next". | `CloserTerminalBoard.svelte` |

### Services & contact

| Term | Meaning | Where |
|------|---------|-------|
| **Station tab** | The service-category tabs on /services (industry term: "tab interface pattern"). | `ServiceListingPage.svelte` |
| **Kinetic scroll index** | The horizontally-scrolling service index on /services. | services listing |
| **Consultative detail** | The long-form service-detail layout on /services/[id]. | service detail page |
| **Dual terminal** | The side-by-side CRT-style panels on /contact (left = input, right = confirmation). | `ContactPage.svelte` |
| **Terminal chrome** | The CRT visual wrapper around the contact terminals (scanlines, bezel, glow). | `TerminalChrome.svelte` |
| **Bento dashboard** | The grid-of-cards layout on /about. Each "STOP XX" is a card. | `AboutPage.svelte` |

### Brand primitives

| Term | Meaning | Where |
|------|---------|-------|
| **Pulse-glow** | The canonical `box-shadow` keyframe animation on StatusDot + similar "breathing" dots. | `CSS.md §Global Keyframes` |
| **Station ping** | The "radar ping" expanding-ring animation global keyframe. | `CSS.md §Global Keyframes` |
| **LED pulse** | The soft glow pulse for LED-style dots. | `CSS.md §Global Keyframes` |
| **Ring** | The static outline halo on a StatusDot (via CSS `outline`, not Tailwind `ring-*` — see `PATTERNS.md`). | `StatusDot.svelte` `ring` prop |
| **SvgIcon** | The universal icon primitive (hover variant support, morph hooks). | `SvgIcon.svelte` |
| **SectionWrapper** | The layout primitive that encodes Constitution edge/container/bleed rules. | `SectionWrapper.svelte` |
| **StatusDot** | The LED/indicator dot primitive (pulse, ring, color variants). | `StatusDot.svelte` |

### Motion vocabulary (see `MOTION.md` v2 for the full 9-signature taxonomy)

| Term | Meaning | Where |
|------|---------|-------|
| **Snappy Doctrine** | No entrance reveals. Motion serves response (tap, hover, scroll), not decoration. | `CONSTITUTION.md §8`, `MOTION.md §2` |
| **9-signature vocabulary** | The 9 canonical motion patterns allowed on the site (hover-lift, morph-hover, scrub, draw, etc.). | `MOTION.md §3` |
| **Scrub factory** | A factory that returns a ScrollTrigger timeline — `createHeroTimeline`, `createCrescendoScrub`, `createDrawScrub`. | `src/lib/motion/scrubs/` |
| **Morph hover** | `use:morphHover` Svelte action — swaps SVG path on hover with MorphSVGPlugin. Lazy-loaded. | `src/lib/motion/actions/morphHover.ts` |
| **Shared ticker** | The single site-wide `gsap.ticker` with IO-gated subscribers. Replaces ad-hoc `setInterval` / per-component RAFs. | `src/lib/motion/ticker.ts`, `MOTION.md §7` |
| **Lazy GSAP plugin** | Plugins registered on first use, not at boot (Flip, MorphSVG, SplitText). | `MOTION.md §9`, `gsap.ts` |
| **SSR-inline SVG** | The MetroNetwork pattern — SVG inlined at build via Vite `?raw` + SVGO, not fetched at runtime. | `MOTION.md §14` |
| **Signature** | A named canonical motion pattern from the 9-signature vocabulary. | `MOTION.md §3` |

### Design system

| Term | Meaning | Where |
|------|---------|-------|
| **Constitution** | The codebase's founding rules. `CONSTITUTION.md` is the supreme governance doc; every slice must comply. | `docs/reference/CONSTITUTION.md` |
| **Token lockdown** | The rule: zero hardcoded colors. Every visual value references a CSS custom property. | `CSS.md §Rules` |
| **Brand primitive** | A reusable component that encodes brand-specific visual identity (StatusDot, TerminalChrome, SectionWrapper). Different from headless UI primitives (Bits UI). | `ARCHITECTURE.md §Primitives` |
| **Headless primitive** | A logic-only component (Bits UI — dropdown, dialog). Paired with brand-primitive styling. | `CONSTITUTION.md §Library Decisions` |

---

## 3. Industry vocabulary — standard terms worth knowing

Standard terms that appear in this codebase or in adjacent docs. Learn these and your industry fluency compounds.

### Web fundamentals

| Term | Meaning | Where we use it |
|------|---------|-----------------|
| **FLIP** | First-Last-Invert-Play animation technique. GSAP's `Flip` plugin implements it. Used for list reorder (blog filter, projects filter). | `flip.ts`, blog/projects listings |
| **IntersectionObserver** | Browser API that fires callbacks when an element enters/leaves the viewport. We use it to gate animations + lazy-load. | `ticker.ts` IO-gated subscribers |
| **dvh / svh / lvh** | Dynamic / small / large viewport height units. We use `dvh` instead of `vh` because mobile browsers hide/show chrome. | `CONSTITUTION.md §9`, global rule |
| **Safe-area inset** | CSS `env(safe-area-inset-*)` for notches/home-indicators. | layout CSS |
| **Debounce / throttle** | Rate-limiting techniques for event handlers (resize, scroll). | motion helpers |
| **Reduced motion** | `prefers-reduced-motion` media query. Every animation on yesid.dev checks this and no-ops when true. | motion actions |
| **Structured data / JSON-LD** | Schema.org metadata embedded in `<script type="application/ld+json">`. Boosts SEO. | `+layout.svelte` JSON-LD injection |
| **Progressive enhancement** | Ship working HTML first, layer in JS-dependent features. | SvelteKit SSR by default |
| **SSR / ISR / CSR** | Server-side render / incremental static regeneration / client-side render. SvelteKit prerendering = SSR-at-build. | `svelte.config.js` |
| **Hydration** | Client JS taking over a server-rendered DOM. | SvelteKit default behavior |

### Svelte 5 / SvelteKit 2

| Term | Meaning | Where |
|------|---------|-------|
| **Rune** | A `$state`, `$derived`, `$effect`, or `$props` — Svelte 5's reactivity primitives. Replaces Svelte 4 `export let` + `$:`. | every `.svelte` file |
| **$state** | Reactive state rune. Variables declared with `$state()` are tracked by the reactivity system. | everywhere |
| **$derived** | Computed value rune. Like a memoized function of other runes. | component logic |
| **$effect** | Side-effect rune (fires on reactive change). Replaces `onMount` + watchers. Use sparingly. | only when unavoidable |
| **$props** | Component props rune. `let { x, y } = $props()`. | every component |
| **Action** | A `use:` directive target — a function that runs when an element mounts and returns cleanup. Example: `use:morphHover`. | `src/lib/motion/actions/` |
| **Store** | Svelte's pre-runes reactive container (`writable`, `readable`, `derived`). We prefer runes for new code. | a few legacy spots |
| **Scoped style** | `<style>` block in a `.svelte` file — CSS auto-scoped to that component's elements. | every component |

### Tailwind v4

| Term | Meaning | Where |
|------|---------|-------|
| **@theme** | The Tailwind v4 directive in `app.css` that defines tokens (colors, fonts, etc.). | `src/app.css` |
| **Arbitrary value** | `text-[18px]` — a one-off Tailwind value. Banned in this codebase (see `CONSTITUTION.md` — use tokens instead). | avoided |
| **Utility-first** | Tailwind's design philosophy — compose styles from atomic utility classes. | default approach |
| **JIT** | Just-in-time compiler. Tailwind v4 generates only the classes you use. | default |

### GSAP / Lenis / motion libs

| Term | Meaning | Where |
|------|---------|-------|
| **ScrollTrigger** | GSAP plugin that fires timelines based on scroll position. The foundation of our scrub-factory pattern. | `src/lib/motion/` |
| **MorphSVG** | GSAP plugin for path-morph animations. Lazy-loaded. | `morphHover.ts` |
| **SplitText** | GSAP plugin for breaking text into chars/words for per-element animation. | typewriter helpers |
| **CustomEase** | GSAP plugin for authoring custom easing curves. | motion tokens |
| **Flip (plugin)** | GSAP plugin implementing FLIP technique. Animates list reorders. | blog/projects filters |
| **Lenis** | Smooth-scroll library (momentum + virtual scroll). Wraps native scroll. | `src/lib/motion/lenis.ts` |
| **Lottie** | JSON-driven animation format + runtime. We use it sparingly. | a couple of home icons |
| **Ticker** | A shared RAF loop. `gsap.ticker.add(fn)` subscribes a function to every frame. | `src/lib/motion/ticker.ts` |

### Data layer (added in Slice 17b, 2026-04-18)

| Term | Meaning | Where |
|------|---------|-------|
| **Hexagonal content architecture** | The three-layer data seam: `content/*.ts` (seed) → `adapters/*` (port interface) → `repositories/*` (async getters) → route loaders. Components consume via loaders (data) or directly from content (UI chrome). Adding a CMS = swap one adapter file. | `src/lib/adapters/`, `src/lib/repositories/` |
| **ContentAdapter** | The port interface. Every backing store (static / CMS / API) exposes `projects`, `services`, `blog`, `meta`, `techStack`, `content` ports conforming to `ContentAdapter`. | `src/lib/adapters/types.ts` |
| **Port** (data) | A domain-sliced section of the adapter interface — e.g. `ProjectsPort.getPublicProjects()`. Matches the hexagonal "ports & adapters" vocabulary from Alistair Cockburn. | `src/lib/adapters/types.ts` |
| **Static adapter** | The current `ContentAdapter` implementation — reads from the typed TypeScript content files. Future CMS adapters swap in by changing one line in `src/lib/adapters/index.ts`. | `src/lib/adapters/static.ts` |
| **Repository layer** | Async facade over the adapter. Route loaders call `getPublicProjects()` etc. — never `adapter.projects.*` directly. Isolates loaders from the swap point. | `src/lib/repositories/` |
| **Chrome** (content) | UI strings that aren't data — button labels, aria-labels, section headings, error messages. Lives in `$lib/content/*.ts` alongside seed content; imported directly by components (bypasses the adapter/repository path). | every extracted sub-task in 17b-7 |
| **LocalizedString** | The canonical shape `{ en: string; fr?: string; es?: string }`. All user-facing text in content files. | `src/lib/types.ts`, `resolveLocale` in `src/lib/utils/locale.ts` |
| **Translation debt** | LocalizedStrings that only carry `en` (no `fr`/`es`). Tracked by the integrity test — printed as a snapshot on every test run. | `src/lib/content/integrity.test.ts` |
| **Content port** | Bucket inside `ContentAdapter` for page-level copy that isn't a first-class entity (hero, about page, contact page, closer, metro bookends). Distinct from typed-entity ports. | `src/lib/adapters/types.ts` |

### Testing

| Term | Meaning | Where |
|------|---------|-------|
| **Vitest** | Fast test runner (Vite-native, Jest-compatible API). | `vitest.config.ts` |
| **happy-dom** | Lightweight DOM implementation — much faster than `jsdom` for unit tests. | `vitest.setup.ts` |
| **@testing-library/svelte** | Component-testing helpers (render, screen, fireEvent). | `.test.svelte.ts` files |
| **Playwright** | Real-browser E2E testing framework. | `tests/e2e/` (future) |
| **E2E** | End-to-end testing — full user flow in a real browser. | Slice 16 |
| **Unit test** | Test of a single function/component in isolation. Most of our 782 tests. | `.test.ts` files |
| **TDD** | Test-Driven Development — write the test first (RED), make it pass (GREEN), refactor. | our standard workflow |

---

## 4. LLM tool vocabulary — the tool's terms

Terms specific to Claude Code, the Anthropic API, and the AI-assisted development toolkit. Useful for debugging why a session feels sluggish or why a skill isn't firing.

| Term | Meaning | Where |
|------|---------|-------|
| **Skill** | A reusable capability definition (`SKILL.md` with frontmatter). Loaded on demand via the Skill tool. | `~/.claude/skills/` |
| **Slash command** | A `/foo` command defined by a skill or a `.claude/commands/*.md` file. | `.claude/commands/` |
| **Subagent / Agent tool** | A separate Claude conversation dispatched with the `Agent` tool. Runs in its own context; only the final message returns. | parallel research, isolation |
| **General-purpose agent** | The default subagent type. Has all tools. Used for research and open-ended work. | Task 0a research agents |
| **Specialized agent** | A subagent with a pre-written prompt + scoped tools (e.g. `code-reviewer`, `planner`). Defined in `~/.claude/agents/`. | our 30 home agents |
| **Context window** | The total token budget for a conversation. Opus 4.7 = 1M tokens. Sonnet 4.6 = 200K. | always finite |
| **Cache prefix** | The ordered stable prefix Claude caches: `tools → system → CLAUDE.md → messages`. Any change at a layer invalidates everything after. | `cloud/workflow-knowledge/token-efficacy/01-cache-economics.md` |
| **Cache TTL** | How long a cached prefix stays warm. Currently 5m default (regressed from 1h in March 2026). | same |
| **Cache hit / miss** | Prefix was reused (read rate = 0.1x input) vs. re-paid (write rate = 1.25x for 5m). | same |
| **ToolSearch** | The mechanism by which tool schemas are lazy-loaded. Default for all tools as of Claude Code v2.1.69. | deferred-tool list in system reminder |
| **Deferred tool** | A tool whose name is visible but schema isn't loaded. Call requires `ToolSearch` first to fetch the schema. | every MCP tool |
| **MCP** | Model Context Protocol — Anthropic's standard for exposing tools to Claude (servers + tools). | `.mcp.json`, `~/.claude.json` |
| **MCP server** | A process (stdio or HTTP) that exposes one or more tools to Claude Code. | Railway, context7, chrome-devtools |
| **`.mcp.json`** | Project-scoped MCP server definitions. Committed to the repo. | coming in Task 4 |
| **`enabledMcpjsonServers`** | Settings key that allowlists which MCP servers to approve automatically. | `.claude/settings.json` |
| **Scope hierarchy** | Config precedence order: local > project > user > plugin > connector. Local wins. | `~/.claude.json` vs `.mcp.json` vs `~/.claude/settings.json` |
| **Plugin** | A bundle of skills + agents + MCPs shipped together (e.g. `superpowers`, `everything-claude-code`). | `~/.claude/plugins/cache/` |
| **Marketplace** | A GitHub repo that hosts a plugin's source. `extraKnownMarketplaces` in settings lists which repos the plugin manager can install from. | `~/.claude/settings.json` |
| **Connector** | An MCP server configured via `claude.ai` web app → Settings → Integrations (Notion, Webflow, Slack, etc.). Loads into Claude Code sessions too. NOT reachable from `~/.claude/` config files. | claude.ai web UI |
| **Enable / Disable / Uninstall plugin** | **Enable** = `true` in `enabledPlugins` (loads at session start). **Disable** = `false` (stays on disk, doesn't load; re-enable flips it back instantly). **Uninstall** = `claude plugin uninstall` (wipes cache, requires re-download from marketplace). | disable is the safe default |
| **Activation-cost** | Tokens that WOULD be required if a deferred MCP tool schema were loaded via ToolSearch. Matters because a single broad `ToolSearch("*")` could blow up context. Pruning MCPs reduces this surface. | ~500 tokens per MCP tool schema |
| **Snapshot** | A timestamped capture of `~/.claude/` state to `<cloud>/claude-config/user/<YYYY-MM-DD[-tag]>/`. Bundles settings + marketplaces + plugins + MCPs + skills + agents + rules. | `bun $YESITO_CLOUD_ROOT/claude-config/snapshot.ts` |
| **Restore** | Apply a snapshot back to `~/.claude/` with auto-backup of current state first. Resolves latest by mtime; supports `--label`, `--dry-run`, `--yes`. | `restore.ts` |
| **`YESITO_CLOUD_ROOT`** | Env var pointing to the local cloud directory. Single per-machine portability knob. Scripts fall back to `path.join(os.homedir(), 'Yesito', 'cloud')`. | shell profile / Windows Env Vars |
| **Auto-memory** | The file-based memory system at `~/.claude/projects/<hash>/memory/`. Facts persist across sessions. | ours post-17j = 35 files |
| **MEMORY.md** | The index of memory pointers. Truncated at 200 lines / 25 KB on session load. | `~/.claude/projects/C--Users.../memory/MEMORY.md` |
| **AutoDream** | Anthropic's 2026 reflective memory-consolidation sub-agent. Self-triggers after >24h + ≥5 sessions. | cloud knowledge doc 05 |
| **Compaction** | Rewriting the context to free tokens. Three layers: microcompaction (disk offload) / auto-compaction (~75-83%) / manual `/compact`. | `cloud/.../06-strategic-compact.md` |
| **Plan mode** | A Claude Code mode where the model plans but doesn't execute tool calls. Cheap reasoning lane. | Shift+Tab or `ExitPlanMode` tool |
| **Working context vs startup context** | Working = tool results + user messages accumulated this session. Startup = CLAUDE.md + memory + skill descriptions loaded at session start. | `/context-budget` distinguishes them |
| **Prompt cache** | Anthropic's prefix cache (read rate 0.1x, write rate 1.25x for 5m, 2x for 1h). | API-level feature |
| **Skill description triggers** | "Use when..." outperforms "Use for..." for activation matching. First 200 chars are load-bearing (truncated in the skill list). | research: `token-efficacy/03-plugin-hygiene.md` |

---

## 5. Workflow vocabulary — how we work

The shared language for our development process. These terms show up in `CLAUDE.md`, `WORKFLOW.md`, devlogs, handoffs, specs.

| Term | Meaning | Where |
|------|---------|-------|
| **Slice** (Level 1) | A top-level numbered unit of work (17, 18, 19). Contains sub-slices. | `docs/slices/slice-NN/` |
| **Sub-slice** (Level 2) | The PR boundary. Lettered variant of a slice (17a, 17j, 17h-3). One PR per sub-slice. | `docs/slices/slice-NN/slice-NN<letter>/` |
| **Task** (Level 3) | A section inside a sub-slice's `plan.md`. Can span multiple sessions. Ends with a STOP gate. | section, not a folder |
| **Session** (implicit Level 4) | A single working day under a Task. Identified by date heading in `log.md`: `### Session YYYY-MM-DD — Task NN<letter>-N`. | `log.md` |
| **Bundle** (sub-slice bundle) | The 4-file folder per Level 2: `spec.md` + `plan.md` + `log.md` + `handoff.md`. Moves together at PR close. | `docs/slices/slice-NN/slice-NN<letter>/` |
| **Spec** (`spec.md`) | Design + rationale + acceptance criteria for a sub-slice. Written once; amendments logged. | inside the bundle |
| **Plan** (`plan.md`) | Task-by-task implementation instructions. Level 3 tasks are sections. Checkboxes track progress. | inside the bundle |
| **Log** (`log.md`) | Running session-by-session work record. Commands, files, decisions, errors. Appended every session. | inside the bundle |
| **Handoff** (`handoff.md`) | Self-appending closing report. Grows per-task as work lands. Final summary added at PR close. IS the PR body. | inside the bundle |
| **Self-appending handoff** | Pattern where `handoff.md` gains a `### Task NN<letter>-N` section each time a Level 3 task completes — rather than being written in one push at slice close. Captures decisions fresh. | `_TEMPLATE-SUBSLICE/handoff.md` |
| **Checkpoint** (`CHECKPOINT.md`) | Live state of a Level 1 slice (sub-slices done, current sub-slice, next step). Ephemeral — deleted when slice fully closes. | `docs/slices/slice-NN/CHECKPOINT.md` |
| **Session type** | **Planning / Implementation / Closing / Non-slice.** Every session declares one. Non-slice = bugfixes, configs, exploration — stored at `docs/sessions/<YYYY-MM-DD>-<name>.md`. | `CLAUDE.md` |
| **Non-slice session** | Work outside any slice: bugfix, config, exploration, hotfix, research spike. Single-file record, not a bundle. Commits; optional PR. | `docs/sessions/_TEMPLATE.md` |
| **Iteration Protocol** | The mandatory "one task → STOP → Yesid approves → next task" loop. Never batch. | `CLAUDE.md` |
| **Closing checklist** | The steps at slice close — finalize handoff, governance doc updates, VOCAB update, OS-quirks append, learn doc to cloud, tree.txt, commit/PR, `bun run slice:close`. | `WORKFLOW.md` §11 |
| **Close-script** (`slice-close.ts`) | Bun script that moves the sub-slice bundle to cloud archive, deletes the repo folder, appends a row to `COMPLETED-SLICES.md`. Uses `$YESITO_CLOUD_ROOT`. No flatten — granular retrieval preserved. | `scripts/slice-close.ts` |
| **Three-tier context** | Tier 1 (always-on, in repo) / Tier 2 (fetch-on-command, cloud + git) / Tier 3 (cloud indexes, the bridge). Adopted in Slice 17j. | `docs/ARCHIVE.md` |
| **Write protocol** | The closing steps that mirror a shipped slice to cloud + delete from repo + update cloud index. Self-pruning. | Codified in `WORKFLOW.md` during Task 3 |
| **Fetch-on-command** | Reading a Tier 2 artifact deliberately — AI decides to read a cloud file when context warrants, not auto-loaded. | retrieval protocol |
| **Retrieval protocol** | The four-step ladder for AI to get context: in-context → cloud index → specific cloud artifact → git history. | `docs/ARCHIVE.md` |
| **OS-quirks registry** | Cross-project persistent log of platform-specific command fixes at `<cloud>/workflow-knowledge/os-quirks/<os>.md`. Consulted before debugging; appended when a new quirk is solved. | `<cloud>/workflow-knowledge/os-quirks/` |
| **Self-enhancing workflow** | The principle that every mistake becomes a closing-checklist rule. Workflow compounds quality slice-over-slice. | core principle |
| **workflow-efficiency skill** | Portable skill at `~/.claude/skills/workflow-efficiency/` codifying the three-tier context, 3-level hierarchy, self-appending handoff, close-script, cache pacing, subagent routing. Trade-secret, personal IP across Yesid's 6 services. | `~/.claude/skills/workflow-efficiency/SKILL.md` |
| **Superpowers skill** | A skill in the `superpowers` plugin family — `brainstorming`, `writing-plans`, `executing-plans`, etc. Structured rigid workflows. | `~/.claude/plugins/.../superpowers/` |
| **STOP** | The mandatory halt after a task. Don't write the next line of code, don't move on. Wait for Yesid. | `CLAUDE.md` Iteration Protocol |
| **Pre-prune / Post-prune snapshot** | Pair of config snapshots taken around a major prune pass. Pre-prune = rollback path; post-prune = the new clean baseline to replicate on other machines. | `<cloud>/claude-config/user/` |
| **`.mcp.json`** | Project-scoped MCP server definitions. Committed to the repo. | yesid.dev has this |
| **`enabledMcpjsonServers`** | Settings key that allowlists which MCP servers to approve automatically. **MUST live in committed `.claude/settings.json`** (not `.local.json` — issue #24657 ignores it there). | `.claude/settings.json` |

---

## 6. Cross-reference: brand ↔ industry

When we've invented a name for something that has a standard industry equivalent, list both here so we can code-switch:

| Our term | Industry equivalent | Why we rename it |
|----------|---------------------|------------------|
| **Station tab** | Tab interface pattern | "Station" fits transit metaphor; "tab" alone feels generic. |
| **Kinetic scroll index** | Horizontal scroll navigation / scroll-snap nav | Adds the transit metaphor + emphasizes intentional kinetic motion. |
| **Bento dashboard** | Card grid / masonry grid | "Bento" has industry currency (Apple); we use it because it signals playful density. |
| **Construction-site closer** | Final page section / footer pre-footer | Evokes brand-specific visual metaphor (construction = building = infrastructure). |
| **Snappy Doctrine** | No-animation-on-mount design principle | Short, memorable, enforceable. |
| **Edge rail** | Rotated sidebar label / vertical section marker | "Rail" fits transit; distinguishes from a traditional sidebar. |
| **Metro System** | SVG network diagram | Specific to the home hero's visual language. |

---

## Maintenance

- Review at every slice close. Add new terms introduced in the slice.
- Deprecate terms no longer used (keep the entry but mark `(deprecated — replaced by X)`).
- When an industry term shifts meaning (rare), update the entry with an absolute date.
- This doc grows linearly with the codebase. Aim for `<300` lines by keeping each entry to one row.
