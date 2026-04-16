import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BlogRouteMap from './BlogRouteMap.svelte';

const mockHeadings = [
	{ id: 'the-breaking-point', text: 'The Breaking Point', level: 2 },
	{ id: 'what-i-learned', text: 'What I Learned', level: 2 },
	{ id: 'know-your-database', text: 'Know your database', level: 3 },
	{ id: 'sql-is-a-dsl', text: 'SQL is already a DSL', level: 3 },
	{ id: 'my-stack-now', text: 'My Stack Now', level: 2 },
];

describe('BlogRouteMap', () => {
	it('renders with data-testid', () => {
		const { getByTestId } = render(BlogRouteMap, {
			props: { headings: mockHeadings, activeHeadingId: '' },
		});
		expect(getByTestId('blog-route-map')).toBeTruthy();
	});

	it('renders a station for each h2 heading', () => {
		const { container } = render(BlogRouteMap, {
			props: { headings: mockHeadings, activeHeadingId: '' },
		});
		const majorStations = container.querySelectorAll('.route-station--major');
		expect(majorStations.length).toBe(3);
	});

	it('renders minor stops for h3 headings', () => {
		const { container } = render(BlogRouteMap, {
			props: { headings: mockHeadings, activeHeadingId: '' },
		});
		const minorStations = container.querySelectorAll('.route-station--minor');
		expect(minorStations.length).toBe(2);
	});

	it('applies active class to the current station', () => {
		const { container } = render(BlogRouteMap, {
			props: { headings: mockHeadings, activeHeadingId: 'what-i-learned' },
		});
		const activeStations = container.querySelectorAll('.route-station--active');
		expect(activeStations.length).toBe(1);
	});

	it('applies passed class to stations before active', () => {
		const { container } = render(BlogRouteMap, {
			props: { headings: mockHeadings, activeHeadingId: 'what-i-learned' },
		});
		const passedStations = container.querySelectorAll('.route-station--passed');
		expect(passedStations.length).toBeGreaterThanOrEqual(1);
	});

	it('uses CSS classes not inline SVG attributes', () => {
		const { container } = render(BlogRouteMap, {
			props: { headings: mockHeadings, activeHeadingId: '' },
		});
		const svg = container.querySelector('svg');
		const allElements = svg?.querySelectorAll('circle, path, text') ?? [];
		for (const el of allElements) {
			expect(el.getAttribute('fill')).toBeNull();
			expect(el.getAttribute('stroke')).toBeNull();
			expect(el.getAttribute('stroke-width')).toBeNull();
		}
	});
});
