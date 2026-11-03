import { describe, expect, it } from 'bun:test';
import fixture from '../../../../packages/shared/fixtures/export-data.json';
import {
	createFixtureSource,
	createLiveSource,
	directusSource,
	loadExport,
	readExport,
} from './export-pipeline';
import { EXPORT_MODULES } from './export-modules';
import { createClient } from './sdk';
import type { CmsSchema } from './fetchers/types';

const snapshot = () => ({
	...structuredClone(fixture.data),
	mediaAssets: {},
	mediaVariants: {},
});
const liveSnapshot = (data: ReturnType<typeof snapshot>) => {
	const source = createFixtureSource(data);
	return createLiveSource((module) => source.read(module));
};

describe('export review regressions', () => {
	for (const path of ['/services', '/projects', '/blog']) {
		it(`requires the ${path} listing row on both sources`, async () => {
			const data = snapshot();
			data.sitePages = data.sitePages.filter((page) => page.path !== path);
			await expect(loadExport(createFixtureSource(data))).rejects.toThrow(path);
			await expect(loadExport(liveSnapshot(data))).rejects.toThrow(path);
		});
		it(`rejects a non-listing ${path} row`, async () => {
			const data = snapshot();
			Reflect.set(
				data.sitePages.find((page) => page.path === path)!,
				'type',
				'system',
			);
			await expect(loadExport(liveSnapshot(data))).rejects.toThrow(
				`${path}" must be listing`,
			);
		});
	}

	it('rejects all missing French paths for fixtures but warns and accepts live content', async () => {
		const data = snapshot();
		Reflect.deleteProperty(data.projects[0]!.title, 'fr');
		Reflect.deleteProperty(data.services[0]!.title, 'fr');
		Reflect.deleteProperty(data.routeSeo[0]!.title!, 'fr');
		Reflect.deleteProperty(data.routeSeo[0]!.description!, 'fr');
		await expect(loadExport(createFixtureSource(data))).rejects.toThrow(
			`content.projects[slug=${data.projects[0]!.slug}].title.fr`,
		);
		const warnings: string[] = [];
		await expect(
			loadExport(liveSnapshot(data), {
				warn: (message) => warnings.push(message),
			}),
		).resolves.toEqual(expect.objectContaining(data));
		expect(warnings.join('\n')).toContain(
			`content.projects[slug=${data.projects[0]!.slug}].title.fr`,
		);
		expect(warnings.join('\n')).toContain(
			`content.services[id=${data.services[0]!.id}].title.fr`,
		);
		expect(warnings.join('\n')).toContain(
			`content.routeSeo[path=${data.routeSeo[0]!.path}].title.fr`,
		);
		expect(warnings.join('\n')).toContain(
			`content.routeSeo[path=${data.routeSeo[0]!.path}].description.fr`,
		);
	});

	it('names duplicate project and service identities and all actual station values', async () => {
		const projects = snapshot();
		projects.projects.push(structuredClone(projects.projects[0]!));
		await expect(loadExport(liveSnapshot(projects))).rejects.toThrow(
			`duplicate project slug: "${projects.projects[0]!.slug}"`,
		);
		const services = snapshot();
		services.services[1]!.id = services.services[0]!.id;
		await expect(loadExport(liveSnapshot(services))).rejects.toThrow(
			`duplicate service id: "${services.services[0]!.id}"`,
		);
		const stations = snapshot();
		stations.services[0]!.station = 99;
		await expect(loadExport(liveSnapshot(stations))).rejects.toThrow(
			`${stations.services[0]!.id}=99`,
		);
	});

	it('summarizes every schema issue with its entry path instead of dumping Zod JSON', async () => {
		const data = snapshot();
		Reflect.set(data.services[0]!, 'station', 'invalid');
		Reflect.set(data.services[0]!.title, 'en', 42);
		try {
			await loadExport(liveSnapshot(data));
			throw new Error('expected rejection');
		} catch (error) {
			expect((error as Error).message).toContain(
				`content.services[id=${data.services[0]!.id}].station: Invalid input`,
			);
			expect((error as Error).message).toContain(
				`content.services[id=${data.services[0]!.id}].title.en: Invalid input`,
			);
			expect((error as Error).message).not.toContain('"code":');
		}
	});

	it('rejects unknown snapshot and module keys before silently projecting them away', async () => {
		await expect(
			readExport(createFixtureSource({ ...snapshot(), unregistered: [] })),
		).rejects.toThrow('unregistered');
		await expect(
			readExport(
				createLiveSource(async () => ({ services: [], servcies: [] })),
				EXPORT_MODULES.filter((module) => module.name === 'services'),
			),
		).rejects.toThrow('servcies');
	});

	it('retains fixture floors without imposing a blog roster on live content', async () => {
		const featured = snapshot();
		featured.projects.forEach((project) => {
			project.featured = false;
		});
		await expect(loadExport(createFixtureSource(featured))).rejects.toThrow(
			'featured',
		);
		const blog = snapshot();
		blog.blogPosts = blog.blogPosts.slice(0, 2);
		await expect(loadExport(createFixtureSource(blog))).rejects.toThrow(
			'at least 3',
		);
		await expect(loadExport(liveSnapshot(blog))).resolves.toEqual(
			expect.objectContaining(blog),
		);
	});

	it('runs real Directus fetchers over stubbed HTTP through live validation', async () => {
		let dangling = false;
		const requests: { method: string; path: string }[] = [];
		const server = Bun.serve({
			port: 0,
			fetch(request) {
				const path = new URL(request.url).pathname;
				requests.push({ method: request.method, path });
				const rows: Record<string, unknown> = {
					'/items/projects': [
						{
							id: 'http-project',
							status: 'published',
							featured: true,
							sort: 1,
							tech_stack: [
								{ sort: 1, tech_stack_id: { id: 'bun', name: 'Bun' } },
							],
							translations: [
								{
									languages_code: 'en',
									title: 'HTTP project',
									one_liner: 'A project from the stubbed CMS',
									description: fixture.data.projects[0]!.description.en,
								},
							],
							services: [
								{
									id: 1,
									project_id: 'http-project',
									service_id: dangling
										? 'missing-http-service'
										: 'http-service',
								},
							],
							sections: [],
							impact_metrics: [],
						},
					],
					'/items/services': [
						{
							id: 'http-service',
							station: 1,
							svg: 'service-http.svg',
							translations: [
								{
									languages_code: 'en',
									title: 'HTTP service',
									description: 'An English-only service from the stubbed CMS',
								},
							],
						},
					],
					'/items/projects_services': [
						{ service_id: 'http-service', project_id: 'http-project' },
					],
					'/items/site_pages': fixture.data.sitePages.map((page, index) => ({
						id: String(index),
						status: 'published',
						sort: index,
						...page,
						translations: [{ languages_code: 'en', title: page.title.en }],
					})),
				};
				return path in rows
					? Response.json({ data: rows[path] })
					: new Response('Unexpected request', { status: 400 });
			},
		});
		try {
			const directus = directusSource({
				client: createClient<CmsSchema>(server.url.origin, ''),
				mediaAssets: () => ({}),
				mediaVariants: async () => ({}),
			});
			const fallback = createFixtureSource(snapshot());
			const source = createLiveSource((module) =>
				['projects', 'services', 'site-pages'].includes(module.name)
					? directus.read(module)
					: fallback.read(module),
			);
			const warnings: string[] = [];
			const data = await loadExport(source, {
				warn: (message) => warnings.push(message),
			});
			expect(data.projects[0]!.slug).toBe('http-project');
			expect(data.projects[0]!.relatedServices).toEqual(['http-service']);
			expect(data.services[0]!.relatedProjects).toEqual(['http-project']);
			expect(warnings.join('\n')).toContain(
				'content.services[id=http-service].title.fr',
			);
			expect(requests.every((request) => request.method === 'GET')).toBe(true);
			expect(new Set(requests.map((request) => request.path))).toEqual(
				new Set([
					'/items/projects',
					'/items/services',
					'/items/projects_services',
					'/items/site_pages',
				]),
			);
			dangling = true;
			await expect(loadExport(source)).rejects.toThrow('missing-http-service');
		} finally {
			server.stop(true);
		}
	});
});
