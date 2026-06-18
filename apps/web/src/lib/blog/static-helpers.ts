import type { BlogAnimation, BlogCategory, BlogPost, Locale } from '$lib/types';
import { blogPosts } from '$lib/content/blog';

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

const fallbackSvgs = import.meta.glob('/src/lib/assets/blog-fallbacks/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

const fallbackSvgMap = new Map<string, string>();
for (const [path, content] of Object.entries(fallbackSvgs)) {
	const filename = path.split('/').pop()!;
	fallbackSvgMap.set(filename.replace(/\.svg$/, ''), content);
}

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
	return [...blogPosts]
		.filter((p) => p.category === category)
		.sort((a, b) => b.date.localeCompare(a.date));
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

export function getLanguagesForCategory(category: BlogCategory): readonly Locale[] {
	const langs = new Set<Locale>();
	for (const post of blogPosts) {
		if (post.category === category) langs.add(post.lang);
	}
	return [...langs].sort();
}
