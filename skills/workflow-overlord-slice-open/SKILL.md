---
name: workflow-overlord-slice-open
description: Open a new slice. Creates a Notion Slices row (Plan section), creates a git worktree on a new branch, and lets the SessionStart hook create the Sessions row automatically when the user enters the worktree.
---

# /workflow-overlord-slice-open <SUMMARY>

Open a new slice. `SUMMARY` is required — a one-paragraph "what is this slice about."

## Steps

1. **Mandatory nudge first.** Surface the standard toolbox reminder (see `workflow-overlord` SKILL).

2. **Search Roadmap, Architecture, and Business indexes for relevant context** using `mcp__notionhq__API-query-data-source`:
   - Roadmap: filter by keywords from SUMMARY → find parent roadmap row if one matches
   - Architecture Index: filter `Keywords` contains task keywords → top 1-2 hits
   - Business Index: same
   Surface what you found and ask the user whether to link/include.

3. **Derive a short slug for the slice title + branch name** from SUMMARY. Example: `feature/auth-rate-limit` for "Add rate limit to auth endpoint."

4. **Create the Slices row** via `mcp__notionhq__API-create-a-page`:
   ```
   parent: { database_id: <slices_db_id from AGENTS.local.md> }
   properties:
     Title:    "<slug>"
     Summary:  "<SUMMARY>"
     Status:   "open"
     Branch:   "<branch-name>"
   ```
   Then via `API-patch-block-children` on the new page, add:
   - Heading 2: `Plan`
   - Paragraph: `<SUMMARY>`
   - To-do list (empty checklist — user fills tasks iteratively)

5. **Create the worktree + branch:**
   ```bash
   git worktree add ../<branch-name> -b <branch-name>
   ```
   Tell the user `cd ../<branch-name>` to start working there.

6. **Roadmap cascade** (one of the two cascade moments): if a parent Roadmap was identified in step 2, patch its `Active slice` property to point at the new slice row.

7. **End with the mandatory nudge again.** The SessionStart hook will auto-create the Sessions row when the user opens Claude/Codex inside the new worktree — no manual action needed.

## What NOT to do

- Don't auto-invoke brainstorming or writing-plans (user decides)
- Don't write the full task list yourself — the user fills the to-do list during slice-implement
- Don't cascade to Roadmap mid-slice — cascade fires only here (open) and at slice-close
