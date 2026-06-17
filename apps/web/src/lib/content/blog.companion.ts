// Hand-written companion to the CMS-derived `blog.ts` (slice-18m).
//
// Holds the SVG fallback resolver and helper functions.
// The CMS-derived `blog.ts` only emits `blogPosts: readonly BlogPost[]`;
// the html/body bridge lives in the runtime adapter (block-editor → HTML
// serialization).
//
// Slice-28.3 (#54/#115): the legacy markdown→HTML cache (`blog.html-cache.ts`)
// and the `/src/content/blog/**` markdown tree were deleted — post HTML now
// flows exclusively from the CMS block-editor pipeline.

import type { BlogPost, BlogCategory, BlogAnimation, Locale } from '$lib/types';
import { blogPosts } from './blog';

// --- Fallback SVG + animation resolution ---

const PRO_FALLBACKS = ['pro-database', 'pro-code', 'pro-pipeline', 'pro-chart'];
const PERSONAL_FALLBACKS = [
	'personal-rocket',
	'personal-train',
	'personal-telescope',
	'personal-globe',
];
const ALL_ANIMATIONS: BlogAnimation[] = ['draw', 'morph', 'draw-fill'];

function slugHash(slug: string): number {
	let hash = 0;
	for (let i = 0; i < slug.length; i++) {
		hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

export function resolveSvgFallbackName(slug: string, category: BlogCategory): string {
	const fallbacks = category === 'professional' ? PRO_FALLBACKS : PERSONAL_FALLBACKS;
	return fallbacks[slugHash(slug) % fallbacks.length];
}

export function resolveAnimation(slug: string, explicit: string | undefined): BlogAnimation {
	if (explicit && ALL_ANIMATIONS.includes(explicit as BlogAnimation)) {
		return explicit as BlogAnimation;
	}
	return ALL_ANIMATIONS[slugHash(slug) % ALL_ANIMATIONS.length];
}

// --- SVG glob loading (static adapter fallback path) ---

// Fallback SVGs as raw strings.
const fallbackSvgs = import.meta.glob('/src/lib/assets/blog-fallbacks/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

// Key by the bare illustration id (filename without the `.svg` extension) so a
// post's `svg` field — which carries the illustration id, e.g. `pro-chart`, NOT
// `pro-chart.svg` — resolves directly. The bundled fallback files are
// byte-identical to the assets Directus serves for the same illustration id, so
// this mirrors `directusAdapter.blog.svgContent` (which fetches the asset bytes).
const fallbackSvgMap = new Map<string, string>();
for (const [path, content] of Object.entries(fallbackSvgs)) {
	const filename = path.split('/').pop()!;
	fallbackSvgMap.set(filename.replace(/\.svg$/, ''), content);
}

// --- SVG content ---

export function getSvgContent(post: BlogPost): string {
	return fallbackSvgMap.get(post.svg) ?? '';
}

export function getSvgContentsForPosts(posts: readonly BlogPost[]): Record<string, string> {
	const result: Record<string, string> = {};
	for (const post of posts) {
		result[post.slug] = getSvgContent(post);
	}
	return result;
}

// --- Public API — operates on the generated `blogPosts` array ---

export function getLatestPosts(count: number, category?: BlogCategory): readonly BlogPost[] {
	const filtered = category
		? blogPosts.filter((p) => p.category === category)
		: blogPosts.filter((p) => p.category === 'professional');
	return [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, count);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
	return blogPosts.find((p) => p.slug === slug);
}

export function getPostsByCategory(category: BlogCategory): readonly BlogPost[] {
	return [...blogPosts].filter((p) => p.category === category).sort((a, b) => b.date.localeCompare(a.date));
}

export function getTagsForCategory(category: BlogCategory): readonly string[] {
	const tags = new Set<string>();
	for (const post of blogPosts) {
		if (post.category === category) {
			for (const tag of post.tags) tags.add(tag);
		}
	}
	return [...tags].sort();
}

export function getPostsByTag(category: BlogCategory, tag: string): readonly BlogPost[] {
	return [...blogPosts]
		.filter((p) => p.category === category && p.tags.includes(tag))
		.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Returns all unique languages used in posts for a given category.
 * Used for the language filter on listing pages.
 */
export function getLanguagesForCategory(category: BlogCategory): readonly Locale[] {
	const langs = new Set<Locale>();
	for (const post of blogPosts) {
		if (post.category === category) langs.add(post.lang);
	}
	return [...langs].sort();
}
