// Server-side code-block highlighting — consolidation-deploy-honesty slice.
//
// Editor.js `code` blocks used to highlight in the browser: CodeBlock imported
// the Shiki chain (WASM engine + 17 grammars, ~300KB gz) client-side to
// re-highlight what SSR had already rendered. Highlighting now happens once,
// at render/prerender time: loads that return BlockEditorDocs call
// collectCodeHighlights and pass the map down; CodeBlock consumes its block's
// pre-highlighted HTML and falls back to a plain <pre> when no entry exists
// (e.g. a doc surface whose load doesn't highlight — still styled, just
// uncolored). Same division of labor as the project-readme precedent
// ($lib/server/markdown).

import type { BlockEditorDoc } from '@repo/shared';
import { parseCodeFence } from '$lib/utils/code-fences';
import { highlightCodeHtml } from './syntax-highlight';

/** block.id → Shiki-highlighted HTML for that block's fence body. */
export type CodeHighlights = Readonly<Record<string, string>>;

/**
 * Collect highlighted HTML for every `code` block across the given docs.
 * Accepts sparse input (absent optional docs). Pass exactly the docs the
 * page will render (resolveLocale-picked variants) — block ids key the map,
 * so mixing locale variants of the SAME doc would let one locale's html
 * shadow another's. Mermaid fences are skipped — MermaidDiagram renders
 * those client-side from source.
 */
export function collectCodeHighlights(
	docs: ReadonlyArray<BlockEditorDoc | null | undefined>,
): CodeHighlights {
	const highlights: Record<string, string> = {};
	for (const doc of docs) {
		if (!doc) continue;
		for (const block of doc.blocks) {
			if (block.type !== 'code') continue;
			const parsed = parseCodeFence(block.data.code);
			if (parsed.kind !== 'code') continue;
			highlights[block.id] = highlightCodeHtml(parsed.body, parsed.normalizedLanguage);
		}
	}
	return highlights;
}

