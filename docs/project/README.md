# `docs/project/` — project-specific documentation

This directory holds **project-owned** documentation. Unlike `docs/reference/` (which is plugin-pulled and never edited locally), every file in `docs/project/` is yours to author and evolve as your project grows.

The workflow plugin promotes per-domain governance documentation: as your project develops new domains (CSS, motion, security, integrations, etc.), each gets its own `docs/project/<DOMAIN>.md`. This README teaches the discipline.

---

## Three categories: DEFAULT / OPTIONAL / EMERGENT

### DEFAULT (auto-created — always)

Every project gets these skeletons at scaffold time. Fill them in as your project takes shape; defer sections you don't have content for yet (operator + workflow self-enhances over time).

| File | Purpose | Fill priority |
|------|---------|---------------|
| `STACK.md` | Tech stack table (language / framework / package manager / lint / test / typecheck / build / deploy) | High — fill at first slice |
| `BINDINGS.md` | Canonical-commands binding (workflow abstract → project concrete: e.g., "verification commands" = `<your test+lint+typecheck>`) + cloud env binding | High — fill at first slice (verification commands needed by Iteration Protocol) |
| `ARCHITECTURE.md` | File structure, data flow, modules, key abstractions, integration boundaries | Medium — fill as the codebase forms |
| `TESTS.md` | Test inventory, conventions, factories, coverage targets | Medium — fill when first tests land |
| `VOCAB.md` | Project vocab + industry vocab + project-specific tool vocab (workflow vocab stays in `docs/reference/VOCAB.md`) | Low — fill as terms emerge across slices |
| `CONSTITUTION.md` | Codebase law — project-wide rules that apply across all domains (naming / immutability / validation / etc.) | Medium — fill when first cross-cutting rule is established |

### OPTIONAL (templates ready to un-comment — create when relevant)

Each `_OPTIONAL_<NAME>.md` file has a "Create when..." header note. When the trigger fires, rename `_OPTIONAL_<NAME>.md` → `<NAME>.md` and start filling. Until then, the underscore-prefix keeps the file visually distinct (and signals "not yet active").

| File | Create when... |
|------|----------------|
| `BRAND.md` | Project owns a brand (visual identity, tone, voice) — typically marketing sites, products, services |
| `CSS.md` | Project has significant styling discipline — design system, tokens, scoped style rules |
| `MOTION.md` | Project has animation as a first-class concern — motion language, timing, choreography |
| `PATTERNS.md` | Project has codified reusable solutions — animation guards, retry strategies, error patterns, idempotency recipes |
| `SERVICES.md` | Project frames itself as service offerings — for service businesses, agencies, freelance work, multi-tenant platforms |

### EMERGENT (you create as needed)

When a domain in your project develops re-derivable rules / patterns / vocabulary across multiple slices, codify it in its own `docs/project/<DOMAIN>.md`. The workflow's self-enhancing principle: **never re-derive the same lesson twice — codify it.**

Examples of EMERGENT project docs (different projects need different ones):

- `MIGRATIONS.md` — database schema discipline (when to add columns vs new tables, naming, rollback rules)
- `SECURITY.md` — threat model, auth patterns, secrets handling, audit log conventions
- `PERFORMANCE.md` — benchmarks, budgets, profiling triggers, optimization patterns
- `INTEGRATIONS.md` — external service contracts, webhook conventions, API client patterns
- `DEPLOYMENT.md` — environment matrix, release rituals, rollback playbook
- `OBSERVABILITY.md` — logging conventions, metrics names, alert thresholds
- `i18n.md` — translation conventions, key naming, locale fallback rules
- `ACCESSIBILITY.md` — a11y standards beyond what `CONSTITUTION.md` captures, keyboard nav, screen reader patterns
- `DATA-LAYER.md` — schema patterns, query conventions, validation rules
- `LICENSING.md` — third-party license tracking, attribution rules

---

## When to create a new project doc — rubric

Trigger any of these and create a new `docs/project/<DOMAIN>.md`:

1. **You re-derived the same rule across 2+ sub-slice specs** — promote to its own doc.
2. **You re-introduced the same vocab term across 2+ contexts** — add to `VOCAB.md` (or split out a domain-specific glossary).
3. **You hit the same OS-specific quirk twice** — log to the OS-quirks registry (`<cloud>/workflow-knowledge/os-quirks/<os>.md` if your project uses it) AND consider a project-specific `<DOMAIN>.md` if the quirk is recurring.
4. **You re-implemented the same code idiom in 3+ files** — extract to `PATTERNS.md` (or create the OPTIONAL template if not yet active).
5. **You re-explained the same architectural principle in 2+ handoff PR descriptions** — promote to `CONSTITUTION.md` or a domain-specific governance doc.

This is the workflow's **self-enhancing principle** in practice. Each codification means the next slice doesn't re-derive that lesson.

---

## How `docs/project/` integrates with the workflow

- **Phase 8 closing checklist** (per `docs/reference/WORKFLOW.md`) includes a step: "if a new domain rule / pattern emerged this slice, codify it in `docs/project/<DOMAIN>.md` (create the file if it doesn't exist)."
- **Self-enhancing workflow** (per `docs/reference/WORKFLOW.md`) adds the row: "Re-encountered a domain rule → `docs/project/<DOMAIN>.md`."
- **`AGENTS.md` (root)** uses the **slot pattern** to bind workflow-abstract concepts to your concrete project: e.g., the Iteration Protocol's "run verification commands" binds to whatever you put in `docs/project/BINDINGS.md`.
- **CLOUD-IV passive detector** (planned: `/workflow-detect-codify`) will scan slice spec.md / handoff.md / devlog.md at close and surface candidates for promotion to `docs/project/<X>.md`. Until that ships, the operator runs the rubric manually at slice close.

---

## What this directory is NOT

- ❌ NOT a copy of `docs/reference/` — that's plugin-pulled, never edited locally.
- ❌ NOT a place for slice-specific work — slices live at `docs/slices/<slice-name>/`.
- ❌ NOT a place for one-off session notes — non-slice sessions live at `docs/sessions/<YYYY-MM-DD>-<topic>.md`.
- ❌ NOT a substitute for the codebase itself — these are governance docs (rules, conventions, vocabulary), not code documentation. Code documentation lives next to the code (JSDoc / docstrings / inline comments).

---

## Maintenance

Review this directory at every slice close (Phase 8). Specifically:

- [ ] Did this slice introduce any new domain rule that's not yet in any `docs/project/<X>.md`? If yes, codify.
- [ ] Did this slice re-derive content that already exists in a project doc? If yes, that's a sign the project doc isn't being consulted — fix the visibility.
- [ ] Are any DEFAULT skeletons still mostly empty after several slices? Either project hasn't grown into them yet (fine, defer) OR the operator hasn't been filling them as work emerges (problem, address at slice close).
- [ ] Are any OPTIONAL templates relevant now? If yes, un-prefix and start filling.
- [ ] Are there EMERGENT docs that should be created based on the trigger rubric above?

The workflow self-enhances. Project docs accumulate organically as work happens — never empty, never bloated, always at the right level of detail for the project's current state.
