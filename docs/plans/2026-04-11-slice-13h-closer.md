# Slice 13h — "The Closer" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the final home page section — a departure board on a graffiti wall that merges Blog Teaser, About Strip, and Dual CTA into one compact, high-conversion closer.

**Architecture:** Single component (`HomeCloser.svelte`) with data from `content.ts` (static rows), `blog.ts` (dynamic post titles), and `meta.ts` (social links). Background uses a Vecteezy graffiti SVG positioned as a side mural with CSS filter recoloring. GSAP ScrollTrigger handles entrance animations.

**Tech Stack:** SvelteKit 2, Svelte 5, GSAP (ScrollTrigger), Tailwind v4, Bun

**Runtime:** Bun only. Never npm/npx/node.

**Design spec:** `docs/specs/2026-04-11-slice-13h-closer-design.md`

---

## File Structure

### Files to create

- `src/lib/components/HomeCloser.svelte` — the closer section component
- `src/lib/components/HomeCloser.test.ts` — component tests

### Files to modify

- `src/lib/data/content.ts` — add `closerContent` export
- `src/lib/data/content.test.ts` — add `closerContent` tests
- `src/lib/data/index.ts:34` — add `closerContent` to barrel export
- `src/routes/+page.svelte` — import and render `HomeCloser` + hard-cut divider
- `src/routes/home.test.ts` — add closer section integration tests

### Files to move

- `static/svg/graffit/graffiti.svg` → `static/svg/graffiti/graffiti.svg` (folder rename, typo fix)

---

## Task 1: Rename graffiti folder + add closerContent to data layer

**Files:**
- Move: `static/svg/graffit/` → `static/svg/graffiti/`
- Modify: `src/lib/data/content.ts`
- Modify: `src/lib/data/index.ts:34`
- Test: `src/lib/data/content.test.ts`

- [ ] **Step 1: Rename the folder**

```bash
mv static/svg/graffit static/svg/graffiti
```

- [ ] **Step 2: Write the failing test for closerContent**

Add to `src/lib/data/content.test.ts`:

```typescript
// At the top, update the import:
import { heroContent, manifestoContent, aboutContent, ctaContent, skillsJourneyPanels, skillsJourneyCta, proofReelContent, closerContent } from './content.js';

// Add new describe block at the end:
describe('closerContent', () => {
	it('has heading and subheading', () => {
		expect(closerContent.heading.en).toBe('TERMINUS');
		expect(closerContent.headingDot.en).toBe('.');
		expect(closerContent.subheading.en).toContain('FIN DE LIGNE');
	});

	it('has contact row with label, description, and action', () => {
		expect(closerContent.rows.contact.label.en).toBe('CONTACT');
		expect(closerContent.rows.contact.description.en.length).toBeGreaterThan(0);
		expect(closerContent.rows.contact.action.en).toContain('GO');
	});

	it('has connect row with label, description, and action', () => {
		expect(closerContent.rows.connect.label.en).toBe('CONNECT');
		expect(closerContent.rows.connect.description.en).toContain('LinkedIn');
		expect(closerContent.rows.connect.action.en).toContain('GO');
	});

	it('has read row with label and action', () => {
		expect(closerContent.rows.read.label.en).toBe('READ');
		expect(closerContent.rows.read.action.en).toBe('→');
	});

	it('has about row with label, description, and action', () => {
		expect(closerContent.rows.about.label.en).toBe('ABOUT');
		expect(closerContent.rows.about.description.en).toContain('Yesid');
		expect(closerContent.rows.about.action.en).toBe('→');
	});

	it('has attribution with text and URL', () => {
		expect(closerContent.attribution.text.en).toContain('Vecteezy');
		expect(closerContent.attribution.url).toContain('vecteezy.com');
	});
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun run test -- src/lib/data/content.test.ts`
Expected: FAIL — `closerContent` is not exported from `./content.js`

- [ ] **Step 4: Add closerContent to content.ts**

Add at the end of `src/lib/data/content.ts` (before the `skillsJourneyPanels` block):

```typescript
export const closerContent = {
	heading: { en: 'TERMINUS' } satisfies LocalizedString,
	headingDot: { en: '.' } satisfies LocalizedString,
	subheading: { en: 'FIN DE LIGNE \u00B7 END OF LINE' } satisfies LocalizedString,
	rows: {
		contact: {
			label: { en: 'CONTACT' } satisfies LocalizedString,
			description: { en: 'Start a project together' } satisfies LocalizedString,
			action: { en: '\u2192 GO' } satisfies LocalizedString,
		},
		connect: {
			label: { en: 'CONNECT' } satisfies LocalizedString,
			description: { en: 'LinkedIn \u00B7 full-time roles' } satisfies LocalizedString,
			action: { en: '\u2192 GO' } satisfies LocalizedString,
		},
		read: {
			label: { en: 'READ' } satisfies LocalizedString,
			action: { en: '\u2192' } satisfies LocalizedString,
		},
		about: {
			label: { en: 'ABOUT' } satisfies LocalizedString,
			description: { en: 'Yesid O. \u00B7 Montreal' } satisfies LocalizedString,
			action: { en: '\u2192' } satisfies LocalizedString,
		},
	},
	attribution: {
		text: { en: 'Graffiti Vectors by Vecteezy' } satisfies LocalizedString,
		url: 'https://www.vecteezy.com/free-vector/graffiti',
	},
} as const;
```

- [ ] **Step 5: Add closerContent to barrel export**

In `src/lib/data/index.ts`, update line 34:

```typescript
export { heroAnimContent, heroContent, aboutContent, ctaContent, skillsJourneyPanels, skillsJourneyCta, proofReelContent, closerContent } from './content.js';
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `bun run test -- src/lib/data/content.test.ts`
Expected: ALL PASS

- [ ] **Step 7: Run full check**

Run: `bun run check`
Expected: Clean — no type errors

---

## Task 2: Create HomeCloser component (static structure + board rows)

**Files:**
- Create: `src/lib/components/HomeCloser.svelte`
- Create: `src/lib/components/HomeCloser.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/components/HomeCloser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HomeCloser from './HomeCloser.svelte';

describe('HomeCloser', () => {
	it('renders the section with correct testid', () => {
		render(HomeCloser);
		expect(screen.getByTestId('closer-section')).toBeInTheDocument();
	});

	it('renders the TERMINUS heading with orange dot', () => {
		render(HomeCloser);
		const heading = screen.getByTestId('closer-heading');
		expect(heading).toBeInTheDocument();
		expect(heading.textContent).toContain('TERMINUS');
		expect(heading.textContent).toContain('.');
	});

	it('renders the subheading', () => {
		render(HomeCloser);
		const sub = screen.getByTestId('closer-subheading');
		expect(sub).toBeInTheDocument();
		expect(sub.textContent).toContain('FIN DE LIGNE');
	});

	it('renders the departure board with 5 rows', () => {
		render(HomeCloser);
		const board = screen.getByTestId('closer-board');
		expect(board).toBeInTheDocument();
		const rows = screen.getAllByTestId('closer-row');
		expect(rows).toHaveLength(5);
	});

	it('renders CONTACT row linking to /contact', () => {
		render(HomeCloser);
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[0].getAttribute('href')).toBe('/contact');
		expect(rows[0].textContent).toContain('CONTACT');
		expect(rows[0].textContent).toContain('Start a project together');
	});

	it('renders CONNECT row linking to LinkedIn', () => {
		render(HomeCloser);
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[1].getAttribute('href')).toContain('linkedin.com');
		expect(rows[1].textContent).toContain('CONNECT');
	});

	it('renders 2 READ rows with dynamic blog titles', () => {
		render(HomeCloser);
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[2].textContent).toContain('READ');
		expect(rows[3].textContent).toContain('READ');
		// Rows link to /blog/
		expect(rows[2].getAttribute('href')).toContain('/blog/');
		expect(rows[3].getAttribute('href')).toContain('/blog/');
	});

	it('renders ABOUT row linking to /about', () => {
		render(HomeCloser);
		const rows = screen.getAllByTestId('closer-row');
		expect(rows[4].getAttribute('href')).toBe('/about');
		expect(rows[4].textContent).toContain('ABOUT');
		expect(rows[4].textContent).toContain('Yesid');
	});

	it('renders social links', () => {
		render(HomeCloser);
		const socials = screen.getByTestId('closer-socials');
		expect(socials).toBeInTheDocument();
		expect(socials.textContent).toContain('LinkedIn');
		expect(socials.textContent).toContain('GitHub');
	});

	it('renders Vecteezy attribution with link', () => {
		render(HomeCloser);
		const attr = screen.getByTestId('closer-attribution');
		expect(attr).toBeInTheDocument();
		expect(attr.textContent).toContain('Vecteezy');
		const link = attr.querySelector('a');
		expect(link?.getAttribute('href')).toContain('vecteezy.com');
		expect(link?.getAttribute('rel')).toContain('noopener');
	});

	it('renders graffiti SVG image', () => {
		render(HomeCloser);
		const svg = screen.getByTestId('closer-graffiti');
		expect(svg).toBeInTheDocument();
		expect(svg.querySelector('img')?.getAttribute('src')).toContain('graffiti.svg');
		expect(svg.querySelector('img')?.getAttribute('loading')).toBe('lazy');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/lib/components/HomeCloser.test.ts`
Expected: FAIL — `HomeCloser.svelte` does not exist

- [ ] **Step 3: Create HomeCloser.svelte**

Create `src/lib/components/HomeCloser.svelte`:

```svelte
<!--
  HomeCloser — Section 5: Transit terminus departure board on graffiti wall.
  Merges Blog Teaser + About Strip + Dual CTA into one conversion-focused closer.
  Desktop: side mural (SVG right, board left). Mobile: SVG behind, board full-width.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { closerContent, resolveLocale } from '$lib/data/index.js';
	import { getLatestPosts } from '$lib/data/index.js';
	import { siteMeta } from '$lib/data/meta.js';
	import { registerGsapPlugins, gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import { prefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

	// Static content
	const heading = resolveLocale(closerContent.heading, 'en');
	const headingDot = resolveLocale(closerContent.headingDot, 'en');
	const subheading = resolveLocale(closerContent.subheading, 'en');
	const contactLabel = resolveLocale(closerContent.rows.contact.label, 'en');
	const contactDesc = resolveLocale(closerContent.rows.contact.description, 'en');
	const contactAction = resolveLocale(closerContent.rows.contact.action, 'en');
	const connectLabel = resolveLocale(closerContent.rows.connect.label, 'en');
	const connectDesc = resolveLocale(closerContent.rows.connect.description, 'en');
	const connectAction = resolveLocale(closerContent.rows.connect.action, 'en');
	const readLabel = resolveLocale(closerContent.rows.read.label, 'en');
	const readAction = resolveLocale(closerContent.rows.read.action, 'en');
	const aboutLabel = resolveLocale(closerContent.rows.about.label, 'en');
	const aboutDesc = resolveLocale(closerContent.rows.about.description, 'en');
	const aboutAction = resolveLocale(closerContent.rows.about.action, 'en');
	const attrText = resolveLocale(closerContent.attribution.text, 'en');

	// Dynamic blog posts
	const latestPosts = getLatestPosts(2, 'professional');

	// Build row data
	type BoardRow = { label: string; description: string; action: string; href: string; primary: boolean };
	const rows: BoardRow[] = [
		{ label: contactLabel, description: contactDesc, action: contactAction, href: '/contact', primary: true },
		{ label: connectLabel, description: connectDesc, action: connectAction, href: siteMeta.links.linkedin ?? '#', primary: true },
		...latestPosts.map((post) => ({
			label: readLabel,
			description: resolveLocale(post.title, 'en'),
			action: readAction,
			href: `/blog/${post.category}/${post.slug}`,
			primary: false,
		})),
		{ label: aboutLabel, description: aboutDesc, action: aboutAction, href: '/about', primary: false },
	];

	// Social links
	const socials = [
		{ label: 'LinkedIn', href: siteMeta.links.linkedin ?? '#' },
		{ label: 'GitHub', href: siteMeta.links.github },
		{ label: 'Upwork', href: siteMeta.links.upwork ?? '#' },
		{ label: 'Email', href: `mailto:${siteMeta.links.email}` },
	];

	let sectionEl: HTMLElement | undefined = $state(undefined);

	onMount(() => {
		if (!browser || !sectionEl) return;
		if ($prefersReducedMotion) return;

		registerGsapPlugins();

		const headingEl = sectionEl.querySelector('[data-closer-heading]');
		const subEl = sectionEl.querySelector('[data-closer-sub]');
		const boardEl = sectionEl.querySelector('[data-closer-board]');
		const rowEls = sectionEl.querySelectorAll('[data-closer-row]');
		const drips = sectionEl.querySelectorAll('[data-closer-drip]');
		const graffitiEl = sectionEl.querySelector('[data-closer-graffiti]');
		const socialsEl = sectionEl.querySelector('[data-closer-socials]');
		const attrEl = sectionEl.querySelector('[data-closer-attr]');

		// Set initial states
		gsap.set(headingEl, { opacity: 0, y: 20 });
		gsap.set(subEl, { opacity: 0 });
		gsap.set(boardEl, { opacity: 0, scale: 0.98 });
		gsap.set(rowEls, { opacity: 0, x: -10 });
		gsap.set(drips, { scaleY: 0 });
		gsap.set(graffitiEl, { opacity: 0 });
		gsap.set(socialsEl, { opacity: 0 });
		gsap.set(attrEl, { opacity: 0 });

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: sectionEl,
				start: 'top 80%',
				once: true,
			},
		});

		tl.to(headingEl, { opacity: 1, y: 0, duration: 0.4 })
			.to(subEl, { opacity: 1, duration: 0.3 }, '-=0.3')
			.to(boardEl, { opacity: 1, scale: 1, duration: 0.5 }, '-=0.2')
			.to(rowEls, { opacity: 1, x: 0, stagger: 0.05, duration: 0.3 }, '-=0.3')
			.to(drips, { scaleY: 1, duration: 0.8, stagger: 0.1 }, '-=0.6')
			.to(graffitiEl, { opacity: 1, duration: 0.6 }, '-=0.8')
			.to(socialsEl, { opacity: 1, duration: 0.3 }, '-=0.2')
			.to(attrEl, { opacity: 1, duration: 0.3 }, '-=0.3');

		return () => {
			ScrollTrigger.getAll().forEach((st) => {
				if (st.trigger === sectionEl) st.kill();
			});
		};
	});
</script>

<section
	bind:this={sectionEl}
	data-testid="closer-section"
	class="closer-section relative overflow-hidden"
>
	<!-- Background: concrete texture -->
	<div class="closer-concrete" aria-hidden="true"></div>

	<!-- Background: graffiti SVG (right side on desktop, behind on mobile) -->
	<div class="closer-graffiti-wrap" data-testid="closer-graffiti" data-closer-graffiti aria-hidden="true">
		<img
			src="/svg/graffiti/graffiti.svg"
			alt=""
			loading="lazy"
			class="closer-graffiti-img"
		/>
	</div>

	<!-- Gradient fade protecting left content from SVG -->
	<div class="closer-gradient" aria-hidden="true"></div>

	<!-- Drip lines (top-right) -->
	<div class="closer-drip closer-drip-1" data-closer-drip aria-hidden="true" style="transform-origin: top;"></div>
	<div class="closer-drip closer-drip-2" data-closer-drip aria-hidden="true" style="transform-origin: top;"></div>
	<div class="closer-drip closer-drip-3" data-closer-drip aria-hidden="true" style="transform-origin: top;"></div>

	<!-- Content -->
	<div class="closer-content relative z-10">
		<!-- Heading -->
		<h2 data-testid="closer-heading" data-closer-heading class="closer-heading">
			{heading}<span class="closer-dot">{headingDot}</span>
		</h2>
		<p data-testid="closer-subheading" data-closer-sub class="closer-subheading">
			{subheading}
		</p>

		<!-- Departure board -->
		<div data-testid="closer-board" data-closer-board class="closer-board">
			{#each rows as row, i}
				<a
					href={row.href}
					data-testid="closer-row"
					data-closer-row
					class="closer-row"
					class:closer-row-primary={row.primary}
					aria-label="{row.label} — {row.description}"
					target={row.href.startsWith('http') ? '_blank' : undefined}
					rel={row.href.startsWith('http') ? 'noopener' : undefined}
				>
					<span class="closer-row-label">{row.label}</span>
					<span class="closer-row-desc" class:closer-row-desc-primary={row.primary}>
						{row.description}
					</span>
					<span class="closer-row-action" class:closer-row-action-primary={row.primary}>
						{row.action}
					</span>
				</a>
			{/each}
		</div>

		<!-- Social links -->
		<div data-testid="closer-socials" data-closer-socials class="closer-socials">
			{#each socials as social}
				<a
					href={social.href}
					class="closer-social-link"
					target={social.href.startsWith('http') ? '_blank' : undefined}
					rel={social.href.startsWith('http') ? 'noopener' : undefined}
				>
					{social.label}
				</a>
			{/each}
		</div>

		<!-- Attribution -->
		<div data-testid="closer-attribution" data-closer-attr class="closer-attribution">
			<a
				href={closerContent.attribution.url}
				target="_blank"
				rel="noopener"
			>
				{attrText}
			</a>
		</div>
	</div>
</section>

<style>
	.closer-section {
		padding: 64px 16px;
		min-height: 70dvh;
		display: flex;
		align-items: center;
	}

	/* Concrete texture */
	.closer-concrete {
		position: absolute;
		inset: 0;
		background: repeating-conic-gradient(#131313 0% 25%, #111 0% 50%) 0 0 / 4px 4px;
		opacity: 0.7;
	}

	/* Graffiti SVG — side mural (desktop) */
	.closer-graffiti-wrap {
		position: absolute;
		right: -20px;
		top: 50%;
		transform: translateY(-50%);
		width: 55%;
		opacity: 0.09;
		pointer-events: none;
	}

	.closer-graffiti-img {
		width: 100%;
		height: auto;
		filter: hue-rotate(-10deg) saturate(2.5) brightness(1.8);
	}

	/* Gradient fade — protects left content */
	.closer-gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, var(--bg-primary, #0d0d0d) 30%, transparent 65%);
	}

	/* Drip lines */
	.closer-drip {
		position: absolute;
		top: 0;
		border-radius: 0 0 2px 2px;
	}
	.closer-drip-1 {
		right: 18%;
		width: 3px;
		height: 70px;
		background: linear-gradient(to bottom, rgba(224, 120, 0, 0.15), transparent);
	}
	.closer-drip-2 {
		right: 28%;
		width: 2px;
		height: 50px;
		background: linear-gradient(to bottom, rgba(255, 182, 39, 0.1), transparent);
	}
	.closer-drip-3 {
		right: 12%;
		width: 2px;
		height: 40px;
		background: linear-gradient(to bottom, rgba(224, 120, 0, 0.08), transparent);
	}

	/* Content */
	.closer-content {
		max-width: 55%;
		width: 100%;
		padding-inline-start: clamp(1rem, 4vw, 3rem);
	}

	.closer-heading {
		font-family: Inter, sans-serif;
		font-size: clamp(1.5rem, 4vw, 2rem);
		font-weight: 900;
		color: var(--text-primary, #f0f0f0);
		letter-spacing: -1px;
		margin-block-end: 4px;
	}
	.closer-dot {
		color: var(--brand-primary, #E07800);
	}

	.closer-subheading {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		color: var(--text-muted, #555);
		letter-spacing: 1px;
		margin-block-end: 24px;
	}

	/* Board */
	.closer-board {
		background: rgba(10, 10, 10, 0.92);
		border: 1px solid #252525;
		border-radius: 3px;
		box-shadow: 0 2px 16px rgba(0, 0, 0, 0.5);
		margin-block-end: 20px;
		overflow: hidden;
	}

	.closer-row {
		display: grid;
		grid-template-columns: 70px 1fr 50px;
		padding: 10px 14px;
		border-bottom: 1px solid #1a1a1a;
		align-items: center;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}
	.closer-row:last-child {
		border-bottom: none;
	}
	.closer-row:hover {
		background-color: rgba(224, 120, 0, 0.04);
	}

	.closer-row-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		font-weight: 700;
		color: var(--brand-primary, #E07800);
	}

	.closer-row-desc {
		font-size: 10px;
		color: #999;
	}
	.closer-row-desc-primary {
		font-size: 11px;
		color: #ddd;
	}

	.closer-row-action {
		text-align: right;
		font-size: 10px;
		color: #555;
	}
	.closer-row-action-primary {
		color: var(--brand-accent, #FFB627);
		font-weight: 600;
	}

	/* Social links */
	.closer-socials {
		display: flex;
		gap: 14px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		margin-block-end: 10px;
	}
	.closer-social-link {
		color: #444;
		text-decoration: none;
		transition: color 0.15s;
	}
	.closer-social-link:hover {
		color: var(--brand-primary, #E07800);
	}

	/* Attribution */
	.closer-attribution {
		font-family: 'JetBrains Mono', monospace;
		font-size: 7px;
		color: #333;
	}
	.closer-attribution a {
		color: inherit;
		text-decoration: none;
	}
	.closer-attribution a:hover {
		color: var(--text-muted, #555);
	}

	/* ===== Mobile (<768px) ===== */
	@media (max-width: 767px) {
		.closer-section {
			padding: 48px 16px;
			min-height: auto;
		}

		.closer-content {
			max-width: 100%;
			padding-inline-start: 0;
		}

		/* SVG moves behind content, lower opacity */
		.closer-graffiti-wrap {
			right: auto;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 120%;
			opacity: 0.04;
		}

		/* Remove side gradient on mobile */
		.closer-gradient {
			display: none;
		}

		/* Hide extra drips on mobile */
		.closer-drip-2,
		.closer-drip-3 {
			display: none;
		}

		.closer-socials {
			justify-content: flex-start;
		}
	}

	/* ===== Tablet+ (768px+) ===== */
	@media (min-width: 768px) {
		.closer-section {
			padding: 80px 24px;
		}
	}

	/* ===== Desktop (1024px+) ===== */
	@media (min-width: 1024px) {
		.closer-section {
			padding: 100px 32px;
		}
	}
</style>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- src/lib/components/HomeCloser.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Run full check**

Run: `bun run check`
Expected: Clean

---

## Task 3: Wire HomeCloser into the home page + integration tests

**Files:**
- Modify: `src/routes/+page.svelte`
- Modify: `src/routes/home.test.ts`

- [ ] **Step 1: Write the failing integration tests**

Add to `src/routes/home.test.ts`:

```typescript
	it('renders the closer section', () => {
		render(Page);
		expect(screen.getByTestId('closer-section')).toBeInTheDocument();
	});

	it('renders closer departure board with 5 rows', () => {
		render(Page);
		const rows = screen.getAllByTestId('closer-row');
		expect(rows).toHaveLength(5);
	});

	it('renders closer TERMINUS heading', () => {
		render(Page);
		const heading = screen.getByTestId('closer-heading');
		expect(heading.textContent).toContain('TERMINUS');
	});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/routes/home.test.ts`
Expected: FAIL — `closer-section` not found

- [ ] **Step 3: Update +page.svelte**

In `src/routes/+page.svelte`, add the import and render the component:

Update the `<script>` block:

```svelte
<script lang="ts">
	import HeroBanner from '$lib/components/HeroBanner.svelte';
	import Manifesto from '$lib/components/Manifesto.svelte';
	import ProofReel from '$lib/components/ProofReel.svelte';
	import HomeServices from '$lib/components/HomeServices.svelte';
	import HomeCloser from '$lib/components/HomeCloser.svelte';
</script>
```

Replace the comment `<!-- Sections 5-7 added in sub-slices 13h-13i -->` with:

```svelte
		<!-- Section 5: The Closer (terminus departure board + graffiti wall) -->
		<HomeCloser />
```

Update the page comment at the top to reflect the merged architecture:

```svelte
<!--
  Home page: Slice 13 redesign — full-bleed kinetic experience.
  5 sections: Hero, Manifesto, Proof Reel, Services, Closer (terminus departure board).
  All scroll-driven GSAP animation. Lenis smooth scroll. Zero side margins.
-->
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- src/routes/home.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Run full suite + check**

Run: `bun run test && bun run check`
Expected: ALL PASS, clean types

---

## Task 4: Visual verification + row hover GSAP polish

This task is for Yesid's visual approval on `http://localhost:5173/`. No new tests — this is the interactive polish pass.

- [ ] **Step 1: Start dev server**

Run: `bun run dev`

- [ ] **Step 2: Pre-flight visual check**

Verify on desktop (1440px):
- TERMINUS. heading visible with orange dot
- 5 board rows in correct order (CONTACT, CONNECT, READ ×2, ABOUT)
- Graffiti SVG visible on right side, faded
- Drip lines visible at top-right
- Social links row below board
- Vecteezy attribution visible

Verify on mobile (375px):
- SVG moves behind content (lower opacity)
- Board goes full-width
- Only 1 drip line visible
- No gradient fade

- [ ] **Step 3: Add row hover slide (GSAP)**

If the CSS `transition: background-color` on `.closer-row:hover` feels sufficient, skip this. If Yesid wants the 4px slide-right effect, add `mouseenter`/`mouseleave` handlers in the `onMount`:

```typescript
// Inside onMount, after the timeline setup:
if (window.matchMedia('(min-width: 768px)').matches) {
	const rowElements = sectionEl.querySelectorAll('[data-closer-row]');
	rowElements.forEach((row) => {
		row.addEventListener('mouseenter', () => {
			gsap.to(row, { x: 4, duration: 0.2, ease: 'power2.out' });
		});
		row.addEventListener('mouseleave', () => {
			gsap.to(row, { x: 0, duration: 0.2, ease: 'power2.out' });
		});
	});
}
```

- [ ] **Step 4: STOP — present to Yesid for visual approval**

Tell Yesid:
- What to check: section appearance, board readability, graffiti visibility, mobile layout
- Specific behaviors: hover each row (should highlight + slide), scroll to section (should animate in)
- Decisions: hover slide intensity, graffiti opacity tuning, drip visibility
