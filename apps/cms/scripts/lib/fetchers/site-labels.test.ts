import { describe, expect, it } from 'bun:test';
import { toSiteLabels } from './site-labels';
import { SiteLabelsSchema } from '@repo/shared/schemas';
import seeds from '../../../fixtures/content/site-labels.json';
import frSeeds from '../../../fixtures/content/site-labels.fr.json';
import esSeeds from '../../../fixtures/content/site-labels.es.json';

describe('site-labels transform', () => {
	it('regroups prefix-named columns into the nested SiteLabels shape', () => {
		const row = {
			id: 'u1',
			translations: [
				{ languages_code: 'en', ...seeds },
				{ languages_code: 'fr', a11y_carousel_prev: 'Projets précédents' },
			],
		};
		const out = toSiteLabels(row);
		expect(out.a11y.carouselPrev).toEqual({ en: 'Previous projects', fr: 'Projets précédents' });
		expect(out.a11y.projectImageOpen).toEqual({ en: 'Open {caption}' });
		expect(out.a11y.projectImageClose).toEqual({ en: 'Close image' });
		expect(out.a11y.architectureDiagram).toEqual({ en: 'Architecture diagram' });
		expect(out.a11y.technologyStackTemplate).toEqual({ en: 'Technology stack: {stack}' });
		expect(out.ui.markerService).toEqual({ en: seeds.ui_marker_service });
		expect(out.ui.terminalTitle).toEqual({ en: 'terminal' });
		expect(out.email.contactSubjectTemplate.en).toContain('{name}');
		expect(() => SiteLabelsSchema.parse(out)).not.toThrow();
	});

	it('recomposes translated CMS columns into the SiteLabels chrome groups', () => {
		const row = {
			id: 'u1',
			translations: [
				{ languages_code: 'en', ...seeds },
				{ languages_code: 'fr', ...frSeeds },
				{ languages_code: 'es', ...esSeeds },
			],
		};
		const out = toSiteLabels(row);
		// Project chrome with French values merged from the translated row.
		expect(out.projectsChrome.listing.filters.techStack).toEqual({ en: 'Tech Stack', fr: 'Stack technique' });
		expect(out.projectsChrome.detail.glance.liveSiteLabel).toEqual({
			en: seeds.projects_chrome_detail_glance_live_site_label,
			fr: frSeeds.projects_chrome_detail_glance_live_site_label,
		});
		// Blog, services, navigation, and footer chrome.
		expect(out.blogChrome.listing.mobileHeading).toEqual({ en: 'Blog', fr: 'Blogue' });
		expect(out.blogChrome.detail.code.title).toEqual({ en: 'code', fr: 'code' });
		expect(out.servicesChrome.detail.backToServicesLabel).toEqual({
			en: '← All Services',
			fr: '← Tous les services',
		});
		expect(out.navChrome.shared.openMenuAria).toEqual({ en: 'Open menu', fr: 'Ouvrir le menu' });
		expect(out.navChrome.shared.skipToContentLabel).toEqual({
			en: seeds.nav_chrome_shared_skip_to_content_label, fr: frSeeds.nav_chrome_shared_skip_to_content_label, es: esSeeds.nav_chrome_shared_skip_to_content_label,
		});
		expect(out.a11y.projectImageOpen).toEqual({
			en: 'Open {caption}',
			fr: 'Ouvrir {caption}',
		});
		expect(out.a11y.technologyStackTemplate).toEqual({
			en: 'Technology stack: {stack}',
			fr: 'Stack technique : {stack}',
		});
		expect(out.footerChrome.footer.tagline).toEqual({
			en: '// digital infrastructure',
			fr: '// infrastructure numérique',
		});
		// Live dashboard labels with runtime-templated supporting text.
		expect(out.heroDashboard.vehiclesLabel).toEqual({ en: 'VEHICLES TRACKED', fr: 'VÉHICULES SUIVIS' });
		expect(out.heroDashboard.delaySub).toEqual({ en: '{coverage}% COVERAGE', fr: '{coverage}% DE COUVERTURE' });
		expect(() => SiteLabelsSchema.parse(out)).not.toThrow();
	});
});
