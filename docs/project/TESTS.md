# Tests

Project-specific testing: inventory, conventions, factories, coverage targets.

> **Fill priority:** Medium. Fill when first tests land; expand as the test suite grows. The Iteration Protocol's "verification commands" gate (`BINDINGS.md`) covers test execution; this file documents test **structure + conventions**.

## Test runners

See `BINDINGS.md § Verification commands` for the canonical commands. This file covers the test-author-facing conventions.

## Conventions

| Convention | Value |
|-----------|-------|
| Test file location | <!-- FILL IN: "co-located (`*.test.ts` next to source)" / "separate dir (`tests/`)" / "mixed" --> |
| Test file extension | <!-- FILL IN: e.g., `.test.ts` / `_test.go` / `_test.py` --> |
| Naming convention | <!-- FILL IN: e.g., "describe / it" / "test_<feature>_<scenario>" / "TestXxx" --> |
| Async pattern | <!-- FILL IN: e.g., "async/await throughout" / "promises" / "blocking + tokio for async" --> |
| Mocking strategy | <!-- FILL IN: e.g., "vi.mock" / "pytest fixtures" / "interfaces + DI" --> |

## Test categories

| Category | Where it lives | Runner | When it runs |
|----------|----------------|--------|--------------|
| Unit | <!-- FILL IN --> | <!-- FILL IN --> | every commit (Iteration Protocol) |
| Integration | <!-- FILL IN --> | <!-- FILL IN --> | every commit OR pre-PR (project-specific) |
| E2E | <!-- FILL IN: e.g., `tests/e2e/` --> | <!-- FILL IN: e.g., Playwright --> | pre-PR + pre-deploy |
| Performance / benchmark | <!-- FILL IN, or "n/a" --> | <!-- FILL IN --> | manual / scheduled |
| Smoke | <!-- FILL IN, or "n/a" --> | <!-- FILL IN --> | post-deploy |

## Coverage

| Field | Value |
|-------|-------|
| Tool | <!-- FILL IN: e.g., c8 / istanbul / coverage.py / tarpaulin / "n/a" --> |
| Target | <!-- FILL IN: e.g., ">85% line, >80% branch" / "no formal target" --> |
| Enforcement | <!-- FILL IN: "CI blocks below target" / "informational only" / "manual review" --> |

## Test factories / fixtures

> Reusable data builders. Avoids re-deriving test data per file.

### <!-- FILL IN: factory name -->

- **Purpose:** <!-- FILL IN: e.g., "build a Project with sensible defaults" -->
- **Where:** <!-- FILL IN: file path -->
- **Usage:** <!-- FILL IN: code snippet showing typical use -->

## Test setup

> Setup / teardown / global config worth documenting.

| File | Purpose |
|------|---------|
| <!-- FILL IN: e.g., `vitest.setup.ts` --> | <!-- FILL IN: e.g., "stubs jsdom gaps (matchMedia, IntersectionObserver, GSAP)" --> |
| <!-- FILL IN --> | <!-- FILL IN --> |

## Test inventory

> Optional: list test files + what they cover. Skip if your project has too many to enumerate; fill if a curated index helps.

| File | Covers | Notes |
|------|--------|-------|
| <!-- FILL IN: e.g., `src/lib/services/project.service.test.ts` --> | <!-- FILL IN --> | <!-- FILL IN --> |

## Output format

The Iteration Protocol's "test result table" (per `docs/reference/WORKFLOW.md § Phase 5`) requires this format after every test run:

```markdown
| Test File | Test Name | Status | Failure Reason |
|-----------|-----------|--------|----------------|
| <path>    | <name>    | PASS   |                |
| <path>    | <name>    | FAIL   | Expected X, got Y (line NN) |
```

**Never say "some tests failed" without listing every failure by name.** If your test runner doesn't natively produce this format, document the conversion command here.

| Conversion | Command |
|------------|---------|
| <!-- FILL IN: e.g., "Vitest JSON → markdown table" --> | <!-- FILL IN: e.g., `bun run test:report` --> |

## Notes / decisions

<!-- FILL IN: testing decisions worth documenting (e.g., "happy-dom over jsdom for 4x speed" / "no integration tests against live DB — use docker-compose stack"). -->
