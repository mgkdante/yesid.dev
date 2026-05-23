---
name: workflow-overlord-slice-implement
description: Work the active slice's Plan section task-by-task. AI does NOT autopilot — nudges between tasks, user drives.
---

# /workflow-overlord-slice-implement

Implementation phase for the active slice.

## Steps

1. **Mandatory nudge.** Surface the standard toolbox reminder.

2. **Fetch active slice** via `mcp__overlord-bridge__get_active_slice`. If none → tell the user to run `/workflow-overlord-slice-open <SUMMARY>` first.

3. **Read the Plan section** of the slice page via `mcp__notionhq__API-fetch` on the slice page, then `API-get-block-children` to read the page body. Find the `## Plan` heading and read everything until the next H2 or end of page.

4. **Surface the task checklist to the user.** Show which to-do items are checked vs. open. Ask: "which task do you want to work on?"

5. **For each task the user picks:**
   - Work it (write code, run tests, etc.). Invoke `superpowers:test-driven-development` / `systematic-debugging` ONLY if user asks.
   - When done, optionally call `mcp__overlord-bridge__update_session` with a one-line progress summary.
   - **Mandatory nudge again** before picking the next task.

6. **DO NOT autopilot.** Wait for the user's direction between tasks.

## What NOT to do

- Don't burn through multiple tasks without checking in
- Don't recommend which task to do next
- Don't auto-update the Plan section unless the user explicitly says so
