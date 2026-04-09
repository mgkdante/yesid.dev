---
id: typescript
name: "TypeScript"
layer: backend
domains: [web-development, mobile-development, internal-tooling]
connectsTo: [sveltekit, react, nextjs, node-js, vitest]
relatedServices: [web-development]
relatedProjects: [yesid-dev]
icon: typescript
proficiency: expert
---

## What it is

TypeScript is JavaScript with a type system. It adds static types to the language — meaning you declare what shape your data has, and the compiler catches mistakes before your code ever runs in a browser. Every valid JavaScript file is also valid TypeScript, so adoption is gradual. TypeScript compiles down to plain JavaScript, so browsers and Node.js run it without any runtime overhead.

## Why I use it

I don't write JavaScript anymore — only TypeScript. The type system catches entire categories of bugs at compile time that would otherwise surface as runtime errors in production. For data-driven sites like this one, where components render from typed data interfaces, TypeScript ensures that adding a project or service never breaks the UI silently. The developer experience with VS Code's IntelliSense is also dramatically better — autocomplete, refactoring, and go-to-definition all work because the types are there.

## In Practice

Every file on yesid.dev is TypeScript. The data layer (projects, services, tech stack) is fully typed with interfaces like `TechStackItem`, `Project`, and `LocalizedString`. Components receive typed props, and the test suite validates data integrity at build time. When I added 34 tech stack items to the Control Room diagram, TypeScript caught every typo in connection references and domain names before I even opened a browser.
