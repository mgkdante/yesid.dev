---
title: "Git Workflow"
domain: devops
difficulty: 1
difficulty_label: beginner
reading_time: 12
tags:
  - learn
  - devops
  - beginner
date: 2026-04-08
---

# Git Workflow


## The Analogy

Git is like a database transaction log -- every change is recorded, you can roll back to any previous state, and multiple people can work on different branches without conflicting. Each `commit` is like a `SAVEPOINT` in a SQL transaction: it captures the exact state of all files at that moment. If something breaks, you `ROLLBACK` to the last known good savepoint. Branches are like parallel transactions that work on different features without seeing each other's uncommitted changes.

## What It Is

Git is a version control system -- it tracks every change to every file in a project. Instead of naming files `index_v2_final_FINAL.html`, Git maintains a complete history where each version has a unique identifier (hash) and a human-readable message describing what changed.

**Core concepts:**

- **Repository (repo):** The project folder plus its entire history. The `.git/` hidden folder contains all history. Your project root (`yesid.dev/`) is a repo.

- **Commit:** A snapshot of all files at one moment. Each commit has:
  - A **hash** (e.g., `995a6e4`) -- the unique ID
  - A **message** (e.g., `feat: complete slice 09b`) -- what changed and why
  - A **parent** -- the previous commit it builds on

- **Branch:** A named pointer to a commit. `main` is the default branch. Creating a branch is like `BEGIN TRANSACTION` -- you work without affecting the main line.

- **Staging area (index):** A holding area between your working files and a commit. `git add Footer.svelte` puts that file into the staging area. `git commit` commits everything in the staging area. This two-step process lets you commit specific files, not everything at once.

**Conventional commit format** (used in this project):
```
<type>: <description>

<optional body>
```

Types:
- `feat:` -- a new feature
- `fix:` -- a bug fix
- `docs:` -- documentation changes only
- `refactor:` -- code restructuring without behavior change
- `test:` -- adding or modifying tests
- `chore:` -- tooling, config, dependencies
- `perf:` -- performance improvement
- `ci:` -- continuous integration changes

## Why It Matters

Git is the most fundamental tool in professional software development. Every company uses it. Every interview expects fluency. "Walk me through your Git workflow" is a screening question. For clients, Git provides accountability (who changed what, when, why), rollback safety (undo any change), and collaboration (multiple developers on one project). Not knowing Git is like not knowing SQL -- it is a prerequisite for the job.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `.github/workflows/ci.yml` | The CI pipeline triggered by git push | Shows that every push to `main` or PR runs the full test suite |
| `CLAUDE.md` | The "Slice closing" section, step 7 | Documents the exact commit format: `git add -A && git commit -m "feat: complete slice NN — [short desc]" && git push` |
| `docs/handoffs/` | Handoff reports for completed slices | Each handoff corresponds to a commit -- the handoff describes what the commit contains |
| `docs/devlog/` | Development logs | Records decisions made during each slice, linked to specific commits |

## The Mental Model

```
SQL transaction log analogy:

  SQL:                              Git:
  BEGIN TRANSACTION                  git checkout -b feature-branch
  INSERT INTO features ...           (write code)
  SAVEPOINT sp1                      git add file.ts && git commit -m "feat: add X"
  INSERT INTO features ...           (write more code)
  SAVEPOINT sp2                      git add file.ts && git commit -m "feat: add Y"
  ROLLBACK TO sp1                    git revert <hash>  (undo back to sp1)
  COMMIT                             git merge feature-branch into main


Commit flow:

  Working directory       Staging area         Repository
  (your files)            (git add)            (git commit)
  ┌──────────────┐       ┌──────────────┐     ┌──────────────┐
  │ Footer.svelte│──add─→│ Footer.svelte│─commit→│ commit abc123│
  │ (modified)   │       │ (staged)     │     │ "feat: footer" │
  └──────────────┘       └──────────────┘     └──────────────┘


Branch visualization:

  main:     A ── B ── C ── D ── E
                       \         ↑
  feature:              F ── G ──┘ (merge)

  A-E are commits on main
  F-G are commits on the feature branch
  The merge brings F and G into main's history
```

## Worked Example

```bash
# This project's actual commit workflow (from CLAUDE.md):

# Step 1: Check what files changed
git status
# Shows: modified src/lib/components/Footer.svelte
#        new file src/lib/components/Footer.test.ts

# Step 2: Stage all changes
# git add -A stages everything (new, modified, deleted files)
git add -A

# Step 3: Commit with conventional commit format
# Type: "feat" because this is a new feature
# Description: short, present tense, describes the change
git commit -m "feat: complete slice 09b — about bento dashboard + contact dual terminal"

# Step 4: Push to remote (GitHub)
# This triggers the CI pipeline in .github/workflows/ci.yml
git push

# After push, CI runs:
#   1. bun install
#   2. bunx svelte-kit sync
#   3. bunx svelte-check  (type checking)
#   4. bun run test        (unit tests)
#   5. bun run build       (production build)
```

From the project's recent commit history:
```
995a6e4  docs: add PATTERNS.md, workflow pipeline fixes, remove claude.ai drift
07005a3  docs: add Workflow section to CLAUDE.md, slice 10 planning artifacts
e15f64c  docs: add slice 10-13 summaries, 404 page scope in slice 11
e52af93  feat: complete slice 09b — about bento dashboard + contact dual terminal
cbdefc6  feat(contact): Web3Forms email backend + progressive enhancement
```

Notice the pattern: `docs:` for documentation-only changes, `feat:` for new features, `feat(scope):` for scoped features. Each message describes the "what," and the optional body (in the full commit, not shown in the log) describes the "why."

## Common Mistakes

1. **Committing everything at once with vague messages:**
   - **What happens:** `git commit -m "updates"` -- three days later, nobody knows what this commit changed or why.
   - **Fix:** Use conventional commit format. Each commit should be one logical change with a descriptive message. If you are typing "various fixes," split into multiple commits.
   - **Why:** Commit messages are documentation. When something breaks, you search the log to find which commit introduced the bug. Vague messages make this impossible.

2. **Committing secrets (API keys, passwords):**
   - **What happens:** You commit a `.env` file with `API_KEY=sk-prod-...`. Even if you delete it in the next commit, the secret exists in Git history forever.
   - **Fix:** Add `.env` to `.gitignore` before your first commit. If a secret was committed, rotate it immediately (generate a new key and revoke the old one).
   - **Why:** Git history is permanent and public (if the repo is on GitHub). Secrets in history are exploitable even after deletion from the working directory.

3. **Working directly on `main` instead of a branch:**
   - **What happens:** You push broken code directly to `main`. CI fails. The deployed site breaks. Other developers cannot work because `main` is broken.
   - **Fix:** Create a feature branch (`git checkout -b feat/new-widget`), work there, and merge to `main` only after CI passes.
   - **Why:** `main` should always be deployable. Branches protect `main` from incomplete or broken work.

## Break It to Learn It

### Exercise 1: Read the Commit History
1. Run `git log --oneline -10` in the project root
2. **Predict:** You will see the 10 most recent commits with their short hashes and messages
3. **Verify:** Run the command and read the messages. Can you tell what each commit changed just from the message?
4. **What you learned:** Good commit messages make the project history self-documenting

### Exercise 2: Inspect a Specific Commit
1. Pick a commit hash from `git log --oneline -5` (e.g., `e52af93`)
2. Run `git show <hash> --stat` to see which files changed
3. **Predict:** A `feat:` commit will show source code and test file changes. A `docs:` commit will show only markdown files.
4. **Verify:** Compare a `feat:` commit and a `docs:` commit
5. **What you learned:** `git show` reveals exactly what a commit changed -- like `SELECT * FROM audit_log WHERE commit_id = <hash>`

### Exercise 3: Practice the Staging Area
1. Create a temporary file: `echo "test" > /tmp/git-exercise.txt` (outside the project)
2. Run `git status` in the project root -- the temp file should NOT appear (it is outside the repo)
3. **Predict:** Git only tracks files within the repository directory
4. **Verify:** Confirm `git status` shows no mention of the temp file
5. **What you learned:** Git's scope is the repository root and everything below it -- external files do not exist to Git

## Connections

- **Depends on:** none (this is foundational)
- **Enables:** [[github-actions-ci]] because CI pipelines trigger on Git events (push, pull request)
- **Enables:** [[vercel-deployment]] because deployment triggers on `git push` to the `main` branch
- **Related:** [[bun-vs-node]] because the CI pipeline uses Bun for install and build steps

## Knowledge Check

1. What is a commit and how does it relate to a SQL savepoint? → See [The Analogy](#the-analogy)
2. What is the staging area and why does Git have a two-step commit process? → See [What It Is](#what-it-is)
3. What are the conventional commit types used in this project? → See [What It Is](#what-it-is)
4. Why should you never commit secrets to Git? → See [Common Mistakes](#common-mistakes)
5. What happens when you `git push` in this project? → See [Worked Example](#worked-example)

## Go Deeper

- [Git Official Documentation](https://git-scm.com/doc)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
