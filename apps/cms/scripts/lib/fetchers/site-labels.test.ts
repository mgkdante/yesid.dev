import { describe, expect, it } from 'bun:test';
import { toSiteLabels } from './site-labels';
import { SiteLabelsSchema } from '@repo/shared/schemas';
import seeds from '../../../fixtures/content/site-labels.json';

describe('site-labels transform', () => {
	it('regroups prefix-named columns into the nested SiteLabels shape', () => {
		const row = {
			id: 'u1',
			translations: [
				{ languages_code: 'en', ...seeds },
				{ languages_code: 'fr', a11y_toc: 'Table des matières' },
			],
		};
		const out = toSiteLabels(row);
		expect(out.a11y.toc).toEqual({ en: 'Table of contents', fr: 'Table des matières' });
		expect(out.ui.markerFeatured).toEqual({ en: '{num} / FEATURED' });
		expect(out.email.contactSubjectTemplate.en).toContain('{name}');
		expect(() => SiteLabelsSchema.parse(out)).not.toThrow();
	});
});
