# Constitution

**Project codebase law.** Cross-cutting rules that apply across all domains. Specific domain rules live in their own `docs/project/<DOMAIN>.md` (e.g., `CSS.md`, `MOTION.md`, `MIGRATIONS.md`); this file is for rules that span domains.

> **Fill priority:** Medium. Add a rule when the FIRST cross-cutting principle is established (typically slice 1 or 2). Each rule should be load-bearing across multiple slices — not a one-off preference.

## Authority

This file governs every slice. If a slice's spec.md violates a rule here, either:
- Amend the slice spec to comply, OR
- Amend this file (via slice spec D-decision) and document the amendment in § Amendments log below.

The constitution is amendable but **never silently violated**. Every change is explicit + dated + rationale-recorded.

---

## I. Core principles

> 3-5 founding principles that frame all other rules. These are the project's "why".

### Principle 1: <!-- FILL IN: title -->

<!-- FILL IN: one paragraph stating the principle + why it matters + what it implies for code / process / decisions. -->

### Principle 2: <!-- FILL IN -->

<!-- FILL IN -->

### Principle 3: <!-- FILL IN -->

<!-- FILL IN -->

---

## II. Universal rules

> Rules that apply to every file, every commit, every PR. Numbered for easy reference in code review.

### Rule 1: <!-- FILL IN: short title -->

<!-- FILL IN: rule statement + rationale + enforcement (where it's checked: lint / test / human review). -->

### Rule 2: <!-- FILL IN -->

<!-- FILL IN -->

---

## III. Naming + style

> Project-wide naming + style conventions. Domain-specific naming lives in the domain's own doc (e.g., CSS class naming in `CSS.md`).

| Convention | Rule |
|-----------|------|
| Files | <!-- FILL IN: e.g., "kebab-case for source files; PascalCase for classes/components" --> |
| Functions / methods | <!-- FILL IN: e.g., "camelCase; verb-led for actions, get/set for accessors" --> |
| Variables | <!-- FILL IN --> |
| Constants | <!-- FILL IN --> |
| Tests | <!-- FILL IN: e.g., "describe / it pattern; positive case first" --> |
| Comments | <!-- FILL IN: e.g., "explain WHY, not WHAT — names should self-document the WHAT" --> |
| Commit messages | <!-- FILL IN: e.g., "conventional commits — type(scope): description" — typically already in BINDINGS.md but reaffirm here if cross-cutting --> |

## IV. Error handling

| Rule | Statement |
|------|-----------|
| Error path explicit | <!-- FILL IN: e.g., "every async operation MUST handle the error path; no silent swallowing" --> |
| Error types | <!-- FILL IN: e.g., "use typed errors / Result types; never throw bare Error" --> |
| User-facing messages | <!-- FILL IN: e.g., "actionable + specific; never expose internal stack traces in production" --> |
| Logging | <!-- FILL IN: e.g., "structured logging only; correlation ID propagated through every request" --> |

## V. Validation

| Rule | Statement |
|------|-----------|
| Input validation | <!-- FILL IN: e.g., "validate at the system boundary (HTTP / CLI / file read); trust internal types after that" --> |
| Schema validation | <!-- FILL IN: e.g., "external data (API responses, file contents) MUST be schema-validated before use" --> |
| Validation tool | <!-- FILL IN: e.g., "Zod for TS, pydantic for Python, serde for Rust" --> |

## VI. Immutability + state

| Rule | Statement |
|------|-----------|
| Default | <!-- FILL IN: e.g., "immutable by default; mutation requires justification in code review" --> |
| Shared state | <!-- FILL IN: e.g., "no global mutable state; pass via context / DI" --> |
| Persistent state | <!-- FILL IN: e.g., "all DB writes go through repository layer; no raw queries in business logic" --> |

## VII. Dependencies

| Rule | Statement |
|------|-----------|
| Adding a dependency | <!-- FILL IN: e.g., "requires slice spec D-decision documenting why; security review before merge" --> |
| Updating a dependency | <!-- FILL IN: e.g., "minor + patch via Renovate auto-PR; major via dedicated slice" --> |
| Removing a dependency | <!-- FILL IN: e.g., "verify no imports remain via grep; document in handoff" --> |

## VIII. Data + privacy

> Skip if not applicable.

| Rule | Statement |
|------|-----------|
| PII handling | <!-- FILL IN: e.g., "PII MUST be encrypted at rest + redacted in logs" --> |
| Retention | <!-- FILL IN: e.g., "user data deleted on account deletion within 30 days" --> |
| Audit log | <!-- FILL IN: e.g., "every write to user data is audit-logged with actor + timestamp" --> |

## IX. Performance

> Cross-cutting performance rules. Domain-specific budgets (e.g., bundle size, query time) belong in the domain doc.

| Rule | Statement |
|------|-----------|
| <!-- FILL IN: e.g., "API latency budget" --> | <!-- "p95 < 200ms for read endpoints; p95 < 500ms for write" --> |
| <!-- FILL IN --> | <!-- --> |

## X. Security

> Cross-cutting security rules. Domain-specific (auth flows, threat model) belong in `SECURITY.md` (EMERGENT — create when needed).

| Rule | Statement |
|------|-----------|
| Secrets | <!-- FILL IN: e.g., "no secrets in source code; all via env var + secrets manager (see BINDINGS.md)" --> |
| Auth | <!-- FILL IN: e.g., "every API endpoint defaults to authenticated; explicit `@public` decorator for opt-out" --> |
| Input | <!-- FILL IN: e.g., "all user input goes through validation per § V before use" --> |

---

## Amendments log

> Append-only record of constitution changes. Date + what changed + which slice spec D-decision drove it.

| Date | Amendment | Driving slice |
|------|-----------|---------------|
| <!-- YYYY-MM-DD --> | <!-- e.g., "Rule III.4: tests now use describe / it (was test_<name>) — driven by switch from Jest to Vitest" --> | <!-- e.g., "slice-12 spec D3" --> |
