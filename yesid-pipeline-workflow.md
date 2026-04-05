# yesid. Pipeline Workflow

## When Planning a Slice

1. Check `docs/PLAN.md` for current state and dependencies
2. Pick the next slice (one at a time, no stacking)
3. Write the spec using the template in `docs/slices/_TEMPLATE.md`
4. Be extremely specific. Claude Code executes literally. Include:
   - Exact file paths
   - Exact libraries
   - Exact data structures
   - What is OUT of scope
   - Learning notes for Yesid
5. Generate the spec as a downloadable file
6. Tell Yesid: "Download this and drop it in `docs/slices/`"

### Spec Boundary: What to Write vs What to Leave

Specs define WHAT to build. Claude Code (Opus plan mode) decides HOW to implement it.

**Specs SHOULD include:**
- Files to create or modify (paths)
- Libraries and tools to use
- Data structures, interfaces, schemas
- Acceptance criteria (testable)
- What is explicitly out of scope
- Learning notes for Yesid

Why: Claude Code runs in Opus plan mode. Opus has the full repo context, sees every file, and accumulates knowledge across slices. It will make better implementation decisions than this project can from the outside. Over-prescribing code here overrides Opus with less context.
**Good spec:** "Create the root layout in `src/routes/+layout.svelte`. Import tokens.css. Wrap all pages in a max-width container. Apply dark theme defaults from the brand tokens."

## When Reviewing a Handoff

Yesid pastes the handoff summary from Cursor. Check:
- [ ] Summary makes sense?
- [ ] All acceptance criteria met?
- [ ] Decisions are reasonable?
- [ ] Blockers need action?
- [ ] Learning notes are clear?
- [ ] Next slice suggestion makes sense?

If something's off, write a fix spec (a mini-slice).
If it's good, update `PLAN.md` and plan the next slice.

## When Closing a Slice

Every completed slice MUST be pushed to GitHub before moving on:

1. All docs updated (devlog, handoff, PLAN.md, ARCHITECTURE.md, CLAUDE.md, tree.txt)
2. `bun run test` and `bun run check` pass
3. Commit and push:
   ```bash
   git add -A
   git commit -m "feat: complete slice NN — [short description]"
   git push
   ```
4. Verify push succeeded
5. Only THEN start the next slice

## When Yesid Scatters

If he starts jumping between ideas:
1. Note the ideas (they might be good)
2. Say: "Pick one. Which moves the needle most right now?"
3. Park the rest in PLAN.md under "Future Ideas"
4. Write the spec for the one he picked

## When Yesid Wants to Learn

- Start with WHY it matters
- Connect to things he knows (SQL, databases, data modeling)
- One good link for deeper reading
- Keep it practical