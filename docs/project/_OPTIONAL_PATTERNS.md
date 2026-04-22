# Patterns

> **OPTIONAL template.** Create when project has codified reusable solutions — animation guards, retry strategies, error patterns, idempotency recipes. Typical projects: any project that's shipped 3+ slices and has accumulated repeating solutions.
>
> **To activate:** rename `_OPTIONAL_PATTERNS.md` → `PATTERNS.md`. Update README.md (in this directory).

## When to create

- Same code idiom has appeared in 3+ files / sub-slices
- Operator (or AI) keeps re-deriving the same solution to the same recurring problem
- A solution has subtle edge cases that aren't obvious — codifying prevents the next implementer from missing them
- A pattern emerged from painful debugging that the team doesn't want to repeat

## How to use this doc

- **Before implementing a new feature:** grep this file for relevant patterns. The pattern + its code example might be 80% of what you need.
- **During code review:** if you spot the same code idiom appearing in another file, check if it's a candidate for promotion to a pattern here.
- **At slice close (Phase 8 — `docs/reference/WORKFLOW.md`):** if this slice surfaced a reusable solution, add it here BEFORE closing.

## Pattern entry format

Each pattern follows this shape so the catalog is greppable + diffable:

```markdown
### Pattern: <Name>

**Problem.** <one-sentence problem statement>

**Context.** <where this problem arises — files / domains / stack-specific>

**Solution.** <description of the solution>

**Code.**
```<language>
<minimal working example — 5-30 lines>
```

**Where used.** <list of files where this pattern is currently applied>

**Trade-offs.** <what this pattern gives up; alternatives considered>

**Discovered.** <slice where the pattern was first formalized>
```

---

## Patterns

### Pattern: <!-- FILL IN: name -->

**Problem.** <!-- FILL IN -->

**Context.** <!-- FILL IN -->

**Solution.** <!-- FILL IN -->

**Code.**

```<!-- language -->
// FILL IN: minimal working example
```

**Where used.** <!-- FILL IN -->

**Trade-offs.** <!-- FILL IN -->

**Discovered.** <!-- FILL IN: slice -->

---

### Pattern: <!-- FILL IN -->

<!-- Repeat structure -->

---

## Anti-patterns

> What the team has TRIED and rejected. Each entry: what was tried + why it failed + what to use instead.

### Anti-pattern: <!-- FILL IN -->

**Tried.** <!-- FILL IN -->

**Failed because.** <!-- FILL IN -->

**Use instead.** <!-- FILL IN -->

**Discovered.** <!-- FILL IN: slice -->

---

## Maintenance

- **Trigger:** every Phase 8 closing checklist asks: "did this slice surface a reusable solution?" If yes, add a pattern entry here BEFORE closing.
- **Promotion:** if a pattern matures (gets used in 5+ places, becomes load-bearing), consider promoting it to a domain-specific governance doc (e.g., `MOTION.md` for motion patterns, `MIGRATIONS.md` for schema patterns).
- **Demotion:** if a pattern stops being used (last reference removed via refactor), mark `(deprecated YYYY-MM-DD — no longer in use)` rather than deleting; preserves the discovery context for future contributors.
- **Aim for ~20 patterns max in this file.** If you grow past ~20, split into domain-specific catalogs.
