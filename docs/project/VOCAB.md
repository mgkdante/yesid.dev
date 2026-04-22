# Vocabulary

Shared lexicon for this project. Companion to `docs/reference/VOCAB.md` (which carries workflow vocabulary — Slice, Sub-slice, Iteration Protocol, etc.).

> **Fill priority:** Low at scaffold time; grow per slice close. Each slice that introduces new terms adds them here per `docs/reference/WORKFLOW.md § Phase 8` step 3.

## How to use this doc

- **Operator:** skim industry + tool sections to absorb standard vocab. When you see a project-specific term you don't recognize in a session, grep here first.
- **AI tool:** load this file every session (it lives in `docs/project/`, project-owned). When operator uses a project term you don't know, check here before asking.
- **Adding a term:** brand vocab in §2; industry vocab as-this-project-uses-it in §3; tool vocab in §4. Add at slice close per Phase 8 closing checklist. Use absolute dates only.

---

## 1. How terms are structured

Each entry:
- **Term** — the word as used in this project
- **Category** — brand / industry / tool / domain
- **Meaning** — one-sentence working definition
- **Where to find it** — file path, function, or reference

When a project term has an industry equivalent, both entries cross-link in §6.

---

## 2. Project / brand vocabulary

> Names invented for this project. Concepts the team coined that don't have standard industry names. If the AI sees these in a spec or conversation, it should know exactly what concrete code, pattern, or concept is meant.

| Term | Meaning | Where |
|------|---------|-------|
| <!-- FILL IN: e.g., "Hot path" --> | <!-- e.g., "the realtime cycle that runs every 60s in production" --> | <!-- e.g., "src/orchestration.py" --> |
| <!-- FILL IN --> | <!-- --> | <!-- --> |

## 3. Industry vocabulary — as-this-project-uses-it

> Standard terms from the broader industry / language / framework that this project uses. Capturing them here means new contributors learn the vocabulary by proximity to project usage.

### <!-- FILL IN: domain category, e.g., "Web fundamentals" -->

| Term | Meaning | Where we use it |
|------|---------|-----------------|
| <!-- FILL IN: e.g., "Idempotency" --> | <!-- "operation that produces the same result regardless of how many times it's invoked" --> | <!-- "every ingestion endpoint MUST be idempotent — see ARCHITECTURE.md § Data flow" --> |

### <!-- FILL IN: another domain, e.g., framework-specific -->

| Term | Meaning | Where |
|------|---------|-------|
| <!-- FILL IN --> | <!-- --> | <!-- --> |

## 4. Tool vocabulary

> Terms specific to AI tools (Claude Code, Codex, etc.) or development tooling that the project uses. Distinct from `docs/reference/tools/` (which carries the workflow plugin's per-tool overlay info).

| Term | Meaning | Where |
|------|---------|-------|
| <!-- FILL IN: e.g., "Subagent" --> | <!-- "a separate Claude conversation dispatched with the Agent tool — runs in its own context" --> | <!-- "use for parallel research; never for implementation without owner approval" --> |
| <!-- FILL IN --> | <!-- --> | <!-- --> |

## 5. Domain vocabulary

> Terms from the project's business / problem domain. Different from §3 (industry/tech vocab); this is about WHAT the project models.

### <!-- FILL IN: domain category, e.g., "Transit data model" -->

| Term | Meaning | Where |
|------|---------|-------|
| <!-- FILL IN: e.g., "GTFS-RT trip update" --> | <!-- "a real-time message about a trip's stop-time updates per the GTFS Realtime spec" --> | <!-- "src/ingest/realtime.py" --> |
| <!-- FILL IN --> | <!-- --> | <!-- --> |

## 6. Cross-reference: project ↔ industry

> When the project invented a name for something that has a standard industry equivalent, list both here so the team can code-switch.

| Our term | Industry equivalent | Why we rename it |
|----------|---------------------|------------------|
| <!-- FILL IN --> | <!-- --> | <!-- --> |

---

## Maintenance

- **Review at every slice close.** Phase 8 closing checklist step 3 ("vocabulary update") triggers an addition here for every new term introduced.
- **Deprecate** terms no longer used: keep the entry, mark `(deprecated YYYY-MM-DD — replaced by X)`.
- **Update** when meaning shifts (rare): add an absolute date.
- **Aim for ~300 lines max.** Each entry is one row; if a term needs multi-paragraph explanation, link out to a dedicated file.
- **No project-specific paths in workflow vocab.** Workflow terms (Slice, Sub-slice, etc.) live in `docs/reference/VOCAB.md` (plugin-pulled), not here.
