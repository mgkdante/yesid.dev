import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import GradientSeparator from './GradientSeparator.svelte';

describe('GradientSeparator', () => {
	it('renders an SVG line element', () => {
		const { container } = render(GradientSeparator);
		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();
		const line = svg?.querySelector('line');
		expect(line).toBeTruthy();
	});

	it('renders with a linearGradient in defs', () => {
		const { container } = render(GradientSeparator);
		const gradient = container.querySelector('linearGradient');
		expect(gradient).toBeTruthy();
		const stops = gradient?.querySelectorAll('stop');
		expect(stops?.length).toBe(2);
	});

	it('renders label when provided', () => {
		const { getByText } = render(GradientSeparator, {
			props: { label: 'Test Section' }
		});
		expect(getByText('Test Section')).toBeTruthy();
	});

	it('does not render label when not provided', () => {
		const { container } = render(GradientSeparator);
		const labelDiv = container.querySelector('[data-testid="separator-label"]');
		expect(labelDiv).toBeNull();
	});

	it('uses unique gradient IDs across instances', () => {
		const { container: c1 } = render(GradientSeparator);
		const { container: c2 } = render(GradientSeparator);
		const id1 = c1.querySelector('linearGradient')?.getAttribute('id');
		const id2 = c2.querySelector('linearGradient')?.getAttribute('id');
		expect(id1).not.toBe(id2);
	});
});
