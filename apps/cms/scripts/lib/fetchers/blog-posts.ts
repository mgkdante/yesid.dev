/**
 * blog-posts fetcher: reads published `blog_posts` with their per-language
 * `translations` and emits one BlogPost (plus its Block Editor body) for every
 * language that is available on the site.
 *
 * SVG fallback resolution: when a post has no svg_illustration FK, hashes the
 * post key to pick from the canonical PRO/PERSONAL fallback lists.
 */

import { readItems } from '@directus/sdk';
import { z } from 'zod';
import type { BlockEditorDoc } from '@repo/shared';
import { BlogPostSchema, LocaleSchema } from '@repo/shared/schemas';
import type { BlogAnimation, BlogCategory, BlogPost } from '@repo/shared';
import { BlockEditorDocSchema } from '@repo/shared';
import type { FetcherContext } from './types';
import { tagsFromM2M, type DirectusTagJunctionRow } from './projects';

export interface DirectusBlogPostTranslation {
	languages_code: string;
	show_on_site: boolean | null;
	slug: string;
	title: string | null;
	excerpt: string | null;
	body?: BlockEditorDoc | null;
	seo_title: string | null;
	seo_description: string | null;
}

export interface DirectusBlogPostRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	date_modified: string | null;
	sort: number | null;
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
	translations?: DirectusBlogPostTranslation[];
}

export interface BlogExport {
	posts: readonly BlogPost[];
	/** Block Editor body per available post, keyed by its language slug. */
	bodies: Record<string, BlockEditorDoc>;
}

const PRO_FALLBACKS = ['pro-database', 'pro-code', 'pro-pipeline', 'pro-chart'] as const;
const PERSONAL_FALLBACKS = [
	'personal-rocket',
	'personal-train',
	'personal-telescope',
	'personal-globe',
] as const;

export const BLOG_POST_SORT = ['-date_published', 'sort', 'id'] as const;

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

function coverImageId(value: DirectusBlogPostRow['cover_image']): string | undefined {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object') return value.id;
	return undefined;
}

function coverImageAlt(value: DirectusBlogPostRow['cover_image']): string | undefined {
	if (!value || typeof value !== 'object') return undefined;
	return compact(value.description) ?? compact(value.title);
}

/**
 * A language is on the site only when its row exists, Show on site is on, and
 * it has a title plus article text (external posts: a title and the post URL).
 */
export function isAvailableTranslation(
	row: Pick<DirectusBlogPostRow, 'external' | 'url'>,
	translation: DirectusBlogPostTranslation,
): boolean {
	if (translation.show_on_site !== true || !compact(translation.title)) return false;
	if (!LocaleSchema.safeParse(translation.languages_code).success) return false;
	return row.external ? Boolean(compact(row.url)) : (translation.body?.blocks?.length ?? 0) > 0;
}

/** Pure transform: one post language → BlogPost. */
export function toBlogPost(row: DirectusBlogPostRow, translation: DirectusBlogPostTranslation): BlogPost {
	const svgId =
		typeof row.svg_illustration === 'object' && row.svg_illustration !== null
			? row.svg_illustration.id
			: (row.svg_illustration ?? resolveSvgFallbackName(row.id, row.category));
	return {
		coverImage: coverImageId(row.cover_image),
		coverImageAlt: coverImageAlt(row.cover_image),
		slug: translation.slug,
		translationKey: row.id,
		title: translation.title ?? '',
		excerpt: translation.excerpt ?? '',
		seoTitle: compact(translation.seo_title),
		seoDescription: compact(translation.seo_description),
		date: dateOnly(row.date_published) ?? '',
		dateModified: dateOnly(row.date_modified),
		lang: LocaleSchema.parse(translation.languages_code),
		category: row.category,
		tags: tagsFromM2M(row.tags),
		animation: row.animation,
		svg: svgId,
		url: row.external ? (row.url ?? '') : `/blog/${translation.slug}`,
		external: row.external,
	};
}

/** Available languages of every post, in post order then slug order. */
export function toBlogExport(rows: readonly DirectusBlogPostRow[]): BlogExport {
	const posts: BlogPost[] = [];
	const bodies: Record<string, BlockEditorDoc> = {};
	for (const row of rows) {
		const available = (row.translations ?? [])
			.filter((translation) => isAvailableTranslation(row, translation))
			.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
		for (const translation of available) {
			posts.push(toBlogPost(row, translation));
			if (translation.body) bodies[translation.slug] = BlockEditorDocSchema.parse(translation.body);
		}
	}
	return { posts: z.array(BlogPostSchema).parse(posts), bodies };
}

/** Fetch + validate every published post and its available languages, newest first. */
export async function fetchBlog({ client }: FetcherContext): Promise<BlogExport> {
	const rows = (await client.request(
		readItems('blog_posts', {
			fields: [
				'id',
				'status',
				'date_published',
				'date_modified',
				'sort',
				'category',
				{ tags: ['sort', { tags_id: ['id'] }] } as unknown as string,
				'external',
				'url',
				'animation',
				{ cover_image: ['id', 'title', 'description'] } as unknown as string,
				{ svg_illustration: ['id', 'label', 'category', { file: ['id'] }] } as unknown as string,
				{
					translations: [
						'languages_code',
						'show_on_site',
						'slug',
						'title',
						'excerpt',
						'body',
						'seo_title',
						'seo_description',
					],
				} as unknown as string,
			],
			filter: { status: { _eq: 'published' } },
			sort: [...BLOG_POST_SORT],
			limit: -1,
		}),
	)) as unknown as DirectusBlogPostRow[];

	return toBlogExport(rows);
}
