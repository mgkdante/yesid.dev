import {
	defineAnalyticsPreset,
	type AnalyticsEventName as PresetEventName,
	type AnalyticsPropValues,
} from '@yesid/analytics/config';
import { PUBLISHED_LOCALES } from '#lib/utils/published-locales.ts';

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
	props: {
		locale: PUBLISHED_LOCALES,
		link: ['live', 'repo', 'docs'],
		placement: ['hero', 'contact'],
		channel: ['email', 'phone', 'whatsapp'],
		network: ['github', 'linkedin', 'upwork'],
	},
});

export type AnalyticsEventName = PresetEventName<typeof YESID_ANALYTICS_PRESET>;
export type AnalyticsEventProps = AnalyticsPropValues<NonNullable<typeof YESID_ANALYTICS_PRESET.props>>;
