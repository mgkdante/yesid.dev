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

	// go2/w5 taste-2: the in-frame STM/REM legend is gone (it overlapped the
	// art on mobile). The frame must render nothing but the inlined svg —
	// the naming caption lives in HeroBanner, outside this component.
	it('renders no legend overlay inside the frame (taste-2)', () => {
		const { container } = render(MetroNetwork, {
			props: { svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' },
		});
		expect(container.querySelector('[data-testid="metro-legend"]')).toBeNull();
		expect(container.querySelector('.metro-legend')).toBeNull();
	});
});
