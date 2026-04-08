---
title: "Environment Variables"
domain: devops
difficulty: 1
difficulty_label: beginner
reading_time: 10
tags:
  - learn
  - devops
  - beginner
date: 2026-04-08
---

# Environment Variables


## The Analogy

Environment variables are like SQL Server configuration parameters -- settings that change between dev, staging, and production without changing the code. In SQL Server, you might have `sp_configure 'max server memory'` set to 4GB on your laptop and 64GB in production. The stored procedures are identical -- only the configuration differs. Environment variables work the same way: your code reads `process.env.API_KEY`, and the value changes depending on where the code runs (your laptop, CI, Vercel).

## What It Is

An **environment variable** is a key-value pair set outside your code that your code can read at runtime. They solve two problems:

1. **Secrets management:** API keys, passwords, and tokens should never be hardcoded in source code. If you commit `API_KEY = "sk-prod-..."` to Git, anyone with access to the repository can see it. Instead, you store the key in an environment variable and read it with `process.env.API_KEY`.

2. **Environment-specific configuration:** The database URL, API endpoint, or feature flag that differs between development and production. Your code does not know or care which environment it runs in -- it reads the variable and uses whatever value is set.

**`.env` files** are a convention for storing environment variables locally. A `.env` file in your project root contains key-value pairs:
```
API_KEY=my-development-key
DATABASE_URL=postgresql://localhost:5432/dev
```

The `.env` file is listed in `.gitignore` -- it is never committed to Git. Each developer has their own `.env` with their own values.

In SvelteKit, environment variables have a prefix convention:
- `PUBLIC_` prefix: accessible in both server and client code (safe for non-secrets)
- No prefix: server-only (never sent to the browser -- safe for secrets)

## Why It Matters

Secret management is a non-negotiable security skill. The interview question "How do you handle API keys?" has one correct answer: "Environment variables, never in source code." Hardcoded secrets in Git are one of the most common security vulnerabilities -- entire companies have been compromised because a developer committed an AWS key to a public repository. For clients, proper secret management means their API keys, payment credentials, and database passwords are protected even if the source code is leaked.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/data/contact-page.ts` | `web3formsKey: '6887fd90-...'` | The Web3Forms access key -- this specific key is a PUBLIC key (safe to expose client-side, by design) |
| `src/lib/data/types.ts` | `web3formsKey: string; // Public access key — safe to expose client-side` | TypeScript documents that this key is intentionally public |
| `.github/workflows/ci.yml` | `process.env.CI` used in playwright.config.ts | CI sets `CI=true` automatically -- code can detect if it is running in CI |
| `svelte.config.js` | The adapter configuration | Vercel environment variables are set in the Vercel dashboard, not in code |

## The Mental Model

```
SQL Server configuration analogy:

  Development (laptop):
    sp_configure 'max memory' = 4096 MB
    connection_string = 'localhost:5432/dev_db'

  Production (server):
    sp_configure 'max memory' = 65536 MB
    connection_string = 'prod-server:5432/prod_db'

  Same stored procedures, different configuration.


Environment variables flow:

  .env file (local only, gitignored):
  ┌─────────────────────────────────┐
  │ SECRET_API_KEY=sk-dev-abc123    │ ← only exists on YOUR machine
  │ PUBLIC_SITE_NAME=yesid.dev      │ ← could be in code, but varies by env
  └─────────────────────────────────┘
       ↓ read by
  process.env.SECRET_API_KEY       ← your code reads the value
       ↓ result
  "sk-dev-abc123"                  ← the value, without hardcoding it


Where variables live in each environment:

  Local development:   .env file in project root
  CI (GitHub Actions): Set in workflow YAML or GitHub Secrets
  Production (Vercel): Set in Vercel Dashboard → Settings → Environment Variables

  Your code:           process.env.SECRET_API_KEY
  (same code reads from all three sources — it does not know which one)


Security boundary:

  SAFE to commit:                    NEVER commit:
  ───────────────                    ─────────────
  Public API keys                    Secret API keys
  (Web3Forms access key)             (database passwords)
  Feature flags                      OAuth client secrets
  Site configuration                 Payment processor keys
  (PUBLIC_ prefixed in SvelteKit)    (anything that grants access)
```

## Worked Example

```typescript
// From: src/lib/data/contact-page.ts
// Web3Forms integration — a case study in public vs secret keys.

// This key IS hardcoded — and that's intentional.
// Web3Forms access keys are designed to be public (client-side).
// They are not secrets — they only allow form submission to YOUR email.
// Anyone who inspects the page source can see this key, and that's fine.
web3formsKey: '6887fd90-3348-4d31-ba03-bc0e285697b6',
```

```typescript
// From: src/lib/data/types.ts
// The TypeScript interface documents the security decision:

interface ContactPageData {
  web3formsKey: string; // Public access key — safe to expose client-side
}

// WHY is this documented? Because the next developer who sees a key
// in source code will (correctly) ask "should this be a secret?"
// The comment answers: "No, this is a public key by design."
```

```typescript
// HYPOTHETICAL: If the project had a secret key, this is how it would work.
// (This code does NOT exist in the project — it's an educational example.)

// In .env (never committed):
// SECRET_PAYMENT_KEY=sk-live-abc123

// In server-side code (+page.server.ts):
const paymentKey = process.env.SECRET_PAYMENT_KEY;
if (!paymentKey) {
  throw new Error('SECRET_PAYMENT_KEY not configured');
}
// Use paymentKey in server-side API call
// SQL analogy: like checking that a required config parameter exists at startup
```

The pattern: read the variable, validate it exists, throw a clear error if missing. This "fail fast" approach catches misconfiguration immediately (at server startup) instead of later (when a user tries to pay and the API call fails with a cryptic error).

## Common Mistakes

1. **Committing `.env` to Git:**
   - **What happens:** Your secret API keys are now in the Git history. Even if you delete the file later, the secrets remain in previous commits. Anyone who clones the repo can find them.
   - **Fix:** Add `.env` to `.gitignore` before your first commit. If secrets were committed, **rotate them immediately** (generate new keys, revoke the old ones).
   - **Why:** Git history is permanent. `git rm .env` removes the file from the current state but not from history. The secret is still recoverable.

2. **Accessing secret variables in client-side code:**
   - **What happens:** In SvelteKit, a variable without the `PUBLIC_` prefix is server-only. If you try to read `process.env.SECRET_KEY` in a `.svelte` file (client-side), it will be `undefined`.
   - **Fix:** Secret variables should only be read in server-side files (`+page.server.ts`, `+server.ts`, hooks). Public variables use the `PUBLIC_` prefix and can be read anywhere.
   - **Why:** Client-side code is sent to the browser. Any variable embedded in client code is visible to users via View Source or DevTools.

3. **Not validating that variables exist:**
   - **What happens:** Code reads `process.env.API_KEY` and silently gets `undefined`. The API call fails with a confusing error 3 steps later.
   - **Fix:** Check at startup: `if (!process.env.API_KEY) throw new Error('API_KEY not configured')`. Fail immediately with a clear message.
   - **Why:** Silent `undefined` creates mystery bugs. An explicit error message tells you exactly what to fix: "set the API_KEY environment variable."

## Break It to Learn It

### Exercise 1: Inspect the .env File
1. Check if `.env` exists in the project root: look for it in the file explorer or run `ls .env` (it may or may not exist)
2. Check `.gitignore` for `.env` entries
3. **Predict:** `.env` should be listed in `.gitignore`, meaning it is never committed to Git
4. **Verify:** Open `.gitignore` and search for `.env`
5. **What you learned:** The `.gitignore` entry is the security guard that prevents accidental secret commits

### Exercise 2: Check process.env.CI
1. Open `playwright.config.ts`
2. Find `reuseExistingServer: !process.env.CI`
3. **Predict:** Locally, `process.env.CI` is `undefined` (falsy), so `!undefined` = `true`, meaning "reuse existing server." In GitHub Actions, `CI=true`, so `!true` = `false`, meaning "start a fresh server."
4. **Verify:** This is a read-only exercise -- trace the logic
5. **What you learned:** Environment variables control behavior without `if (isLocal)` checks -- the code is the same, the environment determines the behavior

### Exercise 3: Identify Public vs Secret Keys
1. Search the codebase for `web3formsKey`
2. Read the TypeScript comment: `// Public access key — safe to expose client-side`
3. **Predict:** If this were a secret key, it would be in `.env` and read via `process.env`, not hardcoded in a data file
4. **Verify:** Think about what would happen if someone copies this key -- they can only submit forms to Yesid's email, not access anything else
5. **What you learned:** Not all keys are secrets -- understanding the security model of each API determines whether a key needs protection

## Connections

- **Depends on:** none (this is foundational)
- **Related:** [[git-workflow]] because `.gitignore` prevents secrets from being committed
- **Related:** [[vercel-deployment]] because production secrets are set in the Vercel dashboard
- **Related:** [[github-actions-ci]] because CI environment variables are set in GitHub repository settings

## Knowledge Check

1. What is an environment variable and what two problems does it solve? → See [What It Is](#what-it-is)
2. What is the difference between `PUBLIC_` and non-prefixed variables in SvelteKit? → See [What It Is](#what-it-is)
3. Why is the Web3Forms key hardcoded in this project instead of in `.env`? → See [Worked Example](#worked-example)
4. What should you do if a secret was accidentally committed to Git? → See [Common Mistakes](#common-mistakes)
5. Why should you validate environment variables at startup? → See [Common Mistakes](#common-mistakes)

## Go Deeper

- [SvelteKit Environment Variables Documentation](https://svelte.dev/docs/kit/$env-static-private)
- [The Twelve-Factor App -- Config](https://12factor.net/config)
