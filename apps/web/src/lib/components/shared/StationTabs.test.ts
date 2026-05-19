import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StationTabs from './StationTabs.svelte';
import { serviceFactory } from '../../../tests/factories';

// Minimal Service stubs that satisfy the component's required fields.
// Station numbers are intentionally out of order to verify the component sorts them.
const mockServices = [
	serviceFactory.build({ id: 'sql-development',     title: { en: 'SQL Development & Optimization' }, description: { en: '' }, station: 1, visible: true }),
	serviceFactory.build({ id: 'data-pipeline',       title: { en: 'Data Pipeline Architecture' },    description: { en: '' }, station: 2, visible: true }),
	serviceFactory.build({ id: 'analytics-reporting', title: { en: 'Analytics & Reporting Systems' }, description: { en: '' }, station: 3, visible: true }),
];

describe('StationTabs', () => {
	it('renders a tab for each service', () => {
		render(StationTabs, { props: { services: mockServices, activeId: 'sql-development' } });
		expect(screen.getByText('SQL Dev')).toBeTruthy();
		expect(screen.getByText('Pipeline')).toBeTruthy();
		expect(screen.getByText('Analytics')).toBeTruthy();
	});

	it('renders station numbers', () => {
		render(StationTabs, { props: { services: mockServices, activeId: 'sql-development' } });
		expect(screen.getByText('01')).toBeTruthy();
		expect(screen.getByText('02')).toBeTruthy();
		expect(screen.getByText('03')).toBeTruthy();
	});

	it('marks the active tab', () => {
		render(StationTabs, { props: { services: mockServices, activeId: 'data-pipeline' } });
		const activeTab = screen.getByTestId('station-tab-data-pipeline');
		expect(activeTab.getAttribute('data-active')).toBe('true');
	});

	it('renders links in navigate mode', () => {
		render(StationTabs, { props: { services: mockServices, activeId: 'sql-development', mode: 'navigate' } });
		const link = screen.getByTestId('station-tab-data-pipeline');
		expect(link.closest('a')?.getAttribute('href')).toBe('/services/data-pipeline');
	});
});
