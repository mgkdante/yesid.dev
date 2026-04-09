---
id: github-actions
name: "GitHub Actions"
layer: devops
domains: [devops-infra]
connectsTo: [vercel, docker, vitest, playwright]
relatedServices: []
relatedProjects: [yesid-dev]
icon: github-actions
proficiency: proficient
---

## What it is

GitHub Actions is a CI/CD platform built into GitHub. You define workflows in YAML files that run automatically on events — push, pull request, schedule, or manual trigger. Each workflow runs on a virtual machine (Ubuntu, Windows, or macOS) and can execute shell commands, run tests, build code, deploy applications, or interact with any API. The marketplace offers thousands of pre-built actions for common tasks.

## Why I use it

GitHub Actions integrates directly with where my code lives — no separate CI service to configure, no webhooks to maintain, no additional accounts to manage. I define my test and deploy pipeline in `.github/workflows/`, and it runs on every push. The tight integration means PR checks show test results inline, deployment status appears on the commit, and I can trigger workflows from GitHub's UI when needed. For solo and small-team projects, it's the simplest path to professional CI/CD.

## In Practice

On yesid.dev, GitHub Actions runs the test suite (`bun run test`), type checks (`bun run check`), and triggers Vercel deployments on every push. Pull request workflows run the full test matrix and block merging if tests fail. The pipeline also handles scheduled tasks and can be extended with Playwright E2E tests as the project grows. Having CI run on every commit means I catch broken builds immediately — not after deploying to production.
