// Tech stack data integrity + API tests.
// Validates all 35 items have correct structure, no dangling refs, and helpers work.

import { describe, it, expect } from 'vitest';
import {
	getAllTechItems,
	getTechItemById,
	getTechItemsByLayer,
	getTechItemsByDomain,
	getConnections,
	getIncomingConnections,
	getTechItemContent,
	getAllScenarios,
	getScenarioForDomains,
	validateTechItems,
	validateScenarios,
} from './tech-stack.js';
import { services } from './services.js';
import { projects } from './projects.js';
import type { InfraLayer, DomainCluster } from './types.js';

const VALID_LAYERS: InfraLayer[] = [
	'data', 'backend', 'api', 'frontend', 'mobile', 'analytics', 'devops', 'testing', 'systems',
];

const VALID_DOMAINS: DomainCluster[] = [
	'data-engineering', 'web-development', 'mobile-development', 'analytics-bi',
	'systems-programming', 'devops-infra', 'internal-tooling',
];

describe('tech stack data integrity', () => {
	const items = getAllTechItems();

	it('loads at least 34 tech items', () => {
		expect(items.length).toBeGreaterThanOrEqual(34);
	});

	it('all IDs are unique', () => {
		const ids = items.map((i) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('all items have valid layers', () => {
		for (const item of items) {
			expect(VALID_LAYERS).toContain(item.layer);
		}
	});

	it('all items have at least one domain', () => {
		for (const item of items) {
			expect(item.domains.length).toBeGreaterThanOrEqual(1);
		}
	});

	it('all domains are valid', () => {
		for (const item of items) {
			for (const d of item.domains) {
				expect(VALID_DOMAINS).toContain(d);
			}
		}
	});

	it('all proficiency values are valid', () => {
		const valid = ['expert', 'proficient', 'familiar'];
		for (const item of items) {
			expect(valid).toContain(item.proficiency);
		}
	});

	it('no self-references in connectsTo', () => {
		for (const item of items) {
			expect(item.connectsTo).not.toContain(item.id);
		}
	});

	it('all connectsTo targets exist (no dangling refs)', () => {
		const ids = new Set(items.map((i) => i.id));
		for (const item of items) {
			for (const target of item.connectsTo) {
				expect(ids.has(target), `${item.id} → ${target} does not exist`).toBe(true);
			}
		}
	});

	it('all relatedServices match existing service IDs', () => {
		const serviceIds = new Set(services.map((s) => s.id));
		for (const item of items) {
			for (const sid of item.relatedServices) {
				expect(serviceIds.has(sid), `${item.id}: service "${sid}" not found`).toBe(true);
			}
		}
	});

	it('all relatedProjects match existing project slugs', () => {
		const projectSlugs = new Set(projects.map((p) => p.slug));
		for (const item of items) {
			for (const ps of item.relatedProjects) {
				expect(projectSlugs.has(ps), `${item.id}: project "${ps}" not found`).toBe(true);
			}
		}
	});

	it('validateTechItems() returns zero errors', () => {
		const errors = validateTechItems();
		expect(errors, errors.join('\n')).toHaveLength(0);
	});
});

describe('tech stack API', () => {
	it('getTechItemById returns correct item', () => {
		const pg = getTechItemById('postgresql');
		expect(pg).toBeDefined();
		expect(pg!.name).toBe('PostgreSQL');
		expect(pg!.layer).toBe('data');
	});

	it('getTechItemById returns undefined for unknown ID', () => {
		expect(getTechItemById('nonexistent')).toBeUndefined();
	});

	it('getTechItemsByLayer returns only items in that layer', () => {
		const dataItems = getTechItemsByLayer('data');
		expect(dataItems.length).toBeGreaterThanOrEqual(3);
		for (const item of dataItems) {
			expect(item.layer).toBe('data');
		}
	});

	it('getTechItemsByDomain returns items containing that domain', () => {
		const webItems = getTechItemsByDomain('web-development');
		expect(webItems.length).toBeGreaterThanOrEqual(5);
		for (const item of webItems) {
			expect(item.domains).toContain('web-development');
		}
	});

	it('getConnections returns outgoing edges', () => {
		const pgConnections = getConnections('postgresql');
		expect(pgConnections).toContain('python');
	});

	it('getIncomingConnections returns incoming edges', () => {
		const incoming = getIncomingConnections('postgresql');
		// alembic, docker, airflow all connect to postgresql
		expect(incoming.length).toBeGreaterThanOrEqual(1);
	});

	it('getTechItemContent returns non-empty markdown for known items', () => {
		const content = getTechItemContent('postgresql');
		expect(content).toContain('## What it is');
	});

	it('getTechItemContent returns empty string for unknown items', () => {
		expect(getTechItemContent('nonexistent')).toBe('');
	});
});

describe('scenario data integrity', () => {
	const scenarios = getAllScenarios();

	it('loads at least 7 scenarios', () => {
		expect(scenarios.length).toBeGreaterThanOrEqual(7);
	});

	it('all scenario IDs are unique', () => {
		const ids = scenarios.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('all recommended techs exist as tech items', () => {
		const techIds = new Set(getAllTechItems().map((i) => i.id));
		for (const s of scenarios) {
			for (const r of s.recommended) {
				expect(techIds.has(r), `Scenario ${s.id}: "${r}" not found`).toBe(true);
			}
		}
	});

	it('all scenarios have non-empty summaries', () => {
		for (const s of scenarios) {
			expect(s.summary.en.trim().length).toBeGreaterThan(0);
		}
	});

	it('validateScenarios() returns zero errors', () => {
		const errors = validateScenarios();
		expect(errors, errors.join('\n')).toHaveLength(0);
	});
});

describe('scenario matching', () => {
	it('exact domain match returns correct scenario', () => {
		const result = getScenarioForDomains(['data-engineering']);
		expect(result).toBeDefined();
		expect(result!.id).toBe('data-pipeline');
	});

	it('multi-domain exact match works', () => {
		const result = getScenarioForDomains(['data-engineering', 'analytics-bi']);
		expect(result).toBeDefined();
		expect(result!.id).toBe('data-plus-analytics');
	});

	it('returns undefined for empty domains', () => {
		expect(getScenarioForDomains([])).toBeUndefined();
	});

	it('partial match falls back to best subset', () => {
		// systems-programming has no dedicated scenario, but with web-development it should match
		const result = getScenarioForDomains(['web-development', 'systems-programming']);
		expect(result).toBeDefined();
		expect(result!.id).toBe('fullstack-web');
	});
});
