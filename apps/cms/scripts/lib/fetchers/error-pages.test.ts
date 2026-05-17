import { describe, expect, it } from 'bun:test';
import { toErrorPageContent, type DirectusErrorPageRow } from './error-pages';
import { ErrorPageContentSchema } from '../schemas/nav';

const FIXTURE: DirectusErrorPageRow = {
	id: '1',
	status: 'published',
	status_code: 0,
	sort: 1,
	translations: [
		{
			languages_code: 'en',
			label: 'ROUTE NOT FOUND',
			heading: 'This station is under construction',
			description:
				"The route you requested doesn't exist or has been rerouted. Here are some active lines:",
			terminal_line: '$ route --status 404 // requested path not in service',
			suggestions: [
				{ label: 'Services', href: '/services' },
				{ label: 'Projects', href: '/projects' },
				{ label: 'Contact', href: '/contact' },
			],
		},
		{
			languages_code: 'fr',
			label: 'ROUTE INTROUVABLE',
			heading: 'Cette station est en construction',
			description:
				"La route demandée n'existe pas ou a été redirigée. Voici quelques lignes actives :",
			suggestions: [
				{ label: 'Services', href: '/services' },
				{ label: 'Projets', href: '/projects' },
				{ label: 'Contact', href: '/contact' },
			],
		},
		{
			languages_code: 'es',
			label: 'RUTA NO ENCONTRADA',
			heading: 'Esta estación está en construcción',
			description: 'La ruta solicitada no existe o ha sido redirigida. Aquí hay algunas líneas activas:',
			suggestions: [
				{ label: 'Servicios', href: '/services' },
				{ label: 'Proyectos', href: '/projects' },
				{ label: 'Contacto', href: '/contact' },
			],
		},
	],
};

describe('error-pages fetcher transform', () => {
	it('transforms a Directus error_pages row into ErrorPageContent', () => {
		const result = toErrorPageContent(FIXTURE);
		expect(result.label).toEqual({
			en: 'ROUTE NOT FOUND',
			fr: 'ROUTE INTROUVABLE',
			es: 'RUTA NO ENCONTRADA',
		});
		expect(result.heading.en).toBe('This station is under construction');
		expect(result.terminalLine).toBe('$ route --status 404 // requested path not in service');
		expect(result.suggestions).toHaveLength(3);
	});

	it('merges per-locale suggestion labels by index, takes href from en row', () => {
		const result = toErrorPageContent(FIXTURE);
		expect(result.suggestions[0]).toEqual({
			label: { en: 'Services', fr: 'Services', es: 'Servicios' },
			href: '/services',
		});
		expect(result.suggestions[1]).toEqual({
			label: { en: 'Projects', fr: 'Projets', es: 'Proyectos' },
			href: '/projects',
		});
	});

	it('output parses through ErrorPageContentSchema (Zod gate)', () => {
		const result = toErrorPageContent(FIXTURE);
		expect(() => ErrorPageContentSchema.parse(result)).not.toThrow();
	});

	it('handles missing fr/es suggestions (en-only fallback)', () => {
		const enOnly: DirectusErrorPageRow = {
			...FIXTURE,
			translations: [FIXTURE.translations![0]],
		};
		const result = toErrorPageContent(enOnly);
		expect(result.suggestions[0].label).toEqual({ en: 'Services' });
	});
});
