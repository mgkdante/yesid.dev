import { describe, expect, it } from 'bun:test';
import { toProject, statusFromDirectus, type DirectusProject } from './projects';
import { ProjectSchema } from '../schemas/project';
import type { BlockEditorDoc } from '@repo/shared';

const EMPTY_DOC: BlockEditorDoc = {
	time: 0,
	version: '2.31.2',
	blocks: [{ id: 'p1', type: 'paragraph', data: { text: 'A description.' } }],
};

const FIXTURE: DirectusProject = {
	id: 'transit-data-pipeline',
	status: 'published',
	date_published: '2026-04-01T00:00:00Z',
	sort: 1,
	featured: false,
	hero_image: 'asset-uuid-1',
	repo_url: 'https://github.com/mgkdante/transit',
	live_url: null,
	readme_url: null,
	location: 'sherbrooke',
	environment: 'production',
	version: '2.4.1',
	stack: ['PostgreSQL', 'Python'],
	tags: ['etl', 'transit'],
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
	it('maps draft -> wip, published -> public, archived -> private', () => {
		expect(statusFromDirectus('draft')).toBe('wip');
		expect(statusFromDirectus('published')).toBe('public');
		expect(statusFromDirectus('archived')).toBe('private');
	});
});

describe('projects fetcher transform', () => {
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

	it('sorts impact_metrics by sort ascending, sets first as impactMetric', () => {
		const result = toProject(FIXTURE);
		expect(result.impactMetrics).toHaveLength(2);
		expect(result.impactMetrics?.[0].value).toBe('30s');
		expect(result.impactMetrics?.[1].value).toBe('99.9%');
		expect(result.impactMetric).toEqual(result.impactMetrics?.[0]);
	});

	it('omits impactMetrics entirely when none provided', () => {
		const noMetrics: DirectusProject = { ...FIXTURE, impact_metrics: [] };
		const result = toProject(noMetrics);
		expect(result.impactMetrics).toBeUndefined();
		expect(result.impactMetric).toBeUndefined();
	});

	it('output parses through ProjectSchema', () => {
		const result = toProject(FIXTURE);
		expect(() => ProjectSchema.parse(result)).not.toThrow();
	});
});
