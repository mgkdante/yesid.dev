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

	it('renders all 4 station sections', () => {
		const { container } = render(Page);
		expect(container.querySelector('[data-testid="station-sql-development"]')).toBeInTheDocument();
		expect(container.querySelector('[data-testid="station-data-pipeline"]')).toBeInTheDocument();
		expect(container.querySelector('[data-testid="station-analytics-reporting"]')).toBeInTheDocument();
		expect(container.querySelector('[data-testid="station-database-engineering"]')).toBeInTheDocument();
	});

	it('each station has its service title', () => {
		render(Page);
		expect(screen.getByText('SQL Development & Optimization')).toBeInTheDocument();
		expect(screen.getByText('Data Pipeline Architecture')).toBeInTheDocument();
		expect(screen.getByText('Analytics & Reporting Systems')).toBeInTheDocument();
		expect(screen.getByText('Database Engineering')).toBeInTheDocument();
	});

	it('renders the featured work section', () => {
		render(Page);
		expect(screen.getByTestId('section-featured-work')).toBeInTheDocument();
	});

	it('renders the about bento section', () => {
		render(Page);
		expect(screen.getByTestId('section-about-bento')).toBeInTheDocument();
	});

	it('renders the blog feed section', () => {
		render(Page);
		expect(screen.getByTestId('section-blog-feed')).toBeInTheDocument();
	});

	it('renders the terminal CTA section', () => {
		render(Page);
		expect(screen.getByTestId('section-terminal')).toBeInTheDocument();
	});

	it('renders CTA with correct text', () => {
		render(Page);
		// CTA headline is split across lines: "Let's build something\nthat moves."
		const terminal = screen.getByTestId('section-terminal');
		expect(terminal.textContent).toContain("Let's build something");
		expect(terminal.textContent).toContain('that moves');
	});

	it('CTA links exist', () => {
		const { container } = render(Page);
		// Terminal CTA has cta-contact and cta-github test IDs
		const terminalSection = container.querySelector('[data-testid="section-terminal"]');
		expect(terminalSection).toBeInTheDocument();
		expect(terminalSection?.querySelector('[data-testid="cta-contact"]')).toBeInTheDocument();
		expect(terminalSection?.querySelector('[data-testid="cta-github"]')).toBeInTheDocument();
	});

	it('renders the hero badge', () => {
		render(Page);
		expect(screen.getByTestId('hero-badge')).toBeInTheDocument();
		expect(screen.getByTestId('hero-badge').textContent).toContain('AVAILABLE FOR HIRE');
	});

	it('renders the hero headline', () => {
		render(Page);
		expect(screen.getByTestId('hero-line1')).toBeInTheDocument();
		expect(screen.getByTestId('hero-line1').textContent).toContain('DATA');
		expect(screen.getByTestId('hero-line2')).toBeInTheDocument();
		expect(screen.getByTestId('hero-line2').textContent).toContain('INFRA');
		expect(screen.getByTestId('hero-line3')).toBeInTheDocument();
		expect(screen.getByTestId('hero-line3').textContent).toContain('BUILT RIGHT.');
	});

	it('renders the hero orange dot', () => {
		render(Page);
		const dot = screen.getByTestId('hero-dot');
		expect(dot).toBeInTheDocument();
		expect(dot.textContent).toBe('.');
	});

	it('renders hero subtitle', () => {
		render(Page);
		const subtitle = screen.getByTestId('hero-subtitle');
		expect(subtitle).toBeInTheDocument();
		expect(subtitle.textContent).toContain('Freelance SQL development');
	});

	it('renders hero CTAs', () => {
		render(Page);
		expect(screen.getByTestId('hero-cta-work')).toBeInTheDocument();
		expect(screen.getByTestId('hero-cta-contact')).toBeInTheDocument();
	});

	it('renders hero SQL decoration', () => {
		render(Page);
		const sql = screen.getByTestId('hero-sql');
		expect(sql).toBeInTheDocument();
		expect(sql.textContent).toContain('SELECT expertise FROM yesid');
	});
});
