import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import MetroNetwork from './MetroNetwork.svelte';

describe('MetroNetwork', () => {
	it('renders the container div', () => {
		const { container } = render(MetroNetwork, {
			props: { svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' },
		});
		const div = container.querySelector('[data-testid="metro-network-container"]');
		expect(div).toBeInTheDocument();
	});

	it('marks the container for SSR-safe initial SVG hiding', () => {
		const { container } = render(MetroNetwork, {
			props: { svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' },
		});
		const div = container.querySelector('[data-testid="metro-network-container"]');
		expect(div).toHaveClass('metro-network-frame');
	});

	it('inlines the svg prop into the container via {@html}', () => {
		const { container } = render(MetroNetwork, {
			props: { svg: '<svg xmlns="http://www.w3.org/2000/svg" data-test-marker="x"></svg>' },
		});
		const svg = container.querySelector('[data-testid="metro-network-container"] svg');
		expect(svg).toBeInTheDocument();
		expect(svg?.getAttribute('data-test-marker')).toBe('x');
	});

	// Since Slice 18d Phase 8 the SVG markup is supplied as a prop (sourced
	// from Directus via +page.server.ts). Full DOM testing (GSAP-targeted
	// class application) still requires E2E (Playwright) — unit tests verify
	// the container renders + the prop is inlined.
});

describe('MetroNetwork — STM/REM legend (go2/w5)', () => {
	const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

	it('renders the legend with both labels when provided', () => {
		const { container } = render(MetroNetwork, {
			props: { svg, legendStm: 'STM MÉTRO', legendRem: 'REM LIGHT RAIL' },
		});
		const legend = container.querySelector('[data-testid="metro-legend"]');
		expect(legend).toBeInTheDocument();
		expect(legend?.textContent).toContain('STM MÉTRO');
		expect(legend?.textContent).toContain('REM LIGHT RAIL');
	});

	it('legend is decorative art labelling: aria-hidden + .metro-legend fade hook', () => {
		const { container } = render(MetroNetwork, {
			props: { svg, legendStm: 'STM MÉTRO', legendRem: 'REM LIGHT RAIL' },
		});
		const legend = container.querySelector('[data-testid="metro-legend"]');
		expect(legend).toHaveAttribute('aria-hidden', 'true');
		expect(legend).toHaveClass('metro-legend');
	});

	it('renders NO legend when the labels are not provided (back-compat)', () => {
		const { container } = render(MetroNetwork, { props: { svg } });
		expect(container.querySelector('[data-testid="metro-legend"]')).toBeNull();
	});
});
