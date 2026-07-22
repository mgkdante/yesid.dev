import { describe, expect, it } from 'bun:test';
import {
	BLOG_EDITORIAL_FAMILIES,
	EXPECTED_ROW_COUNT,
	PROD_CONFIRMATION,
	TARGET_URLS,
	applyAndVerify,
	buildDatePlan,
	createDateCms,
	formatDatePlan,
	normalizeEditorialDate,
	parseCli,
	type BlogDateRow,
	type DateCms,
	type DatePatch,
} from '../scripts/reconcile-blog-editorial-dates';

function staleRows(): BlogDateRow[] {
	return BLOG_EDITORIAL_FAMILIES.flatMap((family) =>
		(['en', 'fr', 'es'] as const).map((lang) => ({
			id: family.ids[lang],
			translation_key: family.translationKey,
			lang,
			status: 'published' as const,
			date_published: '2026-07-11T00:00:00.000Z',
			date_modified: '2026-07-11T00:00:00.000Z',
		})),
	);
}

describe('blog editorial date schedule', () => {
	it('pins six chapter dates and eighteen exact rows', () => {
		expect(BLOG_EDITORIAL_FAMILIES.map((family) => family.date)).toEqual([
			'2026-06-01',
			'2026-06-09',
			'2026-06-17',
			'2026-06-25',
			'2026-07-03',
			'2026-07-11',
		]);
		expect(EXPECTED_ROW_COUNT).toBe(18);
	});

	it('normalizes date-only values to noon UTC', () => {
		expect(normalizeEditorialDate('2026-06-01')).toBe(
			'2026-06-01T12:00:00.000Z',
		);
	});

	it('plans exactly eighteen date-only patches without date_modified', () => {
		const plan = buildDatePlan(staleRows());
		expect(plan).toHaveLength(18);
		expect(
			plan.every((patch) =>
				Object.keys(patch).sort().join(',') === 'date_published,id',
			),
		).toBe(true);
		expect(new Set(plan.map((patch) => patch.id)).size).toBe(18);
	});

	it('gives every locale in a family the same timestamp', () => {
		const plan = buildDatePlan(staleRows());
		for (const family of BLOG_EDITORIAL_FAMILIES) {
			const timestamps = plan
				.filter((patch) => Object.values(family.ids).includes(patch.id))
				.map((patch) => patch.date_published);
			expect(new Set(timestamps)).toEqual(
				new Set([normalizeEditorialDate(family.date)]),
			);
		}
	});

	it('converges to an empty plan', () => {
		const converged = staleRows().map((row) => {
			const family = BLOG_EDITORIAL_FAMILIES.find(
				(candidate) => candidate.translationKey === row.translation_key,
			)!;
			return {
				...row,
				date_published: normalizeEditorialDate(family.date),
			};
		});
		expect(buildDatePlan(converged)).toEqual([]);
	});

	it('refuses missing, duplicate, wrong-locale, wrong-id, and draft rows', () => {
		const rows = staleRows();
		expect(() => buildDatePlan(rows.slice(1))).toThrow(/exactly 18/);
		expect(() => buildDatePlan([...rows.slice(0, -1), rows[0]!])).toThrow(
			/duplicate row id/,
		);
		expect(() =>
			buildDatePlan([{ ...rows[0]!, lang: 'fr' }, ...rows.slice(1)]),
		).toThrow(/locale ownership/);
		expect(() =>
			buildDatePlan([{ ...rows[0]!, id: 'unexpected' }, ...rows.slice(1)]),
		).toThrow(/row ownership/);
		expect(() =>
			buildDatePlan([{ ...rows[0]!, status: 'draft' }, ...rows.slice(1)]),
		).toThrow(/must be published/);
	});
});

describe('blog editorial date CLI', () => {
	it('defaults to dry-run and pins both CMS URLs', () => {
		expect(parseCli(['--target=dev'])).toEqual({ target: 'dev', apply: false });
		expect(parseCli(['--target', 'dev'])).toEqual({ target: 'dev', apply: false });
		expect(TARGET_URLS).toEqual({
			dev: 'https://cms.dev.yesid.dev',
			prod: 'https://cms.yesid.dev',
		});
	});

	it('requires the exact confirmation for PROD apply', () => {
		expect(() => parseCli(['--target=prod', '--apply'])).toThrow(
			new RegExp(PROD_CONFIRMATION),
		);
		expect(
			parseCli([
				'--target=prod',
				'--apply',
				`--confirm=${PROD_CONFIRMATION}`,
			]),
		).toEqual({ target: 'prod', apply: true });
		expect(
			parseCli(['--target', 'prod', '--apply', '--confirm', PROD_CONFIRMATION]),
		).toEqual({ target: 'prod', apply: true });
	});

	it('rejects contradictory or irrelevant flags', () => {
		expect(() =>
			parseCli(['--target=dev', '--apply', '--dry-run']),
		).toThrow(/choose one/);
		expect(() =>
			parseCli(['--target=dev', `--confirm=${PROD_CONFIRMATION}`]),
		).toThrow(/PROD apply/);
		expect(() => parseCli(['--target=staging'])).toThrow(/dev\|prod/);
	});
});

function fakeCms(before: BlogDateRow[], after: BlogDateRow[]): {
	cms: DateCms;
	patchCalls: DatePatch[][];
} {
	let reads = 0;
	const patchCalls: DatePatch[][] = [];
	return {
		cms: {
			read: async () => (reads++ === 0 ? before : after),
			patch: async (patches) => {
				patchCalls.push(patches.map((patch) => ({ ...patch })));
			},
		},
		patchCalls,
	};
}

describe('blog editorial date apply verification', () => {
	it('writes only the displayed plan and verifies convergence', async () => {
		const before = staleRows();
		const after = before.map((row) => {
			const family = BLOG_EDITORIAL_FAMILIES.find(
				(candidate) => candidate.translationKey === row.translation_key,
			)!;
			return { ...row, date_published: normalizeEditorialDate(family.date) };
		});
		const plan = buildDatePlan(before);
		const { cms, patchCalls } = fakeCms(before, after);
		await expect(applyAndVerify(cms, plan)).resolves.toEqual(plan);
		expect(patchCalls).toEqual([plan]);
		expect(patchCalls[0]).toHaveLength(18);
	});

	it('refuses a changed pre-apply state and stale post-apply state', async () => {
		const before = staleRows();
		const plan = buildDatePlan(before);
		const changed = structuredClone(before);
		changed[0]!.date_published = normalizeEditorialDate(
			BLOG_EDITORIAL_FAMILIES[0]!.date,
		);
		await expect(
			applyAndVerify(fakeCms(changed, changed).cms, plan),
		).rejects.toThrow(/state changed before apply/);
		await expect(
			applyAndVerify(fakeCms(before, before).cms, plan),
		).rejects.toThrow(/post-apply verification/);
	});

	it('formats a bounded plan without content fields', () => {
		const output = formatDatePlan(buildDatePlan(staleRows()));
		expect(output).toContain('18 date_published patches');
		expect(output).not.toMatch(/body|title|date_modified|delete|create/i);
	});
});

interface CommandDescriptor {
	path: string;
	params: unknown;
	body?: string;
	method: string;
}

describe('blog editorial date Directus adapter', () => {
	it('builds the exact GET and date-only batch PATCH descriptors', async () => {
		const commands: CommandDescriptor[] = [];
		const client = {
			request: async (command: () => CommandDescriptor) => {
				const descriptor = command();
				commands.push(descriptor);
				return descriptor.method === 'GET' ? staleRows() : undefined;
			},
		};
		const cms = createDateCms(client as never);
		const rows = await cms.read();
		const patches = buildDatePlan(rows);
		await cms.patch(patches);

		expect(commands[0]).toEqual({
			path: '/items/blog_posts',
			params: {
				fields: [
					'id',
					'translation_key',
					'lang',
					'status',
					'date_published',
					'date_modified',
				],
				filter: {
					translation_key: {
						_in: BLOG_EDITORIAL_FAMILIES.map(
							(family) => family.translationKey,
						),
					},
				},
				sort: ['translation_key', 'lang', 'id'],
				limit: -1,
			},
			method: 'GET',
		});
		expect(commands[1]).toEqual({
			path: '/items/blog_posts',
			params: {},
			body: JSON.stringify(patches),
			method: 'PATCH',
		});
		expect(patches).toHaveLength(18);
		expect(
			(JSON.parse(commands[1]!.body!) as Record<string, unknown>[]).every(
				(patch) =>
					Object.keys(patch).sort().join(',') === 'date_published,id',
			),
		).toBe(true);
	});
});
