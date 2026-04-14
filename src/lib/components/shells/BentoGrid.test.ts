import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BentoGrid from './BentoGrid.svelte';

describe('BentoGrid', () => {
	it('renders with data-slot', () => {
		const { container } = render(BentoGrid);
		const el = container.querySelector('[data-slot="bento-grid"]');
		expect(el).toBeTruthy();
	});

	it('applies grid display', () => {
		const { container } = render(BentoGrid);
		const el = container.querySelector('[data-slot="bento-grid"]');
		expect(el?.classList.contains('grid')).toBe(true);
	});

	it('accepts custom class', () => {
		const { container } = render(BentoGrid, { props: { class: 'my-bento' } });
		const el = container.querySelector('[data-slot="bento-grid"]');
		expect(el?.classList.contains('my-bento')).toBe(true);
	});
});
