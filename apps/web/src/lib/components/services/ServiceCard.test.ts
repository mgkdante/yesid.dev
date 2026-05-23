import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ServiceCard from './ServiceCard.svelte';
import { serviceFactory } from '../../../tests/factories';

// L1 factory + overrides for the optional detail-page fields the component renders.
const mockService = serviceFactory.build({
	id: 'sql-development',
	title: { en: 'SQL Development & Optimization' },
	subtitle: { en: '& Optimization' },
	description: { en: 'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server.' },
	station: 1,
	relatedProjects: [],
	stack: ['PostgreSQL', 'SQL Server', 'T-SQL'],
	svg: 'service-sql.svg',
	visible: true,
	benefitHeadline: { en: 'Queries that run in seconds, not minutes' },
	impactMetric: { value: { en: '3x' }, label: { en: 'faster avg query' } },
});

describe('ServiceCard', () => {
	it('renders the service title with dot', () => {
		render(ServiceCard, {
			props: { service: mockService, svgContent: '', index: 0, total: 6 }
		});
		expect(screen.getByText('SQL Development & Optimization')).toBeTruthy();
	});

	it('renders the benefit headline', () => {
		render(ServiceCard, {
			props: { service: mockService, svgContent: '', index: 0, total: 6 }
		});
		expect(screen.getByText('Queries that run in seconds, not minutes')).toBeTruthy();
	});

	it('renders the impact metric value', () => {
		render(ServiceCard, {
			props: { service: mockService, svgContent: '', index: 0, total: 6 }
		});
		expect(screen.getByText('3x')).toBeTruthy();
	});

	it('renders the station counter', () => {
		render(ServiceCard, {
			props: { service: mockService, svgContent: '', index: 0, total: 6 }
		});
		expect(screen.getByText('Service 01 / 06')).toBeTruthy();
	});

	it('renders stack pills', () => {
		render(ServiceCard, {
			props: { service: mockService, svgContent: '', index: 0, total: 6 }
		});
		expect(screen.getByText('PostgreSQL')).toBeTruthy();
		expect(screen.getByText('SQL Server')).toBeTruthy();
	});

	it('renders a "Deep dive" link with correct href', () => {
		render(ServiceCard, {
			props: { service: mockService, svgContent: '', index: 0, total: 6 }
		});
		const links = screen.getAllByRole('link', { name: /deep dive/i });
		expect(links.length).toBeGreaterThanOrEqual(1);
		expect(links[0].getAttribute('href')).toBe('/services/sql-development');
	});

	it('renders ServiceSvgPanel when svgContent is provided', () => {
		render(ServiceCard, {
			props: {
				service: mockService,
				svgContent: '<svg><circle r="10"/></svg>',
				index: 0,
				total: 6
			}
		});
		const panels = screen.getAllByTestId('service-svg-panel');
		expect(panels.length).toBeGreaterThanOrEqual(1);
	});

	it('renders with data-testid', () => {
		render(ServiceCard, {
			props: { service: mockService, svgContent: '', index: 0, total: 6 }
		});
		expect(screen.getByTestId('service-card-sql-development')).toBeTruthy();
	});
});
