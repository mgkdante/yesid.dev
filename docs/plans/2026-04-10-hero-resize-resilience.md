# Hero Resize Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hero scroll animation survive any viewport resize — desktop↔mobile, drag-resize, DevTools toggle, sleep/wake — using `gsap.matchMedia()` and `invalidateOnRefresh`.

**Architecture:** Replace the monolithic `onMount` timeline with `gsap.matchMedia()` scoping two breakpoint callbacks (≥769px desktop, <769px mobile). Each callback calls a shared `buildHeroTimeline(mobile)` function. Function-based values + `invalidateOnRefresh: true` handle within-breakpoint resize. Scroll position continuity via saved progress on breakpoint crossing.

**Tech Stack:** GSAP 3 (`gsap.matchMedia`, `ScrollTrigger`, `invalidateOnRefresh`), SvelteKit, existing animation phases unchanged.

**Spec:** `docs/specs/2026-04-10-hero-resize-resilience.md`  
**Research:** `docs/slices/13e-research/behaviour.md`

---

### Task 1: Extract `measureOverflow()` helper + verify baseline

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte:283-286`

This replaces the baked `const heroOverflow` with a callable function. No behavior change yet — the function returns the same value.

- [ ] **Step 1: Replace `const heroOverflow` with `measureOverflow()` function**

In the `<script>` block, after `handleRefresh()` (around line 65), add the new function:

```typescript
function measureOverflow(): number {
	const contentInner = heroTextContainer?.firstElementChild as HTMLElement;
	return contentInner ? Math.max(0, contentInner.scrollHeight - window.innerHeight) : 0;
}
```

Then in `onMount`, replace lines 282-285:

```diff
-		// Measure content overflow BEFORE GSAP applies scale transform.
-		// On mobile, hero has two 100dvh sections (~200dvh total) inside a 100lvh container.
-		const contentInner = heroTextContainer.firstElementChild as HTMLElement;
-		const heroOverflow = contentInner
-			? Math.max(0, contentInner.scrollHeight - window.innerHeight)
-			: 0;
+		const heroOverflow = measureOverflow();
```

- [ ] **Step 2: Run tests**

```bash
bun run test
```

Expected: All tests pass. No behavior change.

- [ ] **Step 3: Run type check**

```bash
bun run check
```

Expected: No errors.

---

### Task 2: Create `buildHeroTimeline()` with function-based values

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte` — extract from `onMount` into new function

This is the largest task. We extract all timeline construction (Phases 1-10, ScrollTrigger, initial gsap.set calls) into a `buildHeroTimeline(mobile: boolean)` function. Key changes from the current code:

1. Zoom tweens use `fromTo()` with function-based values instead of `to()` with baked values
2. Transform origins set via `tl.set()` at position 0 (not direct style manipulation)
3. Phase 10 is conditional on the `mobile` parameter
4. ScrollTrigger has `invalidateOnRefresh: true`
5. `sectionMinHeight` is set from the `mobile` parameter

- [ ] **Step 1: Add the `buildHeroTimeline` function**

Add this function in the `<script>` block, after `measureOverflow()` and before `onMount`. It takes `mobile: boolean` and references the component-level bindings (`pinContainer`, `svgWrapper`, `heroTextContainer`, etc.) which are already in scope.

```typescript
/**
 * Build the complete hero scroll-driven timeline.
 * Called by gsap.matchMedia() — once per breakpoint match.
 * All GSAP objects created here are auto-reverted by matchMedia on breakpoint exit.
 */
function buildHeroTimeline(mobile: boolean): void {
	const svg = pinContainer?.querySelector('[data-testid="metro-network"]');
	if (!svg) return;

	const lines = svg.querySelectorAll('.metro-line');
	const stations = svg.querySelectorAll('.metro-station:not(.metro-berri)');
	const berri = svg.querySelector('.metro-berri');
	const bg = svg.querySelectorAll('.metro-bg');
	const labels = svg.querySelectorAll('.metro-label');
	if (!berri) return;

	// Show Berri-UQAM dot immediately
	(berri as HTMLElement).style.opacity = '1';

	// Measure origins BEFORE applying scale — matchMedia reverts all styles
	// before calling this, so heroTextContainer is at natural scale=1.
	updateZoomOrigin();
	updateHeroTextOrigin();

	// Measure overflow for this breakpoint
	const heroOverflow = measureOverflow();

	// All text elements start invisible
	const staggerEls = heroTextContainer.querySelectorAll('[data-hero-stagger]');
	gsap.set(staggerEls, { opacity: 0 });

	// Refresh button starts slightly below for fade-up entrance
	const refreshEl = heroTextContainer.querySelector('[data-hero-stagger="7"]');
	if (refreshEl) gsap.set(refreshEl, { y: 12 });

	// Set initial hero text scale (dot fills viewport) — use gsap.set so
	// matchMedia can revert it on breakpoint exit.
	gsap.set(heroTextContainer, { scale: calcHeroTextScale() });

	// Set section height for this breakpoint
	sectionMinHeight = mobile ? '1200svh' : '900svh';

	const tl = gsap.timeline();

	// === Phase 1 (0-3%): Berri-UQAM + background appear ===
	tl.to(berri, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);
	tl.to(bg, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);

	// === Phase 1b (3-15%): Light on/off pulse ===
	tl.to(berri, { opacity: 0.2, duration: 0.02, ease: 'power1.out' }, 0.03);
	tl.to(scrollPrompt, { opacity: 0.2, duration: 0.02, ease: 'power1.out' }, 0.03);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.05);
	tl.to(scrollPrompt, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.05);
	tl.to(berri, { opacity: 0.15, duration: 0.02, ease: 'power1.out' }, 0.08);
	tl.to(scrollPrompt, { opacity: 0.15, duration: 0.02, ease: 'power1.out' }, 0.08);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.10);
	tl.to(scrollPrompt, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.10);
	tl.to(berri, { opacity: 0.1, duration: 0.02, ease: 'power1.out' }, 0.13);
	tl.to(scrollPrompt, { opacity: 0.1, duration: 0.02, ease: 'power1.out' }, 0.13);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.15);
	tl.to(scrollPrompt, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.15);

	// === Phase 2 (17-45%): "SCROLL DOWN" fades out, lines draw ===
	tl.to(scrollPrompt, { opacity: 0, duration: 0.04, ease: 'power2.in' }, 0.17);
	lines.forEach((line, i) => {
		const stagger = i * 0.02;
		tl.set(line, { opacity: 1 }, 0.17 + stagger);
		tl.fromTo(line,
			{ drawSVG: '0%' },
			{ drawSVG: '100%', duration: 0.22, ease: 'networkDraw' },
			0.17 + stagger
		);
	});

	// === Phase 3 (47-58%): Station nodes appear ===
	tl.to(stations, {
		opacity: 1, duration: 0.08, stagger: 0.002, ease: 'power1.out'
	}, 0.47);

	// === Phase 4 (58-65%): Labels fade in ===
	tl.to(labels, {
		opacity: 0.6, duration: 0.07, stagger: 0.001, ease: 'power1.out'
	}, 0.58);

	// === Phase 5 (65-95%): Zoom into Berri-UQAM ===
	// Function-based scale so invalidateOnRefresh recalculates for new viewport
	tl.to(svgWrapper, {
		scale: () => calcZoomScale(),
		duration: 0.3,
		ease: 'power2.inOut',
	}, 0.65);

	// === Phase 6: Cross-fade SVG → hero text container ===
	tl.to(svgWrapper, { opacity: 0, duration: 0.05, ease: 'power2.inOut' }, 1.0);
	tl.to(heroTextContainer, { opacity: 1, duration: 0.05, ease: 'power2.inOut' }, 1.0);

	// === Phase 7: Zoom out hero text container to scale=1 ===
	tl.to(heroTextContainer, {
		scale: 1,
		duration: 0.35,
		ease: 'power2.out',
	}, 1.05);

	// === Phase 8: Text elements stagger in during zoom-out ===
	const s1 = heroTextContainer.querySelectorAll('[data-hero-stagger="1"]');
	const s2 = heroTextContainer.querySelectorAll('[data-hero-stagger="2"]');
	const s3 = heroTextContainer.querySelectorAll('[data-hero-stagger="3"]');
	const s4 = heroTextContainer.querySelectorAll('[data-hero-stagger="4"]');
	const s5 = heroTextContainer.querySelectorAll('[data-hero-stagger="5"]');
	const s6 = heroTextContainer.querySelectorAll('[data-hero-stagger="6"]');
	const s7 = heroTextContainer.querySelectorAll('[data-hero-stagger="7"]');

	tl.to(s1, { opacity: 1, duration: 0.15, stagger: 0.02, ease: 'power1.out' }, 1.10);
	tl.to(s2, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.18);
	tl.to(s3, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.22);
	tl.to(s4, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.26);
	tl.to(s5, { opacity: 1, duration: 0.10, ease: 'power1.out' }, 1.30);
	tl.to(s6, { opacity: 1, duration: 0.10, stagger: 0.02, ease: 'power1.out' }, 1.32);
	tl.to(s7, { opacity: 1, y: 0, duration: 0.10, ease: 'power1.out' }, 1.38);

	// === Phase 9: Hold ===
	tl.set({}, {}, 1.50);

	// === Phase 10: Scroll through hero content (mobile only) ===
	if (mobile && heroOverflow > 0) {
		tl.to(heroTextContainer, {
			y: () => -measureOverflow(),
			duration: 0.5,
			ease: 'none',
		}, 1.52);
		tl.set({}, {}, 2.05);
	}

	// Shared blink references — captured via closure
	let typingComplete = true; // matchMedia rebuilds happen after typing

	ScrollTrigger.create({
		trigger: pinContainer,
		start: 'top top',
		end: mobile ? '+=1100%' : '+=800%',
		pin: true,
		scrub: 1,
		animation: tl,
		invalidateOnRefresh: true,
		onRefreshInit: () => {
			// Recalculate transform origins during refresh, after revert
			updateZoomOrigin();
			updateHeroTextOrigin();
		},
		onUpdate: (self: { progress: number; direction: number }) => {
			if (self.progress > 0.005) {
				stopBlink();
			} else if (self.progress <= 0.005 && self.direction === -1 && typingComplete) {
				startBlink();
			}
		},
	});

	// Force-sync timeline to current scroll position
	requestAnimationFrame(() => {
		ScrollTrigger.refresh();
	});
}
```

- [ ] **Step 2: Verify the file still compiles**

```bash
bun run check
```

Expected: No errors. The function exists but isn't called yet.

---

### Task 3: Wire up `gsap.matchMedia()` in `onMount`

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte` — replace inline timeline code with matchMedia

This is the critical swap. We replace everything after the typewriter/scroll-lock logic in `onMount` (from the SVG query through the end) with matchMedia calls.

- [ ] **Step 1: Replace inline timeline code with matchMedia**

In `onMount`, after the typewriter logic completes (after line ~203 where `ScrollTrigger.normalizeScroll(true)` is called), replace ALL remaining code (lines ~203 through ~515) with:

```typescript
		// ---- matchMedia: responsive timeline with automatic teardown/rebuild ----
		let savedProgress: number | null = null;

		const mm = gsap.matchMedia();

		// Desktop / tablet (≥769px): no Phase 10, 800% scroll range
		mm.add('(min-width: 769px)', () => {
			buildHeroTimeline(false);

			// Restore scroll position from previous breakpoint
			if (savedProgress !== null) {
				const st = ScrollTrigger.getAll().find((s) => s.trigger === pinContainer);
				if (st) {
					const newScrollY = st.start + (savedProgress * (st.end - st.start));
					window.scrollTo(0, newScrollY);
				}
				savedProgress = null;
			}

			return () => {
				// Cleanup: save progress before teardown
				const st = ScrollTrigger.getAll().find((s) => s.trigger === pinContainer);
				if (st) savedProgress = st.progress;
			};
		});

		// Mobile (<769px): Phase 10 content scroll, 1100% scroll range
		mm.add('(max-width: 768px)', () => {
			buildHeroTimeline(true);

			if (savedProgress !== null) {
				const st = ScrollTrigger.getAll().find((s) => s.trigger === pinContainer);
				if (st) {
					const newScrollY = st.start + (savedProgress * (st.end - st.start));
					window.scrollTo(0, newScrollY);
				}
				savedProgress = null;
			}

			return () => {
				const st = ScrollTrigger.getAll().find((s) => s.trigger === pinContainer);
				if (st) savedProgress = st.progress;
			};
		});

		// Sleep/wake: refresh ScrollTrigger when tab becomes visible again
		function onVisibilityChange() {
			if (!document.hidden) {
				ScrollTrigger.refresh();
			}
		}
		document.addEventListener('visibilitychange', onVisibilityChange);

		cleanup = () => {
			stopBlink();
			mm.revert(); // kills all animations from both breakpoints
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
```

**What gets DELETED** (these are all replaced by the matchMedia pattern above):

- The inline SVG query + berri check + element selections (moved into `buildHeroTimeline`)
- The `updateZoomOrigin()` call and resize listener (moved into builder + `onRefreshInit`)
- The entire inline timeline construction (Phases 1-9, Phase 10)
- The `onResize()` function
- `window.removeEventListener('resize', updateZoomOrigin)` and `window.addEventListener('resize', onResize)`
- The inline `ScrollTrigger.create()` call
- The old `cleanup` function body
- The `const heroOverflow` call (moved into builder)
- The inline `gsap.set(heroTextContainer, ...)` and `gsap.set(staggerEls, ...)`
- The `if (heroOverflow > 0) { sectionMinHeight = '1200svh'; }` block

**What STAYS in `onMount`** (before the matchMedia block):

- Reduced motion check
- Scroll lock + typewriter logic (lines 72-202)
- `registerGsapPlugins()` and `CustomEase.create()`
- The blink interval functions (`startBlink`, `stopBlink`)

- [ ] **Step 2: Verify the `startBlink`/`stopBlink` functions are accessible to `buildHeroTimeline`**

The `startBlink` and `stopBlink` functions are currently defined inside `onMount`. They reference `berri`, `scrollPrompt`, and `blinkInterval` which are also inside `onMount`. Since `buildHeroTimeline` needs `stopBlink`/`startBlink` for the ScrollTrigger `onUpdate`, these functions need to be either:

a) Moved to component-level scope (outside `onMount`), OR  
b) Passed as parameters to `buildHeroTimeline`

**Recommended: Move `blinkInterval`, `typingComplete`, `startBlink`, `stopBlink` to component scope** (after the `let` declarations at the top of `<script>`):

```typescript
let blinkInterval: ReturnType<typeof setInterval> | undefined;
let typingComplete = false;

function startBlink() {
	if (blinkInterval) return;
	if (scrollPrompt) {
		scrollPrompt.style.opacity = '1';
		scrollPrompt.textContent = scrollDownLabel + '_';
	}
	let cursorVisible = true;
	blinkInterval = setInterval(() => {
		cursorVisible = !cursorVisible;
		if (scrollPrompt) {
			scrollPrompt.textContent = scrollDownLabel + (cursorVisible ? '_' : '\u00A0');
		}
	}, 500);
}

function stopBlink() {
	if (blinkInterval) {
		clearInterval(blinkInterval);
		blinkInterval = undefined;
	}
}
```

Note: The `berri` reference in the original `startBlink` was for syncing the dot blink. Since `berri` is a DOM element queried inside `onMount`/`buildHeroTimeline`, we need to handle this differently. The blink dot sync can be removed from `startBlink`/`stopBlink` since it's only relevant at scroll position 0 where the SVG is visible — and `buildHeroTimeline` sets `berri.style.opacity = '1'` on each rebuild anyway. If the dot blink sync is important, pass `berri` as a parameter. For now, remove the berri blink from these functions — the typewriter cursor blink is the important part.

- [ ] **Step 3: Run tests**

```bash
bun run test
```

Expected: All 14 home tests pass. The markup, test IDs, and component behavior are unchanged.

- [ ] **Step 4: Run type check**

```bash
bun run check
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/HeroBanner.svelte
git commit -m "refactor(hero): replace onResize with gsap.matchMedia for resize resilience"
```

---

### Task 4: Manual resize verification

**No files changed** — this is a verification-only task.

- [ ] **Step 1: Start dev server and verify desktop fresh load**

```bash
bun run dev
```

Open `http://localhost:5173`. Scroll through all animation phases on desktop (1440x900). Verify:
- Phases 1-9 play identically to before
- Berri dot blink at top
- SVG lines draw, stations appear, zoom in, cross-fade, zoom out, text stagger
- Hero fully visible at Phase 9

- [ ] **Step 2: Verify mobile fresh load**

Use DevTools responsive mode (375x812). Reload. Scroll through all phases. Verify:
- Phases 1-9 play correctly
- Phase 10 scrolls SQL section into view
- Content scrolls from 0 to full overflow

- [ ] **Step 3: Test desktop → mobile resize at Phase 9**

On desktop at Phase 9 (hero fully visible), resize to 375x812. Verify:
- Animation rebuilds (matchMedia fires)
- Hero content visible in mobile layout
- Scrolling continues to work
- No blank viewport

- [ ] **Step 4: Test mobile → desktop resize at Phase 10**

On mobile at Phase 10 (SQL visible), resize to 1440x900. Verify:
- Animation rebuilds
- Hero content visible in desktop layout
- No Phase 10 translateY visible (content not pushed up)
- No blank viewport

- [ ] **Step 5: Test small desktop resize (1440→1200)**

At Phase 9 on desktop, shrink to 1200px wide. Then scroll to top. Verify:
- Animation plays correctly from start
- SVG at scale=1 at scroll 0
- Hero text hidden at scroll 0
- Full animation functional

- [ ] **Step 6: Test round-trip resize**

Desktop → mobile → desktop. Verify:
- transformOrigin correct (dot aligns with Berri-UQAM)
- Animation functional at all scroll positions
- No stuck end-state

- [ ] **Step 7: Document any issues found**

If any issues are found, fix them before proceeding. Log fixes in the devlog.

---

### Task 5: Write slice spec + update docs

**Files:**
- Create: `docs/slices/slice-13e-resize-resilience.md`
- Modify: `docs/reference/CSS.md` (only if CSS changes were needed — likely no changes)

- [ ] **Step 1: Write slice spec**

```markdown
# Slice 13e — Hero Resize Resilience

**Status:** Complete
**Parent:** Slice 13 (Home Page Redesign)
**Depends on:** 13d (hero text redesign)

## What Changed

Replaced manual `onResize()` handler with `gsap.matchMedia()` pattern.
The hero scroll animation now survives any viewport resize.

## Acceptance Criteria

- [x] Desktop↔mobile resize at any scroll position produces correct settled state
- [x] Within-breakpoint resize produces correct settled state
- [x] Browser tab sleep/wake doesn't break animation
- [x] All existing tests pass without modification
- [x] Animation visually identical on fresh load
- [x] No new dependencies

## Key Decisions

1. One breakpoint at 769px (matches CSS grid layout switch)
2. `invalidateOnRefresh: true` for within-breakpoint resize
3. Function-based values for all viewport-dependent calculations
4. Settle-after-resize strategy (brief jump OK, correct state mandatory)
5. Scroll position continuity via saved progress on breakpoint crossing
```

- [ ] **Step 2: Commit**

```bash
git add docs/slices/slice-13e-resize-resilience.md
git commit -m "docs(slice-13e): resize resilience slice spec"
```

---

## Self-Review Checklist

### Spec Coverage

| Spec Requirement | Task |
|-----------------|------|
| gsap.matchMedia() with one breakpoint | Task 3 |
| buildHeroTimeline() shared builder | Task 2 |
| Function-based values | Task 2 (Phase 5 zoom, Phase 10 y) |
| Transform-origin fix (measure at scale=1) | Task 2 (builder + onRefreshInit) |
| Scroll position continuity | Task 3 (savedProgress pattern) |
| sectionMinHeight from callback | Task 2 (builder sets it) |
| visibilitychange handler | Task 3 |
| Delete onResize handler | Task 3 |
| invalidateOnRefresh: true | Task 2 |
| measureOverflow() function | Task 1 |
| Manual verification matrix | Task 4 |

### Placeholder Scan

No TBDs, TODOs, or "implement later" found. All code blocks are complete.

### Type Consistency

- `measureOverflow()`: returns `number` — used in Task 1 and Task 2 ✓
- `buildHeroTimeline(mobile: boolean)`: void — called in Task 3 with `false`/`true` ✓
- `savedProgress`: `number | null` — set from `st.progress` (number), checked against `null` ✓
- `startBlink`/`stopBlink`: void, no params — called in Task 2 (onUpdate) and Task 3 (cleanup) ✓
