# Workflow

## The Loop

Every piece of work follows this cycle. No exceptions.

```
PLAN (here in Claude.ai)
  ↓  download slice spec file
BUILD (Cursor + Claude Code)
  ↓  copy handoff report text
REVIEW (here in Claude.ai)
  ↓  plan next slice
REPEAT
```

---

## Step 1: Plan a Slice (Claude.ai)

Open this project. Start a new conversation or continue an existing one.

**Say something like:**
> "Let's plan slice 02 — the project cards component"

I'll write the spec with you. When it's ready, I'll package it as a downloadable `.md` file.

**You do:** Download the file. Drop it into `docs/slices/` in your repo.

---

## Step 2: Build It (Cursor)

Open your project in Cursor. Paste this into Claude Code:

```
Read CLAUDE.md first.
Then read and execute docs/slices/slice-NN-name.md.
Follow all logging and handoff rules.
```

Replace `NN-name` with the actual slice filename.

**You do:** Let Claude Code work. It will create/modify files, write a dev log, and produce a handoff report.

---

## Step 3: Review (Claude.ai)

When Claude Code finishes, open `docs/handoffs/handoff-slice-NN.md` in your repo.

**Copy the entire handoff file contents.**

Come back to this project. Start a new conversation or continue.

**Paste it and say:**
> "Slice NN is done. Here's the handoff. Let's review and plan the next one."

I'll check the handoff against the spec, flag anything off, and we plan the next slice.

---

## Step 4: Update the Plan (Claude.ai)

After review, I'll update the master plan status and we write the next slice spec.

**You do:** Download the updated `PLAN.md` and new slice spec. Drop them into your repo.

---

## What Goes Where

| Document | Lives in | Created by | Moves how |
|----------|----------|-----------|-----------|
| Slice spec | `docs/slices/` | Claude.ai (download) | Download, drop in repo |
| Dev log | `docs/devlog/` | Claude Code | Stays in repo |
| Handoff report | `docs/handoffs/` | Claude Code | Copy-paste text back here |
| Master plan | `docs/PLAN.md` | Claude.ai (download) | Download, replace in repo |
| Architecture | `docs/ARCHITECTURE.md` | Claude Code | Stays in repo |

## File Moves Per Slice

**Into the repo (download from Claude.ai):**
- 1 slice spec file (once, before building)
- 1 updated PLAN.md (once, after review)

**Back to Claude.ai (copy-paste):**
- 1 handoff report text (once, after building)

Two downloads, one paste.

---

## Prompt Templates for Cursor

### Start a slice
```
Read CLAUDE.md first.
Then read and execute docs/slices/slice-NN-name.md.
Follow all logging and handoff rules.
```

### Resume a partially done slice
```
Read CLAUDE.md first.
Resume work on docs/slices/slice-NN-name.md.
Check docs/devlog/ for previous session notes.
Continue from where the last session left off.
```

### Verify a completed slice
```
Read docs/handoffs/handoff-slice-NN.md.
Run the verification steps listed in that handoff.
Report pass/fail for each step.
```
