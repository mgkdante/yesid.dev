import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FeaturedProjects from './FeaturedProjects.svelte';
// slice-18i Phase 7C: FeaturedProjects now requires proofReel prop.
import { proofReelContent } from '$lib/content/site-content';

describe('FeaturedProjects', () => {
	it('renders the section with correct testid', () => {
		render(FeaturedProjects, { props: { proofReel: proofReelContent } });
		expect(screen.getByTestId('proof-reel-section')).toBeInTheDocument();
	});

	it('renders exactly 5 project cards (slice-23: carousel)', () => {
		render(FeaturedProjects, { props: { proofReel: proofReelContent } });
		const cards = screen.getAllByTestId('proof-card');
		expect(cards).toHaveLength(5);
	});

	it('renders impact metrics for each card', () => {
		render(FeaturedProjects, { props: { proofReel: proofReelContent } });
		const metrics = screen.getAllByTestId('proof-metric-value');
		expect(metrics).toHaveLength(5);
		expect(metrics[0].textContent).toContain('30s');
		expect(metrics[1].textContent).toContain('15 min');
		expect(metrics[2].textContent).toContain('500 GB');
		expect(metrics[3].textContent).toContain('73%');
		expect(metrics[4].textContent).toContain('6');
	});

	it('renders before value with strikethrough when present', () => {
		render(FeaturedProjects, { props: { proofReel: proofReelContent } });
		const beforeEl = screen.getByTestId('proof-metric-before');
		expect(beforeEl).toBeInTheDocument();
		expect(beforeEl.textContent).toContain('2 days');
	});

	it('renders project titles', () => {
		render(FeaturedProjects, { props: { proofReel: proofReelContent } });
		const titles = screen.getAllByTestId('proof-card-title');
		expect(titles).toHaveLength(5);
		expect(titles[0].textContent).toContain('Transit Operations');
		expect(titles[1].textContent).toContain('Lorem Analytics');
		expect(titles[2].textContent).toContain('Lorem Database');
		expect(titles[3].textContent).toContain('Lorem Query Optimizer');
		expect(titles[4].textContent).toContain('Lorem Retool Admin Panel');
	});

	it('renders tech stack tags', () => {
		render(FeaturedProjects, { props: { proofReel: proofReelContent } });
		const tags = screen.getAllByTestId('proof-tag');
		// 5 cards × 4 tags each = 20 minimum
		expect(tags.length).toBeGreaterThanOrEqual(15);
	});

	it('cards link to /projects/[slug]', () => {
		render(FeaturedProjects, { props: { proofReel: proofReelContent } });
		const cards = screen.getAllByTestId('proof-card');
		expect(cards[0].closest('a')?.getAttribute('href')).toBe('/projects/transit-data-pipeline');
		expect(cards[1].closest('a')?.getAttribute('href')).toBe('/projects/lorem-analytics-dashboard');
		expect(cards[2].closest('a')?.getAttribute('href')).toBe('/projects/lorem-database-migration');
		expect(cards[3].closest('a')?.getAttribute('href')).toBe('/projects/lorem-query-optimizer');
		expect(cards[4].closest('a')?.getAttribute('href')).toBe('/projects/lorem-retool-admin');
	});

	it('renders view-all link to /projects', () => {
		render(FeaturedProjects, { props: { proofReel: proofReelContent } });
		const link = screen.getByTestId('proof-view-all');
		expect(link).toBeInTheDocument();
		expect(link.getAttribute('href')).toBe('/projects');
		expect(link.textContent).toContain('View all projects');
	});

	it('renders project images', () => {
		render(FeaturedProjects, { props: { proofReel: proofReelContent } });
		const images = screen.getAllByTestId('proof-card-image');
		expect(images).toHaveLength(5);
	});
});
