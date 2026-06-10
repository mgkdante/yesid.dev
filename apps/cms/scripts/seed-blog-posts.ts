#!/usr/bin/env bun
//
// DONE — one-shot seed, completed (slice-18f Phase 8; banner added in
// slice-28.5, audit #34). blog_posts rows live in Directus and Data Studio is
// the authoring surface; export-fallbacks reads them back at build time. Keep
// for fresh-environment bootstrap only (--dry-run / --reset guarded). Kept
// in-tree per the 27.2 archive-not-delete convention.
//
/**
 * Seed Directus `blog_posts` from `fixtures/collections/blog-posts.json`.
 *
 * Slice 18 18f Phase 8. Mirrors seed-projects shape (lib/* helpers + Zod
 * + dry-run + reset + pure helpers). Uses Editor.js Block Editor JSON for
 * body field.
 *
 * Per AM2.5: blog_posts is mono-language. Flat `title` + `excerpt` on
 * parent. NO translations junction.
 *
 * Per AM1: body is Editor.js { time, blocks, version }.
 */

import { createItem, deleteItem, readItems } from '@directus/sdk';
import { z } from 'zod';
import fixtureData from '../fixtures/collections/blog-posts.json' with { type: 'json' };
import { assetIdForOrUndefined, BlockEditorDocSchema, type BlockEditorDoc } from '@repo/shared';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

// --- Zod ---------------------------------------------------------------
//
// NOTE: Zod v3 cannot embed BlockEditorDocSchema (typed as z.ZodType<T>
// to support recursive NestedListItemSchema) as a field inside z.object()
// — internal _parse dispatch breaks. We use z.unknown() here and validate
// body separately via BlockEditorDocSchema.safeParse() before serializing.

const BlogPostFixtureRowSchema = z.object({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	status: z.enum(['draft', 'published', 'archived']),
	date_published: z.string().nullable(),
	sort: z.number().int().min(0),
	lang: z.enum(['en', 'fr', 'es']),
	category: z.enum(['professional', 'personal']),
	tags: z.array(z.string()).readonly(),
	external: z.boolean(),
	url: z.string().nullable(),
	cover_image_legacy_path: z.string().nullable(),
	svg_illustration_id: z.string().nullable(),
	animation: z.enum(['draw', 'morph', 'draw-fill']),
	title: z.string().min(1),
	excerpt: z.string().min(1).max(500),
	body: z.unknown(),
});

export type BlogPostFixture = z.infer<typeof BlogPostFixtureRowSchema> & { body: BlockEditorDoc };
export const BlogPostsFixtureSchema = z.array(BlogPostFixtureRowSchema).min(1).readonly();

export function loadBlogPostsFixture(): readonly BlogPostFixture[] {
	const parsed = BlogPostsFixtureSchema.parse(fixtureData);
	// Validate every body separately through BlockEditorDocSchema (AM1).
	for (const p of parsed) {
		const result = BlockEditorDocSchema.safeParse(p.body);
		if (!result.success) {
			throw new Error(
				`[seed-blog-posts] body fails BlockEditorDocSchema for post ${p.id}: ${JSON.stringify(result.error.issues)}`,
			);
		}
	}
	return parsed as readonly BlogPostFixture[];
}

// --- Row shape ---------------------------------------------------------

export interface DirectusBlogPostRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	sort: number;
	lang: 'en' | 'fr' | 'es';
	category: 'professional' | 'personal';
	tags: readonly string[];
	external: boolean;
	url: string | null;
	cover_image: string | null;
	svg_illustration: string | null;
	animation: 'draw' | 'morph' | 'draw-fill';
	title: string;
	excerpt: string;
	body: BlockEditorDoc;
}

// --- Pure helpers ------------------------------------------------------

export function toBlogPostRow(fixture: BlogPostFixture): DirectusBlogPostRow {
	const coverUuid = fixture.cover_image_legacy_path
		? assetIdForOrUndefined(fixture.cover_image_legacy_path) ?? null
		: null;
	return {
		id: fixture.id,
		status: fixture.status,
		date_published: fixture.date_published,
		sort: fixture.sort,
		lang: fixture.lang,
		category: fixture.category,
		tags: fixture.tags,
		external: fixture.external,
		url: fixture.external ? fixture.url : null,
		cover_image: coverUuid,
		svg_illustration: fixture.svg_illustration_id,
		animation: fixture.animation,
		title: fixture.title,
		excerpt: fixture.excerpt,
		body: fixture.body,
	};
}

// --- I/O ----------------------------------------------------------------

interface Schema {
	blog_posts: DirectusBlogPostRow[];
}

const log = createLogger('seed-blog-posts');

export interface SeedRunOptions { directusUrl: string; token: string; dryRun?: boolean; reset?: boolean; }

export async function seedBlogPosts(fixtures: readonly BlogPostFixture[], opts: SeedRunOptions): Promise<void> {
	if (opts.dryRun) {
		log.info(`dry-run: would process ${fixtures.length} blog posts against ${opts.directusUrl}`);
		for (const f of fixtures) {
			const row = toBlogPostRow(f);
			log.info(
				`  ~ ${f.id.padEnd(36)}  status=${row.status}  lang=${row.lang}  ` +
				`cat=${row.category}  ext=${row.external}  body.blocks=${row.body.blocks.length}`,
			);
		}
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);

	if (opts.reset) {
		const existing = await client.request(readItems('blog_posts', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) {
			log.info(`clearing ${existing.length} existing blog_posts...`);
			for (const r of existing) {
				try { await client.request(deleteItem('blog_posts', r.id)); }
				catch (err) {
					throw new DirectusError(500, `Failed to delete blog_post ${r.id}: ${parseErrors(err).join(' · ')}`);
				}
			}
		}
	} else {
		const existing = await client.request(readItems('blog_posts', { fields: ['id'], limit: -1 }));
		if (existing.length > 0) {
			throw new Error(`[seed-blog-posts] found ${existing.length} existing rows. Re-run with --reset.`);
		}
	}

	log.info(`creating ${fixtures.length} blog posts...`);
	for (const f of fixtures) {
		const row = toBlogPostRow(f);
		try {
			await client.request(createItem('blog_posts', row as unknown as DirectusBlogPostRow));
		} catch (err) {
			throw new DirectusError(500, `Failed to create blog_post ${f.id}: ${parseErrors(err).join(' · ')}`);
		}
		log.info(`  ✓ ${f.id.padEnd(36)} status=${row.status} lang=${row.lang}`);
	}

	const final = await client.request(readItems('blog_posts', { fields: ['id'], limit: -1 }));
	if (final.length !== fixtures.length) {
		throw new Error(`[seed-blog-posts] count mismatch: expected ${fixtures.length}, got ${final.length}`);
	}
	log.info(`verified: ${final.length} blog posts in Directus`);
}

function parseFlags(argv: readonly string[]): { dryRun: boolean; reset: boolean } {
	return { dryRun: argv.includes('--dry-run'), reset: argv.includes('--reset') };
}

async function main(): Promise<void> {
	const { dryRun, reset } = parseFlags(process.argv.slice(2));
	const url = defaultDirectusUrl();
	log.info(`target: ${url}${dryRun ? ' [dry-run]' : reset ? ' [reset]' : ''}`);

	const fixtures = loadBlogPostsFixture();
	log.info(`source: ${fixtures.length} posts from fixtures/collections/blog-posts.json`);

	if (dryRun) { await seedBlogPosts(fixtures, { directusUrl: url, token: '', dryRun: true }); return; }
	const token = await getAdminToken(url);
	await seedBlogPosts(fixtures, { directusUrl: url, token, reset });
}

if (import.meta.main) {
	main().catch((err) => { console.error('[seed-blog-posts] FAILED:', err); process.exit(1); });
}
