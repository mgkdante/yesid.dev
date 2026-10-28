import { browser } from '$app/env';
import {
	createAnalyticsConsentStore,
	probeDurableAnalyticsStorage,
} from '@yesid/analytics/consent';
import { YESID_ANALYTICS_PRESET } from '#lib/analytics/preset.ts';
export type { AnalyticsConsentChoice, AnalyticsConsentState } from '@yesid/analytics/consent';

export const analyticsConsentStore = createAnalyticsConsentStore(YESID_ANALYTICS_PRESET, {
	hostname: () => browser ? window.location.hostname : '',
	probeDurableStorage: () => {
		if (browser) {
			probeDurableAnalyticsStorage(
				window.localStorage,
				YESID_ANALYTICS_PRESET.storageKeys.storageProbe,
			);
		}
	},

	read: () => browser
		? window.localStorage.getItem(YESID_ANALYTICS_PRESET.storageKeys.consent)
		: null,

	write: (value) => {
		if (browser) window.localStorage.setItem(YESID_ANALYTICS_PRESET.storageKeys.consent, value);
	},
	remove: () => {
		if (browser) window.localStorage.removeItem(YESID_ANALYTICS_PRESET.storageKeys.consent);
	},
	readPreferencesMarker: () =>
		browser ? window.sessionStorage.getItem(YESID_ANALYTICS_PRESET.storageKeys.preferencesOpen) : null,
	writePreferencesMarker: (choice) => {
		if (browser) window.sessionStorage.setItem(YESID_ANALYTICS_PRESET.storageKeys.preferencesOpen, choice);
	},
	removePreferencesMarker: () => {
		if (browser) window.sessionStorage.removeItem(YESID_ANALYTICS_PRESET.storageKeys.preferencesOpen);
	},
	readSafetyMarker: () =>
		browser ? window.sessionStorage.getItem(YESID_ANALYTICS_PRESET.storageKeys.denialSafety) : null,
	writeSafetyMarker: () => {
		if (browser) window.sessionStorage.setItem(YESID_ANALYTICS_PRESET.storageKeys.denialSafety, '1');
	},
	removeSafetyMarker: () => {
		if (browser) window.sessionStorage.removeItem(YESID_ANALYTICS_PRESET.storageKeys.denialSafety);
	},
	// Tracking pauses in memory; reopening preferences must not reload.
	reload: () => {},
	listen: (listener) => {
		if (!browser) return () => {};
		const onStorage = (event: StorageEvent) => {
			if (
				event.storageArea === window.localStorage &&
				event.key === YESID_ANALYTICS_PRESET.storageKeys.consent
			) {
				listener(event.newValue);
			}
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	},
});
