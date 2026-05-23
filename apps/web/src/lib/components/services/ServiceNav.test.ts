import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ServiceNav from './ServiceNav.svelte';
import { serviceFactory } from '../../../tests/factories';

const mockPrev = serviceFactory.build({
	id: 'sql-development',
	title: { en: 'SQL Development & Optimization' },
	description: { en: '' },
	station: 1,
});
const mockNext = serviceFactory.build({
	id: 'analytics-reporting',
	title: { en: 'Analytics & Reporting Systems' },
	description: { en: '' },
	station: 3,
});

describe('ServiceNav', () => {
	it('renders prev and next links', () => {
		render(ServiceNav, { props: { prev: mockPrev, next: mockNext } });
		expect(screen.getByTestId('service-nav-prev')).toBeTruthy();
		expect(screen.getByTestId('service-nav-next')).toBeTruthy();
	});

	it('renders correct hrefs', () => {
		render(ServiceNav, { props: { prev: mockPrev, next: mockNext } });
		expect(screen.getByTestId('service-nav-prev').getAttribute('href')).toBe('/services/sql-development');
		expect(screen.getByTestId('service-nav-next').getAttribute('href')).toBe('/services/analytics-reporting');
	});

	it('renders service titles', () => {
		render(ServiceNav, { props: { prev: mockPrev, next: mockNext } });
		expect(screen.getByText('SQL Development & Optimization')).toBeTruthy();
		expect(screen.getByText('Analytics & Reporting Systems')).toBeTruthy();
	});

	it('omits prev when undefined', () => {
		render(ServiceNav, { props: { next: mockNext } });
		expect(screen.queryByTestId('service-nav-prev')).toBeNull();
		expect(screen.getByTestId('service-nav-next')).toBeTruthy();
	});

	it('omits next when undefined', () => {
		render(ServiceNav, { props: { prev: mockPrev } });
		expect(screen.getByTestId('service-nav-prev')).toBeTruthy();
		expect(screen.queryByTestId('service-nav-next')).toBeNull();
	});
});
