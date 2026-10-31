import { describe, expect, it } from 'bun:test';
import { basename } from 'node:path';
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
	siteLabels: {},
	blogPage: {},
	projectsPage: {},
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
	},
} as unknown as ExportData;

describe('export module registry', () => {
	it('requires one complete export data set instead of silently building a partial emit', () => {
		expect(() =>
			buildEmitConfigs({ hero: { heroAnim: {} } } as unknown as ExportData, '/tmp/out'),
		).toThrow('incomplete CMS export data');
	});

	it('owns exactly the ignored generated module set', () => {
		const registeredFiles = buildEmitConfigs(completeExportData, '/tmp/out')
			.map((config) => basename(config.filePath))
			.sort();

		expect(registeredFiles).toEqual([
			'about-page.ts', 'blog-bodies.ts', 'blog-page.ts', 'blog.ts', 'contact-page.ts',
			'error-pages.ts', 'legal-pages.ts', 'media-assets.ts', 'media-variants.ts', 'morph-shapes.ts',
			'nav.ts', 'projects-page.ts', 'projects.ts', 'route-seo.ts', 'services.ts', 'site-content.ts',
			'site-labels.ts', 'site-meta.ts', 'site-owner-phone.server.ts', 'site-pages.ts', 'site-seo-defaults.ts',
		].sort());
	});

	it('emits the owner phone only into the server-only module', () => {
		const owner = { name: 'Owner', phone: '+12025550100' };
		const configs = buildEmitConfigs({ ...completeExportData, siteMeta: { owner } } as unknown as ExportData, '/tmp/out');
		const exportsOf = (fileName: string) =>
			configs.find((entry) => basename(entry.filePath) === fileName)!.exports;

		expect(exportsOf('site-meta.ts')).toEqual([{ name: 'siteMeta', typeName: 'SiteMeta', value: { owner: { name: 'Owner' } } }]);
		expect(exportsOf('site-owner-phone.server.ts')).toEqual([{ name: 'ownerPhone', typeName: 'string | null', value: '+12025550100' }]);
		const otherModules = configs.filter((entry) => basename(entry.filePath) !== 'site-owner-phone.server.ts');
		expect(JSON.stringify(otherModules.map((entry) => entry.exports))).not.toContain('2025550100');
	});

	it('emits route-seo.ts as generated CMS route overrides', () => {
		const configs = buildEmitConfigs(completeExportData, '/tmp/out');

		const routeSeo = configs.find((config) => basename(config.filePath) === 'route-seo.ts');
		expect(routeSeo).toBeDefined();
		expect(routeSeo?.imports).toContainEqual({
			symbols: ['RouteSeoOverride'],
			from: '#lib/types.ts',
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

		const blog = configs.find((config) => basename(config.filePath) === 'blog.ts');
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

		const media = configs.find((config) => basename(config.filePath) === 'media-assets.ts');
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
			const config = configs.find((entry) => basename(entry.filePath) === fileName);
			expect(config).toBeDefined();
			expect(config?.description).not.toContain('companion');
		}
	});

	it('imports navigation interfaces from the code-owned navigation module', () => {
		const configs = buildEmitConfigs(completeExportData, '/tmp/out');

		const nav = configs.find((entry) => basename(entry.filePath) === 'nav.ts');
		const errors = configs.find((entry) => basename(entry.filePath) === 'error-pages.ts');
		expect(nav?.imports).toContainEqual({
			symbols: ['NavLink', 'MenuItem', 'ErrorPageContent'],
			from: '#lib/navigation/types.ts',
			typeOnly: true,
		});
		expect(errors?.imports).toContainEqual({
			symbols: ['ErrorPageContent'],
			from: '#lib/navigation/types.ts',
			typeOnly: true,
		});
	});
});
