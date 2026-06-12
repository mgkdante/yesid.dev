import { describe, it, expect } from 'bun:test';
import {
	SURVIVOR_BY_ARCHIVED,
	ARCHIVED_IDS,
	SURVIVOR_IDS,
	STATION_MOVES,
	TRANSLATION_PATCHES,
	PARENT_PATCHES,
	DB_ENG_DELIVERABLES,
	PIPELINE_NEW_DELIVERABLE,
	ARCHETYPE_SERVICE_MOVES,
	buildTechJunctionPlan,
	buildProjectJunctionPlan,
	buildDeliverablesPlan,
	simulateStationMoves,
	parseFlags,
	type TechJunctionRow,
	type ProjectJunctionRow,
	type DeliverableRow,
} from '../scripts/consolidate-services';

describe('consolidation decision constants', () => {
	it('archives exactly sql-development and internal-tooling', () => {
		expect([...ARCHIVED_IDS].sort()).toEqual(['internal-tooling', 'sql-development']);
	});

	it('remap targets are the decided survivors', () => {
		expect(SURVIVOR_BY_ARCHIVED['sql-development']).toBe('database-engineering');
		expect(SURVIVOR_BY_ARCHIVED['internal-tooling']).toBe('data-pipeline');
	});

	it('survivors are the 4 stations in data-flow order', () => {
		expect([...SURVIVOR_IDS]).toEqual([
			'database-engineering',
			'data-pipeline',
			'analytics-reporting',
			'web-development',
		]);
	});

	it('every survivor gets a translation patch with a non-empty title + description', () => {
		for (const id of SURVIVOR_IDS) {
			const p = TRANSLATION_PATCHES[id];
			expect(p, `${id} missing patch`).toBeDefined();
			expect((p.title ?? '').length).toBeGreaterThan(0);
			expect((p.description ?? '').length).toBeGreaterThan(0);
		}
	});

	it('archived rows get NO translation patch (their copy is preserved for rollback)', () => {
		for (const id of ARCHIVED_IDS) {
			expect(TRANSLATION_PATCHES[id]).toBeUndefined();
		}
	});

	it('station-1 merge keeps the canon-compliant benefit + number', () => {
		const p = TRANSLATION_PATCHES['database-engineering'];
		expect(p.benefit_headline).toBe('Queries that run in seconds, not minutes');
		expect(p.impact_metric_value).toBe('3x faster');
		expect(p.impact_metric_label).toBe('avg query improvement');
	});

	it('parent patches only touch survivor stack fields', () => {
		expect(Object.keys(PARENT_PATCHES).sort()).toEqual([
			'database-engineering',
			'web-development',
		]);
	});
});

describe('simulateStationMoves', () => {
	// Live state today (committed module == live CMS):
	const initial: Record<string, number> = {
		'sql-development': 1,
		'data-pipeline': 2,
		'analytics-reporting': 3,
		'database-engineering': 4,
		'internal-tooling': 5,
		'web-development': 6,
	};

	it('never collides at any intermediate step', () => {
		const states = simulateStationMoves(initial, STATION_MOVES);
		for (const state of states) {
			const stations = Object.values(state);
			expect(new Set(stations).size).toBe(stations.length);
		}
	});

	it('lands on the GO-2 numbering: survivors 1-4 in data-flow order, archived rows parked at 5-6', () => {
		const states = simulateStationMoves(initial, STATION_MOVES);
		expect(states[states.length - 1]).toEqual({
			'database-engineering': 1,
			'data-pipeline': 2,
			'analytics-reporting': 3,
			'web-development': 4,
			'sql-development': 5,
			'internal-tooling': 6,
		});
	});
});

describe('buildTechJunctionPlan', () => {
	const rows: TechJunctionRow[] = [
		{ id: 1, tech_stack_id: 'postgresql', services_id: 'sql-development' },
		{ id: 2, tech_stack_id: 'postgresql', services_id: 'database-engineering' },
		{ id: 3, tech_stack_id: 't-sql', services_id: 'sql-development' },
		{ id: 4, tech_stack_id: 't-sql', services_id: 'analytics-reporting' },
		{ id: 5, tech_stack_id: 'node-js', services_id: 'internal-tooling' },
		{ id: 6, tech_stack_id: 'node-js', services_id: 'web-development' },
	];

	it('deletes the archived link when the survivor link already exists (no duplicate pairs)', () => {
		const plan = buildTechJunctionPlan(rows);
		expect(plan).toContainEqual({
			op: 'delete', id: 1, tech: 'postgresql', from: 'sql-development',
		});
	});

	it('remaps the archived link when the survivor pair is absent', () => {
		const plan = buildTechJunctionPlan(rows);
		expect(plan).toContainEqual({
			op: 'remap', id: 3, to: 'database-engineering', tech: 't-sql', from: 'sql-development',
		});
		expect(plan).toContainEqual({
			op: 'remap', id: 5, to: 'data-pipeline', tech: 'node-js', from: 'internal-tooling',
		});
	});

	it('ignores rows already pointing at survivors', () => {
		const plan = buildTechJunctionPlan(rows);
		expect(plan.map((a) => a.id).sort()).toEqual([1, 3, 5]);
	});

	it('is idempotent: a second pass over remapped rows plans nothing', () => {
		const after: TechJunctionRow[] = [
			{ id: 2, tech_stack_id: 'postgresql', services_id: 'database-engineering' },
			{ id: 3, tech_stack_id: 't-sql', services_id: 'database-engineering' },
			{ id: 4, tech_stack_id: 't-sql', services_id: 'analytics-reporting' },
			{ id: 5, tech_stack_id: 'node-js', services_id: 'data-pipeline' },
			{ id: 6, tech_stack_id: 'node-js', services_id: 'web-development' },
		];
		expect(buildTechJunctionPlan(after)).toEqual([]);
	});
});

describe('buildProjectJunctionPlan', () => {
	it('remaps transit×sql-development to database-engineering', () => {
		const rows: ProjectJunctionRow[] = [
			{ id: 10, project_id: 'transit-data-pipeline', service_id: 'data-pipeline' },
			{ id: 11, project_id: 'transit-data-pipeline', service_id: 'sql-development' },
			{ id: 12, project_id: 'yesid-dev', service_id: 'web-development' },
		];
		expect(buildProjectJunctionPlan(rows)).toEqual([
			{ op: 'remap', id: 11, to: 'database-engineering', project: 'transit-data-pipeline', from: 'sql-development' },
		]);
	});

	it('deletes instead of remapping when the project already links the survivor', () => {
		const rows: ProjectJunctionRow[] = [
			{ id: 11, project_id: 'transit-data-pipeline', service_id: 'sql-development' },
			{ id: 13, project_id: 'transit-data-pipeline', service_id: 'database-engineering' },
		];
		expect(buildProjectJunctionPlan(rows)).toEqual([
			{ op: 'delete', id: 11, project: 'transit-data-pipeline', from: 'sql-development' },
		]);
	});
});

describe('buildDeliverablesPlan', () => {
	const existing: DeliverableRow[] = [1, 2, 3, 4, 5, 6].map((n) => ({
		id: n,
		sort: n,
		translations: [{ id: 100 + n, languages_code: 'en', label: `old ${n}` }],
	}));

	it('merged station-1 list has 8 unique labels', () => {
		expect(DB_ENG_DELIVERABLES.length).toBe(8);
		expect(new Set(DB_ENG_DELIVERABLES).size).toBe(8);
	});

	it('patches the 6 existing rows in sort order and creates the 2 overflow rows', () => {
		const plan = buildDeliverablesPlan(existing, DB_ENG_DELIVERABLES);
		expect(plan.filter((a) => a.op === 'patch').length).toBe(6);
		expect(plan.filter((a) => a.op === 'create').length).toBe(2);
		expect(plan[0]).toEqual({
			op: 'patch', rowId: 1, trId: 101, sort: 1, label: DB_ENG_DELIVERABLES[0],
		});
		expect(plan[7]).toEqual({ op: 'create', sort: 8, label: DB_ENG_DELIVERABLES[7] });
	});

	it('plans patch with trId:null when a row has no en translation (script creates it)', () => {
		const noEn: DeliverableRow[] = [{ id: 9, sort: 1, translations: [] }];
		const plan = buildDeliverablesPlan(noEn, ['only']);
		expect(plan[0]).toEqual({ op: 'patch', rowId: 9, trId: null, sort: 1, label: 'only' });
	});

	it('pipeline gains the absorbed automation deliverable', () => {
		expect(PIPELINE_NEW_DELIVERABLE).toBe('Workflow automation (approval flows, scheduled jobs)');
	});
});

describe('archetype + flags', () => {
	it('data-dashboard archetype re-points at the Dashboards & Analytics station', () => {
		expect(ARCHETYPE_SERVICE_MOVES).toEqual([
			{ slug: 'data-dashboard', service: 'analytics-reporting' },
		]);
	});

	it('only --apply writes', () => {
		expect(parseFlags([]).apply).toBe(false);
		expect(parseFlags(['--dry-run']).apply).toBe(false);
		expect(parseFlags(['--apply']).apply).toBe(true);
	});
});
