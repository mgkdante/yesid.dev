import { error } from '@sveltejs/kit';
import { catalog as defaultCatalog, type ContentCatalog } from '#lib/catalog/index.ts';
import { extractHeadings, extractText, wordCount, readingTime } from '@repo/shared';
import { blogEntries } from '#lib/server/prerender-entries.ts';
import { collectCodeHighlights } from '#lib/server/code-highlights.ts';
import { getBlogPostsForLocale } from '#lib/blog/translations.ts';
import { localeFromParams } from '#lib/utils/locale-routing.ts';

export const entries = blogEntries;
export const prerender = entries().length > 0;

export async function load({
	params,
}: {
	params: { slug: string; lang?: string };
}, catalog: ContentCatalog = defaultCatalog) {
	const locale = localeFromParams(params);
	const post = await catalog.blog.bySlug(params.slug);
	if (!post || !catalog.isAvailable({ kind: 'post', entity: post }, locale)) error(404, 'Post not found');

	const [body, svgContent, allPosts] = await Promise.all([
		catalog.blog.bodyBySlug(params.slug),
		catalog.blog.svgContent(post),
		catalog.blog.all(),
	]);

	if (!body) error(404, 'Post body missing');

	const text = extractText(body);
	const words = wordCount(text);
	const minutesToRead = readingTime(words);
	const headings = extractHeadings(body);

	const localePosts = getBlogPostsForLocale(allPosts, locale);
	const postIndex = localePosts.findIndex((candidate) => candidate.slug === post.slug) + 1;

	return {
		post,
		body,
		svgContent,
		readingTime: minutesToRead,
		wordCount: words,
		headings,
		postIndex,
		// Shiki runs server-side only; CodeBlock consumes these by block id.
		codeHighlights: await collectCodeHighlights([body]),
	};
}
