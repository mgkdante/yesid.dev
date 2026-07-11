# Blog Editorial Publication Dates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile the 18 live EN/FR/ES blog rows to six operator-approved, date-only editorial publication dates without changing article content, translation ownership, modification dates, or public time display.

**Architecture:** Add one narrow Directus reconciler whose pure planner owns the six-family schedule and whose I/O adapter can only read the expected rows and batch-patch `date_published`. The command is dry-run by default, requires an exact PROD confirmation, verifies live state after apply, and has no create/delete/content mutation path. Existing CMS export code continues to truncate timestamps to `YYYY-MM-DD` for the public site.

**Tech Stack:** Bun 1.3.x, TypeScript 5.9, Directus SDK 20, Bun test, 1Password CLI, Directus 12, SvelteKit generated fallbacks.

## Global Constraints

- Chapter dates are exact: `2026-06-01`, `2026-06-09`, `2026-06-17`, `2026-06-25`, `2026-07-03`, `2026-07-11`.
- All `en`, `fr`, and `es` rows in one translation family receive the same date.
- Public output remains date-only. Internal Directus values normalize to noon UTC (`T12:00:00.000Z`) to prevent timezone rollover.
- `date_modified` remains unchanged at `2026-07-11`; no patch may contain that field.
- Directus is the content source of truth. Fixtures and web content modules are regenerated only from live CMS state.
- The command may update only `blog_posts.date_published` for the 18 exact row IDs. No create, delete, status, body, title, excerpt, SEO, tag, translation-key, or relation operation exists.
- Dry-run is the default. PROD apply requires `--confirm=APPLY_PROD_BLOG_EDITORIAL_DATES`.
- No DEV/PROD CMS write, push, PR, preview, merge, or deployment before the operator provides the Vercel commercial-plan upgrade receipt.
- Use `OP_TOKEN` from `/home/mgkdante/Yesito/projects/yesid.dev/.env` through `OP_SERVICE_ACCOUNT_TOKEN`, then resolve the repository's `op://` environment references with `op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env`; never print or persist secrets.
- Transit implementation and Transit content remain out of scope.

---

### Task 1: Build the exact schedule and drift-safe planner with TDD

**Files:**

- Create: `apps/cms/scripts/reconcile-blog-editorial-dates.ts`
- Create: `apps/cms/tests/reconcile-blog-editorial-dates.test.ts`

**Interfaces:**

- Produces `BLOG_EDITORIAL_FAMILIES`, `EXPECTED_ROW_COUNT`, `normalizeEditorialDate()`, `BlogDateRow`, `DatePatch`, and `buildDatePlan()`.
- `buildDatePlan(rows: readonly BlogDateRow[]): DatePatch[]` validates exact family/locale/ID ownership and returns only `{ id, date_published }` patches.
- Later tasks consume these exact exports for CLI parsing and live reconciliation.

- [ ] **Step 1: Write the failing pure-contract test**

Create `apps/cms/tests/reconcile-blog-editorial-dates.test.ts` with this initial content:

```ts
import { describe, expect, it } from 'bun:test';
import {
	BLOG_EDITORIAL_FAMILIES,
	EXPECTED_ROW_COUNT,
	buildDatePlan,
	normalizeEditorialDate,
	type BlogDateRow,
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
bun test apps/cms/tests/reconcile-blog-editorial-dates.test.ts
```

Expected: FAIL because `../scripts/reconcile-blog-editorial-dates` does not exist.

- [ ] **Step 3: Implement the pure schedule and planner**

Create `apps/cms/scripts/reconcile-blog-editorial-dates.ts` with these exact public contracts and validation rules:

```ts
#!/usr/bin/env bun

export type BlogLocale = 'en' | 'fr' | 'es';
export type BlogStatus = 'draft' | 'published' | 'archived';

export interface BlogDateFamily {
	translationKey: string;
	date: string;
	ids: Record<BlogLocale, string>;
}

export interface BlogDateRow {
	id: string;
	translation_key: string;
	lang: BlogLocale;
	status: BlogStatus;
	date_published: string | null;
	date_modified: string | null;
}

export interface DatePatch {
	id: string;
	date_published: string;
}

export const BLOG_EDITORIAL_FAMILIES: readonly BlogDateFamily[] = [
	{
		translationKey: 'the-two-hour-internet-slot',
		date: '2026-06-01',
		ids: {
			en: 'the-two-hour-internet-slot',
			fr: 'le-creneau-internet-de-deux-heures',
			es: 'el-turno-de-dos-horas-para-usar-internet',
		},
	},
	{
		translationKey: 'how-i-learn-orbiting-a-system-until-it-clicks',
		date: '2026-06-09',
		ids: {
			en: 'how-i-learn-orbiting-a-system-until-it-clicks',
			fr: 'comment-japprends-graviter-autour-dun-systeme-jusquau-declic',
			es: 'como-aprendo-orbitar-un-sistema-hasta-que-encaja',
		},
	},
	{
		translationKey: 'thinking-in-matrices',
		date: '2026-06-17',
		ids: {
			en: 'thinking-in-matrices',
			fr: 'penser-en-matrices',
			es: 'pensar-en-matrices',
		},
	},
	{
		translationKey: 'ai-accelerated-human-owned-my-actual-workflow',
		date: '2026-06-25',
		ids: {
			en: 'ai-accelerated-human-owned-my-actual-workflow',
			fr: 'accelere-par-lia-pilote-par-lhumain-mon-vrai-flux-de-travail',
			es: 'acelerado-por-ia-en-manos-humanas-mi-flujo-de-trabajo-real',
		},
	},
	{
		translationKey: '50-to-0-an-oracle-always-free-vm',
		date: '2026-07-03',
		ids: {
			en: '50-to-0-an-oracle-always-free-vm',
			fr: 'de-50-a-0-une-vm-oracle-always-free',
			es: 'de-50-a-0-una-vm-oracle-always-free',
		},
	},
	{
		translationKey: 'does-your-website-need-instant-publishing',
		date: '2026-07-11',
		ids: {
			en: 'does-your-website-need-instant-publishing',
			fr: 'votre-site-web-a-t-il-besoin-dune-publication-instantanee',
			es: 'tu-sitio-web-necesita-publicacion-instantanea',
		},
	},
] as const;

export const EXPECTED_ROW_COUNT = BLOG_EDITORIAL_FAMILIES.length * 3;

export function normalizeEditorialDate(date: string): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error(`[blog-editorial-dates] invalid date ${date}`);
	}
	return `${date}T12:00:00.000Z`;
}

function timestampKey(value: string | null): string | null {
	if (value === null) return null;
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? value : new Date(parsed).toISOString();
}

export function buildDatePlan(rows: readonly BlogDateRow[]): DatePatch[] {
	if (rows.length !== EXPECTED_ROW_COUNT) {
		throw new Error(
			`[blog-editorial-dates] expected exactly ${EXPECTED_ROW_COUNT} rows, received ${rows.length}`,
		);
	}
	const seen = new Set<string>();
	const familyByKey = new Map(
		BLOG_EDITORIAL_FAMILIES.map((family) => [family.translationKey, family]),
	);
	for (const row of rows) {
		if (seen.has(row.id)) {
			throw new Error(`[blog-editorial-dates] duplicate row id ${row.id}`);
		}
		seen.add(row.id);
		const family = familyByKey.get(row.translation_key);
		if (!family) {
			throw new Error(`[blog-editorial-dates] unexpected translation family ${row.translation_key}`);
		}
		if (family.ids[row.lang] !== row.id) {
			const belongsToAnotherLocale = Object.values(family.ids).includes(row.id);
			throw new Error(
				`[blog-editorial-dates] ${belongsToAnotherLocale ? 'locale ownership' : 'row ownership'} mismatch for ${row.id}`,
			);
		}
		if (row.status !== 'published') {
			throw new Error(`[blog-editorial-dates] ${row.id} must be published`);
		}
	}
	for (const family of BLOG_EDITORIAL_FAMILIES) {
		for (const id of Object.values(family.ids)) {
			if (!seen.has(id)) {
				throw new Error(`[blog-editorial-dates] missing expected row ${id}`);
			}
		}
	}
	return rows
		.map((row) => {
			const family = familyByKey.get(row.translation_key)!;
			const desired = normalizeEditorialDate(family.date);
			return timestampKey(row.date_published) === desired
				? null
				: { id: row.id, date_published: desired };
		})
		.filter((patch): patch is DatePatch => patch !== null)
		.sort((a, b) => a.id.localeCompare(b.id));
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
bun test apps/cms/tests/reconcile-blog-editorial-dates.test.ts
```

Expected: all pure schedule/planner tests pass.

- [ ] **Step 5: Commit Task 1**

```bash
git add apps/cms/scripts/reconcile-blog-editorial-dates.ts apps/cms/tests/reconcile-blog-editorial-dates.test.ts
git commit -m "feat(cms): plan blog editorial dates"
```

---

### Task 2: Add the dry-run CLI, narrow Directus adapter, and apply verification with TDD

**Files:**

- Modify: `apps/cms/scripts/reconcile-blog-editorial-dates.ts`
- Modify: `apps/cms/tests/reconcile-blog-editorial-dates.test.ts`

**Interfaces:**

- Consumes the Task 1 planner.
- Produces `TARGET_URLS`, `PROD_CONFIRMATION`, `parseCli()`, `DateCms`, `formatDatePlan()`, and `applyAndVerify()`.
- The command accepts exactly `--target=dev|prod`, optional `--apply` or `--dry-run`, and PROD-only `--confirm=APPLY_PROD_BLOG_EDITORIAL_DATES`.

- [ ] **Step 1: Extend the test with failing CLI and I/O contracts**

Add these imports and tests to `apps/cms/tests/reconcile-blog-editorial-dates.test.ts`:

```ts
import {
	PROD_CONFIRMATION,
	TARGET_URLS,
	applyAndVerify,
	formatDatePlan,
	parseCli,
	type DateCms,
	type DatePatch,
} from '../scripts/reconcile-blog-editorial-dates';

describe('blog editorial date CLI', () => {
	it('defaults to dry-run and pins both CMS URLs', () => {
		expect(parseCli(['--target=dev'])).toEqual({ target: 'dev', apply: false });
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
bun test apps/cms/tests/reconcile-blog-editorial-dates.test.ts
```

Expected: FAIL because the CLI, formatter, and apply interfaces are not exported.

- [ ] **Step 3: Implement the CLI and pure apply boundary**

Add these imports and exports to `apps/cms/scripts/reconcile-blog-editorial-dates.ts`:

```ts
import { parseArgs as parseNodeArgs } from 'node:util';
import { readItems, updateItemsBatch } from '@directus/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { createClient } from './lib/sdk';

export const TARGET_URLS = {
	dev: 'https://cms.dev.yesid.dev',
	prod: 'https://cms.yesid.dev',
} as const;
export const PROD_CONFIRMATION = 'APPLY_PROD_BLOG_EDITORIAL_DATES';

export type Target = keyof typeof TARGET_URLS;
export interface CliOptions {
	target: Target;
	apply: boolean;
}

export function parseCli(argv: readonly string[]): CliOptions {
	const { values } = parseNodeArgs({
		args: [...argv],
		options: {
			target: { type: 'string' },
			apply: { type: 'boolean', default: false },
			'dry-run': { type: 'boolean', default: false },
			confirm: { type: 'string' },
		},
		strict: true,
		allowPositionals: false,
	});
	if (values.target !== 'dev' && values.target !== 'prod') {
		throw new Error('[blog-editorial-dates] required: --target=dev|prod');
	}
	const apply = values.apply === true;
	const dryRun = values['dry-run'] === true;
	if (apply && dryRun) {
		throw new Error('[blog-editorial-dates] choose one: --dry-run or --apply');
	}
	if (values.target === 'prod' && apply) {
		if (values.confirm !== PROD_CONFIRMATION) {
			throw new Error(
				`[blog-editorial-dates] PROD apply requires --confirm=${PROD_CONFIRMATION}`,
			);
		}
	} else if (values.confirm !== undefined) {
		throw new Error('[blog-editorial-dates] --confirm is accepted only for PROD apply');
	}
	return { target: values.target, apply };
}

export interface DateCms {
	read(): Promise<BlogDateRow[]>;
	patch(patches: readonly DatePatch[]): Promise<void>;
}

function samePlan(left: readonly DatePatch[], right: readonly DatePatch[]): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

export function formatDatePlan(plan: readonly DatePatch[]): string {
	if (plan.length === 0) return 'NO CHANGES';
	return [
		`BLOG EDITORIAL DATES: ${plan.length} date_published patches`,
		...plan.map((patch) => `  PATCH ${patch.id} -> ${patch.date_published.slice(0, 10)}`),
	].join('\n');
}

export async function applyAndVerify(
	cms: DateCms,
	displayedPlan: readonly DatePatch[],
): Promise<readonly DatePatch[]> {
	if (displayedPlan.length > EXPECTED_ROW_COUNT) {
		throw new Error('[blog-editorial-dates] patch cap exceeded');
	}
	const currentPlan = buildDatePlan(await cms.read());
	if (!samePlan(currentPlan, displayedPlan)) {
		throw new Error('[blog-editorial-dates] state changed before apply');
	}
	if (displayedPlan.length === 0) return [];
	await cms.patch(displayedPlan);
	const remaining = buildDatePlan(await cms.read());
	if (remaining.length !== 0) {
		throw new Error(
			`[blog-editorial-dates] post-apply verification failed: ${remaining.length} patches remain`,
		);
	}
	return displayedPlan;
}
```

- [ ] **Step 4: Add the fixed Directus adapter and guarded main**

Append the following production boundary to the same script:

```ts
interface DirectusSchema {
	blog_posts: BlogDateRow[];
}

type DirectusDateClient = ReturnType<typeof createClient<DirectusSchema>>;

export function createDateCms(client: DirectusDateClient): DateCms {
	const familyKeys = BLOG_EDITORIAL_FAMILIES.map(
		(family) => family.translationKey,
	);
	return {
		read: async () =>
			(await client.request(
				readItems('blog_posts', {
					fields: [
						'id',
						'translation_key',
						'lang',
						'status',
						'date_published',
						'date_modified',
					],
					filter: { translation_key: { _in: familyKeys } },
					sort: ['translation_key', 'lang', 'id'],
					limit: -1,
				}),
			)) as BlogDateRow[],
		patch: async (patches) => {
			if (patches.length > EXPECTED_ROW_COUNT) {
				throw new Error('[blog-editorial-dates] patch cap exceeded');
			}
			await client.request(
				updateItemsBatch('blog_posts', patches.map((patch) => ({ ...patch }))),
			);
		},
	};
}

async function main(): Promise<void> {
	const options = parseCli(process.argv.slice(2));
	const url = TARGET_URLS[options.target];
	const log = createLogger('blog-editorial-dates');
	log.info(
		`target=${options.target} url=${url} mode=${options.apply ? 'APPLY' : 'DRY-RUN'}`,
	);
	const token = await getAdminToken(url, { allowBuildToken: false });
	const cms = createDateCms(createClient<DirectusSchema>(url, token));
	const plan = buildDatePlan(await cms.read());
	console.log(formatDatePlan(plan));
	if (!options.apply) {
		log.info('dry-run complete: CMS was read; no writes were sent.');
		return;
	}
	await applyAndVerify(cms, plan);
	log.info(`verified ${plan.length} date_published patches; no other fields changed`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[blog-editorial-dates] FAILED:', error);
		process.exit(1);
	});
}
```

- [ ] **Step 5: Run focused and full CMS verification**

Run:

```bash
bun test apps/cms/tests/reconcile-blog-editorial-dates.test.ts
bun run --cwd apps/cms test
```

Expected: focused tests pass and the complete CMS suite remains green.

- [ ] **Step 6: Commit Task 2**

```bash
git add apps/cms/scripts/reconcile-blog-editorial-dates.ts apps/cms/tests/reconcile-blog-editorial-dates.test.ts
git commit -m "feat(cms): reconcile blog editorial dates"
```

---

### Task 3: Document and prove the read-only operational plan

**Files:**

- Create: `apps/cms/ops/blog/blog-editorial-dates.md`

**Interfaces:**

- Consumes the Task 2 command.
- Produces the exact operator runbook for current dry-runs and post-upgrade writes.

- [ ] **Step 1: Write the runbook**

Create `apps/cms/ops/blog/blog-editorial-dates.md` with:

````markdown
# Blog editorial dates

The six article families use operator-selected editorial dates. These are not deployment receipts. Every EN/FR/ES counterpart shares its family date, public output remains date-only, and `date_modified` stays 2026-07-11.

## Approved schedule

1. 2026-06-01 — The two-hour internet slot
2. 2026-06-09 — How I learn: orbiting a system until it clicks
3. 2026-06-17 — Thinking in matrices
4. 2026-06-25 — AI-accelerated, human-owned: my actual workflow
5. 2026-07-03 — $50 to $0: an Oracle Always Free VM
6. 2026-07-11 — Does your website need instant publishing?

## Credential setup

```bash
export OP_SERVICE_ACCOUNT_TOKEN="$(sed -n 's/^OP_TOKEN=//p' /home/mgkdante/Yesito/projects/yesid.dev/.env)"
```

Never print either the service-account token or the resolved Directus token. Unset the service-account token after the command window.

## Read-only dry-runs

```bash
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=dev
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=prod
```

Before apply, each current environment is expected to report exactly 18 `date_published` patches and no other field.

## Write gate

Do not apply, push, open a PR, create a preview, merge, or deploy until the Vercel account reports a commercial plan.

After the gate, reconcile DEV first:

```bash
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=dev --apply
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=dev
```

The second command must report `NO CHANGES`.

PROD apply requires the exact confirmation:

```bash
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts \
    --target=prod \
    --apply \
    --confirm=APPLY_PROD_BLOG_EDITORIAL_DATES
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  bun apps/cms/scripts/reconcile-blog-editorial-dates.ts --target=prod
```

The final PROD command must report `NO CHANGES`.

```bash
unset OP_SERVICE_ACCOUNT_TOKEN
```
````

- [ ] **Step 2: Run current DEV and PROD dry-runs**

Run the credential setup and both read-only commands from the runbook. Expected in each environment:

- exactly 18 `date_published` patches;
- the six approved dates repeated three times each;
- no body, title, status, relation, create, or delete operation;
- no writes sent.

- [ ] **Step 3: Verify repository scope and commit the runbook**

```bash
git diff --check
git status --short
git add apps/cms/ops/blog/blog-editorial-dates.md
git commit -m "docs(blog): add editorial date runbook"
```

Expected: only the reconciler, its test, the design/plan, and this runbook differ from `origin/main`. The branch remains unpushed.

---

### Task 4: After the Vercel upgrade, reconcile CMS and regenerate derived content

**Files:**

- Modify from live DEV CMS: `apps/cms/fixtures/collections/blog-posts.json`
- Modify from live DEV CMS: `apps/web/src/lib/content/blog.ts`
- Modify only if live export changes them: `apps/web/src/lib/content/generated.manifest.json`

**Interfaces:**

- Consumes the operator's Vercel commercial-plan receipt and Tasks 1–3.
- Produces converged DEV/PROD CMS state and regenerated date-only committed fallbacks.

- [ ] **Step 1: Verify the deployment gate**

Read the live Vercel team/account plan and record the commercial-plan receipt in the content-blog Plan. Stop if the account still reports Hobby.

- [ ] **Step 2: Apply and verify DEV**

Use the runbook's DEV apply and convergence commands. Expected: 18 writes, followed by `NO CHANGES`.

- [ ] **Step 3: Regenerate the committed fixture and fallbacks from DEV**

```bash
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev \
  bun run --cwd apps/cms fixtures:refresh
op run --env-file=/home/mgkdante/Yesito/projects/yesid.dev/.env -- \
  env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev \
  bun run --cwd apps/cms export:fallbacks
```

Inspect every changed file. The blog fixture and `blog.ts` must contain the six approved date-only values with three locale rows per family. Treat any unrelated fixture/content diff as a blocker; do not stage or discard it without proving its origin.

- [ ] **Step 4: Verify generated and public contracts locally**

```bash
bun test apps/cms/tests/reconcile-blog-editorial-dates.test.ts
bun test apps/cms/tests/fixture-blog-posts.test.ts
bun test apps/cms/tests/refresh-blog-posts-fixture.test.ts
bun run --cwd apps/cms test
bun run --cwd apps/web test
bun run --cwd apps/web check
```

Verify the fixture and generated module have 18 rows, each translation family has one date, chapter order is newest-first on listings, and BlogPosting `datePublished` remains date-only.

- [ ] **Step 5: Use the reviewed protected-branch release path**

Commit only the verified derived outputs, push the branch, open the reviewed PR to `main`, wait for required checks, merge, reconcile `develop`, and verify the Ready preview/production deployment receipts.

- [ ] **Step 6: Apply and verify PROD**

Use the runbook's exact PROD confirmation and convergence commands. Expected: 18 writes, followed by `NO CHANGES`.

- [ ] **Step 7: Verify all 18 live routes**

Check all EN/FR/ES routes for HTTP 200, visible date, self-canonical, reciprocal hreflang, sitemap membership, BlogPosting `datePublished`, locale switching, mobile rendering, and unchanged article text. Verify order from the SvelteKit `__data.json` payload rather than rendered link scraping.

- [ ] **Step 8: Record the truth boundary**

Update the content-blog Handoff with CMS dry-run/apply receipts, changed row IDs, regenerated files, PR/CI/merge/deploy receipts, and live route evidence. State explicitly that the six dates are operator-selected editorial chronology and that the actual publication/deployment receipts remain July 2026.
