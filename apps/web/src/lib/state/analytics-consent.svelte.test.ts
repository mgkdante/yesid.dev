import { describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import {
	ANALYTICS_CONSENT_KEY,
	ANALYTICS_PREFERENCES_OPEN_KEY,
	ANALYTICS_STORAGE_PROBE_KEY,
	createAnalyticsConsentStore,
	probeDurableAnalyticsStorage,
	type AnalyticsConsentChoice,
} from './analytics-consent.svelte';

interface HarnessOptions {
	hostname?: string;
	stored?: string | null;
	marker?: string | null;
	probeThrows?: boolean;
	readThrows?: boolean;
	writeThrows?: boolean;
	writeFailures?: number;
	removeThrows?: boolean;
	markerReadThrows?: boolean;
	markerWriteThrows?: boolean;
	markerRemoveThrows?: boolean;
	reloadThrows?: boolean;
	listenThrows?: boolean;
}

function createHarness({
	hostname = 'yesid.dev',
	stored = null,
	marker = null,
	probeThrows = false,
	readThrows = false,
	writeThrows = false,
	writeFailures = 0,
	removeThrows = false,
	markerReadThrows = false,
	markerWriteThrows = false,
	markerRemoveThrows = false,
	reloadThrows = false,
	listenThrows = false,
}: HarnessOptions = {}) {
	let value = stored;
	let markerValue = marker;
	let remainingWriteFailures = writeFailures;
	let activeProbeThrows = probeThrows;
	let activeWriteThrows = writeThrows;
	let activeRemoveThrows = removeThrows;
	let activeMarkerWriteThrows = markerWriteThrows;
	const listeners = new Set<(next: string | null) => void>();
	const probeDurableStorage = vi.fn(() => {
		if (activeProbeThrows) throw new Error('durable storage probe blocked');
	});
	const reload = vi.fn(() => {
		if (reloadThrows) throw new Error('reload blocked');
	});
	const read = vi.fn(() => {
		if (readThrows) throw new Error('read blocked');
		return value;
	});
	const write = vi.fn((next: AnalyticsConsentChoice) => {
		if (activeWriteThrows || remainingWriteFailures > 0) {
			remainingWriteFailures -= 1;
			throw new Error('write blocked');
		}
		value = next;
	});
	const remove = vi.fn(() => {
		if (activeRemoveThrows) throw new Error('remove blocked');
		value = null;
	});
	const readPreferencesMarker = vi.fn(() => {
		if (markerReadThrows) throw new Error('session read blocked');
		return markerValue;
	});
	const writePreferencesMarker = vi.fn(() => {
		if (activeMarkerWriteThrows) throw new Error('session write blocked');
		markerValue = '1';
	});
	const removePreferencesMarker = vi.fn(() => {
		if (markerRemoveThrows) throw new Error('session remove blocked');
		markerValue = null;
	});
	const listen = vi.fn((listener: (next: string | null) => void) => {
		if (listenThrows) throw new Error('storage listener blocked');
		listeners.add(listener);
		return () => listeners.delete(listener);
	});
	const dependencies = {
		hostname: () => hostname,
		probeDurableStorage,
		read,
		write,
		remove,
		readPreferencesMarker,
		writePreferencesMarker,
		removePreferencesMarker,
		reload,
		listen,
	};
	const store = createAnalyticsConsentStore(dependencies);

	return {
		store,
		probeDurableStorage,
		read,
		write,
		remove,
		readPreferencesMarker,
		writePreferencesMarker,
		removePreferencesMarker,
		reload,
		listen,
		stored: () => value,
		marker: () => markerValue,
		emitStoredChange: (next: string | null) => {
			value = next;
			for (const listener of listeners) listener(next);
		},
		setFailures: ({
			probe,
			write,
			remove,
			markerWrite,
		}: Partial<{
			probe: boolean;
			write: boolean;
			remove: boolean;
			markerWrite: boolean;
		}>) => {
			if (probe !== undefined) activeProbeThrows = probe;
			if (write !== undefined) activeWriteThrows = write;
			if (remove !== undefined) activeRemoveThrows = remove;
			if (markerWrite !== undefined) activeMarkerWriteThrows = markerWrite;
		},
		freshStore: () => createAnalyticsConsentStore(dependencies),
	};
}

describe('analytics consent state', () => {
	it('probes healthy durable storage before reading choices without changing consent', () => {
		const harness = createHarness({ stored: 'granted' });

		harness.store.init();

		expect(harness.probeDurableStorage).toHaveBeenCalledOnce();
		expect(harness.read).toHaveBeenCalledOnce();
		expect(harness.probeDurableStorage.mock.invocationCallOrder[0]).toBeLessThan(
			harness.read.mock.invocationCallOrder[0]!,
		);
		expect(harness.stored()).toBe('granted');
		expect(get(harness.store)).toEqual({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
	});

	it('fails unavailable without reading choices when the durable storage probe fails', () => {
		const harness = createHarness({ stored: 'granted', marker: '1', probeThrows: true });

		harness.store.init();

		expect(harness.probeDurableStorage).toHaveBeenCalledOnce();
		expect(harness.read).not.toHaveBeenCalled();
		expect(harness.readPreferencesMarker).not.toHaveBeenCalled();
		expect(get(harness.store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: false,
			preferencesOpen: false,
		});
	});

	it.each([null, '', 'yes', 'GRANTED'])('fails closed for missing or invalid storage value %j', (stored) => {
		const { store } = createHarness({ stored });

		expect(store.init()).toBeTypeOf('function');
		expect(get(store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
	});

	it.each(['granted', 'denied'] as const)('persists and commits a %s choice', (choice) => {
		const harness = createHarness({ marker: '1' });
		harness.store.init();

		harness.store[choice === 'granted' ? 'grant' : 'deny']();

		expect(harness.write).toHaveBeenCalledOnce();
		expect(harness.write).toHaveBeenCalledWith(choice);
		expect(harness.stored()).toBe(choice);
		expect(harness.removePreferencesMarker).toHaveBeenCalledOnce();
		expect(harness.marker()).toBeNull();
		expect(get(harness.store)).toEqual({
			choice,
			ready: true,
			available: true,
			preferencesOpen: false,
		});
	});

	it.each(['granted', 'denied'] as const)('restores a durable %s choice', (choice) => {
		const { store } = createHarness({ stored: choice });

		store.init();

		expect(get(store)).toEqual({
			choice,
			ready: true,
			available: true,
			preferencesOpen: false,
		});
	});

	it('synchronizes a denial across initialized tabs and unsubscribes on teardown', () => {
		const harness = createHarness({ stored: 'granted' });
		const firstTab = harness.store;
		const secondTab = harness.freshStore();
		const stopFirst = firstTab.init();
		const stopSecond = secondTab.init();

		expect(get(firstTab).choice).toBe('granted');
		expect(get(secondTab).choice).toBe('granted');
		expect(harness.listen).toHaveBeenCalledTimes(2);

		firstTab.deny();
		expect(get(firstTab).choice).toBe('denied');
		expect(get(secondTab).choice).toBe('granted');

		harness.emitStoredChange('denied');
		expect(get(secondTab)).toMatchObject({
			choice: 'denied',
			available: true,
			preferencesOpen: false,
		});

		stopSecond();
		harness.emitStoredChange('granted');
		expect(get(secondTab).choice).toBe('denied');
		stopFirst();
	});

	it.each([null, '', 'unexpected'])(
		'persists a denial after an external removal or invalid durable value %j',
		(next) => {
			const harness = createHarness({ stored: 'granted' });
			harness.store.init();

			harness.emitStoredChange(next);

			expect(harness.write).toHaveBeenCalledWith('denied');
			expect(harness.stored()).toBe('denied');
			expect(get(harness.store)).toMatchObject({
				choice: 'denied',
				available: true,
			});

			const freshStore = harness.freshStore();
			freshStore.init();
			expect(get(freshStore)).toMatchObject({
				choice: 'denied',
				available: true,
			});
		},
	);

	it('uses the session safety marker when an external removal cannot persist denial', () => {
		const harness = createHarness({ stored: 'granted' });
		harness.store.init();
		harness.setFailures({ write: true });

		harness.emitStoredChange(null);

		expect(harness.marker()).toBe('1');
		expect(get(harness.store)).toMatchObject({
			choice: 'denied',
			available: true,
		});

		const freshStore = harness.freshStore();
		freshStore.init();
		expect(get(freshStore)).toMatchObject({
			choice: 'unknown',
			available: true,
			preferencesOpen: true,
		});
	});

	it('fails unavailable when cross-tab synchronization cannot be installed', () => {
		const harness = createHarness({ stored: 'granted', listenThrows: true });

		harness.store.init();

		expect(get(harness.store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: false,
			preferencesOpen: false,
		});
	});

	it('restores the exact session marker as forced-open preferences over a durable denial', () => {
		const { store } = createHarness({ stored: 'denied', marker: '1' });

		store.init();

		expect(get(store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
	});

	it.each(['', '0', 'true', 'yes'])('ignores non-matching session marker value %j', (marker) => {
		const { store } = createHarness({ stored: 'denied', marker });

		store.init();

		expect(get(store)).toEqual({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
	});

	it('clears a granted choice, marks preferences open, and survives the requested reload', () => {
		const harness = createHarness({ stored: 'granted' });
		harness.store.init();

		harness.store.openPreferences();

		expect(harness.writePreferencesMarker).toHaveBeenCalledOnce();
		expect(harness.remove).toHaveBeenCalledOnce();
		expect(harness.stored()).toBeNull();
		expect(harness.marker()).toBe('1');
		expect(get(harness.store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
		expect(harness.reload).toHaveBeenCalledOnce();

		const freshStore = harness.freshStore();
		freshStore.init();
		expect(get(freshStore)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
	});

	it.each(['denied', 'unknown'] as const)('opens preferences from a %s choice without reloading', (choice) => {
		const harness = createHarness({ stored: choice === 'denied' ? 'denied' : null });
		harness.store.init();

		harness.store.openPreferences();

		expect(harness.writePreferencesMarker).toHaveBeenCalledOnce();
		expect(harness.remove).toHaveBeenCalledOnce();
		expect(harness.marker()).toBe('1');
		expect(get(harness.store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
		expect(harness.reload).not.toHaveBeenCalled();
	});

	it('fails unavailable when durable storage cannot be read', () => {
		const harness = createHarness({ stored: 'granted', marker: '1', readThrows: true });

		expect(() => harness.store.init()).not.toThrow();
		expect(get(harness.store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: false,
			preferencesOpen: false,
		});
		expect(harness.readPreferencesMarker).not.toHaveBeenCalled();
	});

	it('fails unavailable when the preferences marker cannot be read', () => {
		const harness = createHarness({ stored: 'granted', markerReadThrows: true });

		expect(() => harness.store.init()).not.toThrow();
		expect(get(harness.store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: false,
			preferencesOpen: false,
		});
	});

	it('keeps a failed grant write in memory only and a fresh load is unknown', () => {
		const harness = createHarness({ writeThrows: true });
		harness.store.init();

		expect(() => harness.store.grant()).not.toThrow();
		expect(get(harness.store)).toEqual({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		expect(harness.stored()).toBeNull();

		const freshStore = harness.freshStore();
		freshStore.init();
		expect(get(freshStore)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
	});

	it('keeps the safety marker when a denial and its retry cannot be written', () => {
		const harness = createHarness({ stored: 'granted', marker: '1', writeThrows: true });
		harness.store.init();

		expect(() => harness.store.deny()).not.toThrow();

		expect(harness.write).toHaveBeenCalledTimes(2);
		expect(harness.write).toHaveBeenNthCalledWith(1, 'denied');
		expect(harness.write).toHaveBeenNthCalledWith(2, 'denied');
		expect(harness.writePreferencesMarker).toHaveBeenCalledOnce();
		expect(harness.remove).toHaveBeenCalledOnce();
		expect(harness.removePreferencesMarker).not.toHaveBeenCalled();
		expect(harness.stored()).toBeNull();
		expect(harness.marker()).toBe('1');
		expect(get(harness.store)).toEqual({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: false,
		});

		const freshStore = harness.freshStore();
		freshStore.init();
		expect(get(freshStore)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
	});

	it('retries denial after removing a stale grant and clears the marker only after success', () => {
		const harness = createHarness({ stored: 'granted', marker: '1', writeFailures: 1 });
		harness.store.init();

		harness.store.deny();

		expect(harness.write).toHaveBeenCalledTimes(2);
		expect(harness.remove).toHaveBeenCalledOnce();
		expect(harness.stored()).toBe('denied');
		expect(harness.removePreferencesMarker).toHaveBeenCalledOnce();
		expect(harness.marker()).toBeNull();
		expect(get(harness.store)).toEqual({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: false,
		});

		const freshStore = harness.freshStore();
		freshStore.init();
		expect(get(freshStore)).toEqual({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
	});

	it('uses the marker when a stale grant cannot be removed after denial persistence fails', () => {
		const harness = createHarness({ stored: 'granted', writeThrows: true, removeThrows: true });
		harness.store.init();

		harness.store.deny();

		expect(harness.write).toHaveBeenCalledOnce();
		expect(harness.writePreferencesMarker).toHaveBeenCalledOnce();
		expect(harness.remove).toHaveBeenCalledOnce();
		expect(harness.stored()).toBe('granted');
		expect(harness.marker()).toBe('1');
		expect(get(harness.store)).toEqual({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: false,
		});

		const freshStore = harness.freshStore();
		freshStore.init();
		expect(get(freshStore)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
	});

	it('falls unavailable when denial, marker, and stale-grant removal all fail', () => {
		const harness = createHarness({
			stored: 'granted',
			writeThrows: true,
			removeThrows: true,
			markerWriteThrows: true,
		});
		harness.store.init();

		harness.store.deny();

		expect(harness.stored()).toBe('granted');
		expect(harness.marker()).toBeNull();
		expect(harness.removePreferencesMarker).not.toHaveBeenCalled();
		expect(get(harness.store)).toEqual({
			choice: 'denied',
			ready: true,
			available: false,
			preferencesOpen: false,
		});

		harness.store.init();
		expect(get(harness.store)).toEqual({
			choice: 'denied',
			ready: true,
			available: false,
			preferencesOpen: false,
		});

		// If every persistence channel fails and a later fresh runtime becomes healthy with the
		// untouched grant but no denial record, no software can infer the missing choice. This test
		// intentionally claims only the in-memory unavailable state while persistence is impossible.
	});

	it('falls unavailable when only stale-grant removal succeeds after all safety writes fail', () => {
		const harness = createHarness({
			stored: 'granted',
			writeThrows: true,
			markerWriteThrows: true,
		});
		harness.store.init();

		harness.store.deny();

		expect(harness.write).toHaveBeenCalledTimes(2);
		expect(harness.stored()).toBeNull();
		expect(harness.marker()).toBeNull();
		expect(get(harness.store)).toEqual({
			choice: 'denied',
			ready: true,
			available: false,
			preferencesOpen: false,
		});
	});

	it('uses a durable retry when the safety marker cannot be written', () => {
		const harness = createHarness({
			stored: 'granted',
			writeFailures: 1,
			markerWriteThrows: true,
		});
		harness.store.init();

		harness.store.deny();

		expect(harness.write).toHaveBeenCalledTimes(2);
		expect(harness.stored()).toBe('denied');
		expect(harness.marker()).toBeNull();
		expect(get(harness.store)).toEqual({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: false,
		});

		const freshStore = harness.freshStore();
		freshStore.init();
		expect(get(freshStore).choice).toBe('denied');
	});

	it('keeps a fresh store unavailable when all denial channels and durable health fail after init', () => {
		const harness = createHarness({ stored: 'granted' });
		harness.store.init();
		expect(get(harness.store).choice).toBe('granted');

		harness.setFailures({ probe: true, write: true, remove: true, markerWrite: true });
		harness.store.deny();

		const freshStore = harness.freshStore();
		freshStore.init();

		expect(harness.probeDurableStorage).toHaveBeenCalledTimes(2);
		expect(harness.read).toHaveBeenCalledOnce();
		expect(harness.readPreferencesMarker).toHaveBeenCalledOnce();
		expect(harness.stored()).toBe('granted');
		expect(get(freshStore)).toEqual({
			choice: 'unknown',
			ready: true,
			available: false,
			preferencesOpen: false,
		});
	});

	it('keeps a fresh store unavailable while writes and durable health fail after grant removal', () => {
		const harness = createHarness({ stored: 'granted' });
		harness.store.init();
		expect(get(harness.store).choice).toBe('granted');

		harness.setFailures({ probe: true, write: true, remove: false, markerWrite: true });
		harness.store.deny();
		expect(harness.stored()).toBeNull();

		const freshStore = harness.freshStore();
		freshStore.init();

		expect(harness.probeDurableStorage).toHaveBeenCalledTimes(2);
		expect(harness.read).toHaveBeenCalledOnce();
		expect(harness.readPreferencesMarker).toHaveBeenCalledOnce();
		expect(get(freshStore)).toEqual({
			choice: 'unknown',
			ready: true,
			available: false,
			preferencesOpen: false,
		});
	});

	it('replaces a surviving grant with denied before reloading when removal fails', () => {
		const harness = createHarness({ stored: 'granted', removeThrows: true });
		harness.store.init();

		expect(() => harness.store.openPreferences()).not.toThrow();

		expect(harness.remove).toHaveBeenCalledOnce();
		expect(harness.write).toHaveBeenCalledOnce();
		expect(harness.write).toHaveBeenCalledWith('denied');
		expect(harness.stored()).toBe('denied');
		expect(harness.marker()).toBe('1');
		expect(get(harness.store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
		expect(harness.reload).toHaveBeenCalledOnce();

		const freshStore = harness.freshStore();
		freshStore.init();
		expect(get(freshStore)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
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
		expect(harness.marker()).toBe('1');
		expect(get(harness.store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
		expect(harness.reload).not.toHaveBeenCalled();
	});

	it('persists denial and does not reload a prior grant when the session marker write fails', () => {
		const harness = createHarness({ stored: 'granted', markerWriteThrows: true });
		harness.store.init();

		expect(() => harness.store.openPreferences()).not.toThrow();

		expect(harness.remove).toHaveBeenCalledOnce();
		expect(harness.write).toHaveBeenCalledWith('denied');
		expect(harness.stored()).toBe('denied');
		expect(harness.marker()).toBeNull();
		expect(get(harness.store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
		expect(harness.reload).not.toHaveBeenCalled();

		const freshStore = harness.freshStore();
		freshStore.init();
		expect(get(freshStore)).toEqual({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
	});

	it('fails unavailable when opening preferences cannot write either safety signal', () => {
		const harness = createHarness({
			stored: 'granted',
			writeThrows: true,
			markerWriteThrows: true,
		});
		harness.store.init();

		harness.store.openPreferences();

		expect(harness.stored()).toBeNull();
		expect(get(harness.store)).toEqual({
			choice: 'denied',
			ready: true,
			available: false,
			preferencesOpen: true,
		});
		expect(harness.reload).not.toHaveBeenCalled();
	});

	it('keeps preferences open when a requested reload throws', () => {
		const harness = createHarness({ stored: 'granted', reloadThrows: true });
		harness.store.init();

		expect(() => harness.store.openPreferences()).not.toThrow();

		expect(get(harness.store)).toEqual({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
		expect(harness.reload).toHaveBeenCalledOnce();
	});

	it.each(['granted', 'denied'] as const)(
		'closes preferences after %s even when marker cleanup fails',
		(choice) => {
			const harness = createHarness({ marker: '1', markerRemoveThrows: true });
			harness.store.init();

			expect(() => harness.store[choice === 'granted' ? 'grant' : 'deny']()).not.toThrow();

			expect(harness.stored()).toBe(choice);
			expect(harness.marker()).toBe('1');
			expect(get(harness.store)).toEqual({
				choice,
				ready: true,
				available: true,
				preferencesOpen: false,
			});
		},
	);

	it.each(['dev.yesid.dev', 'localhost', 'slice-35.vercel.app', 'www.yesid.dev', 'YESID.DEV'])(
		'remains unavailable and unknown on non-production hostname %s',
		(hostname) => {
			const harness = createHarness({ hostname, stored: 'granted', marker: '1' });

			harness.store.init();

			expect(get(harness.store)).toEqual({
				choice: 'unknown',
				ready: true,
				available: false,
				preferencesOpen: false,
			});
			expect(harness.probeDurableStorage).not.toHaveBeenCalled();
			expect(harness.read).not.toHaveBeenCalled();
			expect(harness.readPreferencesMarker).not.toHaveBeenCalled();
		},
	);

	it('uses exact versioned durable and session keys', () => {
		expect(ANALYTICS_CONSENT_KEY).toBe('yesid:analytics-consent:v1');
		expect(ANALYTICS_PREFERENCES_OPEN_KEY).toBe('yesid:analytics-preferences-open:v1');
	});

	it('uses a separate exact key to set/remove-test browser durable storage', () => {
		const storage = {
			setItem: vi.fn(),
			removeItem: vi.fn(),
		};

		expect(ANALYTICS_STORAGE_PROBE_KEY).toBe('yesid:analytics-storage-probe:v1');
		probeDurableAnalyticsStorage(storage);

		expect(storage.setItem).toHaveBeenCalledOnce();
		expect(storage.setItem).toHaveBeenCalledWith('yesid:analytics-storage-probe:v1', '1');
		expect(storage.removeItem).toHaveBeenCalledOnce();
		expect(storage.removeItem).toHaveBeenCalledWith('yesid:analytics-storage-probe:v1');
		expect(storage.setItem).not.toHaveBeenCalledWith(ANALYTICS_CONSENT_KEY, expect.anything());
	});
});
