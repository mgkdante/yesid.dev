// Parity harness — the regression oracle for the static-adapter slice (27.1).
//
// WHAT THIS IS
// ------------
// Runs BOTH content adapters (staticAdapter + the REAL directusAdapter) against
// the SAME live Directus, calls every ContentPort method with identical args,
// deep-equals the two results, and prints a per-method MATCH/DIFF table.
//
// Later tasks in the slice use this to prove each fix flips a method from
// DIFF -> MATCH without regressing the methods that already MATCH. It is a
// measurement tool, NOT a pass/fail gate: the baseline intentionally contains
// known DIFFs (methods the static adapter cannot yet reproduce). Asserting
// "no DIFFs" here would be wrong until the whole slice lands.
//
// WHY IT IS A DEDICATED FILE WITH FILE-LEVEL MOCK OVERRIDES
// --------------------------------------------------------
// This file lives under src/lib/adapters/__tests__/ so the vitest `data`
// project picks it up (vite.config.ts include glob). That project's
// setupFiles=[setup.data.ts] does two things that would make a naive parity
// check meaningless:
//   1. vi.mock('$env/dynamic/public', () => ({ env: {} }))  -> directusAdapter
//      would throw "PUBLIC_DIRECTUS_URL is required" the moment it builds its
//      client.
//   2. vi.mock('$lib/adapters/directus', ... -> staticAdapter)  -> the REAL
//      directusAdapter is replaced by staticAdapter, so BOTH sides of the
//      comparison would be static and every method would trivially MATCH.
//
// We override BOTH, file-locally, with the exact pattern already proven in
// __tests__/contract.test.ts (file-level vi.unmock + vi.mock are hoisted above
// imports and win over the setup-file registrations for the same module path):
//   - vi.unmock('$lib/adapters/directus')          -> import the REAL adapter
//   - vi.mock('$env/dynamic/public', { env: { PUBLIC_DIRECTUS_URL } })
// This resolves the $env/$lib virtual-module problem WITHOUT a plain `bun`
// script (which cannot resolve $env/dynamic/public or $lib at all) and WITHOUT
// a bespoke second vitest config.
//
// HOW TO RUN
// ----------
// Opt-in via RUN_PARITY=1 so it never fires during normal `bun run test`
// (it makes live network calls to cms.yesid.dev; Neon may cold-start ~5-10s on
// the first request, hence the long timeout). From apps/web:
//
//   RUN_PARITY=1 bunx vitest run src/lib/adapters/__tests__/parity.harness.test.ts --reporter=basic
//
// Override the target with PUBLIC_DIRECTUS_URL=<url> (defaults to prod).

import { describe, expect, it, vi } from 'vitest';
import { isDeepStrictEqual } from 'node:util';

// --- Hoisted mock overrides (must precede the adapter imports below) ---------

// Undo setup.data.ts's directus -> static substitution so we get the REAL
// Directus adapter on the right-hand side of every comparison.
vi.unmock('$lib/adapters/directus');

// Point the REAL directus adapter at live Directus. setup.data.ts stubs this to
// `{}`; without this override buildClient() throws on first call.
//
// NOTE: the factory is hoisted above all module-level code, so it must NOT
// reference outer consts (Vitest throws "Cannot access X before
// initialization"). Read process.env inline. Mirror the same default in the
// PARITY_DIRECTUS_URL const below for the reporter header.
vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_DIRECTUS_URL: process.env.PUBLIC_DIRECTUS_URL || 'https://cms.yesid.dev',
	},
}));

const PARITY_DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'https://cms.yesid.dev';

// --- Real adapters under test ----------------------------------------------

import { staticAdapter } from '$lib/adapters/static';
import { directusAdapter } from '$lib/adapters/directus';

// Static content modules — the source of truth for deriving valid args so both
// adapters receive identical inputs (and so the harness self-updates when the
// fixtures change rather than rotting against hardcoded slugs/ids).
import { projects as staticProjects } from '$lib/content/projects';
import { services as staticServices } from '$lib/content/services';
import { blogPosts as staticBlogPosts } from '$lib/content/blog';
import { techStackItems as staticTechStackItems } from '$lib/content/tech-stack';

import type { BlogCategory, Locale } from '$lib/types';
import type { ContentAdapter } from '../types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RUN = process.env.RUN_PARITY === '1';

// Generous: 8s/attempt * (1 + 3 retries) + backoff per call, x ~70 methods,
// plus a Neon cold-start on the first request. Single `it` runs them all.
const HARNESS_TIMEOUT_MS = 300_000;

// ---------------------------------------------------------------------------
// Result types + comparison helpers
// ---------------------------------------------------------------------------

type Outcome =
	| { kind: 'MATCH' }
	| { kind: 'DIFF'; detail: string }
	| { kind: 'STATIC_ERR'; detail: string }
	| { kind: 'DIRECTUS_ERR'; detail: string }
	| { kind: 'BOTH_ERR'; detail: string }
	| { kind: 'SKIP'; detail: string };

interface Row {
	method: string;
	args: string;
	outcome: Outcome;
}

function errMsg(e: unknown): string {
	if (e instanceof Error) return e.message;
	try {
		return JSON.stringify(e);
	} catch {
		return String(e);
	}
}

// Compact, bounded diff so DIFF rows are actionable without flooding the log.
function compactDiff(staticVal: unknown, directusVal: unknown): string {
	const fmt = (v: unknown): string => {
		let s: string;
		try {
			s = JSON.stringify(v);
		} catch {
			s = String(v);
		}
		if (s === undefined) s = 'undefined';
		if (s.length > 400) s = s.slice(0, 400) + `…(+${s.length - 400} chars)`;
		return s;
	};

	// Surface the first differing top-level key for object results — usually the
	// fastest way to see WHICH field drifted.
	if (
		staticVal &&
		directusVal &&
		typeof staticVal === 'object' &&
		typeof directusVal === 'object' &&
		!Array.isArray(staticVal) &&
		!Array.isArray(directusVal)
	) {
		const keys = new Set([
			...Object.keys(staticVal as Record<string, unknown>),
			...Object.keys(directusVal as Record<string, unknown>),
		]);
		const diffKeys: string[] = [];
		for (const k of keys) {
			const sv = (staticVal as Record<string, unknown>)[k];
			const dv = (directusVal as Record<string, unknown>)[k];
			if (!isDeepStrictEqual(sv, dv)) diffKeys.push(k);
		}
		if (diffKeys.length > 0) {
			const firstKey = diffKeys[0];
			return (
				`keys differ: [${diffKeys.join(', ')}]; ` +
				`e.g. .${firstKey}: static=${fmt(
					(staticVal as Record<string, unknown>)[firstKey],
				)} | directus=${fmt((directusVal as Record<string, unknown>)[firstKey])}`
			);
		}
	}

	// Array length mismatch is the common collection-level signal.
	if (Array.isArray(staticVal) && Array.isArray(directusVal)) {
		if (staticVal.length !== directusVal.length) {
			return `array length: static=${staticVal.length} | directus=${directusVal.length}`;
		}
	}

	return `static=${fmt(staticVal)} | directus=${fmt(directusVal)}`;
}

// Invoke a single method on both adapters with identical args and classify.
async function compareMethod(
	method: string,
	args: string,
	staticCall: () => Promise<unknown>,
	directusCall: () => Promise<unknown>,
): Promise<Row> {
	let staticVal: unknown;
	let directusVal: unknown;
	let staticErr: unknown;
	let directusErr: unknown;

	try {
		staticVal = await staticCall();
	} catch (e) {
		staticErr = e;
	}
	try {
		directusVal = await directusCall();
	} catch (e) {
		directusErr = e;
	}

	if (staticErr && directusErr) {
		return {
			method,
			args,
			outcome: {
				kind: 'BOTH_ERR',
				detail: `static: ${errMsg(staticErr)} || directus: ${errMsg(directusErr)}`,
			},
		};
	}
	if (staticErr) {
		return { method, args, outcome: { kind: 'STATIC_ERR', detail: errMsg(staticErr) } };
	}
	if (directusErr) {
		return { method, args, outcome: { kind: 'DIRECTUS_ERR', detail: errMsg(directusErr) } };
	}

	if (isDeepStrictEqual(staticVal, directusVal)) {
		return { method, args, outcome: { kind: 'MATCH' } };
	}
	return {
		method,
		args,
		outcome: { kind: 'DIFF', detail: compactDiff(staticVal, directusVal) },
	};
}

// ---------------------------------------------------------------------------
// The method matrix — every ContentPort method, with identical args derived
// from the static fixtures so both adapters receive the same inputs.
// ---------------------------------------------------------------------------

function buildPlan(a: ContentAdapter, b: ContentAdapter) {
	// Derive valid args from static data (both adapters get the SAME values).
	const projectSlug = staticProjects[0]?.slug ?? 'yesid-dev';
	const serviceId = staticServices[0]?.id ?? 'sql-development';
	const blogSlug = staticBlogPosts[0]?.slug ?? '';
	const techStackId = staticTechStackItems[0]?.id ?? '';

	// Distinct blog categories actually present in the fixtures.
	const blogCategories = [
		...new Set(staticBlogPosts.map((p) => p.category)),
	] as BlogCategory[];
	const primaryCategory: BlogCategory = blogCategories[0] ?? ('personal' as BlogCategory);

	// A real (category, tag) pair from the fixtures for byTag.
	const taggedPost = staticBlogPosts.find((p) => (p.tags?.length ?? 0) > 0);
	const tagCategory: BlogCategory = (taggedPost?.category ?? primaryCategory) as BlogCategory;
	const tagValue = taggedPost?.tags?.[0] ?? '';

	// A service id that actually has related projects (for projects.byService).
	const serviceWithProjects =
		staticServices
			.map((s) => s.id)
			.find((id) => staticProjects.some((p) => p.relatedServices?.includes(id))) ?? serviceId;

	const locale: Locale = 'en';

	// Route ids: static (composePageSeo) + dynamic (factory) + error.
	const staticRouteIds = [
		'/',
		'/about',
		'/contact',
		'/services',
		'/projects',
		'/blog',
		'/blog/personal',
		'/tech-stack',
	];
	const dynamicRoutes: Array<{ id: string; params: Record<string, string> }> = [
		{ id: '/services/[id]', params: { id: serviceId } },
		{ id: '/projects/[slug]', params: { slug: projectSlug } },
		{ id: '/blog/[slug]', params: { slug: blogSlug } },
	];

	type Step = { method: string; args: string; s: () => Promise<unknown>; d: () => Promise<unknown> };
	const steps: Step[] = [];
	const add = (
		method: string,
		args: string,
		pick: (adp: ContentAdapter) => Promise<unknown>,
	) => steps.push({ method, args, s: () => pick(a), d: () => pick(b) });

	// --- projects ---
	add('projects.all', '()', (x) => x.projects.all());
	add('projects.bySlug', `('${projectSlug}')`, (x) => x.projects.bySlug(projectSlug));
	add('projects.bySlug(unknown)', `('__nope__')`, (x) => x.projects.bySlug('__nope__'));
	add('projects.featured', '()', (x) => x.projects.featured());
	add('projects.public', '()', (x) => x.projects.public());
	add('projects.byService', `('${serviceWithProjects}')`, (x) =>
		x.projects.byService(serviceWithProjects),
	);
	add('projects.allTags', '()', (x) => x.projects.allTags());
	add('projects.allStackItems', '()', (x) => x.projects.allStackItems());
	add('projects.serviceIdsForProjects', '()', (x) => x.projects.serviceIdsForProjects());

	// --- services ---
	add('services.all', '()', (x) => x.services.all());
	add('services.byId', `('${serviceId}')`, (x) => x.services.byId(serviceId));
	add('services.byId(unknown)', `('__nope__')`, (x) => x.services.byId('__nope__'));
	add('services.visible', '()', (x) => x.services.visible());
	add('services.adjacent', `('${serviceId}')`, (x) => x.services.adjacent(serviceId));

	// --- blog ---
	add('blog.all', '()', (x) => x.blog.all());
	add('blog.bySlug', `('${blogSlug}')`, (x) => x.blog.bySlug(blogSlug));
	add('blog.html', `('${blogSlug}')`, (x) => x.blog.html(blogSlug));
	add('blog.bodyBySlug', `('${blogSlug}')`, (x) => x.blog.bodyBySlug(blogSlug));
	add('blog.byCategory', `('${primaryCategory}')`, (x) => x.blog.byCategory(primaryCategory));
	add('blog.byTag', `('${tagCategory}','${tagValue}')`, (x) =>
		x.blog.byTag(tagCategory, tagValue),
	);
	add('blog.tagsForCategory', `('${primaryCategory}')`, (x) =>
		x.blog.tagsForCategory(primaryCategory),
	);
	add('blog.languagesForCategory', `('${primaryCategory}')`, (x) =>
		x.blog.languagesForCategory(primaryCategory),
	);
	add('blog.latest', `(3,'${primaryCategory}')`, (x) => x.blog.latest(3, primaryCategory));
	add('blog.resolveSvgFallbackName', `('${blogSlug}','${primaryCategory}')`, (x) =>
		x.blog.resolveSvgFallbackName(blogSlug, primaryCategory),
	);
	add('blog.resolveAnimation', `('${blogSlug}',undefined)`, (x) =>
		x.blog.resolveAnimation(blogSlug, undefined),
	);
	// svgContent / svgContentsForPosts need a BlogPost arg. Use the STATIC post
	// row (identical input to both) so the comparison is apples-to-apples.
	const samplePost = staticBlogPosts[0];
	if (samplePost) {
		add('blog.svgContent', '(staticPost[0])', (x) => x.blog.svgContent(samplePost));
		add('blog.svgContentsForPosts', '(staticPosts[0..2])', (x) =>
			x.blog.svgContentsForPosts(staticBlogPosts.slice(0, 3)),
		);
	}

	// --- meta ---
	add('meta.site', '()', (x) => x.meta.site());
	add('meta.siteSeoDefaults', '()', (x) => x.meta.siteSeoDefaults());
	for (const path of [...staticRouteIds, ...dynamicRoutes.map((r) => r.id)]) {
		add(`meta.routeSeo.byPath`, `('${path}')`, (x) => x.meta.routeSeo.byPath(path));
	}
	for (const id of staticRouteIds) {
		add('meta.forRoute', `('${id}','en')`, (x) => x.meta.forRoute(id, locale));
	}
	for (const r of dynamicRoutes) {
		add('meta.forRoute', `('${r.id}',${JSON.stringify(r.params)})`, (x) =>
			x.meta.forRoute(r.id, locale, r.params),
		);
	}
	add('meta.forRoute', `('/__error','en')`, (x) => x.meta.forRoute('/__error', locale));

	// --- techStack ---
	add('techStack.all', '()', (x) => x.techStack.all());
	add('techStack.byId', `('${techStackId}')`, (x) => x.techStack.byId(techStackId));
	add('techStack.content', `('${techStackId}')`, (x) => x.techStack.content(techStackId));

	// --- content ---
	add('content.hero', '()', (x) => x.content.hero());
	add('content.heroAnim', '()', (x) => x.content.heroAnim());
	add('content.manifesto', '()', (x) => x.content.manifesto());
	add('content.proofReel', '()', (x) => x.content.proofReel());
	add('content.servicesGrid', '()', (x) => x.content.servicesGrid());
	add('content.about', '()', (x) => x.content.about());
	add('content.cta', '()', (x) => x.content.cta());
	add('content.closer', '()', (x) => x.content.closer());
	add('content.navLinks', '()', (x) => x.content.navLinks());
	add('content.menuItems', '()', (x) => x.content.menuItems());
	add('content.errorPage(404)', '(404)', (x) => x.content.errorPage(404));
	add('content.errorPage(500)', '(500)', (x) => x.content.errorPage(500));
	add('content.aboutPage', '()', (x) => x.content.aboutPage());
	add('content.contactPage', '()', (x) => x.content.contactPage());
	add('content.techStackPage', '()', (x) => x.content.techStackPage());
	// heroMock/initialHeroData: heroMock uses faker (non-deterministic by design)
	// so a DIFF there is expected and not meaningful — still invoked + reported,
	// flagged in args so the table reader knows.
	add('content.heroMock', '() [non-deterministic]', (x) => x.content.heroMock());
	add('content.initialHeroData', '()', (x) => x.content.initialHeroData());
	add('content.blogPage', '()', (x) => x.content.blogPage());
	add('content.projectsPage', '()', (x) => x.content.projectsPage());
	add('content.metroSvg', '()', (x) => x.content.metroSvg());
	add('content.morphShapes', '()', (x) => x.content.morphShapes());

	// --- nav ---
	for (const placement of ['header', 'footer', 'mobile', 'menu'] as const) {
		add(`nav.byPlacement`, `('${placement}')`, (x) => x.nav.byPlacement(placement));
	}

	return { steps, derived: { projectSlug, serviceId, blogSlug, techStackId, blogCategories, tagCategory, tagValue, serviceWithProjects } };
}

// ---------------------------------------------------------------------------
// Reporter
// ---------------------------------------------------------------------------

function renderTable(rows: Row[]): string {
	const statusGlyph: Record<Outcome['kind'], string> = {
		MATCH: 'MATCH   ',
		DIFF: 'DIFF    ',
		STATIC_ERR: 'S-ERR   ',
		DIRECTUS_ERR: 'D-ERR   ',
		BOTH_ERR: 'BOTH-ERR',
		SKIP: 'SKIP    ',
	};
	const methodW = Math.min(
		42,
		Math.max(...rows.map((r) => r.method.length), 'METHOD'.length),
	);
	const argsW = Math.min(34, Math.max(...rows.map((r) => r.args.length), 'ARGS'.length));

	const lines: string[] = [];
	lines.push('');
	lines.push('='.repeat(100));
	lines.push(`PARITY HARNESS — static vs directus @ ${PARITY_DIRECTUS_URL}`);
	lines.push('='.repeat(100));
	lines.push(
		`${'STATUS'.padEnd(9)}${'METHOD'.padEnd(methodW + 2)}${'ARGS'.padEnd(argsW + 2)}DETAIL`,
	);
	lines.push('-'.repeat(100));
	for (const r of rows) {
		const detail = r.outcome.kind === 'MATCH' ? '' : r.outcome.detail;
		lines.push(
			`${statusGlyph[r.outcome.kind].padEnd(9)}${r.method
				.slice(0, methodW)
				.padEnd(methodW + 2)}${r.args.slice(0, argsW).padEnd(argsW + 2)}${detail}`,
		);
	}
	lines.push('-'.repeat(100));

	const counts = rows.reduce<Record<string, number>>((acc, r) => {
		acc[r.outcome.kind] = (acc[r.outcome.kind] ?? 0) + 1;
		return acc;
	}, {});
	const summary = Object.entries(counts)
		.map(([k, v]) => `${k}=${v}`)
		.join('  ');
	lines.push(`TOTAL ${rows.length}   ${summary}`);
	lines.push('='.repeat(100));
	lines.push('');
	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// The single run.
// ---------------------------------------------------------------------------

describe.skipIf(!RUN)('content adapter parity (static vs directus)', () => {
	it(
		'invokes every ContentPort method on both adapters and prints MATCH/DIFF',
		async () => {
			const { steps, derived } = buildPlan(staticAdapter, directusAdapter);

			// eslint-disable-next-line no-console
			console.log(
				`[parity] derived args: ${JSON.stringify(derived)}`,
			);

			// Sequential, not Promise.all: keeps the directus-queue burst low and
			// the cold-start cost paid once up front rather than fanned out.
			const rows: Row[] = [];
			for (const step of steps) {
				rows.push(await compareMethod(step.method, step.args, step.s, step.d));
			}

			// eslint-disable-next-line no-console
			console.log(renderTable(rows));

			// Sanity: every method was actually invoked (no silent skips).
			expect(rows.length).toBe(steps.length);
			// Oracle invariant: at least some methods MATCH (proves directus was
			// really reached + the comparison is live, not all-error). This is the
			// ONLY assertion — DIFFs are expected baseline state, not failures.
			const matched = rows.filter((r) => r.outcome.kind === 'MATCH').length;
			expect(matched).toBeGreaterThan(0);
		},
		HARNESS_TIMEOUT_MS,
	);
});

// Visible documentation row when not opted in (mirrors directus.integration.test.ts).
describe.skipIf(RUN)('content adapter parity — guard', () => {
	it('skipped because RUN_PARITY is not set (enable via RUN_PARITY=1)', () => {
		expect(true).toBe(true);
	});
});
