# yesid. — brand

## Principles

Five rules, numbered. Every design call pulls from exactly one of them. When two apply, the lower number wins.

1. **Edge-to-edge.** The viewport is the canvas. Text containers center for readability; visual elements (SVGs, panels, grids, decorations) use the edges. No unused gutters. See `decisions/2026-04-why-edge-to-edge.md`.
2. **Dark-first.** Dark is the default surface, not a toggle added later. Light is a theme variant, authored against the same tokens. Contrast ratios are verified on dark first, then light.
3. **One orange.** `--primary` (`#E07800`) is the only interactive brand hue. Everywhere else — borders, surfaces, text — uses semantic tokens. If a new surface wants orange, the question is whether it is interactive. If not, the answer is no. See `decisions/2026-04-why-orange.md`.
4. **Motion with intent.** Every animation serves one of three jobs: wayfinding, feedback, or emphasis. Nothing decorative. No entrance reveals. Full list in `foundations/motion.md`; doctrine lives at `docs/project/CONSTITUTION.md § 8`.
5. **No fluff.** No marketing adjectives. No hero decorations that carry no information. Craft is visible through restraint, not performance.

## Tone

Declarative, short, zero adjectives where possible. Engineer-meets-designer. The register is an RFC or a transit safety notice — not a pitch deck. A sentence that tells the reader what to do is better than a sentence that tells the reader how to feel. Paragraphs are rare; tables, lists, and short sections do most of the work. When a number matters, show the number.

## Vocabulary

| Preferred | Avoid | Why |
|---|---|---|
| digital infrastructure | data engineering | Practice is broader than SQL. Infrastructure signals durable systems. |
| projects | work | "Work" is corporate vague; "projects" is specific and countable. |
| services | offerings / solutions | Direct. No upsell vocabulary. |
| yesid. | Yesid / YESID | Always lowercase. The trailing dot is part of the name. |
| the dot is always orange | "accent dot" | The orange dot is a specific constraint, not a styling choice. |
| shipped | delivered / rolled out | "Shipped" is honest about a state change. |
| broke something | issue / defect | Direct about cause. Reserved for post-incident narrative, not client-facing copy. |
| built | crafted / curated | Craft is the result; "built" is the verb. |
| pipeline | workflow / process | Pipelines move data. Workflows are scheduling. Use the specific one. |
| docs / spec | documentation / specification | Shorter word wins. |
| reduce / remove | simplify / streamline | "Simplify" hides what was cut. Name the action. |
| 3x faster | significantly faster | Always show the number. |

## Before / after

Rewrite marketing voice into yesid voice.

| Before | After |
|---|---|
| "Seamless integration across your data stack." | "Connects your warehouse, CRM, and BI tool." |
| "Empowering teams with modern infrastructure." | "Migrations that ship on Friday." |
| "A beautiful, thoughtfully crafted design system." | "Design system for yesid.dev." |
| "We leverage cutting-edge tools to drive outcomes." | "Postgres, TypeScript, and a strong opinion on types." |
| "Unlock the full potential of your data." | "Queries that run in seconds, not minutes." |

## Do / don't

1. **Do** name the thing. Don't hide behind adjectives. (See `foundations/voice.md`.)
2. **Do** show the number when a number matters. Metrics are the brand voice.
3. **Do** keep "yesid." lowercase. Don't capitalize. Don't drop the dot. Don't recolor the dot. (See `foundations/color.md` for the single-orange rule.)
4. **Don't** add motion to compensate for weak content. If the copy is weak, fix the copy.
5. **Don't** use marketing adjectives — *seamless*, *modern*, *robust*, *elegant*, *beautiful*, *powerful*, *intuitive*. The work demonstrates these; the copy does not claim them.
6. **Don't** add a decoration that carries no information. Every line, pulse, and glow points at something.
7. **Don't** invent new brand hues. If you need a new semantic role, add a semantic token first. Orange stays reserved. (See `foundations/color.md`.)
8. **Do** cross-link to the authoritative rule (`docs/project/CONSTITUTION.md`, `tokens.css`) rather than repeating rules here. Narrative here, rules there.
