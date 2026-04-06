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

Always review: "C:\Users\otalo\Yesito\Projects\yesid.dev\yesid-pipeline-workflow.md"

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
   ##On Windows, use this command to generate tree.txt instead of `tree -I`:
   
   cmd /c "tree /F /A | findstr /V /C:"node_modules" /C:".git" /C:".remember" /C:"bun.lockb" /C:".svelte-kit" /C:".vercel" /C:".DS_Store" > tree.txt"
   
   ##Or use PowerShell:
   
   Get-ChildItem -Recurse -Name | Where-Object { $_ -notmatch 'node_modules|\.git|\.remember|bun\.lockb|\.svelte-kit|\.vercel|\.DS_Store' } | Out-File tree.txt -Encoding utf8
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

------

### Iteration Protocol (Mandatory for All Slices)

**You are NOT done when the code works. You are done when Yesid says you are done.**

Visual, interactive, and motion-based features cannot be verified by tests alone. After you complete a slice, Yesid must test it on localhost before the handoff report is written.

**Steps:**

1. Finish all acceptance criteria. Run `bun run test` and `bun run check`. Both must pass.
2. Make sure `bun run dev` is running.
3. **STOP coding.** Ask Yesid to test on `http://localhost:5173/`. Tell him specifically what to check (list the key behaviors from the slice spec's Verify section).
4. Wait for Yesid's response. He will either:
   - **Approve:** "looks good", "ship it", "approved", or similar. NOW write the handoff report.
   - **Report issues:** Describe what's broken, wrong, or needs adjustment. Fix each issue, run tests again, and return to step 3.
5. Each round of test-and-fix is an **iteration**. There is no iteration limit.
6. **After approval + handoff report:** Update all docs (devlog, handoff, PLAN.md, ARCHITECTURE.md, CLAUDE.md, tree.txt, memory). Then **commit and push to GitHub**:
   ```bash
   git add -A
   git commit -m "feat: complete slice NN — [short description]"
   git push
   ```
   Every completed slice must be pushed. No exceptions.

**Rules:**

- Never write the handoff report before Yesid approves.
- Never skip the check-in because "tests pass." Tests don't catch visual bugs.
- Never say "I think this should work" — let Yesid confirm on his screen.
- If Yesid's feedback is ambiguous, ask a clarifying question before changing code.
- **Always push to GitHub after a slice is complete.** No slice is done until it's pushed.

**Handoff report must include an Iterations section:**

```markdown
## Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | [feedback] | [fix] | [files] |
| 2 | [feedback] | [fix] | [files] |
| Final | Approved | — | — |
```

If Yesid approved on the first try (no iterations needed), write:

```markdown
## Iterations

Approved on first test. No iterations needed.
```

------

## Code Standards

- **Language:** Use clear, readable code over clever code.
- **Comments:** Explain WHY, not what. Every non-obvious decision gets a comment.
- **Naming:** Descriptive names. No abbreviations unless universal (db, api, url).
- **Error handling:** Always handle errors. Never silently swallow them.
- **Types:** Use TypeScript for all new JS/TS files.
- **Tests:** Every slice ships code AND tests. No code without tests.

## Current Repo Structure

See `tree.txt` for the full file tree (updated every slice). Key directories:

```
src/
├── content/blog/           # Markdown blog posts with YAML frontmatter
│   ├── professional/       #   Data/SQL/infra posts (orange accent)
│   ├── personal/           #   Personal posts (yellow accent)
│   └── _template.md        #   Copy-paste template for new posts
├── lib/
│   ├── data/               # Typed data layer: types, services, projects, blog, meta
│   ├── components/         # UI components: HeroBanner, ServiceStation, FeaturedWork,
│   │                       #   AboutBento, BlogCard, BlogFeed, BlogListingPage,
│   │                       #   BlogRow, BlogSvgIcon, BlogDetailHeader, BlogContent,
│   │                       #   BlogFilterSidebar, BlogFilterMobile, StationDivider, etc.
│   └── motion/
│       ├── actions/        # Svelte actions: boop, reveal, magnetic, ripple, tilt
│       ├── stores/         # Scroll position, reduced-motion preference
│       ├── components/     # ScrollRail, LottiePlayer
│       ├── three/          # Threlte scenes: WagonScene (hero), HeroScene (data-flow)
│       ├── svg/            # SVG train + journey animation
│       └── utils/          # GSAP helpers, stagger calculator
├── routes/
│   ├── +page.svelte        # Home: 8-stop metro journey
│   ├── blog/               # Blog system (Slice 07)
│   │   ├── +page.svelte    #   Professional listing
│   │   ├── personal/       #   Personal Corner listing
│   │   └── [slug]/         #   Post detail page
│   └── preview/            # Dev-only 3D preview
├── tests/                  # Test setup
docs/
├── slices/                 # Slice specs
├── handoffs/               # Handoff reports + iteration feedback
├── devlog/                 # Daily dev logs
├── superpowers/specs/      # Design specs from brainstorming
static/
├── models/                 # 3D assets (metro-wagon.glb)
├── images/                 # Hero background art, montreal-metro.svg
└── lottie/                 # Station Lottie animations
```

## Completed Slices

- Slice A complete — handoff at `docs/handoffs/handoff-slice-a-svg-hero.md`
- Slice B complete — handoff at `docs/handoffs/handoff-slice-b.md`
- Slice C complete — handoff at `docs/handoffs/handoff-slice-c-zoom-transition.md`
- Slice B+ complete — handoff at `docs/handoffs/handoff-slice-b-plus.md`
- Slice 07 complete — handoff at `docs/handoffs/handoff-slice-07.md`
- Slice 08 complete — handoff at `docs/handoffs/handoff-slice-08.md`

## Active Slice

**Slice 09 — Services Pages (/services + /services/[id])** (NEXT)
- Build `/services` index: showcase all capabilities with visual cards, linked projects
- Build `/services/[id]` detail: deep dive into each service — what it is, how it helps, example projects (linking back to /work/[slug]), stack used
- Data-driven, cloud-ready (LocalizedString), i18n-compliant
- Services are the heart of the site — connects projects, skills, and client value
- Service badges in work pages already link to `/services/[id]` (currently 404)
- Depends on: Slices 02, 08

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
