---
name: workflow-overlord-status
description: Read-only "where am I, what's next." Never mutates Notion or git.
---

# /workflow-overlord-status

Read-only status. NEVER writes to Notion. NEVER cascades.

## Steps

1. **Active slice:** `mcp__overlord-bridge__get_active_slice`. Show: title, status, branch, summary, Plan checklist progress.

2. **Recent sessions (last 7 days):** `mcp__notionhq__API-query-data-source` against Sessions DB with `filter: { Started: { after: "<7d ago>" } }`. Show: tool, started, ended, summary (truncated).

3. **Next planned slice:** query Roadmap to find the next planned bullet. Show title + summary.

4. **Suggest the next command** without recommending:
   - No active slice + something planned: "Run `/workflow-overlord-slice-open <SUMMARY>` to start the next one."
   - Active slice exists: "Run `/workflow-overlord-slice-implement` to continue."
   - Active slice closed + PR pending merge: "PR open — review and merge."

5. **Mandatory nudge** at end.

## What NOT to do

- DO NOT mutate Notion
- DO NOT cascade or update status
- DO NOT recommend a priority among multiple open slices — enumerate, don't choose
