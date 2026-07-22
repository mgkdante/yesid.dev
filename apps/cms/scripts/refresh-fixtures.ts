#!/usr/bin/env bun
/**
 * Refresh the disaster-recovery fixtures from the live DEV CMS.
 *
 * Homework #15: fixtures/collections/{projects,services,blog-posts}.json must
 * MIRROR the real Directus content, not the retired lorem placeholder set.
 * This script reads the dev CMS (read-only) and rewrites the fixture files in
 * the exact shape their seeders consume, so seeding a fresh CMS from the
 * fixtures recreates the live rows:
 *
 *   projects.json   -> scripts/seed-projects.ts   (ProjectsFixtureSchema)
 *   services.json   -> scripts/seed-services.ts   (ServicesFixtureSchema)
 *   blog-posts.json -> scripts/seed-blog-posts.ts (BlogPostsFixtureSchema)
 *   route-seo.json  -> scripts/seed-route-seo.ts  (RouteSeoFixtureSchema)
 *   singletons/site-meta.json -> scripts/seed-site-meta.ts (SiteMetaFixtureSchema)
 *
 * route_seo + site_meta joined the mirror in the homework batch (2026-07-02):
 * both fixture files had rotted against the CMS ("data infrastructure" copy)
 * because nothing refreshed them.
 *
 * Inversions (the seeders' transforms, run backwards):
 *   - Block Editor docs flatten to plain text, paragraphs joined by blank
 *     lines: the inverse of wrapPlainText. Rich blocks (image, code, list)
 *     flatten best-effort because the fixture schema models plain strings.
 *   - hero_image / cover_image file UUIDs map back to their legacy paths via
 *     fixtures/assets-id-map.json (inverse of assetIdForOrUndefined). An
 *     unmapped UUID emits null and logs a warning.
 *   - stack / tags / related services come from the normalized M2M junctions,
 *     flattened to the string arrays the fixture schema expects.
 *   - Fields the fixture schema does not model (hero_image_light, project
 *     svg_illustration, etc.) are dropped.
 *
 * Rows whose id starts with "lorem-" are skipped (belt and braces: the live
 * CMS should no longer carry any) and logged when seen.
 *
 * DEV-ONLY (assertDevCms). Read-only against Directus: the script writes ONLY
 * the local fixture JSON files, and every emitted row set is validated against
 * the seeders' zod schemas before anything touches disk.
 *
 * Usage (repo root):
 *   op run --env-file=apps/cms/.env -- bun run --cwd apps/cms fixtures:refresh
 *   ... fixtures:refresh --dry-run    # fetch + validate + report, no writes
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readItems, readSingleton } from '@directus/sdk';
import type { BlockEditorDoc } from '@repo/shared';
import { BlockEditorDocSchema } from '@repo/shared';
import idMap from '../fixtures/assets-id-map.json' with { type: 'json' };
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { parseSeedFlags, runMain } from './lib/cli';
import {
	mapLocalizedRepeater,
	mapLocalizedField,
	toLocalizedFields,
} from './lib/locale';
import {
	stackFromTechM2M,
	tagsFromM2M,
	type DirectusTagJunctionRow,
	type DirectusTechStackJunctionRow,
} from './lib/fetchers/projects';
import { ProjectsFixtureSchema, type ProjectFixture } from './seed-projects';
import { ServicesFixtureSchema, type Service } from './seed-services';
import { BlogPostsFixtureSchema } from './seed-blog-posts';
import { RouteSeoFixtureSchema } from './seed-route-seo';
import { SiteMetaFixtureSchema } from './seed-site-meta';

const log = createLogger('refresh-fixtures');

const FIXTURES_DIR = join(import.meta.dir, '../fixtures/collections');
const SINGLETONS_DIR = join(import.meta.dir, '../fixtures/singletons');

// --- Inverse helpers --------------------------------------------------------

/** file UUID -> legacy path (inverse of fixtures/assets-id-map.json). */
const legacyPathByUuid = new Map<string, string>(
	Object.entries(idMap as Record<string, string>).map(([path, uuid]) => [uuid, path]),
);

function legacyPathFor(uuid: string | null | undefined, context: string): string | null {
	if (!uuid) return null;
	const path = legacyPathByUuid.get(uuid);
	if (!path) {
		log.warn(`${context}: file ${uuid} has no legacy path in assets-id-map.json; emitting null`);
		return null;
	}
	return path;
}

interface NestedListItemLike {
	content?: string;
	items?: NestedListItemLike[];
}

function nestedListToText(items: NestedListItemLike[]): string {
	const parts: string[] = [];
	for (const item of items) {
		if (item.content) parts.push(item.content);
		if (item.items && item.items.length > 0) parts.push(nestedListToText(item.items));
	}
	return parts.filter((p) => p.length > 0).join('\n');
}

/**
 * Flatten one Editor.js block to plain text. Best-effort for block types the
 * plain-string fixture cannot represent structurally (code, lists, images).
 */
function blockToText(block: { type: string; data: unknown }): string {
	const data = (block.data ?? {}) as Record<string, unknown>;
	switch (block.type) {
		case 'paragraph':
		case 'header':
			return typeof data.text === 'string' ? data.text : '';
		case 'code':
			return typeof data.code === 'string' ? data.code : '';
		case 'quote': {
			const text = typeof data.text === 'string' ? data.text : '';
			const caption = typeof data.caption === 'string' ? data.caption : '';
			return caption ? `${text}\n${caption}` : text;
		}
		case 'nestedlist':
			return Array.isArray(data.items) ? nestedListToText(data.items as NestedListItemLike[]) : '';
		case 'image':
			return typeof data.caption === 'string' ? data.caption : '';
		default:
			return '';
	}
}

/**
 * BlockEditorDoc -> plain text. Inverse of wrapPlainText for paragraph-only
 * docs (the seeders re-wrap on blank lines); lossy for richer docs.
 */
function blocksToPlainText(doc: BlockEditorDoc | null | undefined): string {
	if (!doc || !Array.isArray(doc.blocks)) return '';
	return doc.blocks
		.map((b) => blockToText(b as { type: string; data: unknown }))
		.filter((t) => t.length > 0)
		.join('\n\n');
}

/** Timestamp -> date-only string (fixture style), passing null through. */
function dateOnly(value: string | null | undefined): string | null {
	if (!value) return null;
	return value.split('T')[0] ?? null;
}

/** Empty/whitespace strings -> null (the schemas treat absent as null). */
function compactOrNull(value: string | null | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function isLorem(id: string): boolean {
	return id.startsWith('lorem-');
}

/** Split rows into keep/skip on the lorem- prefix and log any skips. */
function dropLorem<T extends { id: string }>(rows: readonly T[], collection: string): T[] {
	const lorem = rows.filter((r) => isLorem(r.id));
	if (lorem.length > 0) {
		log.warn(
			`${collection}: skipped ${lorem.length} lorem row(s) still in the CMS: ${lorem.map((r) => r.id).join(', ')}`,
		);
	}
	return rows.filter((r) => !isLorem(r.id));
}

// --- Raw Directus row shapes (only the fields this script reads) ------------

interface RawTranslation {
	languages_code: 'en' | 'fr' | 'es';
	[key: string]: unknown;
}

interface RawSortableWithTranslations {
	sort: number | null;
	translations?: RawTranslation[];
}

interface RawProjectImpactMetric extends RawSortableWithTranslations {
	value: string;
	before: string | null;
}

interface RawProjectServiceJunction {
	id: number;
	service_id: string;
}

interface RawProject {
	id: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	sort: number | null;
	featured: boolean;
	hero_image: string | null;
	repo_url: string | null;
	repo_private: boolean | null;
	live_url: string | null;
	readme_url: string | null;
	location: string | null;
	environment: string | null;
	version: string | null;
	translations?: RawTranslation[];
	sections?: RawSortableWithTranslations[];
	impact_metrics?: RawProjectImpactMetric[];
	services?: RawProjectServiceJunction[];
	tech_stack?: DirectusTechStackJunctionRow[];
	tags?: DirectusTagJunctionRow[];
}

interface RawService {
	id: string;
	station: number;
	svg: string | null;
	visible: boolean | null;
	translations?: RawTranslation[];
	deliverables?: RawSortableWithTranslations[];
	sections?: RawSortableWithTranslations[];
	tech_stack?: DirectusTechStackJunctionRow[];
}

interface RawProjectsServicesRow {
	project_id: string;
	service_id: string;
}

export interface RawBlogPost {
	id: string;
	translation_key: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	date_modified: string | null;
	sort: number | null;
	lang: 'en' | 'fr' | 'es';
	category: 'professional' | 'personal';
	tags?: DirectusTagJunctionRow[];
	external: boolean;
	url: string | null;
	cover_image: string | null;
	svg_illustration: string | null;
	animation: 'draw' | 'morph' | 'draw-fill';
	title: string;
	excerpt: string;
	seo_title: string | null;
	seo_description: string | null;
	body: unknown;
}

// --- Row -> fixture transforms (key order mirrors the committed fixtures) ---

function str(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function toProjectFixture(row: RawProject): ProjectFixture {
	return {
		id: row.id,
		status: row.status,
		date_published: row.date_published,
		sort: row.sort ?? 0,
		featured: row.featured,
		hero_image_legacy_path: legacyPathFor(row.hero_image, `projects/${row.id} hero_image`),
		repo_url: row.repo_url,
		repo_private: row.repo_private ?? false,
		live_url: row.live_url,
		readme_url: row.readme_url,
		location: row.location,
		environment: row.environment,
		version: row.version,
		stack: stackFromTechM2M(row.tech_stack),
		tags: tagsFromM2M(row.tags),
		translations: (row.translations ?? []).map((t) => ({
			languages_code: t.languages_code,
			title: str(t.title),
			one_liner: str(t.one_liner),
			description: blocksToPlainText(t.description as BlockEditorDoc | null),
		})),
		sections: mapLocalizedRepeater(row.sections, (s) => ({
			sort: s.sort ?? 0,
			translations: (s.translations ?? []).map((t) => ({
				languages_code: t.languages_code,
				title: str(t.title),
				content: blocksToPlainText(t.content as BlockEditorDoc | null),
			})),
		})),
		impact_metrics: mapLocalizedRepeater(row.impact_metrics, (m) => ({
			sort: m.sort ?? 0,
			value: m.value,
			before: m.before,
			translations: (m.translations ?? []).map((t) => ({
				languages_code: t.languages_code,
				label: str(t.label),
			})),
		})),
		related_services: (row.services ?? []).map((j) => j.service_id),
	};
}

function toServiceFixture(row: RawService, relatedProjects: readonly string[]): Service {
	const translations = row.translations ?? [];
	const service: Service = {
		id: row.id,
		...toLocalizedFields(translations, ['title', 'description']),
		station: row.station,
		visible: row.visible ?? true,
		relatedProjects: [...relatedProjects],
	};
	Object.assign(
		service,
		toLocalizedFields(translations, [
			['subtitle', 'subtitle', 'optional'],
			['longDescription', 'long_description', 'optional'],
		]),
	);
	if (row.svg) service.svg = row.svg;
	Object.assign(
		service,
		toLocalizedFields(translations, [
			['benefitHeadline', 'benefit_headline', 'optional'],
			['valueProposition', 'value_proposition', 'optional'],
		]),
	);
	const impactMetric = toLocalizedFields(translations, [
		['value', 'impact_metric_value', 'optional'],
		['label', 'impact_metric_label', 'optional'],
	]);
	if (impactMetric.value && impactMetric.label) {
		service.impactMetric = { value: impactMetric.value, label: impactMetric.label };
	}
	const deliverables = mapLocalizedField(row.deliverables, 'label');
	if (deliverables.length > 0) service.deliverables = deliverables;
	const stack = stackFromTechM2M(row.tech_stack);
	if (stack.length > 0) service.stack = stack;
	const sections = mapLocalizedRepeater(row.sections, (s) =>
		toLocalizedFields(s.translations ?? [], ['title', 'content']),
	);
	if (sections.length > 0) service.sections = sections;

	// Rebuild with the committed fixture's key order so diffs stay readable.
	const ordered: Service = {
		id: service.id,
		title: service.title,
		...(service.subtitle ? { subtitle: service.subtitle } : {}),
		description: service.description,
		...(service.longDescription ? { longDescription: service.longDescription } : {}),
		station: service.station,
		...(service.svg ? { svg: service.svg } : {}),
		visible: service.visible,
		...(service.benefitHeadline ? { benefitHeadline: service.benefitHeadline } : {}),
		...(service.impactMetric ? { impactMetric: service.impactMetric } : {}),
		relatedProjects: service.relatedProjects,
		...(service.valueProposition ? { valueProposition: service.valueProposition } : {}),
		...(service.deliverables ? { deliverables: service.deliverables } : {}),
		...(service.stack ? { stack: service.stack } : {}),
		...(service.sections ? { sections: service.sections } : {}),
	};
	return ordered;
}

export interface BlogPostFixtureRow {
	id: string;
	translation_key: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	date_modified: string | null;
	sort: number;
	lang: 'en' | 'fr' | 'es';
	category: 'professional' | 'personal';
	tags: string[];
	external: boolean;
	url: string | null;
	cover_image_legacy_path: string | null;
	svg_illustration_id: string | null;
	animation: 'draw' | 'morph' | 'draw-fill';
	title: string;
	excerpt: string;
	seo_title: string | null;
	seo_description: string | null;
	body: unknown;
}

export function toBlogPostFixture(row: RawBlogPost): BlogPostFixtureRow {
	return {
		id: row.id,
		translation_key: row.translation_key,
		status: row.status,
		date_published: dateOnly(row.date_published),
		date_modified: dateOnly(row.date_modified),
		sort: row.sort ?? 0,
		lang: row.lang,
		category: row.category,
		tags: tagsFromM2M(row.tags),
		external: row.external,
		url: row.external ? row.url : null,
		cover_image_legacy_path: legacyPathFor(row.cover_image, `blog_posts/${row.id} cover_image`),
		svg_illustration_id: row.svg_illustration,
		animation: row.animation,
		title: row.title,
		excerpt: row.excerpt,
		seo_title: compactOrNull(row.seo_title),
		seo_description: compactOrNull(row.seo_description),
		body: row.body,
	};
}

// --- JSON emitters (match each committed fixture's formatting) --------------

/**
 * Tab-indented JSON with primitive arrays inlined on one line, e.g.
 * `"stack": ["SvelteKit", "Vercel"]`. Matches the committed projects.json.
 */
function stringifyInlinePrimitiveArrays(value: unknown, depth = 0): string {
	const pad = '\t'.repeat(depth);
	const childPad = '\t'.repeat(depth + 1);
	if (Array.isArray(value)) {
		if (value.length === 0) return '[]';
		const allPrimitive = value.every(
			(v) => v === null || ['string', 'number', 'boolean'].includes(typeof v),
		);
		if (allPrimitive) return `[${value.map((v) => JSON.stringify(v)).join(', ')}]`;
		const items = value.map((v) => childPad + stringifyInlinePrimitiveArrays(v, depth + 1));
		return `[\n${items.join(',\n')}\n${pad}]`;
	}
	if (value !== null && typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>).filter(
			([, v]) => v !== undefined,
		);
		if (entries.length === 0) return '{}';
		const items = entries.map(
			([k, v]) => `${childPad}${JSON.stringify(k)}: ${stringifyInlinePrimitiveArrays(v, depth + 1)}`,
		);
		return `{\n${items.join(',\n')}\n${pad}}`;
	}
	return JSON.stringify(value);
}

function countRows(filePath: string): number | null {
	try {
		const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as unknown;
		return Array.isArray(parsed) ? parsed.length : null;
	} catch {
		return null;
	}
}

function writeFixture(filename: string, content: string, rows: number, dryRun: boolean): void {
	const filePath = join(FIXTURES_DIR, filename);
	const before = countRows(filePath);
	if (dryRun) {
		log.info(`dry-run: would write ${filename} (${before ?? '?'} -> ${rows} rows)`);
		return;
	}
	writeFileSync(filePath, content, 'utf-8');
	log.info(`wrote ${filename} (${before ?? '?'} -> ${rows} rows)`);
}

function writeSingletonFixture(filename: string, content: string, dryRun: boolean): void {
	const filePath = join(SINGLETONS_DIR, filename);
	if (dryRun) {
		log.info(`dry-run: would write singletons/${filename}`);
		return;
	}
	writeFileSync(filePath, content, 'utf-8');
	log.info(`wrote singletons/${filename}`);
}

// --- route_seo + site_meta raw shapes and transforms -------------------------

const LOCALE_ORDER = ['en', 'fr', 'es'] as const;

function byLocale<T extends { languages_code: string }>(rows: readonly T[]): T[] {
	return [...rows].sort(
		(a, b) =>
			LOCALE_ORDER.indexOf(a.languages_code as (typeof LOCALE_ORDER)[number]) -
			LOCALE_ORDER.indexOf(b.languages_code as (typeof LOCALE_ORDER)[number]),
	);
}

interface RawRouteSeoTranslation {
	languages_code: 'en' | 'fr' | 'es';
	title: string | null;
	description: string | null;
}

interface RawRouteSeo {
	path: string;
	og_image: string | null;
	status: 'draft' | 'published' | 'archived';
	sort: number | null;
	translations?: RawRouteSeoTranslation[];
}

function toRouteSeoFixture(row: RawRouteSeo) {
	return {
		path: row.path,
		og_image: row.og_image,
		status: row.status,
		sort: row.sort ?? 0,
		translations: byLocale(row.translations ?? []).map((t) => ({
			languages_code: t.languages_code,
			title: compactOrNull(t.title),
			description: compactOrNull(t.description),
		})),
	};
}

interface RawSiteMetaTranslation {
	languages_code: 'en' | 'fr' | 'es';
	tagline: string | null;
	description: string | null;
	default_description: string | null;
	owner_job_title: string | null;
}

interface RawSiteMeta {
	id: number;
	name: string;
	email: string;
	github_url: string;
	linkedin_url: string | null;
	upwork_url: string | null;
	owner_name: string;
	owner_locality: string;
	owner_region: string;
	owner_country: string;
	owner_phone: string | null;
	owner_knows_about: string[] | string | null;
	default_og_image: string | null;
	theme_color: string;
	translations?: RawSiteMetaTranslation[];
}

/** Key order mirrors the committed singletons/site-meta.json for readable diffs. */
function toSiteMetaFixture(row: RawSiteMeta) {
	const knows = Array.isArray(row.owner_knows_about)
		? row.owner_knows_about.join(',')
		: (row.owner_knows_about ?? '');
	return {
		id: 1,
		name: row.name,
		email: row.email,
		github_url: row.github_url,
		linkedin_url: row.linkedin_url,
		upwork_url: row.upwork_url,
		owner_name: row.owner_name,
		owner_locality: row.owner_locality,
		owner_region: row.owner_region,
		owner_country: row.owner_country,
		owner_knows_about: knows,
		default_og_image: row.default_og_image,
		theme_color: row.theme_color,
		translations: byLocale(row.translations ?? []).map((t) => ({
			languages_code: t.languages_code,
			tagline: t.tagline ?? '',
			description: t.description ?? '',
			default_description: t.default_description ?? '',
			owner_job_title: t.owner_job_title ?? '',
		})),
	};
}

// --- Main --------------------------------------------------------------------

async function main(): Promise<void> {
	const { dryRun } = parseSeedFlags();
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	log.info(`source CMS: ${directusUrl}${dryRun ? ' [dry-run]' : ''} (read-only)`);

	const token = await getAdminToken(directusUrl);
	const client = createClient(directusUrl, token);

	const [rawProjects, rawServices, junction, rawPosts, rawRouteSeo, rawSiteMeta] = await Promise.all([
		client.request(
			readItems('projects', {
				fields: [
					'*',
					{ translations: ['*'] } as unknown as string,
					{ sections: ['id', 'sort', { translations: ['*'] }] } as unknown as string,
					{ impact_metrics: ['id', 'sort', 'value', 'before', { translations: ['*'] }] } as unknown as string,
					{ services: ['id', 'service_id'] } as unknown as string,
					{ tech_stack: ['sort', { tech_stack_id: ['id', 'name'] }] } as unknown as string,
					{ tags: ['sort', { tags_id: ['id'] }] } as unknown as string,
				],
				sort: ['sort'],
				limit: -1,
			}),
		) as Promise<unknown> as Promise<RawProject[]>,
		client.request(
			readItems('services', {
				fields: [
					'*',
					{ translations: ['*'] } as unknown as string,
					{ deliverables: ['id', 'sort', { translations: ['*'] }] } as unknown as string,
					{ sections: ['id', 'sort', { translations: ['*'] }] } as unknown as string,
					{ tech_stack: ['sort', { tech_stack_id: ['id', 'name'] }] } as unknown as string,
				],
				sort: ['station'],
				limit: -1,
			}),
		) as Promise<unknown> as Promise<RawService[]>,
		client.request(
			readItems('projects_services', {
				fields: ['project_id', 'service_id'],
				limit: -1,
			}),
		) as Promise<unknown> as Promise<RawProjectsServicesRow[]>,
		client.request(
			readItems('blog_posts', {
				fields: [
					'*',
					{ tags: ['sort', { tags_id: ['id'] }] } as unknown as string,
				],
				sort: ['id'],
				limit: -1,
			}),
		) as Promise<unknown> as Promise<RawBlogPost[]>,
		client.request(
			readItems('route_seo', {
				fields: [
					'path',
					'og_image',
					'status',
					'sort',
					{ translations: ['languages_code', 'title', 'description'] } as unknown as string,
				],
				sort: ['sort'],
				limit: -1,
			}),
		) as Promise<unknown> as Promise<RawRouteSeo[]>,
		client.request(
			readSingleton('site_meta', {
				fields: [
					'*',
					{
						translations: [
							'languages_code',
							'tagline',
							'description',
							'default_description',
							'owner_job_title',
						],
					} as unknown as string,
				],
			}),
		) as Promise<unknown> as Promise<RawSiteMeta>,
	]);

	log.info(
		`fetched: ${rawProjects.length} projects, ${rawServices.length} services, ` +
			`${junction.length} junction rows, ${rawPosts.length} blog posts`,
	);

	// projects_services grouped by service, skipping lorem projects everywhere.
	const projectsByService = new Map<string, string[]>();
	for (const j of junction) {
		if (isLorem(j.project_id)) continue;
		const list = projectsByService.get(j.service_id) ?? [];
		list.push(j.project_id);
		projectsByService.set(j.service_id, list);
	}

	const projects = dropLorem(rawProjects, 'projects').map((row) => ({
		...toProjectFixture(row),
		related_services: (row.services ?? [])
			.map((j) => j.service_id)
			.filter((sid) => !isLorem(sid)),
	}));
	const services = dropLorem(rawServices, 'services').map((row) =>
		toServiceFixture(row, projectsByService.get(row.id) ?? []),
	);
	const posts = dropLorem(rawPosts, 'blog_posts').map(toBlogPostFixture);
	const routeSeo = rawRouteSeo.map(toRouteSeoFixture);
	const siteMeta = toSiteMetaFixture(rawSiteMeta);

	// Validate against the seeders' schemas before writing anything.
	ProjectsFixtureSchema.parse(projects);
	ServicesFixtureSchema.parse(services);
	BlogPostsFixtureSchema.parse(posts);
	RouteSeoFixtureSchema.parse(routeSeo);
	SiteMetaFixtureSchema.parse(siteMeta);
	for (const p of posts) {
		const result = BlockEditorDocSchema.safeParse(p.body);
		if (!result.success) {
			throw new Error(
				`blog_posts/${p.id}: body fails BlockEditorDocSchema: ${JSON.stringify(result.error.issues)}`,
			);
		}
	}

	// Referential sanity: every related service the projects point at exists.
	const serviceIds = new Set(services.map((s) => s.id));
	for (const p of projects) {
		for (const sid of p.related_services) {
			if (!serviceIds.has(sid)) {
				throw new Error(`projects/${p.id}: related service "${sid}" missing from services fixture`);
			}
		}
	}

	writeFixture(
		'projects.json',
		`${stringifyInlinePrimitiveArrays(projects)}\n`,
		projects.length,
		dryRun,
	);
	writeFixture('services.json', `${JSON.stringify(services, null, '\t')}\n`, services.length, dryRun);
	writeFixture('blog-posts.json', `${JSON.stringify(posts, null, 2)}\n`, posts.length, dryRun);
	writeFixture('route-seo.json', `${JSON.stringify(routeSeo, null, '\t')}\n`, routeSeo.length, dryRun);
	writeSingletonFixture('site-meta.json', `${JSON.stringify(siteMeta, null, '\t')}\n`, dryRun);

	log.info(dryRun ? 'dry-run complete (no files written).' : 'done.');
}

runMain(main, import.meta);
