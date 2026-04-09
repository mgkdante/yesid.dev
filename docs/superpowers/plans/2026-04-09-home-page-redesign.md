# Slice 13 — Home Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the home page as a full-bleed, kinetic, Awwwards-quality experience with 7 scroll-driven sections that deep-link into existing subpages.

**Architecture:** Strip the current metro-journey home page down to the Hero + 6 new sections (Manifesto, Proof Reel, Services, Blog Teaser, About Strip, Dual CTA). Install Lenis for smooth scroll. All content from existing data layer. Each section gets a design brainstorm during its implementation session.

**Tech Stack:** SvelteKit 2, Svelte 5, GSAP (ScrollTrigger, SplitText, DrawSVG), Lenis, Tailwind v4, Bun

**Runtime:** Bun only. Never npm/npx/node.

**Multi-session:** This slice spans ~8-9 sessions. One sub-slice per session. Each section session starts with a visual companion brainstorm before any code is written.

**Design spec:** `docs/superpowers/specs/2026-04-09-home-page-redesign.md`

---

## File Structure

### Files to modify

- `src/lib/data/content.ts` — update heroContent (headline, SQL, subtitle), add manifestoContent, aboutStripContent, extend ctaContent
- `src/lib/components/HeroBanner.svelte` — 4 fixes (scroll offset, blink sync, headline, SQL decoration)
- `src/routes/+page.svelte` — complete rewrite (remove old sections, add new sections)
- `src/routes/+layout.svelte` — Lenis init, remove pt-20 for home page
- `src/lib/motion/utils/gsap.ts` — no changes needed (SplitText, ScrollTrigger already registered)
- `src/lib/components/Hero.test.ts` — update for new headline content

### Files to create

- `src/lib/motion/utils/lenis.ts` — Lenis initialization + GSAP ScrollTrigger bridge
- `src/lib/components/Manifesto.svelte` — full-viewport SplitText statement
- `src/lib/components/ProofReel.svelte` — featured project cards with impact metrics
- `src/lib/components/HomeServices.svelte` — 6-service grid
- `src/lib/components/BlogTeaser.svelte` — minimal blog post strip
- `src/lib/components/AboutStrip.svelte` — compact about section
- `src/lib/components/HomeCta.svelte` — dual CTA section
- Tests co-located with each new component

---

## Sub-slice 13a: Foundation (Hero Fixes + Teardown + Lenis)

### Task 1: Update hero content in data layer

**Files:**

- Modify: `src/lib/data/content.ts:8-28`
- Test: `src/lib/components/Hero.test.ts`
- **Step 1: Update heroContent in content.ts**

Change the headline from "DATA" to "DIGITAL", update subtitle for digital infrastructure positioning, and reformat the SQL decoration with professional formatting (3 lines with aliases):

```typescript
export const heroContent = {
	badge: { en: 'AVAILABLE FOR HIRE' } satisfies LocalizedString,
	headline: {
		line1: { en: 'DIGITAL' } satisfies LocalizedString,
		line2: { en: 'INFRA' } satisfies LocalizedString,
		line3: { en: 'BUILT RIGHT.' } satisfies LocalizedString,
	},
	subtitle: {
		en: 'Freelance digital infrastructure — PostgreSQL, Python, Power BI, SvelteKit — from Montreal to your pipeline.'
	} satisfies LocalizedString,
	ctaWork: { en: 'View work →' } satisfies LocalizedString,
	ctaContact: { en: 'Get in touch' } satisfies LocalizedString,
	sqlDecoration: {
		line1: { en: 'SELECT  y.expertise' } satisfies LocalizedString,
		line2: { en: 'FROM    yesid AS y' } satisfies LocalizedString,
		line3: { en: "WHERE   y.work = 'Quality'" } satisfies LocalizedString,
	},
} as const;
```

- **Step 2: Update HeroBanner.svelte to render 3 SQL lines**

In `src/lib/components/HeroBanner.svelte`, add the third SQL line variable and render it:

```typescript
const sqlLine3 = resolveLocale(heroContent.sqlDecoration.line3, 'en');
```

Update the SQL decoration template (around line 436):

```svelte
<code class="block font-mono text-sm leading-loose text-[#E07800] opacity-70">
    {sqlLine1}<br />
    {sqlLine2}<br />
    {sqlLine3}
</code>
```

- **Step 3: Update Hero.test.ts for new headline**

Update any test assertions that check for "DATA" to check for "DIGITAL" instead. Update SQL decoration assertions if they exist.

- **Step 4: Run tests**

Run: `bun run test`
Expected: All tests pass with updated content.

- **Step 5: Commit**

```bash
git add src/lib/data/content.ts src/lib/components/HeroBanner.svelte src/lib/components/Hero.test.ts
git commit -m "feat(slice-13a): update hero content — digital infra headline, SQL formatting"
```

### Task 2: Fix hero scroll offset

**Files:**

- Modify: `src/routes/+layout.svelte:33`

The home page has `pt-20` (80px top padding) applied via the layout. This creates dead scroll space before the hero's ScrollTrigger fires. For the full-bleed immersive home page, remove this padding so the hero starts at viewport top with the pill nav floating over it.

- **Step 1: Conditionally remove pt-20 for home page**

In `src/routes/+layout.svelte`, update the main class to exclude `pt-20` when `isHome` is true:

```svelte
<main class="{isFullWidth ? 'flex-1' : 'mx-auto w-full max-w-5xl flex-1 px-6'} {isHome ? '' : 'pt-20'} {!isHome && !$prefersReducedMotion ? 'animate-page-fade-in' : ''}">
```

- **Step 2: Verify other pages still have pt-20**

Run the dev server (`bun run dev`) and check that `/services`, `/about`, `/work`, `/blog` still have proper spacing below the nav. Only the home page should lose the top padding.

- **Step 3: Run tests and check**

Run: `bun run test && bun run check`
Expected: All pass.

- **Step 4: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "fix(slice-13a): remove pt-20 on home page — hero scroll starts immediately"
```

### Task 3: Implement blink sync between dot and cursor

**Files:**

- Modify: `src/lib/components/HeroBanner.svelte:71-89`

The Berri-UQAM dot and the typewriter cursor should blink in sync on mount (before any scrolling). Currently the cursor blinks independently (500ms interval). The dot has no idle blink — it only animates during scroll phases. Sync them to the same 500ms heartbeat.

- **Step 1: Refactor typewriter to share blink state with dot**

In `HeroBanner.svelte`, after the typewriter finishes typing, set up a shared blink interval that controls both the cursor and the Berri-UQAM dot opacity:

```typescript
// After typing completes, sync dot + cursor blink
let cursorVisible = true;
const blinkInterval = setInterval(() => {
    cursorVisible = !cursorVisible;
    scrollPrompt.textContent = fullText + (cursorVisible ? '_' : '\u00A0');
    if (berri) {
        (berri as HTMLElement).style.opacity = cursorVisible ? '1' : '0.0';
    }
}, 500);
```

Also add the dot blink during the typing phase — each character typed makes the dot pulse briefly. The dot's idle blink starts only after typing completes.

- **Step 2: Clean up blink interval on scroll start**

The blink should stop once the user starts scrolling (the scroll-driven phases take over). Add cleanup inside the ScrollTrigger `onUpdate` or at the start of the GSAP timeline:

```typescript
// Stop idle blink when scroll begins (phase 1b takes over)
ScrollTrigger.create({
    trigger: pinContainer,
    start: 'top top',
    end: '+=1200%',
    pin: true,
    scrub: 1,
    animation: tl,
    onEnter: () => {
        clearInterval(blinkInterval);
    }
});
```

Store `blinkInterval` in the component scope and add it to the `cleanup` function.

- **Step 3: Test visually**

Open `http://localhost:5173/` and verify:

- On load: dot and cursor blink in sync (500ms)
- On scroll start: blink stops, scroll animation takes over seamlessly
- **Step 4: Run tests**

Run: `bun run test && bun run check`
Expected: All pass.

- **Step 5: Commit**

```bash
git add src/lib/components/HeroBanner.svelte
git commit -m "feat(slice-13a): sync berri-uqam dot blink with typewriter cursor"
```

### Task 4: Install Lenis and set up smooth scroll

**Files:**

- Create: `src/lib/motion/utils/lenis.ts`
- Modify: `src/routes/+layout.svelte`
- **Step 1: Install Lenis**

```bash
bun add lenis
```

- **Step 2: Create Lenis utility module**

Create `src/lib/motion/utils/lenis.ts`:

```typescript
// Lenis smooth scroll initialization with GSAP ScrollTrigger bridge.
// Initialized once at layout level. All ScrollTrigger instances automatically
// use Lenis scroll position instead of native scroll.

import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap.js';

let instance: Lenis | null = null;

export function initLenis(): Lenis {
	if (instance) return instance;

	instance = new Lenis({
		duration: 1.2,
		easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
		touchMultiplier: 2,
	});

	// Bridge: Lenis scroll events update GSAP ScrollTrigger
	instance.on('scroll', ScrollTrigger.update);

	// Drive Lenis from GSAP's RAF ticker for frame-perfect sync
	gsap.ticker.add((time: number) => {
		instance?.raf(time * 1000);
	});
	gsap.ticker.lagSmoothing(0);

	return instance;
}

export function destroyLenis(): void {
	if (!instance) return;
	gsap.ticker.remove(instance.raf);
	instance.destroy();
	instance = null;
}

export function getLenis(): Lenis | null {
	return instance;
}
```

- **Step 3: Initialize Lenis in layout**

In `src/routes/+layout.svelte`, add Lenis initialization:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { initLenis, destroyLenis } from '$lib/motion/utils/lenis.js';
	// ... existing imports ...

	onMount(() => {
		if (browser) {
			initLenis();
		}
		return () => {
			destroyLenis();
		};
	});
</script>
```

Add the required Lenis CSS import in `src/app.css`:

```css
@import 'lenis/dist/lenis.css';
```

- **Step 4: Verify smooth scroll works**

Open `http://localhost:5173/` and scroll — should feel butter-smooth compared to native scroll. Check that existing ScrollTrigger animations (hero, services) still work correctly.

- **Step 5: Run tests and check**

Run: `bun run test && bun run check`
Expected: All pass. Lenis is client-side only so SSR should be unaffected.

- **Step 6: Commit**

```bash
git add src/lib/motion/utils/lenis.ts src/routes/+layout.svelte src/app.css package.json bun.lockb
git commit -m "feat(slice-13a): install lenis smooth scroll with GSAP ScrollTrigger bridge"
```

### Task 5: Tear down old home page sections

**Files:**

- Modify: `src/routes/+page.svelte` (major rewrite)

Remove all sections below the hero except the structural wrapper. Keep the Hero, remove everything else. SkillsJourney import stays but is not rendered.

- **Step 1: Rewrite +page.svelte**

Strip `+page.svelte` down to the hero + placeholder for new sections:

```svelte
<!--
  Home page: Slice 13 redesign — full-bleed kinetic experience.
  7 sections: Hero, Manifesto, Proof Reel, Services, Blog Teaser, About Strip, Dual CTA.
  All scroll-driven GSAP animation. Lenis smooth scroll. Zero side margins.
-->
<script lang="ts">
	import HeroBanner from '$lib/components/HeroBanner.svelte';
</script>

<svelte:head>
</svelte:head>

<div data-testid="app-root">
	<!-- Scrollable content — full-bleed, no side margins -->
	<div class="relative z-30">
		<!-- Section 1: Hero (metro SVG animation) -->
		<HeroBanner />

		<!-- Sections 2-7 added in sub-slices 13b-13f -->
	</div>
</div>
```

This removes:

- `ServiceStation` loop and imports
- `FeaturedWork` import and usage
- `AboutBento` import and usage
- `BlogFeed` import and usage
- `GradientSeparator` imports and usage
- `SkillsJourney` usage (import removed — component stays in codebase)
- Three.js fixed gradient background div
- Warm glow overlay div
- `localProgress` state and scroll tracking
- `serviceActiveIndex` derived state
- `onMount` ScrollTrigger for progress tracking
- Terminal CTA section
- **Step 2: Remove unused imports from data barrel**

In `+page.svelte`, the old imports (`services`, `TOTAL_STOPS`, `formatStopLabel`, `formatServicesLabel`, `getStopByType`, `ctaContent`, `resolveLocale`, `prefersReducedMotion`, `registerGsapPlugins`, `gsap`, `ScrollTrigger`, `magnetic`, `reveal`, `siteMeta`) are no longer needed. Only `HeroBanner` remains.

- **Step 3: Run tests and check**

Run: `bun run test && bun run check`
Expected: Pass. Some smoke tests may need updating if they assert on removed sections.

- **Step 4: Update smoke tests if needed**

Check `tests/smoke.spec.ts` for assertions about removed sections (ServiceStation, FeaturedWork, AboutBento, BlogFeed, terminal CTA). Remove or update those assertions.

- **Step 5: Commit**

```bash
git add src/routes/+page.svelte tests/smoke.spec.ts
git commit -m "feat(slice-13a): strip home page to hero only — teardown for redesign"
```

### Task 6: Visual verification and session close

- **Step 1: Run full test suite**

Run: `bun run test && bun run check`
Expected: All pass.

- **Step 2: Visual verification**

Open `http://localhost:5173/` and verify:

- Hero animation plays with correct "DIGITAL INFRA." headline
- SQL decoration shows 3-line formatted query with alias
- Dot and cursor blink in sync before scrolling
- Scroll animation starts immediately (no dead space)
- Smooth scroll active (Lenis)
- Below hero: empty (old sections removed)
- Background: solid `#141414` (no Three.js gradient)
- Other pages (`/services`, `/about`, `/work`, `/blog`) unaffected
- **Step 3: Commit the full sub-slice**

```bash
git add -A
git commit -m "feat(slice-13a): foundation — hero fixes, lenis, teardown for home redesign"
```

---

## Sub-slice 13b: Hero Viewport Height Fix

> **Goal:** Fix hero scroll animation shifting on mobile browsers when browser chrome (address bar, toolbar) hides/shows. Replace `100vh`/`h-screen` with modern viewport units.

### Task 1: Replace viewport height units in HeroBanner

**Files:**

- Modify: `src/lib/components/HeroBanner.svelte`
- **Step 1:** Replace `h-screen` with `h-[100svh]` on pin container (with `100vh` fallback)
- **Step 2:** Update `min-height` on outer section to use `100svh` for reduced-motion branch
- **Step 3:** Add `padding-bottom: env(safe-area-inset-bottom, 0px)` for notched devices
- **Step 4:** Run `bun run test && bun run check`

### Task 2: Add CSS viewport height fallback utility

**Files:**

- Modify: `src/app.css`
- **Step 1:** Add `--vh-full: 100svh` custom property with `@supports not` fallback to `100vh`
- **Step 2:** Run `bun run test && bun run check`

**Full spec:** `docs/slices/slice-13b-viewport-fix.md`

---

## Sub-slice 13c: Manifesto Section

> **Session start:** Brainstorm exact manifesto text, SplitText animation style, pill design, and mobile layout using visual companion before writing any code.

### Task 1: Brainstorm manifesto design

- **Step 1: Open visual companion and brainstorm**

Design the exact manifesto text, animation timing, pill styling, and responsive behavior. Get Yesid's approval on the design before proceeding.

### Task 2: Add manifestoContent to data layer

**Files:**

- Modify: `src/lib/data/content.ts`
- **Step 1: Add manifestoContent**

Add the brainstormed manifesto text and capability pills to `content.ts` as `LocalizedString` values. Include pill labels that map to service IDs for deep-linking.

- **Step 2: Run tests**

Run: `bun run test`

### Task 3: Create Manifesto component

**Files:**

- Create: `src/lib/components/Manifesto.svelte`
- Create: `src/lib/components/Manifesto.test.ts`
- **Step 1: Write failing test**

Test that the component renders the manifesto text and capability pills. Test that pills link to `/services/[id]`.

- **Step 2: Implement Manifesto.svelte**

Full-viewport section, centered text, SplitText char-by-char reveal on scroll. Capability pills below with staggered entrance. All content from `manifestoContent`.

- **Step 3: Run test to verify pass**

Run: `bun run test`

### Task 4: Integrate into home page

**Files:**

- Modify: `src/routes/+page.svelte`
- **Step 1: Import and add Manifesto after HeroBanner**
- **Step 2: Visual verification at desktop and mobile**
- **Step 3: Commit**

---

## Sub-slice 13d: Proof Reel

> **Session start:** Brainstorm card layout, which projects to feature, how impact metrics display, hover effects, and mobile stacking using visual companion.

### Task 1: Brainstorm proof reel design

- **Step 1: Design with visual companion — card layout, metrics display, animation**

### Task 2: Create ProofReel component

**Files:**

- Create: `src/lib/components/ProofReel.svelte`
- Create: `src/lib/components/ProofReel.test.ts`
- **Step 1: Write failing test** — renders featured projects, shows impact metrics, links to `/work/[slug]`
- **Step 2: Implement ProofReel.svelte** — full-bleed cards, scroll-linked entrance, parallax
- **Step 3: Run tests**

### Task 3: Integrate and verify

- **Step 1: Add to +page.svelte after Manifesto**
- **Step 2: Visual verification**
- **Step 3: Commit**

---

## Sub-slice 13e: Services Grid

> **Session start:** Brainstorm grid layout, card hover effects, whether to use existing service SVGs, and mobile behavior using visual companion.

### Task 1: Brainstorm services grid design

- **Step 1: Design with visual companion — grid layout, hover, SVG usage**

### Task 2: Create HomeServices component

**Files:**

- Create: `src/lib/components/HomeServices.svelte`
- Create: `src/lib/components/HomeServices.test.ts`
- **Step 1: Write failing test** — renders all 6 services, links to `/services/[id]`
- **Step 2: Implement HomeServices.svelte** — 3×2 grid, staggered reveal, hover expand
- **Step 3: Run tests**

### Task 3: Integrate and verify

- **Step 1: Add to +page.svelte after ProofReel**
- **Step 2: Visual verification**
- **Step 3: Commit**

---

## Sub-slice 13f: Blog Teaser + About Strip

> **Session start:** Brainstorm blog teaser format (titles only? with dates? horizontal or vertical?), about strip narrative text, and photo/avatar treatment using visual companion.

### Task 1: Brainstorm blog teaser and about strip design

- **Step 1: Design blog teaser format with visual companion**
- **Step 2: Brainstorm about narrative text with Yesid** — "grew up behind screens" story, refined into compelling English copy

### Task 2: Add aboutStripContent to data layer

**Files:**

- Modify: `src/lib/data/content.ts`
- **Step 1: Add aboutStripContent** with brainstormed narrative text

### Task 3: Create BlogTeaser component

**Files:**

- Create: `src/lib/components/BlogTeaser.svelte`
- Create: `src/lib/components/BlogTeaser.test.ts`
- **Step 1: Write failing test** — renders 2-3 latest posts, links to `/blog/[category]/[slug]`
- **Step 2: Implement BlogTeaser.svelte** — minimal strip, post titles + dates
- **Step 3: Run tests**

### Task 4: Create AboutStrip component

**Files:**

- Create: `src/lib/components/AboutStrip.svelte`
- Create: `src/lib/components/AboutStrip.test.ts`
- **Step 1: Write failing test** — renders name, title, narrative, link to `/about`
- **Step 2: Implement AboutStrip.svelte** — photo, name, narrative text, CTA link
- **Step 3: Run tests**

### Task 5: Integrate and verify

- **Step 1: Add both to +page.svelte after HomeServices**
- **Step 2: Visual verification**
- **Step 3: Commit**

---

## Sub-slice 13g: Dual CTA

> **Session start:** Brainstorm CTA layout, button copy, background glow effect, and social links styling using visual companion.

### Task 1: Brainstorm CTA design

- **Step 1: Design with visual companion — layout, glow, button styling**

### Task 2: Update ctaContent in data layer

**Files:**

- Modify: `src/lib/data/content.ts`
- **Step 1: Extend ctaContent** — add subtitle about freelance + full-time, dual button labels

### Task 3: Create HomeCta component

**Files:**

- Create: `src/lib/components/HomeCta.svelte`
- Create: `src/lib/components/HomeCta.test.ts`
- **Step 1: Write failing test** — renders heading, dual buttons, social links
- **Step 2: Implement HomeCta.svelte** — magnetic buttons, orange glow, social row
- **Step 3: Run tests**

### Task 4: Integrate and verify

- **Step 1: Add to +page.svelte as final section**
- **Step 2: Visual verification**
- **Step 3: Commit**

---

## Sub-slice 13h: Polish Pass

> **Session start:** Review full page flow from hero to CTA. Identify transition issues, mobile problems, performance bottlenecks.

### Task 1: Section transitions

- **Step 1: Review scroll flow** — verify seamless transitions between all 7 sections
- **Step 2: Add transition effects** where sections meet (fade, parallax, or overlap)
- **Step 3: Tune Lenis scroll parameters** if any section feels off

### Task 2: Mobile QA

- **Step 1: Test at 375px (iPhone SE)** — verify all sections stack correctly
- **Step 2: Test at 768px (tablet)** — verify grid layouts adapt
- **Step 3: Fix any overflow, clipping, or spacing issues**

### Task 3: Performance

- **Step 1: Check ScrollTrigger count** — ensure no leaked triggers from hot reloads
- **Step 2: Test reduced motion** — verify all sections render statically
- **Step 3: Lighthouse audit** — check performance score

### Task 4: Final commit

- **Step 1: Run full test suite**: `bun run test && bun run check`
- **Step 2: Commit**

---

## Sub-slice 13i: Closing

### Task 1: Documentation

- **Step 1: Write handoff report** using `docs/handoffs/_TEMPLATE.md`
- **Step 2: Write devlog entry** using `docs/devlog/_TEMPLATE.md`
- **Step 3: Update `docs/ARCHITECTURE.md`** — new home page section architecture
- **Step 4: Update `docs/CSS.md`** — any new tokens, Lenis CSS
- **Step 5: Update `docs/TESTS.md`** — new test files for all 6 components
- **Step 6: Update `docs/learn/`** — Lenis, SplitText, smooth scroll concepts

### Task 2: Update README and tree

- **Step 1: Update `README.md`** if setup changed (Lenis dependency)
- **Step 2: Regenerate `tree.txt`**:

```powershell
cmd /c "tree /F /A | findstr /V /C:"node_modules" /C:".git" /C:".remember" /C:"bun.lockb" /C:".svelte-kit" /C:".vercel" /C:".DS_Store" > tree.txt"
```

### Task 3: Final commit and push

- **Step 1: Run final tests**: `bun run test && bun run check`
- **Step 2: Commit and push**:

```bash
git add -A && git commit -m "feat: complete slice 13 — home page redesign" && git push
```

