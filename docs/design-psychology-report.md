# Design Psychology Research Report
*Generated: 2026-04-09 | Sources: 35+ | Confidence: High*
*Context: yesid.dev home page redesign — hero + manifesto merge (slice 13b)*

## Executive Summary

Seven design patterns observed across 7 Awwwards portfolio sites are not aesthetic coincidences — they are grounded in established psychology, Gestalt principles, and UX research. The strongest actionable findings:

1. **One break, not many.** Von Restorff isolation effect demands a singular color shift for memorability.
2. **Text IS architecture.** Viewport-filling type triggers cognitive fluency + institutional authority perception.
3. **Variable size = musical dynamics.** 3x ratio between emphasized and flanking words creates optimal visual crescendo.
4. **Flat dark = void.** The brain needs texture gradients to perceive surface vs. absence.
5. **3-act scroll narrative.** Primacy-recency effect means hero and CTA occupy memory-privileged positions.
6. **Pinned scroll has a ceiling.** 2-3 viewport heights max; no text inside pins; mobile simplify.
7. **Mobile text is proportionally bigger for a reason.** Viewing distance compensation + scan-not-read mode.

---

## 1. The "Break" Rule — Single Color Shift

### Core Principles

**Von Restorff Isolation Effect (1933).** When multiple similar elements are presented together, the one that differs is remembered best. Applied to a long dark page, a single bright section becomes the "isolated" element encoded more deeply into memory. This only works when the break is singular — multiple color shifts collapse the effect.

**Gestalt Figure-Ground.** A full-viewport color shift forces complete figure-ground reassignment. Warm colors (orange, yellow) naturally advance and are perceived as "figure," while cool colors recede as "ground" — meaning a warm-colored break section literally pushes itself forward perceptually.

**Attention Curve Reset.** Nielsen Norman Group data: 57% of page-viewing time is above the fold, 74% within first two screenfuls, 81% within three. A color break at the 3rd-4th screenful acts as a "perceptual reset" — it interrupts the declining attention curve by forcing the brain to re-evaluate the visual environment. Functions like a new page load.

### Actionable Insights

1. **One break, not two.** Von Restorff demands singularity. Use exactly one dramatic shift.
2. **Place at the attention cliff.** ~3rd screenful (2100-2700px), where NN/g data shows steepest attention drop.
3. **Use warm advancing colors.** For #E07800/#FFB627 brand on dark, the break should use orange/amber as bg.
4. **Full bleed, no transition.** Abrupt cut > gradient. Isolation effect depends on clear categorical difference.
5. **Return to dark after.** The break is powerful because it is temporary.

### Sources
- [Von Restorff Effect — Laws of UX](https://lawsofux.com/von-restorff-effect/)
- [Gestalt Figure-Ground — Toptal](https://www.toptal.com/designers/ui/gestalt-principles-of-design)
- [Scrolling and Attention — NN/g](https://www.nngroup.com/articles/scrolling-and-attention/)
- [Psychology of Scrolling — GraphEdge](https://graphedge.com/the-psychology-of-scrolling-how-to-design-for-attention-and-flow/)

---

## 2. Text-as-Architecture — Oversized Display Typography

### Core Principles

**Typographic hierarchy at extreme scale.** Smashing Magazine: it is the *contrast between sizes* — not the absolute size — that creates hierarchy. When hero text fills 80%+ of viewport, ratio between display and body text becomes so extreme (40:1+) that text transcends readable content and becomes spatial composition. The text IS the layout structure.

**Swiss/International Typographic Style lineage.** Josef Müller-Brockmann: "design should focus on content, not decorative extras." Type itself serves as the primary visual element. Modern viewport-filling type is the digital evolution: grid = browser viewport, type fills it with confident rationality.

**Authority perception.** Larger fonts convey confidence, importance, authority. Filling viewport with one word = confidence statement: the brand needs only one word to command the entire screen. Typographic equivalent of speaking quietly because you know everyone is listening.

### Three Mechanisms

1. **Cognitive fluency.** Viewport with one massive word = near-zero effort to process. Brain rewards low processing effort with positive affect.
2. **Scarcity signaling.** Using 80%+ of space for minimal text signals extreme deliberation. Triggers perception of high value.
3. **Environmental scale.** Text at 200px+ operates at building signage scale. Brain associates with permanence, public importance, institutional authority.

### Actionable Insights

1. **One word or two, maximum.** "yesid." at viewport width = architecture. "Yesid Otalo, Digital Infrastructure" = just big text.
2. **Let letterforms define the grid.** Negative space inside/between letters becomes the page's white space system.
3. **Viewport-relative units mandatory.** Use clamp() with vw so type fills same proportional space at every breakpoint.
4. **Kinetic typography amplifies.** Animated viewport-scale type adds temporal dimension to architectural metaphor.

### Sources
- [Typographic Hierarchies — Smashing Magazine](https://www.smashingmagazine.com/2022/10/typographic-hierarchies/)
- [Swiss Style — PRINT Magazine](https://www.printmag.com/featured/swiss-style-principles-typefaces-designers/)
- [Psychology of Fonts — FontGem](https://www.fontgem.com/psychology-of-fonts)
- [Typography Impact — Brand Vision](https://www.brandvm.com/post/typography-influence)

---

## 3. Variable Size Rhythm — Dramatic Size Contrast

### Core Principles

**Musical dynamics.** Piano → forte → piano creates emotional tension through contrast. "Don't" (202px) → "be" (664px) → "boring." (218px) = visual crescendo-decrescendo. The "essence of rhythm is fusion of sameness and novelty" (Whitehead via PampaType).

**Attentional capture through deviation.** Eye-tracking research: saccade amplitude increases with larger font sizes — eye jumps farther toward bigger text. 3x larger word = forced focal point.

**Reading tempo.** Small words scan in one fixation (fast). Oversized word forces eye to slow down and process as visual object (slow). Creates staccato fast-slow-fast pattern = dramatic pause on key word.

### Actionable Insights

1. **2.5x-3.5x ratio sweet spot.** Below 2x = normal hierarchy. Above 4x = disconnected. 3x (200px/600px/200px) = dramatic but unified.
2. **Emphasize the payload word.** Verb or key noun, not function words.
3. **Flanking words as typographic rests.** Same weight or lighter, tighter tracking, lower temperature.
4. **Animate sequentially.** Small → pause → large (with weight) → pause → small. GSAP SplitText with stagger.

### Sources
- [Rhythm in Type Design — PampaType](https://pampatype.com/blog/rhythm-in-type-design)
- [Seven Principles of Typographic Contrast — Carl Dair](https://nstarkey.github.io/Intro-to-Web-Design/websites/project1.html)
- [Eye Tracking & Font Size — Scientific Reports](https://www.nature.com/articles/s41598-019-49051-x)

---

## 4. Never Flat Dark — Texture Theory

### Core Principles

**Ganzfeld effect.** Perfectly uniform #000000 = no depth cues, no texture gradients. Brain cannot anchor to it = sensation of void rather than surface.

**Depth through texture gradient.** Gibson's ecological perception: we perceive surfaces through texture density gradients. Even faint noise/scanlines gives brain surface information to perceive background as physical plane at specific depth.

**Perceived quality signaling.** Multiple subtle techniques (alpha gradients, backdrop blur, 1px borders) = signals intentional craftsmanship. Flat dark = laziness or indifference.

**Elevation without shadows.** In dark mode, shadows are invisible. Alternative: system of layers with slightly lighter tones per elevation step.

### Actionable Insights

1. **Never pure #000000.** Use #0A0A0A to #121212. Difference imperceptible as color but gives brain a surface.
2. **SVG noise at 2-4% opacity.** Breaks flat field, prevents gradient banding, adds craft signal. <2KB tiling pattern.
3. **Radial gradient "light sources."** Brand orange at 3-5% opacity, 600px radius behind hero. Ambient illumination without visible element.
4. **3-4 tonal elevation steps.** Base #0D0D0D → card #141414 → raised #1A1A1A → overlay #222222.
5. **1px borders at rgba(255,255,255,0.06-0.10).** Light-catching edges = depth cue at every card boundary.

### Sources
- [12 Principles of Dark Mode — Uxcel](https://uxcel.com/blog/12-principles-of-dark-mode-design-627)
- [Dark Glassmorphism 2026 — Medium](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f)
- [Dark UI Design Tips — Halo Lab](https://www.halo-lab.com/blog/dark-ui-design-11-tips-for-dark-mode-design)

---

## 5. 3-Act Page Structure — Narrative Scroll

### Core Principles

**Serial Position Effect.** Ebbinghaus: people remember first and last items far better than middle. NN/g confirms on web: 42% viewing time in top 20% of page. Hero (Act 1) and CTA (Act 3) occupy memory-privileged positions.

**Attention degradation.** Not linear — drops sharply after fold, then gradually. Users make scroll-or-leave decision based on "information scent." Strong Act 1 = trigger that earns the scroll.

**Scrollytelling engagement.** Research shows 400% longer time-on-page, 67% improvement in recall, 25% higher CTA completion. Motor-cognitive coupling (physical scrolling = active participation) + progressive disclosure sustains curiosity.

### Actionable Insights

- **Act 1 (first screenful):** Identity + value prop within 50ms. Orange as single accent. Minimal copy.
- **Act 2 (screenfuls 2-4):** Visual rhythm fights attention degradation. Alternate full-bleed and breathing space.
- **Color break at 60-70% scroll mark.** Where NN/g shows steepest attention drop-off.
- **Act 3 (final screenful):** Exploit recency. Mirror visual weight of Act 1 for symmetry.

### Sources
- [Scrolling and Attention — NN/g](https://www.nngroup.com/articles/scrolling-and-attention/)
- [Serial Position Effect — Laws of UX](https://lawsofux.com/serial-position-effect/)
- [Scrollytelling Guide — UI Deploy](https://ui-deploy.com/blog/complete-scrollytelling-guide-how-to-create-interactive-web-narratives-2025)

---

## 6. Pinned Scroll Sections

### Core Principles

**NNGroup's key finding:** Pinned scroll works when it *adds information* and fails when it *delays access*.

**Works:** Progressive visual disclosure, reduces cognitive load, visual-only content, short duration, below fold.
**Fails:** Scroll rate changes while reading text (worst combo), direction changes, long duration, mobile.

**Duration threshold:** 1-2 viewport scroll heights maintain orientation. 4+ cause users to lose position sense. 12vh pins work only for self-selecting Awwwards audiences.

### Actionable Insights

1. **2-3 viewport heights max.** Shorter is safer for professional portfolio targeting employers + clients.
2. **No text inside pins.** Visual reveals only. Text in normal-scroll sections between pins.
3. **Below fold only.** Never pin the hero.
4. **Scroll progress indicator.** Orange progress line = wayfinding + brand.
5. **Respect prefers-reduced-motion.** Convert pins to static layouts. Non-negotiable.
6. **Mobile: simplify or remove.** Replace pins with fade-in reveals on touch devices.

### Sources
- [Scrolljacking 101 — NN/g](https://www.nngroup.com/articles/scrolljacking-101/)
- [Scroll-Driven Animations — CSS-Tricks](https://css-tricks.com/bringing-back-parallax-with-scroll-driven-css-animations/)
- [Parallax Scrolling 2026 — Builder.io](https://www.builder.io/blog/parallax-scrolling-effect)

---

## 7. Mobile Typography Ratios

### Core Principles

**Viewing distance compensation.** Smartphone at 32-36cm vs monitor at 60-70cm. At half the distance, proportionally larger type needed for equivalent visual impact. 33% vw on mobile at 33cm ≈ 15% vw on desktop at 65cm retinally.

**Focused attention state.** Mobile users enter narrowed attention mode. 1.7 seconds average gaze per screen before scrolling. Oversized type guarantees message registers within scan window.

**Scanning replaces reading.** Mobile users spend 40% less time reading body text. Display type at 30%+ vw designed for single-fixation absorption — holistic pattern recognition, not sequential decoding.

### Recommended Type Scale for yesid.dev

| Role | Mobile (375px) | Desktop (1440px) | % VW mobile | % VW desktop |
|------|---------------|-------------------|-------------|--------------|
| Hero display | 96-140px | 140-200px | 26-37% | 10-14% |
| Section heading | 48-72px | 64-96px | 13-19% | 4-7% |
| Subheading | 24-32px | 28-40px | 6-9% | 2-3% |
| Body | 16-18px | 18-22px | 4-5% | 1.2-1.5% |
| Caption/meta | 13-14px | 14-16px | 3.5% | ~1% |

Key: mobile display text is 3-6x proportionally larger relative to viewport than desktop. This is correct optical compensation.

### Dark Theme Specifics
- Reduce display weight slightly (Semibold not Black) or use #FFB627 at extreme sizes — pure white at 120px+ creates halation on OLED.
- Reserve #E07800 for small-area accents (the dot in "yesid."), not full display text (WCAG contrast).
- Body text line-height: 1.5-1.6x. Display line-height: 0.85-1.0x.

### Sources
- [Font Size & Viewing Distance — Optometry & Vision Science](https://pubmed.ncbi.nlm.nih.gov/21499163/)
- [Modern Fluid Typography — Smashing Magazine](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/)
- [Typography is the New Black — Awwwards](https://www.awwwards.com/typography-is-the-new-black-trends-in-web-design.html)
- [Mobile Typography — Tubik Studio](https://blog.tubikstudio.com/mobile-typography-8-steps-toward-powerful-ui/)

---

## Methodology
Searched 30+ queries across web search. Analyzed 35+ sources including NN/g usability research, Gestalt psychology references, typography theory (Smashing Magazine, PampaType), color psychology, and UX design publications. Sub-questions investigated across 4 parallel research agents covering all 7 patterns.
