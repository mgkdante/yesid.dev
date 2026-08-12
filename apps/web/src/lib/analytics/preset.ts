import {
	defineAnalyticsPreset,
	type AnalyticsEventName as PresetEventName,
} from '@yesid/analytics/config';

export const YESID_ANALYTICS_PRESET = defineAnalyticsPreset({
	domain: 'yesid.dev',
	events: [
		'contact_form_success',
		'booking_click',
		'direct_contact_click',
		'project_proof_click',
	],
	storageKeys: {
		consent: 'yesid:analytics-consent:v1',
		preferencesOpen: 'yesid:analytics-preferences-open:v1',
		denialSafety: 'yesid:analytics-denial-safety:v1',
		storageProbe: 'yesid:analytics-storage-probe:v1',
	},
});

export const ANALYTICS_EVENTS = YESID_ANALYTICS_PRESET.events;
export const ANALYTICS_CONSENT_KEY = YESID_ANALYTICS_PRESET.storageKeys.consent;
export const ANALYTICS_PREFERENCES_OPEN_KEY =
	YESID_ANALYTICS_PRESET.storageKeys.preferencesOpen;
export const ANALYTICS_DENIAL_SAFETY_KEY =
	YESID_ANALYTICS_PRESET.storageKeys.denialSafety;
export const ANALYTICS_STORAGE_PROBE_KEY =
	YESID_ANALYTICS_PRESET.storageKeys.storageProbe;

export type AnalyticsEventName = PresetEventName<typeof YESID_ANALYTICS_PRESET>;
