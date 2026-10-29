import { describe, expect, it } from 'bun:test';
import type { ExportData } from '../../export-data';
import { legalTruth, demoFeedDisclosures, validateDemoFeedDisclosure, validateLiveExport, validateSeoDescriptions } from './live-export';

const locales = ['en', 'fr', 'es'] as const;

function syntheticContent(): ExportData {
	const description = { en: 'A complete synthetic SEO description for testing the route metadata contract.' };
	return {
		siteLabels: { heroDashboard: { vehiclesSub: { ...demoFeedDisclosures } } },
		siteSeoDefaults: { defaultDescription: description },
		routeSeo: [{ path: '/', description }, { path: '/fallback', description: null }],
		services: [{ id: 'test', seoDescription: description }],
		blogPosts: [{ slug: 'test', seoDescription: description.en }],
		legalPages: ['privacy', 'terms', 'cookies', 'accessibility', 'notice'].map(slug => ({
			slug, title: { en: 'Legal' },
			body: Object.fromEntries(locales.map(locale => [locale, {
				time: 1, version: '2.31.2', blocks: [
					'Contact: contact@yesid.dev',
					slug === 'privacy' ? legalTruth.privacyProfile[locale] : legalTruth.cookieProfile[locale],
				].map((text, index) => ({ id: String(index), type: 'paragraph', data: { text } })),
			}])),
		})),
	} as unknown as ExportData;
}

describe('live content validation', () => {
	it('accepts a synthetic export satisfying every rule', () => {
		expect(() => validateLiveExport(syntheticContent())).not.toThrow();
	});

	for (const locale of locales) {
		for (const slug of ['privacy', 'cookies']) {
			it(`${locale} ${slug} rejects missing profile truth`, () => {
				const original = syntheticContent();
				const blocks = original.legalPages!.find(page => page.slug === slug)!.body[locale]!.blocks;
				for (let index = 1; index < blocks.length; index++) {
					const data = syntheticContent();
					data.legalPages!.find(page => page.slug === slug)!.body[locale]!.blocks.splice(index, 1);
					expect(() => validateLiveExport(data)).toThrow('Live content validation failed');
				}
			});

			it(`${locale} ${slug} rejects every processing overclaim`, () => {
				for (const text of legalTruth.forbidden[locale]) {
					const data = syntheticContent();
					data.legalPages!.find(page => page.slug === slug)!.body[locale]!.blocks.push({
						id: 'overclaim', type: 'paragraph', data: { text },
					});
					expect(() => validateLiveExport(data)).toThrow('processing overclaim');
				}
			});
		}

		it(`${locale} checks contact and private location on every legal page`, () => {
			for (let index = 0; index < 5; index++) {
				for (const text of ['Contact removed', 'admin@yesid.dev contact@yesid.dev', 'Umami contact@yesid.dev', 'Gatineau contact@yesid.dev', 'K1A 0B1 contact@yesid.dev']) {
					const data = syntheticContent();
					data.legalPages![index]!.body[locale]!.blocks[0]!.data = { text };
					expect(() => validateLiveExport(data)).toThrow();
				}
			}
		});
	}

	it('rejects missing legal pages and registry rows', () => {
		const data = syntheticContent();
		delete data.legalPages;
		expect(() => validateLiveExport(data)).toThrow('missing legal pages');
		data.legalPages = syntheticContent().legalPages!.slice(1);
		expect(() => validateLiveExport(data)).toThrow('registry');
	});

	it('enforces the PageSeoSchema description bounds for every explicit SEO field', () => {
		const change = [
			(data: ExportData, value: string) => { data.siteSeoDefaults!.defaultDescription.en = value; },
			(data: ExportData, value: string) => { data.routeSeo![0]!.description = { en: value }; },
			(data: ExportData, value: string) => { data.services![0]!.seoDescription = { en: value }; },
			(data: ExportData, value: string) => { data.blogPosts![0]!.seoDescription = value; },
		];
		for (const mutate of change) {
			for (const value of ['', 'too short', 'too long '.repeat(100)]) {
				const data = syntheticContent();
				mutate(data, value);
				expect(() => validateSeoDescriptions(data)).toThrow('SEO description');
			}
		}
		for (const locale of ['fr', 'es'] as const) {
			const data = syntheticContent();
			data.siteSeoDefaults!.defaultDescription[locale] = 'short';
			expect(() => validateSeoDescriptions(data)).toThrow('SEO description');
		}
	});
});

it('requires the approved EN/FR demo-feed disclosures', () => {
	for (const locale of ['en', 'fr'] as const) {
		const data = syntheticContent();
		data.siteLabels!.heroDashboard.vehiclesSub[locale] = 'Live STM feed';
		expect(() => validateDemoFeedDisclosure(data)).toThrow('demo-feed disclosure');
	}
});
