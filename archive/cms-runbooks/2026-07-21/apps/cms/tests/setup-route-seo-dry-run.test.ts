import { describe, expect, it } from 'bun:test';
import { buildRouteSeoPlan, parseFlags } from '../scripts/setup-route-seo-schema';

describe('setup-route-seo-schema plan', () => {
	const plan = buildRouteSeoPlan();

	it('creates route_seo and route_seo_translations collections', () => {
		const collections = plan.filter((step) => step.kind === 'collection').map((step) => step.target);
		expect(collections).toEqual(['route_seo', 'route_seo_translations']);

		const translationsField = plan.find((step) => step.target === 'route_seo.translations');
		expect(translationsField?.kind).toBe('field');
		expect((translationsField?.payload as { type: string }).type).toBe('alias');
	});

	it('adds the editorial SEO fields and file relation', () => {
		const parentTargets = plan.map((step) => step.target);
		expect(parentTargets).toContain('route_seo.path');
		expect(parentTargets).toContain('route_seo.og_image');
		expect(parentTargets).toContain('route_seo_translations.title');
		expect(parentTargets).toContain('route_seo_translations.description');

		const fileRelation = plan.find((step) => step.target === 'route_seo.og_image -> directus_files');
		expect(fileRelation?.kind).toBe('relation');
		expect((fileRelation?.payload as { related_collection: string }).related_collection).toBe('directus_files');
	});

	it('wires translations to route_seo and languages', () => {
		const parentRelation = plan.find(
			(step) => step.kind === 'relation' && step.target === 'route_seo_translations.route_seo_id',
		);
		expect(parentRelation?.kind).toBe('relation');
		expect((parentRelation?.payload as { related_collection: string }).related_collection).toBe('route_seo');

		const languageRelation = plan.find(
			(step) => step.kind === 'relation' && step.target === 'route_seo_translations.languages_code',
		);
		expect(languageRelation?.kind).toBe('relation');
		expect((languageRelation?.payload as { related_collection: string }).related_collection).toBe('languages');
	});

	it('grants read to build bot and editor CRUD to humans', () => {
		const permissionTargets = plan.filter((step) => step.kind === 'permission').map((step) => step.target);

		expect(permissionTargets).toContain('route_seo:read(build-bot)');
		expect(permissionTargets).toContain('route_seo_translations:read(build-bot)');
		expect(permissionTargets).toContain('route_seo:create(human-editor)');
		expect(permissionTargets).toContain('route_seo_translations:delete(human-editor)');
	});

	it('parseFlags defaults to dry-run', () => {
		expect(parseFlags([])).toEqual({ apply: false });
		expect(parseFlags(['--apply'])).toEqual({ apply: true });
	});
});
