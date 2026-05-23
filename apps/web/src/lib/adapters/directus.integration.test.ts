// Directus adapter — integration test (live Directus, ephemeral or prod).
//
// Skipped by default in `bun run test`. Runs when:
//   - `RUN_DIRECTUS_INTEGRATION=1` is set (explicit opt-in)
//   - `PUBLIC_DIRECTUS_URL` points at a reachable Directus instance
//
// Fires in the cross-repo contract-test workflow (yesid.dev-cms ×
// yesid.dev):
//   1. CMS workflow checks out this repo.
//   2. Boots ephemeral Directus with the CMS snapshot applied.
//   3. Seeds services from the CMS fixture.
//   4. Grants Public policy read on the services domain.
//   5. Runs THIS test with RUN_DIRECTUS_INTEGRATION=1 + PUBLIC_DIRECTUS_URL=http://localhost:8055.
//
// Asserts that the full chain (schema + seed + adapter) produces valid Service
// domain objects end-to-end. Catches drift in either repo.

import { describe, expect, it } from 'vitest';

// vi.mock of `$env/dynamic/public` in setup.data.ts returns `{}` — override
// here by reading from `process.env` at call-time in the adapter's buildClient.
// When RUN_DIRECTUS_INTEGRATION=1, the adapter's env check picks up the real
// URL. When not set, the buildClient throws; we skip the entire suite.
const RUN = process.env.RUN_DIRECTUS_INTEGRATION === '1';
const URL_ = process.env.PUBLIC_DIRECTUS_URL;

describe.skipIf(!RUN || !URL_)('directusAdapter — live integration', () => {
	// Static import at top of file would trigger vi.mock on `$env/dynamic/public`
	// before we could override. Dynamic import inside the `describe` body happens
	// AFTER process.env is populated, so the adapter's `buildClient()` reads the
	// real URL from env at first-call time.
	it('services.all() returns a non-empty readonly Service[] against live Directus', async () => {
		process.env.PUBLIC_DIRECTUS_URL = URL_;
		const { directusAdapter } = await import('./directus');
		const services = await directusAdapter.services.all();
		expect(services.length).toBeGreaterThan(0);
		for (const s of services) {
			expect(typeof s.id).toBe('string');
			expect(typeof s.station).toBe('number');
			expect(typeof s.title.en).toBe('string');
			expect(s.title.en.length).toBeGreaterThan(0);
			expect(typeof s.description.en).toBe('string');
			expect(Array.isArray(s.relatedProjects)).toBe(true);
		}
	});

	it('services.visible() returns a subset of all()', async () => {
		process.env.PUBLIC_DIRECTUS_URL = URL_;
		const { directusAdapter } = await import('./directus');
		const [all, visible] = await Promise.all([
			directusAdapter.services.all(),
			directusAdapter.services.visible(),
		]);
		expect(visible.length).toBeLessThanOrEqual(all.length);
		for (const s of visible) {
			expect(s.visible).not.toBe(false);
		}
	});

	it('services.byId() returns a service for a real id', async () => {
		process.env.PUBLIC_DIRECTUS_URL = URL_;
		const { directusAdapter } = await import('./directus');
		const visible = await directusAdapter.services.visible();
		const first = visible[0];
		expect(first).toBeDefined();
		if (!first) return;
		const found = await directusAdapter.services.byId(first.id);
		expect(found?.id).toBe(first.id);
	});

	it('services.byId() returns undefined for unknown id', async () => {
		process.env.PUBLIC_DIRECTUS_URL = URL_;
		const { directusAdapter } = await import('./directus');
		const result = await directusAdapter.services.byId('__nonexistent__');
		expect(result).toBeUndefined();
	});

	it('services.adjacent() returns prev/next for a middle station', async () => {
		process.env.PUBLIC_DIRECTUS_URL = URL_;
		const { directusAdapter } = await import('./directus');
		const visible = await directusAdapter.services.visible();
		if (visible.length < 3) return;
		const sorted = [...visible].sort((a, b) => a.station - b.station);
		const middleIndex = Math.floor(sorted.length / 2);
		const middleId = sorted[middleIndex]?.id;
		expect(middleId).toBeDefined();
		if (!middleId) return;
		const { prev, next } = await directusAdapter.services.adjacent(middleId);
		expect(prev).toBeDefined();
		expect(next).toBeDefined();
	});

	it('service rows have deliverables + sections hydrated via Translations', async () => {
		process.env.PUBLIC_DIRECTUS_URL = URL_;
		const { directusAdapter } = await import('./directus');
		const services = await directusAdapter.services.all();
		const withDeliverables = services.filter(
			(s) => s.deliverables && s.deliverables.length > 0,
		);
		const withSections = services.filter(
			(s) => s.sections && s.sections.length > 0,
		);
		// At least one service in the seed has deliverables + one has sections.
		// Per the fixture, every service should have both.
		expect(withDeliverables.length).toBeGreaterThan(0);
		expect(withSections.length).toBeGreaterThan(0);
	});

	// slice-18k Phase 2 Task 2.4 (#43) — projects block. Closes "slice-18j:
	// add projects block to directus.integration.test.ts" — covers the
	// /items/projects + /items/projects_services round-trip against live CMS.
	//
	// CI fixture: contract-test.yml seeds projects (in addition to services)
	// + grants Public read on projects collections per slice-18k Phase 2
	// extension. Tests therefore expect projects.length > 0 and treat any
	// adapter exception as a real regression (NOT swallowed). If the
	// projects fixture is removed from CI, these tests should fail loudly
	// so the fixture/permissions drift is surfaced.
	//
	// Note: toProject() maps Directus `id` → consumer `slug` (Project.slug
	// is the human-readable identifier in the consumer-facing shape).
	it('projects.all() returns a non-empty readonly Project[] against live Directus (#43)', async () => {
		process.env.PUBLIC_DIRECTUS_URL = URL_;
		const { directusAdapter } = await import('./directus');
		const projects = await directusAdapter.projects.all();
		expect(projects.length).toBeGreaterThan(0);
		for (const p of projects) {
			expect(typeof p.slug).toBe('string');
			expect(p.slug.length).toBeGreaterThan(0);
			expect(typeof p.title.en).toBe('string');
			expect(p.title.en.length).toBeGreaterThan(0);
			expect(Array.isArray(p.relatedServices)).toBe(true);
		}
	});

	it('every projects[*].relatedServices id resolves to a service in services.all() (M2M junction integrity)', async () => {
		process.env.PUBLIC_DIRECTUS_URL = URL_;
		const { directusAdapter } = await import('./directus');
		const [projects, services] = await Promise.all([
			directusAdapter.projects.all(),
			directusAdapter.services.all(),
		]);
		expect(projects.length).toBeGreaterThan(0);
		const serviceIds = new Set(services.map((s) => s.id));
		for (const p of projects) {
			for (const sid of p.relatedServices) {
				expect(serviceIds.has(sid)).toBe(true);
			}
		}
	});

	it('projects.byService() returns projects for a service that has at least one related project', async () => {
		process.env.PUBLIC_DIRECTUS_URL = URL_;
		const { directusAdapter } = await import('./directus');
		const [services, projects] = await Promise.all([
			directusAdapter.services.all(),
			directusAdapter.projects.all(),
		]);
		expect(projects.length).toBeGreaterThan(0);
		// Find a service that has at least one related project. If the M2M
		// junction is empty across the whole fixture, fail loudly — the
		// junction is part of the slice-18 services-projects relation
		// guaranteed by the seed (per apps/cms/scripts/seed-projects.ts).
		const serviceIdWithProjects = services
			.map((s) => s.id)
			.find((sid) => projects.some((p) => p.relatedServices.includes(sid)));
		expect(serviceIdWithProjects).toBeDefined();
		const byService = await directusAdapter.projects.byService(serviceIdWithProjects!);
		expect(byService.length).toBeGreaterThan(0);
		for (const p of byService) {
			expect(p.relatedServices.includes(serviceIdWithProjects!)).toBe(true);
		}
	});
});

describe.skipIf(RUN && URL_)('directusAdapter — integration guard', () => {
	it('skipped because RUN_DIRECTUS_INTEGRATION is not set (enable via env)', () => {
		// Silent test — appears in output to document that integration suite
		// exists but is intentionally skipped for local `bun run test`.
		expect(true).toBe(true);
	});
});
