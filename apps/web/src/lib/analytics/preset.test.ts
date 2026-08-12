import { describe, expect, it } from 'vitest';
import {
	ANALYTICS_CONSENT_KEY,
	ANALYTICS_DENIAL_SAFETY_KEY,
	ANALYTICS_PREFERENCES_OPEN_KEY,
	ANALYTICS_STORAGE_PROBE_KEY,
	YESID_ANALYTICS_PRESET,
} from './preset';

describe('yesid.dev analytics preset', () => {
	it('owns the exact domain, event, and storage-key contract', () => {
		expect(YESID_ANALYTICS_PRESET).toEqual({
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
		expect(ANALYTICS_CONSENT_KEY).toBe(YESID_ANALYTICS_PRESET.storageKeys.consent);
		expect(ANALYTICS_PREFERENCES_OPEN_KEY).toBe(
			YESID_ANALYTICS_PRESET.storageKeys.preferencesOpen,
		);
		expect(ANALYTICS_DENIAL_SAFETY_KEY).toBe(
			YESID_ANALYTICS_PRESET.storageKeys.denialSafety,
		);
		expect(ANALYTICS_STORAGE_PROBE_KEY).toBe(
			YESID_ANALYTICS_PRESET.storageKeys.storageProbe,
		);
	});
});
