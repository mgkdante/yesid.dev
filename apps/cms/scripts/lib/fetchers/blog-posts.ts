/**
 * blog-posts fetcher — reads `blog_posts` (flat, mono-language per row per AM2.5).
 * Mirrors `toBlogPost` in apps/web/src/lib/adapters/directus.ts.
 *
 * SVG fallback resolution: when a row has no svg_illustration FK, hashes the
 * slug to pick from PRO/PERSONAL fallback lists — same deterministic policy
 * as the adapter (`resolveSvgFallbackNameSync` in the same directus.ts).
 */

import { readItems } from '@directus/sdk';
import { z } from 'zod';
import type { BlockEditorDoc } from '@repo/shared';
import {
	BlogPostSchema,
	type BlogAnimation,
	type BlogCategory,
	type BlogPost,
} from '../schemas/blog';
import { BlockEditorDocSchema } from '@repo/shared';
import type { FetcherContext } from './types';
import { tagsFromM2M, type DirectusTagJunctionRow } from './projects';

export interface DirectusBlogPostRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	date_modified: string | null;
	sort: number | null;
	lang: 'en' | 'fr' | 'es';
	category: BlogCategory;
	tags?: DirectusTagJunctionRow[];
	external: boolean;
	url: string | null;
	cover_image:
		| { id: string; title?: string | null; description?: string | null }
		| string
		| null;
	svg_illustration: { id: string; label?: string; category?: string; file?: { id: string } } | string | null;
	animation: BlogAnimation;
	title: string;
	excerpt: string;
	seo_title: string | null;
	seo_description: string | null;
}

const PRO_FALLBACKS = ['pro-database', 'pro-code', 'pro-pipeline', 'pro-chart'] as const;
const PERSONAL_FALLBACKS = [
	'personal-rocket',
	'personal-train',
	'personal-telescope',
	'personal-globe',
] as const;

function slugHash(slug: string): number {
	let hash = 0;
	for (let i = 0; i < slug.length; i++) {
		hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

export function resolveSvgFallbackName(slug: string, category: BlogCategory): string {
	const list = category === 'personal' ? PERSONAL_FALLBACKS : PRO_FALLBACKS;
	return list[slugHash(slug) % list.length]!;
}

function compact(value: string | null | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

function dateOnly(value: string | null | undefined): string | undefined {
	return value ? value.split('T')[0] : undefined;
}

function coverImageId(
	value: DirectusBlogPostRow['cover_image'],
): string | undefined {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object') return value.id;
	return undefined;
}

function coverImageAlt(
	value: DirectusBlogPostRow['cover_image'],
): string | undefined {
	if (!value || typeof value !== 'object') return undefined;
	return compact(value.description) ?? compact(value.title);
}

/** Pure transform — DirectusBlogPostRow → BlogPost. Tested standalone. */
export function toBlogPost(row: DirectusBlogPostRow): BlogPost {
	const svgId =
		typeof row.svg_illustration === 'object' && row.svg_illustration !== null
			? row.svg_illustration.id
			: (row.svg_illustration ?? resolveSvgFallbackName(row.id, row.category));
	return {
		coverImage: coverImageId(row.cover_image),
		coverImageAlt: coverImageAlt(row.cover_image),
		slug: row.id,
		title: row.title,
		excerpt: row.excerpt,
		seoTitle: compact(row.seo_title),
		seoDescription: compact(row.seo_description),
		date: dateOnly(row.date_published) ?? '',
		dateModified: dateOnly(row.date_modified),
		lang: row.lang,
		category: row.category,
		tags: tagsFromM2M(row.tags),
		animation: row.animation,
		svg: svgId,
		url: row.external ? (row.url ?? '') : `/blog/${row.id}`,
		external: row.external,
	};
}

/** Fetch + validate all published blog posts sorted by most-recent first. */
export async function fetchBlogPosts({ client }: FetcherContext): Promise<readonly BlogPost[]> {
	const rows = (await client.request(
		readItems('blog_posts', {
			fields: [
				'id',
				'status',
				'date_published',
				'date_modified',
				'sort',
				'lang',
				'category',
				{ tags: ['sort', { tags_id: ['id'] }] } as unknown as string,
				'external',
				'url',
				'animation',
				'title',
				'excerpt',
				'seo_title',
				'seo_description',
				{ cover_image: ['id', 'title', 'description'] } as unknown as string,
				{ svg_illustration: ['id', 'label', 'category', { file: ['id'] }] } as unknown as string,
			],
			filter: { status: { _eq: 'published' } },
			sort: ['-date_published'],
			limit: -1,
		}),
	)) as unknown as DirectusBlogPostRow[];

	return z.array(BlogPostSchema).parse(rows.map(toBlogPost));
}

/** Raw row shape for the body-only fetch (parent `id` + Block Editor `body`). */
interface DirectusBlogBodyRow {
	id: string;
	body: BlockEditorDoc | null;
}

/**
 * Fetch the Block Editor `body` for every published post, keyed by slug (= row id).
 *
 * Mirrors `directusAdapter.blog.bodyBySlug` (apps/web/src/lib/adapters/directus.ts):
 * each value is the row's `body` validated against BlockEditorDocSchema. Posts
 * whose `body` is null are omitted so the static `bodyBySlug` returns `null` for
 * them — byte-identical to the runtime adapter's `if (body === null) return null`.
 */
export async function fetchBlogBodies({
	client,
}: FetcherContext): Promise<Record<string, BlockEditorDoc>> {
	const rows = (await client.request(
		readItems('blog_posts', {
			fields: ['id', 'body'],
			filter: { status: { _eq: 'published' } },
			sort: ['-date_published'],
			limit: -1,
		}),
	)) as unknown as DirectusBlogBodyRow[];

	const out: Record<string, BlockEditorDoc> = {};
	for (const row of rows) {
		if (row.body === null || row.body === undefined) continue;
		out[row.id] = BlockEditorDocSchema.parse(row.body);
	}
	return out;
}
