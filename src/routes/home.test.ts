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

	it('renders the hero badge', () => {
		render(Page);
		expect(screen.getByTestId('hero-badge')).toBeInTheDocument();
		expect(screen.getByTestId('hero-badge').textContent).toContain('AVAILABLE FOR HIRE');
	});

	it('renders the hero headline', () => {
		render(Page);
		expect(screen.getByTestId('hero-line1')).toBeInTheDocument();
		expect(screen.getByTestId('hero-line1').textContent).toContain('DIGITAL');
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
		expect(subtitle.textContent).toContain('Freelance digital infrastructure');
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
		expect(sql.textContent).toContain('SELECT  y.expertise');
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
});
