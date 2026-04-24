import type { SchemaOrgNode } from '$lib/schemas/seo';

/**
 * Serialize nodes into a JSON-LD @graph blob.
 *
 * Escapes "<" to "\u003c" so the output is safe to embed inside a
 * <script> element — any raw "<" (or "</script>") in a script body
 * would cause the browser to terminate the element prematurely.
 * The same escape is used by Next.js, Nuxt, and Astro.
 */
export function serializeJsonLd(nodes: readonly SchemaOrgNode[]): string {
	const graph = {
		'@context': 'https://schema.org',
		'@graph': nodes,
	};
	// \x3c === "<" — avoids a literal "<" in source while keeping the regex clear.
	return JSON.stringify(graph).replace(/\x3c/g, '\\u003c');
}
