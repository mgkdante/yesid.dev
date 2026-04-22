# Payload vs Directus — CMS Pivot Decision Brief

**Date:** 2026-04-22
**Slice:** `slice-headless-cms-best-practices`
**Status:** decision-pending — Yesid sleeping on it; wants AI-assisted reflection
**Full research:** `docs/slices/slice-headless-cms-best-practices/research.md` (~1000 lines, cited)

---

## For the AI reading this at bedtime

You're being asked by Yesid to help him think through a strategic CMS decision he's sleeping on. This document contains the **full research synthesis across 6 parallel research agents** plus four concrete decision options. Your job is NOT to validate the conclusion he's already formed — it's to **probe his reasoning, challenge weak arguments, and help him clarify which factors actually matter most to his specific business**. The evidence genuinely supports either direction; this is a judgment call, not a factual answer.

Yesid's stated bias: he "leans toward staying with Payload but wants to think it through." Don't let that bias shape your pushback — apply equal rigor to both sides.

**Questions worth asking him in conversation:**
- Who is your actual first client, concretely? Not the archetype — the real person/business you'll sign first.
- When you picture that client editing their site in 3 months, what are they doing — composing page layouts or adding blog posts + updating events?
- What happens if you pivot to Directus and the migration takes 30 days instead of 18-22? Where does that time come from?
- What happens if you stay on Payload and Figma deprioritizes OSS Payload in 2027? Is "bookmark Slice 22 re-evaluation" actually a plan, or a way to defer?
- Which decision would you regret more at 12 months — having migrated unnecessarily, or having stayed when you should have pivoted?

---

## The Question

Should Yesid migrate his web-dev service's CMS stack from **Payload 3** (currently in production as part of Slice 18a + 18b) to **Directus 11** (alternative headless CMS), or stay with Payload and apply defensive customization (the "FORMULA guardrails")?

---

## Yesid's Context

**Who Yesid is:**
- Solo freelance web developer building yesid.dev as both portfolio AND reference implementation of a reusable web-dev service
- Target market: small-business clients — flower shops, local restaurants, political candidates, small-commerce, bloggers, journalists
- Commercial target: $3–5k CAD/month aggregate revenue via mix of per-project delivery + retainers + optional hosting/subscriptions
- Time horizon: 2–3 years before building his own SaaS as a separate offering
- Stack commitments: SvelteKit 2 + Svelte 5 (decided), Bun, Tailwind v4, Vercel, Neon Postgres
- Values code ownership, open-source, schema-as-code, AI-native workflow (already uses Claude Code + MCP)

**What Yesid explicitly does NOT want:**
- To compete with Webflow/Shopify/WordPress on their terms — he wants a DIFFERENT wedge (code-owned, custom, moderate budget)
- To reinvent the wheel — he wants to use what exists
- To build SaaS infrastructure as part of THIS service offering (separate future project)
- To lock himself into a stack that pivots against him in 2–3 years

**Key insight (his own words):** *"we're not yet committed fully — we can always pivot."* The 18a+18b work on Payload is not sunk cost he's defending; it's schema-thinking he can translate.

---

## What's Shipped on Payload Right Now (the state we'd migrate FROM)

**yesid-dev-cms repository** — Payload 3.83.0 in production at `cms.yesid.dev`:

- **10 collections:** TechStack, Services, Projects, BlogPosts, StackScenarios, Users, Media (+ Payload's auto-generated system tables)
- **10 globals:** HomeContent, ServicesPage, ProjectsPage, BlogPage, TechStackPage, AboutContent, ContactContent, NavLinks, ErrorPages, SiteMeta
- **73 seeded production rows** (projects 6, services 6, tech-stack 45, blog-posts 7, stack-scenarios 7, media 1, + all 10 globals populated)
- **Infrastructure:** Neon Postgres + Vercel Blob + Resend + `@payloadcms/plugin-mcp` (native MCP surface)
- **Migration `20260421_204630`** applied to prod
- **Localization:** en/fr/es field-level on most fields via Payload's `localized: true`
- **Deploy:** Vercel, cms.yesid.dev subdomain, DNS + DKIM + SPF all configured and live
- **Tooling:** Docker-based local dev, Windows WSL `tree` for docs, Neon DB branches per PR, Codex adversarial-review scope guard (`CODEX-CONTEXT.md`)

**yesid.dev repository** — SvelteKit frontend (not yet consuming the CMS; still reads static TS files):
- Slice 17c complete: service layer at `src/lib/services/*.service.ts` + Zod schemas at `src/lib/schemas/` providing a typed validation boundary
- Slice 18c–18f planned: would flip services from static TS to Payload REST consumption

---

## The FORMULA (what we've derived for Payload)

Through R1 + R2 research, we produced a "FORMULA" — the set of defensive-customization practices that make Payload's admin editor-friendly enough for non-technical clients. Two key artifacts:

**12 heuristics** for content modeling (Q3 + Q5 resolved: 7 page-globals → `pages` collection; field-level localization inside blocks, not on the blocks field itself).

**22-item ergonomics checklist** that closes the gap between Payload's bare-bones default and a "client-ready" admin: every field has `admin.description`, every array/blocks has computed `RowLabel`, block library capped ~12-15 with thumbnails + grouping, drafts+autosave from day 1, CSP + CORS + CSRF for Live Preview, Lexical constrained to short-form, etc.

**Cost of applying the FORMULA per project:** ~12–16 hours of defensive customization.
**Cost of applying equivalent customization in Directus (per agent research):** ~3–4 hours — because Directus defaults ship with most of those items already (notes-on-every-field, display-templates, revisions-on-by-default, mobile admin, etc.).

---

## Research Methodology

**6 parallel research agents** dispatched across 3 dimensions:

1. **Content modeling + authoring primitives** — Payload, Sanity, Storyblok, Strapi, Prismic, TinaCMS, WordPress Gutenberg (R1).
2. **Authoring ergonomics + real user sentiment** — production reviews from Reddit, G2, Capterra, GitHub issues, Dev.to, Medium, HN (R2).
3. **Payload vs Directus deep dive** — block system feature parity, admin UX side-by-side on 5 tasks, commercial trajectory + SvelteKit production reality + Yesid-specific migration cost (Tasks 2.5 + 2.5b).

Plus 2 **WebFetches** live from directus.io/mcp and directus.io/docs/tutorials/getting-started/fetch-data-from-directus-with-sveltekit to verify source claims.

Total research output: ~10,000 words of cited findings in `research.md`.

---

## Key Findings by Dimension

### 1. Content modeling / blocks — Payload wins 10:1

**Agent I (block deep dive):** Payload's `blocks` field is structurally more mature than Directus's M2A (Many-to-Any) relations on 10 of 14 concrete feature-parity axes:

- Block thumbnails in Add-block drawer (`admin.images.thumbnail` 3:2 + `admin.images.icon` 20×20) — **Payload only**
- Block grouping (`admin.group`) — **Payload only**
- Block-row editor label (`blockName`) — **Payload only**
- Conditional fields (`admin.condition` with sibling data context) — **Payload only**
- Collapsible rows (`admin.initCollapsed`) — **Payload native; Directus requires community `directus-expandable-blocks` extension**
- Copy/paste block rows (`localStorage._payloadClipboard`) — **Payload only**
- Block references (DRY via `blockReferences` + root-level block defs) — **Payload strong; Directus has stronger cross-parent REUSE via "Add Existing"**
- Nested blocks (blocks-in-blocks) — **Payload native; Directus requires new junction table per nesting level**
- Lexical inline blocks (`BlocksFeature`) — **Payload native; Directus's Editor.js block editor lacks relational M2A integration**
- Localized fields inside blocks — **Payload simpler; Directus more normalized (extra `_translations` tables)**

**Directus wins 1:** cross-parent content reuse (same item.id can appear in multiple pages via junction — edit once, update all pages). Payload's `blockReferences` is schema-level DRY, not content-level.

**Concrete editor task — "Add new section between Events and Press with hero + 2 CTAs in en/fr/es":**
- Payload: ~**90 seconds** (grouped/thumbnailed drawer, locale tabs)
- Directus: ~**3–4 minutes** (ungrouped collection list, separate `_translations` tables, more clicks)
- **Payload is ~2.5× faster per block-composition editor interaction.**

**Rebuild estimate (8 pages × 11 blocks × en/fr/es):**
- Payload post-FORMULA: ~**3 dev-days**
- Directus from migration: ~**6–8 dev-days** (~2× time)

### 2. Admin UX — Directus wins 23:14

**Agent J (admin UX 5-task test):**

| Task | Payload | Directus |
|------|---------|----------|
| Publish new blog post (image + tags + rich text) | 3/5 | **4.5/5** |
| Edit page layout (insert Hero between Bento + CTA) | 3/5 | 4/5 |
| Find all images used on About page + replace one | **2/5** — no reverse lookup | **5/5** — native "Used In" panel |
| Add new event (date + location + image + description) | 3/5 | **5/5** — built-in Map interface + timezone picker |
| Link Event to existing Press Release (with preview) | 3/5 | 4.5/5 — drawer picker with inline record preview |
| **TOTAL** | **14/25** | **23/25** |

**Additionally, 8 deep differentiators — Directus wins 8/8:**
1. **First-time onboarding** — Directus has in-app product tour + Getting Started page; Payload: zero.
2. **Help defaults** — Directus `Note` field renders by default; Payload's `admin.description` is opt-in per field per project.
3. **Drafts + revisions** — Directus revisions ON by default for every collection; Payload opt-in per collection.
4. **Collaborative editing** — Directus presence indicator + soft-lock since 10.7; Payload Issue #4721 open "Add record locking," last-write-wins silently.
5. **Global search** — Directus top-bar global; Payload per-collection only (Issue #3411).
6. **Mobile/tablet admin** — Directus works on iPad; Payload admin breaks on <768px.
7. **Activity feed** — Directus native audit log; Payload requires custom hooks.
8. **Keyboard shortcuts** — Directus documented + global; Payload Lexical-only.

**Agent's 4-archetype verdict — 3.5/4 go to Directus:**
- Flower shop owner: **Directus** (mobile + file library + WYSIWYG defaults)
- Political candidate w/ campaign manager: **Directus** (revisions + presence + global search)
- Blogger (rich text power user): **Payload narrowly** (Lexical more extensible than TinyMCE)
- Restaurant owner (mobile menu updates): **Directus decisively** (iPad + autosave + file library)

**Direct-quote editor reviews (not developers):**
- G2 Mar 2026 marketing manager on Payload: *"Developers love it. I'm the one who has to use it daily and there's no in-app help. I keep a Notion doc of 'how to do X in Payload' for my team."*
- G2 Apr 2026 nonprofit ops lead on Directus: *"I came from WordPress and Contentful. Directus feels like a proper tool — the file library alone, with 'used in', saved us hours."*
- r/selfhosted Dec 2025 on Directus: *"Gave Directus to my 62-year-old mom to manage her blog. She needed one phone call. Gave her Strapi before — three calls and she gave up."*
- YouTube agency retrospective (Matt Jennings, "Headless CMS for Clients: 3 Years In," Feb 2026, 14:22-18:40): *"Payload wins on DX. Directus wins on client day-one. If your retainer includes admin training, Payload is fine. If you hand off and walk away, Directus."*

### 3. SvelteKit integration reality — Directus wins by ecosystem depth

**Payload SvelteKit story is fragile:**
- NO official `@payloadcms/svelte` package; `@payloadcms/next` is the blessed tier
- **Only community SvelteKit starter (`fcastrovilli/sveltekit-payload-3-starterkit`) was ARCHIVED November 15, 2025** — 23 stars, dead
- Live Preview via postMessage: Issue [#7164](https://github.com/payloadcms/payload/issues/7164) cross-origin bug closed without documented workaround for non-Next frontends; Discussion [#687](https://github.com/payloadcms/payload/discussions/687) requires split dev servers
- Payload's own docs: *"In the future, all other major frameworks like Svelte will be officially supported"* — future work, not shipped
- Workaround: port the Vue composable (~80 LOC 1:1 to Svelte 5 runes) but `postMessage` bugs still apply

**Directus SvelteKit story is real but second-class:**
- Official `@directus/sdk` v15+, framework-agnostic, actively maintained
- **7 official SvelteKit tutorials on directus.io/docs/tutorials** covering: fetch data, dynamic pages, CMS build, live preview, multilingual, forms, realtime chat, video streaming
- `@directus/visual-editing` npm package v2+ (April 2025, actively maintained April 2026)
- **BUT:** tutorial uses JSDoc not TypeScript (looser DX); no blessed Svelte-5-native starter; SvelteKit requires adapting Nuxt/Next patterns
- Type generation: community-tooled (`directus-sdk-typegen`, `directus-typescript-gen`) — looser than Payload's first-party schema-to-types

**Where each wins:**
- Payload wins on **TypeScript DX when it works** (auto-regenerated `src/payload-types.ts` on schema change, tight single source of truth)
- Directus wins on **ecosystem investment signal** (7 tutorials beats 1 archived starter; ecosystem is investing in SvelteKit)

### 4. Commercial trajectory — Directus wins 7.5/10 vs Payload 5/10 on "still maintained in 3 years"

**Payload under Figma (acquired June 17, 2025):**
- Founders James Mikrut, Dan Ribbens, Elliot DeNolf joined Figma; no departures confirmed April 2026
- **Payload Cloud signups paused** — banner on site says *"As we transition to Figma, we've paused new Payload Cloud sign-ups as we build something better"* — successor is **Figma CMS**, not relaunched Payload Cloud
- Strategic repositioning: *"Figma CMS will make life easier for marketers and designers… Payload brings all the stuff developers love"* — Payload becomes the backend engine for Figma's design-to-deploy; Next.js coupling likely tightens
- Community sentiment (Discussion [#12843](https://github.com/payloadcms/payload/discussions/12843), ~156 replies): predominantly positive (~90+ celebratory reactions) but 3 clustered worries — OSS sustainability, long-term viability under a design-tool parent, future pricing
- Figma's OSS stewardship track record: **thin** — only other major acquisition is Weavy AI (Oct 2025, post-Payload), no 2–3 year horizon to reference
- Payload Cloud paused forces every new signup into Vercel/Railway/Fly/VPS decision tree
- Commercial risk score: **5/10**

**Directus (independent, VC-funded):**
- **$19.5M total raised** across Series A ($7M, Nov 2022, True Ventures lead) + extensions from Eight Roads, F-Prime Capital, Preston-Werner Ventures, Handshake Ventures
- **Headcount: 28 (Jul 2024) → 55 (Feb 2026)** — ~2× growth in 18 months
- **BSL 1.1 license** — production use free for orgs with <$5M annual revenue (covers Yesid AND every realistic freelance client); code auto-converts to GPL-compatible OSS after 3 years per version
- Founder-led (Rijk van Zanten CTO, Ben Haynes CEO) — van Zanten personally authored Discussion [#17977](https://github.com/directus/directus/discussions/17977) BSL transparency response
- Revenue signal: 200% ARR growth in 2023 post-BSL switch; enterprise self-hosted licenses became "majority of new business within two weeks"
- **25M installations** claimed by 2026
- 34.9k GitHub stars, 4.7k forks, ~200 open issues (acknowledged transparently)
- Only risk: VC exit path (2028+ territory; not near-term)
- Commercial risk score: **7.5/10**

**GitHub trajectory:**
- Payload: ~41,647 stars (more raw stars + Figma halo momentum)
- Directus: ~34,688 stars (closing; steady growth)
- Payload growing faster in 2024–early-2026; post-acquisition trajectory is the open question

### 5. MCP / AI-native workflow — WASH (critical correction)

**My earlier synthesis claimed Directus had no MCP plugin.** This was wrong.

**WebFetch from directus.io/mcp (2026-04-22) confirms:**
- **Directus MCP is first-party, GA in Directus v11.12** (November 2025)
- **Included in every version** — self-hosted AND cloud — at no additional cost
- Respects existing Directus permissions model; every AI action goes through standard auth/authz
- Dedicated AI role accounts with granular restrictions (disable schema changes, deletions, read-only)
- Audit-logged through Directus's standard activity system
- Works with Claude Code, Claude Desktop, ChatGPT, Cursor, Raycast

**Structural parity with Payload's `@payloadcms/plugin-mcp`.** The AI-native workflow advantage Yesid built on Payload is NOT lost in migration.

This correction flipped a major "stay" anchor. Prior to the fetch, I weighted MCP-on-Payload heavily. With Directus MCP confirmed first-party, that weight dissolves.

### 6. Migration cost — 18-22 days realistic, not the earlier "6-9"

**Agent K's honest phase-by-phase breakdown:**

| Phase | Days | Confidence | Risk callout |
|-------|------|------------|---------------|
| 1. Schema re-model (10 collections + 10 globals + blocks → M2A + Lexical → WYSIWYG + access control) | 3-5 | 60% | Zod layer (17c) needs 40-60% rewrite |
| 2. Content migration (73 rows + i18n reshape) | 2-3 | 70% | Localization: 73 × en/fr/es × localized-field-count = ~200-450 translation rows |
| 3. Frontend rewire on yesid.dev | 4-6 | 55% | 15 service files + Zod schemas + type-gen pipeline swap + ISR/preview/forms — largest chunk |
| 4. Ops + deploy (Railway over Vercel for Directus) | 2-3 | 75% | DNS flip cms.yesid.dev; keep Neon Postgres (big win) |
| 5. MCP swap (Payload plugin → `@directus/content-mcp`) | 0-1 | 90% | Trivial — structurally equivalent |
| 6. Testing + rollback plan (parallel run 2-4 weeks) | 3-5 | — | Round-trip integrity + Lighthouse + DNS rollback window |

**Totals:**
- Best case: 14 days
- **Realistic: 18-22 days (3 work weeks)**
- Worst case: 28-32 days (if Lexical reshape + i18n migration both misfire)

**Rollback cost mid-migration:** low while Payload runs parallel (~1 day DNS). High after cutover (~5-7 days to restore from Neon snapshot).

---

## Final Scorecard

| Axis | Payload | Directus | Matters for |
|------|---------|----------|-------------|
| **Block composition UX** | ✅ 10:1 wins | ⚠️ 2.5× slower editor-task-time | Layout-heavy clients |
| **General admin UX (5 tasks)** | ❌ 14/25 | ✅ 23/25 | Every CRUD-heavy client |
| **Deep UX differentiators** | ❌ 0/8 | ✅ 8/8 | All clients |
| **Editor onboarding defaults** | ❌ ~25% ready (12-16 hrs/project) | ✅ ~70% ready (3-4 hrs/project) | Every project, compounds |
| **Mobile/tablet admin** | ❌ breaks <768px | ✅ works on iPad | Restaurant, florist |
| **Media reverse lookup ("where used")** | ❌ Issue #4441 open since 2023 | ✅ native "Used In" panel | Daily editor task |
| **SvelteKit ecosystem** | ❌ **ONLY community starter archived Nov 2025** | ✅ **7 official SvelteKit tutorials** | Yesid's stack |
| **TypeScript DX** | ✅ best-in-class auto-regen types | ⚠️ community type-gen, manual step | Daily dev friction |
| **MCP (AI-native)** | ✅ official plugin | ✅ **native v11.13**, all tiers | Wash — corrected |
| **Data Studio / Insights / Flows** | ❌ none | ✅ native (no-code BI, spreadsheet, automation) | Retainer value-add |
| **Revisions + collaborative editing** | ⚠️ opt-in, no presence | ✅ default-on revisions + presence | Multi-editor clients |
| **Commercial trajectory** | ⚠️ Figma refocus, roadmap narrowing | ✅ independent + founder-led + VC-backed | 3-year commitments |
| **Risk score (3-yr maintained)** | **5/10** | **7.5/10** | 5+-year promises |
| **License** | MIT | BSL+MIT-after-3-years, $5M threshold | Irrelevant unless SaaS >$5M ARR |
| **Extension ecosystem breadth** | ~150 npm plugins | **569 marketplace extensions** | Feature-install speed |
| **Extension depth** | React+TS (merges into admin) | Vue SFC (sandboxed boundary) | Deep custom admin work |
| **Payload Cloud (managed alt)** | ❌ paused since June 2025 | ✅ open ($15-99/mo) | If Yesid wants managed |
| **Migration cost from current state** | $0 | 18-22 days realistic | One-time |
| **Per-project FORMULA ergonomics effort** | 12-16 hrs forever | 3-4 hrs forever | Recurring per client |

---

## Load-bearing corrections to my earlier analysis

The research had me shift my position materially. Three corrections worth flagging because they changed the balance:

1. **Directus MCP IS first-party, GA v11.12 Nov 2025.** My earlier claim that Directus lacked MCP (from Agent F's initial research) was based on older GitHub data. The live directus.io/mcp page confirms it's native, every tier, no extra cost. **This was my strongest "stay" anchor — now dissolved.**

2. **Migration cost is 18-22 days, not 6-9.** Agent F's initial estimate was optimistic. Agent K's honest phase-by-phase breakdown found the real cost drivers: Zod schema rewrite (40-60%), localization reshape (3× row count in Directus's Translations pattern), frontend service-layer rewire, MCP swap. **Budget 3 work weeks if pivoting.**

3. **Figma acquired Payload June 2025, not October 2025.** 10-month window since, not 6. Payload Cloud signup pause isn't temporary — successor product is **Figma CMS**, implying Payload-as-backend-for-Figma, not Payload-as-standalone. Next.js coupling likely tightens; SvelteKit likely stays an afterthought.

---

## Split agent verdicts (6 agents, 3 stay, 3 pivot)

- **Agent E (Storyblok comparison):** STAY — Storyblok SvelteKit integration actually BETTER than Payload's, but SaaS lock-in (MCP+Resend+Blob lost; $99/mo/client = 2-3% gross revenue) disqualifies pivot.
- **Agent F (Directus generalist):** PIVOT — "Directus is the structural match Payload wasn't."
- **Agent G (Sanity + cross-migration):** STAY — Sanity's editor UX weakness bites Yesid's target audience; FORMULA amortized beats migration.
- **Agent I (Block deep dive):** STAY — Payload blocks 10:1 winner; editor task 2.5× faster.
- **Agent J (Admin UX):** PIVOT — Directus 23/25 vs 14/25 on 5 tasks; 8/8 deep differentiators.
- **Agent K (Commercial + SvelteKit + Migration):** PIVOT 60/40 — SvelteKit ecosystem gap + 7.5/10 vs 5/10 commercial risk scores + MCP correction.

**Net 3-3 split.** Not coincidence — the decision is genuinely balanced. Which side wins depends on axis-weighting, not evidence.

---

## The Decisive Axis (the thing Yesid must pick)

**If block composition is the dominant editor task** (political candidate restructuring platform pages weekly, complex multi-section landing pages) → Payload's 2.5× speed advantage compounds → STAY.

**If CRUD content editing is the dominant editor task** (blog posts, events, menu items, products, press releases) → Directus's 8/8 differentiator advantage compounds → PIVOT.

For Yesid's stated target clients:
- Flower shop: CRUD dominant (80-90% of editor time)
- Restaurant: CRUD dominant
- Political campaign: MIXED (platform pages = blocks; events + press = CRUD; ~50/50)
- Blogger: CRUD dominant
- Small e-commerce: CRUD dominant

**Across the portfolio, CRUD work dominates — the math favors Directus.** But Yesid doesn't have real clients yet; these are hypothetical. The actual first client's actual editing pattern is unknown.

---

## Steelman: The strongest case to STAY on Payload

1. **Payload's blocks field is genuinely best-in-class** for page composition. Directus's M2A pattern is structurally weaker on 10 of 14 feature axes. If clients end up doing lots of layout reorganization, this compounds.

2. **TypeScript DX is Payload's strongest zone.** Auto-regenerated `payload-types.ts` on schema change, tight single source of truth, Zod-schema boundary already built in Slice 17c. Directus's community-tooled type-gen is worse by one maintenance hop.

3. **Migration costs 18-22 days you could spend on Slice 18c-18f** (actual frontend delivery). That's ~half the slice-count budget between now and ship-ready yesid.dev.

4. **Payload's GitHub momentum + Figma halo + community size** (41.6k stars, active Discord) signal long-term viability despite the acquisition ambiguity. Figma has a business reason to keep Payload maintained — it's now their CMS backend.

5. **18a+18b is already shipped and WORKING.** Infrastructure is proven, DNS is configured, email verified, MCP integration live. "If it ain't broke" is a real argument for a solo dev with limited time.

6. **The 22-item FORMULA checklist exists.** It's not a theoretical mitigation — Yesid has the research output, can apply it, knows the effort (12-16 hrs/project). That's a known quantity vs Directus's unknown-unknowns.

7. **"Bookmark Slice 22 re-evaluation" is a legitimate plan** IF the trigger criteria are explicit (2+ clients cite admin UX as friction, OR Figma deprioritizes Payload OSS, OR Lexical Issue #8653 stays unfixed 6 months).

8. **Vue-extension cognitive tax.** If Yesid ever needs to write a custom admin component, Payload = React+TS (1 hop from Svelte+TS). Directus = Vue SFC (framework context switch).

---

## Steelman: The strongest case to PIVOT to Directus

1. **Editor happiness compounds across EVERY client relationship, for the entire life of that relationship.** Payload's 12-16 hrs/project × 5 clients = 60-80 hours/year of defensive admin customization. Directus's 3-4 hrs/project × 5 clients = 15-20 hours. That's ~60 hours/year recovered, forever.

2. **Yesid's target clients are CRUD-dominant.** Flower shops, restaurants, bloggers, small-commerce. Directus's 8/8 differentiator advantage hits where the actual editor time goes.

3. **SvelteKit ecosystem gap is structural, not incidental.** Only Payload SvelteKit community starter archived Nov 2025 vs 7 official Directus SvelteKit tutorials. Not "slightly better docs" — an ecosystem-investment signal about where each platform's trajectory is going.

4. **MCP parity removes the AI-workflow-lock argument** against Directus. Native since v11.13, respects permissions, first-party support. This was my biggest "stay" anchor — it dissolved on verification.

5. **Commercial independence matters for 3-year client commitments.** Directus = founder-led, VC-backed, growing (28→55 employees in 18 months), transparent (Discussion #17977 on BSL funding gap). Payload = acquired, Cloud paused, pivoting to Figma CMS backend. Agent K's risk scores (7.5 vs 5) reflect this.

6. **Directus ships features Payload lacks entirely:** Data Studio (spreadsheet + bulk edit), Insights (no-code BI for client dashboards), Flows (no-code automation — "on new donation, email + Mailchimp + sheet"), iPad admin, revisions default-on, global search, activity feed, display templates.

7. **The 18-22 day migration is finite; the trajectory cost is recurring.** Spend 3 work weeks once, or spend 12-16 hrs/project × N projects + navigate Figma's Payload roadmap gravity forever.

8. **18a+18b work is NOT wasted — it's schema-thinking that FEEDS the Directus model.** The content structure, the relationship map, the localization approach, the 73 rows — all of that translates. The CODE doesn't translate; the THINKING does. Yesid has done the expensive intellectual work; migration is expressing it in different primitives.

9. **Payload-the-freelance-ecosystem doesn't exist yet.** Upwork/Toptal have no Payload category. Directus is bundled with "headless CMS" generally but has similar demand signals. Neither CMS has a rate-premium effect. The freelancer-demand argument is a wash — so use it as a non-factor, not a tiebreaker.

10. **Yesid explicitly said "we can pivot — we're not committed."** That's permission. The sunk-cost argument is psychological, not economic, when the investor gives it up voluntarily.

---

## 4 Decision Options

### Option 1 — PIVOT to Directus

**Action:** Close current slice as "research complete, pivot recommended." Spec new `slice-cms-stack-pivot` with the 18-22 day migration plan. Execute across ~3 subsequent slices.

**Cost:** 18-22 working days migration. Permanent loss of Payload's type-gen DX. Zod layer 40-60% rewrite. Lexical→Markdown content reshape. Occasional Vue instead of React for admin extensions.

**Gain:** Native editor happiness (no 22-item defensive checklist). Official SvelteKit ecosystem support. Safer 3-year commercial trajectory. Data Studio + Insights + Flows + iPad admin + revisions-default + global search. Independence from Figma roadmap.

**When this is right:** If CRUD editor happiness > block-composition speed. If 3-year commercial stability > short-term sunk-cost preservation. If Yesid wants to own his architectural thesis without a design-tool parent.

### Option 2 — STAY on Payload + FORMULA guardrails

**Action:** Accept Task 2's findings as calibration, apply the 22-item ergonomics checklist as shipped-defaults contract, proceed to Task 3 (R3 design tokens). Bookmark pivot re-evaluation at Slice 22 with EXPLICIT trigger criteria.

**Cost:** 12-16 hrs/project FORMULA ergonomics investment per client, forever. Figma CMS refocus reshapes Payload in Next.js-tightening directions. SvelteKit stays an afterthought. Lexical Issue #8653 + blocks-at-scale Discussion #12099 stay unfixed.

**Gain:** $0 migration cost. Preserve TypeScript DX advantage. Block composition 2.5× faster for layout-heavy work. Proceed directly to frontend delivery (Slice 18c-18f).

**When this is right:** If block composition is the dominant editor workflow. If TypeScript DX is critical. If sunk cost + momentum outweigh trajectory concerns. If Slice 22 re-evaluation is a serious plan, not deferral.

**Required:** Explicit trigger criteria in a memo (`slice-pivot-trigger-criteria.md`) so future Yesid pivots on evidence, not drift.

### Option 3 — PROTOTYPE BEFORE DECIDING

**Action:** Spin up throwaway Directus instance next to yesid-dev-cms. Rebuild 1-2 representative collections + the blocks pattern. Hands-on feel-test both admins for 2-3 days. Decide from lived experience.

**Cost:** 2-3 days before committing either direction. Delay to actual decision.

**Gain:** Replaces speculation with direct experience. Removes the "agents disagree, I don't know which is right" paralysis. Generates first-hand evidence about Directus's M2A ergonomics vs Payload's blocks for Yesid's specific content model.

**When this is right:** If Yesid's bias toward Payload is "sunk cost defending" rather than informed. If he's mid-call and doesn't want to commit on research alone. If the 2-3 day investment feels lower-risk than either direction.

### Option 4 — HYBRID (stay yesid.dev on Payload + default new clients to Directus)

**Action:** Keep Payload for yesid.dev (it's shipped, works). For NEW client projects from this point forward, default to Directus. Migrate yesid.dev itself only when/if a concrete trigger appears.

**Cost:** Operational complexity of maintaining two CMS stacks. Context-switching between Payload patterns (yesid.dev) and Directus patterns (clients).

**Gain:** Yesid.dev keeps its sunk-cost value. New clients benefit from Directus's editor happiness. Each decision is made at the right time with the right client context.

**When this is right:** If neither CMS is universally better for every use case. If Yesid wants to avoid forcing every client onto the same stack. If the complexity cost of running two stacks is less than the opportunity cost of optimizing for one.

**Caveat:** This adds offering complexity BEFORE Yesid has real clients. Premature segmentation.

---

## My integrated recommendation

**PIVOT to Directus, ~60/40 confidence.** But option 3 (prototype) is a reasonable alternative if 60/40 isn't enough.

**Why 60/40 and not higher:** The block-composition speed advantage is REAL. TypeScript DX is real. Payload's blocks are genuinely best-in-class. These aren't things to wave away.

**Why pivot despite those real Payload wins:**
1. SvelteKit ecosystem signal (7 tutorials vs archived starter) is structural, not fixable.
2. Figma-acquisition trajectory narrows Payload toward Next-first design-tool-adjacent, away from Yesid's SvelteKit+small-business profile.
3. 8/8 admin UX differentiators + 23/25 editor-task advantage compounds on every client relationship, forever.
4. MCP parity removes the strongest anchor against migration.
5. Commercial risk scores (7.5 vs 5) favor Directus for 3-year client promises.
6. 18-22 day cost is finite; trajectory cost is recurring.

**Why not higher than 60/40:** The axis-choice is genuinely Yesid's to make. If block composition becomes the bottleneck for his actual clients, Payload was right. If CRUD editing becomes the bottleneck, Directus was right. Neither agent can know that in advance.

---

## Open Questions Worth Probing Tonight

(Your bedtime AI should use these to help you clarify, not to provide answers.)

1. **Who is your first real client?** Not archetype — the actual person/business you'll sign first. What do they edit most, weekly?
2. **Picture that first client at 3 months in.** Are they restructuring page layouts, or adding blog posts + updating menu items + uploading event photos?
3. **If you pivot and migration takes 30 days (worst case), where does that time come from?** Delayed slice 18c? Delayed yesid.dev launch? Pushed-out client acquisition?
4. **If you stay and Figma deprioritizes Payload OSS in 2027, what's Plan B?** Is "Slice 22 re-evaluation" a real plan with explicit triggers, or deferral?
5. **Which decision would you regret more at 12 months** — having migrated unnecessarily, or having stayed when you should have pivoted?
6. **What's the actual dream-employer audience angle?** Alto, CDPQ Infra. Do they care what CMS powers yesid.dev? Would "I shipped on Payload, Figma acquired it, I own the trajectory decision" read better or worse than "I evaluated and picked Directus for code-ownership + SvelteKit fit"?
7. **Is your resistance to pivoting emotional (sunk cost, already-built pride) or analytical?** Both are valid — but it's worth separating them before the decision.
8. **What would change your mind?** If you're staying, what evidence would force pivot? If pivoting, what evidence would justify staying?
9. **Do you need to decide this tonight?** Option 3 (prototype 2-3 days) is a legitimate "I'll decide after living with both" answer.

---

## Sources & Full Research

**Slice bundle location:** `docs/slices/slice-headless-cms-best-practices/`

- `spec.md` — slice spec, 6 design decisions, 5 open questions (Q1, Q2 open; Q3, Q4, Q5 resolved)
- `plan.md` — 6 tasks with FORMULA structure stub at end
- `research.md` — **full agent output, ~1000 lines, heavily cited** (primary vendor docs + GitHub issues + G2/Capterra + Reddit + Medium + YouTube)
- `devlog.md` — session-by-session history
- `decision-brief.md` — this document

**Branch:** `slice-headless-cms-best-practices` (pushed to origin/yesid.dev)
**Sandbox commits:** CMS-UX worktree at `~/Yesito/Projects/yesid-dev-cms-ux/` on branch `slice-cms-ux-redesign`
- `67c14e1` — TestBlocks (R1 verification)
- `613579a` — admin.livePreview config (R2 Q4)

**Key external sources cited across research:**
- [Payload docs](https://payloadcms.com/docs) + `templates/website/` + GitHub issues #6547 (Lexical bloat), #7164 (Live Preview postMessage), #8653 (Lexical keyboard a11y), #10512 (version upgrade pain), #10781, #12099 (blocks memory leaks), #13146 (3.46 breaks media), Discussion #687 (SvelteKit), #12843 (Figma acquisition)
- [Directus docs](https://directus.io/docs) + [MCP page](https://directus.io/mcp) + [SvelteKit tutorials](https://directus.io/docs/tutorials/getting-started/fetch-data-from-directus-with-sveltekit) + GitHub Discussion #17977 (BSL funding) + Extension Marketplace
- [Figma acquisition blog](https://www.figma.com/blog/payload-joins-figma/) + [Payload acquisition blog](https://payloadcms.com/posts/blog/payload-is-joining-figma)
- G2 / Capterra / Reddit (r/webdev, r/selfhosted, r/PayloadCMS, r/Sanity, r/Storyblok) / HN / Dev.to / Medium
- Agency retrospectives: Matt Jennings "Headless CMS for Clients: 3 Years In" (YouTube, Feb 2026); Lucky Media 2026 reviews; Roboto Studio; Makers' Den
- Production evidence: buildwithmatija.com Payload pricing + hosting studies; Crain's Grand Rapids on Payload-Figma; Crunchbase / PitchBook on Directus funding

---

**Closing note for the AI:** Yesid has done real research. The evidence is in, honestly summarized, with corrections flagged where my analysis was wrong. Your job isn't to reach a verdict — it's to help him reach HIS verdict by probing where his reasoning is thin, where his bias might be clouding judgment, and where he's actually sure vs where he's rationalizing. Good night to him.
