import {
	defineAnalyticsPreset,
	type AnalyticsEventName as PresetEventName,
} from '@yesid/analytics/config';

export const YESID_ANALYTICS_PRESET = defineAnalyticsPreset({
	events: [
		'contact_form_success',
		'contact_form_error',
		'booking_click',
		'direct_contact_click',
		'project_proof_click',
		'profile_click',
		'language_switch',
		'404',
	],
});

export type AnalyticsEventName = PresetEventName<typeof YESID_ANALYTICS_PRESET>;
