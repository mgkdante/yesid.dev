import { describe, it, expect } from 'vitest';
import {
	registerSession,
	registerScrollContext,
	captureEntries,
	applyEntries,
} from './locale-handoff.svelte';

describe('locale-handoff registry (the switch round-trip)', () => {
	it('captures registered session values and applies them back', () => {
		let q = 'svelte';
		let lang: string | null = 'fr';
		const c1 = registerSession('blog-q', { get: () => q, set: (v) => (q = v as string) });
		const c2 = registerSession('blog-lang', {
			get: () => lang,
			set: (v) => (lang = v as string | null),
		});

		const snap = captureEntries();
		expect(snap['blog-q']).toBe('svelte');
		expect(snap['blog-lang']).toBe('fr');

		// simulate the {#key} remount resetting everything to defaults
		q = '';
		lang = null;
		applyEntries(snap);
		expect(q).toBe('svelte');
		expect(lang).toBe('fr');

		c1();
		c2();
		expect(captureEntries()).toEqual({});
	});

	it('unregister removes the entry only while it still owns the key', () => {
		let v = 1;
		const cleanup = registerSession('k', { get: () => v, set: (x) => (v = x as number) });
		expect(captureEntries()['k']).toBe(1);
		cleanup();
		expect('k' in captureEntries()).toBe(false);
	});

	it('applyEntries ignores keys with no registered consumer (conditionally-rendered surfaces)', () => {
		expect(() => applyEntries({ 'never-registered': 'x' })).not.toThrow();
	});

	it('registerScrollContext returns a cleanup that detaches it', () => {
		const cleanup = registerScrollContext({ capture: () => ({ y: 0 }), restore: () => {} });
		expect(typeof cleanup).toBe('function');
		cleanup();
	});
});
