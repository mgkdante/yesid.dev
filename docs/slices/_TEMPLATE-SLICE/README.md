# Slice NN — <Name>

**Level 1 direction doc.** Purpose: state the slice's vision, sub-slice sequence, and progress.

**Status:** planned | in-progress | complete
**Depends on:** [prior slice numbers or "none"]
**Est. Sessions:** [across all sub-slices]

## Goal

[One paragraph. What does this slice deliver?]

## Why this matters

[The business / product / technical case. Why now?]

## Sub-slice sequence

| Sub-slice | Name | Status | PR | Est. sessions |
|-----------|------|--------|----|---------------|
| NN-a | [name] | planned | — | [n] |
| NN-b | [name] | planned | — | [n] |
| NN-c | [name] | planned | — | [n] |

(Update status + PR column as sub-slices close.)

## Execution order + dependencies

```
NN-a → NN-b → NN-c ...
```

[Explain why this order.]

## Scope

**In scope:** [what this slice delivers across all sub-slices]

**Out of scope:** [what this slice explicitly does NOT include]

## Definition of done (Level 1)

- [ ] All sub-slice bundles shipped (each via its own PR)
- [ ] Governance docs updated where affected (CONSTITUTION, CSS, MOTION, ARCHITECTURE, PATTERNS)
- [ ] VOCAB.md gained any new brand/industry terms introduced
- [ ] OS-quirks registry got any platform-specific fixes discovered
- [ ] Learning concepts codified in cloud `docs/learn/` if durable
- [ ] CHECKPOINT.md either reset (if slice continues) or deleted (if fully closed)

## Related docs

- `docs/roadmap/PLAN.md` — where this slice sits in the project master plan
- `docs/reference/CONSTITUTION.md` — governing law
- Each sub-slice bundle at `slice-NN<letter>/`
