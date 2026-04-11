# Slice B — Animated Wordmark + Horizontal Scroll CTA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a rotating hover animation to the "yesid." nav wordmark, update the hero scroll prompt to "NEXT STOP: SCROLL DOWN", and build a data-driven horizontal scroll CTA section after the hero.

**Architecture:** Three independent features — (1) SplitText registration + Nav hover, (2) scroll prompt text change, (3) new SkillsJourney component with its own ScrollTrigger. Zero changes to HeroBanner.svelte. Backup branch: `backup/slice-a-c-complete`.

**Tech Stack:** SvelteKit 2, Svelte 5, GSAP (SplitText, ScrollTrigger), TypeScript, Vitest

---

## File Structure

### Create
- `src/lib/components/SkillsJourney.svelte` — horizontal scroll CTA component
- `src/lib/components/SkillsJourney.test.ts` — tests for SkillsJourney

### Modify
- `src/lib/motion/utils/gsap.ts` — register SplitText plugin
- `src/lib/motion/utils/gsap.test.ts` — test SplitText registration + re-export
- `src/tests/setup.ts` — add SplitText mock
- `src/lib/data/types.ts` — add JourneyPanel, JourneySkill types
- `src/lib/data/content.ts` — add skillsJourneyContent, update heroAnimContent
- `src/lib/data/content.test.ts` — test new content exports
- `src/lib/components/Nav.svelte` — SplitText hover animation on wordmark
- `src/lib/components/Nav.test.ts` — test wordmark hover setup
- `src/routes/+page.svelte` — add SkillsJourney after HeroBanner

---

## Task 1: Register SplitText in GSAP Utils

**Files:**
- Modify: `src/lib/motion/utils/gsap.ts`
- Modify: `src/lib/motion/utils/gsap.test.ts`
- Modify: `src/tests/setup.ts`

- [ ] **Step 1: Add SplitText mock to test setup**

In `src/tests/setup.ts`, add after the CustomEase mock (after line 115):

```typescript
vi.mock('gsap/SplitText', () => ({
	SplitText: vi.fn(() => ({
		chars: [],
		words: [],
		lines: [],
		revert: vi.fn()
	}))
}));
```

- [ ] **Step 2: Write the failing test for SplitText re-export**

In `src/lib/motion/utils/gsap.test.ts`, add after the CustomEase re-export test (after line 69):

```typescript
it('re-exports SplitText', async () => {
	const { SplitText } = await import('./gsap.js');
	expect(SplitText).toBeDefined();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun run test src/lib/motion/utils/gsap.test.ts`
Expected: FAIL — SplitText is not exported from gsap.ts yet

- [ ] **Step 4: Add SplitText to gsap.ts**

In `src/lib/motion/utils/gsap.ts`, add the import (after line 5):

```typescript
import { SplitText } from 'gsap/SplitText';
```

Update the registerPlugin call (line 16):

```typescript
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, CustomEase, SplitText);
```

Update the re-export (line 21):

```typescript
export { gsap, ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, CustomEase, SplitText };
```

- [ ] **Step 5: Update the "passes all plugins" test**

In `src/lib/motion/utils/gsap.test.ts`, update the test at line 21:

```typescript
it('passes all plugins to registerPlugin', async () => {
	const { gsap } = await import('gsap');
	const { ScrollTrigger } = await import('gsap/ScrollTrigger');
	const { MotionPathPlugin } = await import('gsap/MotionPathPlugin');
	const { DrawSVGPlugin } = await import('gsap/DrawSVGPlugin');
	const { CustomEase } = await import('gsap/CustomEase');
	const { SplitText } = await import('gsap/SplitText');
	const { registerGsapPlugins } = await import('./gsap.js');

	registerGsapPlugins();

	expect(gsap.registerPlugin).toHaveBeenCalledWith(
		ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, CustomEase, SplitText
	);
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `bun run test src/lib/motion/utils/gsap.test.ts`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/motion/utils/gsap.ts src/lib/motion/utils/gsap.test.ts src/tests/setup.ts
git commit -m "feat(gsap): register SplitText plugin"
```

---

## Task 2: Add Types + Content Data

**Files:**
- Modify: `src/lib/data/types.ts`
- Modify: `src/lib/data/content.ts`
- Modify: `src/lib/data/content.test.ts`
- Modify: `src/lib/data/index.ts`

- [ ] **Step 1: Add JourneyPanel and JourneySkill types**

In `src/lib/data/types.ts`, add after the BlogPost interface (after line 97):

```typescript
export type HighlightEffect = 'scale' | 'gradient' | 'wave' | 'charReveal';

export type SkillIcon = 'sql' | 'typescript' | 'python' | 'sveltekit' | 'gsap' | 'powerbi' | 'docker';

export interface JourneySkill {
	id: string;
	name: string;
	subtitle?: string;
	icon: SkillIcon;
}

export interface JourneyPanel {
	id: string;
	label: LocalizedString;
	text: LocalizedString;
	highlightWords: string[];
	highlightEffect: HighlightEffect;
	skills: JourneySkill[];
}
```

- [ ] **Step 2: Update heroAnimContent scroll text**

In `src/lib/data/content.ts`, change line 9:

```typescript
scrollDown: { en: 'NEXT STOP: SCROLL DOWN' } satisfies LocalizedString,
```

- [ ] **Step 3: Add skillsJourneyContent**

In `src/lib/data/content.ts`, add after `ctaContent` (after line 59):

```typescript
export const skillsJourneyPanels: readonly JourneyPanel[] = [
	{
		id: 'foundation',
		label: { en: '01 — FOUNDATION' },
		text: { en: 'Every system starts at the foundation.' },
		highlightWords: ['foundation'],
		highlightEffect: 'scale',
		skills: [
			{ id: 'sql', name: 'SQL', subtitle: 'PostgreSQL · SQL Server', icon: 'sql' },
		],
	},
	{
		id: 'routes',
		label: { en: '02 — ROUTES' },
		text: { en: 'Routes that move data, logic, and pixels.' },
		highlightWords: ['data', 'logic', 'pixels'],
		highlightEffect: 'charReveal',
		skills: [
			{ id: 'typescript', name: 'TypeScript', icon: 'typescript' },
			{ id: 'python', name: 'Python', icon: 'python' },
		],
	},
	{
		id: 'stations',
		label: { en: '03 — STATIONS' },
		text: { en: 'Stations where users stop and understand.' },
		highlightWords: ['Stations', 'understand'],
		highlightEffect: 'wave',
		skills: [
			{ id: 'sveltekit', name: 'SvelteKit', icon: 'sveltekit' },
			{ id: 'powerbi', name: 'Power BI', icon: 'powerbi' },
		],
	},
	{
		id: 'motion',
		label: { en: '04 — MOTION' },
		text: { en: 'The motion that makes the ride unforgettable.' },
		highlightWords: ['motion', 'unforgettable'],
		highlightEffect: 'gradient',
		skills: [
			{ id: 'gsap', name: 'GSAP', icon: 'gsap' },
			{ id: 'docker', name: 'Docker', icon: 'docker' },
		],
	},
] as const;

export const skillsJourneyCta = {
	prompt: { en: 'Your next stop?' } satisfies LocalizedString,
	button: { en: "Let's build together →" } satisfies LocalizedString,
} as const;
```

Add the import for JourneyPanel at the top of content.ts:

```typescript
import type { LocalizedString, JourneyPanel } from './types.js';
```

- [ ] **Step 4: Export from index.ts**

In `src/lib/data/index.ts`, add:

```typescript
export { skillsJourneyPanels, skillsJourneyCta } from './content.js';
export type { JourneyPanel, JourneySkill, SkillIcon, HighlightEffect } from './types.js';
```

- [ ] **Step 5: Write content tests**

In `src/lib/data/content.test.ts`, add tests:

```typescript
import { skillsJourneyPanels, skillsJourneyCta } from './content.js';

describe('skillsJourneyPanels', () => {
	it('has at least 1 panel', () => {
		expect(skillsJourneyPanels.length).toBeGreaterThanOrEqual(1);
	});

	it('every panel has a unique id', () => {
		const ids = skillsJourneyPanels.map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('every panel has at least one skill', () => {
		for (const panel of skillsJourneyPanels) {
			expect(panel.skills.length).toBeGreaterThanOrEqual(1);
		}
	});

	it('every panel has at least one highlight word', () => {
		for (const panel of skillsJourneyPanels) {
			expect(panel.highlightWords.length).toBeGreaterThanOrEqual(1);
		}
	});
});

describe('skillsJourneyCta', () => {
	it('has prompt and button text', () => {
		expect(skillsJourneyCta.prompt.en).toBeTruthy();
		expect(skillsJourneyCta.button.en).toBeTruthy();
	});
});
```

- [ ] **Step 6: Run tests**

Run: `bun run test src/lib/data/content.test.ts`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/data/types.ts src/lib/data/content.ts src/lib/data/content.test.ts src/lib/data/index.ts
git commit -m "feat(data): add skills journey panel types and content"
```

---

## Task 3: Nav Wordmark Hover Animation

**Files:**
- Modify: `src/lib/components/Nav.svelte`
- Modify: `src/lib/components/Nav.test.ts`

- [ ] **Step 1: Write failing test for wordmark hover setup**

In `src/lib/components/Nav.test.ts`, add:

```typescript
it('wraps wordmark letters in a container with data-testid', () => {
	render(Nav);
	const wordmark = screen.getByTestId('nav-wordmark');
	expect(wordmark).toBeInTheDocument();
	// The wordmark text "yesid" + dot should be present
	expect(wordmark.textContent).toContain('yesid');
	expect(wordmark.textContent).toContain('.');
});

it('has a wordmark-letters container for animation', () => {
	render(Nav);
	const letters = screen.getByTestId('nav-wordmark-letters');
	expect(letters).toBeInTheDocument();
	expect(letters.textContent).toBe('yesid');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/lib/components/Nav.test.ts`
Expected: FAIL — nav-wordmark-letters not found

- [ ] **Step 3: Update Nav.svelte markup**

Replace the wordmark `<a>` (lines 42-44) with:

```svelte
<a href="/" data-testid="nav-wordmark" class="font-heading text-xl font-bold text-[var(--text-primary)] inline-flex items-baseline"
	onmouseenter={handleWordmarkHover}
>
	<span data-testid="nav-wordmark-letters" bind:this={wordmarkEl}>yesid</span><span data-testid="nav-period" bind:this={dotEl} class="text-brand-primary">.</span>
</a>
```

- [ ] **Step 4: Add the hover animation logic**

In the `<script>` section of Nav.svelte, add imports and state:

```typescript
import { onMount, onDestroy } from 'svelte';
import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
import { registerGsapPlugins, gsap, SplitText } from '$lib/motion/utils/gsap.js';

let wordmarkEl: HTMLSpanElement;
let dotEl: HTMLSpanElement;
let splitInstance: InstanceType<typeof SplitText> | undefined;
let effectIndex = 0;
let isAnimating = false;

const effects = [
	// Bounce: letters jump up with elastic ease
	(chars: Element[]) => gsap.timeline()
		.fromTo(chars, { y: 0 }, { y: -15, stagger: 0.04, duration: 0.3, ease: 'back.out(1.7)' })
		.to(chars, { y: 0, stagger: 0.04, duration: 0.3, ease: 'power2.out' }, '>-0.15'),

	// Wiggle: letters rotate left/right
	(chars: Element[]) => gsap.timeline()
		.to(chars, { rotation: 12, stagger: 0.03, duration: 0.15, ease: 'power1.out' })
		.to(chars, { rotation: -12, stagger: 0.03, duration: 0.15, ease: 'power1.out' })
		.to(chars, { rotation: 0, stagger: 0.03, duration: 0.3, ease: 'elastic.out(1, 0.3)' }),

	// Wave: sine-wave y-offset ripple
	(chars: Element[]) => gsap.timeline()
		.to(chars, {
			y: -10, stagger: { each: 0.05, from: 'start' },
			duration: 0.25, ease: 'sine.out', yoyo: true, repeat: 1
		}),

	// Spin: letters rotate 360
	(chars: Element[]) => gsap.timeline()
		.to(chars, {
			rotation: 360, stagger: 0.05, duration: 0.5, ease: 'power2.inOut'
		})
		.set(chars, { rotation: 0 }),
];

function handleWordmarkHover() {
	if (isAnimating || isPrefersReducedMotion() || !splitInstance) return;
	isAnimating = true;

	const tl = effects[effectIndex](splitInstance.chars);

	// Dot always pulses
	tl.fromTo(dotEl, { scale: 1 }, { scale: 1.4, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 }, 0);

	tl.then(() => { isAnimating = false; });
	effectIndex = (effectIndex + 1) % effects.length;
}

onMount(() => {
	if (isPrefersReducedMotion() || typeof window === 'undefined') return;
	registerGsapPlugins();
	splitInstance = new SplitText(wordmarkEl, { type: 'chars' });
});

onDestroy(() => {
	splitInstance?.revert();
});
```

Also update the mobile menu wordmark (line 88-90) to keep it static (no bind, no handler):

```svelte
<span class="font-heading text-xl font-bold text-[var(--text-primary)]">
	yesid<span class="text-brand-primary">.</span>
</span>
```

- [ ] **Step 5: Run tests**

Run: `bun run test src/lib/components/Nav.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Run full test suite**

Run: `bun run test`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/Nav.svelte src/lib/components/Nav.test.ts
git commit -m "feat(nav): add rotating hover animation on yesid. wordmark"
```

---

## Task 4: Build SkillsJourney Component

**Files:**
- Create: `src/lib/components/SkillsJourney.svelte`
- Create: `src/lib/components/SkillsJourney.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/components/SkillsJourney.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SkillsJourney from './SkillsJourney.svelte';

describe('SkillsJourney', () => {
	it('renders the journey container', () => {
		render(SkillsJourney);
		expect(screen.getByTestId('skills-journey')).toBeInTheDocument();
	});

	it('renders a panel for each data entry', () => {
		render(SkillsJourney);
		const panels = screen.getAllByTestId(/^journey-panel-/);
		expect(panels.length).toBeGreaterThanOrEqual(4);
	});

	it('renders the CTA prompt panel', () => {
		render(SkillsJourney);
		expect(screen.getByTestId('journey-cta-prompt')).toBeInTheDocument();
	});

	it('renders the CTA button linking to /contact', () => {
		render(SkillsJourney);
		const btn = screen.getByTestId('journey-cta-button');
		expect(btn).toBeInTheDocument();
		expect(btn.closest('a')).toHaveAttribute('href', '/contact');
	});

	it('renders skill icons in each panel', () => {
		render(SkillsJourney);
		const skills = screen.getAllByTestId(/^journey-skill-/);
		expect(skills.length).toBeGreaterThanOrEqual(4);
	});

	it('renders panel labels', () => {
		render(SkillsJourney);
		expect(screen.getByText('01 — FOUNDATION')).toBeInTheDocument();
		expect(screen.getByText('02 — ROUTES')).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/lib/components/SkillsJourney.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Build the SkillsJourney component**

Create `src/lib/components/SkillsJourney.svelte` with:

1. Import data from content.ts (skillsJourneyPanels, skillsJourneyCta)
2. Render panels in a horizontal flex track
3. Each panel: label, large text, skill icons (SVG switch)
4. CTA prompt panel + CTA button panel
5. onMount: GSAP ScrollTrigger (pin + horizontal scrub) + SplitText on panel text
6. Reduced motion: static vertical layout
7. SVG icon helper function (switch on SkillIcon type)

The component will have inline SVG icons rendered via a `{#snippet}` or helper function that switches on `skill.icon`. This keeps it self-contained.

Key implementation details:
- Pin container: `position: relative; overflow: hidden; height: 100vh;`
- Inner track: `display: flex; width: (panelCount * 100)vw;`
- GSAP: `gsap.to(track, { x: () => -(track.scrollWidth - window.innerWidth), ease: 'none' })` with `ScrollTrigger({ scrub: 1, pin: true, end: () => '+=' + (panelCount * 100) + '%' })`
- SplitText: applied to each panel's text element, animated at calculated scroll positions
- Orange metro line: thin `<div>` spanning the full track width at top

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/lib/components/SkillsJourney.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/SkillsJourney.svelte src/lib/components/SkillsJourney.test.ts
git commit -m "feat: add SkillsJourney horizontal scroll CTA component"
```

---

## Task 5: Integrate SkillsJourney into Home Page

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Add import and component**

In `src/routes/+page.svelte`, add import (after line 30):

```typescript
import SkillsJourney from '$lib/components/SkillsJourney.svelte';
```

Add `<SkillsJourney />` after `<HeroBanner />` (after line 172):

```svelte
<!-- Skills Journey: horizontal scroll CTA (Slice B) -->
<SkillsJourney />
```

- [ ] **Step 2: Run full test suite**

Run: `bun run test`
Expected: ALL PASS

- [ ] **Step 3: Run type check**

Run: `bun run check`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: integrate SkillsJourney into home page after hero"
```

---

## Task 6: Visual Verification + Iteration

- [ ] **Step 1: Start dev server and verify**

Run: `bun run dev`

Verify on http://localhost:5173/:
1. "NEXT STOP: SCROLL DOWN" shows on hero load (not "SCROLL DOWN")
2. Hover "yesid." in nav — 4 different effects cycle (bounce, wiggle, wave, spin)
3. Orange dot pulses on every hover
4. Scroll past hero → horizontal scroll CTA section pins and scrolls left
5. Each panel reveals text with SplitText effects
6. Skill SVG icons animate in
7. CTA button at the end links to /contact
8. Resize during animation — layout stays correct
9. Mobile viewport — wordmark static, horizontal section adapts
10. Hero animation (Slices A+C) still works exactly as before

- [ ] **Step 2: Ask Yesid to test on localhost**

Per CLAUDE.md iteration protocol: stop coding, ask Yesid to verify on his screen.

---

## Verification Checklist

- [ ] `bun run test` — all tests pass
- [ ] `bun run check` — 0 type errors
- [ ] Nav wordmark: 4 hover effects cycling, dot pulses
- [ ] Hero: "NEXT STOP: SCROLL DOWN" text
- [ ] SkillsJourney: 6 panels horizontal scroll with SplitText
- [ ] CTA button links to /contact
- [ ] Reduced motion: static fallback
- [ ] Mobile: wordmark static, journey adapts
- [ ] Slices A+C hero animation unchanged
- [ ] Backup branch exists: `backup/slice-a-c-complete`
