# Slice 12 — Footer Redesign + Favicon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the minimal footer with a professional, SEO-optimized footer carrying the site's metro/infrastructure identity, change the favicon to an orange dot, and add JSON-LD Person schema.

**Architecture:** Extract the nav's wordmark hover animation into a reusable Svelte action (`wordmarkHover`). Extend `SiteMeta` type with owner/schema fields. Rebuild `Footer.svelte` with semantic HTML (footer, nav, address, small), three-row layout, and monospace status bar. Add JSON-LD Person schema to the layout head.

**Tech Stack:** SvelteKit, Svelte 5, GSAP (SplitText), Tailwind v4, Vitest, Bun

**Design spec:** `docs/specs/2026-04-09-slice-12-footer-favicon-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/motion/actions/wordmarkHover.ts` | Reusable Svelte action for GSAP SplitText wordmark animation |
| Create | `src/lib/motion/actions/wordmarkHover.test.ts` | Unit tests for the action |
| Modify | `src/lib/motion/actions/index.ts` | Export the new action |
| Modify | `src/lib/data/types.ts` | Add `SiteOwner` interface, extend `SiteMeta` |
| Modify | `src/lib/data/meta.ts` | Add `owner` data to `siteMeta` |
| Modify | `src/lib/data/index.ts` | Export new type |
| Create | `src/lib/data/schema.ts` | JSON-LD Person schema builder function |
| Create | `src/lib/data/schema.test.ts` | Unit tests for schema output |
| Modify | `src/lib/components/Footer.svelte` | Full rebuild: 3-row layout, semantic HTML, animated wordmark |
| Modify | `src/lib/components/Footer.test.ts` | Updated tests for new structure |
| Modify | `src/lib/components/Nav.svelte` | Refactor to use shared `wordmarkHover` action |
| Modify | `src/routes/+layout.svelte` | Add JSON-LD schema to `<svelte:head>` |
| Modify | `static/favicon.svg` | Replace "Y" with orange dot |
| Modify | `src/lib/assets/favicon.svg` | Replace "Y" with orange dot |

---

## Task 1: Favicon — Orange Dot

**Files:**
- Modify: `static/favicon.svg`
- Modify: `src/lib/assets/favicon.svg`

- [ ] **Step 1: Replace `static/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="12" fill="#E07800"/>
</svg>
```

- [ ] **Step 2: Replace `src/lib/assets/favicon.svg`**

Same content as above. Both files must be identical.

- [ ] **Step 3: Verify in browser**

Run `bun run dev`, check the browser tab. The favicon should be an orange circle, not "Y".

- [ ] **Step 4: Commit**

```bash
git add static/favicon.svg src/lib/assets/favicon.svg
git commit -m "feat(slice-12): replace favicon Y with orange dot brand mark"
```

---

## Task 2: Extend Data Layer — SiteOwner Type + Schema Fields

**Files:**
- Modify: `src/lib/data/types.ts:114-121`
- Modify: `src/lib/data/meta.ts`
- Modify: `src/lib/data/index.ts`

- [ ] **Step 1: Add `SiteOwner` interface to `types.ts`**

Add above the existing `SiteMeta` interface (before line 114):

```typescript
export interface SiteAddress {
	locality: string;
	region: string;
	country: string;
}

export interface SiteOwner {
	name: string;
	jobTitle: LocalizedString;
	address: SiteAddress;
	knowsAbout: readonly string[];
}
```

- [ ] **Step 2: Extend `SiteMeta` with `owner` field**

In `types.ts`, add to the `SiteMeta` interface:

```typescript
export interface SiteMeta {
	name: string;
	tagline: LocalizedString;
	description: LocalizedString;
	links: SiteLinks;
	owner: SiteOwner;
}
```

- [ ] **Step 3: Add owner data to `meta.ts`**

```typescript
import type { SiteMeta } from './types.js';

export const siteMeta: SiteMeta = {
	name: 'yesid.',
	tagline: {
		en: 'Data infrastructure that moves.'
	},
	description: {
		en: 'Freelance SQL developer and data infrastructure consultant based in Montreal. PostgreSQL, dbt, Power BI, and Python.'
	},
	links: {
		email: 'contact@yesid.dev',
		github: 'https://github.com/mgkdante',
		linkedin: 'https://www.linkedin.com/in/otaloray/',
		upwork: 'https://www.upwork.com/freelancers/~011ba4ec420b4cdd82'
	},
	owner: {
		name: 'Yesid O.',
		jobTitle: {
			en: 'Data Infrastructure Consultant',
			fr: 'Consultant en infrastructure de données',
			es: 'Consultor de infraestructura de datos'
		},
		address: {
			locality: 'Montreal',
			region: 'QC',
			country: 'CA'
		},
		knowsAbout: [
			'PostgreSQL', 'dbt', 'Power BI', 'Python',
			'Data Infrastructure', 'ETL', 'Data Warehousing',
			'SvelteKit', 'TypeScript'
		]
	}
};
```

- [ ] **Step 4: Export new types from `index.ts`**

In `src/lib/data/index.ts`, update the type export line to include the new types:

```typescript
export type { ..., SiteOwner, SiteAddress } from './types.js';
```

- [ ] **Step 5: Run `bun run check`**

Verify no type errors. The existing data integrity test (`data-integrity.test.ts`) should still pass since we're extending, not breaking.

- [ ] **Step 6: Run `bun run test`**

All existing tests should pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/data/types.ts src/lib/data/meta.ts src/lib/data/index.ts
git commit -m "feat(slice-12): extend SiteMeta with owner schema fields"
```

---

## Task 3: JSON-LD Person Schema Builder

**Files:**
- Create: `src/lib/data/schema.ts`
- Create: `src/lib/data/schema.test.ts`
- Modify: `src/lib/data/index.ts`

- [ ] **Step 1: Write failing tests for schema builder**

Create `src/lib/data/schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildPersonSchema } from './schema.js';
import { siteMeta } from './meta.js';

describe('buildPersonSchema', () => {
	const schema = buildPersonSchema(siteMeta);
	const parsed = JSON.parse(schema);

	it('produces valid JSON', () => {
		expect(() => JSON.parse(schema)).not.toThrow();
	});

	it('sets @context to schema.org', () => {
		expect(parsed['@context']).toBe('https://schema.org');
	});

	it('sets @type to Person', () => {
		expect(parsed['@type']).toBe('Person');
	});

	it('includes owner name', () => {
		expect(parsed.name).toBe('Yesid O.');
	});

	it('includes jobTitle from English locale', () => {
		expect(parsed.jobTitle).toBe('Data Infrastructure Consultant');
	});

	it('includes url', () => {
		expect(parsed.url).toBe('https://yesid.dev');
	});

	it('includes address with locality, region, country', () => {
		expect(parsed.address).toEqual({
			'@type': 'PostalAddress',
			addressLocality: 'Montreal',
			addressRegion: 'QC',
			addressCountry: 'CA'
		});
	});

	it('includes sameAs array with social links', () => {
		expect(parsed.sameAs).toContain('https://github.com/mgkdante');
		expect(parsed.sameAs).toContain('https://www.linkedin.com/in/otaloray/');
	});

	it('includes knowsAbout array', () => {
		expect(parsed.knowsAbout).toContain('PostgreSQL');
		expect(parsed.knowsAbout).toContain('dbt');
	});

	it('includes email', () => {
		expect(parsed.email).toBe('contact@yesid.dev');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/lib/data/schema.test.ts
```

Expected: FAIL — `buildPersonSchema` not found.

- [ ] **Step 3: Implement `schema.ts`**

Create `src/lib/data/schema.ts`:

```typescript
import type { SiteMeta } from './types.js';

/**
 * Builds a JSON-LD Person schema string from site metadata.
 * Output goes into a <script type="application/ld+json"> tag.
 */
export function buildPersonSchema(meta: SiteMeta): string {
	const sameAs: string[] = [];
	if (meta.links.github) sameAs.push(meta.links.github);
	if (meta.links.linkedin) sameAs.push(meta.links.linkedin);
	if (meta.links.upwork) sameAs.push(meta.links.upwork);

	return JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: meta.owner.name,
		jobTitle: meta.owner.jobTitle.en,
		url: 'https://yesid.dev',
		address: {
			'@type': 'PostalAddress',
			addressLocality: meta.owner.address.locality,
			addressRegion: meta.owner.address.region,
			addressCountry: meta.owner.address.country
		},
		sameAs,
		knowsAbout: [...meta.owner.knowsAbout],
		email: meta.links.email
	});
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/lib/data/schema.test.ts
```

Expected: All 9 tests PASS.

- [ ] **Step 5: Export from `index.ts`**

Add to `src/lib/data/index.ts`:

```typescript
// JSON-LD schema builder (Slice 12 — SEO)
export { buildPersonSchema } from './schema.js';
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/data/schema.ts src/lib/data/schema.test.ts src/lib/data/index.ts
git commit -m "feat(slice-12): add JSON-LD Person schema builder"
```

---

## Task 4: Extract Wordmark Hover Action

**Files:**
- Create: `src/lib/motion/actions/wordmarkHover.ts`
- Create: `src/lib/motion/actions/wordmarkHover.test.ts`
- Modify: `src/lib/motion/actions/index.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/motion/actions/wordmarkHover.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock GSAP and SplitText since jsdom can't run them
vi.mock('$lib/motion/utils/gsap.js', () => {
	const timelineMock = {
		fromTo: vi.fn().mockReturnThis(),
		to: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),
		then: vi.fn((cb: () => void) => { cb(); return timelineMock; })
	};
	return {
		gsap: {
			timeline: vi.fn(() => timelineMock),
			registerPlugin: vi.fn()
		},
		SplitText: vi.fn().mockImplementation(() => ({
			chars: [document.createElement('span'), document.createElement('span')],
			revert: vi.fn()
		})),
		registerGsapPlugins: vi.fn()
	};
});

function mockMatchMedia(matches: boolean) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockReturnValue({
			matches,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		})
	});
}

describe('wordmarkHover action', () => {
	beforeEach(() => {
		mockMatchMedia(false);
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns an object with a destroy method', async () => {
		const { wordmarkHover } = await import('./wordmarkHover.js');
		const el = document.createElement('span');
		el.textContent = 'yesid';
		const dot = document.createElement('span');
		const result = wordmarkHover(el, { dotEl: dot });
		expect(typeof result.destroy).toBe('function');
	});

	it('registers GSAP plugins on mount', async () => {
		const gsapMod = await import('$lib/motion/utils/gsap.js');
		const { wordmarkHover } = await import('./wordmarkHover.js');
		const el = document.createElement('span');
		const dot = document.createElement('span');
		wordmarkHover(el, { dotEl: dot });
		expect(gsapMod.registerGsapPlugins).toHaveBeenCalled();
	});

	it('creates a SplitText instance on the text element', async () => {
		const gsapMod = await import('$lib/motion/utils/gsap.js');
		const { wordmarkHover } = await import('./wordmarkHover.js');
		const el = document.createElement('span');
		const dot = document.createElement('span');
		wordmarkHover(el, { dotEl: dot });
		expect(gsapMod.SplitText).toHaveBeenCalledWith(el, { type: 'chars' });
	});

	it('does nothing when prefers-reduced-motion is on', async () => {
		mockMatchMedia(true);
		vi.resetModules();
		const gsapMod = await import('$lib/motion/utils/gsap.js');
		const { wordmarkHover } = await import('./wordmarkHover.js');
		const el = document.createElement('span');
		const dot = document.createElement('span');
		wordmarkHover(el, { dotEl: dot });
		expect(gsapMod.SplitText).not.toHaveBeenCalled();
	});

	it('reverts SplitText on destroy', async () => {
		const gsapMod = await import('$lib/motion/utils/gsap.js');
		const { wordmarkHover } = await import('./wordmarkHover.js');
		const el = document.createElement('span');
		const dot = document.createElement('span');
		const action = wordmarkHover(el, { dotEl: dot });
		action.destroy();

		const splitInstance = (gsapMod.SplitText as unknown as ReturnType<typeof vi.fn>).mock.results[0]?.value;
		expect(splitInstance.revert).toHaveBeenCalled();
	});

	it('triggers animation on mouseenter', async () => {
		const gsapMod = await import('$lib/motion/utils/gsap.js');
		const { wordmarkHover } = await import('./wordmarkHover.js');
		const el = document.createElement('span');
		const dot = document.createElement('span');
		wordmarkHover(el, { dotEl: dot });

		el.dispatchEvent(new MouseEvent('mouseenter'));

		expect(gsapMod.gsap.timeline).toHaveBeenCalled();
	});

	it('accepts autoPlay option to fire on mount', async () => {
		const gsapMod = await import('$lib/motion/utils/gsap.js');
		const { wordmarkHover } = await import('./wordmarkHover.js');
		const el = document.createElement('span');
		const dot = document.createElement('span');
		wordmarkHover(el, { dotEl: dot, autoPlay: true });

		// autoPlay calls the first effect immediately (via setTimeout 0)
		expect(gsapMod.gsap.timeline).toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/lib/motion/actions/wordmarkHover.test.ts
```

Expected: FAIL — `wordmarkHover` not found.

- [ ] **Step 3: Implement `wordmarkHover.ts`**

Create `src/lib/motion/actions/wordmarkHover.ts`:

```typescript
// use:wordmarkHover — GSAP SplitText animation pool for the "yesid." brand wordmark.
//
// Four effects rotate on each hover (bounce, wiggle, wave, spin).
// The orange dot always pulses alongside any effect.
// Shared between Nav and Footer to keep the interaction consistent.
//
// Usage: <span use:wordmarkHover={{ dotEl: dotRef }}>yesid</span>

import { isPrefersReducedMotion } from '../stores/reducedMotion.js';
import { registerGsapPlugins, gsap, SplitText } from '../utils/gsap.js';

export interface WordmarkHoverParams {
	/** Reference to the dot element (the "." after "yesid") */
	dotEl: HTMLElement;
	/** If true, play the first effect immediately on mount (e.g., nav on page load). Default: false */
	autoPlay?: boolean;
	/** Delay in ms before autoPlay fires. Default: 500 */
	autoPlayDelay?: number;
}

export function wordmarkHover(node: HTMLElement, params: WordmarkHoverParams) {
	if (isPrefersReducedMotion() || typeof window === 'undefined') {
		return { destroy() {} };
	}

	const { dotEl, autoPlay = false, autoPlayDelay = 500 } = params;

	registerGsapPlugins();
	const splitInstance = new SplitText(node, { type: 'chars' });

	let effectIndex = 0;
	let isAnimating = false;

	// --- Effect pool ---

	const effectBounce = (chars: Element[]) =>
		gsap
			.timeline()
			.fromTo(chars, { y: 0 }, { y: -15, stagger: 0.04, duration: 0.3, ease: 'back.out(1.7)' })
			.to(chars, { y: 0, stagger: 0.04, duration: 0.3, ease: 'power2.out' }, '>-0.15');

	const effectWiggle = (chars: Element[]) =>
		gsap
			.timeline()
			.to(chars, { rotation: 12, stagger: 0.03, duration: 0.15, ease: 'power1.out' })
			.to(chars, { rotation: -12, stagger: 0.03, duration: 0.15, ease: 'power1.out' })
			.to(chars, { rotation: 0, stagger: 0.03, duration: 0.3, ease: 'elastic.out(1, 0.3)' });

	const effectWave = (chars: Element[]) =>
		gsap.timeline().to(chars, {
			y: -10,
			stagger: { each: 0.05, from: 'start' },
			duration: 0.25,
			ease: 'sine.out',
			yoyo: true,
			repeat: 1
		});

	const effectSpin = (chars: Element[]) =>
		gsap
			.timeline()
			.to(chars, { rotation: 360, stagger: 0.05, duration: 0.5, ease: 'power2.inOut' })
			.set(chars, { rotation: 0 });

	const effects = [effectBounce, effectWiggle, effectWave, effectSpin];

	function playEffect() {
		if (isAnimating || !splitInstance) return;
		isAnimating = true;

		const tl = effects[effectIndex](splitInstance.chars);

		tl.fromTo(
			dotEl,
			{ scale: 1 },
			{ scale: 1.4, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 },
			0
		);

		tl.then(() => {
			isAnimating = false;
		});

		effectIndex = (effectIndex + 1) % effects.length;
	}

	node.addEventListener('mouseenter', playEffect);

	if (autoPlay) {
		setTimeout(playEffect, autoPlayDelay);
	}

	return {
		destroy() {
			node.removeEventListener('mouseenter', playEffect);
			splitInstance?.revert();
		}
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/lib/motion/actions/wordmarkHover.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Export from actions `index.ts`**

Add to `src/lib/motion/actions/index.ts`:

```typescript
export { wordmarkHover, type WordmarkHoverParams } from './wordmarkHover.js';
```

- [ ] **Step 6: Run full test suite**

```bash
bun run test
```

All existing tests should still pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/motion/actions/wordmarkHover.ts src/lib/motion/actions/wordmarkHover.test.ts src/lib/motion/actions/index.ts
git commit -m "feat(slice-12): extract wordmarkHover action from Nav"
```

---

## Task 5: Refactor Nav to Use Shared Action

**Files:**
- Modify: `src/lib/components/Nav.svelte`

- [ ] **Step 1: Replace inline animation code with the action**

In `Nav.svelte`, replace the entire animation system (lines 37-130) with the shared action. The refactored script section:

```svelte
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { wordmarkHover } from '$lib/motion/actions';
	import { navLinks } from '$lib/data';
	import MenuOverlay from './MenuOverlay.svelte';

	let { pathname = '/' }: { pathname?: string } = $props();

	let menuOpen = $state(false);
	let overlayActive = $state(false);

	function toggleMenu() {
		if (menuOpen) {
			menuOpen = false;
		} else if (!overlayActive) {
			menuOpen = true;
			overlayActive = true;
		}
	}

	function handleOverlayClose() {
		menuOpen = false;
	}

	function handleOverlayDone() {
		overlayActive = false;
	}

	let wordmarkEl: HTMLSpanElement;
	let dotEl: HTMLSpanElement;
	let wordmarkAction: ReturnType<typeof wordmarkHover> | undefined;

	function isActive(href: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && menuOpen) menuOpen = false;
	}

	onMount(() => {
		wordmarkAction = wordmarkHover(wordmarkEl, {
			dotEl,
			autoPlay: true,
			autoPlayDelay: 500
		});
	});

	onDestroy(() => {
		wordmarkAction?.destroy();
	});
</script>
```

Remove the `onmouseenter={handleWordmarkHover}` and `onclick={handleWordmarkHover}` from the wordmark `<a>` tag. The action handles mouseenter internally. Keep the `bind:this` refs.

Update the wordmark markup:

```svelte
<a
	href="/"
	data-testid="nav-wordmark"
	class="inline-flex items-baseline font-heading text-lg font-bold text-[var(--text-primary)]"
>
	<span data-testid="nav-wordmark-letters" bind:this={wordmarkEl}>yesid</span><span
		data-testid="nav-period"
		bind:this={dotEl}
		class="text-brand-primary">.</span
	>
</a>
```

- [ ] **Step 2: Run existing nav tests**

```bash
bun run test src/lib/components/Nav.test.ts
```

Expected: All PASS. The nav tests check DOM structure and rendering, not GSAP internals.

- [ ] **Step 3: Verify in browser**

Run `bun run dev`, hover the wordmark in the nav pill. All 4 effects should still cycle. Auto-play should fire on page load.

- [ ] **Step 4: Run full test suite**

```bash
bun run test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/Nav.svelte
git commit -m "refactor(slice-12): Nav uses shared wordmarkHover action"
```

---

## Task 6: Rebuild Footer Component

**Files:**
- Modify: `src/lib/components/Footer.svelte`

- [ ] **Step 1: Rewrite Footer.svelte**

```svelte
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { siteMeta, menuItems } from '$lib/data';
	import { wordmarkHover } from '$lib/motion/actions';

	const year = new Date().getFullYear();

	// Format today's date as YYYY.MM.DD
	const now = new Date();
	const systemDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

	// Filter menu items to site pages (exclude Contact for nav, it's separate? No — include all 6)
	const footerNavLinks = menuItems.map((item) => ({
		label: item.label.en,
		href: item.href
	}));

	const socialLinks = [
		siteMeta.links.github ? { label: 'GitHub', href: siteMeta.links.github } : null,
		siteMeta.links.linkedin ? { label: 'LinkedIn', href: siteMeta.links.linkedin } : null,
		siteMeta.links.upwork ? { label: 'Upwork', href: siteMeta.links.upwork } : null
	].filter((link): link is { label: string; href: string } => link !== null);

	let wordmarkEl: HTMLSpanElement;
	let dotEl: HTMLSpanElement;
	let wordmarkAction: ReturnType<typeof wordmarkHover> | undefined;

	onMount(() => {
		wordmarkAction = wordmarkHover(wordmarkEl, { dotEl });
	});

	onDestroy(() => {
		wordmarkAction?.destroy();
	});
</script>

<footer data-testid="footer" class="relative z-50 bg-[var(--bg-primary)]">
	<!-- Gradient separator -->
	<div class="footer-gradient-sep" aria-hidden="true"></div>

	<!-- Row 1: Main content -->
	<div class="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pb-5 pt-10 sm:flex-row sm:items-start sm:justify-between sm:px-10 sm:pt-12">
		<!-- Left: Wordmark -->
		<div class="flex flex-col items-center sm:items-start">
			<a
				href="/"
				data-testid="footer-wordmark"
				class="inline-flex items-baseline font-heading text-xl font-bold text-[var(--text-primary)]"
			>
				<span bind:this={wordmarkEl}>yesid</span><span
					bind:this={dotEl}
					class="text-brand-primary">.</span
				>
			</a>
			<span class="mt-1 font-mono text-xs text-[var(--text-muted)]">// digital infrastructure</span>
		</div>

		<!-- Center: Nav links -->
		<nav aria-label="Footer navigation" class="flex flex-wrap justify-center gap-x-6 gap-y-2">
			{#each footerNavLinks as link}
				<a
					href={link.href}
					class="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-brand-primary"
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<!-- Right: Social links -->
		<div class="flex items-center gap-4">
			{#each socialLinks as link}
				<a
					href={link.href}
					target="_blank"
					rel="noopener noreferrer"
					class="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-brand-primary"
					aria-label={link.label}
				>
					{link.label}
				</a>
			{/each}
		</div>
	</div>

	<!-- Row 2: Status bar -->
	<div class="footer-status-border mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-4 font-mono text-[11px] text-[var(--text-muted)] sm:flex-row sm:justify-between sm:px-10">
		<small>&copy; {year} yesid<span class="text-brand-primary">.</span></small>
		<address class="not-italic">Montreal, QC &middot; Remote</address>
		<span class="flex items-center gap-1.5">
			<span class="footer-status-dot" aria-hidden="true"></span>
			system online &mdash; {systemDate}
		</span>
	</div>

	<!-- Row 3: Bottom accent stripe -->
	<div class="footer-bottom-stripe" aria-hidden="true"></div>
</footer>

<style>
	.footer-gradient-sep {
		height: 1px;
		background: linear-gradient(90deg, transparent, #E07800 20%, #E07800 80%, transparent);
		opacity: 0.15;
	}

	.footer-status-border {
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.footer-status-dot {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #E07800;
		box-shadow: 0 0 6px #E07800, 0 0 12px rgba(224, 120, 0, 0.3);
	}

	.footer-bottom-stripe {
		height: 2px;
		background: linear-gradient(90deg, #E07800, #FFB627);
	}
</style>
```

- [ ] **Step 2: Run `bun run check`**

Fix any type errors.

- [ ] **Step 3: Verify in browser**

Check at `http://localhost:5173/`:
- Desktop (1440px): Three-column layout — wordmark left, nav center, socials right. Status bar below with copyright/location/system-online.
- Mobile (375px): Stacked vertically, centered.
- Wordmark hover: All 4 effects cycle.
- Bottom stripe: Orange → yellow gradient.
- Check on `/services` — footer should still be hidden.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/Footer.svelte
git commit -m "feat(slice-12): rebuild Footer with 3-row layout and status bar"
```

---

## Task 7: Update Footer Tests

**Files:**
- Modify: `src/lib/components/Footer.test.ts`

- [ ] **Step 1: Rewrite footer tests**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Footer from './Footer.svelte';

describe('Footer', () => {
	it('renders a footer element', () => {
		render(Footer);
		expect(screen.getByTestId('footer')).toBeInTheDocument();
	});

	it('renders the yesid wordmark', () => {
		render(Footer);
		expect(screen.getByTestId('footer-wordmark')).toBeInTheDocument();
		expect(screen.getByTestId('footer-wordmark').textContent).toContain('yesid');
	});

	it('renders the current year in copyright', () => {
		render(Footer);
		const year = new Date().getFullYear().toString();
		const small = screen.getByText(new RegExp(`©\\s*${year}`));
		expect(small).toBeInTheDocument();
	});

	it('renders footer navigation with aria-label', () => {
		render(Footer);
		const nav = screen.getByRole('navigation', { name: /footer navigation/i });
		expect(nav).toBeInTheDocument();
	});

	it('renders all 6 site navigation links', () => {
		render(Footer);
		const nav = screen.getByRole('navigation', { name: /footer navigation/i });
		const links = nav.querySelectorAll('a');
		expect(links.length).toBe(6);
	});

	it('renders links to Services, Work, Blog, Stack, About, Contact', () => {
		render(Footer);
		expect(screen.getByRole('link', { name: /services/i })).toHaveAttribute('href', '/services');
		expect(screen.getByRole('link', { name: /work/i })).toHaveAttribute('href', '/work');
		expect(screen.getByRole('link', { name: /blog/i })).toHaveAttribute('href', '/blog');
		expect(screen.getByRole('link', { name: /stack/i })).toHaveAttribute('href', '/tech-stack');
		expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about');
		expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/contact');
	});

	it('renders GitHub social link with target=_blank', () => {
		render(Footer);
		const link = screen.getByRole('link', { name: /github/i });
		expect(link).toHaveAttribute('href', 'https://github.com/mgkdante');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
	});

	it('renders LinkedIn social link with target=_blank', () => {
		render(Footer);
		const link = screen.getByRole('link', { name: /linkedin/i });
		expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/otaloray/');
		expect(link).toHaveAttribute('target', '_blank');
	});

	it('renders the status bar with system date', () => {
		render(Footer);
		const now = new Date();
		const expectedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
		expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument();
	});

	it('renders system online status text', () => {
		render(Footer);
		expect(screen.getByText(/system online/)).toBeInTheDocument();
	});

	it('renders location in an address element', () => {
		render(Footer);
		const address = document.querySelector('footer address');
		expect(address).not.toBeNull();
		expect(address?.textContent).toContain('Montreal');
	});

	it('renders the digital infrastructure tagline', () => {
		render(Footer);
		expect(screen.getByText(/digital infrastructure/)).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run footer tests**

```bash
bun run test src/lib/components/Footer.test.ts
```

Expected: All 12 tests PASS.

- [ ] **Step 3: Run full test suite**

```bash
bun run test
```

All tests should pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/Footer.test.ts
git commit -m "test(slice-12): update footer tests for new layout"
```

---

## Task 8: Add JSON-LD Schema to Layout

**Files:**
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Import and add schema to head**

Add the import and `<svelte:head>` content to `+layout.svelte`:

```svelte
<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/stores';
	import { prefersReducedMotion } from '$lib/motion/stores';
	import { siteMeta, buildPersonSchema } from '$lib/data';

	let { children } = $props();

	let isHome = $derived($page.url.pathname === '/');
	let isFullWidth = $derived(isHome || $page.url.pathname.startsWith('/services') || $page.url.pathname.startsWith('/about') || $page.url.pathname.startsWith('/contact') || $page.url.pathname.startsWith('/tech-stack') || $page.error !== null);
	let hideFooter = $derived($page.url.pathname === '/services');

	const personSchema = buildPersonSchema(siteMeta);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html `<script type="application/ld+json">${personSchema}</script>`}
</svelte:head>
```

- [ ] **Step 2: Run `bun run check`**

Verify no type errors.

- [ ] **Step 3: Verify in browser**

Open any page, view source or DevTools Elements. Look for `<script type="application/ld+json">` in the `<head>`. It should contain the Person schema JSON.

Validate at https://search.google.com/test/rich-results with the local URL or paste the JSON.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat(slice-12): add JSON-LD Person schema to layout head"
```

---

## Task 9: Final Verification + Docs

**Files:**
- Various docs

- [ ] **Step 1: Run full test suite**

```bash
bun run test
```

Print the results table per CLAUDE.md rules.

- [ ] **Step 2: Run type checker**

```bash
bun run check
```

- [ ] **Step 3: Visual verification**

Check all pages in browser:
- Home, Services, Work, Blog, Stack, About, Contact
- Verify footer appears on all except `/services`
- Verify wordmark hover works in both Nav and Footer
- Verify favicon is orange dot
- Verify status bar shows correct date
- Mobile responsive check at 375px

- [ ] **Step 4: Update docs/reference/TESTS.md**

Add entries for new test files:
- `src/lib/motion/actions/wordmarkHover.test.ts` under **## Motion** section
- `src/lib/data/schema.test.ts` under **## Data Layer** section
- Updated `src/lib/components/Footer.test.ts` entry under **## Components** section

- [ ] **Step 5: Update docs/reference/ARCHITECTURE.md if needed**

Add note about JSON-LD schema in the data layer section. Mention the `wordmarkHover` action in the motion layer.

- [ ] **Step 6: STOP — await Yesid's approval**

Present what was built and what to check. Do NOT proceed to slice closing until Yesid confirms everything looks good.
