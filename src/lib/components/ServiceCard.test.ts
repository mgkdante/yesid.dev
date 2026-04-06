import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ServiceCard from './ServiceCard.svelte';

const mockService = {
	id: 'sql-development',
	title: { en: 'SQL Development & Optimization' },
	subtitle: { en: '& Optimization' },
	description: {
		en: 'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server.'
	},
	station: 1,
	relatedProjects: [],
	stack: ['PostgreSQL', 'SQL Server', 'T-SQL'],
	svg: 'service-sql.svg',
	visible: true
};

describe('ServiceCard', () => {
	it('renders the service title', () => {
		render(ServiceCard, {
			props: { service: mockService, svgContent: '', index: 0, total: 6 }
		});
		expect(screen.getByText('SQL Development & Optimization')).toBeTruthy();
	});

	it('renders the description', () => {
		render(ServiceCard, {
			props: { service: mockService, svgContent: '', index: 0, total: 6 }
		});
		expect(
			screen.getByText(
				'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server.'
			)
		).toBeTruthy();
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
		expect(screen.getByText('T-SQL')).toBeTruthy();
	});

	it('renders a "Deep dive" link with correct href', () => {
		render(ServiceCard, {
			props: { service: mockService, svgContent: '', index: 0, total: 6 }
		});
		const link = screen.getByRole('link', { name: /deep dive/i });
		expect(link.getAttribute('href')).toBe('/services/sql-development');
	});

	it('renders SVG container when svgContent is provided', () => {
		render(ServiceCard, {
			props: {
				service: mockService,
				svgContent: '<svg><circle r="10"/></svg>',
				index: 0,
				total: 6
			}
		});
		expect(screen.getByTestId('service-card-svg')).toBeTruthy();
	});
});
