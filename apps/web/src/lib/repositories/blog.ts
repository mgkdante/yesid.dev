// Blog repository — thin async delegation over adapter.blog.

import { adapter } from '$lib/adapters';
import type {
	BlogPost,
	BlogCategory,
	BlogAnimation,
	Locale,
} from '$lib/types';
import type { BlockEditorDoc } from '@repo/shared';

export async function getAllPosts(): Promise<readonly BlogPost[]> {
	return adapter.blog.all();
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
	return adapter.blog.bySlug(slug);
}

export async function getPostHtml(slug: string): Promise<string> {
	return adapter.blog.html(slug);
}

export async function getPostBody(slug: string): Promise<BlockEditorDoc | null> {
	return adapter.blog.bodyBySlug(slug);
}

export async function getPostsByCategory(
	category: BlogCategory
): Promise<readonly BlogPost[]> {
	return adapter.blog.byCategory(category);
}

export async function getPostsByTag(
	category: BlogCategory,
	tag: string
): Promise<readonly BlogPost[]> {
	return adapter.blog.byTag(category, tag);
}

export async function getTagsForCategory(
	category: BlogCategory
): Promise<readonly string[]> {
	return adapter.blog.tagsForCategory(category);
}

export async function getLanguagesForCategory(
	category: BlogCategory
): Promise<readonly Locale[]> {
	return adapter.blog.languagesForCategory(category);
}

export async function getLatestPosts(
	count: number,
	category?: BlogCategory
): Promise<readonly BlogPost[]> {
	return adapter.blog.latest(count, category);
}

export async function getSvgContent(post: BlogPost): Promise<string> {
	return adapter.blog.svgContent(post);
}

export async function getSvgContentsForPosts(
	posts: readonly BlogPost[]
): Promise<Record<string, string>> {
	return adapter.blog.svgContentsForPosts(posts);
}

export async function resolveSvgFallbackName(
	slug: string,
	category: BlogCategory
): Promise<string> {
	return adapter.blog.resolveSvgFallbackName(slug, category);
}

export async function resolveAnimation(
	slug: string,
	explicit: string | undefined
): Promise<BlogAnimation> {
	return adapter.blog.resolveAnimation(slug, explicit);
}
