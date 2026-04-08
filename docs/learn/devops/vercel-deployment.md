---
title: "Vercel Deployment"
domain: devops
difficulty: 1
difficulty_label: beginner
reading_time: 10
tags:
  - learn
  - devops
  - beginner
prerequisites:
  - "[[git-workflow]]"
date: 2026-04-08
---

# Vercel Deployment


## The Analogy

Vercel deployment is like database replication -- push to main, changes appear on the live server. In SQL Server, you might set up transactional replication where every committed change on the primary automatically propagates to the replica. Vercel works the same way: `git push` to `main` triggers an automatic build and deploy. Within minutes, your changes are live at `yesid.dev`. No manual FTP uploads, no SSH into a server, no "did you remember to deploy?"

## What It Is

**Vercel** is a cloud platform that hosts web applications. It connects to your GitHub repository and automatically deploys your site whenever you push code.

The deployment pipeline:
1. You `git push` to `main`
2. Vercel detects the push (via GitHub webhook)
3. Vercel clones your repo on its build servers
4. Vercel runs `bun run build` (or the configured build command)
5. Vercel deploys the built output to its global CDN (Content Delivery Network)
6. Your site is live at `yesid.dev` within 1-2 minutes

**adapter-vercel** is the SvelteKit adapter that tells the build process how to output files that Vercel can serve. Different hosting platforms have different adapters (adapter-node for Node.js servers, adapter-static for static hosts). This project uses adapter-vercel, configured in `svelte.config.js`.

**Preview deployments** are a key Vercel feature: every pull request gets its own temporary URL (e.g., `yesid-dev-abc123.vercel.app`). This lets you preview and test changes before merging to main. Think of it as a staging database that is automatically created for every code review.

## Why It Matters

Understanding deployment answers the interview question "How does code go from your laptop to a live URL?" The answer is: Git push triggers an automated pipeline that builds, optimizes, and distributes the site globally. For clients, automated deployment means changes ship faster (no manual deploy step), rollbacks are instant (revert to previous commit), and preview URLs enable feedback before changes go live.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `svelte.config.js` | `adapter: adapter({ runtime: 'nodejs22.x' })` | Configures SvelteKit to output Vercel-compatible files with Node.js 22 runtime |
| `svelte.config.js` | `import adapter from '@sveltejs/adapter-vercel'` | The adapter import -- this single line decides where the site can be hosted |
| `package.json` | `"@sveltejs/adapter-vercel": "^6.3.1"` | The adapter as a dev dependency |
| `.github/workflows/ci.yml` | `bun run build` (final step) | CI verifies the build succeeds before Vercel deploys it |

## The Mental Model

```
SQL replication analogy:

  Primary DB (your machine):
    INSERT INTO features VALUES ('new-hero', ...)
    COMMIT  → git push

  Replica (production):
    Automatically receives the commit
    Applies changes
    Live within minutes

  Vercel pipeline:
    git push to main
         ↓
    GitHub webhook notifies Vercel
         ↓
    Vercel build server:
      1. Clone repo
      2. bun install
      3. bun run build (via adapter-vercel)
      4. Output: optimized HTML/JS/CSS
         ↓
    Deploy to global CDN
      - Edge nodes in 30+ regions
      - Users hit nearest node (fast!)
         ↓
    Live at yesid.dev


Preview deployment flow:

  Developer creates PR:  feat/new-contact-page
       ↓
  Vercel auto-deploys to: yesid-dev-abc123.vercel.app
       ↓
  Team reviews on the preview URL
       ↓
  PR merged → main auto-deploys to yesid.dev


Build configuration (from svelte.config.js):

  adapter-vercel
  ├── runtime: 'nodejs22.x'     ← Which Node.js version to use
  ├── Output: serverless functions + static assets
  └── Edge: static assets served from CDN, functions run on demand
```

## Worked Example

```javascript
// From: svelte.config.js
// This is where SvelteKit learns how to deploy to Vercel.

import adapter from '@sveltejs/adapter-vercel';
import { mdsvex } from 'mdsvex';

const config = {
  extensions: ['.svelte', '.md'],  // Process both Svelte and Markdown files
  preprocess: [
    mdsvex({ extensions: ['.md'] })  // Markdown → Svelte component pipeline
  ],
  kit: {
    // Pin to Node 22 LTS.
    // WHY: Bun ships a newer Node.js ABI that the adapter rejects.
    // By pinning to 'nodejs22.x', we get a stable, tested runtime.
    //
    // SQL analogy: like specifying @@VERSION compatibility level
    // — you want the production DB to match what you tested against.
    adapter: adapter({ runtime: 'nodejs22.x' })
  }
};

export default config;
```

The key insight: this single `adapter()` call is the only deployment-specific configuration. Everything else in the project (components, routes, data) is platform-agnostic. If you wanted to switch from Vercel to Netlify, you would change this one line to `import adapter from '@sveltejs/adapter-netlify'` and update the options. The rest of the code stays identical.

The `runtime: 'nodejs22.x'` is important: during development, this project uses Bun (faster, better DX). In production on Vercel, it runs on Node.js 22 LTS (more compatible, battle-tested at scale). See [[bun-vs-node]] for why.

## Common Mistakes

1. **Forgetting that the build runs on Vercel, not your machine:**
   - **What happens:** Code works locally (`bun run dev`) but fails on Vercel. Common causes: hardcoded file paths, missing environment variables, dependencies listed in `devDependencies` that are needed at runtime.
   - **Fix:** Always test with `bun run build && bun run preview` locally before pushing. This simulates the production build.
   - **Why:** Your local dev server uses Vite's on-demand transforms. The production build does full bundling, tree-shaking, and optimization -- different code paths can fail.

2. **Not using preview deployments for review:**
   - **What happens:** You merge to `main` without testing the deployed version. The site breaks because of a build-time issue that did not appear in `bun run dev`.
   - **Fix:** Open a pull request. Vercel auto-deploys a preview. Test the preview URL before merging.
   - **Why:** Preview deployments are the staging environment. Skipping staging means deploying untested code to production.

3. **Ignoring the adapter configuration:**
   - **What happens:** You add a feature that works locally but crashes on Vercel because the adapter does not support it (e.g., file system writes, which serverless functions cannot do).
   - **Fix:** Check the adapter-vercel documentation for what is supported. Serverless functions are stateless -- no persistent file system, no long-running processes.
   - **Why:** Vercel runs serverless functions, not a traditional server. The execution model is different from your local machine.

## Break It to Learn It

### Exercise 1: Inspect the Adapter Configuration
1. Open `svelte.config.js`
2. Read the `adapter()` call and its options
3. **Predict:** Changing `runtime: 'nodejs22.x'` to `runtime: 'nodejs18.x'` would run the production site on an older Node.js version
4. **Verify:** This is a read-only exercise -- do not change production config
5. **What you learned:** The adapter is the bridge between SvelteKit and the hosting platform -- one small config controls the entire deployment behavior

### Exercise 2: Build Locally Like Vercel Does
1. Run `bun run build` in your terminal
2. Then run `bun run preview`
3. **Predict:** The site should work at `http://localhost:4173` -- this is what Vercel deploys
4. **Verify:** Open the URL and navigate around. It should look identical to `bun run dev` on port 5173
5. **What you learned:** `bun run build && bun run preview` is the local equivalent of what Vercel does -- always test this way before pushing critical changes

### Exercise 3: Compare Dev and Preview Ports
1. Note the dev server port (`bun run dev` → 5173) and preview port (`bun run preview` → 4173)
2. **Predict:** Both serve the same site, but dev uses Vite HMR (hot module replacement) while preview serves the built bundle
3. **Verify:** Check the Network tab in DevTools on both -- dev serves many small modules, preview serves few bundled files
4. **What you learned:** Dev is optimized for development speed (fast refreshes). Preview is optimized for production performance (bundled, minified, optimized)

## Connections

- **Depends on:** [[git-workflow]] because deployment triggers on `git push`
- **Related:** [[github-actions-ci]] because CI validates the build before Vercel deploys it
- **Related:** [[bun-vs-node]] because dev uses Bun but production uses Node.js 22 via adapter-vercel
- **Related:** [[environment-variables]] because secrets must be configured in the Vercel dashboard, not in code
- **Related:** [[playwright-e2e]] because E2E tests run against `bun run preview` -- the same artifact that Vercel deploys

## Knowledge Check

1. What happens when you `git push` to `main` in this project? → See [What It Is](#what-it-is)
2. What does `adapter-vercel` do and where is it configured? → See [Worked Example](#worked-example)
3. Why does the project use Node.js 22 in production but Bun in development? → See [Worked Example](#worked-example)
4. What is a preview deployment and why should you use it? → See [What It Is](#what-it-is)

## Go Deeper

- [Vercel Documentation](https://vercel.com/docs)
- [SvelteKit adapter-vercel Documentation](https://svelte.dev/docs/kit/adapter-vercel)
