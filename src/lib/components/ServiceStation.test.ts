import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ServiceStation from './ServiceStation.svelte';
import type { Service } from '$lib/data/types.js';

const mockService: Service = {
	id: 'test-service',
	title: { en: 'Test Service Title' },
	description: { en: 'Test service description for the station.' },
	station: 1,
	icon: 'station-sql.json',
	relatedProjects: ['yesid-dev']
};

const mockServiceNoProjects: Service = {
	id: 'empty-service',
	title: { en: 'Empty Station' },
	description: { en: 'A station with no related projects.' },
	station: 2,
	icon: 'station-pipeline.json',
	relatedProjects: []
};

const mockServicePrivateOnly: Service = {
	id: 'private-only',
	title: { en: 'Private Projects Only' },
	description: { en: 'All related projects are private or nonexistent.' },
	station: 3,
	relatedProjects: ['nonexistent-project-slug']
};

describe('ServiceStation', () => {
	it('renders service title', () => {
		render(ServiceStation, { props: { service: mockService, index: 0 } });
		expect(screen.getByText('Test Service Title')).toBeInTheDocument();
	});

	it('renders service description', () => {
		render(ServiceStation, { props: { service: mockService, index: 0 } });
		expect(screen.getByText('Test service description for the station.')).toBeInTheDocument();
	});

	it('has correct data-testid', () => {
		const { container } = render(ServiceStation, { props: { service: mockService, index: 0 } });
		expect(container.querySelector('[data-testid="station-test-service"]')).toBeInTheDocument();
	});

	it('renders Lottie player container when icon is provided', () => {
		const { container } = render(ServiceStation, { props: { service: mockService, index: 0 } });
		expect(container.querySelector('[data-testid="station-lottie"]')).toBeInTheDocument();
	});

	it('does not render Lottie container when icon is missing', () => {
		const { container } = render(ServiceStation, {
			props: { service: mockServicePrivateOnly, index: 0 }
		});
		expect(container.querySelector('[data-testid="station-lottie"]')).not.toBeInTheDocument();
	});

	it('renders related public project cards', () => {
		// yesid-dev is public in the seed data
		render(ServiceStation, { props: { service: mockService, index: 0 } });
		expect(screen.getByText('yesid.dev — Portfolio Site')).toBeInTheDocument();
	});

	it('handles empty relatedProjects gracefully', () => {
		const { container } = render(ServiceStation, {
			props: { service: mockServiceNoProjects, index: 0 }
		});
		// Should render without crashing, no project cards
		expect(container.querySelector('[data-testid="station-empty-service"]')).toBeInTheDocument();
	});

	it('filters out private projects from related list', () => {
		// transit-data-pipeline is private in seed data — should not appear
		const { container } = render(ServiceStation, {
			props: { service: mockServicePrivateOnly, index: 0 }
		});
		expect(container.querySelector('[data-testid="station-private-only"]')).toBeInTheDocument();
		// No project cards should render
		expect(container.querySelectorAll('[data-testid="project-card"]')).toHaveLength(0);
	});

	// --- Slice 06b: station sign card tests ---

	it('renders station number derived from index', () => {
		render(ServiceStation, { props: { service: mockService, index: 0 } });
		const numberEl = screen.getByTestId('station-number');
		expect(numberEl).toBeInTheDocument();
		expect(numberEl.textContent?.trim()).toBe('01');
	});

	it('renders correct station number for second station', () => {
		render(ServiceStation, { props: { service: mockServiceNoProjects, index: 1 } });
		const numberEl = screen.getByTestId('station-number');
		expect(numberEl.textContent?.trim()).toBe('02');
	});

	it('renders indicator light', () => {
		render(ServiceStation, { props: { service: mockService, index: 0 } });
		expect(screen.getByTestId('station-indicator')).toBeInTheDocument();
	});

	it('renders Lottie in scrub mode container', () => {
		const { container } = render(ServiceStation, { props: { service: mockService, index: 0 } });
		const lottieZone = container.querySelector('[data-testid="station-lottie"]');
		expect(lottieZone).toBeInTheDocument();
		// Lottie player is inside the zone
		expect(lottieZone?.querySelector('[data-testid="lottie-player"]')).toBeInTheDocument();
	});
});
