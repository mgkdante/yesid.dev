---
id: cpp
name: "C++"
layer: systems
domains: [systems-programming]
connectsTo: [rust]
relatedServices: []
relatedProjects: []
icon: cpp
proficiency: familiar
---

## What it is

C++ is a general-purpose systems programming language that gives you direct control over hardware and memory. It's the language behind operating systems, game engines, databases (including PostgreSQL itself), browsers, and performance-critical infrastructure. Modern C++ (C++17/20/23) has evolved significantly from its roots — with smart pointers, ranges, concepts, and coroutines that make it safer and more expressive while maintaining its zero-overhead abstraction principle.

## Why I use it

C++ gives me an understanding of how the systems I build on actually work. Knowing C++ means I understand memory layout, cache behavior, and the performance characteristics that matter when I'm tuning database queries or designing high-throughput pipelines. It's foundational knowledge — even when I'm writing Python or TypeScript, understanding what the runtime is doing under the hood helps me make better performance decisions.

## In Practice

C++ informs my systems thinking more than my daily coding. When I'm optimizing SQL Server query plans or understanding why a PostgreSQL index choice matters, that knowledge traces back to understanding how B-trees work at the memory level, how hash joins use memory allocation, and how CPU cache lines affect scan performance. It's the foundational layer that makes my higher-level optimizations more informed.
