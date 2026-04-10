import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Manifesto from './Manifesto.svelte';

describe('Manifesto', () => {
	it('renders the manifesto section', () => {
		render(Manifesto);
		expect(screen.getByTestId('manifesto-section')).toBeInTheDocument();
	});

	it('renders the terminal prompt from data layer', () => {
		render(Manifesto);
		const prompt = screen.getByTestId('manifesto-prompt');
		expect(prompt.textContent).toContain('yesid@mtl');
		expect(prompt.textContent).toContain('cat');
	});

	it('renders the statement text in variable sizes', () => {
		render(Manifesto);
		const text = screen.getByTestId('manifesto-text');
		expect(text.textContent).toContain('I BUILD THE');
		expect(text.textContent).toContain('INFRASTRUCTURE');
		expect(text.textContent).toContain('OPERATIONS');
		expect(text.textContent).toContain('RUN ON');
	});

	it('renders the INFRASTRUCTURE line with highlight class', () => {
		render(Manifesto);
		const huge = screen.getByTestId('manifesto-line-huge');
		expect(huge.textContent).toBe('INFRASTRUCTURE');
	});

	it('renders exactly 5 capability pills', () => {
		render(Manifesto);
		const pills = screen.getAllByTestId('manifesto-pill');
		expect(pills).toHaveLength(5);
	});

	it('each pill links to the correct service route', () => {
		render(Manifesto);
		const pills = screen.getAllByTestId('manifesto-pill');
		const expectedRoutes = [
			'/services/data-pipeline',
			'/services/database-engineering',
			'/services/analytics-reporting',
			'/services/internal-tooling',
			'/services/web-development',
		];
		pills.forEach((pill, i) => {
			expect(pill).toHaveAttribute('href', expectedRoutes[i]);
		});
	});

	it('renders left edge decorations from data layer', () => {
		render(Manifesto);
		const edge = screen.getByTestId('manifesto-edge-left');
		expect(edge.textContent).toContain('SEC');
		expect(edge.textContent).toContain('MANIFESTO');
		expect(edge.textContent).toContain('MTL');
	});

	it('renders right edge with easter egg locations', () => {
		render(Manifesto);
		const edge = screen.getByTestId('manifesto-edge-right');
		expect(edge.textContent).toContain('Sherbrooke');
		expect(edge.textContent).toContain('Lennoxville');
		expect(edge.textContent).toContain('Montréal');
	});

	it('renders bottom status bar', () => {
		render(Manifesto);
		const bar = screen.getByTestId('manifesto-edge-bottom');
		expect(bar.textContent).toContain('CONNECTED');
		expect(bar.textContent).toContain('LIGNE ORANGE');
	});

	it('renders transit elements', () => {
		render(Manifesto);
		expect(screen.getByTestId('manifesto-arrival')).toBeInTheDocument();
		expect(screen.getByTestId('manifesto-platform-badge')).toBeInTheDocument();
		expect(screen.getByTestId('manifesto-direction-badge')).toBeInTheDocument();
	});

	it('renders measurement ticks', () => {
		render(Manifesto);
		const ticks = screen.getByTestId('manifesto-edge-top');
		expect(ticks).toBeInTheDocument();
		expect(ticks.textContent).toContain('0');
		expect(ticks.textContent).toContain('80');
	});

	it('renders interactive canvas', () => {
		render(Manifesto);
		expect(screen.getByTestId('manifesto-canvas')).toBeInTheDocument();
	});
});
