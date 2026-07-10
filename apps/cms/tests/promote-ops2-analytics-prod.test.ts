import { describe, expect, it } from 'bun:test';
import {
	PROD_URL,
	assertProductionTarget,
	analyticsLabelFieldPlan,
} from '../scripts/promote-ops2-analytics-prod';

describe('OPS2 production promoter', () => {
	it('selects only the six analytics-consent fields', () => {
		const plan = analyticsLabelFieldPlan();
		expect(plan).toHaveLength(6);
		expect(
			plan.every((step) =>
				step.target.startsWith('site_labels_translations.ui_analytics_consent_'),
			),
		).toBe(true);
	});

	it('refuses any non-production apply target', () => {
		expect(() => assertProductionTarget('https://cms.dev.yesid.dev')).toThrow(/PROD only/);
		expect(() => assertProductionTarget(PROD_URL)).not.toThrow();
	});
});
