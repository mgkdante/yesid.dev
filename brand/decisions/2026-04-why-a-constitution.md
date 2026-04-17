# why a constitution

**Date:** 2026-04-18
**Decision type:** Governance
**Status:** Accepted. Governance doc lives at `docs/reference/CONSTITUTION.md`, not in `brand/`.

## Context

After 22+ slices of build, the codebase had accumulated more implicit rules than any single person could remember: layout patterns, typography scale, spacing tokens, responsive breakpoints, motion doctrine, accessibility posture, file-size limits. Every new slice re-derived rules that had been settled in earlier slices, often getting them wrong. The fix was either "stop forgetting" (doesn't scale) or "write it down once" (the answer).

Slice 17a-5 (Spacing & Layout, 2026-04-13) was the trigger. The spacing work demanded 5 canonical breakpoints, 3 container tokens, and 4 layout recipes — and those touched everything. Without a document codifying them, Slice 17d (Component API) would have re-invented the rules from memory, and they would have drifted.

So 17a-5 shipped `docs/reference/CONSTITUTION.md` — the governance law of the codebase. Every slice since then has been measured against it.

The follow-up question that 17h (Brand Bundle) forced in 2026-04-18: **where should the constitution live?** Under `docs/reference/` next to the code? Or inside `brand/` where the brand narrative lives?

## Options considered

### Option A — Stay informal

Rely on memory. Discuss rules in devlogs. Trust PR review to catch violations. Works for a 5-slice project; breaks down somewhere between 10 and 20 slices.

Rejected: by slice 17, it was already broken. Rules had been forgotten, re-derived, and got slightly different on the second pass.

### Option B — Enforce via per-slice code review

Every slice gets a dedicated design review before shipping. The reviewer re-reads every other slice's handoff to keep rules consistent.

Rejected: doesn't scale to a team of one. The reviewer is the same person as the author. The separation is a fiction.

### Option C — One constitution, lives at `docs/reference/`

Write the rules down once. Every slice reads the constitution before planning. Every PR review checks the diff against it. Update the constitution when a rule changes — that update is itself a governed act.

Location: `docs/reference/CONSTITUTION.md`, next to `CSS.md` (token inventory) and `MOTION.md` (motion reference). Reason: governance rules are tightly coupled to code implementation — the constitution enforces layout choices that live in scoped CSS, spacing tokens that live in `tokens.css`, motion doctrine that lives in `src/lib/motion/`. Keeping the rules next to the code makes the coupling legible.

### Option D — Move constitution into `brand/`

An earlier plan (17h-1, killed 2026-04-18) called for moving CONSTITUTION, CSS, and MOTION into `brand/` and treating `brand/` as a source of truth that generated `tokens.css` + the Tailwind `@theme` partial. `docs/reference/` would shrink; `brand/` would carry both narrative and governance.

Rejected: the failure mode is catastrophic. A bad edit to `brand/tokens.json` would propagate through a generator into every consumer in the same commit. The coupling is too tight for a solo brand where PR review is the same person as the author. Physical separation is a safety mechanism — breaking one tree doesn't break the other.

## Decision (2026-04-18 revision)

**Option C.** `docs/reference/CONSTITUTION.md` is the governance doc. It stays at `docs/reference/`, not in `brand/`.

`brand/` points to the constitution through cross-links in `foundations/*.md`. It does not own the constitution. It does not duplicate the rules.

The scope shrink on 2026-04-18 made this explicit: `brand/` contains narrative + assets only. Governance stays at `docs/reference/`. Tokens stay at `src/lib/styles/tokens.css`. No generator bridges them — a developer translates a brand decision into code, and PR review verifies the translation.

## Rationale

1. **Enforcement happens in code.** The constitution governs layout (CSS Grid Recipes), typography (token scale), spacing (semantic tokens), motion (actions + doctrine), and accessibility (component contract). Every one of those rules is checked when someone edits a `.svelte` or `.css` file. Keeping the rule document adjacent to those files (in `docs/reference/`) makes the check legible.

2. **Brand intent ≠ governance rules.** A brand decision ("one orange") is advisory. A governance rule ("every interactive element has `focus-visible` styling") is enforced. Mixing them in one tree blurs which is which. Separating them makes the contract clear: `brand/` is *why*, `docs/reference/` is *how*.

3. **Physical separation is safety.** A solo brand has no second pair of eyes. When the author writes a bad edit, nothing external catches it. The best defense is that editing one tree cannot silently corrupt the other. `brand/` and `src/` + `docs/reference/` live in different commits; a bad brand edit doesn't propagate into the site automatically.

4. **The failure modes are asymmetric.** A bad brand narrative is embarrassing but recoverable — the site still works. A bad governance doc could cascade into layout / token / motion bugs across many slices. The governance doc deserves higher scrutiny, which is why it stays where the code review already happens.

5. **The generator was a shortcut.** The original 17h-1 plan included a `bun run brand:generate` script that would read `brand/tokens.json` and emit `tokens.css` + the Tailwind `@theme` partial. Deterministic, idempotent, CI-verified. Good for a large design-system org (Polaris, Primer, Carbon all do this). Bad for a solo brand at this scale — the cost of building and maintaining the generator exceeded the cost of the drift it would prevent.

## Consequences

- CONSTITUTION / CSS / MOTION stay at `docs/reference/`. No plan to move them.
- `brand/foundations/*.md` files cross-link OUT to `docs/reference/*` for authoritative values. They do not duplicate token tables or rule lists.
- New brand decisions that imply code changes go: `brand/decisions/*.md` → dev edits `src/` + `docs/reference/` → PR review. No script automates the translation.
- A future fork of `brand/` (for a second project) also forks `docs/reference/` — or the forker writes their own governance doc. The two are coupled by convention, not by code.
- A future scale-up (second maintainer, or a "design system as product" pivot) would revisit this. A team of four with a public design system probably builds the generator. A team of one does not.

## What this decision prevents

Governance drift. Without a written constitution, every slice re-derives layout / spacing / motion rules from memory and slightly wrong. With it, Slice 17a-5 stays valid across Slice 17d, 17e, 17h, and every future slice. The cost of writing it down once is paid once; the cost of forgetting is paid every slice.

Also prevents the opposite failure: the constitution becoming a thing nobody reads. By keeping it at `docs/reference/` adjacent to the code it governs, it shows up in normal code-review flow. It isn't parked in `brand/` where it would only be read when someone intentionally navigates into brand territory.

## Revisit trigger

This decision gets reopened if:

- A second maintainer joins. Two people sharing governance need a shared read cadence, not a single doc that either can edit silently.
- `brand/` gets forked for a second yesid. project. The fork needs to decide whether the constitution travels or stays per-project.
- The design system becomes a public product (extracted into an npm package, a public docs site, etc.). At that point the governance surface needs its own artifact and its own review rhythm.

Nothing else is a revisit trigger.
