---
name: project_slice_17a5_status
description: Slice 17a-5 COMPLETE — spacing tokens, full-bleed layout, CONSTITUTION.md, viewport units, safe areas
type: project
---

Slice 17a-5 (Spacing & Layout Constitution) COMPLETE. PR #8 pending review.

**What was built:**
- 5 semantic spacing tokens (page-x, section-y, card-gap, stack, cluster)
- Full-bleed layout model (removed max-w-5xl from main)
- All vh → dvh/svh migration
- Safe-area-inset on Nav, Footer, MenuOverlay, StackBottomSheet
- CONSTITUTION.md governance document (12 sections)
- viewport-fit=cover meta tag

**Why:** Foundation for all remaining Slice 17 sub-slices. Constitution governs layout, spacing, typography, components, a11y, motion, responsive design.

**How to apply:** Every future sub-slice reads CONSTITUTION.md and follows its rules. Check it before making layout, spacing, or component decisions.

**Next:** 17a-6 planning session — scope expanded to include shadcn-svelte + full-bleed resize (per Yesid).
