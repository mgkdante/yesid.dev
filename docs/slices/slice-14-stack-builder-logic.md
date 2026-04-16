# Slice 14 — Stack Builder Logic Engine

**Status:** draft
**Priority:** 2
**Estimated effort:** 3-4 sessions (multi-session sub-slice)
**Depends on:** 10 (tech stack page), 13 (home redesign — for integration context)

## Objective

Replace the hardcoded scenario matching system with a graph-based recommendation engine that generates unique, contextual, educational stack recommendations for every possible domain combination — connecting each recommendation to real services, projects, and Yesid's expertise so visitors can assess fit and take action.

## Context

The current "Build Your Stack" configurator (Slice 10f) has 7 authored scenarios + a basic graph fallback. This works for the exact 7 combos that have scenarios, but falls flat for the other 120+ possible combinations (7 domains × 1-3 selections = 127 unique combos). The fallback generates a list of top-connected nodes and a template sentence — no real context, no education, no service tie-in.

The stack builder is a **sales tool disguised as an educational tool**. When someone picks "Data Engineering + Analytics," they should learn:
- What each recommended tech does and why it's in the pipeline
- How the techs connect to each other (data flow story)
- Which of Yesid's services cover this stack
- Which real projects used a similar stack
- What Yesid's proficiency level is for each piece
- A clear CTA to discuss building this exact stack

This is the "Build Your Stack" backend that makes the frontend (10f) actually useful.

## Design Principles

1. **Every combination is unique.** No two domain selections produce identical output. The engine computes recommendations from the graph, not from a lookup table.

2. **Recommendations tell a story.** Not just "here are 5 tools" — but "data enters through PostgreSQL, Python transforms it, Airflow orchestrates the pipeline, and Power BI surfaces the insights." The data flow narrative is the educational core.

3. **Connected to the rest of the site.** Recommendations link to services (slice 09), projects (slice 08), and tech detail content (slice 10). The builder is a hub, not an island.

4. **Proficiency-aware.** Yesid's expertise level shapes recommendations. Expert-level tech gets priority and confidence language. Familiar-level tech gets honest framing ("I work with this when the project needs it").

5. **Scalable by data, not by code.** Adding a tech = one markdown file. Adding a domain = one type union member + one phrase. The engine adapts automatically. Zero hardcoded scenario files needed.

6. **Cloud-ready.** All recommendation logic runs as pure functions on structured data. When Payload (Slice 18) arrives, the same functions work against CMS-managed content — the service-layer seam means only the data-source implementation changes. When/if an API endpoint is needed, the logic lifts cleanly into a server route.

7. **User control.** People can refine: pick domains, see the recommendation, then toggle individual techs on/off to customize further. The builder responds to every change with updated context.

## Tech Stack

SvelteKit 2 + Svelte 5, TypeScript, Vitest + @testing-library/svelte

No new dependencies. This is pure data logic + UI integration.

## Data Model Changes

### New types

```typescript
// A computed recommendation — the output of the engine
interface StackRecommendation {
  id: string                          // deterministic hash from inputs
  domains: DomainCluster[]            // what was selected
  stack: RecommendedTech[]            // ordered list of recommended tech
  narrative: LocalizedString          // the data flow story (auto-generated)
  services: RecommendedService[]      // matching services with context
  projects: RecommendedProject[]      // matching projects with context
  confidence: 'strong' | 'solid' | 'exploratory'  // based on proficiency mix
}

// A single tech in the recommendation, with WHY context
interface RecommendedTech {
  item: TechStackItem
  role: string                        // "Data storage", "Orchestration", "Visualization"
  why: string                         // "Chosen for its reliability in ETL pipelines"
  position: number                    // order in the data flow (1 = first)
  removable: boolean                  // can the user toggle this off?
  alternatives: string[]              // IDs of techs that could replace this
}

// A service linked to this recommendation
interface RecommendedService {
  serviceId: string
  relevance: string                   // "Covers the data pipeline portion of this stack"
}

// A project that used a similar stack
interface RecommendedProject {
  projectSlug: string
  overlap: string[]                   // tech IDs shared with this recommendation
  relevance: string                   // "Used PostgreSQL + Python + Airflow in production"
}
```

### New content structure

```
src/content/stack/[id].md             — MODIFY: add `role` and `alternatives` to frontmatter
src/lib/data/stack-builder.ts         — CREATE: recommendation engine
src/lib/data/stack-builder.test.ts    — CREATE: engine tests (heavy coverage)
```

## File Structure

### New Files

```
src/lib/data/stack-builder.ts                  — CREATE: recommendation engine (pure functions)
src/lib/data/stack-builder.test.ts             — CREATE: engine tests
src/lib/data/stack-roles.ts                    — CREATE: role derivation logic (what role does each tech play?)
src/lib/data/stack-narratives.ts               — CREATE: narrative generation (data flow stories)
src/lib/components/StackBuilderPanel.svelte    — CREATE: enhanced configurator with tech toggles
src/lib/components/StackBuilderPanel.test.ts   — CREATE: panel tests
src/lib/components/StackRecommendation.svelte  — CREATE: rich recommendation card (replaces StackScenarioCard)
src/lib/components/StackRecommendation.test.ts — CREATE: recommendation card tests
```

### Modified Files

```
src/lib/data/types.ts                          — MODIFY: add StackRecommendation, RecommendedTech, etc.
src/lib/data/tech-stack.ts                     — MODIFY: add role/alternatives support to parser
src/content/stack/*.md                         — MODIFY: add role + alternatives frontmatter to each file
src/routes/tech-stack/+page.svelte             — MODIFY: replace StackConfigurator+StackScenarioCard with StackBuilderPanel+StackRecommendation
src/lib/components/StackConfigurator.svelte    — REMOVE: replaced by StackBuilderPanel
src/lib/components/StackScenarioCard.svelte    — REMOVE: replaced by StackRecommendation
src/content/scenarios/*.md                     — REMOVE: replaced by computed recommendations
```

### Reused

```
src/lib/data/tech-stack.ts                     — existing graph data, connection helpers
src/lib/data/services.ts                       — service data for cross-linking
src/lib/data/projects.ts                       — project data for cross-linking
src/lib/components/StackDiagram.svelte         — existing diagram with recommendedIds prop
```

---

## Task 14a: Recommendation Engine Core

**Session:** 1 of 3-4
**Files:**
- Create: `src/lib/data/stack-builder.ts`, `src/lib/data/stack-builder.test.ts`
- Create: `src/lib/data/stack-roles.ts`
- Modify: `src/lib/data/types.ts`

- [ ] **Step 1: Define types**
  Add `StackRecommendation`, `RecommendedTech`, `RecommendedService`, `RecommendedProject` interfaces to types.ts.

- [ ] **Step 2: Build role derivation**
  Create stack-roles.ts. Given a tech item and a set of selected domains, derive the tech's ROLE in the pipeline (e.g., "Data storage", "API gateway", "Frontend rendering"). Roles should be computed from the tech's layer + domains + position in the connectsTo graph, not hardcoded per tech.

- [ ] **Step 3: Build the recommendation engine**
  Create stack-builder.ts. Core function: `buildRecommendation(domains: DomainCluster[]): StackRecommendation`.
  
  The engine should:
  - Find all tech items in the selected domains
  - Score items by graph connectivity, proficiency, and bridge status
  - Select the optimal set (3-7 items depending on domain count)
  - Order them by data flow (data layer → backend → API → frontend)
  - Derive role and "why" text for each
  - Identify alternatives for each tech
  - Compute a confidence level from proficiency distribution
  - Cross-reference services and projects for relevance

- [ ] **Step 4: Service and project cross-linking**
  Match recommended tech against existing service `stack` arrays and project `stack` arrays. Generate relevance strings explaining the connection.

- [ ] **Step 5: Heavy test coverage**
  Test every domain combination class:
  - Single domain (7 tests)
  - Common pairs (at least 5 tests)
  - Triple selections (at least 3 tests)
  - Edge cases: domains with no shared tech, all-expert vs all-familiar stacks
  - Determinism: same inputs → same outputs
  - Ordering: data flow order is logical (storage before processing before presentation)

- [ ] **Step 6: Run tests**

**STOP. Ask Yesid to verify engine output for several combinations before moving to 14b.**

---

## Task 14b: Narrative Generation

**Session:** 2 of 3-4
**Files:**
- Create: `src/lib/data/stack-narratives.ts`
- Modify: `src/lib/data/stack-builder.ts` (integrate narrative)

- [ ] **Step 1: Build narrative templates**
  Create stack-narratives.ts. Generate a 2-3 sentence data flow narrative from the ordered tech list. Template-driven but domain-aware:
  - "Data enters through [tech], gets transformed by [tech], and is orchestrated by [tech]."
  - Adapt language to the domain mix (data-heavy vs web-heavy vs mobile)
  - Use proficiency to add confidence markers ("battle-tested with PostgreSQL" vs "works with Flutter when the project needs it")

- [ ] **Step 2: Integrate into engine**
  Wire narrative generation into `buildRecommendation()`. The narrative becomes part of the recommendation output.

- [ ] **Step 3: Test narratives**
  Verify narratives for key combos. Check that they're grammatically correct, mention the right tech, and adapt tone to proficiency.

- [ ] **Step 4: Run tests**

**STOP. Ask Yesid to review narrative quality before moving to 14c.**

---

## Task 14c: Enhanced UI — StackBuilderPanel + StackRecommendation

**Session:** 3 of 3-4
**Files:**
- Create: `StackBuilderPanel.svelte`, `StackRecommendation.svelte`, tests
- Modify: `+page.svelte` (swap old components)
- Remove: `StackConfigurator.svelte`, `StackScenarioCard.svelte`, `src/content/scenarios/*.md`

- [ ] **Step 1: Build StackBuilderPanel**
  Enhanced configurator that adds tech toggle capability. After domains are selected and a recommendation is generated, each recommended tech appears as a toggleable chip. Users can remove a tech to see what changes (alternatives suggested). Gives real control over the stack.

- [ ] **Step 2: Build StackRecommendation**
  Rich recommendation card replacing StackScenarioCard. Shows:
  - Data flow visualization (ordered tech with role labels)
  - Narrative paragraph
  - Service links ("This stack is covered by: Data Pipeline Architecture, Analytics & BI")
  - Project evidence ("Similar stack used in: Transit Data Pipeline")
  - Proficiency indicators per tech
  - Confidence badge (strong/solid/exploratory)
  - CTA: "Let's build this stack" → /contact with pre-filled context

- [ ] **Step 3: Wire into page**
  Replace StackConfigurator + StackScenarioCard with new components in +page.svelte. Desktop: below diagram. Mobile: FAB overlay.

- [ ] **Step 4: Remove old files**
  Delete StackConfigurator.svelte, StackScenarioCard.svelte, src/content/scenarios/*.md. The engine replaces all hardcoded scenarios.

- [ ] **Step 5: Tests + run**

**STOP. Ask Yesid to verify the full Build Your Stack flow before closing.**

---

## Task 14d: Polish + Content Update (if needed)

**Session:** 4 (if needed)
**Files:** Various polish, markdown content updates, role/alternative data in stack files

- [ ] **Step 1: Add role and alternatives to all 34+ stack markdown files**
- [ ] **Step 2: Fine-tune narrative templates**
- [ ] **Step 3: Mobile UX polish for the builder panel**
- [ ] **Step 4: Accessibility review**
- [ ] **Step 5: Final tests + check**

**STOP. Final review before slice close.**

---

## Execution Order

Strictly sequential:
```
14a (engine core) → 14b (narratives) → 14c (UI) → 14d (polish, if needed)
```

14a and 14b are pure logic — no UI changes. 14c swaps UI components. 14d is conditional polish.

**Estimated sessions per sub-slice:**
- 14a: 1 session (data logic is well-scoped)
- 14b: 1 session (template generation)
- 14c: 1-2 sessions (UI work + integration)
- 14d: 0-1 session (polish only if needed)

## Out of Scope

- Payload CMS integration (Slice 18 — see `docs/specs/2026-04-16-cms-payload-design.md`)
- Individual `/tech-stack/[id]` sub-routes (future SEO slice)
- AI-powered recommendations (this is deterministic graph logic)
- Pricing or package builder (different feature entirely)
- Light theme support
- A/B testing of recommendation quality
- Analytics tracking of builder usage (future)

## Acceptance Criteria

- [ ] Every possible domain combination (127 combos) produces a unique recommendation
- [ ] Recommendations include ordered tech with role labels and "why" context
- [ ] Recommendations include a 2-3 sentence data flow narrative
- [ ] Recommendations cross-link to matching services (with relevance text)
- [ ] Recommendations cross-link to matching projects (with overlap detail)
- [ ] Confidence level adapts to proficiency mix (expert-heavy = "strong")
- [ ] Users can toggle individual tech on/off to customize the recommendation
- [ ] Adding a new tech requires only one markdown file (zero engine code changes)
- [ ] All 34+ markdown files have role and alternatives data
- [ ] `bun run test` and `bun run check` pass
- [ ] Engine is pure functions — no side effects, no DOM, no framework dependency
- [ ] Mobile FAB overlay works with the enhanced builder panel

## Learn

### Graph-Based Recommendation Systems
**What it is:** Computing recommendations by traversing a directed graph (nodes = technologies, edges = connectsTo) rather than looking up pre-authored scenarios. The graph structure encodes relationships; the algorithm extracts the best path for each query.
**Why it matters:** This is the same approach used in dependency resolution (npm), route planning (Google Maps), and content recommendation. The graph grows with your data — you never write scenario files again.
**Try this:** Add a new tech markdown file with `connectsTo` edges to 2-3 existing techs. Run `buildRecommendation()` for a domain that includes the new tech. It should appear in the recommendation automatically.
**Go deeper:** https://en.wikipedia.org/wiki/Graph_traversal

### Pure Functions as Backend Logic
**What it is:** Writing business logic as pure functions (input → output, no side effects) that can run anywhere: browser, server, API endpoint, CLI tool. The recommendation engine has zero dependency on SvelteKit, the DOM, or any framework.
**Why it matters:** When Payload arrives in Slice 18, the same engine works. When you add an API endpoint, the same engine works. When you want to test, you just call the function. This is the "cloud-ready" pattern — your logic is portable.
**Try this:** Import `buildRecommendation` in a test file and call it directly. No rendering, no components, no setup. It just returns data.

### Sales Through Education
**What it is:** Building a tool that teaches first and sells second. The stack builder helps visitors understand what technologies they need and why — and in doing so, demonstrates that Yesid understands their problem deeply enough to solve it.
**Why it matters:** Consultants who educate their prospects close more deals. The builder is not a product — it's proof of expertise. Every recommendation that correctly explains a data pipeline is a signal to the visitor that Yesid can actually build it.

## Verify

1. Navigate to `/tech-stack` → scroll to Build Your Stack
2. Select "Data Engineering" → recommendation shows PostgreSQL → Python → Airflow → Docker with flow narrative, service link to "Data Pipeline Architecture", project link to "Transit Data Pipeline"
3. Select "Data Engineering" + "Analytics" → recommendation adds Power BI/DAX, narrative changes to pipeline-to-dashboard story, both services linked
4. Toggle off "Airflow" in the builder → alternative suggested (e.g., manual orchestration note), narrative updates
5. Select "Web Development" + "Mobile" + "DevOps" → unique triple-domain recommendation with high confidence (expert-heavy), multiple services linked
6. Add a test markdown file → it appears in recommendations for its domain automatically
7. Run all tests → 100% of domain combos produce valid, non-empty recommendations
