# yesid. — brand brief for Claude Design

> **How to use this file:** paste the whole thing into a Claude Design (or any vision+LLM design tool) session before asking for a design. It's self-contained — no external links required to apply the rules. The repo-internal cross-links at the bottom are optional depth.

---

## Who the brand is

**Name:** yesid. (always lowercase, trailing dot is part of the name, dot is always `#E07800` orange)
**Tagline:** Digital infrastructure that moves.
**Practitioner:** Yesid O. — freelance digital-infrastructure practice based in Montreal. SQL, pipelines, observability, operational systems, cloud infra.
**Site:** https://yesid.dev
**Audience:**
- Primary: hiring managers at infrastructure-leaning companies (e.g., Alto transit ops, CDPQ Infra, public-infrastructure consultancies).
- Secondary: Montreal-area freelance clients looking for a specific problem solved.

---

## Five principles (numbered; lower number wins when two apply)

1. **Edge-to-edge.** The viewport is the canvas. Text containers center for readability; visual elements (SVGs, panels, grids, decorations) use the edges. No unused gutters.
2. **Dark-first.** Dark is the default surface, not a toggle added later. Light is a theme variant against the same tokens. Contrast is verified on dark first.
3. **One orange.** `#E07800` is the *only* interactive brand hue — buttons, links, focus rings, active states, the trailing dot. Everywhere else uses semantic tokens. Non-interactive surfaces do not get orange.
4. **Motion with intent.** Every animation serves one of three jobs: wayfinding, feedback, or emphasis. No decorative motion. No entrance reveals (no fade-up on load, no scale-in on scroll-into-view). Content renders at final state.
5. **No fluff.** No marketing adjectives (*seamless, modern, robust, elegant, beautiful, powerful, intuitive, innovative*). No hero decorations without meaning. Craft is visible through restraint.

---

## Tokens — paste-ready

### Colors (dark theme default)

```
# Static brand (never theme-switch)
--primary:         #E07800     # the only interactive brand hue
--accent:          #FFB627     # selection highlights, rare accent
--primary-hover:   #C96A00
--accent-hover:    #E5A220
--primary-rgb:     224 120 0   # for rgb(var(--primary-rgb) / 0.3)-style alpha

# Dark-theme semantic
--background:           #141414   # page surface
--foreground:           #F5F5F0   # main text
--card:                 #1a1a1a
--muted:                #1E1E1E
--popover:              #2A2A2A
--terminal:             #0a0a0a   # code / SQL panels
--manifesto:            #0f0d0a   # manifesto deep surface
--secondary-foreground: #999999   # supporting text
--muted-foreground:     #666666   # de-emphasized text
--dim-foreground:       #4a4a4a   # non-text de-emphasis only (dividers, icons)
--light-foreground:     #cccccc   # light text variant
--border:               #3A3A3A
--border-subtle:        #2a2a2a
--border-strong:        #333333
--success:              #28c840
--destructive:          #ff5f57

# Light-theme semantic (if generating a light variant)
--background:           #FAFAF8
--foreground:           #111111
--muted:                #F0EDE5
--card:                 #FFFFFF
--popover:              #FFFFFF
--terminal:             #F5F5F0
--secondary-foreground: #555555
--muted-foreground:     #888888
--dim-foreground:       #AAAAAA
--border:               #D8D4CA
--border-subtle:        #D8D4CA
--border-strong:        #C0BDB5
--success:              #16a34a
--destructive:          #ff5f57
```

Rules when generating a color choice:
- **Never use a raw hex** in a design hand-off. Name the semantic role (`--muted-foreground`) or the brand token (`--primary`).
- **Orange only on interactive surfaces.** If you want orange on a non-button, you want the wrong color — pick a semantic token.
- **Contrast**: text/bg pairs clear WCAG AA on dark first. `--foreground` on `--background` = ~13.9:1 (AAA). `--primary` on `--background` = ~5.3:1 (AA body, AAA large). `--muted-foreground` on `--background` = ~3.7:1 (AA large only — don't use for paragraphs).

### Typography

**Families:**
- Headings, body, UI: **Inter Variable** (self-hosted via `@fontsource-variable/inter`)
- Code, terminals, mono labels, metrics: **JetBrains Mono Variable** (self-hosted)

**Scale** (Tailwind v4 `@theme` tokens; generates `text-*` utilities):

```
text-hero         clamp(64px, min(9vw, 11svh), 130px)   # HeroBanner wordmark only
text-hero-mobile  clamp(48px, min(13vw, 8svh), 64px)    # Hero headline narrow screens
text-display      clamp(40px, 5vw, 64px)                 # Page titles, hero headlines
text-title        clamp(28px, 4vw, 40px)                 # Section headings (H2)
text-heading      clamp(20px, 3vw, 24px)                 # Card titles, H3
text-subheading   18px                                    # Subtitles, H4
text-body-lg      18px                                    # Lead paragraphs
text-body         16px                                    # Paragraphs (floor)
text-small        14px                                    # Metadata, labels
text-mono         13px                                    # Terminal, code, SQL (mono floor)
text-caption      12px                                    # Timestamps, footnotes, tags (label floor)
text-micro        10px                                    # Chrome annotations, stop labels
```

Hard rules:
- Body ≥ 16px. Mono ≥ 13px. Labels ≥ 12px. Micro only for chrome annotations (never primary content).
- No arbitrary sizes (`text-[11px]`, `style="font-size: 14px"`).
- Pairings: display + body-lg (hero), title + body (section), heading + body (card), mono uppercase + caption (terminal block).

### Spacing

Three semantic tokens. Everything else uses Tailwind's standard scale. No arbitrary `p-[22px]`.

```
--space-page-x     clamp(1.5rem, 4vw, 5rem)      # horizontal page gutters
--space-section-y  clamp(3rem, 8vw, 6rem)         # vertical padding between sections
--space-card-gap   clamp(1rem, 2vw, 1.5rem)       # gap between cards in grids
```

### Other

- **Border radius:** `--radius-sm: 4px`, `--radius-md: 8px` (default), `--radius-lg: 12px`, `--radius-xl: 16px`, `--radius-pill: 9999px`.
- **Z-index scale:** `--z-base: 0`, `--z-content: 1`, `--z-rail: 30`, `--z-sheet: 50`, `--z-menu: 60`, `--z-nav: 70`.
- **Motion:** `--duration-fast: 150ms`, `--duration-normal: 200ms`, `--duration-slow: 300ms`. `--ease-default: cubic-bezier(0.4, 0, 0.2, 1)`.

---

## Layout — 4 CSS Grid Recipes

Every section picks one. No shell wrappers.

1. **Full-Bleed:** `width: 100%`. Heroes, visual bands, bento grids, any section that bleeds to viewport edges.
2. **Contained:** `max-width: var(--container-content) /*1024px*/; margin-inline: auto; padding-inline: var(--space-page-x)`. Text sections, forms.
3. **Content + Sidebars:** CSS Grid with `grid-template-columns: auto 1fr auto` at `lg:` and up. Content flanked by sidebars (TOC, filters, rotated labels). Collapses to single column below `lg:`.
4. **Edge Title Grid:** rotated edge title (writing-mode: vertical-rl + rotate 180deg) + 1px divider + content. Used on listing pages and contact.

`<main>` has no horizontal constraints — just vertical flex. Each section owns its grid.

**Breakpoints (Tailwind v4 defaults):** `sm: 640`, `md: 768`, `lg: 1024`, `xl: 1280`, `2xl: 1536`. No overrides.

**Viewport units:** `dvh` for full-height sections, `svh` for stable measurements, `lvh` for backgrounds. **Never `vh`** on mobile.

---

## Motion — 9 signatures (closed vocabulary)

New designs either pick from these nine or propose a new signature. Content renders at final state on load — motion fires only on interaction, scroll-scrub, or idle ambient.

| # | Name | Lane | Trigger |
|---|---|---|---|
| 1 | Boop | Interaction | hover / click / focus (tap-shaped impulse resets in ~300ms) |
| 2 | Cursor glow + magnetic | Interaction | hover + pointer move (radial glow + ±3px translation) |
| 3 | Wordmark hover | Interaction | hover (SplitText-driven effect on "yesid." + orange dot pulse) |
| 4 | SVG morph hover | Interaction | hover (desktop) / tap toggle (mobile) |
| 5 | MetroNetwork hero scrub | Scroll-scrub | scroll, pinned (the site's only pin) |
| 6 | DrawSVG scrub | Scroll-scrub | scroll through section (strokes draw 0% → 100%) |
| 7 | Crescendo scrub | Scroll-scrub | scroll through section (scale + opacity) |
| 8 | LED pulse | Idle ambient | always on (IO-gated, 2s cycle, orange box-shadow) |
| 9 | Typewriter idle | Idle ambient | on-load one-shot (hero scroll prompt, 80ms/char) |

**Permitted entrance exception:** HomeCloser graffiti at the narrative terminus — a DrawSVG timeline on enter. Nothing else gets an entrance reveal.

**Forbidden:** `use:reveal`, `use:ripple`, `use:tilt` (deleted). Fade-up on load. Scale-in on enter. Stagger reveals. Svelte `transition:` / `animate:` directives.

**Reduced motion:** every motion primitive checks `prefers-reduced-motion: reduce` and opts out cleanly (final state rendered, no listeners).

---

## Voice

**Tone:** Declarative, short, zero adjectives where possible. Engineer-meets-designer. The register is an RFC or a transit safety notice — not a pitch deck.

**Vocabulary — preferred / avoid:**

| Preferred | Avoid |
|---|---|
| digital infrastructure | data engineering / data solutions |
| projects | work / portfolio pieces |
| services | offerings / solutions / packages |
| pipeline | workflow / process |
| shipped | delivered / rolled out / launched |
| built | crafted / curated / engineered |
| migration | cutover / modernisation |
| reduce / remove | simplify / streamline |
| 3x faster | significantly faster |
| yesid. | Yesid / YESID / Yesid. |

**Before / after (marketing → yesid):**
- "Seamless integration across your data stack." → "Connects your warehouse, CRM, and BI tool."
- "Empowering teams with modern infrastructure." → "Migrations that ship on Friday."
- "A beautiful, thoughtfully crafted design system." → "Design system for yesid.dev."
- "Unlock the full potential of your data." → "Queries that run in seconds, not minutes."

**UX copy patterns:**
- Buttons are actions, not nouns: "Deep dive →" not "Learn more". "Send" not "Submit".
- Empty states name what's missing + what to do, not apologies.
- Error states name the cause + offer the next step.
- Metrics: number first, label second, on one line. `3x faster   AVG QUERY IMPROVEMENT` — never "achieved approximately 3 times query improvement".
- Section labels: mono uppercase with structural prefix. `// 03   PROJECTS`, `SERVICE 01 / 06`, `STOP 00 — IDENTITY`.

**Do:**
- Name the thing. Show the number when a number matters.
- Keep "yesid." lowercase. The trailing dot is always `--primary` orange.
- Cross-link to authoritative rules rather than repeating them.

**Don't:**
- Use marketing adjectives (see vocabulary table).
- Apologize in empty / error states.
- Add motion to compensate for weak content.
- Invent new brand hues.
- Add a decoration that carries no information.

---

## Component signals

**Cards:** one universal surface. Background `color-mix(in srgb, var(--background) 80%, transparent)` + `backdrop-blur(6px)`, 1px orange-tinted border at 15% opacity, `--radius-lg` (12px). Hover: border goes to 60% orange + `--shadow-section`. One card atom, all card-like surfaces.

**Buttons:** shadcn-svelte `Button` with brand tokens. Variants: `primary` (orange), `ghost`, `outline`. Focus ring: `outline: 2px solid var(--primary); outline-offset: 2px`. Touch target ≥ 44x44px below `xl:`.

**Terminal chrome (`TerminalChrome`):** three-dot macOS-style header + title + tag + status indicator + footer. Used for code panels, contact form, hero SQL demo. Tokenized — no inline hex.

**Section headings (`SectionHeading`):** heading + optional orange dot + optional mono-uppercase label (the `// 03` pattern). Tier-2 brand primitive.

**Status indicators (`StatusDot`):** colored round dot with optional `pulse` (global `pulse-glow` keyframe) and optional `ring` (CSS `outline` halo). Used for availability, live data, status badges.

**Metric displays (`MetricDisplay`):** big number (text-title/heading/display sized by `size` prop) + mono uppercase label in `text-caption`. Inline, baseline-aligned, `gap: 0.75rem`.

**Metro station badges (`MetroStation`):** station pill + optional `station-ping` scale-out animation. Transit metaphor carries the brand — don't reskin these as generic badges.

---

## Visual references in this repo

If you have repo access, these are the files that define ground truth:

- **Governance:** `docs/project/CONSTITUTION.md` (layout, type, motion, a11y rules, CSS Grid Recipes)
- **Token inventory:** `docs/project/CSS.md` + `src/lib/styles/tokens.css` + `src/app.css @theme`
- **Motion implementation:** `docs/project/MOTION.md`
- **Brand narrative:** `brand/BRAND.md`, `brand/foundations/*.md`
- **Decisions:** `brand/decisions/*.md`
- **Paired examples:** `brand/examples/` (screenshot + source pairs)
- **Logos:** `brand/logos/` (SVGs) + `brand/logos/exports/` (PNG 1x/2x/3x)

If generating a design: stay inside the token system, pick one of the 4 CSS Grid Recipes, let text center / visuals bleed, keep the dot always orange, and don't give me an entrance reveal.
