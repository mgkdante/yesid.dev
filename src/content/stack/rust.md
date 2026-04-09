---
id: rust
name: "Rust"
layer: systems
domains: [systems-programming]
connectsTo: [cpp]
relatedServices: []
relatedProjects: []
icon: rust
proficiency: familiar
---

## What it is

Rust is a systems programming language focused on safety, speed, and concurrency. Its ownership system eliminates entire categories of bugs — null pointer dereferences, data races, use-after-free — at compile time, without needing a garbage collector. Rust achieves C/C++ performance levels while preventing the memory safety issues that cause the majority of security vulnerabilities in systems software. It's used in production at Mozilla, Cloudflare, Discord, and AWS.

## Why I use it

Rust represents the direction I'm growing in systems programming. Its ownership model enforces at compile time what other languages leave to programmer discipline, and its zero-cost abstractions mean you don't pay a performance penalty for safety. I'm building familiarity with Rust for use cases where Python is too slow and C++ is too dangerous: high-throughput data processing, CLI tools, and WebAssembly modules that run at near-native speed in the browser.

## In Practice

Rust is part of my long-term systems programming development. The immediate practical angle is WebAssembly — Rust compiles to WASM with excellent tooling (wasm-pack, wasm-bindgen), enabling performance-critical code to run in the browser. For a data infrastructure consultant, that means potentially building fast client-side data processing tools, interactive visualizations, or compression utilities that run at native speed without a server round-trip.
