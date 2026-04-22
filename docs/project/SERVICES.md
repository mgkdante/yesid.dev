# yesid.dev — Services

> **Project framing.** yesid.dev's core unit of value is **service offerings**, not a single product. This file is the positioning + audience + catalog canonical reference — the one place anything user-facing (marketing copy, service pages, About, portfolio) anchors to.

Cross-references: [`BRAND.md`](BRAND.md) (visual identity) · [`BINDINGS.md`](BINDINGS.md) (workflow bindings) · [`VOCAB.md`](VOCAB.md) (brand + industry terminology).

## Positioning

**Freelance Digital Infrastructure.** Designing, building, and maintaining the data + web systems behind small-to-medium operations. The work bridges what's usually split across three roles — data engineer, full-stack developer, and brand-aware design system builder — and delivers it under one engagement model with workflow rigor that compounds across slices.

Trade secret: the workflow itself. Each engagement strengthens a portable slice-based workflow (AGENTS.md + `/workflow-*` plugin tooling) that compounds quality slice-over-slice. Competitors trade time for money; yesid.dev trades workflow refinement for repeatable quality.

## Audience(s)

Dual-audience by design — the site must speak to both in parallel without compromising either.

| Audience             | Profile                                                             | What they need                                                              | How the catalog speaks to them                                                           |
|----------------------|---------------------------------------------------------------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| **Freelance clients**| Small-to-medium businesses needing data infrastructure, brand-ready web work, or integration engineering. Typical size: 10–200 people. | Fast turnaround, fixed-scope engagements, transparent pricing, working code at the end. | Engagement model + sample work snapshots + price ranges + "start in 2 weeks" availability signal. |
| **Dream employers**  | Companies hiring for senior / staff data + full-stack infrastructure roles (Alto, CDPQ Infra, infra-adjacent orgs). | Evidence of capability across the full stack — from GTFS-RT ingestion to SvelteKit 2 to brand system authorship. | Deep technical case studies (per-slice narratives) + breadth across services + workflow-as-IP as a differentiator. |

The site never mode-switches between the two — the same content serves both, calibrated so a prospective client sees "fast competent delivery" and a prospective employer sees "senior judgment + systems thinking."

## Service catalog (6 services)

Each service has a dedicated page at `/services/<slug>` with case studies. Kept tight here; full stories live at the detail pages.

| Service                       | What it is                                                                                     | Sample deliverables                                                                                             | Primary audience        |
|-------------------------------|------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|-------------------------|
| **SQL Development**           | Schema design, query optimization, ETL development, reporting.                                 | Schema migrations, slow-query rewrites, analytical mart builds, ad-hoc Postgres / ClickHouse scripts.           | Freelance clients       |
| **Data Pipeline Engineering** | Bronze / Silver / Gold pipelines, operational data flow design, realtime ingestion.            | GTFS-RT ingestion, Postgres landing tables, Power BI marts, Dagster / Prefect orchestration.                    | Both — transit + agencies |
| **Web Development**           | Full-stack web apps, SvelteKit / Next.js sites, performance-first front-ends.                  | Production sites, internal tools, marketing pages with brand systems.                                           | Both                    |
| **Design System Engineering** | Brand-code-design-system authorship. Token lockdown, atomic primitives, Constitution-as-law.   | Token systems, component libraries (headless + brand primitives), CSS architecture (three-layer), motion vocabularies. | Both — visible at agencies |
| **Integration Engineering**   | Connecting systems — CMS ↔ site, auth providers, payment flows, webhook infrastructure.        | Payload CMS migrations (Slice 18), Stripe integration, Resend transactional email, OAuth flows.                 | Freelance clients       |
| **Workflow Authorship**       | Codifying a team's development workflow as portable IP — slice templates, session types, adversarial review loops. | AGENTS.md contracts, `/workflow-*` plugin customizations, cross-tool handoff protocols, workflow retrospectives.    | Dream employers (rare skill) |

Full service details: see `/services/<slug>` pages (driven by `src/lib/content/services.ts` content + the `ServiceListingPage.svelte` layout).

## Engagement models

| Model                        | When it applies                                                | Pricing pattern                                              | Sample timeline                    |
|------------------------------|----------------------------------------------------------------|--------------------------------------------------------------|------------------------------------|
| **Fixed-scope project**      | Well-defined deliverable, clear acceptance criteria.           | Fixed price + scope; change orders for additions.            | 2–6 weeks typical                  |
| **Retainer (ongoing)**       | Ongoing capacity for a portfolio of work, evolving priorities. | Monthly fee for capped hours; rolling commitment.            | Rolling 3-month commitment         |
| **Hourly consulting**        | Ad-hoc advisory, pair-debugging, architecture reviews.         | Hourly rate; weekly invoice.                                 | Open-ended                         |
| **Discovery engagement**     | Pre-project scoping before any implementation work.            | 1-week fixed fee; credited against subsequent project work.  | 1 week (mandatory for new clients) |

Dream employers implicit engagement: portfolio = the site itself + the workflow + open-source contributions (e.g., `mgkdante/workflow` plugin). No pricing — the work speaks.

## Differentiation

**Workflow-as-IP.** Each engagement strengthens a portable slice-based workflow that compounds quality across all clients. The workflow itself — slice hierarchy, iteration protocol, three-tier context, self-appending handoffs, cross-tool adversarial review — is personal IP codified in `mgkdante/workflow`, documented in `docs/reference/WORKFLOW.md` (plugin-pulled) + AGENTS.md discipline. Competitors trade time for money; this offering trades workflow refinement for repeatable quality.

**Full-stack + brand.** Most data-infrastructure freelancers don't do visual design; most design-system engineers don't do Postgres optimization. The crossover — brand-aware system design, infrastructure that ships with a thought-through UI — is rare and signals senior judgment to both audiences.

**Workflow-visible on the site itself.** The site IS the portfolio. Every slice shipped (17a–17j, 18a–18b, CLOUD, CLOUD-II, ...) is a tangible demonstration of how engagements unfold. Clients and employers can read the actual devlogs, handoffs, and PR bodies.

## Cross-service engagement patterns

Process patterns that apply across multiple services. Different from [`PATTERNS.md`](PATTERNS.md) (code patterns) — this is engagement / process.

| Pattern                  | Applies to                                         | Description                                                                                                |
|--------------------------|----------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| **Discovery phase**      | Every new-client engagement                        | 1-week paid scoping engagement before any project work — requirement elicitation, stack assessment, plan draft. |
| **Slice-based delivery** | Projects ≥ 2 weeks                                 | Work decomposed into slices (sub-slices = PR boundaries) with per-slice acceptance gates. Transparent progress. |
| **Workflow documentation** | Every engagement                                 | Client receives docs/slices/ archive + handoff summary at project close. No black-box delivery.            |
| **Adversarial review**   | Engagements with ≥ 1 week of implementation        | Claude + Codex cross-review critical design decisions + PR bodies. Defect surface reduced.                 |

## Notes / decisions

- **6 services, not more:** tested larger catalog earlier (9 services) — too diluted. Six is the maximum where each service has a distinct audience + deliverable profile.
- **"Workflow Authorship" is the counter-intuitive service:** rare skill, hard to sell to freelance clients (too meta), but reads as "senior / staff judgment" to dream employers. Keeping it in the catalog even though revenue is near-zero — it's signal.
- **Dual audience > pivot to one:** earlier drafts chose one audience. Result was either (a) too-casual for employers or (b) too-employer-focused for clients to convert. Dual audience forces the writing to be rigorous.
- **No "CMS development" service:** subsumed by Integration Engineering + Web Development. Having a dedicated CMS service tempts clients to scope it in isolation — which is where CMS projects fail. Better to frame as "integration + content modeling."
- **Pricing visible at detail-page level, not listing:** hides ranges behind one-click to deter tire-kickers while still being transparent once interested.
