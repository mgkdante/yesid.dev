import { describe, expect, it } from 'bun:test';
import { toSiteLabels } from './site-labels';
import { SiteLabelsSchema } from '@repo/shared/schemas';
import seeds from '../../../fixtures/content/site-labels.json';
import frSeeds from '../../../fixtures/content/site-labels.fr.json';

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

	it('recomposes the slice-30 chrome columns into companion-shaped groups', () => {
		const row = {
			id: 'u1',
			translations: [
				{ languages_code: 'en', ...seeds },
				{ languages_code: 'fr', ...frSeeds },
			],
		};
		const out = toSiteLabels(row);
		// projects companion → projectsChrome (with FR merged from the fr row).
		expect(out.projectsChrome.pageMeta.title).toEqual({ en: 'Projects | yesid.', fr: 'Projets | yesid.' });
		expect(out.projectsChrome.listing.filters.techStack).toEqual({ en: 'Tech Stack', fr: 'Stack technique' });
		expect(out.projectsChrome.detail.glance.liveSiteLabelMobile).toEqual({
			en: '↗ Live Site',
			fr: '↗ Site en ligne',
		});
		// blog / services / nav / footer companions.
		expect(out.blogChrome.listing.mobileHeading).toEqual({ en: 'Blog', fr: 'Blogue' });
		expect(out.servicesChrome.detail.backToServicesLabel).toEqual({
			en: '← All Services',
			fr: '← Tous les services',
		});
		expect(out.navChrome.shared.openMenuAria).toEqual({ en: 'Open menu', fr: 'Ouvrir le menu' });
		expect(out.footerChrome.footer.tagline).toEqual({
			en: '// digital infrastructure',
			fr: '// infrastructure numérique',
		});
		// hero-data dashboard labelI18n/subI18n (subs are runtime-templated).
		expect(out.heroDashboard.vehiclesLabel).toEqual({ en: 'VEHICLES TRACKED', fr: 'VÉHICULES SUIVIS' });
		expect(out.heroDashboard.delaySub).toEqual({ en: '{coverage}% COVERAGE', fr: '{coverage}% DE COUVERTURE' });
		expect(() => SiteLabelsSchema.parse(out)).not.toThrow();
	});
});
