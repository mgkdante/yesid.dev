#!/usr/bin/env bun
/**
 * Adds CMS-backed per-post SEO controls to blog_posts.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to write schema and copy.
 */

import { createField, readFieldsByCollection, updateItem } from '@directus/sdk';
import { getAdminToken } from './lib/auth';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';

const COLLECTION = 'blog_posts';

const REAL_FIELDS = ['seo_title', 'seo_description', 'date_modified'] as const;
type RealField = (typeof REAL_FIELDS)[number];

const POSTS: Record<string, Record<RealField, string>> = {
	'why-i-left-orm-for-raw-sql': {
		seo_title: 'Raw SQL for PostgreSQL Control',
		seo_description:
			'Why raw SQL can beat ORM abstractions for PostgreSQL work when control, performance, and readable query behavior matter.',
		date_modified: '2026-04-01',
	},
	'building-a-transit-pipeline': {
		seo_title: 'Transit Data Pipeline with PostgreSQL and Python',
		seo_description:
			'A technical case study of a real-time transit data pipeline using GTFS feeds, PostgreSQL, Python, and dashboard-ready analytics for operations.',
		date_modified: '2026-03-15',
	},
	'anime-data-viz-challenge': {
		seo_title: 'Anime Data Visualization with SQL and Power BI',
		seo_description:
			'A data storytelling exercise using MyAnimeList data, SQL, and Power BI to compare studios, episode counts, genres, and long-term anime trends.',
		date_modified: '2026-03-01',
	},
};

function groupField() {
	return {
		field: 'grp_seo',
		type: 'alias',
		meta: {
			interface: 'group-detail',
			width: 'full',
			sort: 30,
			note: 'Search and share metadata',
			options: {
				headerColor: '#E07800',
				start: 'open',
			},
			special: ['alias', 'no-data', 'group'],
		},
	} as const;
}

function fieldConfig(field: RealField) {
	if (field === 'seo_title') {
		return {
			field,
			type: 'string',
			meta: {
				interface: 'input',
				group: 'grp_seo',
				width: 'full',
				sort: 31,
				note: 'Optional search/share title body. The site appends the brand suffix. Keep under 60 characters.',
			},
			schema: { is_nullable: true },
		} as const;
	}

	if (field === 'seo_description') {
		return {
			field,
			type: 'text',
			meta: {
				interface: 'input-multiline',
				group: 'grp_seo',
				width: 'full',
				sort: 32,
				note: 'Optional search/share description. Use 50 to 200 characters.',
			},
			schema: { is_nullable: true },
		} as const;
	}

	return {
		field,
		type: 'timestamp',
		meta: {
			interface: 'datetime',
			group: 'grp_seo',
			width: 'half',
			sort: 33,
			note: 'Optional last-updated date for BlogPosting structured data.',
		},
		schema: { is_nullable: true },
	} as const;
}

async function directusRequest(
	opts: { directusUrl: string; token: string },
	method: string,
	path: string,
	body?: unknown,
): Promise<any> {
	const response = await fetch(`${opts.directusUrl}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${opts.token}`,
			'Content-Type': 'application/json',
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await response.text();
	const json = text ? JSON.parse(text) : null;
	if (response.status >= 400) {
		throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(json)}`);
	}
	return json;
}

async function widenReadPermissions(
	opts: { directusUrl: string; token: string; dryRun?: boolean },
	log: string[],
): Promise<void> {
	const result = await directusRequest(
		opts,
		'GET',
		`/permissions?fields=id,fields&filter[collection][_eq]=${COLLECTION}&filter[action][_eq]=read&limit=-1`,
	);
	const rows = (result.data ?? []) as Array<{ id: number; fields?: string[] | null }>;
	for (const row of rows) {
		if (!Array.isArray(row.fields) || row.fields.includes('*')) {
			log.push(`[skip] permission ${row.id} reads all ${COLLECTION} fields`);
			continue;
		}
		const fields = [...row.fields];
		for (const field of REAL_FIELDS) {
			if (!fields.includes(field)) fields.push(field);
		}
		if (fields.length === row.fields.length) {
			log.push(`[skip] permission ${row.id} already reads Blog SEO fields`);
			continue;
		}
		log.push(`[perm] permission ${row.id}: add ${fields.length - row.fields.length} Blog SEO fields`);
		if (!opts.dryRun) {
			await directusRequest(opts, 'PATCH', `/permissions/${row.id}`, { fields });
		}
	}
}

export async function apply(opts: {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
}): Promise<readonly string[]> {
	const dryRun = opts.dryRun ?? true;
	const client = createClient(opts.directusUrl, opts.token);
	const log: string[] = [];

	const fields = await client.request(readFieldsByCollection(COLLECTION));
	const existing = new Set(fields.map((field) => field.field));

	if (existing.has('grp_seo')) {
		log.push(`[skip] ${COLLECTION}.grp_seo`);
	} else {
		log.push(`[add ] ${COLLECTION}.grp_seo`);
		if (!dryRun) await client.request(createField(COLLECTION, groupField() as never));
	}

	for (const field of REAL_FIELDS) {
		if (existing.has(field)) {
			log.push(`[skip] ${COLLECTION}.${field}`);
			continue;
		}
		log.push(`[add ] ${COLLECTION}.${field}`);
		if (!dryRun) await client.request(createField(COLLECTION, fieldConfig(field) as never));
	}

	for (const [slug, patch] of Object.entries(POSTS)) {
		log.push(`[seed] ${slug}: ${Object.keys(patch).join(', ')}`);
		if (!dryRun) await client.request(updateItem(COLLECTION, slug, patch));
	}

	await widenReadPermissions({ ...opts, dryRun }, log);

	return log;
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	const token = await getAdminToken(directusUrl);
	const log = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN. Re-run with --apply.' : 'APPLIED.'}`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[content-blog-seo] FAILED:', error);
		process.exit(1);
	});
}
