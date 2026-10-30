import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Manifesto from './Manifesto.svelte';
import { manifestoContent } from '#lib/content/site-content.ts';

describe('Manifesto', () => {
	it('renders the manifesto section', () => {
		render(Manifesto, { props: { manifesto: manifestoContent } });
		expect(screen.getByTestId('manifesto-section')).toBeInTheDocument();
	});

	it('renders the terminal prompt from data layer', () => {
		render(Manifesto, { props: { manifesto: manifestoContent } });
		const prompt = screen.getByTestId('manifesto-prompt');
		expect(prompt.textContent).toContain('yesid@mtl');
		expect(prompt.textContent).toContain('cat');
	});

	it('renders the statement text in variable sizes', () => {
		render(Manifesto, { props: { manifesto: manifestoContent } });
		const text = screen.getByTestId('manifesto-text');
		expect(text.textContent).toContain('I BUILD THE');
		expect(text.textContent).toContain('INFRASTRUCTURE');
		expect(text.textContent).toContain('OPERATIONS');
		expect(text.textContent).toContain('RUN ON');
	});

	it('renders left edge decorations from data layer', () => {
		render(Manifesto, { props: { manifesto: manifestoContent } });
		const edge = screen.getByTestId('manifesto-edge-left');
		expect(edge.textContent).toContain('SEC');
		expect(edge.textContent).toContain('MANIFESTO');
		expect(edge.textContent).toContain('MTL');
	});

	it('renders right edge with easter egg locations', () => {
		render(Manifesto, { props: { manifesto: manifestoContent } });
		const edge = screen.getByTestId('manifesto-edge-right');
		expect(edge.textContent).toContain('Sherbrooke');
		expect(edge.textContent).toContain('Lennoxville');
		expect(edge.textContent).toContain('Montréal');
	});

	it('renders bottom status bar', () => {
		render(Manifesto, { props: { manifesto: manifestoContent } });
		const bar = screen.getByTestId('manifesto-edge-bottom');
		expect(bar.textContent).toContain('CONNECTED');
		expect(bar.textContent).toContain('LIGNE ORANGE');
	});

	it('renders transit elements', () => {
		render(Manifesto, { props: { manifesto: manifestoContent } });
		expect(screen.getByTestId('manifesto-arrival')).toBeInTheDocument();
		expect(screen.getByTestId('manifesto-platform-badge')).toBeInTheDocument();
		expect(screen.getByTestId('manifesto-direction-badge')).toBeInTheDocument();
	});

	it('renders measurement ticks', () => {
		render(Manifesto, { props: { manifesto: manifestoContent } });
		const ticks = screen.getByTestId('manifesto-edge-top');
		expect(ticks).toBeInTheDocument();
		expect(ticks.textContent).toContain('0');
		expect(ticks.textContent).toContain('80');
	});
});
