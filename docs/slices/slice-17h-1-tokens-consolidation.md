# Slice 17h-1 — Tokens Consolidation — OBSOLETE (2026-04-18)

**Status:** OBSOLETE — scope killed during the 2026-04-18 planning shrink.
**Superseded by:** parent slice [slice-17h-brand-bundle.md](slice-17h-brand-bundle.md) (new scope — "Scope shrink — 2026-04-18" section).

## Why dead

17h-1 was scoped to (a) expand `brand/tokens.json` to the full token surface the site uses, (b) delete `brand/colors.json` + the legacy PDF, and (c) move `docs/reference/CONSTITUTION.md` / `CSS.md` / `MOTION.md` into `brand/` with redirect stubs.

Yesid pivoted on 2026-04-18: `brand/` contains non-tech info and assets only. That kills:

- **Token consolidation into `brand/tokens.json`** — tokens stay authored in `src/lib/styles/tokens.css` + `src/app.css @theme`. No `tokens.json` in `brand/`, no generator-driven workflow.
- **Constitution/CSS/Motion move into `brand/`** — `docs/reference/CONSTITUTION.md`, `CSS.md`, `MOTION.md` stay where they are. Governance and code live outside `brand/`; `brand/` narrates and cross-links out.

**What actually survives from 17h-1's original intent:**

- `brand/colors.json` and `brand/yesid_brand_guide.pdf` deletion — absorbed into 17h-3 (the markdown narrative in `brand/foundations/color.md` supersedes both).
- `brand/README.md` factual corrections — absorbed into 17h-3's front-door rewrite task.

## If you're reading this because the roadmap pointed here

Go to the parent slice spec: [slice-17h-brand-bundle.md](slice-17h-brand-bundle.md). The "Scope shrink — 2026-04-18" section explains the new architecture. The surviving sub-slices are 17h-3 (narrative docs) and 17h-4 (logo + assets).

## Historical body

The original 17h-1 task breakdown (audit token sources, expand `tokens.json`, fix README, freshen + move CONSTITUTION/CSS/MOTION, delete legacy files) is preserved in git history at commit `11d1bd8`. Retrieve with `git show 11d1bd8:docs/slices/slice-17h-1-tokens-consolidation.md` if you need the full original plan for context.
