// Blog repository — thin async delegation over adapter.blog.

import { adapter } from '$lib/adapters';
import type {
	BlogPost,
	BlogCategory,
	BlogAnimation,
	Locale,
	PreviewContext,
} from '$lib/types';
import type { BlockEditorDoc } from '@repo/shared';

export async function getAllPosts(ctx?: PreviewContext): Promise<readonly BlogPost[]> {
	return adapter.blog.all(ctx);
}

export async function getPostBySlug(slug: string, ctx?: PreviewContext): Promise<BlogPost | undefined> {
	return adapter.blog.bySlug(slug, ctx);
}

export async function getPostHtml(slug: string, ctx?: PreviewContext): Promise<string> {
	return adapter.blog.html(slug, ctx);
}

export async function getPostBody(slug: string, ctx?: PreviewContext): Promise<BlockEditorDoc | null> {
	return adapter.blog.bodyBySlug(slug, ctx);
}

export async function getPostsByCategory(
	category: BlogCategory,
	ctx?: PreviewContext,
): Promise<readonly BlogPost[]> {
	return adapter.blog.byCategory(category, ctx);
}

export async function getPostsByTag(
	category: BlogCategory,
	tag: string,
	ctx?: PreviewContext,
): Promise<readonly BlogPost[]> {
	return adapter.blog.byTag(category, tag, ctx);
}

export async function getTagsForCategory(
	category: BlogCategory,
	ctx?: PreviewContext,
): Promise<readonly string[]> {
	return adapter.blog.tagsForCategory(category, ctx);
}

export async function getLanguagesForCategory(
	category: BlogCategory,
	ctx?: PreviewContext,
): Promise<readonly Locale[]> {
	return adapter.blog.languagesForCategory(category, ctx);
}

export async function getLatestPosts(
	count: number,
	category?: BlogCategory,
	ctx?: PreviewContext,
): Promise<readonly BlogPost[]> {
	return adapter.blog.latest(count, category, ctx);
}

export async function getSvgContent(post: BlogPost, ctx?: PreviewContext): Promise<string> {
	return adapter.blog.svgContent(post, ctx);
}

export async function getSvgContentsForPosts(
	posts: readonly BlogPost[],
	ctx?: PreviewContext,
): Promise<Record<string, string>> {
	return adapter.blog.svgContentsForPosts(posts, ctx);
}

export async function resolveSvgFallbackName(
	slug: string,
	category: BlogCategory,
	ctx?: PreviewContext,
): Promise<string> {
	return adapter.blog.resolveSvgFallbackName(slug, category, ctx);
}

export async function resolveAnimation(
	slug: string,
	explicit: string | undefined,
	ctx?: PreviewContext,
): Promise<BlogAnimation> {
	return adapter.blog.resolveAnimation(slug, explicit, ctx);
}
