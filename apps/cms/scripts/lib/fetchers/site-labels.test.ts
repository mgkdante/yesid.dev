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
				{ languages_code: 'fr', a11y_toc: 'Table des matières' },
			],
		};
		const out = toSiteLabels(row);
		expect(out.a11y.toc).toEqual({ en: 'Table of contents', fr: 'Table des matières' });
		expect(out.a11y.projectImageOpen).toEqual({ en: 'Open {caption}' });
		expect(out.a11y.projectImageClose).toEqual({ en: 'Close image' });
		expect(out.a11y.moreMetrics).toEqual({ en: 'More metrics' });
		expect(out.a11y.architectureDiagram).toEqual({ en: 'Architecture diagram' });
		expect(out.a11y.technologyStackTemplate).toEqual({ en: 'Technology stack: {stack}' });
		expect(out.ui.markerFeatured).toEqual({ en: '{num} / FEATURED' });
		expect(out.ui.terminalTitle).toEqual({ en: 'terminal' });
		expect(out.email.contactSubjectTemplate.en).toContain('{name}');
		expect(() => SiteLabelsSchema.parse(out)).not.toThrow();
	});

	it('recomposes the slice-30 chrome columns into companion-shaped groups', () => {
		const row = {
			id: 'u1',
			translations: [
				{ languages_code: 'en', ...seeds },
				{ languages_code: 'fr', ...frSeeds },
				{ languages_code: 'es', ...esSeeds },
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
		expect(out.blogChrome.detail.code.title).toEqual({ en: 'code', fr: 'code' });
		expect(out.servicesChrome.detail.backToServicesLabel).toEqual({
			en: '← All Services',
			fr: '← Tous les services',
		});
		expect(out.navChrome.shared.openMenuAria).toEqual({ en: 'Open menu', fr: 'Ouvrir le menu' });
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
		// hero-data dashboard labelI18n/subI18n (subs are runtime-templated).
		expect(out.heroDashboard.vehiclesLabel).toEqual({ en: 'VEHICLES TRACKED', fr: 'VÉHICULES SUIVIS' });
		expect(out.heroDashboard.delaySub).toEqual({ en: '{coverage}% COVERAGE', fr: '{coverage}% DE COUVERTURE' });
		expect(out.ui.analyticsConsent).toEqual({
			title: {
				en: 'Can I count this visit?',
				fr: 'Je peux compter cette visite?',
				es: '¿Puedo contar esta visita?',
			},
			description: {
				en: 'Plausible, not Google Analytics, would count visits, pages, referrers, key clicks, and general device and region data. No cookies, names, emails, or form content.',
				fr: 'Plausible, et non Google Analytics, compterait les visites, les pages, les sources, les clics clés et des données générales sur l’appareil et la région. Aucun cookie, nom, courriel ni contenu de formulaire.',
				es: 'Plausible, no Google Analytics, contaría visitas, páginas, referencias, clics clave y datos generales del dispositivo y la región. Sin cookies, nombres, correos ni contenido de formularios.',
			},
			acceptLabel: { en: 'Allow analytics', fr: 'Autoriser l’analytique', es: 'Permitir analítica' },
			declineLabel: { en: 'No thanks', fr: 'Non merci', es: 'No, gracias' },
			settingsLabel: {
				en: 'Analytics preferences',
				fr: 'Préférences d’analytique',
				es: 'Preferencias de analítica',
			},
			privacyLabel: {
				en: 'Privacy details',
				fr: 'Détails sur la vie privée',
				es: 'Detalles de privacidad',
			},
		});
		expect(() => SiteLabelsSchema.parse(out)).not.toThrow();
	});
});
