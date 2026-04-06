import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import GradientSeparator from './GradientSeparator.svelte';

describe('GradientSeparator', () => {
	it('renders the gradient line div', () => {
		const { container } = render(GradientSeparator);
		const line = container.querySelector('[data-testid="gradient-separator"]');
		expect(line).toBeTruthy();
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
});
