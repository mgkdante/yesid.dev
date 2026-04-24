---
id: node-js
name: "Node.js"
layer: backend
domains: [web-development, internal-tooling]
connectsTo: [postgresql, mysql, rest-api]
relatedServices: [web-development, internal-tooling]
relatedProjects: []
icon: node-js
proficiency: proficient
---

## What it is

Node.js is a JavaScript runtime built on Chrome's V8 engine that lets you run JavaScript outside the browser — on servers, command-line tools, and backend services. It uses an event-driven, non-blocking I/O model, which makes it efficient for handling many simultaneous connections. npm, its package manager, hosts the largest ecosystem of open-source libraries in any language.

## Why I use it

Node.js is the runtime behind my internal tooling and API layers. For projects where the frontend is already JavaScript/TypeScript, using Node on the backend means the entire stack shares one language, one type system, and one set of libraries. I pair it with Express or SvelteKit's server routes depending on the project. For new projects I often reach for Bun instead, but Node.js remains the standard for production deployments where ecosystem compatibility matters most.

## In Practice

The Lorem Retool Admin Panel uses Node.js as its API layer — handling CRUD operations against PostgreSQL with role-based access control and automated approval routing. Node.js is also the foundation for SvelteKit's server-side rendering on yesid.dev, where it handles the build pipeline, server routes, and static asset generation that Vercel deploys to the edge.
