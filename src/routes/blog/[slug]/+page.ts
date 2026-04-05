import { error } from '@sveltejs/kit';
import { getPostBySlug, getPostHtml, getSvgContent } from '$lib/data';

export function load({ params }: { params: { slug: string } }) {
	const post = getPostBySlug(params.slug);
	if (!post) error(404, 'Post not found');

	const html = getPostHtml(params.slug);
	const svgContent = getSvgContent(post);

	return { post, html, svgContent };
}
