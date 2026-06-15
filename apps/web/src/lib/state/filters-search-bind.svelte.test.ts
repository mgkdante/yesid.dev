import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { applyEntries, captureEntries } from './locale-handoff.svelte';
import Parent from './_filters-search-parent-fixture.svelte';

// slice-34.1 (Filters & search) — the listing pages move free-text search from a
// local $state into persisted(), then bind it INTO a $bindable filter child via
// `bind:searchQuery={q.value}`. This proves that exact wiring end to end:
//   1. typing in the child input flows back up through the persisted rune and
//      drives the (derived) listing filter — the bind chain is intact;
//   2. the orchestrator's switch-restore (applyEntries → registered setter)
//      repopulates BOTH the bound input and the derived filter — i.e. the typed
//      text survives a language switch, which is the whole point of the slice.
describe('slice-34.1 — persisted search bound into a $bindable filter child', () => {
	it('child input writes propagate through the persisted rune to the filter', async () => {
		render(Parent);
		flushSync(); // run the registration $effect so the key is in the registry

		const input = screen.getByTestId('child-search') as HTMLInputElement;
		expect(screen.getByTestId('filter-result').textContent).toBe('all');

		await fireEvent.input(input, { target: { value: 'railway' } });

		// The rune (not just the DOM element) updated → the derived filter reacted.
		expect(input.value).toBe('railway');
		expect(screen.getByTestId('filter-result').textContent).toBe('q:railway');

		// And the orchestrator can capture it for the upcoming switch.
		expect(captureEntries()['fixture-projects-q']).toBe('railway');
	});

	it('an orchestrator restore repopulates the bound input and the filter', async () => {
		render(Parent);
		flushSync();

		// Simulate the {#key pathname} remount having reset the rune, then the
		// afterNavigate restore pushing the captured value back through the setter.
		applyEntries({ 'fixture-projects-q': 'sveltekit' });
		flushSync();

		const input = screen.getByTestId('child-search') as HTMLInputElement;
		expect(input.value).toBe('sveltekit');
		expect(screen.getByTestId('filter-result').textContent).toBe('q:sveltekit');
	});
});
