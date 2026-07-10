import { describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import {
	ANALYTICS_CONSENT_KEY,
	createAnalyticsConsentStore,
	type AnalyticsConsentChoice,
} from './analytics-consent.svelte';

interface HarnessOptions {
	hostname?: string;
	stored?: string | null;
	readThrows?: boolean;
	writeThrows?: boolean;
	removeThrows?: boolean;
}

function createHarness({
	hostname = 'yesid.dev',
	stored = null,
	readThrows = false,
	writeThrows = false,
	removeThrows = false,
}: HarnessOptions = {}) {
	let value = stored;
	const reload = vi.fn();
	const read = vi.fn(() => {
		if (readThrows) throw new Error('read blocked');
		return value;
	});
	const write = vi.fn((next: AnalyticsConsentChoice) => {
		if (writeThrows) throw new Error('write blocked');
		value = next;
	});
	const remove = vi.fn(() => {
		if (removeThrows) throw new Error('remove blocked');
		value = null;
	});
	const dependencies = {
		hostname: () => hostname,
		read,
		write,
		remove,
		reload,
	};
	const store = createAnalyticsConsentStore(dependencies);

	return {
		store,
		read,
		write,
		remove,
		reload,
		stored: () => value,
		freshStore: () => createAnalyticsConsentStore(dependencies),
	};
}

describe('analytics consent state', () => {
	it.each([null, '', 'yes', 'GRANTED'])('fails closed for missing or invalid storage value %j', (stored) => {
		const { store } = createHarness({ stored });

		expect(store.init()).toBeTypeOf('function');
		expect(get(store)).toEqual({ choice: 'unknown', ready: true, available: true });
	});

	it.each(['granted', 'denied'] as const)('persists and commits a %s choice', (choice) => {
		const harness = createHarness();
		harness.store.init();

		harness.store[choice === 'granted' ? 'grant' : 'deny']();

		expect(harness.write).toHaveBeenCalledOnce();
		expect(harness.write).toHaveBeenCalledWith(choice);
		expect(harness.stored()).toBe(choice);
		expect(get(harness.store)).toEqual({ choice, ready: true, available: true });
	});

	it.each(['granted', 'denied'] as const)('restores a durable %s choice', (choice) => {
		const { store } = createHarness({ stored: choice });

		store.init();

		expect(get(store)).toEqual({ choice, ready: true, available: true });
	});

	it('clears a granted choice and reloads once when preferences reopen', () => {
		const harness = createHarness({ stored: 'granted' });
		harness.store.init();

		harness.store.openPreferences();

		expect(harness.remove).toHaveBeenCalledOnce();
		expect(harness.stored()).toBeNull();
		expect(get(harness.store)).toEqual({ choice: 'unknown', ready: true, available: true });
		expect(harness.reload).toHaveBeenCalledOnce();
	});

	it('clears a denied choice without reloading when preferences reopen', () => {
		const harness = createHarness({ stored: 'denied' });
		harness.store.init();

		harness.store.openPreferences();

		expect(harness.remove).toHaveBeenCalledOnce();
		expect(harness.stored()).toBeNull();
		expect(get(harness.store)).toEqual({ choice: 'unknown', ready: true, available: true });
		expect(harness.reload).not.toHaveBeenCalled();
	});

	it('fails closed when storage cannot be read', () => {
		const harness = createHarness({ stored: 'granted', readThrows: true });

		expect(() => harness.store.init()).not.toThrow();
		expect(get(harness.store)).toEqual({ choice: 'unknown', ready: true, available: true });
	});

	it('keeps a failed grant write in memory only and a fresh load is unknown', () => {
		const harness = createHarness({ writeThrows: true });
		harness.store.init();

		expect(() => harness.store.grant()).not.toThrow();
		expect(get(harness.store).choice).toBe('granted');
		expect(harness.stored()).toBeNull();

		const freshStore = harness.freshStore();
		freshStore.init();
		expect(get(freshStore)).toEqual({ choice: 'unknown', ready: true, available: true });
	});

	it('replaces a surviving grant with denied before reloading when removal fails', () => {
		const harness = createHarness({ stored: 'granted', removeThrows: true });
		harness.store.init();

		expect(() => harness.store.openPreferences()).not.toThrow();

		expect(harness.remove).toHaveBeenCalledOnce();
		expect(harness.write).toHaveBeenCalledOnce();
		expect(harness.write).toHaveBeenCalledWith('denied');
		expect(harness.stored()).toBe('denied');
		expect(get(harness.store)).toEqual({ choice: 'unknown', ready: true, available: true });
		expect(harness.reload).toHaveBeenCalledOnce();

		const freshStore = harness.freshStore();
		freshStore.init();
		expect(get(freshStore)).toEqual({ choice: 'denied', ready: true, available: true });
	});

	it('does not reload when removal and denied fallback both fail', () => {
		const harness = createHarness({
			stored: 'granted',
			removeThrows: true,
			writeThrows: true,
		});
		harness.store.init();

		expect(() => harness.store.openPreferences()).not.toThrow();

		expect(harness.remove).toHaveBeenCalledOnce();
		expect(harness.write).toHaveBeenCalledOnce();
		expect(harness.write).toHaveBeenCalledWith('denied');
		expect(harness.stored()).toBe('granted');
		expect(get(harness.store)).toEqual({ choice: 'unknown', ready: true, available: true });
		expect(harness.reload).not.toHaveBeenCalled();
	});

	it.each(['dev.yesid.dev', 'localhost', 'slice-35.vercel.app', 'www.yesid.dev', 'YESID.DEV'])(
		'remains unavailable and unknown on non-production hostname %s',
		(hostname) => {
			const harness = createHarness({ hostname, stored: 'granted' });

			harness.store.init();

			expect(get(harness.store)).toEqual({ choice: 'unknown', ready: true, available: false });
			expect(harness.read).not.toHaveBeenCalled();
		},
	);

	it('uses the versioned storage key', () => {
		expect(ANALYTICS_CONSENT_KEY).toBe('yesid:analytics-consent:v1');
	});
});
