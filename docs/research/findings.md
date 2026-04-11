# Design Findings — Inspiration Site Analysis

> **Purpose:** Comprehensive multi-breakpoint scan of 7 Awwwards-quality sites to inform the yesid.dev home page redesign (hero + manifesto merge, full page cohesion). Extracted via Playwright MCP + Chrome DevTools MCP with JS evaluation.
>
> **Date:** 2026-04-09
> **Sites scanned:** digitalflagship.com, byfrontyard.com, shader.se, raviklaassens.com, tattooprojects.com, daveholloway.uk, jasminegunarto.com
> **Breakpoints tested:** 375px (mobile), 768px (tablet), 1440px (desktop), 1920-2048px (wide)
> **Context:** Slice 13b manifesto code is built. Design pivot: merge hero + manifesto into one denser section. These findings inform that design.

---

## Table of Contents

1. [Site-by-Site Analysis](#1-site-by-site-analysis)
2. [Cross-Site Patterns](#2-cross-site-patterns)
3. [Typography DNA](#3-typography-dna)
4. [Page Rhythm & Color Architecture](#4-page-rhythm--color-architecture)
5. [Background Texture Catalog](#5-background-texture-catalog)
6. [Animation & Interaction Catalog](#6-animation--interaction-catalog)
7. [Responsive Strategy Comparison](#7-responsive-strategy-comparison)
8. [Implementation Proposals for yesid.dev](#8-implementation-proposals-for-yesiddev)

---

## 1. Site-by-Site Analysis

### 1.1 digitalflagship.com

**Type:** Ecommerce design agency
**Built with:** WordPress + Elementor
**Theme:** Dark (`rgb(6, 6, 22)`) with one dramatic lime green break

#### Identity & Fonts
- **Display font:** `rama-gothic-m` (condensed gothic) — weight 900
- **Body font:** `Saans` — weight 400-500
- **Secondary:** `helvetica-neue-lt-pro`
- **All headings:** uppercase, line-height 0.8 (80% of font-size = tight stacking)

#### Full Page Map (9 viewports at 2048px)

| VP | Section | Background | Max Font | Content |
|----|---------|-----------|----------|---------|
| 0 | Nav | `rgb(6,6,22)` | 16px | Logo + "Work With Us" CTA |
| 0 | Hero | `rgb(6,6,22)` + **SVG hypno grid** (`gridhypno-dark-1.svg`, `background-size: 100%`) | **512px** | "BUILT FOR" |
| 0-1 | Hero cont. | Same dark + grid | 512px | "GROWTH" + bg image slideshows with gradient overlays (`linear-gradient(90deg, rgb(59,59,72), rgba(59,59,72,0.23))`) |
| 1-2 | Tagline + Work | Dark + SVG grid continues | 113-138px (tagline), 16px (cards) | "We launch engaging ecommerce flagship experiences" + interactive banner cards with hover |
| 3-4 | **LIME BREAK** | **`rgb(193, 253, 58)`** | **180px** | "Helping you Rise above the current" — rama-gothic-m 900 |
| 5 | Video Grid | Transparent over dark | — | 36 `<video>` elements in grid |
| 6 | Clients | `rgb(6,6,22)` | 180px | "Scaling the next wave of consumer brands" + 24 images |
| 7 | CTA | `rgb(6,6,22)` | 180px | "Elevate your digital flagship" |
| 8 | Footer | `rgb(6,6,22)` | 48px | "Planning a Project?" + logo + links |

#### Responsive Behavior

| Breakpoint | Hero Font | "GROWTH" | Lime Break Font | Page Height | Viewports |
|------------|----------|----------|----------------|------------|-----------|
| **375px** | **218px** | 161px | 60px | 6,210px | 8 |
| **768px** | **445px** | 192px | 108px | 7,224px | 8 |
| **1440px** | **360px** | 360px | 180px | 7,460px | 9 |
| **2048px** | **512px** | 512px | 180px | 8,244px | 9 |

**Key responsive observations:**
- Hero font scales from 218px → 512px (2.3x ratio mobile to wide)
- At mobile, "BUILT" and "For" are on separate rows; at desktop they're "BUILT FOR" on one line
- Lime break section font drops from 180px (desktop) to 60px (mobile) — 3x reduction
- SVG grid pattern hidden on mobile (`elementor-hidden-tablet` class)
- Work cards switch from multi-column to stacked
- Several elements have `elementor-hidden-mobile` / `elementor-hidden-desktop` toggle classes
- Grid layout at mobile: `2 × 159px` columns; at desktop: `5 × 1fr`

#### Overlays & Effects
- SVG background: `gridhypno-dark-1.svg` at `background-size: 100%` — creates subtle perspective grid
- Gradient overlays on image slideshows: `linear-gradient(90deg, rgb(59,59,72), rgba(59,59,72,0.23))`
- Interactive banners with `qodef-qi-interactive-banner` class (from-bottom reveal)
- Video grid at viewport 5 with 36 videos
- Swiper lazy-loaded background slideshows

#### Color Palette
```
rgb(6, 6, 22)      — primary dark (body bg)
rgb(193, 253, 58)   — lime green (break section)
rgb(255, 255, 255)  — white (text)
rgb(59, 59, 72)     — dark gray (gradient overlays)
rgb(130, 130, 138)  — medium gray (muted text)
rgb(232, 92, 65)    — red accent
rgb(187, 238, 73)   — secondary green
rgb(82, 146, 20)    — dark green
```

---

### 1.2 byfrontyard.com

**Type:** GTM & product marketing design agency
**Built with:** Framer
**Theme:** Light body (`rgb(245,245,245)`) with gradient hero and massive black argumentative section

#### Identity & Fonts
- **Display font:** `Instrument Sans Bold` — weight 700
- **Body font:** `Instrument Sans` — weight 400-500
- **Code/mono font:** `Fragment Mono` — weight 400
- **Negative letter-spacing on everything:** -2% on headings (e.g., `-4.04px` at 202px, `-13.28px` at 664px)

#### Full Page Map (19 viewports at 2048px — very long)

| VP | Section | Background | Max Font | Content |
|----|---------|-----------|----------|---------|
| 0 | Hero | **Gradient wash:** `linear-gradient(rgb(221,181,128) 58%, rgb(224,49,49) 85%, rgb(232,56,143) 100%)` | — | Full-viewport gradient, "Scroll" prompt |
| 1 | Headline | On gradient | **664px** ("be"), 202px ("Don't"), 218px ("boring.") | "Don't be boring." — VARIABLE SIZE per word |
| 1-2 | Who/Work | `rgb(245,245,245)` | 60px | "Who are we?" + work cards with images |
| 2 | Showcase | Light bg | 12px (labels) | Work case studies with `Fragment Mono` labels |
| 3-8 | **BLACK ARGUMENT** | **`rgb(0,0,0)`** (5 full viewports!) | **112px** | "Why can't I be boring?" → "Boring is expensive." + supporting arguments with images |
| 8+ | More content | Black continues | 40px | More argumentative content blocks |

#### Responsive Behavior (mobile 375px)

| Breakpoint | Hero Headline | Black Section Font | Page Height | Viewports |
|------------|--------------|-------------------|------------|-----------|
| **375px** | 112px ("Why") — **single column** | 40px ("Boring", "Websites") | 18,663px | **23** |
| **2048px** | 664px ("be") — **variable sizing** | 112px ("Why can't I be boring?") | 17,106px | 19 |

**Key responsive observations:**
- At mobile: hero headline drops to 112px but STAYS LARGE (30% of viewport width)
- The "Don't be boring." variable-size treatment collapses to single-column stacked words
- Black argumentative section becomes even longer on mobile (more viewports due to text wrapping)
- 2 `<canvas>` elements present (likely for cursor/interaction effects)
- 34 SVGs throughout
- No videos — relies on images (111 total) and canvas animation

#### Color Palette
```
rgb(245, 245, 245)   — light body bg
rgb(255, 255, 255)   — white (cards, content areas)
rgb(0, 0, 0)         — black (argumentative section, text)
rgb(221, 181, 128)   — gold (gradient start)
rgb(224, 49, 49)     — red (gradient mid)
rgb(232, 56, 143)    — pink (gradient end)
```

---

### 1.3 shader.se

**Type:** Development studio
**Built with:** Custom (WebGL-heavy)
**Theme:** Pure black, canvas-only

#### Key Data
- Body bg: `rgb(0, 0, 0)`
- Font: `STIX Two Text`
- **1 `<canvas>` element renders ALL content** — no DOM text above 20px
- No sections, divs, overlays, or traditional DOM structure
- This is a pure WebGL experience — not applicable to our CSS-based approach
- **Takeaway:** Shader.se shows that pure immersion is possible, but at the cost of accessibility, SEO, and content management

---

### 1.4 raviklaassens.com

**Type:** Freelance designer/developer portfolio
**Built with:** Webflow
**Theme:** Dark hero → light manifesto toggle

#### Identity & Fonts
- **Display/body font:** `ReplicaLL, Arial, sans-serif` — weight 500
- Font size: 43px for headings (modest compared to other sites)
- **Theme switching classes:** `theme-dark` and `theme-base`

#### Full Page Map (2048px)

| VP | Section | Background | Max Font | Content |
|----|---------|-----------|----------|---------|
| 0 | Preloader + Hero | `rgb(0,0,0)` (dark) | 43px | "Ravi Klaassens. Design & Code for those who refuse to settle." |
| 1 | **Manifesto** | **`rgb(224, 222, 221)`** (light!) | 43px | "Design shapes the world not as decoration, but as a force that..." |
| 2+ | Work | `rgb(0,0,0)` | 43px | Project showcases |

#### Special Elements
- `preloader__item-mask` (R, logo, K) — letter mask reveals during preloader
- `util__item-mask menu-item` — menu items with mask animations (7 items)
- Theme toggle between `theme-dark` and `theme-base` creates the hero→manifesto contrast
- 22 images, 0 videos, 0 canvas

#### Key Pattern
**Immediate dark→light transition** — hero is black, manifesto section directly below is light cream. No gradient, no animation between them — just a hard cut. Clean and confident.

---

### 1.5 tattooprojects.com (note: digital.tattooprojects.com DNS failed)

**Type:** Marketing agency
**Built with:** Craft CMS + custom frontend
**Theme:** Dark with white capabilities break

#### Identity & Fonts
- **Display font:** `Proxima Nova Extra Bold` — weight 700
- **Body font:** `Proxima Nova Regular`
- Letter-spacing: `+2px` on headings (unusual — positive tracking)

#### Full Page Map (9 viewports at 2048px)

| VP | Section | Background | Max Font | Content |
|----|---------|-----------|----------|---------|
| 0 | Hero | Dark (transparent over dark body) | 85px | "Let's Bend Some Rules" |
| 1 | Featured Work | `rgb(40,40,40)` (slightly lighter dark) | 36px | Project cards with bg images |
| 2-3 | **WHITE BREAK** | **`rgb(255,255,255)`** | **75px** | "Our Capabilities" — capability grid (Creative, Strategy, Digital, Production) |
| 5 | Quotes | Dark | — | `quotewall-grid` with testimonials |
| 7+ | Contact/Footer | Dark | — | CTA + footer |

#### Overlays & Effects
- `video-overlay video-overlay-content` — video overlay at hero (height 600px)
- `capwall-grid` — capability wall grid at VP2 (1157px height)
- `quotewall-grid` — quote wall grid at VP5 (890px height)
- `loader-content` + `loader-spinner color-mint` — preloader with mint spinner

#### Color Palette
```
rgb(14, 18, 18)     — body dark (near-black with slight warmth)
rgb(40, 40, 40)     — card dark
rgb(255, 255, 255)  — white (capabilities break)
```

---

### 1.6 daveholloway.uk

**Type:** Full-stack freelance designer/developer portfolio
**Built with:** Custom (heavy canvas/WebGL)
**Theme:** Bold electric blue identity throughout

#### Identity & Fonts
- **Hero font:** `Gasoek One` — weight 400 (decorative display)
- **Section/nav font:** `Alumni Sans` — weight 700, uppercase
- **Body font:** `Neulis Sans`

#### Full Page Map (9 viewports at 2048px)

| VP | Section | Background | Max Font | Content |
|----|---------|-----------|----------|---------|
| 0 | Loading | `rgb(255,255,255)` → `rgb(0,0,0)` | — | Loading sequence animation |
| 0 | Hero | **`rgb(43, 71, 255)`** (electric blue) | **197px** | "Hey!" in Gasoek One + canvas animation (600px) |
| 1 | Work | **`rgb(43, 71, 255)`** (SAME blue!) | **197px** | "Work" + portfolio carousel with canvas + glow-text effects |
| 2+ | Services | `linear-gradient(to top, rgb(51,24,150), rgb(43,71,255))` (purple→blue) | — | Service cards with scanline patterns |
| 4+ | More content | Purple/blue gradients | — | Additional portfolio, contact |

#### Responsive Behavior (mobile 375px)

| Breakpoint | Hero Font | "Work" Font | Page Height | Viewports |
|------------|----------|------------|------------|-----------|
| **375px** | **122px** | **180px** | 4,646px | 6 |
| **2048px** | **197px** | **197px** | 8,353px | 9 |

**Key mobile observations:**
- Hero "Hey!" drops from 197px to 122px (62% of desktop)
- "Work" title actually STAYS at 180px on mobile (near viewport-width)
- Hero animation canvas shrinks from 600px to 400px height
- Portfolio cards: `rgba(219, 122, 126, 0.85)` colored cards (individual card colors)
- Site header: compact 60px on mobile, blue bg

#### Special Elements (34 canvases, 25 SVGs!)
- **3D CSS faces:** `face--front`, `face--back`, `face--left`, `face--right` with scanline gradient patterns: `repeating-linear-gradient(rgb(43,71,255) 0px, rgb(43,71,255) 6px, rgb(37,0,112) 6px, rgb(37,0,112)...)`
- **Glow text:** `glow-text` class on section titles and card names
- **Gold overlay:** `portfolio-card-image-gold-overlay`
- **Net pattern:** `url("https://daveholloway.uk/net-pattern.png")` bg image
- **Canvas per card:** 24-27 canvas elements in portfolio carousel alone
- Individual character divs for letter-by-letter animation ("W", "o", "r", "k" each in own div)

#### Color Palette
```
rgb(0, 0, 0)         — black (overscroll, loading)
rgb(43, 71, 255)     — electric blue (hero, work, identity color)
rgb(51, 24, 150)     — deep purple (service section gradient)
rgb(37, 0, 112)      — dark purple (scanline pattern)
rgb(255, 255, 255)   — white (loading, text)
rgba(219,122,126,0.85) — muted pink (card colors)
```

#### Key Pattern
**Single-color identity** — the electric blue `rgb(43,71,255)` carries from hero through work section. No dramatic color break — instead, consistency IS the design. Only subtle purple gradient shift for services. Most cohesive single-color approach of all sites scanned.

---

### 1.7 jasminegunarto.com

**Type:** Creative/art director portfolio
**Built with:** WordPress + custom theme
**Theme:** Warm cream with dark breaks, pinned hero

#### Identity & Fonts
- **Display font:** `mg` (custom) — weight 800
- **Body/UI font:** `Manrope` — weight 800
- **Number counter font:** `mg` at 404px
- **Letter-spacing:** `+1%` (positive, slightly spaced)

#### Full Page Map (2048px — 14+ viewports, Lenis smooth scroll)

| VP | Section | Background | Max Font | Content |
|----|---------|-----------|----------|---------|
| 0 | Preloader | `rgb(9,9,9)` | — | Preloader number counter animation |
| 0 | Hero (PINNED 4 VPs!) | `rgb(235,234,228)` (cream) | **404px** | Name "Jasmine Gunarto" — double-rendered (duplicate text for animation) |
| 0 | Video + Media | `rgb(0,0,0)` | — | Full-bleed image/video media element |
| 0 | Overlay | `rgba(0,0,0,0.6)` | — | Body overlay for preloader/transition |
| 5 | **DARK BREAK** | **`rgb(52, 28, 9)`** (warm dark brown) | — | Intro section with `t-line-mask` reveals |
| 6 | Featured Works | `rgb(235,234,228)` (cream returns) | 33px | "See All Work" + project cards |
| 8+ | Numbered Projects | `rgb(9,9,9)` (near-black) | 56px | "01 Avant-Garde", "02 Pea", "03 Graff Mayhem" etc. |
| 10 | Marquee | `rgb(52,28,9)` | — | Horizontal scrolling marquee text (`t-marquee`) |
| 11+ | Hover Reveals | Cream | — | `hover-reveal__img` elements (image appears on text hover) |

#### Responsive Behavior (mobile 375px)

| Breakpoint | Hero Name Font | Project Numbers | Page Height | Viewports |
|------------|---------------|----------------|------------|-----------|
| **375px** | **122px** | **56px** | Preloader blocks (812px visible) | 1 initially, ~12 after load |
| **2048px** | **404px** | **404px** | 13,549px+ (main content) | 14+ |

**Key mobile observations:**
- Name text drops from 404px to 122px (30% of desktop — still large)
- Project numbers drop from 404px to 56px (dramatic reduction)
- Pin-spacer still present but shorter
- Cream bg `rgb(235,234,228)` consistent across breakpoints

#### Special Elements
- **Pin spacer:** 3,699px tall (hero stays pinned for ~4 viewports of scrolling)
- **Line masks:** `t-line-mask` elements for text line-by-line reveal animation (height 226px each)
- **Hover reveals:** `hover-reveal` → `hover-reveal__inner` → `hover-reveal__img` (image background appears contextually)
- **Marquee:** `t-marquee` horizontal scrolling text (337px height)
- **Preloader:** Full-screen `preloader` with number counter + `preloader-overlay`
- **Body overlay:** `overlay--body` at `rgba(0,0,0,0.6)` — dims everything during transitions
- 3 videos, 4 images, 2 SVGs — relatively media-light compared to others
- Uses **Lenis** smooth scroll (`main-content-wrapper lenis` class)

#### Color Palette
```
rgb(235, 234, 228)   — cream (primary bg)
rgb(238, 233, 209)   — warm cream (text — almost same as bg = ghosted/watermark effect)
rgb(9, 9, 9)         — near-black (preloader, project section)
rgb(52, 28, 9)       — warm dark brown (break section, marquee)
rgb(46, 46, 46)      — dark gray (popup slider)
rgb(0, 0, 0)         — black (media containers, overlays)
```

---

## 2. Cross-Site Patterns

### 2.1 The "Break" Rule
**Every site has exactly ONE dramatic background color shift.** This divides the page into acts:

| Site | Hero bg | Break bg | Break position | Rest bg |
|------|---------|----------|---------------|---------|
| digitalflagship | `#060616` (dark) | **`#c1fd3a` (lime)** | VP 3-4 (after work) | `#060616` |
| byfrontyard | Gradient (gold→red→pink) | **`#000` (black)** | VP 3-8 (5 VPs!) | `#f5f5f5` |
| tattooprojects | `#0e1212` (dark) | **`#fff` (white)** | VP 2-3 (capabilities) | `#0e1212` |
| daveholloway | `#2b47ff` (blue) | None (gradual purple shift) | N/A | Blue→purple |
| jasminegunarto | `#ebeae4` (cream) | **`#341c09` (dark brown)** | VP 5 + VP 10 | `#ebeae4` |
| raviklaassens | `#000` (dark) | **`#e0dedd` (light)** | VP 1 (manifesto) | `#000` |

### 2.2 Text-as-Architecture Pattern
Text fills 80%+ of viewport width in ALL sites. The text IS the visual — it's not placed within a layout, it IS the layout.

- **digitalflagship:** "BUILT FOR GROWTH" at 512px = text bleeds edge to edge
- **byfrontyard:** "be" at 664px = single word fills viewport
- **daveholloway:** "Hey!" at 197px = fills blue hero box
- **jasminegunarto:** Name at 404px = ghosted watermark effect

### 2.3 Variable Size Rhythm
Most sites use deliberate size contrast between words in the same statement:

- **byfrontyard:** "Don't" (202px) → "be" (664px) → "boring." (218px) — the key word is 3x larger
- **digitalflagship:** "BUILT FOR" (512px) vs subtitle (113px) — 4.5x ratio
- **jasminegunarto:** Name (404px) vs "See All Work" (33px) — 12x ratio

### 2.4 Never Flat Dark
Zero sites use a plain dark background without layering:

| Site | Texture/Overlay Method |
|------|----------------------|
| digitalflagship | SVG hypno grid pattern (`gridhypno-dark-1.svg` at 100% size) |
| byfrontyard | Multi-stop gradient wash (gold→red→pink) |
| daveholloway | Scanline patterns (`repeating-linear-gradient`), 3D CSS faces, net pattern PNG |
| tattooprojects | Video overlay, capability grid pattern |
| jasminegunarto | Overlays at varying opacities, line masks |
| raviklaassens | Preloader masks, theme switching |

---

## 3. Typography DNA

### 3.1 Font Size Scale Across Breakpoints

| Site | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Wide (2048px) |
|------|---------------|----------------|-----------------|---------------|
| digitalflagship | 218px | 445px | 360px | 512px |
| byfrontyard | 112px | — | — | 664px |
| daveholloway | 122px | — | — | 197px |
| jasminegunarto | 122px | — | — | 404px |
| tattooprojects | — | — | — | 225px |
| raviklaassens | — | — | — | 43px |

### 3.2 Font Scale Ratios (hero max font / viewport width)

| Site | Mobile ratio | Desktop ratio |
|------|-------------|---------------|
| digitalflagship | 218/375 = **58%** | 512/2048 = **25%** |
| byfrontyard | 112/375 = **30%** | 664/2048 = **32%** |
| daveholloway | 122/375 = **33%** | 197/2048 = **10%** |
| jasminegunarto | 122/375 = **33%** | 404/2048 = **20%** |

**Key insight:** Mobile fonts are 30-60% of viewport width. Desktop fonts are 10-32% of viewport width. Mobile is proportionally MORE text-dominant.

### 3.3 Typography Properties Across Sites

| Property | digitalflagship | byfrontyard | daveholloway | jasminegunarto | tattooprojects |
|----------|----------------|-------------|--------------|----------------|----------------|
| Font family | rama-gothic-m (condensed) | Instrument Sans | Gasoek One + Alumni Sans | mg (custom) | Proxima Nova Extra Bold |
| Weight | 900 | 700 | 400/700 | 800 | 700 |
| Text-transform | UPPERCASE | none (mixed case) | UPPERCASE (nav) | none | none |
| Letter-spacing | normal | **-2%** (negative) | normal | **+1%** (positive) | **+2px** (positive) |
| Line-height | **0.8** (80%) | varies | varies | varies | varies |
| Style | Condensed gothic | Clean sans-serif | Decorative display | Custom art-direction | Clean bold sans |

### 3.4 Font Stack Patterns

**Display vs Body font split:**
- digitalflagship: `rama-gothic-m` (display) / `Saans` (body)
- daveholloway: `Gasoek One` (hero) / `Alumni Sans` (sections) / `Neulis Sans` (body)
- jasminegunarto: `mg` (display) / `Manrope` (UI)
- tattooprojects: `Proxima Nova Extra Bold` (headings) / `Proxima Nova Regular` (body)
- byfrontyard: `Instrument Sans Bold` (all headings) / `Fragment Mono` (labels)

**yesid.dev equivalent:** `Inter` (headings/body) + `JetBrains Mono` (code/labels) — similar pattern to byfrontyard's sans + mono split

---

## 4. Page Rhythm & Color Architecture

### 4.1 Visual Page Rhythm Notation

```
digitalflagship:  [DARK+grid ████████] [DARK work ███] [LIME ▓▓▓] [DARK videos ███] [DARK clients ████] [DARK cta █]
byfrontyard:      [GRADIENT ▒▒] [LIGHT ██] [BLACK █████████████████] [LIGHT █]
tattooprojects:   [DARK ███] [DARK work ██] [WHITE ▓▓▓] [DARK quotes ██] [DARK ██]
daveholloway:     [BLUE ████] [BLUE work ████] [PURPLE→BLUE ████] [BLACK █]
jasminegunarto:   [CREAM ████████████] [BROWN ▓▓] [CREAM ████] [BLACK ████] [BROWN ▓] [CREAM ████]
raviklaassens:    [BLACK ██] [LIGHT ▓▓] [BLACK ██████████]
```

### 4.2 Act Structure

All sites follow a 3-act structure:

| Act | Purpose | Typical length | Visual treatment |
|-----|---------|---------------|-----------------|
| **Act 1:** Identity | Hero + manifesto/statement | 1-4 viewports | Largest text, most distinctive bg treatment |
| **Act 2:** Proof | Work/portfolio/capabilities | 3-8 viewports | Consistent bg, cards/images, moderate text |
| **Break:** | Color/texture shift | 1-5 viewports | Completely different bg color |
| **Act 3:** Close | CTA + footer | 1-2 viewports | Back to primary bg |

### 4.3 Break Section Analysis

The "break" serves a specific purpose in each site:

| Site | Break purpose | Break content | Why it works |
|------|--------------|---------------|-------------|
| digitalflagship | **Energy shift** | Aspirational statement | Lime green = energy, growth (matches "growth" message) |
| byfrontyard | **Argumentative pivot** | "Why can't I be boring?" + data | Black creates seriousness, authority |
| tattooprojects | **Capability showcase** | Services grid | White = clean, professional, trustworthy |
| jasminegunarto | **Transition moment** | Intro text with mask reveals | Dark brown = warmth, earth, craft |
| raviklaassens | **Manifesto** | Design philosophy | Light = openness, clarity |

---

## 5. Background Texture Catalog

### 5.1 SVG/Image Patterns

| Site | Asset | Type | Usage | Effect |
|------|-------|------|-------|--------|
| digitalflagship | `gridhypno-dark-1.svg` | SVG grid | `background-size: 100%` on hero sections | Subtle perspective grid, depth |
| daveholloway | `net-pattern.png` | PNG pattern | bg-image on goal section | Football net texture |
| daveholloway | Scanline gradient | CSS repeating-linear-gradient | On 3D face elements | CRT/retro scanline effect |

### 5.2 CSS-Only Textures

| Site | CSS | Where | Effect |
|------|-----|-------|--------|
| digitalflagship | `linear-gradient(90deg, rgb(59,59,72), rgba(59,59,72,0.23))` | Image slideshow overlays | Darkening gradient over photos |
| daveholloway | `repeating-linear-gradient(rgb(43,71,255) 0px, rgb(43,71,255) 6px, rgb(37,0,112) 6px, ...)` | 3D CSS faces | Blue/purple scanlines |
| daveholloway | `linear-gradient(rgb(0,0,0) 50%, rgba(0,0,0,0)) + repeating-linear-gradient(...)` | Face elements | Fade-to-black over scanlines |
| byfrontyard | `linear-gradient(rgb(221,181,128) 58%, rgb(224,49,49) 85%, rgb(232,56,143) 100%)` | Hero viewport | Full-viewport gradient wash |

### 5.3 Dynamic/Canvas Textures

| Site | Method | Count | Purpose |
|------|--------|-------|---------|
| daveholloway | `<canvas>` | **34** | WebGL effects on portfolio cards, hero animation |
| byfrontyard | `<canvas>` | 2 | Cursor effects/interaction |
| shader.se | `<canvas>` | 1 | Entire page rendered in WebGL |

---

## 6. Animation & Interaction Catalog

### 6.1 Text Animation Techniques

| Technique | Sites | Implementation |
|-----------|-------|---------------|
| **Character-split** | daveholloway, jasminegunarto | Each letter in own `<div>` for individual animation |
| **Line mask reveal** | jasminegunarto, raviklaassens | `t-line-mask` / `util__item-mask` wraps text lines, overflow hidden + translate |
| **Preloader counter** | jasminegunarto | Animated number counter (0→100) during page load |
| **SplitText (GSAP)** | jasminegunarto (likely) | Character-level animation with stagger |
| **Hover reveal images** | jasminegunarto | `hover-reveal__img` bg-image appears when hovering project name |
| **Glow text** | daveholloway | `glow-text` class — CSS text-shadow glow effect |
| **Animated text (qi)** | digitalflagship | `qodef-qi-animated-text` — scroll-triggered text animation |

### 6.2 Scroll Techniques

| Technique | Sites | Implementation |
|-----------|-------|---------------|
| **Pinned hero** | jasminegunarto, digitalflagship | ScrollTrigger pin (4 VPs for jasmine, 1200%+ for digital) |
| **Pin spacer** | jasminegunarto | `pin-spacer` class (3,699px height) |
| **Lenis smooth scroll** | jasminegunarto | `lenis` class on main wrapper |
| **Swiper carousels** | digitalflagship | Background slideshow with lazy loading |
| **Portfolio carousel** | daveholloway | Horizontal scroll carousel with canvas per card |
| **Interactive banners** | digitalflagship | `qodef-qi-interactive-banner` with from-bottom reveal |
| **Marquee** | jasminegunarto | `t-marquee` horizontal scrolling text (337px) |

### 6.3 Loading/Transition Effects

| Effect | Sites | Implementation |
|--------|-------|---------------|
| **Preloader** | jasminegunarto, tattooprojects, raviklaassens | Full-screen preloader with animation |
| **Loading sequence** | daveholloway | White loading screen → transition to content |
| **Body overlay** | jasminegunarto | `overlay--body` at `rgba(0,0,0,0.6)` during transitions |
| **Transition dark** | raviklaassens | `transition__dark` full-viewport element |
| **Overscroll covers** | daveholloway | `overscroll-cover-top/bottom` prevents rubber-band peek |

---

## 7. Responsive Strategy Comparison

### 7.1 Breakpoint Behavior Summary

| Strategy | Sites | How it works |
|----------|-------|-------------|
| **Fluid typography (clamp/vw)** | digitalflagship, byfrontyard, daveholloway | Font sizes scale with viewport — no hard breaks |
| **Show/hide elements** | digitalflagship | `elementor-hidden-mobile` / `elementor-hidden-desktop` classes toggle entire sections |
| **Grid column collapse** | digitalflagship, tattooprojects | Desktop multi-column → mobile stacked single column |
| **Reduced pin duration** | jasminegunarto | Pin spacer height likely reduces on mobile |
| **Canvas resize** | daveholloway | Hero canvas 600px (desktop) → 400px (mobile) |

### 7.2 What Survives Mobile

Elements that remain consistent from desktop to mobile across all sites:
- **Hero text fills viewport width** (just scales down proportionally)
- **Break section color stays the same** (lime, black, white, brown)
- **Section ordering stays identical** (no reordering)
- **Overlay effects preserved** (masks, gradients)

Elements that change:
- Multi-column → single column
- Some decorative elements hidden
- Canvas/WebGL may simplify or shrink
- Pinned section scroll distances reduce

---

## 8. Implementation Proposals for yesid.dev

### 8.1 Current State Recap
- Hero: 9-phase scroll-driven metro SVG animation pinned at 1200%
- Manifesto: separate section, SplitText char reveal "I BUILD THE INFRASTRUCTURE YOUR OPERATIONS RUN ON"
- Problem: both feel sparse/empty individually — two dark screens with bold text

### 8.2 Three Approaches

#### Approach A: "Extended Hero" (daveholloway model)
- Keep 9-phase hero. Add phases 10-12 for manifesto inline.
- One continuous pinned section (~1800% scroll)
- Add SVG dot-grid pattern behind everything
- Same dark bg throughout — cohesive identity
- **Pros:** Simplest, your animation untouched
- **Cons:** Long pin, no "break" moment, manifesto can't be oversized

#### Approach B: "Act Break" (digitalflagship model)
- Hero at 1200% (untouched). Manifesto is SEPARATE section.
- Manifesto bg: warm amber tint (`rgba(224,120,0,0.08)`) + SVG circuit pattern
- "INFRASTRUCTURE" scales to viewport-filling (like byfrontyard's "be")
- Variable sizing: small → HUGE → medium
- **Pros:** Creates the "act break", manifesto text can be massive, brand reinforcement
- **Cons:** Two separate pins, potential scroll jank at transition

#### Approach C: "Hybrid" (jasminegunarto model)
- ONE pinned section, ~1600% scroll
- Phases 1-9: existing hero (dark bg)
- Phase 9→10: bg transitions from `#141414` to warm dark (`#1a1510`)
- Phase 10-12: hero scales down, manifesto scales up, SVG grid fades in
- **Pros:** Seamless crossfade, most cinematic, "infrastructure materializing" metaphor
- **Cons:** Most complex technically, 12+ phases, scroll fatigue risk

### 8.3 Full Page Cohesion Plan

Based on the "act structure" pattern found in all sites:

```
Act 1 (Identity):  Hero + Manifesto [dark #141414, viewport-filling text]
Act 2 (Proof):     Proof Reel [same dark, project cards with images]
BREAK:             Services Grid [warm amber tint — the ONE color shift]
Act 3 (Close):     Blog Teaser + About Strip + Dual CTA [back to dark, orange glow on CTA]
```

### 8.4 Recommended Typography Scale for yesid.dev

Based on scan data:

| Element | Mobile (375px) | Desktop (1440px) | Implementation |
|---------|---------------|-----------------|----------------|
| Hero headline | ~120px | ~300px | `clamp(7rem, 20vw, 20rem)` |
| Manifesto "INFRASTRUCTURE" | ~60px | ~200px | `clamp(3.5rem, 14vw, 14rem)` |
| Section titles | ~40px | ~100px | `clamp(2.5rem, 7vw, 7rem)` |
| Card titles | ~24px | ~40px | `clamp(1.5rem, 2.5vw, 2.5rem)` |
| Body text | 16px | 16px | `1rem` |

### 8.5 Background Texture Recommendation

Based on what works at the sites scanned:
1. **SVG dot-matrix or circuit-board pattern** (like digitalflagship's gridhypno) — subtle, on-brand for "digital infrastructure"
2. **CSS gradient overlay** on manifesto section for warmth
3. **Orange glow** on CTA section (like daveholloway's blue glow-text)
4. Never flat `#141414` — always layered

---

## Appendix: Raw Breakpoint Data

### A.1 digitalflagship.com Breakpoints

**375px mobile:**
- Hero: 218px "BUILT", 161px "GROWTH"
- Lime break: 60px
- Page: 6,210px / 8 viewports
- Grid: `2 × 159px` columns
- SVG grid hidden on mobile

**768px tablet:**
- Hero: 445px "BUILT", 192px "GROWTH"
- Lime break: 108px
- Page: 7,224px / 8 viewports

**1440px desktop:**
- Hero: 360px "BUILT FOR", 360px "GROWTH"
- Lime break: 180px
- Page: 7,460px / 9 viewports

**2048px wide:**
- Hero: 512px "BUILT FOR", 512px "GROWTH"
- Lime break: 180px (caps at 180px)
- Page: 8,244px / 9 viewports

### A.2 byfrontyard.com Breakpoints

**375px mobile:**
- Headline: 112px "Why" (down from 664px "be")
- Variable sizing collapsed to single words per line
- Black section: 40px headings
- Page: 18,663px / **23 viewports** (longer on mobile!)

**2048px desktop:**
- Headline: "Don't" 202px → "be" **664px** → "boring." 218px
- Black section: 112px
- Page: 17,106px / 19 viewports

### A.3 daveholloway.uk Breakpoints

**375px mobile:**
- Hero: 122px "Hey!" (Gasoek One)
- Work: 180px "Work" (Alumni Sans)
- Page: 4,646px / 6 viewports
- Canvas count: 29 (still heavy on mobile)

**2048px desktop:**
- Hero: 197px "Hey!"
- Work: 197px "Work"
- Page: 8,353px / 9 viewports
- Canvas count: 34

### A.4 jasminegunarto.com Breakpoints

**375px mobile:**
- Name: 122px (down from 404px)
- Project numbers: 56px (down from 404px — 7x reduction!)
- Preloader blocks initial view
- Featured works at VP2-4: 14px CTAs

**2048px desktop:**
- Name: 404px (ghosted/watermark effect — text color near bg color)
- Pin spacer: 3,699px
- Line masks: 226px each

---

## Next Steps

1. **Deep research:** Use these findings as input for web research into WHY these patterns work aesthetically (Gestalt principles, typographic hierarchy, color theory)
2. **Distinctive voice:** Identify what makes yesid.dev unique vs these sites (digital infrastructure, Montreal, bilingual, data + code + design)
3. **Design spec:** Write the design spec for the chosen approach (A, B, or C)
4. **Implementation:** Plan the implementation per sub-slice
