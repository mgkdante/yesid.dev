import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { YESID_ANALYTICS_PRESET } from '#lib/analytics/preset.ts';

vi.mock('$app/env', () => ({ browser: true }));
const keys = YESID_ANALYTICS_PRESET.storageKeys;
let store: typeof import('./analytics-consent.svelte').analyticsConsentStore;
let stop: (() => void) | undefined;

beforeEach(async () => {
	vi.resetModules();
	localStorage.clear();
	sessionStorage.clear();
	vi.spyOn(window.location, 'hostname', 'get').mockReturnValue(YESID_ANALYTICS_PRESET.domain);
	store = (await import('./analytics-consent.svelte')).analyticsConsentStore;
});
afterEach(() => {
	stop?.();
	stop = undefined;
	vi.restoreAllMocks();
});

describe('analytics browser bindings', () => {
	it('probes durable storage and persists choices in the preset keys', () => {
		const write = vi.spyOn(window.localStorage, 'setItem');
		const remove = vi.spyOn(window.localStorage, 'removeItem');
		stop = store.init();
		expect(write).toHaveBeenCalledWith(keys.storageProbe, '1');
		expect(remove).toHaveBeenCalledWith(keys.storageProbe);
		expect(get(store)).toMatchObject({ ready: true, available: true });
		store.grant();
		expect(localStorage.getItem(keys.consent)).toBe('granted');
		store.deny();
		expect(localStorage.getItem(keys.consent)).toBe('denied');
	});

	it('preserves a granted choice while opening preferences without reloading', () => {
		localStorage.setItem(keys.consent, 'granted');
		const reload = vi.spyOn(window.location, 'reload');
		stop = store.init();
		store.openPreferences();
		expect(get(store)).toMatchObject({ choice: 'granted', preferencesOpen: true });
		expect(sessionStorage.getItem(keys.preferencesOpen)).toBe('granted');
		expect(localStorage.getItem(keys.consent)).toBeNull();
		expect(reload).not.toHaveBeenCalled();
	});

	it('filters storage events by area and key and removes its listener on teardown', () => {
		stop = store.init();
		window.dispatchEvent(new StorageEvent('storage', {
			storageArea: sessionStorage, key: keys.consent, newValue: 'granted',
		}));
		window.dispatchEvent(new StorageEvent('storage', {
			storageArea: localStorage, key: 'unrelated', newValue: 'granted',
		}));
		expect(get(store).choice).toBe('unknown');
		window.dispatchEvent(new StorageEvent('storage', {
			storageArea: localStorage, key: keys.consent, newValue: 'granted',
		}));
		expect(get(store).choice).toBe('granted');
		stop();
		stop = undefined;
		window.dispatchEvent(new StorageEvent('storage', {
			storageArea: localStorage, key: keys.consent, newValue: 'denied',
		}));
		expect(get(store).choice).toBe('granted');
	});
});
