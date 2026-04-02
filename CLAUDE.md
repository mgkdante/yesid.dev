# CLAUDE.md

## Identity

You are working on **yesid.** — a freelance SQL development and data infrastructure brand.
Owner: Yesid O., Montreal, QC.
Stack: PostgreSQL, SQL Server, Retool, Power BI, Python, SvelteKit (learning).
Brand colors, tokens, and assets live in `/brand/`.

## Runtime

This project uses **Bun**, not Node.js.
- Use `bun install` not `npm install`
- Use `bun run` not `npm run`
- Use `bun run test` for Vitest
- Use `bunx` not `npx`
- `bun.lockb` is the lockfile, not `package-lock.json`
- If a tool or library has Bun-specific setup, use it

## How You Work

Your job: receive a slice spec, build it exactly, document what you did, hand it back.

### The Slice System

All work is organized into **slices**. A slice is a self-contained unit of work with:
- A spec in `docs/slices/slice-NN-name.md`
- Clear acceptance criteria
- A defined output

**Rules:**
1. Before starting ANY work, read the active slice spec in `docs/slices/`.
2. Do exactly what the spec says. No more, no less.
3. If the spec is ambiguous, write your assumption in the dev log and proceed. Do not stop to ask.
4. If the spec is wrong or impossible, document why in the dev log and stop.
5. Never start a new slice without a spec. If there's no spec, say so and stop.

### File Change Protocol

Every time you create or modify a file, you MUST:

1. **Update the dev log** at `docs/devlog/YYYY-MM-DD.md` with:
   - What file changed
   - What changed and why
   - Any decisions you made

2. **Update relevant docs** if behavior or structure changed:
   - `docs/ARCHITECTURE.md` for structural changes
   - `README.md` if setup/usage changed
   - The slice's handoff report at `docs/handoffs/handoff-slice-NN.md`

3. **Update the file tree** at `tree.txt` (project root). Run:
   ```bash
   tree -I "node_modules|.git|.remember|bun.lockb|.svelte-kit|.vercel|dist|build|*.log|.DS_Store" --charset ascii > tree.txt
   ```
   On Windows (if tree doesn't support -I), generate it manually.
   This file is the project's self-portrait. Keep it current.

4. **Add inline comments** explaining WHY, not what. The code shows what. Comments show why.

### Dev Log Format

```markdown
# Dev Log — YYYY-MM-DD

## Slice: [slice number and name]

### Session Start
- **Time:** HH:MM
- **Slice spec:** docs/slices/slice-NN-name.md
- **Goal:** [one sentence]

### Work Done
- [ ] Task from spec
  - Files changed: `path/to/file`
  - Decision: [any judgment call you made]
  - Learning note: [brief explanation of WHY this works, for Yesid]

### Blockers / Questions
- [anything that needs human decision]

### Session End
- **Files created:** [list]
- **Files modified:** [list]
- **Tests passing:** [yes/no/na]
- **Ready for handoff:** [yes/no]
```

### Handoff Report Format

When a slice is complete, create `docs/handoffs/handoff-slice-NN.md`:

```markdown
# Handoff: Slice NN — [Name]

## Summary
[2-3 sentences: what was built and why it matters]

## What Was Built
- [file]: [purpose]
- [file]: [purpose]

## Files Modified
- [file]: [what changed and why]
- [file]: [what changed and why]

## How It Works
[Brief technical explanation. Write it so a new dev or AI can understand
the system without reading every file.]

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| ... | ... | ... |

## What Yesid Should Know
[Learning notes. Explain concepts that were new or non-obvious.
Link to docs/tutorials for deeper reading.]

## What Comes Next
[What slice should follow this one, and why]

## How to Verify
[Steps to confirm this slice works correctly]
```

## Code Standards

- **Language:** Use clear, readable code over clever code.
- **Comments:** Explain WHY, not what. Every non-obvious decision gets a comment.
- **Naming:** Descriptive names. No abbreviations unless universal (db, api, url).
- **Error handling:** Always handle errors. Never silently swallow them.
- **Types:** Use TypeScript for all new JS/TS files.
- **Tests:** Every slice ships code AND tests. No code without tests.

## Current Repo Structure

```
yesid-pipeline/
|   .gitignore
|   CLAUDE.md
|   favicon.svg
|   README.md
|   tree.txt
|
+---.remember/          (gitignored, local only)
+---brand/
|       colors.json
|       favicon.svg
|       logo-monogram-dark.svg
|       logo-monogram-light.svg
|       logo-monogram-orange.svg
|       logo-wordmark-dark.svg
|       logo-wordmark-light.svg
|       README.md
|       tailwind.brand.js
|       tailwind_brand.js
|       tokens.css
|       tokens.json
|       yesid_brand_guide.pdf
|
+---docs/
|   |   ARCHITECTURE.md
|   |   FUTURE_PHASES.md
|   |   PLAN.md
|   |   reference-upwork-lane-analysis.md
|   |   WORKFLOW.md
|   |
|   +---devlog/
|   +---handoffs/
|   \---slices/
|           _TEMPLATE.md
|
+---scripts/
+---src/
\---tests/
```

**Note:** `brand/` contains two tailwind files: `tailwind.brand.js` and `tailwind_brand.js`. Resolve which one is canonical in slice 01 and delete the duplicate.

## Brand Rules (Non-Negotiable)

- Primary color: `#E07800` (orange)
- Accent color: `#FFB627` (yellow)
- Font: Inter for headings/body, JetBrains Mono for code
- Dark theme is default
- The dot in "yesid." is always orange
- Logo is always lowercase
- See `/brand/yesid_brand_guide.pdf` for full rules

## What You Never Do

1. Never delete files without explicit instruction in the slice spec.
2. Never refactor code outside the current slice scope.
3. Never install packages without documenting why in the dev log.
4. Never skip the dev log, handoff report, or tree.txt update.
5. Never make up requirements. Build what the spec says.
6. Never use npm or npx. This project uses Bun.
