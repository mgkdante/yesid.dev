import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HomeServices from './HomeServices.svelte';
// slice-18i Phase 7C: HomeServices now requires servicesGrid prop.
// slice-28.5 (#124): HomeServices also requires the services prop — the
// component no longer calls getVisibleServices() itself; the home
// +page.server.ts resolves it through the repository layer. The test stub
// derives the same data from the content module the static adapter reads.
import { servicesGridContent } from '$lib/content/site-content';
import { getVisibleServices } from '$lib/content';
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

	it('GO-w2t5: section glow wired — pointermove writes --glow vars on the section', () => {
		// Claim hover capability (sectionGlow gates on `(hover: hover)` only
		// post-retier; reduce no longer matters — SAFE-ALWAYS).
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
		expect(section.style.getPropertyValue('--glow-x')).toBe('50%');
		expect(section.style.getPropertyValue('--glow-opacity')).toBe('1');

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
