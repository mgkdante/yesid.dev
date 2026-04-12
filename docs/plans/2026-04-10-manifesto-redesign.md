# Manifesto Section Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the manifesto section as a full-viewport interactive experience with circuit grid, construction stripes, transit decorations, edge HUD, cursor-reactive canvas, and data-driven text — replacing the current pinned SplitText-only section.

**Architecture:** Manifesto becomes a normal-scroll section (no pin) with 6 visual layers (circuit grid, warm glow, stripes, data flows, Beck lines, interactive canvas) plus edge decorations and transit elements. Hero pin shortened from 1200% to 800%. Hard cut (yellow/black bar) separates hero from manifesto. All text from LocalizedString data layer. Canvas handles cursor interaction; GSAP handles entrance animations.

**Tech Stack:** SvelteKit 2, Svelte 5, GSAP (ScrollTrigger, SplitText, CustomEase), Tailwind v4, Vitest + @testing-library/svelte, Bun

**Runtime:** Bun only. Never npm/npx/node.

**Design spec:** `docs/specs/2026-04-09-manifesto-section-design.md`

---

## File Structure

### Files to create

```
src/lib/components/ManifestoCanvas.svelte   — interactive canvas (node proximity glow, traces, tap ripple)
```

### Files to modify

```
src/lib/data/content.ts                     — expand manifestoContent with all deco text as LocalizedString
src/lib/data/content.test.ts                — update tests for new manifestoContent structure
src/lib/styles/tokens.css                   — add --bg-manifesto token
src/lib/components/Manifesto.svelte         — FULL REWRITE: new layout, layers, transit deco, edge HUD
src/lib/components/Manifesto.test.ts        — update tests for new structure
src/lib/components/HeroBanner.svelte        — reduce pin from 1200% to 800%
src/routes/+page.svelte                     — add hard-cut div between Hero and Manifesto
src/routes/home.test.ts                     — add test for hard-cut element
```

---

## Task 1: Expand manifestoContent data layer

**Files:**
- Modify: `src/lib/data/content.ts:31-42`
- Test: `src/lib/data/content.test.ts:19-45`

- [ ] **Step 1: Write failing tests for new manifestoContent structure**

Replace the `manifestoContent` describe block in `src/lib/data/content.test.ts` (lines 19-45) with:

```typescript
describe('manifestoContent', () => {
	it('has statement lines as LocalizedString', () => {
		expect(manifestoContent.statement.line1.en.length).toBeGreaterThan(0);
		expect(manifestoContent.statement.lineHuge.en).toBe('INFRASTRUCTURE');
		expect(manifestoContent.statement.line3Part1.en.length).toBeGreaterThan(0);
		expect(manifestoContent.statement.line3Highlight.en).toBe('OPERATIONS');
		expect(manifestoContent.statement.line3Part2.en.length).toBeGreaterThan(0);
	});

	it('has terminal prompt as LocalizedString', () => {
		expect(manifestoContent.terminal.user.en).toContain('yesid');
		expect(manifestoContent.terminal.command.en).toContain('cat');
	});

	it('has exactly 5 capability pills', () => {
		expect(manifestoContent.pills).toHaveLength(5);
	});

	it('every pill has an English label and a serviceId', () => {
		for (const pill of manifestoContent.pills) {
			expect(pill.label.en.length).toBeGreaterThan(0);
			expect(pill.serviceId.length).toBeGreaterThan(0);
		}
	});

	it('pills map to expected service IDs', () => {
		const serviceIds = manifestoContent.pills.map((p) => p.serviceId);
		expect(serviceIds).toEqual([
			'data-pipeline',
			'database-engineering',
			'analytics-reporting',
			'internal-tooling',
			'web-development',
		]);
	});

	it('has edge decoration text as LocalizedString', () => {
		expect(manifestoContent.edgeLeft.sectionNumber.en).toContain('SEC');
		expect(manifestoContent.edgeLeft.sectionName.en).toBe('MANIFESTO');
		expect(manifestoContent.edgeLeft.location.en).toContain('MTL');
	});

	it('has right edge with easter egg locations', () => {
		expect(manifestoContent.edgeRight.src.en).toContain('Sherbrooke');
		expect(manifestoContent.edgeRight.via.en).toContain('Lennoxville');
		expect(manifestoContent.edgeRight.dst.en).toContain('Montréal');
	});

	it('has bottom status bar text', () => {
		expect(manifestoContent.edgeBottom.connected.en.length).toBeGreaterThan(0);
		expect(manifestoContent.edgeBottom.line.en).toContain('ORANGE');
	});

	it('has transit element text', () => {
		expect(manifestoContent.transit.arrivalLabel.en).toContain('PROCHAIN');
		expect(manifestoContent.transit.platformBadge.en).toContain('QUAI');
		expect(manifestoContent.transit.directionBadge.en).toContain('CENTRE-VILLE');
	});

	it('has measurement tick labels', () => {
		expect(manifestoContent.ticks.length).toBeGreaterThanOrEqual(5);
		expect(manifestoContent.ticks[0]).toBe('0');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test src/lib/data/content.test.ts`
Expected: FAIL — `manifestoContent.statement.line1` does not exist (old structure has `statement.en` as a flat string).

- [ ] **Step 3: Implement expanded manifestoContent**

Replace lines 31-42 in `src/lib/data/content.ts` with:

```typescript
export const manifestoContent = {
	statement: {
		line1: { en: 'I BUILD THE' } satisfies LocalizedString,
		lineHuge: { en: 'INFRASTRUCTURE' } satisfies LocalizedString,
		line3Part1: { en: 'YOUR' } satisfies LocalizedString,
		line3Highlight: { en: 'OPERATIONS' } satisfies LocalizedString,
		line3Part2: { en: 'RUN ON' } satisfies LocalizedString,
	},
	terminal: {
		user: { en: 'yesid@mtl' } satisfies LocalizedString,
		command: { en: ':~$ cat manifesto.md' } satisfies LocalizedString,
	},
	pills: [
		{ label: { en: 'pipelines' } satisfies LocalizedString, serviceId: 'data-pipeline' },
		{ label: { en: 'databases' } satisfies LocalizedString, serviceId: 'database-engineering' },
		{ label: { en: 'dashboards' } satisfies LocalizedString, serviceId: 'analytics-reporting' },
		{ label: { en: 'internal_tools' } satisfies LocalizedString, serviceId: 'internal-tooling' },
		{ label: { en: 'web_apps' } satisfies LocalizedString, serviceId: 'web-development' },
	],
	edgeLeft: {
		sectionNumber: { en: 'SEC—02' } satisfies LocalizedString,
		sectionName: { en: 'MANIFESTO' } satisfies LocalizedString,
		location: { en: 'MTL—QC' } satisfies LocalizedString,
	},
	edgeRight: {
		lat: { en: 'LAT 45.5017°N' } satisfies LocalizedString,
		lng: { en: 'LNG 73.5673°W' } satisfies LocalizedString,
		src: { en: 'SRC Sherbrooke, QC' } satisfies LocalizedString,
		via: { en: 'VIA Lennoxville, QC' } satisfies LocalizedString,
		dst: { en: 'DST Montréal, QC' } satisfies LocalizedString,
		node: { en: 'NODE berri-uqam' } satisfies LocalizedString,
		status: { en: 'STATUS active' } satisfies LocalizedString,
	},
	edgeBottom: {
		connected: { en: 'CONNECTED' } satisfies LocalizedString,
		line: { en: 'LIGNE ORANGE' } satisfies LocalizedString,
		url: { en: 'yesid.dev' } satisfies LocalizedString,
		version: { en: 'v2.0' } satisfies LocalizedString,
		scrollHint: { en: 'SCROLL ↓' } satisfies LocalizedString,
	},
	transit: {
		arrivalLabel: { en: 'PROCHAIN / NEXT' } satisfies LocalizedString,
		platformBadge: { en: 'QUAI / PLATFORM 2' } satisfies LocalizedString,
		directionBadge: { en: 'DIRECTION: CENTRE-VILLE' } satisfies LocalizedString,
	},
	ticks: ['0', '80', '160', '240', '320', '400', '480'],
} as const;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/lib/data/content.test.ts`
Expected: All PASS.

- [ ] **Step 5: Run type check**

Run: `bun run check`
Expected: PASS. The Manifesto.svelte component will have type errors since it still references the old `manifestoContent.statement.en` — that's expected, we rewrite it in Task 4.

**STOP. Ask Yesid to verify before moving to Task 2.**

---

## Task 2: Add --bg-manifesto token + update CSS.md

**Files:**
- Modify: `src/lib/styles/tokens.css:29-37`
- Modify: `docs/reference/CSS.md`

- [ ] **Step 1: Add manifesto background token**

In `src/lib/styles/tokens.css`, inside the `[data-theme="dark"]` block (line 29), add after `--bg-elevated: #2A2A2A;`:

```css
  --bg-manifesto: #0f0d0a;
```

- [ ] **Step 2: Update docs/reference/CSS.md**

Add entry for the new token documenting: name (`--bg-manifesto`), purpose (warm dark background for manifesto section, distinct from `--bg-primary` #141414), where consumed (`Manifesto.svelte`), why existing tokens don't cover it (needs to be warmer/darker than `--bg-primary` for Von Restorff color break effect).

- [ ] **Step 3: Run tests**

Run: `bun run test && bun run check`
Expected: PASS (CSS token addition doesn't break anything).

**STOP. Ask Yesid to verify before moving to Task 3.**

---

## Task 3: Create ManifestoCanvas component

**Files:**
- Create: `src/lib/components/ManifestoCanvas.svelte`

This is the interactive canvas that renders circuit nodes, proximity glow, trace connections, and handles tap ripples. It's extracted as a separate component for clarity and testability.

- [ ] **Step 1: Create ManifestoCanvas.svelte**

```svelte
<!--
  ManifestoCanvas — Interactive circuit node canvas for the manifesto section.
  Renders grid-aligned nodes that glow on cursor proximity.
  Draws trace connections between nearby active nodes.
  Emits concentric ripple pulses on click/tap.
  Respects prefers-reduced-motion: static nodes only.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

	export let containerEl: HTMLElement | undefined = undefined;

	const GRID = 80;
	const PROXIMITY = 120;
	const TRACE_PROXIMITY = 160;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let warmGlow: HTMLDivElement;
	let width = 0;
	let height = 0;
	let mouseX = -999;
	let mouseY = -999;
	let animFrame: number;

	interface Node {
		x: number;
		y: number;
		baseOpacity: number;
		currentOpacity: number;
		targetOpacity: number;
		size: number;
		glowSize: number;
	}

	let nodes: Node[] = [];

	function generateNodes() {
		nodes = [];
		for (let x = GRID; x < width; x += GRID) {
			for (let y = GRID; y < height; y += GRID) {
				nodes.push({
					x,
					y,
					baseOpacity: 0.06 + Math.random() * 0.06,
					currentOpacity: 0,
					targetOpacity: 0,
					size: 1.5 + Math.random() * 1.5,
					glowSize: 0,
				});
			}
		}
	}

	function resize() {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		width = rect.width;
		height = rect.height;
		canvas.width = width;
		canvas.height = height;
		generateNodes();
	}

	function onMouseMove(e: MouseEvent) {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
		warmGlow.style.left = `${mouseX}px`;
		warmGlow.style.top = `${mouseY}px`;
	}

	function onMouseLeave() {
		mouseX = -999;
		mouseY = -999;
		warmGlow.style.left = '50%';
		warmGlow.style.top = '50%';
	}

	function onTouchMove(e: TouchEvent) {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		const touch = e.touches[0];
		mouseX = touch.clientX - rect.left;
		mouseY = touch.clientY - rect.top;
		warmGlow.style.left = `${mouseX}px`;
		warmGlow.style.top = `${mouseY}px`;
	}

	function onTap(e: MouseEvent) {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const outer = document.createElement('div');
		outer.className = 'manifesto__ripple';
		outer.style.left = `${x}px`;
		outer.style.top = `${y}px`;
		containerEl.appendChild(outer);
		setTimeout(() => outer.remove(), 1200);

		const inner = document.createElement('div');
		inner.className = 'manifesto__ripple-inner';
		inner.style.left = `${x}px`;
		inner.style.top = `${y}px`;
		containerEl.appendChild(inner);
		setTimeout(() => inner.remove(), 800);
	}

	function animate() {
		if (!ctx) return;
		ctx.clearRect(0, 0, width, height);

		const activeNodes: Node[] = [];

		for (const node of nodes) {
			const dx = mouseX - node.x;
			const dy = mouseY - node.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist < PROXIMITY) {
				const factor = 1 - dist / PROXIMITY;
				node.targetOpacity = node.baseOpacity + factor * 0.5;
				node.glowSize = factor * 12;
				activeNodes.push(node);
			} else {
				node.targetOpacity = node.baseOpacity;
				node.glowSize = Math.max(0, node.glowSize - 0.5);
			}

			node.currentOpacity += (node.targetOpacity - node.currentOpacity) * 0.15;

			if (node.glowSize > 0.5) {
				ctx.beginPath();
				ctx.arc(node.x, node.y, node.glowSize, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(224,120,0,${node.currentOpacity * 0.3})`;
				ctx.fill();
			}

			ctx.beginPath();
			ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(224,120,0,${node.currentOpacity})`;
			ctx.fill();
		}

		if (activeNodes.length >= 2) {
			for (let i = 0; i < activeNodes.length; i++) {
				for (let j = i + 1; j < activeNodes.length; j++) {
					const a = activeNodes[i];
					const b = activeNodes[j];
					const dx = a.x - b.x;
					const dy = a.y - b.y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < TRACE_PROXIMITY) {
						const opacity = (1 - dist / TRACE_PROXIMITY) * 0.25;
						ctx.beginPath();
						ctx.moveTo(a.x, a.y);
						ctx.lineTo(b.x, b.y);
						ctx.strokeStyle = `rgba(224,120,0,${opacity})`;
						ctx.lineWidth = 1;
						ctx.stroke();
					}
				}
			}
		}

		animFrame = requestAnimationFrame(animate);
	}

	onMount(() => {
		if (!browser || !canvas) return;
		ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (isPrefersReducedMotion()) {
			resize();
			// Draw static nodes once
			for (const node of nodes) {
				ctx.beginPath();
				ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(224,120,0,${node.baseOpacity})`;
				ctx.fill();
			}
			return;
		}

		resize();
		animate();

		if (containerEl) {
			containerEl.addEventListener('mousemove', onMouseMove);
			containerEl.addEventListener('mouseleave', onMouseLeave);
			containerEl.addEventListener('touchmove', onTouchMove, { passive: true });
			containerEl.addEventListener('click', onTap);
		}
		window.addEventListener('resize', resize);
	});

	onDestroy(() => {
		if (animFrame) cancelAnimationFrame(animFrame);
		if (containerEl) {
			containerEl.removeEventListener('mousemove', onMouseMove);
			containerEl.removeEventListener('mouseleave', onMouseLeave);
			containerEl.removeEventListener('touchmove', onTouchMove);
			containerEl.removeEventListener('click', onTap);
		}
		window.removeEventListener('resize', resize);
	});
</script>

<canvas bind:this={canvas} class="manifesto__canvas" data-testid="manifesto-canvas"></canvas>
<div
	bind:this={warmGlow}
	class="manifesto__warm-glow"
	style="left:50%;top:50%;"
></div>

<style>
	.manifesto__canvas {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
	}

	.manifesto__warm-glow {
		position: absolute;
		width: 800px;
		height: 500px;
		background: radial-gradient(
			ellipse,
			rgba(224, 120, 0, 0.06) 0%,
			rgba(255, 182, 39, 0.02) 30%,
			transparent 60%
		);
		transform: translate(-50%, -50%);
		pointer-events: none;
		transition:
			left 0.8s ease-out,
			top 0.8s ease-out;
		z-index: 0;
	}
</style>
```

- [ ] **Step 2: Run type check**

Run: `bun run check`
Expected: PASS (component is valid Svelte).

**STOP. Ask Yesid to verify before moving to Task 4.**

---

## Task 4: Rewrite Manifesto.svelte

**Files:**
- Modify: `src/lib/components/Manifesto.svelte` (full rewrite)

This is the largest task — the full manifesto section with all visual layers. All text from data layer.

- [ ] **Step 1: Update Manifesto.test.ts for new structure**

Replace `src/lib/components/Manifesto.test.ts` entirely:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Manifesto from './Manifesto.svelte';

describe('Manifesto', () => {
	it('renders the manifesto section', () => {
		render(Manifesto);
		expect(screen.getByTestId('manifesto-section')).toBeInTheDocument();
	});

	it('renders the terminal prompt from data layer', () => {
		render(Manifesto);
		const prompt = screen.getByTestId('manifesto-prompt');
		expect(prompt.textContent).toContain('yesid@mtl');
		expect(prompt.textContent).toContain('cat');
	});

	it('renders the statement text in variable sizes', () => {
		render(Manifesto);
		const text = screen.getByTestId('manifesto-text');
		expect(text.textContent).toContain('I BUILD THE');
		expect(text.textContent).toContain('INFRASTRUCTURE');
		expect(text.textContent).toContain('OPERATIONS');
		expect(text.textContent).toContain('RUN ON');
	});

	it('renders the INFRASTRUCTURE line with highlight class', () => {
		render(Manifesto);
		const huge = screen.getByTestId('manifesto-line-huge');
		expect(huge.textContent).toBe('INFRASTRUCTURE');
	});

	it('renders exactly 5 capability pills', () => {
		render(Manifesto);
		const pills = screen.getAllByTestId('manifesto-pill');
		expect(pills).toHaveLength(5);
	});

	it('each pill links to the correct service route', () => {
		render(Manifesto);
		const pills = screen.getAllByTestId('manifesto-pill');
		const expectedRoutes = [
			'/services/data-pipeline',
			'/services/database-engineering',
			'/services/analytics-reporting',
			'/services/internal-tooling',
			'/services/web-development',
		];
		pills.forEach((pill, i) => {
			expect(pill).toHaveAttribute('href', expectedRoutes[i]);
		});
	});

	it('renders left edge decorations from data layer', () => {
		render(Manifesto);
		const edge = screen.getByTestId('manifesto-edge-left');
		expect(edge.textContent).toContain('SEC');
		expect(edge.textContent).toContain('MANIFESTO');
		expect(edge.textContent).toContain('MTL');
	});

	it('renders right edge with easter egg locations', () => {
		render(Manifesto);
		const edge = screen.getByTestId('manifesto-edge-right');
		expect(edge.textContent).toContain('Sherbrooke');
		expect(edge.textContent).toContain('Lennoxville');
		expect(edge.textContent).toContain('Montréal');
	});

	it('renders bottom status bar', () => {
		render(Manifesto);
		const bar = screen.getByTestId('manifesto-edge-bottom');
		expect(bar.textContent).toContain('CONNECTED');
		expect(bar.textContent).toContain('LIGNE ORANGE');
	});

	it('renders transit elements', () => {
		render(Manifesto);
		expect(screen.getByTestId('manifesto-arrival')).toBeInTheDocument();
		expect(screen.getByTestId('manifesto-platform-badge')).toBeInTheDocument();
		expect(screen.getByTestId('manifesto-direction-badge')).toBeInTheDocument();
	});

	it('renders measurement ticks', () => {
		render(Manifesto);
		const ticks = screen.getByTestId('manifesto-edge-top');
		expect(ticks).toBeInTheDocument();
		expect(ticks.textContent).toContain('0');
		expect(ticks.textContent).toContain('80');
	});

	it('renders interactive canvas', () => {
		render(Manifesto);
		expect(screen.getByTestId('manifesto-canvas')).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test src/lib/components/Manifesto.test.ts`
Expected: FAIL — new test IDs don't exist yet.

- [ ] **Step 3: Rewrite Manifesto.svelte**

Replace `src/lib/components/Manifesto.svelte` entirely. The full component is too large to inline here (would exceed plan readability). Instead, implement it section by section following the design spec (sections 4.1-4.14 + section 5), with these structural requirements:

**Component structure:**
```
<section data-testid="manifesto-section" class="manifesto" bind:this={sectionEl}>
  <!-- BG Layer 1: Circuit grid (CSS only) -->
  <div class="manifesto__circuit-grid"></div>

  <!-- BG Layer 2+3: Canvas + warm glow (ManifestoCanvas) -->
  <ManifestoCanvas containerEl={sectionEl} />

  <!-- BG Layer 4: Data flow lines (CSS animated divs) -->
  <!-- 6 horizontal .manifesto__flow-line + 4 vertical .manifesto__flow-line-v -->

  <!-- BG Layer 5: Construction stripes (4 corners, CSS pseudo-elements) -->
  <div class="manifesto__stripe manifesto__stripe--tl"></div>
  <div class="manifesto__stripe manifesto__stripe--br"></div>
  <div class="manifesto__stripe manifesto__stripe--tr"></div>
  <div class="manifesto__stripe manifesto__stripe--bl"></div>

  <!-- BG Layer 6: Beck route lines + roundels (CSS positioned divs) -->

  <!-- Edge deco: left, right, top (ticks), bottom (status bar) -->
  <!-- Transit: arrival countdown, chevrons, platform badges -->

  <!-- Center content (z-index: 10) -->
  <div class="manifesto__content">
    <!-- Terminal prompt -->
    <!-- Statement (variable size: line-small, line-huge, line-small) -->
    <!-- Capability pills -->
  </div>
</section>
```

**Data binding:** Every text element uses `resolveLocale(manifestoContent.xxx, 'en')`. No hardcoded strings.

**CSS:** All in scoped `<style>` block. Copy exact values from design spec sections 4.1-4.14, section 5. Reference `var(--bg-manifesto)` for background, `var(--brand-primary)` for orange, `var(--brand-accent)` for yellow.

**GSAP animations:** ScrollTrigger entrance (not pinned). Sequence per spec section 7: bg layers → edges → transit → prompt typewriter → SplitText chars → pills.

**Reduced motion:** Check `isPrefersReducedMotion()` — if true, show everything statically, no animations, no data flows.

**Responsive:** Hide edge deco below 640px, transit elements below 768px per spec section 8.

- [ ] **Step 4: Run tests**

Run: `bun run test src/lib/components/Manifesto.test.ts`
Expected: All PASS.

- [ ] **Step 5: Run full test suite + type check**

Run: `bun run test && bun run check`
Expected: PASS.

**STOP. Ask Yesid to verify visually on localhost before moving to Task 5.**

---

## Task 5: Reduce hero pin duration

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte:359-360`

- [ ] **Step 1: Change ScrollTrigger end value**

In `src/lib/components/HeroBanner.svelte`, find the ScrollTrigger.create call (around line 359) and change:

```typescript
// Before
end: '+=1200%',

// After
end: '+=800%',
```

- [ ] **Step 2: Update min-height on outer section**

Find the outer `<section>` element (around line 391) and change:

```svelte
<!-- Before -->
style="min-height: {reducedMotion ? '100vh' : '1300vh'};"

<!-- After -->
style="min-height: {reducedMotion ? '100vh' : '900vh'};"
```

- [ ] **Step 3: Run tests**

Run: `bun run test && bun run check`
Expected: PASS.

**STOP. Ask Yesid to verify the hero animation still feels complete at the shorter pin — scroll through all 9 phases on localhost.**

---

## Task 6: Add hard-cut transition + update home page

**Files:**
- Modify: `src/routes/+page.svelte`
- Modify: `src/routes/home.test.ts`

- [ ] **Step 1: Add hard-cut div to +page.svelte**

In `src/routes/+page.svelte`, between `<HeroBanner />` and `<Manifesto />`, add:

```svelte
<!-- Hard cut: yellow/black dashed line (Von Restorff break) -->
<div
	data-testid="hard-cut"
	class="h-1 w-full"
	style="background: repeating-linear-gradient(90deg, #FFB627 0px, #FFB627 12px, #0f0d0a 12px, #0f0d0a 24px);"
></div>
```

- [ ] **Step 2: Add test for hard-cut**

Add to `src/routes/home.test.ts`:

```typescript
it('renders the hard-cut transition between hero and manifesto', () => {
	render(Page);
	expect(screen.getByTestId('hard-cut')).toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests**

Run: `bun run test && bun run check`
Expected: All PASS.

**STOP. Ask Yesid to verify the full flow on localhost: hero animation → hard cut → manifesto section. Check at 1440px desktop and 375px mobile.**

---

## Task 7: Visual polish + responsive QA

- [ ] **Step 1: Desktop verification (1440px)**

Check on localhost:
- Hero 9 phases play correctly at shorter duration
- Hard cut visible as yellow/black bar
- Manifesto section: circuit grid edge-to-edge, stripes on corners, all 4 edges visible
- Transit elements: roundels, Beck lines, chevrons, platform badges, arrival countdown
- Terminal prompt with blinking cursor
- "INFRASTRUCTURE" fills ~85% of viewport width with orange glow
- Pills visible and hoverable
- Interactive canvas: move cursor, nodes glow, traces connect
- Click: dual ripple pulse
- Data flow lines animating

- [ ] **Step 2: Mobile verification (375px)**

Check on localhost at 375px:
- Left/right edge decorations hidden
- Transit elements hidden
- Statement text scales down via clamp()
- Pills wrap to 2 rows
- Circuit grid still visible
- Stripes reduced
- Touch interaction works
- Terminal prompt visible

- [ ] **Step 3: Reduced motion verification**

Enable `prefers-reduced-motion: reduce` in browser devtools:
- All manifesto content visible immediately
- No SplitText animation
- No data flow lines
- No cursor interaction
- Static canvas nodes
- Countdown frozen

- [ ] **Step 4: Fix any issues found**

Address any visual problems, overflow, or spacing issues discovered during QA.

- [ ] **Step 5: Run final test suite**

Run: `bun run test && bun run check`
Expected: All PASS.

**STOP. Ask Yesid for final approval before closing.**

---

## Execution Order

Sequential: Task 1 → 2 → 3 → 4 → 5 → 6 → 7. Each depends on the previous (data layer → component → hero → integration → QA).
