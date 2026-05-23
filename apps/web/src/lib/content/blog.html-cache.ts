// Markdown → HTML cache for the static-adapter blog.html() port.
//
// **Server-only / static-adapter-only**. Importing this file evaluates
// `$lib/utils/markdown`, which in turn loads Shiki + its theme + every
// language registration (≈100 KB minified). Keep this OUT of the
// $lib/content barrel so home-page bundles don't drag Shiki in via
// transitive re-exports.
//
// Slice-23 mobile-perf fix: previously the marked.parse loop lived in
// blog.companion.ts, and that file was re-exported through
// $lib/content/index.ts. Any home component importing getLatestPosts or
// HeroData types via the barrel evaluated blog.companion → markdown.ts →
// Shiki, costing ~58 KiB unused JS on the home route. Splitting this off
// removes the leak path entirely.

import { marked } from '$lib/utils/markdown';

// Raw markdown for the static adapter's html() port. Eager glob so the
// build can bake every post's HTML at module-eval (build/SSR) time.
const rawPosts = import.meta.glob('/src/content/blog/**/index.md', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): { content: string } {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { content: raw };
	return { content: match[2] };
}

const htmlBySlug = new Map<string, string>();
for (const [filepath, raw] of Object.entries(rawPosts)) {
	const { content } = parseFrontmatter(raw);
	const parts = filepath.split('/');
	const slug = parts[parts.length - 2];
	htmlBySlug.set(slug, marked.parse(content, { async: false }) as string);
}

/** Returns pre-rendered HTML from markdown for a post. */
export function getPostHtml(slug: string): string {
	return htmlBySlug.get(slug) ?? '';
}
