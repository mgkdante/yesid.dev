# Manifesto Section — Design Spec

> **Date:** 2026-04-09
> **Slice:** 13b (hero + manifesto merge)
> **Status:** Approved by Yesid
> **Research:** `docs/research/design-psychology-report.md`
> **Mockups:** `.superpowers/brainstorm/11501-1775789693/content/` (v1–v6)
> **Final reference:** v6 with two amendments: remove next-stop indicator, restore measurement ticks

---

## 1. Architecture Decision: Modified Approach B

### What
Shorten the existing hero pin from 1200% to ~800%. Manifesto is a SEPARATE section on NORMAL SCROLL (not pinned). Hard cut transition between hero and manifesto.

### Why (research-backed)
- **Pin ceiling:** NNGroup research says max 2-3 viewport heights. 800% (8vh) is the upper bound.
- **No text inside pins:** Requiring reading during altered scroll = worst UX combo (NNGroup).
- **Von Restorff isolation:** Manifesto IS the one dramatic color shift. Must be singular.
- **Break at attention cliff:** 60-70% scroll depth is where attention drops hardest (NN/g).
- **Variable size ratio:** 2.5-3.5x between emphasized and flanking words (eye tracking research).

### Page Flow

```
[ACT 1a] Hero pin ~800% — metro SVG draws, zooms into Berri-UQAM, reveals "yesid." wordmark
[HARD CUT] — yellow/black dashed line, abrupt bg shift
[ACT 1b] Manifesto NORMAL SCROLL — warm dark bg, circuit grid, transit details, interactive nodes
[ACT 2] Proof Reel — back to dark #141414
[BREAK] Services Grid — warm amber tint (reuses break color concept)
[ACT 3] Blog + About + CTA — dark, orange glow on CTA
```

---

## 2. Hero Changes (Slice 13b scope)

### Pin reduction
- Current: `end: '+=1200%'` (12 viewport heights of scroll)
- New: `end: '+=800%'` (8 viewport heights of scroll)
- Phases 1-6 (metro animation + zoom) compressed proportionally
- Phases 7-9 (text reveal + hold) unchanged in relative timing
- Phase 9 hold time may increase slightly to compensate

### No other hero changes
- All 9 phases remain
- Metro SVG, Berri-UQAM zoom, cross-fade, text reveal — all unchanged
- Blink sync, SQL decoration — all unchanged

---

## 3. Hard Cut Transition

### Element
A horizontal bar spanning full viewport width, placed between hero section and manifesto section.

### CSS
```css
.hard-cut {
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    #FFB627 0px, #FFB627 12px,
    #0f0d0a 12px, #0f0d0a 24px
  );
}
```

### Spec
- Height: `4px` (thin but visible)
- Pattern: yellow (#FFB627) and dark (#0f0d0a) alternating 12px bands
- Direction: horizontal (90deg)
- Full bleed: no margins, edge to edge
- Purpose: Von Restorff isolation effect — abrupt categorical difference, no gradient

---

## 4. Manifesto Section — Full Specification

### 4.1 Container

```css
.manifesto {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0f0d0a;  /* Warm dark — NOT the same as hero's #141414 */
  cursor: crosshair;
}
```

- **Background:** `#0f0d0a` — warmer than hero's `#141414`. This IS the Von Restorff color shift. Subtle but the brain registers it.
- **Min-height:** `100vh` (full viewport)
- **Cursor:** `crosshair` — signals interactivity, fits the technical/infrastructure aesthetic
- **Scroll:** Normal scroll. NOT pinned. No ScrollTrigger pin on this section.

---

### 4.2 Background Layer 1: Circuit Board Grid

Full edge-to-edge coverage. No fade, no mask. Uniform across the entire section.

#### Grid Lines
```css
.circuit-grid {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(90deg, rgba(224,120,0,0.035) 0px, rgba(224,120,0,0.035) 1px, transparent 1px, transparent 80px),
    repeating-linear-gradient(0deg, rgba(224,120,0,0.035) 0px, rgba(224,120,0,0.035) 1px, transparent 1px, transparent 80px);
}
```

- **Grid spacing:** 80px × 80px
- **Line color:** `rgba(224,120,0,0.035)` — orange at 3.5% opacity
- **Line width:** 1px
- **Coverage:** `position: absolute; inset: 0` — edge to edge, no dead zones

#### Circuit Nodes (CSS pseudo-element)
```css
.circuit-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    /* Dots at grid intersections — varying opacity for organic feel */
    radial-gradient(circle 2.5px at 80px 80px, rgba(224,120,0,0.15) 0%, transparent 4px),
    radial-gradient(circle 2px at 160px 160px, rgba(224,120,0,0.10) 0%, transparent 3px),
    /* ... pattern continues across full grid at 80px intervals ... */
}
```

- **Node sizes:** 2px and 2.5px radius, alternating
- **Node opacity:** Varies between 0.06 and 0.15 for organic, non-mechanical feel
- **Pattern:** Placed at every grid intersection (80px intervals)
- **Implementation note:** In production, generate these programmatically or use a tiling SVG. The mockup uses hand-placed radial gradients; production should tile a pattern.

---

### 4.3 Background Layer 2: Warm Radial Glow

```css
.warm-glow {
  position: absolute;
  width: 800px;
  height: 500px;
  background: radial-gradient(
    ellipse,
    rgba(224,120,0,0.06) 0%,
    rgba(255,182,39,0.02) 30%,
    transparent 60%
  );
  pointer-events: none;
  transition: left 0.8s ease-out, top 0.8s ease-out;
}
```

- **Size:** 800×500px ellipse
- **Colors:** Orange (#E07800) at 6% center, yellow (#FFB627) at 2% mid, transparent edge
- **Behavior:** Follows cursor position with 800ms ease-out lag. On mouseleave, returns to center (50%, 50%).
- **Mobile:** Follows touch position. Returns to center on touchend.
- **Purpose:** "Heat source" that follows attention — ambient, never competing with content

---

### 4.4 Background Layer 3: Construction Stripes

Diagonal yellow/black stripes on all four corners. Symmetric asymmetry: TL/BR are large, TR/BL are small.

#### Top-Left (large)
```css
.stripe-tl {
  position: absolute;
  top: 0; left: 0;
  width: 240px; height: 240px;
  overflow: hidden;
  z-index: 2;
}
.stripe-tl::before {
  content: '';
  position: absolute;
  width: 480px; height: 480px;
  top: -240px; left: -240px;
  background: repeating-linear-gradient(
    -45deg,
    #FFB627 0px, #FFB627 12px,
    #0f0d0a 12px, #0f0d0a 24px
  );
  opacity: 0.18;
}
```

#### Bottom-Right (large — mirrors TL)
- Same dimensions: 240×240px container, 480×480px stripe
- Same pattern: -45deg, #FFB627/#0f0d0a, 12px bands
- Same opacity: 0.18
- Position: `bottom: 0; right: 0;`
- Pseudo: `bottom: -240px; right: -240px;`

#### Top-Right (small)
```css
.stripe-tr {
  position: absolute;
  top: 0; right: 0;
  width: 110px; height: 110px;
  overflow: hidden;
  z-index: 2;
}
.stripe-tr::before {
  content: '';
  position: absolute;
  width: 220px; height: 220px;
  top: -130px; right: -130px;
  background: repeating-linear-gradient(
    45deg,  /* Note: opposite direction */
    #FFB627 0px, #FFB627 7px,
    #0f0d0a 7px, #0f0d0a 14px
  );
  opacity: 0.09;
}
```

#### Bottom-Left (small — mirrors TR)
- Same dimensions: 110×110px container, 220×220px stripe
- Same pattern: 45deg, 7px bands
- Same opacity: 0.09
- Position: `bottom: 0; left: 0;`

#### Summary Table

| Corner | Size | Band width | Direction | Opacity |
|--------|------|-----------|-----------|---------|
| TL | 240×240 | 12px | -45deg | 0.18 |
| BR | 240×240 | 12px | -45deg | 0.18 |
| TR | 110×110 | 7px | 45deg | 0.09 |
| BL | 110×110 | 7px | 45deg | 0.09 |

---

### 4.5 Background Layer 4: Data Flow Lines

Animated light traces along grid lines suggesting data packets moving through infrastructure.

#### Horizontal Flows (7 lines)
```css
.flow-line {
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(224,120,0,0.1) 30%,
    rgba(224,120,0,0.15) 50%,
    rgba(224,120,0,0.1) 70%,
    transparent 100%
  );
  animation: flowRight linear infinite;
}
```

| Line | Y position | Width | Duration | Delay |
|------|-----------|-------|----------|-------|
| 1 | 80px | 200px | 10s | 0s |
| 2 | 240px | 140px | 12s | 3s |
| 3 | 400px | 180px | 9s | 6s |
| 4 | 560px | 160px | 11s | 1.5s |
| 5 | 160px | 120px | 13s | 4.5s |
| 6 | 640px | 170px | 10s | 7.5s |

Animation: `translateX(0)` → `translateX(calc(100vw + 400px))`
Start position: `left: -[width]px` (enters from left edge)

#### Vertical Flows (4 lines)
```css
.flow-line-v {
  position: absolute;
  width: 1px;
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(255,182,39,0.08) 30%,
    rgba(255,182,39,0.12) 50%,
    rgba(255,182,39,0.08) 70%,
    transparent 100%
  );
  animation: flowDown linear infinite;
}
```

| Line | X position | Height | Duration | Delay |
|------|-----------|--------|----------|-------|
| 1 | 80px | 120px | 12s | 2s |
| 2 | 320px | 90px | 9s | 5s |
| 3 | 560px | 110px | 11s | 0s |
| 4 | right:160px | 80px | 10s | 7s |

Animation: `translateY(0)` → `translateY(calc(section-height + 200px))`

**Reduced motion:** All data flow lines hidden. `display: none` when `prefers-reduced-motion: reduce`.

---

### 4.6 Background Layer 5: Beck-Style Route Lines

Harry Beck's London Underground design rules: ONLY horizontal, vertical, and 45° diagonal lines. Faint orange route segments in the background.

```css
.beck-line {
  position: absolute;
  background: rgba(224,120,0,0.06);
}
.beck-line.h { height: 2px; }  /* horizontal */
.beck-line.v { width: 2px; }   /* vertical */
.beck-line.d45 { height: 2px; transform-origin: left center; transform: rotate(-45deg); }
.beck-line.d135 { height: 2px; transform-origin: left center; transform: rotate(45deg); }
```

#### Segments

| Type | Position | Dimension | Notes |
|------|----------|-----------|-------|
| Horizontal | top:120px, left:0 | width:160px | Left edge, connects to diagonal |
| Diagonal -45° | top:120px, left:160px | width:80px | Connects to horizontal above |
| Horizontal | top:64px, left:217px | width:100px | Continuation at 4% opacity |
| Vertical | right:120px, top:0 | height:200px | Right edge, down from top |
| Diagonal 45° | top:200px, right:120px | width:70px | Connects to vertical above |
| Horizontal | bottom:160px, right:0 | width:180px | Right edge, connects to diagonal |
| Diagonal -45° | bottom:160px, right:180px | width:60px | Connects to horizontal |
| Vertical | left:160px, bottom:0 | height:180px | Left edge, up from bottom |
| Diagonal -45° | bottom:180px, left:160px | width:70px | Connects to vertical above |

All segments at `rgba(224,120,0,0.06)` — 6% opacity.

---

### 4.7 Transit: Line Roundels

Numbered circles at route line endpoints. STM Montreal line colors.

```css
.roundel {
  position: absolute;
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 1.5px solid;
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; font-weight: 600;
}
```

| Roundel | Number | Color | Border opacity | Text opacity | Position |
|---------|--------|-------|---------------|--------------|----------|
| Orange | 1 | #E07800 | 0.25 | 0.35 | left:155px, top:116px |
| Green | 2 | #4CAF50 | 0.20 | 0.25 | right:115px, top:195px |
| Blue | 4 | #4285F4 | 0.20 | 0.25 | right:178px, bottom:128px |
| Orange | 1 | #E07800 | 0.25 | 0.35 | left:155px, bottom:176px |

---

### 4.8 Transit: Arrival Countdown

```css
.arrival-display {
  position: absolute;
  left: 60px; bottom: 80px;
  z-index: 3;
  font-family: 'JetBrains Mono', monospace;
}
.arr-label {
  font-size: 7px; letter-spacing: 2px;
  color: rgba(224,120,0,0.15);
  text-transform: uppercase;
}
.arr-time {
  font-size: 18px; font-weight: 600;
  color: rgba(224,120,0,0.2);
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}
```

- **Label:** "PROCHAIN / NEXT" (bilingual, French first — Montréal convention)
- **Timer:** Starts at 02:47, counts down in real time. Resets to 05:00 when it reaches 00:00.
- **Reduced motion:** Timer frozen at 02:47 (static display).

---

### 4.9 Transit: Directional Chevrons

Two clusters of three stacked chevrons.

```css
.chevron {
  width: 12px; height: 12px;
  border-right: 2px solid #E07800;
  border-bottom: 2px solid #E07800;
  transform: rotate(-45deg);  /* Points right */
}
.chevrons { opacity: 0.12; }
```

| Cluster | Direction | Position |
|---------|-----------|----------|
| Right-pointing | rotate(-45deg) | right:60px, top:110px |
| Down-pointing | rotate(45deg) | left:80px, top:60px |

---

### 4.10 Transit: Platform Badges

```css
.platform-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px; letter-spacing: 2px;
  color: rgba(224,120,0,0.2);
  border: 1px solid rgba(224,120,0,0.1);
  border-radius: 4px;
  padding: 3px 8px;
  text-transform: uppercase;
}
```

| Badge | Text | Position |
|-------|------|----------|
| Platform | "QUAI / PLATFORM 2" | right:50px, bottom:60px |
| Direction | "DIRECTION: CENTRE-VILLE" | left:50px, top:55px |

---

### 4.11 Edge Decoration: Left — Status Readouts

Vertical text rotated via `writing-mode: vertical-rl`.

```
SEC—02          (section number)
● (active dot)  (glowing orange, 6×6px, box-shadow)
MANIFESTO       (section name)
○ (inactive)    (outline only, 5×5px)
○ (inactive)
MTL—QC          (location)
```

- Font: JetBrains Mono, 9px, letter-spacing 3px
- Color: `rgba(224,120,0,0.2)`
- Active dot: `#E07800`, `box-shadow: 0 0 8px rgba(224,120,0,0.4)`
- Inactive dot: `border: 1px solid rgba(224,120,0,0.15)`
- Position: `left: 20px; top: 50%; transform: translateY(-50%)`

---

### 4.12 Edge Decoration: Right — Coordinates + Easter Eggs

```
LAT  45.5017°N
LNG  73.5673°W
——
SRC  Sherbrooke, QC      ← EASTER EGG 1
VIA  Lennoxville, QC     ← EASTER EGG 2
DST  Montréal, QC
——
NODE berri-uqam
STATUS active
```

- Font: JetBrains Mono, 9px, letter-spacing 1px
- Label color: `rgba(224,120,0,0.15)`
- Value color: `rgba(224,120,0,0.25)`
- Position: `right: 20px; top: 50%; transform: translateY(-50%)`
- Gap between items: 16px

**Easter egg context:** SRC/VIA/DST reads as a data route — "source: Sherbrooke, via: Lennoxville, destination: Montréal" — Yesid's life journey encoded as a network route.

---

### 4.13 Edge Decoration: Top — Measurement Ticks

Evenly spaced tick marks aligned to the 80px circuit grid. Like a ruler or technical drawing.

```
|     |     |     |     |     |     |
0    80   160   240   320   400   480
```

- Tick line: `width: 1px; height: 12px; background: rgba(224,120,0,0.12)`
- Label: JetBrains Mono, 8px, `rgba(224,120,0,0.15)`, letter-spacing 1px
- Spacing: 80px between ticks (matches circuit grid)
- Position: `top: 16px; left: 50%; transform: translateX(-50%)`
- Layout: flex row, gap 80px

---

### 4.14 Edge Decoration: Bottom — Status Bar

```
● CONNECTED | LIGNE ORANGE | yesid.dev | v2.0 | SCROLL ↓
```

- Pulsing dot: 5×5px, `rgba(224,120,0,0.3)`, animation: pulse 2s ease-in-out infinite (0.3→1.0 opacity + box-shadow)
- Font: JetBrains Mono, 9px, letter-spacing 1px
- Color: `rgba(224,120,0,0.18)`
- Separators: `1px × 10px`, `rgba(224,120,0,0.1)`
- Position: `bottom: 16px; left: 50%; transform: translateX(-50%)`
- Layout: flex row, gap 20px, align center

---

## 5. Center Content

### 5.1 Terminal Prompt

```html
<div class="dev-prompt">
  <span class="cmd">yesid@mtl</span><span>:~$ cat manifesto.md</span>
  <div class="cursor"></div>
</div>
```

```css
.dev-prompt {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 36px;
  padding: 8px 16px;
  border: 1px solid rgba(224,120,0,0.08);
  border-radius: 4px;
  background: rgba(224,120,0,0.02);
}
```

- `yesid@mtl` at `rgba(224,120,0,0.65)` — the "username" is more visible
- `:~$ cat manifesto.md` at `rgba(224,120,0,0.4)`
- Blinking cursor: 8×14px, `#E07800`, `animation: blink 1s step-end infinite` (0→1 opacity)
- **Callback:** Cursor blinks in sync with the Berri-UQAM dot blink from the hero (same 1s interval)

---

### 5.2 Manifesto Statement — Variable Size Rhythm

```html
<div class="statement">
  <div class="line-small">I BUILD THE</div>
  <div class="line-huge">INFRASTRUCTURE</div>
  <div class="line-small">YOUR <span class="highlight">OPERATIONS</span> RUN ON<span class="highlight">.</span></div>
</div>
```

#### Typography

| Element | Font | Weight | Size (production) | Color | Letter-spacing | Line-height |
|---------|------|--------|-------------------|-------|---------------|-------------|
| "I BUILD THE" | Inter | 700 | `clamp(1.25rem, 4vw, 2rem)` | `rgba(255,255,255,0.45)` | -0.02em | 1.3 |
| "INFRASTRUCTURE" | Inter | 900 | `clamp(3rem, 14vw, 10rem)` | `#E07800` | -0.05em | 0.85 |
| "YOUR OPERATIONS RUN ON." | Inter | 700 | `clamp(1.25rem, 4vw, 2rem)` | `rgba(255,255,255,0.45)` | -0.02em | 1.3 |

- **Variable size ratio:** "INFRASTRUCTURE" is ~3.5x the flanking lines (research optimal: 2.5-3.5x)
- **Text-transform:** `uppercase` on all lines
- **Text-shadow on INFRASTRUCTURE:** `0 0 80px rgba(224,120,0,0.12)` — subtle orange glow
- **"OPERATIONS" and trailing ".":** colored `#E07800` (highlights)
- **Text-align:** center
- **Max-width:** 960px container

#### Responsive Scale

| Breakpoint | "I BUILD THE" | "INFRASTRUCTURE" | Ratio |
|------------|--------------|------------------|-------|
| 375px (mobile) | ~20px | ~55px | 2.75x |
| 768px (tablet) | ~31px | ~107px | 3.5x |
| 1440px (desktop) | ~58px | ~160px | 2.8x |
| 1920px+ | ~64px (cap) | ~160px (cap) | 2.5x |

---

### 5.3 Capability Pills

```html
<nav class="pills" aria-label="Capabilities">
  <a class="pill" href="/services/data-pipeline">pipelines</a>
  <a class="pill" href="/services/database-engineering">databases</a>
  <a class="pill" href="/services/analytics-reporting">dashboards</a>
  <a class="pill" href="/services/internal-tooling">internal_tools</a>
  <a class="pill" href="/services/web-development">web_apps</a>
</nav>
```

```css
.pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: #666;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 9999px;
  padding: 6px 16px;
  text-decoration: none;
  transition: all 200ms ease;
}
.pill:hover {
  border-color: #E07800;
  color: #E07800;
  background: rgba(224,120,0,0.06);
}
```

- 5 pills, centered row, flex-wrap
- Gap: 8px
- Margin-top: 40px from statement
- Each pill links to its service page
- Mobile: pills wrap to 2 rows, `font-size: 10px`, `padding: 5px 12px`

---

## 6. Interactive Elements

### 6.1 Canvas: Node Proximity Glow + Trace Connections

A `<canvas>` element covers the entire manifesto section. JavaScript renders interactive circuit nodes.

#### Node Generation
- Grid: 80px × 80px (matches CSS circuit grid)
- Each node: `{ x, y, baseOpacity, currentOpacity, targetOpacity, size, glowSize }`
- Base opacity: `0.06 + Math.random() * 0.06` (0.06–0.12 range)
- Size: `1.5 + Math.random() * 1.5` (1.5–3px radius)

#### Proximity Glow
- Radius: 120px from cursor
- Within radius: opacity eases up to `baseOpacity + factor * 0.5` (max ~0.62)
- Glow halo: `factor * 12` px radius, color `rgba(224,120,0, opacity * 0.3)`
- Easing: `currentOpacity += (targetOpacity - currentOpacity) * 0.15` per frame
- Outside radius: opacity returns to base, glow shrinks by 0.5/frame

#### Trace Connections
- Threshold: 160px between two active nodes
- When 2+ nodes are within PROXIMITY of cursor, draw lines between all active pairs
- Line: `strokeStyle: rgba(224,120,0, (1 - dist/160) * 0.25)`, `lineWidth: 1`
- Effect: temporary circuit paths forming and dissolving around cursor

#### Performance
- Uses `requestAnimationFrame`
- Canvas clears + redraws each frame
- Node count: ~100-150 depending on viewport (manageable)
- **Production:** Can be GSAP-driven for consistency with rest of animation stack

#### Touch Support
- `touchmove` event replaces `mousemove`
- Same proximity/glow behavior
- `{ passive: true }` on touch listeners

### 6.2 Tap/Click Ripple

On click or tap anywhere in the manifesto section, emit two concentric ring pulses.

#### Outer Ring
```css
.ripple {
  border: 1px solid rgba(224,120,0,0.4);
  animation: ripple-expand 1.2s ease-out forwards;
}
@keyframes ripple-expand {
  0% { width: 0; height: 0; opacity: 0.6; }
  100% { width: 200px; height: 200px; opacity: 0; }
}
```

#### Inner Ring (faster, yellow tint)
```css
.ripple-inner {
  border: 1px solid rgba(255,182,39,0.3);
  animation: ripple-inner 0.8s ease-out forwards;
}
@keyframes ripple-inner {
  0% { width: 0; height: 0; opacity: 0.8; }
  100% { width: 100px; height: 100px; opacity: 0; }
}
```

- Both elements created dynamically at click position
- Position: absolute, `transform: translate(-50%, -50%)`
- Auto-removed after animation completes (1200ms / 800ms)
- z-index: 4 (above background, below text content)

---

## 7. Scroll-Triggered Entrance Animations

All elements should animate in as the section scrolls into view. NOT pinned — uses `ScrollTrigger.create()` with `scrub: false` and `start: "top 80%"`.

### Animation Sequence (proposed)

| Delay | Element | Animation |
|-------|---------|-----------|
| 0ms | Circuit grid | Fade in 0→1 opacity, 600ms |
| 100ms | Construction stripes | Fade in, 400ms |
| 200ms | Beck route lines + roundels | Draw SVG / fade in, 500ms |
| 300ms | Edge decorations (all 4 edges) | Fade in + slight translate (8px toward center), 400ms |
| 400ms | Transit elements (chevrons, badges, countdown) | Fade in, 300ms |
| 500ms | Terminal prompt | Typewriter effect: characters appear one by one, 80ms per char |
| 800ms | "I BUILD THE" | SplitText char reveal, stagger 0.015, from opacity:0 y:20 |
| 1200ms | "INFRASTRUCTURE" | SplitText char reveal, stagger 0.02, from opacity:0 y:30 (bigger motion for bigger text) |
| 1800ms | "YOUR OPERATIONS RUN ON." | SplitText char reveal, stagger 0.015 |
| 2200ms | Capability pills | Stagger in 0.1, from opacity:0 y:15 |
| 2500ms | Interactive canvas activates | Nodes fade to base opacity, cursor interaction enabled |
| 2500ms | Data flow lines start | CSS animations begin |

### SplitText Details
- Plugin: GSAP SplitText (already in stack)
- Split type: `chars,words`
- Each character animated individually
- Scrubbed: NO — one-shot trigger when section enters viewport
- Reversible: YES — on scroll back up, animation reverses

### Reduced Motion
When `prefers-reduced-motion: reduce`:
- All elements visible immediately, no animation
- No SplitText splitting
- No data flow animations
- No canvas interaction (show static grid nodes at base opacity)
- No cursor following on glow
- Countdown timer frozen
- Tap ripples disabled
- Pills still interactive (hover state preserved)

---

## 8. Responsive Behavior

### Mobile (375px)
- Statement text scales via `clamp()` — see 5.2 table
- Pills: `font-size: 10px`, `padding: 5px 12px`, `gap: 6px`, wraps to 2 rows
- Edge decorations: left + right edges HIDDEN below 640px (too cramped)
- Top measurement ticks: fewer ticks shown (every 160px instead of 80px)
- Bottom status bar: abbreviated ("CONNECTED · LIGNE ORANGE · ↓")
- Construction stripes: reduced to 160×160px (TL/BR) and 80×80px (TR/BL)
- Beck lines: hidden below 768px
- Roundels: hidden below 768px
- Chevrons: hidden below 768px
- Platform badges: hidden below 768px
- Arrival countdown: hidden below 640px
- Circuit grid: unchanged (scales naturally)
- Canvas interaction: touch events, same behavior
- Terminal prompt: stays, scales with font-size
- Data flow lines: reduce to 3 horizontal, 2 vertical

### Tablet (768px)
- Edge decorations visible
- Some transit elements return (chevrons, one platform badge)
- Stripes at full size
- Beck lines visible

### Desktop (1440px+)
- Full experience as designed
- All elements visible

---

## 9. Color Reference

| Token | Value | Usage |
|-------|-------|-------|
| Section background | `#0f0d0a` | Warm dark, distinct from hero's #141414 |
| Grid lines | `rgba(224,120,0,0.035)` | Circuit grid |
| Grid nodes | `rgba(224,120,0,0.06-0.15)` | Varying opacity |
| Active nodes (cursor) | `rgba(224,120,0,0.3-0.62)` | Brightened on proximity |
| Trace lines | `rgba(224,120,0,0.05-0.25)` | Between active nodes |
| Construction stripes | `#FFB627` at 0.09-0.18 opacity | Corner decorations |
| Warm glow center | `rgba(224,120,0,0.06)` | Radial gradient |
| Warm glow mid | `rgba(255,182,39,0.02)` | Yellow transition |
| Statement text (small) | `rgba(255,255,255,0.45)` | Flanking lines |
| Statement text (huge) | `#E07800` | "INFRASTRUCTURE" |
| Statement glow | `rgba(224,120,0,0.12)` | text-shadow |
| Highlight text | `#E07800` | "OPERATIONS", "." |
| Terminal prompt cmd | `rgba(224,120,0,0.65)` | "yesid@mtl" |
| Terminal prompt text | `rgba(224,120,0,0.4)` | ":~$ cat manifesto.md" |
| Pill border | `rgba(255,255,255,0.07)` | Default state |
| Pill hover | `#E07800` border, `rgba(224,120,0,0.06)` bg | Hover state |
| Edge text | `rgba(224,120,0,0.15-0.25)` | Coordinates, readouts |
| Beck lines | `rgba(224,120,0,0.06)` | Route segments |
| Roundel orange | `rgba(224,120,0,0.25-0.35)` | Line 1 |
| Roundel green | `rgba(76,175,80,0.20-0.25)` | Line 2 |
| Roundel blue | `rgba(66,133,244,0.20-0.25)` | Line 4 |
| Hard cut | `#FFB627` / `#0f0d0a` | Yellow/black bands |
| Ripple outer | `rgba(224,120,0,0.4)` | Click/tap |
| Ripple inner | `rgba(255,182,39,0.3)` | Click/tap |

---

## 10. Fonts Used

| Font | Weight | Usage |
|------|--------|-------|
| Inter | 700 (Bold) | Flanking statement lines |
| Inter | 900 (Black) | "INFRASTRUCTURE" |
| JetBrains Mono | 400-600 | Terminal prompt, pills, edge deco, ticks, badges, countdown, status bar |

---

## 11. Files to Create/Modify

### New Files
- `src/lib/components/Manifesto.svelte` — REWRITE (replace current 300% pin with normal-scroll interactive section)
- `src/lib/components/ManifestoCanvas.svelte` — interactive canvas component (node glow + traces)

### Modified Files
- `src/lib/components/HeroBanner.svelte` — reduce pin from 1200% to 800%
- `src/routes/+page.svelte` — add hard-cut div between Hero and Manifesto
- `src/lib/data/content.ts` — update manifestoContent if needed (easter egg data)
- `src/lib/styles/tokens.css` — add `--bg-manifesto: #0f0d0a` token
- `src/app.css` — add any new `@theme` values

### Test Files
- `src/lib/components/Manifesto.test.ts` — UPDATE for new structure
- `src/routes/home.test.ts` — UPDATE for hard cut + new manifesto

---

## 12. Data Layer — All Text is LocalizedString

**Every visible text element** in the manifesto section (except the countdown timer digits) MUST come from the data layer as `LocalizedString` values in `content.ts`. No hardcoded strings in the component.

### manifestoContent export structure

```typescript
export const manifestoContent = {
  // Statement
  statement: {
    line1: { en: 'I BUILD THE' } satisfies LocalizedString,
    lineHuge: { en: 'INFRASTRUCTURE' } satisfies LocalizedString,
    line3Part1: { en: 'YOUR' } satisfies LocalizedString,
    line3Highlight: { en: 'OPERATIONS' } satisfies LocalizedString,
    line3Part2: { en: 'RUN ON' } satisfies LocalizedString,
  },

  // Terminal prompt
  terminal: {
    user: { en: 'yesid@mtl' } satisfies LocalizedString,
    command: { en: ':~$ cat manifesto.md' } satisfies LocalizedString,
  },

  // Capability pills
  pills: [
    { label: { en: 'pipelines' } satisfies LocalizedString, serviceId: 'data-pipeline' },
    { label: { en: 'databases' } satisfies LocalizedString, serviceId: 'database-engineering' },
    { label: { en: 'dashboards' } satisfies LocalizedString, serviceId: 'analytics-reporting' },
    { label: { en: 'internal_tools' } satisfies LocalizedString, serviceId: 'internal-tooling' },
    { label: { en: 'web_apps' } satisfies LocalizedString, serviceId: 'web-development' },
  ],

  // Edge decorations — left
  edgeLeft: {
    sectionNumber: { en: 'SEC—02' } satisfies LocalizedString,
    sectionName: { en: 'MANIFESTO' } satisfies LocalizedString,
    location: { en: 'MTL—QC' } satisfies LocalizedString,
  },

  // Edge decorations — right (coordinates + easter eggs)
  edgeRight: {
    lat: { en: 'LAT 45.5017°N' } satisfies LocalizedString,
    lng: { en: 'LNG 73.5673°W' } satisfies LocalizedString,
    src: { en: 'SRC Sherbrooke, QC' } satisfies LocalizedString,
    via: { en: 'VIA Lennoxville, QC' } satisfies LocalizedString,
    dst: { en: 'DST Montréal, QC' } satisfies LocalizedString,
    node: { en: 'NODE berri-uqam' } satisfies LocalizedString,
    status: { en: 'STATUS active' } satisfies LocalizedString,
  },

  // Edge decorations — bottom status bar
  edgeBottom: {
    connected: { en: 'CONNECTED' } satisfies LocalizedString,
    line: { en: 'LIGNE ORANGE' } satisfies LocalizedString,
    url: { en: 'yesid.dev' } satisfies LocalizedString,
    version: { en: 'v2.0' } satisfies LocalizedString,
    scrollHint: { en: 'SCROLL ↓' } satisfies LocalizedString,
  },

  // Transit elements
  transit: {
    arrivalLabel: { en: 'PROCHAIN / NEXT' } satisfies LocalizedString,
    platformBadge: { en: 'QUAI / PLATFORM 2' } satisfies LocalizedString,
    directionBadge: { en: 'DIRECTION: CENTRE-VILLE' } satisfies LocalizedString,
  },

  // Measurement tick labels (numbers as strings for locale flexibility)
  ticks: ['0', '80', '160', '240', '320', '400', '480'],
} as const;
```

### What is NOT data-driven
- Countdown timer digits (generated by JS, not text content)
- CSS-only elements (stripes, grid, glow, beck lines — no text)
- Canvas-rendered nodes and traces (visual only)

### Why
- Maximum locale support: `en` now, `fr`/`es` later
- Consistent with project rule: "NEVER hardcode content; always LocalizedString"
- Payload CMS compatibility (Slice 18 — see `docs/specs/2026-04-16-cms-payload-design.md`)
- Deco text like "LIGNE ORANGE" would be "ORANGE LINE" in English locale, "LÍNEA NARANJA" in Spanish

---

## 13. Out of Scope

- Hero phases 1-9 content/timing (unchanged except pin duration)
- Sections 3-7 (Proof Reel, Services, Blog, About, CTA) — later sub-slices
- Service page changes
- Lenis changes
- New packages (everything uses existing GSAP + SplitText + ScrollTrigger)

---

## 14. Acceptance Criteria

- [ ] Hero pin reduced to ~800% (from 1200%)
- [ ] Hard cut bar (4px, yellow/black) between hero and manifesto
- [ ] Manifesto section background is `#0f0d0a` (warm dark, distinct from hero)
- [ ] Circuit grid covers 100% of section, 80px spacing, orange at 3.5% opacity
- [ ] Construction stripes on all 4 corners (TL/BR large at 18%, TR/BL small at 9%)
- [ ] Warm radial glow follows cursor with 800ms lag
- [ ] Interactive canvas: nodes glow on proximity (120px), traces between active nodes
- [ ] Tap/click emits dual concentric ripple
- [ ] Data flow lines animate along grid (7 horizontal, 4 vertical)
- [ ] Beck-style route lines at 6% opacity
- [ ] Line roundels (1-orange, 2-green, 4-blue) at route endpoints
- [ ] Arrival countdown ticks down from 02:47, bilingual label
- [ ] Directional chevrons (2 clusters, 12% opacity)
- [ ] Platform badges bilingual ("QUAI / PLATFORM 2", "DIRECTION: CENTRE-VILLE")
- [ ] Left edge: vertical readouts (SEC-02, MANIFESTO, MTL-QC) + active/inactive dots
- [ ] Right edge: coordinates + easter eggs (SRC Sherbrooke / VIA Lennoxville / DST Montréal)
- [ ] Top edge: measurement ticks at 80px intervals
- [ ] Bottom edge: status bar (CONNECTED, LIGNE ORANGE, yesid.dev, v2.0, SCROLL ↓)
- [ ] Terminal prompt: `yesid@mtl:~$ cat manifesto.md` with blinking cursor
- [ ] "INFRASTRUCTURE" at ~14vw, 3.5x ratio to flanking text
- [ ] "OPERATIONS" and "." highlighted in #E07800
- [ ] text-shadow glow on "INFRASTRUCTURE"
- [ ] 5 capability pills linking to /services/[id]
- [ ] SplitText char-by-char entrance animation (scroll-triggered, not pinned)
- [ ] Staggered entrance: bg layers → edges → transit → prompt → text → pills
- [ ] `prefers-reduced-motion`: all visible immediately, no animation
- [ ] Responsive: edge deco hidden <640px, transit elements hidden <768px
- [ ] ALL visible text (except countdown digits) from data layer as LocalizedString
- [ ] `bun run test` and `bun run check` pass
