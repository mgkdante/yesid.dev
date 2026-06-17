import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProductPreview from './ProductPreview.svelte';

describe('ProductPreview tech icons', () => {
	it('renders the picked tech icon inside product preview slots', () => {
		render(ProductPreview, {
			props: {
				picks: [{ id: 'postgresql', layer: 'data' }],
			},
		});

		const slot = screen.getByTestId('slot-postgresql');
		const icon = slot.querySelector('[data-testid="tech-icon-postgresql"]');
		expect(icon).toBeTruthy();
		expect(icon?.getAttribute('src')).toBe('https://api.iconify.design/logos/postgresql.svg');
	});
});
