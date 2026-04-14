import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import CardGrid from './CardGrid.svelte';

describe('CardGrid', () => {
	it('renders with data-slot', () => {
		const { container } = render(CardGrid);
		const el = container.querySelector('[data-slot="card-grid"]');
		expect(el).toBeTruthy();
	});

	it('applies default column classes', () => {
		const { container } = render(CardGrid);
		const el = container.querySelector('[data-slot="card-grid"]');
		expect(el?.classList.contains('grid')).toBe(true);
	});

	it('applies column config as data attributes', () => {
		const { container } = render(CardGrid, { props: { sm: 1, md: 2, lg: 3 } });
		const el = container.querySelector('[data-slot="card-grid"]');
		expect(el?.getAttribute('data-cols-sm')).toBe('1');
		expect(el?.getAttribute('data-cols-md')).toBe('2');
		expect(el?.getAttribute('data-cols-lg')).toBe('3');
	});

	it('accepts custom class', () => {
		const { container } = render(CardGrid, { props: { class: 'my-grid' } });
		const el = container.querySelector('[data-slot="card-grid"]');
		expect(el?.classList.contains('my-grid')).toBe(true);
	});
});
