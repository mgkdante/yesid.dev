import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import EdgeRail from './EdgeRail.svelte';

describe('EdgeRail', () => {
	it('renders with data-slot', () => {
		const { container } = render(EdgeRail, { props: { position: 'left' } });
		const el = container.querySelector('[data-slot="edge-rail"]');
		expect(el).toBeTruthy();
	});

	it('applies position as data attribute', () => {
		const { container } = render(EdgeRail, { props: { position: 'right' } });
		const el = container.querySelector('[data-slot="edge-rail"]');
		expect(el?.getAttribute('data-position')).toBe('right');
	});

	it('renders label when provided', () => {
		const { container } = render(EdgeRail, { props: { position: 'left', label: '// services' } });
		const label = container.querySelector('[data-edge-label]');
		expect(label?.textContent).toBe('// services');
	});

	it('does not render label element when not provided', () => {
		const { container } = render(EdgeRail, { props: { position: 'left' } });
		const label = container.querySelector('[data-edge-label]');
		expect(label).toBeNull();
	});

	it('renders section markers when provided', () => {
		const sections = [
			{ id: 'hero', label: 'Hero' },
			{ id: 'content', label: 'Content' }
		];
		const { container } = render(EdgeRail, { props: { position: 'left', sections } });
		const markers = container.querySelectorAll('[data-edge-marker]');
		expect(markers).toHaveLength(2);
	});

	it('accepts custom class', () => {
		const { container } = render(EdgeRail, { props: { position: 'left', class: 'custom-rail' } });
		const el = container.querySelector('[data-slot="edge-rail"]');
		expect(el?.classList.contains('custom-rail')).toBe(true);
	});
});
