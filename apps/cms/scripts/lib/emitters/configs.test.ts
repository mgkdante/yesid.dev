import { describe, expect, it } from 'bun:test';
import { basename } from 'node:path';
import generatedManifest from '../../../../web/src/lib/content/generated.manifest.json' with { type: 'json' };
import type { ExportData } from '../../export-data';
import { buildEmitConfigs } from './configs';

const completeExportData = {
	siteMeta: {},
	siteSeoDefaults: {},
	routeSeo: [],
	morphShapes: [],
	errorPageFallback: {},
	errorPages: {},
	sitePages: [],
	blogPosts: [],
	blogBodies: {},
	services: [],
	projects: [],
	techStack: [],
	stackArchetypes: [],
	siteLabels: {},
	blogPage: {},
	projectsPage: {},
	techStackPage: {},
	contactPage: {},
	legalPages: [],
	hero: { heroAnim: {} },
	manifesto: {},
	proofReel: {},
	servicesGrid: {},
	aboutIntro: {},
	cta: {},
	closer: {},
	aboutPage: {},
	mediaAssets: {},
	mediaVariants: {},
	nav: {
		navLinks: [],
		menuItems: [],
		footerLinks: [],
		mobileLinks: [],
	},
} as unknown as ExportData;

describe('export module registry', () => {
	it('requires one complete export data set instead of silently building a partial emit', () => {
		expect(() =>
			buildEmitConfigs({ hero: { heroAnim: {} } } as unknown as ExportData, '/tmp/out'),
		).toThrow('incomplete CMS export data');
	});

	it('owns exactly the generated module set protected by the hash manifest', () => {
		const registeredFiles = buildEmitConfigs(completeExportData, '/tmp/out')
			.map((config) => basename(config.filePath))
			.sort();

		expect(registeredFiles).toEqual(Object.keys(generatedManifest.files).sort());
	});

	it('emits route-seo.ts as generated CMS route overrides', () => {
		const configs = buildEmitConfigs(completeExportData, '/tmp/out');

		const routeSeo = configs.find((config) => config.filePath.endsWith('/route-seo.ts'));
		expect(routeSeo).toBeDefined();
		expect(routeSeo?.imports).toContainEqual({
			symbols: ['RouteSeoOverride'],
			from: '$lib/types',
			typeOnly: true,
		});
		expect(routeSeo?.exports).toContainEqual({
			name: 'routeSeoOverrides',
			typeName: 'readonly RouteSeoOverride[]',
			value: [],
		});
	});

	it('emits blog.ts as generated cache only', () => {
		const configs = buildEmitConfigs(completeExportData, '/tmp/out');

		const blog = configs.find((config) => config.filePath.endsWith('/blog.ts'));
		expect(blog).toBeDefined();
		expect(blog?.description).not.toContain('companion');
	});

	it('emits media-assets.ts as the generated Directus UUID to static path mirror', () => {
		const configs = buildEmitConfigs(
			{
				...completeExportData,
				mediaAssets: {
					'6048a712-de42-4cca-ab51-6f92d64685c2': '/images/work/yesid-dev-home.png',
				},
			},
			'/tmp/out',
		);

		const media = configs.find((config) => config.filePath.endsWith('/media-assets.ts'));
		expect(media).toBeDefined();
		expect(media?.exports).toContainEqual({
			name: 'mirroredMediaAssets',
			typeName: 'Readonly<Record<string, string>>',
			value: {
				'6048a712-de42-4cca-ab51-6f92d64685c2': '/images/work/yesid-dev-home.png',
			},
		});
	});

	it('does not describe retired content companions from generated modules', () => {
		const configs = buildEmitConfigs(completeExportData, '/tmp/out');

		for (const fileName of ['contact-page.ts', 'site-content.ts', 'services.ts', 'projects.ts', 'nav.ts']) {
			const config = configs.find((entry) => entry.filePath.endsWith(`/${fileName}`));
			expect(config).toBeDefined();
			expect(config?.description).not.toContain('companion');
		}
	});

	it('imports navigation interfaces from the code-owned navigation module', () => {
		const configs = buildEmitConfigs(completeExportData, '/tmp/out');

		const nav = configs.find((entry) => entry.filePath.endsWith('/nav.ts'));
		const errors = configs.find((entry) => entry.filePath.endsWith('/error-pages.ts'));
		expect(nav?.imports).toContainEqual({
			symbols: ['NavLink', 'MenuItem', 'ErrorPageContent'],
			from: '$lib/navigation/types',
			typeOnly: true,
		});
		expect(errors?.imports).toContainEqual({
			symbols: ['ErrorPageContent'],
			from: '$lib/navigation/types',
			typeOnly: true,
		});
	});
});
