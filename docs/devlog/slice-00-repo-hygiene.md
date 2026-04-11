# Devlog — Slice 0: Repo Hygiene + Workflow Infrastructure

**Date:** 2026-04-11
**Branch:** feature/slice-00-repo-hygiene
**Spec:** docs/specs/2026-04-11-slice-00-repo-hygiene-design.md

## Session 1

### Goal
Reorganize docs/, update CLAUDE.md + WORKFLOW.md with CI/CD branching, checkpoint protocol, proactive tool selection.

### Drift at Session Start
Untracked files from previous work:
- `static/svg/graffiti/prop-rocket.svg`, `prop-train.svg` — slice 13h assets (not part of this slice)
- `static/test-morph.html` — test file from slice 13 (not part of this slice)
- `.claude/worktrees/` — worktree artifacts (will be cleaned up)
- Slice 0 spec + plan files are untracked (created in planning session, will be committed as part of reorg)

### Decisions
- Branching: hybrid (one branch per sub-slice, commits per task, one PR to merge)
- Session continuity: devlog + checkpoint file
- Parallelism: strictly sequential for Slice 17
- Brainstorm artifacts: archived to docs/archive/brainstorms/
- Claude Code worktrees: disabled (feature branches provide isolation)
- Spec/plan files are untracked — will `cp` + `git add` instead of `git mv` in Task 3

### Changes Log
(Updated as tasks complete)
