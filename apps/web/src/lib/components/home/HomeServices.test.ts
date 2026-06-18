import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HomeServices from './HomeServices.svelte';
// slice-18i Phase 7C: HomeServices now requires servicesGrid prop.
// slice-28.5 (#124): HomeServices also requires the services prop — the
// component no longer calls getVisibleServices() itself; the home
// +page.server.ts resolves it through the repository layer. The test stub
// derives the same data from the content module the static adapter reads.
import { servicesGridContent } from '$lib/content/site-content';
import { getVisibleServices } from '$lib/services/static-helpers';
import { serviceFactory } from '../../../tests/factories';

const services = getVisibleServices();

describe('HomeServices', () => {
	it('renders the section with correct testid', () => {
		render(HomeServices, { props: { servicesGrid: servicesGridContent, services } });
		expect(screen.getByTestId('services-section')).toBeInTheDocument();
	});







	it('renders view-all link to /services', () => {
		render(HomeServices, { props: { servicesGrid: servicesGridContent, services } });
		const container = screen.getByTestId('services-viewall');
		expect(container).toBeInTheDocument();
		const anchor = container.querySelector('a');
		expect(anchor?.getAttribute('href')).toBe('/services');
		expect(anchor?.textContent).toContain('View all services');
	});

	it('go2/w4: hover glow unwired — pointermove writes NO --glow vars on the section', () => {
		// Operator QA: the section-scale cursor glow is gone. The sectionGlow
		// primitive itself survives (other consumers untouched); this section
		// just no longer uses it.
		const realMatchMedia = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((q: string) => ({
			matches: true,
			media: q,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})) as unknown as typeof window.matchMedia;

		render(HomeServices, { props: { servicesGrid: servicesGridContent, services } });
		const section = screen.getByTestId('services-section');
		Object.defineProperty(section, 'getBoundingClientRect', {
			value: () => ({
				left: 0, top: 0, width: 200, height: 100,
				right: 200, bottom: 100, x: 0, y: 0, toJSON: () => '',
			}),
		});
		section.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 50 }));
		expect(section.style.getPropertyValue('--glow-x')).toBe('');
		expect(section.style.getPropertyValue('--glow-opacity')).toBe('');

		window.matchMedia = realMatchMedia;
	});
});

describe('HomeServices station ordering (GO-2)', () => {
	it('renders cards in station order even when the services prop arrives shuffled', () => {
		const shuffled = [
			serviceFactory.build({ id: 'svc-c', title: { en: 'C' }, station: 3, visible: true }),
			serviceFactory.build({ id: 'svc-a', title: { en: 'A' }, station: 1, visible: true }),
			serviceFactory.build({ id: 'svc-b', title: { en: 'B' }, station: 2, visible: true }),
		];
		render(HomeServices, { props: { servicesGrid: servicesGridContent, services: shuffled } });
		const cards = screen.getAllByTestId('services-card');
		expect(cards.map((c) => c.getAttribute('href'))).toEqual([
			'/services/svc-a',
			'/services/svc-b',
			'/services/svc-c',
		]);
	});
});

// ── GO2-T8-UNSKIP ──────────────────────────────────────────────────────────
// Post-consolidation baseline (GO-2 Track 3, T8 step 8b). SKIPPED until the
// orchestrator's Gate A CMS apply + regen lands (getVisibleServices() then
// returns the 4 stations). T8 unskip step: `describe.skip` → `describe`,

describe('GO2-W5 round 5 — fun service SVGs + 2×2 station grid', () => {
	// R5-1 regression lock: the playful per-service SVG art must render in the
	// home services surface. SSR contract = one icon panel per visible service,
	// each carrying the /svg/services/{file} fallback <img> inside the
	// .svg-inline-wrapper that the onMount fetch upgrades to inline SVG.
	it('every services card renders its service SVG surface (wrapper + /svg/services fallback)', () => {
		render(HomeServices, { props: { servicesGrid: servicesGridContent, services } });
		const panels = screen.getAllByTestId('services-svg-panel');
		expect(panels.length).toBe(services.length);
		const sorted = [...services].sort((a, b) => a.station - b.station);
		panels.forEach((panel, i) => {
			const wrapper = panel.querySelector('.svg-inline-wrapper');
			expect(wrapper, `card ${i} missing .svg-inline-wrapper`).toBeTruthy();
			const img = wrapper?.querySelector('img');
			expect(img?.getAttribute('src')).toBe(`/svg/services/${sorted[i].svg}`);
		});
	});

	// R5b (operator-ordered): four stations → uniform 2-column desktop grid.
	it('the services grid is 2-up on desktop (lg:grid-cols-2), stacked below', () => {
		render(HomeServices, { props: { servicesGrid: servicesGridContent, services } });
		const section = screen.getByTestId('services-section');
		const grid = section.querySelector('.services-grid');
		expect(grid?.classList.contains('grid-cols-1')).toBe(true);
		expect(grid?.classList.contains('lg:grid-cols-2')).toBe(true);
		expect(grid?.classList.contains('lg:grid-cols-3')).toBe(false);
	});
});
