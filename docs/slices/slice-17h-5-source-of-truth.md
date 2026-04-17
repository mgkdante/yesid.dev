# Slice 17h-5 — Source-of-Truth Refactor — OBSOLETE (2026-04-18)

**Status:** OBSOLETE — scope killed during the 2026-04-18 planning shrink.
**Superseded by:** parent slice [slice-17h-brand-bundle.md](slice-17h-brand-bundle.md) (new scope — "Scope shrink — 2026-04-18" section).

## Why dead

17h-5 was scoped to update every doc that referenced brand values, old file locations, or the old workflow: `CLAUDE.md` (Brand + CSS sections → pointers to `brand/`), `docs/reference/WORKFLOW.md` (brand-vs-docs rule), `docs/roadmap/PLAN.md`, `docs/roadmap/standardization.md`, root `README.md`, and `docs/slices/_TEMPLATE.md`. It also ran the grep verification for zero hardcoded brand values outside `brand/` + generated files.

Yesid pivoted on 2026-04-18: `brand/` contains non-tech info and assets only; `docs/reference/` and `CLAUDE.md` continue to carry inline brand values (tokens, color hex codes, CSS rules) because they're the authoritative source now — not pointers. That kills:

- **The pointer rewrite.** `CLAUDE.md` Brand + CSS sections stay as inline values. `WORKFLOW.md` doesn't need a "brand/ vs docs/" callout because there's no move.
- **The grep verification.** `grep -rn "#E07800" --include="*.md"` will legitimately hit `CLAUDE.md`, `docs/reference/CSS.md`, etc. — those are the canonical homes for brand values.
- **The roadmap-doc retargeting.** `standardization.md` and `PLAN.md` update for 17h is now a much smaller change (a single row update), handled inline during closing rather than in a dedicated sub-slice.

**What actually survives from 17h-5's original intent:**

- Updating `standardization.md` + `PLAN.md` with the 17h row — handled during closing, not as a sub-slice.
- Root `README.md` pointer to `brand/` — punted to a future slice (as originally flagged in 17h-5 out-of-scope).

## If you're reading this because the roadmap pointed here

Go to the parent slice spec: [slice-17h-brand-bundle.md](slice-17h-brand-bundle.md). The surviving sub-slices are 17h-3 (narrative docs) and 17h-4 (logo + assets).

## Historical body

The original 17h-5 task breakdown (audit inline brand values, update CLAUDE.md as pointers, update ARCHITECTURE/WORKFLOW/PLAN/standardization/root README/templates, retarget stale references, final grep verify) is preserved in git history at commit `11d1bd8`. Retrieve with `git show 11d1bd8:docs/slices/slice-17h-5-source-of-truth.md` if you need the full original plan.
