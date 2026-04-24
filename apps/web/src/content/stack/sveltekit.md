---
id: sveltekit
name: "SvelteKit"
layer: frontend
domains: [web-development]
connectsTo: [svelte-5, typescript, tailwind, vercel]
relatedServices: [web-development]
relatedProjects: [yesid-dev]
icon: sveltekit
proficiency: expert
---

## What it is

SvelteKit is a full-stack web framework built on Svelte. It handles routing, server-side rendering, data loading, and deployment — everything you need to build a complete web application. Unlike frameworks that ship a heavy JavaScript runtime to the browser, SvelteKit compiles your components into minimal, optimized JavaScript at build time. The result is fast pages with less code shipped to the user.

## Why I use it

SvelteKit is my primary web framework and the foundation of every new web project I build. The developer experience is the best I've used: file-based routing that maps directly to URLs, load functions that keep data fetching explicit and testable, and a build step that eliminates the framework overhead. Coming from data engineering where I value predictability and observability, SvelteKit's "no hidden magic" philosophy resonates — I can trace exactly what runs on the server, what runs on the client, and where the data flows.

## In Practice

yesid.dev is built entirely on SvelteKit 2. Every route — the portfolio, services, blog, tech stack, and contact page — is a SvelteKit page with typed load functions that pull from the data layer. The site uses SvelteKit's adapter-vercel for deployment, its server routes for API endpoints, and its prerendering for static pages. The Control Room diagram you're looking at right now is a SvelteKit page that loads 34 tech items from markdown files at build time.
