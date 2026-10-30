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

	it('renders no legend overlay inside the frame (taste-2)', () => {
		const { container } = render(MetroNetwork, {
			props: { svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' },
		});
		expect(container.querySelector('[data-testid="metro-legend"]')).toBeNull();
		expect(container.querySelector('.metro-legend')).toBeNull();
	});
});
