# slice-18 — Research Notes

> Findings accumulate here as Tasks 2+ progress. **Nothing authoritative yet** — the authoritative record is `docs/slices/slice-headless-cms-best-practices/` (PR #31). This file captures slice-specific findings downstream of that research.

## Primary reference

- **[../slice-headless-cms-best-practices/decision-brief.md](../slice-headless-cms-best-practices/decision-brief.md)** — pivot rationale, FORMULA, 12-heuristic scoring. Read first.
- **[../slice-headless-cms-best-practices/research.md](../slice-headless-cms-best-practices/research.md)** — 22-item deep research bundle. Skim § SvelteKit integration + § Directus deep-dive before Task 2.

## Task 2 agenda (scoped here; expands during Task 2)

Headings pre-reserved so spec.md D-entries have a stable anchor. Append findings under each subsection as the research progresses.

### Adapter contract mapping

> How does Directus's content API surface map to `ContentAdapter` in `src/lib/adapters/types.ts`? Field-level mapping for services, projects, blog, meta. Locale handling. Query patterns (REST vs SDK vs GraphQL).

*TBD — Task 2.*

### Hosting options

> Directus Cloud vs self-host (Railway / Fly.io / Render / Docker on existing infra). Cost, ops burden, scaling headroom, DKIM/SPF implications.

*TBD — Task 2.*

### Storage options

> Directus storage adapters (local FS, S3-compatible, Vercel Blob, Cloudinary). Cost, DX, portability, egress patterns for the site's asset mix.

*TBD — Task 2.*

### Schema provisioning approach

> Directus Data Studio (GUI) vs schema-snapshot CLI vs hand-rolled SQL. Reproducibility, review-ability, drift detection, how it fits Git workflow.

*TBD — Task 2.*

### Locale strategy

> Directus translations collections vs multiple collections per locale vs JSON-per-field. How each maps to the existing `LocalizedString` interface without breaking typed consumers.

*TBD — Task 2.*

### Seed migration path

> Export the current 73 Payload rows from Postgres → import into Directus. Preserve IDs? Regenerate? Locale parity verification.

*TBD — Task 2.*

### Built-in features vs custom extensions

> Per `feedback_prefer_platform_builtins.md`: inventory Directus built-ins that cover our needs (Flows, Roles, Policies, Translations, Files, Webhooks). Flag anything that would require a custom extension BEFORE Task 3 and justify it in a spec D-entry.

*TBD — Task 2.*

## Appending rules

- Append-only. Don't rewrite prior findings — amend with a dated note.
- Every finding carries its source (URL, Directus docs version, or commit SHA of tested config).
- Decisions flow from findings here → D-entries in `spec.md`. Don't let the spec drift from the research.
