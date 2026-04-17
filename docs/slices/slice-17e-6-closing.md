# Slice 17e-6 — Closing

**Status:** In progress
**Branch:** `feature/slice-17e-56-close-motion` (combined 17e-5 + 17e-6 PR)
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-17-slice-17e-6-closing.md`
**Depends on:** 17e-1 through 17e-4 merged; 17e-5 committed on the shared branch.
**Blocks:** Nothing. Slice 17e is done after this PR merges.

## What

Close Slice 17e. Rewrite MOTION.md v2.0, amend CONSTITUTION.md with the Snappy Doctrine + D266 clarification, update CSS.md / ARCHITECTURE.md / TESTS.md, run Lighthouse audits on every route × desktop + mobile (H1), verify §6.2 bundle budgets, write six motion learning docs under `docs/learn/motion/`, assemble the combined closing handoff, devlog, tree.txt, final commit, open the single PR covering 17e-5 + 17e-6.

## Outcomes

1. `docs/reference/MOTION.md` v2.0 replaces the stale v1.0 (v1.0 references deleted Three.js/Threlte and the forbidden `use:reveal` vocabulary). v2.0 covers the 9-signature vocabulary, factory APIs (`createCrescendoScrub`, `createDrawScrub`, `createHeroTimeline`), `use:` actions (`boop`, `cursorGlow`, `magnetic`, `morphHover`, `wordmarkHover`), shared ticker, lazy GSAP plugin loaders, `.led-pulse` / `.typewriter-cursor` utilities, reduced-motion contract, SEO contract, bundle budgets, and the MetroNetwork SVGO re-run procedure.
2. `docs/reference/CONSTITUTION.md` has a new Motion Doctrine — Snappy section reproducing design spec §2 + §3 + §4.3, incorporating D266 ("drawing motion IS the content; pure fade/scale/stagger reveals are the violation").
3. `docs/reference/CSS.md` documents `--duration-instant`, `--ease-out`, `--ease-in-out` (added 17e-1) + `.typewriter-cursor` (added 17e-4). `.led-pulse` stays a future utility — audit confirmed 17e-5 consolidated the one existing duplicate into canonical `pulse-glow`, not a new `.led-pulse`.
4. `docs/reference/ARCHITECTURE.md` motion-layer section matches the post-17e file structure.
5. `docs/reference/TESTS.md` lists every 17e-added test file and drops entries for files deleted across 17e-2/3/4/5.
6. `docs/learn/motion/` has 6 Obsidian-format learning docs with YAML frontmatter (`type`, `tags`, `difficulty`, `created`, `slice`), `[[wikilinks]]`, and the `learn` + `motion` + difficulty tag pattern: snappy-doctrine, signature-vocabulary, scrub-factory-pattern, shared-ticker-pattern, lazy-gsap-plugins, ssr-inline-svg.
7. Lighthouse audits (H1 decision): 11 routes × desktop + mobile = **22 runs** captured in the closing devlog. Every Performance score meets design spec §6.1 (desktop ≥ 98, mobile ≥ 90). Accessibility + SEO + Best Practices ≥ 100.
8. Bundle-size verification captured in devlog: per-route gzipped initial-JS vs §6.2 budgets. Any route over budget flagged with rationale in handoff.
9. Design spec amended with D263–D269 (appended section at the bottom of the spec).
10. `docs/slices/slice-17-checkpoint.md` updated: 17e marked COMPLETE with all six sub-slice PR references.
11. Combined closing handoff: `docs/handoffs/handoff-slice-17e.md` covers 17e-5 + 17e-6 + full-slice retrospective (no separate 17e-5 handoff per the 2026-04-17 workflow rule).
12. Devlog: `docs/devlog/2026-04-17-slice-17e-closing.md` captures Lighthouse table + bundle-size table + decisions recap + links to MOTION.md v2.0.
13. `tree.txt` regenerated per CLAUDE.md closing convention.
14. Final commit matches `feat: complete slice 17e — Motion Re-Engineering` per CLAUDE.md.
15. Single PR pushed covering the entire 17e slice (17e-5 + 17e-6 bundled).

## Acceptance criteria

- [ ] All outcomes verified
- [ ] MOTION.md v2.0 is the authoritative motion reference; v1.0 content fully superseded
- [ ] CONSTITUTION.md Motion Doctrine section is part of the governance contract
- [ ] Lighthouse results pasted in `docs/devlog/2026-04-17-slice-17e-closing.md` as a 22-row table (route × viewport × Perf/A11y/BP/SEO)
- [ ] Every desktop Performance score ≥ 98 (design spec §6.1)
- [ ] Every mobile Performance score ≥ 90 (design spec §6.1 stretch 95+)
- [ ] Every bundle per route meets §6.2 budget or is flagged with documented rationale
- [ ] `bun run test` + `bun run check` pass
- [ ] Every `docs/learn/motion/*.md` has Obsidian frontmatter + ≥ 1 `[[wikilink]]`
- [ ] `tree.txt` reflects the current tree
- [ ] Final commit format per CLAUDE.md: `feat: complete slice 17e — Motion Re-Engineering`
- [ ] Single PR covers 17e-5 + 17e-6 (no separate PRs)
- [ ] Mobile hero lag flagged by Yesid in 17e-5 is documented + profiled in the Lighthouse results

## Non-goals

- Lighthouse CI integration (§6.6 — manual verification is sufficient for 17e closing)
- 17a-4 dead-code cleanup (next slice)
- Any net-new motion features
- `captureFlipState` async refactor (flagged as post-17e opportunity; unlocks the residual bundle-shrink not delivered in 17e-5 D269)
- `wordmarkHover` async action shape (flagged post-17e; unlocks `loadSplitText` lazy path)

## Iteration log

(Fill in per task as the session progresses.)
