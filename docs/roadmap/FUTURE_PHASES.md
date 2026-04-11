# Future Phases — Activate When Ready

## Slice 14 — Stack Builder Logic Engine

Status: draft Est. Sessions: 6 Depends on: 10, 13.
Spec: docs/slices/slice-14-stack-builder-logic.md

FIRST FEATURE RELEASED UNDER A CD/CI PIPELINE

Replace hardcoded scenario matching (7 authored scenarios + basic fallback) with a graph-based recommendation engine. Every possible domain combination (127 combos) produces a unique, contextual, educational stack recommendation. Recommendations include ordered tech with role labels, data flow narratives, cross-links to services and projects, proficiency-aware confidence levels, and tech toggle customization.

Sales through education: The builder teaches visitors what technologies they need and why — demonstrating Yesid's expertise deeply enough to close consulting engagements. Every recommendation links to matching services, shows project evidence, and adapts language to proficiency.

Architecture: Pure functions (zero DOM/framework dependency). Same engine works in browser, server route, or future API. Adding a tech = one markdown file, engine adapts automatically. Keystatic-ready (Slice 18, Cloud Content Layer).

Tasks:
14a — Engine core: Types, role derivation, scoring, selection, ordering, service/project cross-linking. Heavy test coverage.
14b — Narrative generation: Template-driven data flow stories that adapt to domain mix + proficiency.
14c — Enhanced UI: StackBuilderPanel (tech toggles) + StackRecommendation card (replaces StackConfigurator + StackScenarioCard). Desktop below-diagram + mobile FAB overlay.
14d — Polish: Role/alternative data in all 34+ markdown files. Narrative fine-tuning. Accessibility.

**Status:** Parked. Do not start until Phase A (portfolio site) is live.

---

## Phase B — Upwork Launch


| #   | Name                                                    | Depends On      | Est. Sessions |
| --- | ------------------------------------------------------- | --------------- | ------------- |
| B1  | Upwork profile setup (title, overview, skills, samples) | Site live       | 1             |
| B2  | Portfolio artifact: Retool ops dashboard demo           | B1              | 2-3           |
| B3  | Portfolio artifact: SQL reporting layer case study      | B1              | 2             |
| B4  | First 3 Upwork proposals                                | B1 + (B2 or B3) | 1             |


**Lane:** Internal tools / ops dashboards (SQL-first). Retool or Power Platform + KPI reporting + data integrity.
**Target:** $2k CAD/month net from freelance work.
**Reference:** docs/reference-upwork-lane-analysis.md

## Phase C — Portfolio Depth


| #   | Name                                                        | Depends On | Est. Sessions |
| --- | ----------------------------------------------------------- | ---------- | ------------- |
| C1  | Transit Ops polish (README, screenshots, architecture docs) | Site live  | 1             |
| C2  | New portfolio project (TBD at the time)                     | Site live  | 3-5           |
| C3  | Add new project to site via data file                       | C2         | 0.5           |


**Options discussed for C2:**

- Open data ETL pipeline (another city's GTFS feed)
- SQL performance audit case study
- Reporting dashboard on public data
- Pick one when you get here. Don't plan it now.

## Phase D — Career Growth


| #   | Name                                              | Depends On      | Notes                 |
| --- | ------------------------------------------------- | --------------- | --------------------- |
| D1  | Transit industry applications (Alto, CDPQ Infra)  | Portfolio depth | When roles open       |
| D2  | Full-stack depth (The Odin Project completion)    | Ongoing         | Learning track        |
| D3  | Site evolution (blog, case studies, new sections) | As needed       | Site is built to grow |


**This file gets revisited when Phase A ships. Not before.**