import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProofReel from './ProofReel.svelte';

describe('ProofReel', () => {
	it('renders the section with correct testid', () => {
		render(ProofReel);
		expect(screen.getByTestId('proof-reel-section')).toBeInTheDocument();
	});

	it('renders the section label', () => {
		render(ProofReel);
		expect(screen.getByTestId('proof-reel-label')).toBeInTheDocument();
		expect(screen.getByTestId('proof-reel-label').textContent).toContain('// PROOF');
	});

	it('renders exactly 3 project cards', () => {
		render(ProofReel);
		const cards = screen.getAllByTestId('proof-card');
		expect(cards).toHaveLength(3);
	});

	it('renders impact metrics for each card', () => {
		render(ProofReel);
		const metrics = screen.getAllByTestId('proof-metric-value');
		expect(metrics).toHaveLength(3);
		expect(metrics[0].textContent).toContain('30s');
		expect(metrics[1].textContent).toContain('15 min');
		expect(metrics[2].textContent).toContain('500 GB');
	});

	it('renders before value with strikethrough when present', () => {
		render(ProofReel);
		const beforeEl = screen.getByTestId('proof-metric-before');
		expect(beforeEl).toBeInTheDocument();
		expect(beforeEl.textContent).toContain('2 days');
	});

	it('renders project titles', () => {
		render(ProofReel);
		const titles = screen.getAllByTestId('proof-card-title');
		expect(titles).toHaveLength(3);
		expect(titles[0].textContent).toContain('Transit Operations');
		expect(titles[1].textContent).toContain('Lorem Analytics');
		expect(titles[2].textContent).toContain('Lorem Database');
	});

	it('renders tech stack tags', () => {
		render(ProofReel);
		const tags = screen.getAllByTestId('proof-tag');
		expect(tags.length).toBeGreaterThanOrEqual(9);
	});

	it('cards link to /work/[slug]', () => {
		render(ProofReel);
		const cards = screen.getAllByTestId('proof-card');
		expect(cards[0].closest('a')?.getAttribute('href')).toBe('/work/transit-data-pipeline');
		expect(cards[1].closest('a')?.getAttribute('href')).toBe('/work/lorem-analytics-dashboard');
		expect(cards[2].closest('a')?.getAttribute('href')).toBe('/work/lorem-database-migration');
	});

	it('renders view-all link to /work', () => {
		render(ProofReel);
		const link = screen.getByTestId('proof-view-all');
		expect(link).toBeInTheDocument();
		expect(link.getAttribute('href')).toBe('/work');
		expect(link.textContent).toContain('View all work');
	});

	it('renders project images', () => {
		render(ProofReel);
		const images = screen.getAllByTestId('proof-card-image');
		expect(images).toHaveLength(3);
	});
});
