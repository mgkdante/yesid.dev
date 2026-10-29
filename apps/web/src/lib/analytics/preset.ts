import {
	defineAnalyticsPreset,
	type AnalyticsEventName as PresetEventName,
} from '@yesid/analytics/config';

export const YESID_ANALYTICS_PRESET = defineAnalyticsPreset({
	events: ['contact_form_success', 'booking_click', 'direct_contact_click', 'project_proof_click'],
});

export type AnalyticsEventName = PresetEventName<typeof YESID_ANALYTICS_PRESET>;
