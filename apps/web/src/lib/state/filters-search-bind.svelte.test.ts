import { describe, it, expect } from 'vitest';
import { persisted } from '@yesid/ui/state';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Parent from './_filters-search-parent-fixture.svelte';

// The listing pages keep free-text search in persisted() and bind it INTO a
// $bindable filter child via `bind:searchQuery={q.value}`. This proves that wiring:
//   1. typing in the child input flows back up through the persisted rune and
//      drives the (derived) listing filter;
//   2. a remounted listing repopulates BOTH the bound input and the derived filter.
describe('persisted search bound into a $bindable filter child', () => {
	it('child input writes propagate through the persisted rune to the filter', async () => {
		render(Parent);

		const input = screen.getByTestId('child-search') as HTMLInputElement;
		expect(screen.getByTestId('filter-result').textContent).toBe('all');

		await fireEvent.input(input, { target: { value: 'railway' } });

		// The rune (not just the DOM element) updated → the derived filter reacted.
		expect(input.value).toBe('railway');
		expect(screen.getByTestId('filter-result').textContent).toBe('q:railway');
	});

	it('a remount repopulates the bound input and the filter', () => {
		persisted('fixture-projects-q', '').value = 'sveltekit';
		render(Parent);

		const input = screen.getByTestId('child-search') as HTMLInputElement;
		expect(input.value).toBe('sveltekit');
		expect(screen.getByTestId('filter-result').textContent).toBe('q:sveltekit');
	});
});
