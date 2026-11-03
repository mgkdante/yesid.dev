import { describe, expect, it } from 'bun:test';
import fixture from '../../../../packages/shared/fixtures/export-data.json';
import {
	createFixtureSource,
	createLiveSource,
	loadExport,
} from './export-pipeline';
import { run } from '../export-fallbacks';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';

const liveSnapshot = (snapshot: unknown) => {
	const fixtureSource = createFixtureSource(snapshot);
	return createLiveSource((module) => fixtureSource.read(module));
};

describe('export source checks', () => {
	it('accepts the fixture through the same pipeline as a fake live source', async () => {
		const snapshot = {
			...structuredClone(fixture.data),
			mediaAssets: {},
			mediaVariants: {},
		};
		const fromFixture = await loadExport(createFixtureSource(snapshot));
		const requests: string[] = [];
		const fromLive = await loadExport(
			createLiveSource(async (module) => {
				requests.push(module.name);
				return createFixtureSource(snapshot).read(module);
			}),
		);
		expect(fromLive).toEqual(fromFixture);
		expect(new Set(requests).size).toBe(requests.length);
	});

	for (const kind of ['fixture', 'live'] as const) {
		for (const [label, mutate, message] of [
			[
				'project service reference',
				(data: typeof fixture.data) => {
					data.projects[0]!.relatedServices = ['missing-service'];
				},
				'missing-service',
			],
			[
				'service project reference',
				(data: typeof fixture.data) => {
					data.services[0]!.relatedProjects = ['missing-project'];
				},
				'missing-project',
			],
			[
				'station gap',
				(data: typeof fixture.data) => {
					data.services[0]!.station = 99;
				},
				'station',
			],
			[
				'duplicate slug',
				(data: typeof fixture.data) => {
					data.projects.push(structuredClone(data.projects[0]!));
				},
				'slug',
			],
			[
				'invalid schema',
				(data: typeof fixture.data) => {
					Reflect.set(data.services[0]!, 'station', 'invalid');
				},
				'services',
			],

			[
				'duplicate station',
				(data: typeof fixture.data) => {
					data.services[0]!.station = data.services[1]!.station;
				},
				'station',
			],
			[
				'missing registry root',
				(data: typeof fixture.data) => {
					data.sitePages = data.sitePages.filter((page) => page.path !== '/');
				},
				'root',
			],
			[
				'duplicate registry path',
				(data: typeof fixture.data) => {
					data.sitePages.push(structuredClone(data.sitePages[0]!));
				},
				'path',
			],
			[
				'missing contact link',
				(data: typeof fixture.data) => {
					data.siteMeta.links.email = ' ';
				},
				'email',
			],
			[
				'incomplete snapshot',
				(data: typeof fixture.data) => {
					Reflect.deleteProperty(data, 'projects');
				},
				'projects',
			],
		] as const) {
			it(`rejects ${label} from ${kind} before emission`, async () => {
				const snapshot = {
					...structuredClone(fixture.data),
					mediaAssets: {},
					mediaVariants: {},
				};
				mutate(snapshot);
				const source =
					kind === 'fixture'
						? createFixtureSource(snapshot)
						: liveSnapshot(snapshot);
				await expect(loadExport(source)).rejects.toThrow(message);
			});
		}
	}

	it('does not fall back when a live fetcher raises a schema error', async () => {
		const emitDir = await mkdtemp(join(tmpdir(), 'deepen-export-schema-'));
		try {
			await writeFile(
				join(emitDir, '.cms-cache.json'),
				JSON.stringify(fixture),
			);
			await expect(
				run({
					source: 'live',
					contentSource: createLiveSource(async () =>
						z.never().parse('invalid CMS row'),
					),
					directusUrl: 'https://fake.invalid',
					token: '',
					dryRun: false,
					emitDir,
					policy: 'soft',
				}),
			).rejects.toThrow('Invalid export module');
			expect(await readdir(emitDir)).toEqual(['.cms-cache.json']);
			expect(await readFile(join(emitDir, '.cms-cache.json'), 'utf8')).toBe(
				JSON.stringify(fixture),
			);
		} finally {
			await rm(emitDir, { recursive: true, force: true });
		}
	});

	it('retains the fixture-specific home proof and multilingual coverage', () => {
		expect(
			fixture.data.projects.find(
				(project) => project.slug === 'transit-data-pipeline',
			)?.featured,
		).toBe(true);
		expect(fixture.data.blogPosts.length).toBeGreaterThanOrEqual(3);
		expect(
			fixture.data.projects.some(
				(project) => project.title.en && project.title.fr && project.title.es,
			),
		).toBe(true);
	});

	for (const policy of ['soft', 'fail'] as const) {
		it(`fails an invalid fake live export under ${policy} policy without replacing output or cache`, async () => {
			const emitDir = await mkdtemp(join(tmpdir(), 'deepen-export-invalid-'));
			const snapshot = {
				...structuredClone(fixture.data),
				mediaAssets: {},
				mediaVariants: {},
			};
			snapshot.projects[0]!.relatedServices = ['missing-live-service'];
			try {
				await writeFile(join(emitDir, 'projects.ts'), 'last-good module');
				await writeFile(
					join(emitDir, '.cms-cache.json'),
					JSON.stringify(fixture),
				);
				await expect(
					run({
						source: 'live',
						contentSource: liveSnapshot(snapshot),
						directusUrl: 'https://fake.invalid',
						token: '',
						dryRun: false,
						emitDir,
						policy,
					}),
				).rejects.toThrow('missing-live-service');
				expect(await readFile(join(emitDir, 'projects.ts'), 'utf8')).toBe(
					'last-good module',
				);
				expect(await readFile(join(emitDir, '.cms-cache.json'), 'utf8')).toBe(
					JSON.stringify(fixture),
				);
				expect((await readdir(emitDir)).sort()).toEqual([
					'.cms-cache.json',
					'projects.ts',
				]);
			} finally {
				await rm(emitDir, { recursive: true, force: true });
			}
		});
	}

	it('emits a valid fake live snapshot and persists only the validated cache', async () => {
		const emitDir = await mkdtemp(join(tmpdir(), 'deepen-export-valid-'));
		const snapshot = {
			...structuredClone(fixture.data),
			mediaAssets: {},
			mediaVariants: {},
		};
		// English-only live copy must still build under the production fail policy.
		snapshot.blogPosts = snapshot.blogPosts.filter(
			(post) => post.lang === 'en',
		);
		Reflect.deleteProperty(snapshot.routeSeo[0]!.description!, 'fr');
		try {
			expect(
				await run({
					source: 'live',
					contentSource: liveSnapshot(snapshot),
					directusUrl: 'https://fake.invalid',
					token: '',
					dryRun: false,
					emitDir,
					policy: 'fail',
				}),
			).toEqual({ source: 'live', emitted: 21 });
			expect(
				JSON.parse(await readFile(join(emitDir, '.cms-cache.json'), 'utf8'))
					.data,
			).toEqual(snapshot);
			expect(
				(await readdir(emitDir)).filter((file) => file.endsWith('.ts')),
			).toHaveLength(21);
		} finally {
			await rm(emitDir, { recursive: true, force: true });
		}
	});
});
