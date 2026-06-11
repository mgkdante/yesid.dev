// Blog repository — thin async delegation over adapter.blog.
// Slice-28.3 (#117): pruned wrappers with zero route/test consumers
// (getPostHtml, getPostsByTag, getTagsForCategory, getLanguagesForCategory,
// getLatestPosts, resolveSvgFallbackName, resolveAnimation). The matching
// adapter-port methods stay on the ContentAdapter contract — the static
// suites (adapter.test.ts, __tests__/static-blog.test.ts) still exercise them.

import { adapter } from '$lib/adapters';
import type { BlogPost, BlogCategory, PreviewContext } from '$lib/types';
import type { BlockEditorDoc } from '@repo/shared';

export async function getAllPosts(ctx?: PreviewContext): Promise<readonly BlogPost[]> {
	return adapter.blog.all(ctx);
}

export async function getPostBySlug(slug: string, ctx?: PreviewContext): Promise<BlogPost | undefined> {
	return adapter.blog.bySlug(slug, ctx);
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

export async function getSvgContent(post: BlogPost, ctx?: PreviewContext): Promise<string> {
	return adapter.blog.svgContent(post, ctx);
}

export async function getSvgContentsForPosts(
	posts: readonly BlogPost[],
	ctx?: PreviewContext,
): Promise<Record<string, string>> {
	return adapter.blog.svgContentsForPosts(posts, ctx);
}
