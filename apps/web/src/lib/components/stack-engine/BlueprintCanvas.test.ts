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

	it('stamps the title uppercase with the REV A suffix', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const stamp = screen.getByTestId('blueprint-stamp');
		expect(stamp.textContent).toContain('A DATA DASHBOARD — REV A');
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

	it('GO-w2t5 at-a-glance: svg max-width caps render scale at the layout natural width', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		const canvas = screen.getByTestId('blueprint-canvas') as unknown as SVGSVGElement;
		// BOX_W 160 + 2×PAD 24 — a one-box-per-row blueprint must NOT blow up
		// to 720px wide (operator playtest: "one node fills the viewport").
		expect(canvas.style.maxWidth).toBe('208px');
	});

	it('GO-w2t5 at-a-glance: viewBox reflects the tightened geometry', () => {
		render(BlueprintCanvas, {
			props: { links: DASHBOARD_LINKS, title: 'A data dashboard', animate: false },
		});
		// 4 rows: height 4×48 + 3×48 = 336; + STAMP_H 36 + 2×PAD 48 = 420.
		expect(screen.getByTestId('blueprint-canvas').getAttribute('viewBox')).toBe(
			'-24 -24 208 420',
		);
	});
});
