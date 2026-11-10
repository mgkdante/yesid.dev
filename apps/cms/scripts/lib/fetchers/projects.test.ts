import { describe, expect, it } from 'bun:test';
import { fetchProjects, toProject, statusFromDirectus, type DirectusProject } from './projects';
import { ProjectSchema } from '@repo/shared/schemas';
import type { BlockEditorDoc } from '@repo/shared';
import { cmsClientDouble } from '../../../tests/helpers/doubles';

const EMPTY_DOC: BlockEditorDoc = {
	time: 0,
	version: '2.31.2',
	blocks: [{ id: 'p1', type: 'paragraph', data: { text: 'A description.' } }],
};

const FIXTURE: DirectusProject = {
	id: 'transit-data-pipeline',
	status: 'published',
	sort: 1,
	featured: false,
	hero_image: 'asset-uuid-1',
	hero_image_light: null,
	hero_image_secondary: null,
	hero_image_secondary_light: null,
	repo_url: 'https://github.com/mgkdante/transit',
	repo_private: null,
	docs_url: null,
	live_url: null,
	readme_url: null,
	location: 'sherbrooke',
	environment: 'production',
	version: '2.4.1',
	tech_stack: [
		{ sort: 0, tech_stack_id: { id: 'postgresql', name: 'PostgreSQL' } },
		{ sort: 1, tech_stack_id: { id: 'python', name: 'Python' } },
	],
	translations: [
		{
			languages_code: 'en',
			title: 'Transit Operations Data Pipeline',
			one_liner: 'End-to-end ELT pipeline.',
			description: EMPTY_DOC,
		},
	],
	sections: [
		{
			id: 1,
			sort: 1,
			translations: [{ languages_code: 'en', title: 'Why', content: EMPTY_DOC }],
		},
	],
	impact_metrics: [
		{ id: 2, sort: 2, value: '99.9%', before: null, translations: [{ languages_code: 'en', label: 'Pipeline uptime' }] },
		{ id: 1, sort: 1, value: '30s', before: null, translations: [{ languages_code: 'en', label: 'Real-time refresh cycles' }] },
	],
	services: [
		{ id: 10, project_id: 'transit-data-pipeline', service_id: 'data-pipeline' },
		{ id: 11, project_id: 'transit-data-pipeline', service_id: 'sql-development' },
	],
};

describe('statusFromDirectus mapping', () => {
	it('keeps CMS drafts unpublished rather than treating them as public WIP', () => {
		expect(statusFromDirectus('draft')).toBe('private');
		expect(statusFromDirectus('published')).toBe('public');
		expect(statusFromDirectus('archived')).toBe('private');
	});
	it('exports only published projects even if a CMS response includes unpublished rows', async () => {
		const client = cmsClientDouble(() => [FIXTURE, { ...FIXTURE, id: 'unpublished-draft', status: 'draft' }, { ...FIXTURE, id: 'archived-project', status: 'archived' }]);
		const projects = await fetchProjects({ client });
		expect(projects.map(project => project.slug)).toEqual([FIXTURE.id]);
	});
	it('reflects simulated publish, localized update and delete transitions without retaining an old row', async () => {
		let rows: DirectusProject[] = [{ ...FIXTURE, status: 'draft' }];
		const client = cmsClientDouble(() => rows);
		const read = () => fetchProjects({ client });
		expect(await read()).toEqual([]);
		rows = [{ ...FIXTURE }];
		expect((await read())[0]?.title.en).toBe('Transit Operations Data Pipeline');
		rows = [{ ...FIXTURE, translations: [...FIXTURE.translations!, { languages_code: 'fr', title: 'Titre modifié', one_liner: 'Résumé modifié' }] }];
		expect((await read())[0]?.title.fr).toBe('Titre modifié');
		rows = [];
		expect(await read()).toEqual([]);
	});
});

describe('projects fetcher transform', () => {
	it('leaves OG acceptance to the shared card fit check', async () => {
		const row = { ...FIXTURE, translations: [{ ...FIXTURE.translations![0]!, one_liner: 'W'.repeat(201) }] };
		expect(await fetchProjects({ client: cmsClientDouble(() => [row]) })).toHaveLength(1);
		const accepted = { ...row, translations: [{ ...row.translations[0]!, one_liner: 'W'.repeat(100) + '\n   ' + 'W'.repeat(99) }] };
		expect(await fetchProjects({ client: cmsClientDouble(() => [accepted]) })).toHaveLength(1);
	});
	it('maps status from Directus to legacy enum', () => {
		const result = toProject(FIXTURE);
		expect(result.status).toBe('public');
	});

	it('uses row.id as slug', () => {
		const result = toProject(FIXTURE);
		expect(result.slug).toBe('transit-data-pipeline');
	});

	it('flattens projects_services junction into relatedServices array', () => {
		const result = toProject(FIXTURE);
		expect(result.relatedServices).toEqual(['data-pipeline', 'sql-development']);
	});

	it('sorts impact_metrics without exporting a duplicate legacy metric', () => {
		const result = toProject(FIXTURE);
		expect(result.impactMetrics).toHaveLength(2);
		expect(result.impactMetrics?.[0]?.value).toEqual({ en: '30s', fr: '30s', es: '30s' });
		expect(result.impactMetrics?.[1]?.value).toEqual({ en: '99.9%', fr: '99.9%', es: '99.9%' });
		expect(result).not.toHaveProperty('impactMetric');
	});

	it('exports optional proof without changing the number or inventing missing fields', async () => {
		const row = { ...FIXTURE, impact_metrics: [Object.assign({}, FIXTURE.impact_metrics![0]!, {
			source_url: 'https://example.org/evidence', as_of: '2026-11-04',
		})] };
		const [project] = await fetchProjects({ client: cmsClientDouble(() => [row]) });
		expect(project?.impactMetrics?.[0]).toMatchObject({ value: { en: '99.9%' }, sourceUrl: 'https://example.org/evidence', asOf: '2026-11-04' });
		const [old] = await fetchProjects({ client: cmsClientDouble(() => [FIXTURE]) });
		expect(old?.impactMetrics?.[0]).not.toHaveProperty('sourceUrl');
		expect(old?.impactMetrics?.[0]).not.toHaveProperty('asOf');
	});

	it('rejects invalid proof at the export boundary', async () => {
		for (const proof of [{ source_url: 'http://example.org' }, { as_of: '2026-02-30' }]) {
			const row = { ...FIXTURE, impact_metrics: [Object.assign({}, FIXTURE.impact_metrics![0]!, proof)] };
			await expect(fetchProjects({ client: cmsClientDouble(() => [row]) })).rejects.toThrow();
		}
	});
	it('omits null or blank proof without making a citation mandatory', async () => {
		for (const proof of [null, '', '   ']) {
			const row = { ...FIXTURE, impact_metrics: [{ ...FIXTURE.impact_metrics![0]!, source_url: proof, as_of: proof }] };
			const [project] = await fetchProjects({ client: cmsClientDouble(() => [row]) });
			expect(project?.impactMetrics?.[0]).not.toHaveProperty('sourceUrl');
			expect(project?.impactMetrics?.[0]).not.toHaveProperty('asOf');
		}
	});

	it('omits impactMetrics entirely when none provided', () => {
		const noMetrics: DirectusProject = { ...FIXTURE, impact_metrics: [] };
		const result = toProject(noMetrics);
		expect(result.impactMetrics).toBeUndefined();
		expect(result).not.toHaveProperty('impactMetric');
	});

	it('maps theme-aware primary and optional secondary hero images', () => {
		const result = toProject({
			...FIXTURE,
			hero_image: 'desktop-dark-uuid',
			hero_image_light: 'desktop-light-uuid',
			hero_image_secondary: 'mobile-dark-uuid',
			hero_image_secondary_light: 'mobile-light-uuid',
		});

		expect(result.image).toBe('desktop-dark-uuid');
		expect(result.imageLight).toBe('desktop-light-uuid');
		expect(result.imageSecondary).toBe('mobile-dark-uuid');
		expect(result.imageSecondaryLight).toBe('mobile-light-uuid');
	});

	it('output parses through ProjectSchema', () => {
		const result = toProject(FIXTURE);
		expect(() => ProjectSchema.parse(result)).not.toThrow();
	});
});

describe('projects per-language Show on site', () => {
	const withFrench = (show: boolean): DirectusProject => ({
		...FIXTURE,
		translations: [
			{ ...FIXTURE.translations![0]!, show_on_site: true },
			{ languages_code: 'fr', show_on_site: show, title: 'Pipeline de données', one_liner: 'Résumé.' },
		],
		sections: [
			{ id: 1, sort: 1, translations: [...FIXTURE.sections![0]!.translations!, { languages_code: 'fr', title: 'Pourquoi', content: EMPTY_DOC }] },
		],
	});

	it('shows a switched-on French row', () => {
		const result = toProject(withFrench(true));
		expect(result.title.fr).toBe('Pipeline de données');
		expect(result.sections[0]?.title.fr).toBe('Pourquoi');
	});

	it('falls back to English when the French row is switched off', () => {
		const result = toProject(withFrench(false));
		expect(result.title.fr).toBeUndefined();
		expect(result.sections[0]?.title.fr).toBeUndefined();
		expect(result.title.en).toBe('Transit Operations Data Pipeline');
	});

	it('hides the project in every language when English is switched off', async () => {
		const englishOff = { ...FIXTURE, translations: [{ ...FIXTURE.translations![0]!, show_on_site: false }] };
		const client = cmsClientDouble(() => [englishOff]);
		expect(await fetchProjects({ client })).toEqual([]);
	});
});
