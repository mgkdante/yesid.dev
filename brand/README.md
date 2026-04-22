# yesid. brand

The brand system for yesid.dev — a freelance digital-infrastructure practice run by Yesid O. This directory carries the narrative, the principles, the decisions, and the visual assets. Code lives in `src/`. Governance lives in `docs/reference/`. This tree does not execute anything.

## What's inside

| Path | What it is |
|---|---|
| `BRAND.md` | Voice, five principles, vocabulary, do/don't phrasings. The spine. |
| `foundations/color.md` | How the brand thinks about color. Cross-links to `docs/project/CSS.md` for raw token values. |
| `foundations/typography.md` | Inter + JetBrains Mono, the 12-step scale, rules. |
| `foundations/space.md` | Spacing tokens, recipes, when to clamp. |
| `foundations/motion.md` | Motion at a narrative level (what the brand means by movement). Cross-links to `docs/project/MOTION.md` for implementation. |
| `foundations/voice.md` | Tone, vocabulary, UX copy patterns, phrasings. |
| `foundations/accessibility.md` | Accessibility posture. Cross-links to `docs/project/CONSTITUTION.md § 7`. |
| `components.md` | Read-only inventory of `ui/` + `brand/` primitives. |
| `decisions/` | Dated records — why orange, why edge-to-edge, why a constitution, what I killed. |
| `logos/` | SVG logos + PNG exports (1x / 2x / 3x per SVG). |
| `examples/` | Paired `.png` + `.svelte.txt` pairs — screenshot + the source that produced it. Grounds LLMs in the actual built surface. |

## How brand decisions become code

There is no generator. No `brand:sync`. No script watches this tree.

1. A decision lives here — as a new principle in `BRAND.md`, a rule in `foundations/*.md`, or a dated record in `decisions/`.
2. A developer translates the decision into code — editing `src/lib/styles/tokens.css`, `src/app.css @theme`, or a component under `src/lib/components/`.
3. PR review verifies the translation matches the intent. The reviewer opens the relevant file here and the relevant diff in `src/`. If they disagree, one of them is wrong.

Physical separation is the safety mechanism. Breaking narrative does not break the site. Breaking the site does not silently corrupt the narrative.

## Where authoritative rules live

This tree is advisory. The code-level rules live where the code can enforce them.

| Concern | Authoritative source |
|---|---|
| Layout, typography rules, motion doctrine, a11y rules | `docs/project/CONSTITUTION.md` |
| Token values (colors, spacing, shadows, radii, z-index) | `src/lib/styles/tokens.css` |
| Tailwind utility bridge + static brand values | `src/app.css` `@theme` block |
| CSS architecture + token inventory reference | `docs/project/CSS.md` |
| Motion implementation (actions, scrubs, ticker) | `docs/project/MOTION.md` |
| Test strategy | `docs/project/TESTS.md` |

`brand/foundations/*.md` narrates how the brand thinks about each concern. For the specific values, follow the cross-links.

## Consuming from another project

Fork `brand/` for the narrative and the assets. The code-level files (`tokens.css`, `@theme`, component primitives) are not here — they live in `src/` and `docs/reference/`. Copy those separately if you want the full system.

A new consumer typically wants three things:
- The narrative (`BRAND.md`, `foundations/`, `decisions/`) — to understand the posture.
- The logos (`logos/` SVGs + PNG exports) — to put the wordmark somewhere.
- The examples (`examples/`) — to see the built surface alongside its source.

The narrative references file paths that only exist in the parent repo (`src/lib/styles/tokens.css`, `docs/reference/*`). In a fork, those cross-links are expected-broken until you copy the corresponding source.

## Version + contact

- Current version: Slice 17h Brand Bundle (2026-04-18).
- Maintainer: Yesid O. — mgkdante@gmail.com.
- Site: https://yesid.dev
- Source repo: https://github.com/mgkdante/yesid.dev
