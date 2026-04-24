---
id: vercel
name: "Vercel"
layer: devops
domains: [devops-infra, web-development]
connectsTo: [sveltekit, nextjs, github-actions]
relatedServices: [web-development]
relatedProjects: [yesid-dev]
icon: vercel
proficiency: proficient
---

## What it is

Vercel is a cloud platform for deploying web applications. Push your code to Git, and Vercel builds and deploys it automatically — with preview URLs for every pull request and production deployments on merge. It provides a global edge network (CDN), serverless functions, and framework-specific optimizations for Next.js, SvelteKit, Nuxt, and others. Vercel handles SSL, caching, and scaling without manual infrastructure management.

## Why I use it

Vercel is my deployment platform because it removes every piece of infrastructure friction. I push to GitHub, and the site is live in under a minute — with preview URLs for every branch so I can share work-in-progress with clients. The SvelteKit adapter works out of the box, automatic HTTPS is configured, and the CDN ensures fast load times globally. For a freelance developer, Vercel's zero-config deployment means I spend time building features instead of managing servers.

## In Practice

yesid.dev deploys to Vercel on every push to main. Each feature branch gets a preview deployment with a unique URL — useful for client reviews and visual QA. Vercel's build pipeline runs `bun run build`, handles the SvelteKit adapter configuration, and serves the static and server-rendered pages from edge locations. The integration with GitHub Actions means tests run in CI before Vercel promotes a deployment to production.
