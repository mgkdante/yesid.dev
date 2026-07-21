import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SiteMeta, SiteSeoDefaults } from '$lib/types';
import { errorSeoFallback } from './error-seo-fallback';

const WEB_ROOT = process.cwd();
const readSource = (path: string) => readFileSync(resolve(WEB_ROOT, path), 'utf8');

const siteMeta = {
	name: 'yesid.',
	tagline: { en: 'Digital systems that do their job.' },
	description: { en: 'Independent digital practice.' },
	links: {
		email: 'contact@yesid.dev',
		github: 'https://github.com/mgkdante',
	},
	owner: {
		name: 'Yesid Otalora',
		jobTitle: { en: 'Freelance Digital Solutions Developer' },
		knowsAbout: ['PostgreSQL', 'SvelteKit'],
		address: {
			locality: 'Montreal',
			region: 'QC',
			country: 'CA',
		},
	},
} satisfies SiteMeta;

const siteSeoDefaults = {
	defaultOgImage: null,
	themeColor: '#141414',
	defaultDescription: { en: 'Fallback description.' },
} satisfies SiteSeoDefaults;

describe('errorSeoFallback boundary', () => {
	it.each([
		['src/routes/+layout.ts', '$lib/adapters/error-seo-fallback'],
		['src/routes/+layout.server.ts', '$lib/adapters/error-seo-fallback'],
		['src/lib/adapters/static.ts', './error-seo-fallback'],
	])('%s imports the focused fallback module directly', (path, moduleSpecifier) => {
		const source = readSource(path);

		expect(source).toContain(`import { errorSeoFallback } from '${moduleSpecifier}';`);
		expect(source).not.toMatch(
			/import\s*\{[^}]*errorSeoFallback[^}]*\}\s*from\s*['"](?:\$lib\/adapters\/route-seo-factories|\.\/route-seo-factories)['"]/su
		);
	});

	it('keeps the focused module dependency-light', () => {
		const focusedModule = resolve(WEB_ROOT, 'src/lib/adapters/error-seo-fallback.ts');

		expect(existsSync(focusedModule), 'focused fallback module must exist').toBe(true);
		if (!existsSync(focusedModule)) return;

		const source = readFileSync(focusedModule, 'utf8');
		const moduleSpecifiers = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(
			([, moduleSpecifier]) => moduleSpecifier
		);

		expect(moduleSpecifiers).toEqual(['$lib/types', '$lib/utils/seo-defaults']);
		expect(source).not.toContain('route-seo-factories');
	});

	it('does not leave a fallback implementation or re-export in the route factory', () => {
		expect(readSource('src/lib/adapters/route-seo-factories.ts')).not.toContain('errorSeoFallback');
	});

	it('preserves the representative error SEO contract', () => {
		expect(errorSeoFallback({ locale: 'fr', siteMeta, siteSeoDefaults })).toEqual({
			title: { en: 'Not Found | yesid.' },
			description: { en: 'Fallback description.' },
			canonical: 'https://yesid.dev',
			ogType: 'website',
			noIndex: true,
		});
	});
});
