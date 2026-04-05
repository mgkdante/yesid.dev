import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import MetroNetwork from './MetroNetwork.svelte';

describe('MetroNetwork', () => {
	it('renders the container div', () => {
		const { container } = render(MetroNetwork);
		const div = container.querySelector('[data-testid="metro-network-container"]');
		expect(div).toBeInTheDocument();
	});

	// The SVG is fetched async from /images/montreal-metro.svg.
	// Full DOM testing requires E2E (Playwright) — unit tests verify the container renders.
});
