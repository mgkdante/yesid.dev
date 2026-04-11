# Scroll-Linked Video Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3D Three.js wagon in the hero card with a scroll-linked video + optional GSAP code overlays, keeping the 3D code as a fallback.

**Architecture:** New `HeroVideoCard.svelte` component receives `scrollProgress` (0-1) and maps it to `<video>.currentTime`. HeroBanner swaps one import. WagonScene stays in the codebase untouched. Overlays are a toggleable GSAP layer on top of the video.

**Tech Stack:** Native `<video>` element, GSAP (already installed), Svelte 5 runes (`$props`, `$effect`), existing `prefersReducedMotion` store.

**Design spec:** `docs/superpowers/specs/2026-04-03-hero-video-overlays-design.md`

**EXPERIMENTAL:** This is exploratory. The rollback path is reverting HeroBanner to import WagonScene. Build for easy pivot.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `static/video/` | Create dir | Video assets directory |
| `static/video/hero-train-poster.webp` | Create (placeholder) | Poster frame for video |
| `src/lib/components/HeroVideoCard.svelte` | **Create** | Scroll-linked video + code overlays |
| `src/lib/components/HeroVideoCard.test.ts` | **Create** | Unit tests for HeroVideoCard |
| `src/lib/components/HeroBanner.svelte` | **Modify** | Swap WagonScene → HeroVideoCard |
| `src/routes/home.test.ts` | **Modify** | Update if any hero assertions break |
| `docs/devlog/2026-04-03.md` | **Modify** | Append session notes |
| `tree.txt` | **Modify** | Regenerate |

**Not changed:** `WagonScene.svelte`, `WagonInner.svelte`, `+page.svelte`, `package.json`.

---

## Prerequisites (Yesid — Manual)

Before Task 1 can run with real video, Yesid must:
1. Export WebM (VP9, ~2-4MB) → `static/video/hero-train.webm`
2. Export MP4 (H.264, ~3-6MB) → `static/video/hero-train.mp4`
3. Extract poster frame → `static/video/hero-train-poster.webp`

**If videos aren't ready yet:** Tasks 1-4 use a placeholder approach — the component is built and tested with a mock video element. Real video files are dropped in later and it just works.

---

### Task 1: Create video directory + placeholder poster

**Files:**
- Create: `static/video/` directory
- Create: `static/video/hero-train-poster.webp` (placeholder)

- [ ] **Step 1: Create the video directory**

```bash
mkdir -p static/video
```

- [ ] **Step 2: Create a 1x1 placeholder poster image**

We need a file at the poster path so the component doesn't 404 during dev. Yesid replaces this later with a real frame.

```bash
# Create a minimal 1x1 orange WebP placeholder (26 bytes)
printf 'RIFF\x24\x00\x00\x00WEBPVP8 \x18\x00\x00\x000\x01\x00\x9d\x01\x2a\x01\x00\x01\x00\x01\x40\x25\xa4\x00\x03p\x00\xfe\xfb\x94\x00\x00' > static/video/hero-train-poster.webp
```

If the binary approach fails, just create an empty file:
```bash
touch static/video/hero-train-poster.webp
```

- [ ] **Step 3: Commit**

```bash
git add static/video/
git commit -m "$(cat <<'EOF'
chore: add static/video directory with placeholder poster

Preparing for scroll-linked video hero (slice 06f).
Yesid will replace the placeholder poster with a real frame.
EOF
)"
```

---

### Task 2: Write HeroVideoCard tests (RED)

**Files:**
- Create: `src/lib/components/HeroVideoCard.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HeroVideoCard from './HeroVideoCard.svelte';

describe('HeroVideoCard', () => {
	it('renders a video element with correct attributes', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0 }
		});

		const video = container.querySelector('video');
		expect(video).toBeInTheDocument();
		expect(video?.getAttribute('playsinline')).not.toBeNull();
		expect(video?.muted).toBe(true);
		expect(video?.getAttribute('preload')).toBe('auto');
	});

	it('renders WebM and MP4 source elements', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0 }
		});

		const sources = container.querySelectorAll('video source');
		expect(sources).toHaveLength(2);

		const types = Array.from(sources).map((s) => s.getAttribute('type'));
		expect(types).toContain('video/webm');
		expect(types).toContain('video/mp4');
	});

	it('renders a poster attribute on the video', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0 }
		});

		const video = container.querySelector('video');
		expect(video?.getAttribute('poster')).toBe('/video/hero-train-poster.webp');
	});

	it('has data-testid for integration tests', () => {
		render(HeroVideoCard, {
			props: { scrollProgress: 0 }
		});

		expect(screen.getByTestId('hero-video-card')).toBeInTheDocument();
	});

	it('renders overlay container when showOverlays is true', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0.5, showOverlays: true }
		});

		expect(container.querySelector('[data-testid="hero-overlays"]')).toBeInTheDocument();
	});

	it('hides overlay container when showOverlays is false', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0.5, showOverlays: false }
		});

		expect(container.querySelector('[data-testid="hero-overlays"]')).not.toBeInTheDocument();
	});

	it('defaults showOverlays to true', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0.5 }
		});

		expect(container.querySelector('[data-testid="hero-overlays"]')).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
bun run test -- src/lib/components/HeroVideoCard.test.ts
```

Expected: FAIL — `HeroVideoCard.svelte` does not exist yet.

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/lib/components/HeroVideoCard.test.ts
git commit -m "$(cat <<'EOF'
test: add HeroVideoCard tests (RED)

Tests for scroll-linked video component: video attributes,
source elements, poster, overlays toggle, testid.
EOF
)"
```

---

### Task 3: Implement HeroVideoCard (GREEN)

**Files:**
- Create: `src/lib/components/HeroVideoCard.svelte`

- [ ] **Step 1: Create the component**

```svelte
<!--
  HeroVideoCard: scroll-linked video with optional GSAP code overlays.

  Drop-in replacement for WagonScene in the hero card. Receives the same
  scrollProgress prop (0-1) and maps it to <video>.currentTime.

  WHY a separate component (not inline in HeroBanner):
    - Swappable: reverting to WagonScene is a one-line import change
    - Testable: isolated unit tests for video behavior
    - Experimental: may be replaced or heavily iterated
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from '$lib/motion/utils/gsap.js';

	let {
		scrollProgress = 0,
		showOverlays = true,
		reducedMotion = false
	}: {
		scrollProgress?: number;
		showOverlays?: boolean;
		reducedMotion?: boolean;
	} = $props();

	let videoEl: HTMLVideoElement | undefined = $state(undefined);
	let overlayContainer: HTMLDivElement | undefined = $state(undefined);

	// Map scroll progress to video currentTime.
	// requestVideoFrameCallback would be ideal but has poor Safari support —
	// direct currentTime assignment is the proven pattern (Apple.com uses it).
	$effect(() => {
		if (reducedMotion) return;
		if (!videoEl || !videoEl.duration || isNaN(videoEl.duration)) return;
		videoEl.currentTime = scrollProgress * videoEl.duration;
	});

	// GSAP overlay animations — fade SQL fragments in/out at scroll thresholds.
	// Each overlay has an opacity driven by its own scroll range.
	onMount(() => {
		if (reducedMotion || !showOverlays || !overlayContainer) return;

		const overlays = overlayContainer.querySelectorAll<HTMLElement>('[data-overlay]');
		overlays.forEach((el) => {
			// Initial state: invisible
			gsap.set(el, { opacity: 0, y: 10 });
		});

		return () => {
			// Cleanup: kill any active tweens on unmount
			overlays.forEach((el) => gsap.killTweensOf(el));
		};
	});

	// Animate overlays based on scrollProgress thresholds
	$effect(() => {
		if (reducedMotion || !showOverlays || !overlayContainer) return;

		const overlays = overlayContainer.querySelectorAll<HTMLElement>('[data-overlay]');
		overlays.forEach((el) => {
			const start = parseFloat(el.dataset.start ?? '0');
			const end = parseFloat(el.dataset.end ?? '1');
			const inRange = scrollProgress >= start && scrollProgress <= end;
			const progress = inRange
				? Math.min(1, (scrollProgress - start) / (Math.min(end, start + 0.1) - start))
				: 0;

			gsap.to(el, {
				opacity: progress,
				y: inRange ? 0 : 10,
				duration: 0.3,
				overwrite: 'auto'
			});
		});
	});
</script>

<div class="absolute inset-0" data-testid="hero-video-card">
	<!-- Layer 1: Scroll-linked video -->
	<video
		bind:this={videoEl}
		muted
		playsinline
		preload="auto"
		poster="/video/hero-train-poster.webp"
		class="absolute inset-0 h-full w-full rounded-2xl object-cover"
	>
		<source src="/video/hero-train.webm" type="video/webm" />
		<source src="/video/hero-train.mp4" type="video/mp4" />
	</video>

	<!-- Layer 2: Code overlays (optional) -->
	{#if showOverlays}
		<div
			bind:this={overlayContainer}
			class="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
			data-testid="hero-overlays"
		>
			<!-- SQL fragment: SELECT -->
			<span
				data-overlay
				data-start="0.05"
				data-end="0.35"
				class="absolute left-4 top-4 font-mono text-xs text-[#E07800]/70 drop-shadow-[0_0_8px_rgba(224,120,0,0.4)] md:text-sm"
			>
				SELECT * FROM expertise
			</span>

			<!-- SQL fragment: JOIN -->
			<span
				data-overlay
				data-start="0.25"
				data-end="0.6"
				class="absolute bottom-6 right-4 font-mono text-xs text-[#FFB627]/60 drop-shadow-[0_0_8px_rgba(255,182,39,0.3)] md:text-sm"
			>
				JOIN solutions ON need = skill
			</span>

			<!-- SQL fragment: WHERE -->
			<span
				data-overlay
				data-start="0.45"
				data-end="0.8"
				class="absolute left-6 bottom-1/3 font-mono text-xs text-[#E07800]/50 drop-shadow-[0_0_6px_rgba(224,120,0,0.3)] md:text-sm"
			>
				WHERE quality = 'production'
			</span>
		</div>
	{/if}
</div>
```

- [ ] **Step 2: Run the tests to verify they pass**

```bash
bun run test -- src/lib/components/HeroVideoCard.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 3: Run the full test suite to check nothing is broken**

```bash
bun run test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/HeroVideoCard.svelte
git commit -m "$(cat <<'EOF'
feat: add HeroVideoCard with scroll-linked video + code overlays

Scroll-linked <video> driven by scrollProgress prop (0-1).
Optional GSAP-animated SQL fragment overlays toggle via showOverlays prop.
Reduced motion shows poster frame only.
Same prop interface as WagonScene for easy swap-back.
EOF
)"
```

---

### Task 4: Swap HeroBanner to use HeroVideoCard

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte` (lines 1-50, 136-161)

- [ ] **Step 1: Update the script section**

In `src/lib/components/HeroBanner.svelte`, replace the script block. Remove the dynamic WagonScene import and add HeroVideoCard:

Replace lines 1-50 (the entire opening comment + `<script>` block) with:

```svelte
<!--
  Hero banner: split layout with bold typography left, scroll-linked video right.
  Three layers:
    1. Transparent — lets the fixed gradient from +page.svelte show through
    2. Content: badge, headline, subtitle, CTAs, SQL decoration
    3. Contained video card: art background + scroll-linked video in a rounded box

  The video component maps scrollProgress to <video>.currentTime for a
  cinematic scroll-linked playback effect.
-->
<script lang="ts">
	import { heroContent, formatStopLabel, getStopByType } from '$lib/data';
	import { resolveLocale } from '$lib/data/locale.js';
	import { magnetic } from '$lib/motion/actions/magnetic.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { prefersReducedMotion } from '$lib/motion/stores';
	import HeroVideoCard from './HeroVideoCard.svelte';
	import ScrollPrompt from './ScrollPrompt.svelte';

	// Resolve hero content for current locale
	const badge = resolveLocale(heroContent.badge, 'en');
	const h1 = resolveLocale(heroContent.headline.line1, 'en');
	const h2 = resolveLocale(heroContent.headline.line2, 'en');
	const h3 = resolveLocale(heroContent.headline.line3, 'en');
	const subtitle = resolveLocale(heroContent.subtitle, 'en');
	const ctaWork = resolveLocale(heroContent.ctaWork, 'en');
	const ctaContact = resolveLocale(heroContent.ctaContact, 'en');
	const sql1 = resolveLocale(heroContent.sqlDecoration.line1, 'en');
	const sql2 = resolveLocale(heroContent.sqlDecoration.line2, 'en');
	const departureLabel = formatStopLabel(getStopByType('hero')!);

	let {
		scrollProgress = 0
	}: {
		scrollProgress?: number;
	} = $props();
</script>
```

- [ ] **Step 2: Update the hero card section**

Replace the right-side 3D card (lines 136-159 in the original) — the `<!-- Right side: contained 3D card -->` section. Find:

```svelte
		<!-- Right side: contained 3D card (visible on all viewports) -->
		<div class="w-full max-w-lg md:w-[55%] md:flex-shrink-0" use:reveal={{ delay: 300 }}>
			<div class="relative aspect-[4/3] w-full rounded-2xl border border-[#2a2a2a]/50 shadow-[0_0_40px_rgba(224,120,0,0.08)]">
				<!-- Art background inside card (clipped to rounded corners) -->
				<div class="absolute inset-0 overflow-hidden rounded-2xl">
					<div
						class="absolute inset-0"
						style="
							background-image: url('/images/hero-station-art.webp');
							background-size: cover;
							background-position: center;
						"
					>
						<div class="absolute inset-0 bg-[#141414]/30"></div>
					</div>
				</div>

				<!-- 3D wagon — allowed to overflow the card for a pop-out 3D effect -->
				<div class="pointer-events-none absolute inset-[-15%]">
					{#if WagonScene}
						<WagonScene {scrollProgress} reducedMotion={false} />
					{/if}
				</div>
			</div>
		</div>
```

Replace with:

```svelte
		<!-- Right side: contained video card (visible on all viewports) -->
		<div class="w-full max-w-lg md:w-[55%] md:flex-shrink-0" use:reveal={{ delay: 300 }}>
			<div class="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#2a2a2a]/50 shadow-[0_0_40px_rgba(224,120,0,0.08)]">
				<!-- Art background inside card (clipped to rounded corners) -->
				<div class="absolute inset-0 overflow-hidden rounded-2xl">
					<div
						class="absolute inset-0"
						style="
							background-image: url('/images/hero-station-art.webp');
							background-size: cover;
							background-position: center;
						"
					>
						<div class="absolute inset-0 bg-[#141414]/30"></div>
					</div>
				</div>

				<!-- Scroll-linked video + code overlays -->
				<HeroVideoCard
					{scrollProgress}
					reducedMotion={$prefersReducedMotion}
				/>
			</div>
		</div>
```

- [ ] **Step 3: Run all tests**

```bash
bun run test
```

Expected: All tests pass. The home.test.ts tests should still pass because they don't check for canvas/3D elements — they check for `hero-banner`, heading text, badge, etc.

- [ ] **Step 4: Run type check**

```bash
bun run check
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/HeroBanner.svelte
git commit -m "$(cat <<'EOF'
feat: swap hero 3D wagon for scroll-linked video card

HeroBanner now uses HeroVideoCard instead of WagonScene.
WagonScene kept in codebase for /preview routes and as fallback.
Swap back is a one-import revert.
EOF
)"
```

---

### Task 5: Update home tests if needed

**Files:**
- Modify: `src/routes/home.test.ts` (only if Task 4 tests reveal failures)

- [ ] **Step 1: Run the home test suite and check for failures**

```bash
bun run test -- src/routes/home.test.ts
```

If all pass → skip to Step 3.

If any fail, it's likely because HeroVideoCard imports `prefersReducedMotion` which uses `window.matchMedia` — this is already stubbed in `src/tests/setup.ts` (line 44), so it should work. If there's a failure related to the video element or stores, investigate the specific error.

- [ ] **Step 2: Fix any failing tests**

Most likely fix: if the test environment can't resolve the HeroVideoCard import chain, add any needed mocks to `src/tests/setup.ts`. The existing `matchMedia` stub and GSAP mocks should cover it.

- [ ] **Step 3: Commit (only if changes were made)**

```bash
git add src/routes/home.test.ts src/tests/setup.ts
git commit -m "$(cat <<'EOF'
test: update home tests for video hero swap
EOF
)"
```

---

### Task 6: Dev log + tree.txt + docs

**Files:**
- Modify: `docs/devlog/2026-04-03.md`
- Modify: `tree.txt`

- [ ] **Step 1: Append to the dev log**

Add a new session section to `docs/devlog/2026-04-03.md`:

```markdown
## Slice: 06f — Scroll-Linked Video Hero

### Session Start
- **Time:** [current time]
- **Slice spec:** docs/slices/slice-06f-video-hero.md
- **Design spec:** docs/superpowers/specs/2026-04-03-hero-video-overlays-design.md
- **Goal:** Replace 3D wagon with scroll-linked video + code overlays (experimental)

### Work Done
- [ ] Created `src/lib/components/HeroVideoCard.svelte` — scroll-linked video + GSAP overlays
  - Files created: `src/lib/components/HeroVideoCard.svelte`, `src/lib/components/HeroVideoCard.test.ts`
  - Decision: Built as standalone swappable component (same prop interface as WagonScene)
  - Decision: Overlays use data attributes for scroll thresholds (easy to tweak without code changes)
  - Learning note: Scroll-linked video = setting `<video>.currentTime` from scroll progress. Same concept as scroll-linked Lottie but with time instead of frames.

- [ ] Modified `src/lib/components/HeroBanner.svelte` — swapped WagonScene for HeroVideoCard
  - Files changed: `src/lib/components/HeroBanner.svelte`
  - Decision: Removed dynamic import pattern (video doesn't need it — no WebGL)
  - Decision: Kept WagonScene files untouched for fallback

- [ ] Created `static/video/` directory with placeholder poster
  - Files created: `static/video/hero-train-poster.webp`
  - Note: Yesid replaces with real WebM + MP4 + poster from Google Flow

### Blockers / Questions
- **VIDEO FILES NEEDED:** Yesid must export WebM + MP4 + poster frame to `static/video/`
- Overlay content is placeholder — iterate on text/positioning after seeing it with real video

### Session End
- **Files created:** HeroVideoCard.svelte, HeroVideoCard.test.ts, static/video/
- **Files modified:** HeroBanner.svelte
- **Tests passing:** yes
- **Ready for handoff:** no (waiting for video assets + Yesid testing on localhost)
```

- [ ] **Step 2: Regenerate tree.txt**

```bash
cmd /c "tree /F /A | findstr /V /C:"node_modules" /C:".git" /C:".remember" /C:"bun.lockb" /C:".svelte-kit" /C:".vercel" /C:".DS_Store" > tree.txt"
```

- [ ] **Step 3: Commit**

```bash
git add docs/devlog/2026-04-03.md tree.txt
git commit -m "$(cat <<'EOF'
docs: update dev log and tree for video hero (slice 06f)
EOF
)"
```

---

### Task 7: Visual verification on localhost

**Files:** None — this is a verification task.

- [ ] **Step 1: Ensure dev server is running**

```bash
bun run dev
```

- [ ] **Step 2: Open http://localhost:5173/ and verify**

Check the following:
1. Hero card area shows the poster image (or blank if placeholder) — not the 3D wagon
2. No console errors related to video or GSAP
3. Scroll down — if video files exist, video should advance. If placeholder, card stays static (expected)
4. SQL overlay text appears/disappears at scroll thresholds (if video is playing)
5. All other sections still work: services, featured work, about, blog, CTA
6. Right rail + train journey animation still works
7. Mobile viewport: card stacks below text

- [ ] **Step 3: Check /preview/train still works**

Navigate to `http://localhost:5173/preview/train` — the 3D wagon should still render there.

- [ ] **Step 4: Report to Yesid for iteration**

Tell Yesid what to check and ask for feedback. This is the iteration protocol — do NOT write the handoff report yet.

---

## Verification Summary

| Check | Command / Action |
|-------|-----------------|
| Unit tests pass | `bun run test` |
| Type check passes | `bun run check` |
| Hero shows video (not 3D) | Open localhost:5173, look at hero card |
| Scroll-linked playback | Scroll slowly, video advances |
| Overlays toggle | Set `showOverlays={false}` in HeroBanner, verify no SQL text |
| Reduced motion | Enable OS reduced motion, verify poster only |
| Mobile layout | Resize to mobile, card stacks below text |
| 3D preview intact | Open localhost:5173/preview/train |
| No regressions | All existing tests still pass |

## Rollback

If Yesid decides to abandon the video approach:

```svelte
<!-- In HeroBanner.svelte, revert to: -->
import type { Component } from 'svelte';
// ... restore dynamic WagonScene import from git history
```

Delete `HeroVideoCard.svelte`, `HeroVideoCard.test.ts`, and `static/video/`. Done.
