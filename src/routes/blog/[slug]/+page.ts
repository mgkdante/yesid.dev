import { error } from '@sveltejs/kit';
import { blogPosts, getPostBySlug, getPostHtml, getSvgContent } from '$lib/content';
export function load({ params }: { params: { slug: string } }) {
	const post = getPostBySlug(params.slug);
	if (!post) error(404, 'Post not found');

	// Strip the first <h1> from rendered HTML — BlogDetailHeader already shows the title
	const rawHtml = getPostHtml(params.slug);
	const html = rawHtml.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, '');
	const svgContent = getSvgContent(post);

	// Strip HTML tags, count words, estimate reading time at 200 wpm
	const plainText = html.replace(/<[^>]*>/g, '');
	const wordCount = plainText.split(/\s+/).filter(Boolean).length;
	const readingTime = Math.max(1, Math.ceil(wordCount / 200));

	const postIndex = blogPosts.findIndex((p) => p.slug === post.slug) + 1;

	return { post, html, svgContent, readingTime, postIndex };
}
