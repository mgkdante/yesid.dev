import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StationTabs from './StationTabs.svelte';
import { serviceFactory } from '../../../tests/factories';

// GO-2: fixtures mirror the 4 post-consolidation stations.
// Station numbers intentionally out of order to verify the component sorts.
const mockServices = [
	serviceFactory.build({ id: 'analytics-reporting',  title: { en: 'Dashboards & Analytics' },  description: { en: '' }, station: 3, visible: true }),
	serviceFactory.build({ id: 'database-engineering', title: { en: 'Databases & SQL' },         description: { en: '' }, station: 1, visible: true }),
	serviceFactory.build({ id: 'data-pipeline',        title: { en: 'Pipelines & Automation' },  description: { en: '' }, station: 2, visible: true }),
	serviceFactory.build({ id: 'web-development',      title: { en: 'Websites & E-commerce' },   description: { en: '' }, station: 4, visible: true }),
];

describe('StationTabs', () => {
	it('renders the 4 station short labels', () => {
		render(StationTabs, { props: { services: mockServices, activeId: 'database-engineering' } });
		expect(screen.getByText('Databases')).toBeTruthy();
		expect(screen.getByText('Pipelines')).toBeTruthy();
		expect(screen.getByText('Dashboards')).toBeTruthy();
		expect(screen.getByText('Websites')).toBeTruthy();
	});

	it('renders station numbers', () => {
		render(StationTabs, { props: { services: mockServices, activeId: 'database-engineering' } });
		expect(screen.getByText('01')).toBeTruthy();
		expect(screen.getByText('02')).toBeTruthy();
		expect(screen.getByText('03')).toBeTruthy();
		expect(screen.getByText('04')).toBeTruthy();
	});

	it('falls back to the first title word for an id missing from SHORT_LABELS', () => {
		const unknown = [
			serviceFactory.build({ id: 'mystery-service', title: { en: 'Mystery Offering' }, description: { en: '' }, station: 1, visible: true }),
		];
		render(StationTabs, { props: { services: unknown, activeId: 'mystery-service' } });
		expect(screen.getByText('Mystery')).toBeTruthy();
	});

	it('marks the active tab', () => {
		render(StationTabs, { props: { services: mockServices, activeId: 'data-pipeline' } });
		const activeTab = screen.getByTestId('station-tab-data-pipeline');
		expect(activeTab.getAttribute('data-active')).toBe('true');
	});

	it('renders links in navigate mode', () => {
		render(StationTabs, { props: { services: mockServices, activeId: 'database-engineering', mode: 'navigate' } });
		const link = screen.getByTestId('station-tab-data-pipeline');
		expect(link.closest('a')?.getAttribute('href')).toBe('/services/data-pipeline');
	});
});
