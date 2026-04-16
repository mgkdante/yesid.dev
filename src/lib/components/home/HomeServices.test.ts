import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HomeServices from './HomeServices.svelte';

describe('HomeServices', () => {
	it('renders the section with correct testid', () => {
		render(HomeServices);
		expect(screen.getByTestId('services-section')).toBeInTheDocument();
	});

	it('renders 6 service cards', () => {
		render(HomeServices);
		const cards = screen.getAllByTestId('services-card');
		expect(cards).toHaveLength(6);
	});

	it('renders benefit headlines for all cards', () => {
		render(HomeServices);
		const benefits = screen.getAllByTestId('services-benefit');
		expect(benefits).toHaveLength(6);
		expect(benefits[0].textContent).toContain('Queries that run in seconds');
	});

	it('renders service titles', () => {
		render(HomeServices);
		const titles = screen.getAllByTestId('services-title');
		expect(titles).toHaveLength(6);
		expect(titles[0].textContent).toContain('SQL Development');
	});

	it('renders impact metrics', () => {
		render(HomeServices);
		const metrics = screen.getAllByTestId('services-metric');
		expect(metrics).toHaveLength(6);
		expect(metrics[0].textContent).toContain('3x faster');
	});

	it('renders SVG panels for each card', () => {
		render(HomeServices);
		const panels = screen.getAllByTestId('services-svg-panel');
		expect(panels).toHaveLength(6);
	});

	it('cards link to /services/[id]', () => {
		render(HomeServices);
		const cards = screen.getAllByTestId('services-card');
		expect(cards[0].getAttribute('href')).toBe('/services/sql-development');
		expect(cards[1].getAttribute('href')).toBe('/services/data-pipeline');
		expect(cards[2].getAttribute('href')).toBe('/services/analytics-reporting');
		expect(cards[3].getAttribute('href')).toBe('/services/database-engineering');
		expect(cards[4].getAttribute('href')).toBe('/services/internal-tooling');
		expect(cards[5].getAttribute('href')).toBe('/services/web-development');
	});

	it('renders view-all link to /services', () => {
		render(HomeServices);
		const container = screen.getByTestId('services-viewall');
		expect(container).toBeInTheDocument();
		const anchor = container.querySelector('a');
		expect(anchor?.getAttribute('href')).toBe('/services');
		expect(anchor?.textContent).toContain('View all services');
	});
});
