---
name: workflow-overlord-slice-close
description: Close the active slice — write Handoff section, cascade Roadmap, open PR. AI proposes; user confirms each step.
---

# /workflow-overlord-slice-close

Finalize the active slice.

## Steps

1. **Mandatory nudge** with emphasis on close-time tools:
   > *Reminder: tools available before close — `superpowers:verification-before-completion`, `superpowers:requesting-code-review`. Invoke any (or none) — your call.*

2. **Wait for explicit user confirmation** that they're ready to close.

3. **Fetch active slice** via `mcp__overlord-bridge__get_active_slice`.

4. **Compose the Handoff body.** Include:
   - Files touched: from `git diff --stat <merge-base>..HEAD`
   - What was done (vs. what Plan said): the diff is the synthesis material
   - Test results: whatever tests the user ran
   - Deferred issues: anything found but not fixed (flag explicitly)

5. **Append Handoff to the slice page** via `mcp__overlord-bridge__log_handoff` with the markdown body.

6. **Update the slice row** via `mcp__notionhq__API-patch-page`:
   - `Status` → "closed"
   - `PR link` → URL of the PR (from step 7)

7. **Create the PR.** `gh pr create --title "<slice title>" --body "$(cat <handoff body>)"`.

8. **Roadmap cascade** (the second cascade moment): if slice had a Parent Roadmap, patch that Roadmap row's `Active slice` to null (or to the next planned slice).

9. **Deferred-issue gate (Rule 9):** scan the Handoff body for anything flagged "deferred" / "TODO" / "follow-up". If found: tell the user to open GitHub issues for them BEFORE merging the PR.

10. **Session transcript uploads automatically** via the SessionEnd hook when the user exits Claude/Codex. No manual action.

## What NOT to do

- Don't auto-close without explicit user confirmation
- Don't skip the deferred-issue check
- Don't cascade Roadmap at any moment other than open/close
