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
