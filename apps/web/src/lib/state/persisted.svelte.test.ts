import { describe, it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { persisted } from './persisted.svelte';
import { captureEntries } from './locale-handoff.svelte';

describe('persisted (session-scoped switch survival)', () => {
	it('initializes to the given value and updates reactively', () => {
		const stop = $effect.root(() => {
			const q = persisted('persisted-test-q', 'init');
			expect(q.value).toBe('init');
			q.value = 'svelte';
			expect(q.value).toBe('svelte');
		});
		stop();
	});

	it('registers with the orchestrator so its value is captured on a switch', () => {
		const stop = $effect.root(() => {
			const q = persisted('persisted-test-reg', 'hello');
			flushSync(); // run the registration $effect
			expect(captureEntries()['persisted-test-reg']).toBe('hello');
			q.value = 'updated';
			expect(captureEntries()['persisted-test-reg']).toBe('updated');
		});
		stop(); // disposes the effect root → runs the unregister cleanup
		expect('persisted-test-reg' in captureEntries()).toBe(false);
	});
});
