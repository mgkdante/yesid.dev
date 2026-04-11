import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('Home page', () => {
	it('renders the app root', () => {
		render(Page);
		expect(screen.getByTestId('app-root')).toBeInTheDocument();
	});

	it('renders the hero banner', () => {
		render(Page);
		expect(screen.getByTestId('hero-banner')).toBeInTheDocument();
	});

	it('renders the metro network container in the hero', () => {
		render(Page);
		expect(screen.getByTestId('metro-network-container')).toBeInTheDocument();
	});

	it('renders the hero headline', () => {
		render(Page);
		expect(screen.getByTestId('hero-line1')).toBeInTheDocument();
		expect(screen.getByTestId('hero-line1').textContent).toContain('PIPELINES THAT');
		expect(screen.getByTestId('hero-line2')).toBeInTheDocument();
		expect(screen.getByTestId('hero-line2').textContent).toContain("DON'T BREAK");
	});

	it('renders the hero orange dot', () => {
		render(Page);
		const dot = screen.getByTestId('hero-dot');
		expect(dot).toBeInTheDocument();
		expect(dot.tagName.toLowerCase()).toBe('svg');
	});

	it('renders hero subheadline', () => {
		render(Page);
		const sub = screen.getByTestId('hero-subheadline');
		expect(sub).toBeInTheDocument();
		expect(sub.textContent).toContain('Data that tell the truth');
	});

	it('renders hero subtitle', () => {
		render(Page);
		const subtitle = screen.getByTestId('hero-subtitle');
		expect(subtitle).toBeInTheDocument();
		expect(subtitle.textContent).toContain('reliable infrastructure');
	});

	it('renders hero CTAs', () => {
		render(Page);
		expect(screen.getByTestId('hero-cta-work')).toBeInTheDocument();
		expect(screen.getByTestId('hero-cta-contact')).toBeInTheDocument();
	});

	it('renders hero metric cards', () => {
		render(Page);
		expect(screen.getByTestId('hero-metrics')).toBeInTheDocument();
		const cards = screen.getAllByTestId('metric-card');
		expect(cards).toHaveLength(3);
	});

	it('renders hero SQL panel', () => {
		render(Page);
		expect(screen.getByTestId('sql-panel')).toBeInTheDocument();
		expect(screen.getByTestId('sql-query').textContent).toContain('SELECT');
	});

	it('renders hero refresh button', () => {
		render(Page);
		expect(screen.getByTestId('hero-refresh')).toBeInTheDocument();
	});

	it('renders the hard-cut transition between hero and manifesto', () => {
		render(Page);
		expect(screen.getByTestId('hard-cut')).toBeInTheDocument();
	});

	it('renders the manifesto section', () => {
		render(Page);
		expect(screen.getByTestId('manifesto-section')).toBeInTheDocument();
	});

	it('renders manifesto capability pills', () => {
		render(Page);
		const pills = screen.getAllByTestId('manifesto-pill');
		expect(pills).toHaveLength(5);
	});

	it('renders the proof reel section', () => {
		render(Page);
		expect(screen.getByTestId('proof-reel-section')).toBeInTheDocument();
	});

	it('renders 3 proof reel cards', () => {
		render(Page);
		const cards = screen.getAllByTestId('proof-card');
		expect(cards).toHaveLength(3);
	});
});
