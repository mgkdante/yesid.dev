import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { createHomeIntroStore } from './home-intro.svelte';

describe('home intro state', () => {
	it('moves through pending, running, settled, and reset explicitly', () => {
		const store = createHomeIntroStore();

		expect(get(store)).toBe('pending');

		store.begin();
		expect(get(store)).toBe('running');

		store.settle();
		expect(get(store)).toBe('settled');

		store.reset();
		expect(get(store)).toBe('pending');
	});

	it('allows replay to move a settled intro back to running', () => {
		const store = createHomeIntroStore();

		store.settle();
		store.begin();

		expect(get(store)).toBe('running');
	});
});
