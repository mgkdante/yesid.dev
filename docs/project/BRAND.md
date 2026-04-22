# yesid.dev — Brand

> **Brand is digital infrastructure, not just visuals.** Beyond colors/fonts, brand encompasses the tone of engagement, the service framing, and the construction-site + transit metaphors that shape layout and motion.

Full brand identity — foundational narrative, symbol system, voice guide — lives at [`brand/BRAND.md`](../../brand/BRAND.md) + [`brand/foundations/*`](../../brand/foundations/). This file carries the brand-as-implemented rules that code relies on.

## Identity

| Field                  | Value                                                                                          |
|------------------------|------------------------------------------------------------------------------------------------|
| Project / brand name   | yesid.dev                                                                                      |
| Wordmark               | "yesid." (always lowercase; orange dot; never "Yesid." or "Yesid Dev")                         |
| Pronunciation          | yeh-SEED (Spanish pronunciation, not "YES-id")                                                 |
| Capitalization rule    | **Always lowercase** — `yesid.` in prose, UI, copy. The dot is part of the brand mark.          |
| Domain                 | yesid.dev                                                                                      |
| Owner                  | Yesid O.                                                                                       |
| Trademark / IP status  | No formal registration. Workflow (intellectual approach) is personal IP — trade secret, not for public polish. |

## Color palette

| Token            | Hex        | Role                                                            |
|------------------|------------|-----------------------------------------------------------------|
| Primary (orange) | `#E07800`  | Brand color. The dot in "yesid." Favicon. Primary CTAs.         |
| Accent (yellow)  | `#FFB627`  | Secondary emphasis. Hover states. Transit HUD data highlights.  |
| Background       | dark       | Default canvas — dark-theme-first (near-black, token-defined)   |
| Foreground       | light      | Body text / UI text — high-contrast white-on-dark               |
| Status: success  | green      | Success dots (StatusDot), positive indicators                   |
| Status: warning  | amber/yellow-aligned | Warnings, partial states                              |
| Status: error    | red        | Errors, failed states                                           |

> **Implementation rule:** every visual color value MUST reference a CSS custom property or a `@theme` token. Zero hardcoded hex in components. Enforced in [`CSS.md`](CSS.md) § Rules + [`CONSTITUTION.md`](CONSTITUTION.md) § Token lockdown.

Color tokens live in `src/lib/styles/tokens.css` (theme-switching) and `src/app.css` `@theme` block (brand-fixed).

## Typography

| Field              | Value                                                                                              |
|--------------------|----------------------------------------------------------------------------------------------------|
| Heading font       | **Inter** (variable weight; weights in use: 400/500/600/700/900)                                   |
| Body font          | **Inter** (400/500)                                                                                |
| Mono / code font   | **JetBrains Mono** (400/500/700 — used for status labels, station codes, terminal chrome)          |
| Self-hosted?       | Yes — local font files (no Google Fonts / Adobe Fonts CDN for perf + privacy)                      |
| Fallback stack     | Inter → `system-ui, sans-serif`; JetBrains Mono → `ui-monospace, Menlo, Consolas, monospace`       |

## Theme

| Field                        | Value                                                                  |
|------------------------------|------------------------------------------------------------------------|
| Default theme                | Dark (always — no user theme toggle at launch)                         |
| Theme switching supported?   | Architecturally yes (tokens are theme-switching); not exposed in UI v1 |
| Where theme is defined       | `src/lib/styles/tokens.css` (semantic tokens) + `src/app.css` (`@theme`) |

## Voice + tone

| Trait         | Value                                                                                            |
|---------------|--------------------------------------------------------------------------------------------------|
| Formality     | Conversational-technical. Confident without being casual-sloppy.                                 |
| Technicality  | Deep technical when target is engineering peers; approachable when target is business.           |
| Person        | First person singular ("I") in About + Services. Third person passive in system copy.            |
| Tense         | Present active. Past for shipped work; future only for roadmap items with dates.                 |
| Emoji policy  | **Never in product copy.** Tasteful-rare in social posts (content-engine vocabulary). Not in UI. |

## Brand primitives (code)

Reusable brand-specific components that encode the visual identity. Distinct from headless UI primitives (Bits UI — dropdowns, dialogs).

| Component                                 | Role                                                                                 |
|-------------------------------------------|--------------------------------------------------------------------------------------|
| `src/lib/components/brand/StatusDot.svelte`       | LED/indicator dot (pulse, ring, color variants) — the "live" signal of the brand.    |
| `src/lib/components/brand/TerminalChrome.svelte`  | CRT-style visual wrapper (scanlines, bezel, glow) used on /contact.                  |
| `src/lib/components/brand/SvgIcon.svelte`         | Universal icon primitive with hover variant support + morph hooks.                   |
| `src/lib/motion/svg/MetroNetwork.svelte`          | Home-hero SVG network (Metro System visual language) — SSR-inlined via Vite `?raw` + SVGO. |

> **Deprecated / killed primitives** (documented in [`../../brand/decisions/2026-04-what-i-killed.md`](../../brand/decisions/2026-04-what-i-killed.md)): `SectionWrapper`, `EdgeRail`, `EdgeLabel`, `ListingLayout`, `DetailHero`, `CardGrid`, `BentoGrid`, `AsidePanel`. Replaced by the 4 scoped CSS Grid Recipes documented in [`CONSTITUTION.md § 2`](CONSTITUTION.md). DO NOT reintroduce these abstractions.

## Visual language / metaphors

- **Construction-site metaphor:** hazard stripes, DrawSVG graffiti letters, floodlight, props. Applied in the home-page closer section.
- **Transit metaphor:** Metro System (home hero), Station tab (services), Transit HUD (data-panel overlays), Kinetic scroll index, Departure board.
- **Terminal / CRT metaphor:** /contact uses dual terminal panels with scanlines + bezel + glow — signals "send me a message" as a technical console interaction.
- **Blueprint / architectural drawing:** oversized section headings; technical diagrams. Evokes "infrastructure designer" identity.

## Brand assets

| Asset                 | Location                                                                        |
|-----------------------|---------------------------------------------------------------------------------|
| Logo (SVG)            | [`brand/foundations/marks/`](../../brand/foundations/marks/) + `static/`        |
| Favicon               | `static/favicon.ico` + `static/favicon.svg` — **solid #E07800 circle**, NOT a "y." letter |
| Color tokens (code)   | `src/lib/styles/tokens.css` + `src/app.css` (`@theme` block)                     |
| Typography foundations| [`brand/foundations/typography.md`](../../brand/foundations/typography.md)      |
| Color foundations     | [`brand/foundations/color.md`](../../brand/foundations/color.md)                |
| Motion foundations    | [`brand/foundations/motion.md`](../../brand/foundations/motion.md)              |

## Notes / brand decisions

- **Orange #E07800 over red #FF0000:** orange signals construction/infrastructure + high-visibility-PPE without the aggression of red. Differentiates from the sea of blue-brand tech companies.
- **Favicon = solid orange dot:** not the "y." letter — the dot IS the brand mark. Letters can be lost at 16×16; a solid colored circle reads instantly in a browser tab.
- **Dark-theme-only at launch:** focuses design work; theme toggle deferred to post-Slice-22.
- **"yesid." lowercase enforced everywhere:** proper-case variants read as a different brand. Lint check planned.
- **Self-host fonts:** zero third-party requests for type. Improves FCP + LCP. Tradeoff: requires font file maintenance.
- **No emoji in product copy:** preserves the confident-technical tone. Emoji communicates "casual startup" — not the freelance-infrastructure positioning.
