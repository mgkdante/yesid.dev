// BlueprintCanvas smoke tests (slice-29 Task 10) — written FIRST per TDD.
// animate=false in tests: GSAP only gsap.set()s final states (no timelines).

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import type { ArchetypeTechLink } from '@repo/shared/schemas';
import BlueprintCanvas from './BlueprintCanvas.svelte';

// The data-dashboard seed shape.
const DASHBOARD_LINKS: ArchetypeTechLink[] = [
	{ id: 'sveltekit', layer: 'interface', sort: 1 },
	{ id: 'rest-api', layer: 'logic', sort: 2 },
	{ id: 'postgresql', layer: 'data', sort: 3 },
	{ id: 'docker', layer: 'infra', sort: 4 },
];

describe('BlueprintCanvas', () => {
	it('renders one flip-tagged box per link for the dashboard seed', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const canvas = screen.getByTestId('blueprint-canvas');
		const boxes = canvas.querySelectorAll('[data-flip-id]');
		expect(boxes).toHaveLength(4);
		for (const link of DASHBOARD_LINKS) {
			expect(canvas.querySelector(`[data-flip-id="${link.id}"]`)).toBeTruthy();
		}
		// Tech display names (not raw ids) label the boxes.
		expect(canvas.textContent).toContain('SvelteKit');
		expect(canvas.textContent).toContain('PostgreSQL');
	});

	it('stamps the title uppercase; REV A leads the meta line (taste round 2 fit fix)', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const stamp = screen.getByTestId('blueprint-stamp');
		// The old single `{TITLE} — REV A` line overflowed 208px frames on
		// one-box-per-row blueprints — REV A now lives on the meta line.
		expect(stamp.querySelector('.bp-stamp-title')?.textContent?.trim()).toBe(
			'A DATA DASHBOARD',
		);
		expect(stamp.textContent).toContain('REV A · 4 parts · 4 layers');
	});

	it('taste round 2 fit audit: titles wider than the reserved frame clamp via textLength', () => {
		// Reserved drawing width 408 + 48px padding − 16px inset = 440px.
		// This deliberately long title exceeds the frame and must still clamp.
		const narrow: ArchetypeTechLink[] = [
			{ id: 'python', layer: 'logic', sort: 1 },
			{ id: 'postgresql', layer: 'data', sort: 2 },
			{ id: 'github-actions', layer: 'infra', sort: 3 },
		];
		render(BlueprintCanvas, {
			props: {
				links: narrow,
				title: 'A report that writes itself every Monday morning',
				animate: false,
			},
		});
		const title = screen
			.getByTestId('blueprint-stamp')
			.querySelector('.bp-stamp-title')!;
		expect(title.getAttribute('textLength')).toBe('440');
		expect(title.getAttribute('lengthAdjust')).toBe('spacingAndGlyphs');
	});

	it('taste round 2 fit audit: short titles render unclamped (no textLength)', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const title = screen
			.getByTestId('blueprint-stamp')
			.querySelector('.bp-stamp-title')!;
		expect(title.getAttribute('textLength')).toBeNull();
	});

	it('compose entry: matched boxes get bp-matched, missing get bp-ghost + one annotation', () => {
		render(BlueprintCanvas, {
			props: {
				links: DASHBOARD_LINKS,
				title: 'A data dashboard',
				animate: false,
				matched: ['sveltekit', 'docker'],
				missing: ['rest-api', 'postgresql'],
			},
		});
		const canvas = screen.getByTestId('blueprint-canvas');
		expect(
			canvas.querySelector('[data-flip-id="sveltekit"]')?.classList.contains('bp-matched'),
		).toBe(true);
		expect(
			canvas.querySelector('[data-flip-id="rest-api"]')?.classList.contains('bp-ghost'),
		).toBe(true);
		expect(
			canvas.querySelector('[data-flip-id="postgresql"]')?.classList.contains('bp-ghost'),
		).toBe(true);
		// One annotation, under the FIRST missing box (rest-api), naming the tech.
		const annotations = canvas.querySelectorAll('[data-testid="bp-annotation"]');
		expect(annotations).toHaveLength(1);
		expect(annotations[0].textContent).toContain('+ add REST API to complete it');
	});

	it('goal entry (no matched/missing) renders no ghosts and no annotation', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const canvas = screen.getByTestId('blueprint-canvas');
		expect(canvas.querySelectorAll('.bp-ghost')).toHaveLength(0);
		expect(canvas.querySelectorAll('[data-testid="bp-annotation"]')).toHaveLength(0);
	});

	it('renders connectors as stroked paths', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const canvas = screen.getByTestId('blueprint-canvas');
		expect(canvas.querySelectorAll('path.bp-connector')).toHaveLength(3);
	});

	it('slice-037: svg reserves the shared 540px frame and caps render scale there', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const canvas = screen.getByTestId('blueprint-canvas') as unknown as SVGSVGElement;
		expect(canvas.style.maxWidth).toBe('540px');
	});

	it('slice-037: viewBox and content transform reserve and center the 540×452 frame', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		expect(screen.getByTestId('blueprint-canvas').getAttribute('viewBox')).toBe(
			'-108 -24 540 452',
		);
		expect(screen.getByTestId('blueprint-content').getAttribute('transform')).toBe(
			'translate(108 0)',
		);
		expect(
			screen.getByTestId('blueprint-canvas').querySelector('.bp-grid')?.getAttribute('width'),
		).toBe('456');
	});

	it('slice-037 G3: visible row extensions fill both sides of centered one-box lines', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const guides = screen.getByTestId('blueprint-canvas').querySelectorAll('.bp-row-guide');
		expect(guides).toHaveLength(4);
		expect(guides[0]?.getAttribute('d')).toBe('M 0 28 H 108 M 300 28 H 408');
		expect(guides[3]?.getAttribute('d')).toBe('M 0 340 H 108 M 300 340 H 408');
	});

	it('GO-w2t5: one parked signal path per connector (CSS keeps them invisible at rest)', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const canvas = screen.getByTestId('blueprint-canvas');
		// Rest state is opacity:0 via CSS — with animate=false they are never
		// touched by GSAP, so reduce users simply never see them.
		expect(canvas.querySelectorAll('.bp-signal')).toHaveLength(3);
		expect(canvas.querySelector('.bp-signals')?.getAttribute('aria-hidden')).toBe('true');
	});
});

describe('BlueprintCanvas go2/w5 layered learning', () => {
	it('goal entry annotates each distinct adjacent layer pair once', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const canvas = screen.getByTestId('blueprint-canvas');
		expect(
			canvas.querySelector('[data-testid="bp-pair-note-interface-logic"]')?.textContent,
		).toContain('the UI asks logic over HTTP');
		expect(
			canvas.querySelector('[data-testid="bp-pair-note-logic-data"]')?.textContent,
		).toContain('logic reads & writes the data');
		expect(
			canvas.querySelector('[data-testid="bp-pair-note-data-infra"]')?.textContent,
		).toContain('storage runs on this ground');
		// The same pairs repeat as the <768px list below the SVG.
		expect(screen.getByTestId('bp-pair-list').querySelectorAll('li')).toHaveLength(3);
	});

	it('compose entry suppresses pair notes (the + add annotation owns the gaps)', () => {
		render(BlueprintCanvas, {
			props: {
				links: DASHBOARD_LINKS,
				title: 'A data dashboard',
				animate: false,
				matched: ['sveltekit', 'docker'],
				missing: ['rest-api', 'postgresql'],
			},
		});
		const canvas = screen.getByTestId('blueprint-canvas');
		expect(canvas.querySelectorAll('.bp-pair-note')).toHaveLength(0);
		expect(screen.queryByTestId('bp-pair-list')).toBeNull();
		expect(canvas.querySelectorAll('[data-testid="bp-annotation"]')).toHaveLength(1);
	});

	it('row labels print each layer name in the left gutter; boxes carry layer tabs', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const canvas = screen.getByTestId('blueprint-canvas');
		const labels = [...canvas.querySelectorAll('.bp-row-label')].map((l) =>
			l.textContent?.trim(),
		);
		expect(labels).toEqual(['interface', 'logic', 'data', 'infra']);
		// One 3px layer tab per box — stroke semantics untouched.
		expect(canvas.querySelectorAll('.bp-box-tab')).toHaveLength(4);
		expect(
			canvas
				.querySelector('[data-flip-id="postgresql"] .bp-box-tab')
				?.classList.contains('bp-fill-data'),
		).toBe(true);
	});

	it('title block: framed stamp + parts·layers meta line + teaching aria-label', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const stamp = screen.getByTestId('blueprint-stamp');
		expect(stamp.textContent).toContain('A DATA DASHBOARD');
		expect(stamp.textContent).toContain('REV A · 4 parts · 4 layers');
		expect(stamp.querySelector('.bp-stamp-frame')).toBeTruthy();
		expect(screen.getByTestId('blueprint-canvas').getAttribute('aria-label')).toBe(
			'Blueprint: A data dashboard, 4 parts in 4 layers',
		);
	});

	it('drafting furniture: dot grid + four registration ticks, decorative', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const canvas = screen.getByTestId('blueprint-canvas');
		expect(canvas.querySelector('.bp-grid')?.getAttribute('aria-hidden')).toBe('true');
		expect(canvas.querySelector('pattern#bp-dot-grid')).toBeTruthy();
		expect(canvas.querySelectorAll('.bp-reg-ticks path')).toHaveLength(4);
	});
});
