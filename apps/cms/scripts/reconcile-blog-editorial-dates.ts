#!/usr/bin/env bun

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
