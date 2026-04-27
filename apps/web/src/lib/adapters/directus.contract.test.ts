// Directus adapter — contract tests (consumer side of the slice-18 D12
// boundary).
//
// Scope:
//   1. Structural: every port + method required by `ContentAdapter` is present
//      on `directusAdapter` (compile-time via `ContentAdapter` annotation,
//      runtime via key enumeration).
//   2. Pure mapping: `toService(row)` translates a synthetic Directus row into
//      a valid `Service` domain object WITHOUT any network call.
//
// This test is the consumer-side half of the cross-repo contract. The CMS
// repo ships a mirror `snapshot-shape` test that asserts the snapshot YAML
// has the fields this mapping reads. Together they prevent adapter-seam drift.
//
// 18c Task 44 (F6): setup.data.ts mocks `$lib/adapters/directus` to route
// repository tests through staticAdapter. This test is the subject-under-test
// for directus.ts, so we `vi.unmock` at the top — the mocked module is only
// relevant for composite-adapter consumers, never for directus.ts's own tests.
// That sheds the `vi.importActual` scaffolding the prior iteration needed.

import { describe, expect, it, vi } from 'vitest';

// Hoisted by Vitest above all `import` statements below.
vi.unmock('$lib/adapters/directus');

import type { ContentAdapter } from './types';
import {
	directusAdapter,
	type DirectusProject,
	type DirectusBlogPostRow,
	type DirectusService,
	toBlogPost,
	toLocalizedString,
	toProject,
	toService,
	toTechStackItem,
	resolveSvgFallbackName,
	resolveAnimationDeterministic,
} from './directus';

describe('directusAdapter — structural contract', () => {
	it('exposes every required ContentAdapter port', () => {
		const required = [
			'projects',
			'services',
			'blog',
			'meta',
			'techStack',
			'content',
		] as const;
		for (const port of required) {
			expect(directusAdapter).toHaveProperty(port);
		}
	});

	it('services port exposes every required method', () => {
		const required = ['all', 'byId', 'visible', 'adjacent'] as const;
		for (const method of required) {
			expect(typeof directusAdapter.services[method]).toBe('function');
		}
	});

	it('conforms to ContentAdapter (compile-time gate)', () => {
		const adapter: ContentAdapter = directusAdapter;
		expect(adapter).toBeDefined();
	});

	it('un-implemented ports throw a clear TODO error (not silently return empty)', async () => {
		// Tasks 10–14 progressively replace these throws with real impls.
		// 18f Phase 9: blog + morphShapes ports are live.
		// 18g Phase 4: techStack port is now live (all/byId/content).
		// 18h Phase 4 Task 10: meta.site + meta.siteSeoDefaults + meta.routeSeo
		//   are now live. meta.forRoute lands in Task 11 (composer).
		// Only meta.forRoute + content (non-metroSvg/morphShapes) remain as TODO stubs.
		await expect(directusAdapter.meta.forRoute('/', 'en')).rejects.toThrow(/not implemented/);
		await expect(directusAdapter.content.hero()).rejects.toThrow(/not implemented/);
	});

	it('techStack port exposes the 3 required methods', () => {
		const required = ['all', 'byId', 'content'] as const;
		for (const method of required) {
			expect(typeof directusAdapter.techStack[method]).toBe('function');
		}
	});
});

describe('toService — pure row-to-domain mapping', () => {
	it('maps a minimal row (id + station + en-only translations) to a valid Service', () => {
		const row: DirectusService = {
			id: 'sql-development',
			station: 1,
			translations: [
				{
					languages_code: 'en',
					title: 'SQL Development',
					description: 'Write, refactor, and tune SQL queries.',
				},
			],
		};
		const service = toService(row);
		expect(service.id).toBe('sql-development');
		expect(service.station).toBe(1);
		expect(service.title).toEqual({ en: 'SQL Development' });
		expect(service.description).toEqual({ en: 'Write, refactor, and tune SQL queries.' });
		// relatedProjects is always [] from toService — populated later via M2M junction
		// by fetchServices. The legacy CSV field has been dropped from DirectusService.
		expect(service.relatedProjects).toEqual([]);
	});

	it('preserves optional scalar fields (svg, visible, stack)', () => {
		const row: DirectusService = {
			id: 'x',
			station: 1,
			svg: 'service-sql.svg',
			visible: false,
			stack: ['PostgreSQL', 'T-SQL'],
			translations: [{ languages_code: 'en', title: 'X', description: 'desc' }],
		};
		const service = toService(row);
		expect(service.svg).toBe('service-sql.svg');
		expect(service.visible).toBe(false);
		expect(service.stack).toEqual(['PostgreSQL', 'T-SQL']);
	});

	it('composes multi-locale LocalizedStrings from the translations array', () => {
		const row: DirectusService = {
			id: 'x',
			station: 1,
			translations: [
				{ languages_code: 'en', title: 'Hello' },
				{ languages_code: 'fr', title: 'Bonjour' },
				{ languages_code: 'es', title: 'Hola' },
			],
		};
		const service = toService(row);
		expect(service.title).toEqual({ en: 'Hello', fr: 'Bonjour', es: 'Hola' });
	});

	it('assembles impactMetric only when both value + label are present', () => {
		const withBoth: DirectusService = {
			id: 'x',
			station: 1,
			translations: [
				{
					languages_code: 'en',
					title: 'X',
					description: 'd',
					impact_metric_value: '3x faster',
					impact_metric_label: 'avg query',
				},
			],
		};
		expect(toService(withBoth).impactMetric).toEqual({
			value: { en: '3x faster' },
			label: { en: 'avg query' },
		});

		const onlyValue: DirectusService = {
			id: 'x',
			station: 1,
			translations: [
				{
					languages_code: 'en',
					title: 'X',
					description: 'd',
					impact_metric_value: '3x faster',
				},
			],
		};
		expect(toService(onlyValue).impactMetric).toBeUndefined();
	});

	it('sorts deliverables by `sort` column then maps per-row translations', () => {
		const row: DirectusService = {
			id: 'x',
			station: 1,
			translations: [{ languages_code: 'en', title: 'X', description: 'd' }],
			deliverables: [
				{
					id: 2,
					sort: 1,
					translations: [{ languages_code: 'en', label: 'Second' }],
				},
				{
					id: 1,
					sort: 0,
					translations: [{ languages_code: 'en', label: 'First' }],
				},
			],
		};
		const service = toService(row);
		expect(service.deliverables).toEqual([
			{ en: 'First' },
			{ en: 'Second' },
		]);
	});

	it('sorts sections by `sort` and hydrates title + content LocalizedStrings', () => {
		const row: DirectusService = {
			id: 'x',
			station: 1,
			translations: [{ languages_code: 'en', title: 'X', description: 'd' }],
			sections: [
				{
					id: 1,
					sort: 0,
					translations: [
						{ languages_code: 'en', title: 'My Approach', content: 'Step 1' },
					],
				},
			],
		};
		const service = toService(row);
		expect(service.sections).toEqual([
			{ title: { en: 'My Approach' }, content: { en: 'Step 1' } },
		]);
	});

	it('always emits an empty relatedProjects array (junction populates later)', () => {
		const row: DirectusService = {
			id: 'x',
			station: 1,
			translations: [{ languages_code: 'en', title: 'X', description: 'd' }],
		};
		expect(toService(row).relatedProjects).toEqual([]);
	});
});

describe('toLocalizedString — exposed helper', () => {
	// Complementary to directus.test.ts's coverage — documents that this export
	// is part of the adapter's public surface (reused by future port impls).
	it('falls back to en when the requested locale is missing', () => {
		const result = toLocalizedString(
			[{ languages_code: 'en', title: 'Hello' }],
			'title',
		);
		expect(result).toEqual({ en: 'Hello' });
	});

	it('returns { en: "" } when no translations at all', () => {
		expect(toLocalizedString([], 'title')).toEqual({ en: '' });
		expect(toLocalizedString(null, 'title')).toEqual({ en: '' });
		expect(toLocalizedString(undefined, 'title')).toEqual({ en: '' });
	});
});

describe('directus adapter — toProject', () => {
	const baseRow: DirectusProject = {
		id: 'yesid-dev',
		status: 'published',
		date_published: null,
		sort: 0,
		featured: true,
		hero_image: '66f6ddc8-c3f2-4bd7-97a5-978940757b77',
		repo_url: 'https://github.com/mgkdante/yesid.dev',
		live_url: 'https://yesid.dev',
		readme_url: null,
		location: null,
		environment: null,
		version: null,
		stack: ['SvelteKit', 'Svelte 5'],
		tags: ['portfolio'],
		translations: [
			{
				languages_code: 'en',
				title: 'yesid.dev — Portfolio',
				one_liner: 'Personal site',
				description: {
					time: 1700000000000,
					version: '2.31.2',
					blocks: [{ id: 'b1', type: 'paragraph' as const, data: { text: 'A personal brand site.' } }],
				},
			},
		],
		sections: [],
		impact_metrics: [],
		services: [],
	};

	it('maps id → slug', () => {
		const p = toProject(baseRow);
		expect(p.slug).toBe('yesid-dev');
	});

	it('maps status published → public', () => {
		const p = toProject(baseRow);
		expect(p.status).toBe('public');
	});

	it('maps status draft → wip', () => {
		const p = toProject({ ...baseRow, status: 'draft' });
		expect(p.status).toBe('wip');
	});

	it('maps status archived → private', () => {
		const p = toProject({ ...baseRow, status: 'archived' });
		expect(p.status).toBe('private');
	});

	it('flattens translations to LocalizedString / LocalizedBlockEditorDoc', () => {
		const p = toProject(baseRow);
		expect(p.title).toEqual({ en: 'yesid.dev — Portfolio' });
		expect(p.oneLiner).toEqual({ en: 'Personal site' });
		// description is now LocalizedBlockEditorDoc — check block shape
		expect(p.description.en.blocks[0].type).toBe('paragraph');
		expect((p.description.en.blocks[0].data as { text: string }).text).toBe('A personal brand site.');
	});

	it('returns hero_image UUID as image field', () => {
		const p = toProject(baseRow);
		expect(p.image).toBe('66f6ddc8-c3f2-4bd7-97a5-978940757b77');
	});

	it('returns image undefined when hero_image is null', () => {
		const p = toProject({ ...baseRow, hero_image: null });
		expect(p.image).toBeUndefined();
	});

	it('preserves stack + tags arrays', () => {
		const p = toProject(baseRow);
		expect(p.stack).toEqual(['SvelteKit', 'Svelte 5']);
		expect(p.tags).toEqual(['portfolio']);
	});

	it('preserves repoUrl/liveUrl when set', () => {
		const p = toProject(baseRow);
		expect(p.repoUrl).toBe('https://github.com/mgkdante/yesid.dev');
		expect(p.liveUrl).toBe('https://yesid.dev');
	});

	it('flattens sections sorted by sort + with translation flattening', () => {
		const sectionContent = (text: string) => ({
			time: 1700000000000,
			version: '2.31.2',
			blocks: [{ id: 'b1', type: 'paragraph' as const, data: { text } }],
		});
		const withSections: DirectusProject = {
			...baseRow,
			sections: [
				{
					id: 1,
					sort: 1,
					translations: [{ languages_code: 'en', title: 'Second', content: sectionContent('Two') }],
				},
				{
					id: 2,
					sort: 0,
					translations: [{ languages_code: 'en', title: 'First', content: sectionContent('One') }],
				},
			],
		};
		const p = toProject(withSections);
		expect(p.sections.length).toBe(2);
		expect(p.sections[0].title).toEqual({ en: 'First' });
		expect(p.sections[1].title).toEqual({ en: 'Second' });
		// content is now LocalizedBlockEditorDoc — verify block shape
		expect(p.sections[0].content.en.blocks[0].type).toBe('paragraph');
		expect(p.sections[1].content.en.blocks[0].type).toBe('paragraph');
	});

	it('flattens impact_metrics; impactMetric === impactMetrics[0]', () => {
		const withMetrics: DirectusProject = {
			...baseRow,
			impact_metrics: [
				{
					id: 1,
					sort: 0,
					value: '30s',
					before: null,
					translations: [{ languages_code: 'en', label: 'Real-time refresh' }],
				},
				{
					id: 2,
					sort: 1,
					value: '99.9%',
					before: null,
					translations: [{ languages_code: 'en', label: 'Uptime' }],
				},
			],
		};
		const p = toProject(withMetrics);
		expect(p.impactMetrics?.length).toBe(2);
		expect(p.impactMetric).toEqual(p.impactMetrics?.[0]);
		expect(p.impactMetric?.value).toBe('30s');
		expect(p.impactMetric?.label).toEqual({ en: 'Real-time refresh' });
	});

	it('preserves impact_metric.before when set', () => {
		const withBefore: DirectusProject = {
			...baseRow,
			impact_metrics: [
				{
					id: 1,
					sort: 0,
					value: '15 min',
					before: '2 days',
					translations: [{ languages_code: 'en', label: 'Reporting' }],
				},
			],
		};
		const p = toProject(withBefore);
		expect(p.impactMetric?.before).toBe('2 days');
	});

	it('extracts relatedServices from M2M junction rows', () => {
		const withServices: DirectusProject = {
			...baseRow,
			services: [
				{ id: 1, project_id: 'yesid-dev', service_id: 'web-development' },
				{ id: 2, project_id: 'yesid-dev', service_id: 'sql-development' },
			],
		};
		const p = toProject(withServices);
		expect(p.relatedServices).toEqual(['web-development', 'sql-development']);
	});

	it('returns empty relatedServices when no junction rows', () => {
		const p = toProject(baseRow);
		expect(p.relatedServices).toEqual([]);
	});
});

describe('directus.toBlogPost (pure mapping, AM2.5 flat fields)', () => {
	// AM2.5: blog_posts is mono-language. Sample row has flat title + excerpt
	// directly on the parent (NOT inside a translations array).
	const sampleRow: DirectusBlogPostRow = {
		id: 'sample-post',
		status: 'published',
		date_published: '2026-04-01T00:00:00Z',
		sort: 0,
		lang: 'en',
		category: 'professional',
		tags: ['sql'],
		external: false,
		url: null,
		animation: 'draw',
		cover_image: null,
		svg_illustration: { id: 'pro-database' },
		body: null,
		title: 'Sample Post',
		excerpt: 'Sample excerpt.',
	};

	it('flattens id → slug', () => {
		expect(toBlogPost(sampleRow).slug).toBe('sample-post');
	});

	it('extracts date as YYYY-MM-DD only', () => {
		expect(toBlogPost(sampleRow).date).toBe('2026-04-01');
	});

	it('reads flat title + excerpt directly (AM2.5)', () => {
		const post = toBlogPost(sampleRow);
		expect(post.title).toBe('Sample Post');
		expect(post.excerpt).toBe('Sample excerpt.');
	});

	it('produces /blog/<slug> url for non-external post', () => {
		expect(toBlogPost(sampleRow).url).toBe('/blog/sample-post');
	});

	it('falls through to deterministic fallback when svg_illustration is null', () => {
		const noSvg: DirectusBlogPostRow = { ...sampleRow, svg_illustration: null };
		const post = toBlogPost(noSvg);
		expect(post.svg).toMatch(/^pro-/);
	});

	it('uses external url when external=true', () => {
		const external: DirectusBlogPostRow = { ...sampleRow, external: true, url: 'https://linkedin.com/in/yesid' };
		expect(toBlogPost(external).url).toBe('https://linkedin.com/in/yesid');
	});

	it('preserves tags array', () => {
		const post = toBlogPost(sampleRow);
		expect(post.tags).toEqual(['sql']);
	});

	it('handles empty date_published gracefully', () => {
		const noDate: DirectusBlogPostRow = { ...sampleRow, date_published: null };
		expect(toBlogPost(noDate).date).toBe('');
	});
});

describe('resolveSvgFallbackName (deterministic)', () => {
	it('returns same value for same slug + category', () => {
		expect(resolveSvgFallbackName('foo', 'professional')).toBe(
			resolveSvgFallbackName('foo', 'professional'),
		);
	});

	it('professional → pro-* fallback', () => {
		expect(resolveSvgFallbackName('foo', 'professional')).toMatch(/^pro-/);
	});

	it('personal → personal-* fallback', () => {
		expect(resolveSvgFallbackName('foo', 'personal')).toMatch(/^personal-/);
	});
});

describe('resolveAnimationDeterministic', () => {
	it('honors explicit valid animation', () => {
		expect(resolveAnimationDeterministic('any', 'morph')).toBe('morph');
	});

	it('falls back to deterministic when explicit invalid', () => {
		expect(resolveAnimationDeterministic('any', 'invalid')).toMatch(/^(draw|morph|draw-fill)$/);
	});

	it('returns same value for same slug', () => {
		expect(resolveAnimationDeterministic('foo', undefined)).toBe(
			resolveAnimationDeterministic('foo', undefined),
		);
	});
});

// ---------------------------------------------------------------------------
// toTechStackItem — pure row-to-domain mapping (slice-18g Phase 4 Task 9)
// ---------------------------------------------------------------------------

describe('toTechStackItem — pure row-to-domain mapping', () => {
	const emptyDoc = {
		time: 0,
		version: '2.31.2',
		blocks: [{ id: 'p1', type: 'paragraph' as const, data: { text: '' } }],
	};

	const baseRow = {
		id: 'postgresql',
		name: 'PostgreSQL',
		icon: 'postgresql.svg',
		status: 'published' as const,
		sort: 0,
		translations: [
			{
				languages_code: 'en' as const,
				what_it_is: {
					time: 1700000000000,
					version: '2.31.2',
					blocks: [{ id: 'b1', type: 'paragraph' as const, data: { text: 'An RDBMS.' } }],
				},
				what_i_use_it_for: {
					time: 1700000000001,
					version: '2.31.2',
					blocks: [{ id: 'b2', type: 'paragraph' as const, data: { text: 'Data storage.' } }],
				},
				why_i_use_it_instead: {
					time: 1700000000002,
					version: '2.31.2',
					blocks: [{ id: 'b3', type: 'paragraph' as const, data: { text: 'ACID + extensions.' } }],
				},
			},
		],
		services: [{ services_id: 'sql-development' }],
		projects: [{ projects_id: 'transit-data-pipeline' }],
	};

	it('maps id + name + icon', () => {
		const item = toTechStackItem(baseRow);
		expect(item.id).toBe('postgresql');
		expect(item.name).toBe('PostgreSQL');
		expect(item.icon).toBe('postgresql.svg');
	});

	it('maps 3 LocalizedBlockEditorDoc fields from translations', () => {
		const item = toTechStackItem(baseRow);
		expect(item.what_it_is.en.blocks[0].data).toEqual({ text: 'An RDBMS.' });
		expect(item.what_i_use_it_for.en.blocks[0].data).toEqual({ text: 'Data storage.' });
		expect(item.why_i_use_it_instead.en.blocks[0].data).toEqual({ text: 'ACID + extensions.' });
	});

	it('maps relatedServices from M2M services junction', () => {
		const item = toTechStackItem(baseRow);
		expect(item.relatedServices).toEqual(['sql-development']);
	});

	it('maps relatedProjects from M2M projects junction', () => {
		const item = toTechStackItem(baseRow);
		expect(item.relatedProjects).toEqual(['transit-data-pipeline']);
	});

	it('returns empty arrays when services and projects are absent', () => {
		const minimal = { ...baseRow, services: undefined, projects: undefined };
		const item = toTechStackItem(minimal);
		expect(item.relatedServices).toEqual([]);
		expect(item.relatedProjects).toEqual([]);
	});

	it('falls back to empty-paragraph doc when translations are absent', () => {
		const noTrans = { ...baseRow, translations: [] };
		const item = toTechStackItem(noTrans);
		// toLocalizedBlockEditorDoc fallback emits { en: { time:0, blocks:[{type:'paragraph'}] } }
		expect(item.what_it_is.en).toBeDefined();
		expect(item.what_it_is.en.blocks.length).toBeGreaterThan(0);
	});

	it('uses empty string for icon when row.icon is null', () => {
		const noIcon = { ...baseRow, icon: null };
		const item = toTechStackItem(noIcon);
		expect(item.icon).toBe('');
	});

	it('composes multi-locale LocalizedBlockEditorDoc when translations present for fr/es', () => {
		const multiLocale = {
			...baseRow,
			translations: [
				...baseRow.translations,
				{
					languages_code: 'fr' as const,
					what_it_is: { ...emptyDoc, blocks: [{ id: 'f1', type: 'paragraph' as const, data: { text: 'Un SGBDR.' } }] },
					what_i_use_it_for: null,
					why_i_use_it_instead: null,
				},
			],
		};
		const item = toTechStackItem(multiLocale);
		expect(item.what_it_is.fr?.blocks[0].data).toEqual({ text: 'Un SGBDR.' });
	});
});
