import type { BlogCategory, BlogPost } from '$lib/types';
import { blogPosts } from '$lib/content/blog';

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

export function getPostBySlug(slug: string): BlogPost | undefined {
	return blogPosts.find((p) => p.slug === slug);
}

export function getPostsByCategory(category: BlogCategory): readonly BlogPost[] {
	return [...blogPosts]
		.filter((p) => p.category === category)
		.sort((a, b) => b.date.localeCompare(a.date));
}
