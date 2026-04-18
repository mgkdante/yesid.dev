# Session — YYYY-MM-DD — <kebab-name>

**Level:** non-slice. Standalone session record for work outside any slice: bugfixes, config changes, exploration, hotfixes, research spikes. See `CLAUDE.md` → Session Types + `docs/reference/WORKFLOW.md` §2 for the "non-slice vs slice" decision rule.

**File naming:** `docs/sessions/<YYYY-MM-DD>-<kebab-name>.md` — date-prefixed, grep-friendly.

**Type:** bugfix | config | exploration | hotfix | research | spike
**Branch:** `<feature/fix/...>-<name>` | `main` (if trivial)
**Commit(s):** `<sha>`, `<sha>` (fill in after)

---

## What + why

[One paragraph. What triggered this session, and what outcome it targets. If this is a bugfix, link the error or reproduction. If exploration, state the question you're answering.]

## Scope

- [One bullet per concrete deliverable. Should fit in 1–3 bullets max. If it grows past 5, this probably wants to become a sub-slice instead.]

## Actions taken

```bash
# Every command that materially affected the repo. Include failures.
# Keep inline or linked to specific commits.
```

Files touched:
- Modified: `path/to/file`
- Created: `path/to/file`
- Deleted: `path/to/file`

## Decisions

- **D001:** [one-line decision + why] — e.g., "Kept `raf-driven` instead of `setInterval` in motion helper — measured 20% less jitter in 60fps scroll."
- [numbered D00N as they accumulate; if a decision becomes durable, promote to PATTERNS.md or VOCAB.md before closing the session]

## Errors encountered

| Error | Cause | Fix | Resolved? |
|-------|-------|-----|-----------|
| [message] | [root cause] | [what worked] | yes / no |

If the fix was OS-specific, **also append to `<cloud>/claude-knowledge/os-quirks/<os>.md`** before closing. Hard rule.

## Validation

| Command | Result |
|---------|--------|
| `bun run test` | PASS / FAIL |
| `bun run check` | PASS / FAIL |
| Manual check | [describe] |

## Outcome

[One paragraph. What landed. What was learned. Whether this closes the question or spawned follow-up work.]

## Commit(s)

- `<sha>` — `<commit message>`

## Follow-ups

- [Anything this session flagged for future work. If a follow-up is substantial, it probably wants its own slice — file as an entry in the active slice's plan, or draft a new slice in `docs/slices/slice-NN/` when ready.]

---

## Rules for non-slice sessions

1. **Single session, single topic.** If it sprawls, stop and convert to a sub-slice.
2. **Still commits.** Every non-slice session ends with a commit on `main` or a short-lived branch.
3. **Optional PR.** If the change touches shared state (governance docs, config consumed by teammates, public infrastructure), PR it. Otherwise direct commit to `main` is fine.
4. **No self-appending handoff required** — this template replaces the handoff at non-slice scope.
5. **Commit message convention:** `<type>: <description>` (no slice prefix — e.g., `fix: crlf bug in frontmatter parser`, `chore: bump bun version`).
6. **Mirror at close:** before the session ends, copy the final `.md` to `<cloud>/yesid.dev/docs/archive/sessions/<YYYY-MM-DD>-<kebab-name>.md` (parallel to how shipped sub-slice bundles mirror to `archive/slices/`).
