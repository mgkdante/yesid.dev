import { describe, expect, it } from 'vitest';
import { catalog, createContentCatalog } from '#lib/catalog/index.ts';
import { projects } from '#lib/content/projects.ts';

describe('content listing projection', () => {
	it('keeps full case studies on detail reads and strips their bodies from every listing', async () => {
		const source = projects.find((project) => project.featured && project.relatedServices.length)!;
		const detail = await catalog.projects.bySlug(source.slug);
		expect(detail?.description).toEqual(source.description);
		expect(detail?.sections).toEqual(source.sections);
		for (const rows of [await catalog.projects.available(), await catalog.projects.featured(), await catalog.projects.byService(source.relatedServices[0]!)]) {
			const summary = rows.find((project) => project.slug === source.slug);
			expect(summary).toBeDefined();
			expect(summary).not.toHaveProperty('description');
			expect(summary).not.toHaveProperty('sections');
			expect(summary?.title).toEqual(source.title);
			expect(summary?.stack).toEqual(source.stack);
		}
		expect(source).toHaveProperty('description');
		expect(source).toHaveProperty('sections');
	});
	it('applies registry, status and locale to fixture listings through the catalog', () => {
		const rows = (['public', 'wip', 'private'] as const).map((status) => ({ ...projects[0]!, slug: status, status, featured: true }));
		const content = createContentCatalog({ projects: rows, locales: ['fr'] });
		expect(content.projects.available('en')).toEqual([]);
		expect(content.projects.available('fr').map((project) => project.slug)).toEqual(['public', 'wip']);
		expect(content.projects.featured('fr').map((project) => project.slug)).toEqual(['public', 'wip']);
		expect(createContentCatalog({ projects: rows, pages: [] }).projects.available()).toEqual([]);
	});
});
