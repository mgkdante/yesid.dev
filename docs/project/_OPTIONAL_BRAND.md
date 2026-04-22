# Brand

> **OPTIONAL template.** Create when this project owns a brand (visual identity + tone + voice). Typical projects: marketing sites, products, services, multi-tenant platforms.
>
> **To activate:** rename `_OPTIONAL_BRAND.md` → `BRAND.md`. Update README.md (in this directory) to move it from § OPTIONAL to § DEFAULT for this project's purposes.

## When to create

- Project has a logo, wordmark, or recognized name
- Project has a defined color palette
- Project has typography choices that must be consistent
- Project has a tone/voice (formal vs casual, technical vs accessible)
- Project ships user-facing content (UI, docs, marketing) where brand consistency matters

## Identity

| Field | Value |
|-------|-------|
| Project / brand name | <!-- FILL IN -->|
| Wordmark / logo location | <!-- FILL IN: file path or URL --> |
| Pronunciation guide | <!-- FILL IN: if non-obvious --> |
| Capitalization rule | <!-- FILL IN: e.g., "always lowercase 'projectname'" --> |
| Trademark / IP status | <!-- FILL IN: e.g., "registered TM 2026" / "no formal registration" --> |

## Color palette

| Token | Hex | Role |
|-------|-----|------|
| Primary | <!-- #XXXXXX --> | <!-- e.g., "actions, links, emphasis" --> |
| Accent | <!-- #XXXXXX --> | <!-- e.g., "secondary emphasis, hover states" --> |
| Neutral / surface | <!-- #XXXXXX --> | <!-- backgrounds --> |
| Foreground / text | <!-- #XXXXXX --> | <!-- body text --> |
| Status: success | <!-- #XXXXXX --> | <!-- success indicators --> |
| Status: warning | <!-- #XXXXXX --> | <!-- warnings --> |
| Status: error | <!-- #XXXXXX --> | <!-- errors --> |

> Implementation rule: every visual color value MUST reference a token, never raw hex. Enforced via `CSS.md` (or equivalent OPTIONAL doc) if styling discipline is significant.

## Typography

| Field | Value |
|-------|-------|
| Heading font | <!-- FILL IN: family + weights -->|
| Body font | <!-- FILL IN -->|
| Mono / code font | <!-- FILL IN: e.g., "JetBrains Mono" -->|
| Self-hosted? | <!-- FILL IN: yes (local files) / CDN (Google Fonts / Adobe Fonts) -->|
| Fallback stack | <!-- FILL IN: system font fallback chain -->|

## Theme

| Field | Value |
|-------|-------|
| Default theme | <!-- FILL IN: "dark" / "light" / "system-preference" -->|
| Theme switching supported? | <!-- FILL IN: yes / no -->|
| Where theme is defined | <!-- FILL IN: e.g., `tokens.css` / `theme.json` -->|

## Voice + tone

| Trait | Value |
|-------|-------|
| Formality | <!-- FILL IN: "formal" / "conversational" / "playful" -->|
| Technicality | <!-- FILL IN: "deep technical" / "approachable technical" / "non-technical" -->|
| Person | <!-- FILL IN: "first person plural (we)" / "second person (you)" / "no person (passive)" -->|
| Tense | <!-- FILL IN: "present active" / "past for completed work" -->|
| Emoji policy | <!-- FILL IN: "never in product copy" / "tasteful in social only" -->|

## Brand assets

> Where physical / digital brand assets live. Different from `BINDINGS.md` (commands) — this is where to find stuff.

| Asset | Location |
|-------|----------|
| Logo (SVG) | <!-- FILL IN: e.g., `brand/logo/logo.svg` -->|
| Logo (PNG variants) | <!-- FILL IN -->|
| Favicon | <!-- FILL IN -->|
| Brand guide PDF | <!-- FILL IN, or "n/a" -->|
| Color tokens (code) | <!-- FILL IN: e.g., `src/styles/tokens.css` -->|

## Notes / brand decisions

<!-- FILL IN: brand decisions worth documenting (e.g., "chose orange #E07800 over red #FF0000 because of [associations / contrast / industry differentiation]") -->
