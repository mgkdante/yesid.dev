# docs/ — Project Documentation

Restructured in Slice 17j (2026-04-17) under the three-tier context model. See `docs/ARCHIVE.md` for the full protocol.

## Layout (Tier 1 — always-on, in repo)

| Directory / file | Purpose |
|------------------|---------|
| `ARCHIVE.md` | Three-tier model + retrieval / write protocols + where historical docs live |
| `README.md` | This file — docs/ map |
| `reference/` | Governance docs: CONSTITUTION, CSS, WORKFLOW, MOTION, TESTS, ARCHITECTURE, PATTERNS, VOCAB |
| `roadmap/` | `PLAN.md` (per-project master plan + slice index) + `FUTURE_PHASES.md` (parked cross-project wishlist) |
| `slices/` | Active slice bundles, templates, and live checkpoints |
| `sessions/` | Non-slice session records (bugfixes, config changes, exploration) |

## Slice hierarchy inside `slices/`

Three levels. See `CLAUDE.md` + `reference/WORKFLOW.md` §1 for the canonical definition.

```
slices/
├── _TEMPLATE-SLICE/          (Level 1 skeleton — README.md + CHECKPOINT.md)
├── _TEMPLATE-SUBSLICE/       (Level 2 skeleton — spec.md + plan.md + log.md + handoff.md)
├── slice-NN/                 (Level 1 slice folder)
│   ├── README.md             (direction + sub-slice index)
│   ├── CHECKPOINT.md         (ephemeral live state)
│   └── slice-NN<letter>/     (Level 2 sub-slice bundle — PR boundary)
│       ├── spec.md           (design + rationale)
│       ├── plan.md           (task-by-task)
│       ├── log.md            (running session record)
│       └── handoff.md        (self-appending closing report)
```

At PR close, the sub-slice bundle folder moves to `<cloud>/yesid.dev/docs/archive/slices/slice-NN/slice-NN<letter>/` via `bun run slice:close`. Granular retrieval preserved — AI reads just the file it needs.

## Tier 2 — fetch-on-command (outside repo)

Historical artifacts and Yesid's Obsidian knowledge base live at `$YESITO_CLOUD_ROOT/yesid.dev/docs/`:
- `archive/legacy-flat/` — pre-Slice 17j docs preserved in original flat structure
- `archive/slices/` — new sub-slice bundles as they close
- `learn/` — Yesid's Obsidian vault (89+ concept files, domain-organized)
- `COMPLETED-SLICES.md` — Tier 3 one-liner index
- `INDEX.md` — Tier 3 cloud mirror map

## Quick links

- `reference/WORKFLOW.md` — operational mechanics (when + why + how)
- `reference/VOCAB.md` — shared lexicon (brand + industry + Claude Code + workflow)
- `reference/CONSTITUTION.md` — codebase law
- `roadmap/PLAN.md` — project master plan
- `slices/slice-17/` — current active Level 1 slice (Standardization)
- `slices/slice-17/slice-17j/` — current active Level 2 sub-slice (Workflow Efficiency)
