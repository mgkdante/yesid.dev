import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import MetroNetwork from './MetroNetwork.svelte';

describe('MetroNetwork', () => {
	it('renders the container div', () => {
		const { container } = render(MetroNetwork);
		const div = container.querySelector('[data-testid="metro-network-container"]');
		expect(div).toBeInTheDocument();
	});

	// Since 17e-4 the SVG is inlined at build via Vite ?raw + {@html}.
	// Full DOM testing (GSAP-targeted class application) requires E2E
	// (Playwright) — unit tests verify the container renders.
});
