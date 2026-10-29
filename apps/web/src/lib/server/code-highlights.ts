import type { BlockEditorDoc } from '@repo/shared';
import { highlight } from '@yesid/seo-kit/highlight';
import { parseCodeFence } from '#lib/utils/code-fences.ts';

/** block.id → highlighted markup for that block's fence body. */
type CodeHighlights = Readonly<Record<string, string>>;

/** Highlighted markup for a fence; undefined for Mermaid, which MermaidDiagram renders in the browser. */
export async function highlightFence(code: string): Promise<string | undefined> {
	const parsed = parseCodeFence(code);
	return parsed.kind === 'code' ? highlight(parsed.body, parsed.normalizedLanguage) : undefined;
}

/**
 * Highlights every `code` block in the docs this page renders. Pass only the resolveLocale-picked
 * variants: block ids key the map, so two locale variants of one doc would shadow each other.
 */
export async function collectCodeHighlights(
	docs: ReadonlyArray<BlockEditorDoc | null | undefined>,
): Promise<CodeHighlights> {
	const highlights: Record<string, string> = {};
	for (const block of docs.flatMap((doc) => doc?.blocks ?? [])) {
		if (block.type !== 'code') continue;
		const html = await highlightFence(block.data.code);
		if (html !== undefined) highlights[block.id] = html;
	}
	return highlights;
}
