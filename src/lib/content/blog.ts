import { marked } from '$lib/utils/markdown';
import type { BlogPost, BlogCategory, BlogAnimation, Locale, LocalizedString } from '$lib/types';

/** Listing-page chrome copy extracted from components in Task 17b-7b.
 *  Consumed by BlogListingPage, BlogFilterMobile, BlogFilterSidebar, BlogRouteMap. */
export const blogListingContent = {
	mobileHeading: { en: 'Blog' } satisfies LocalizedString,
	searchPlaceholder: { en: 'Search posts...' } satisfies LocalizedString,
	resultNoun: { en: 'result' } satisfies LocalizedString,
	noPostsMessage: {
		en: 'No posts found. Try adjusting your filters.'
	} satisfies LocalizedString,
	filters: {
		filtersLabel: { en: 'Filters' } satisfies LocalizedString,
		allLabel: { en: 'All' } satisfies LocalizedString,
		language: { en: 'Language' } satisfies LocalizedString,
		dateRange: { en: 'Date Range' } satisfies LocalizedString,
		from: { en: 'From' } satisfies LocalizedString,
		to: { en: 'To' } satisfies LocalizedString,
		tags: { en: 'Tags' } satisfies LocalizedString,
		/** Prefix before active filter in the "Showing: {tag}" mobile status label. */
		showingPrefix: { en: 'Showing' } satisfies LocalizedString,
	},
	routeMap: {
		title: { en: 'Route Map' } satisfies LocalizedString,
		terminus: { en: 'Terminus' } satisfies LocalizedString,
	},
} as const;

// --- Frontmatter parsing ---

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
	// CRLF-tolerant: Windows editors occasionally save .md with \r\n line endings.
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { data: {}, content: raw };

	const frontmatter = match[1];
	const content = match[2];
	const data: Record<string, unknown> = {};

	for (const line of frontmatter.split(/\r?\n/)) {
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		let value: unknown = line.slice(colonIdx + 1).trim();

		if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
			value = value.slice(1, -1).split(',').map((s) => s.trim());
		}
		if (value === 'true') value = true;
		if (value === 'false') value = false;

		data[key] = value;
	}

	return { data, content };
}

// --- Fallback SVG + animation resolution ---

const PRO_FALLBACKS = ['pro-database.svg', 'pro-code.svg', 'pro-pipeline.svg', 'pro-chart.svg'];
const PERSONAL_FALLBACKS = ['personal-rocket.svg', 'personal-train.svg', 'personal-telescope.svg', 'personal-globe.svg'];
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

// --- Blog data loading ---

// Raw markdown for metadata + content extraction.
const rawPosts = import.meta.glob('/src/content/blog/**/index.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

// Custom illustration SVGs as raw strings for inline rendering + GSAP animation.
const customSvgs = import.meta.glob('/src/content/blog/**/illustration.svg', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

// Fallback SVGs as raw strings.
const fallbackSvgs = import.meta.glob('/src/lib/assets/blog-fallbacks/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const fallbackSvgMap = new Map<string, string>();
for (const [path, content] of Object.entries(fallbackSvgs)) {
	fallbackSvgMap.set(path.split('/').pop()!, content);
}

// Parse and build BlogPost objects + pre-render markdown content.
const blogPosts: readonly BlogPost[] = [];
const contentBySlug = new Map<string, string>();
const htmlBySlug = new Map<string, string>();

for (const [filepath, raw] of Object.entries(rawPosts)) {
	const { data, content } = parseFrontmatter(raw);

	const parts = filepath.split('/');
	const slug = parts[parts.length - 2];
	const categoryFromPath = parts[4] as BlogCategory;
	const category: BlogCategory = (data.category as BlogCategory) ?? categoryFromPath ?? 'professional';

	const svgPath = filepath.replace('index.md', 'illustration.svg');
	const hasCustomSvg = svgPath in customSvgs;

	const lang = (data.lang as Locale) ?? 'en';
	const animation = resolveAnimation(slug, data.animation as string | undefined);
	const svg = hasCustomSvg ? '__custom__' : resolveSvgFallbackName(slug, category);

	// Store title/excerpt under the post's language key. Always set 'en' as
	// the fallback that resolveLocale() requires. If the post IS English,
	// both keys point to the same string — no duplication issue.
	const titleStr = (data.title as string) ?? '';
	const excerptStr = (data.excerpt as string) ?? '';

	(blogPosts as BlogPost[]).push({
		slug,
		title: { en: titleStr, [lang]: titleStr },
		excerpt: { en: excerptStr, [lang]: excerptStr },
		date: String(data.date ?? ''),
		lang,
		category,
		tags: Array.isArray(data.tags) ? data.tags : [],
		animation,
		svg,
		url: data.external ? (data.url as string ?? `/blog/${slug}`) : `/blog/${slug}`,
		external: data.external === true
	});

	contentBySlug.set(slug, content);
	// Pre-render markdown to HTML at build time via marked
	htmlBySlug.set(slug, marked.parse(content, { async: false }) as string);
}

// --- SVG content ---

export function getSvgContent(post: BlogPost): string {
	if (post.svg === '__custom__') {
		for (const [path, content] of Object.entries(customSvgs)) {
			if (path.includes(`/${post.slug}/`)) return content;
		}
	}
	return fallbackSvgMap.get(post.svg) ?? '';
}

export function getSvgContentsForPosts(posts: readonly BlogPost[]): Record<string, string> {
	const result: Record<string, string> = {};
	for (const post of posts) {
		result[post.slug] = getSvgContent(post);
	}
	return result;
}

// --- Public API ---

export function getLatestPosts(count: number, category?: BlogCategory): readonly BlogPost[] {
	const filtered = category
		? blogPosts.filter((p) => p.category === category)
		: blogPosts.filter((p) => p.category === 'professional');
	return [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, count);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
	return blogPosts.find((p) => p.slug === slug);
}

/** Returns pre-rendered HTML from markdown for a post. */
export function getPostHtml(slug: string): string {
	return htmlBySlug.get(slug) ?? '';
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

export { blogPosts };
