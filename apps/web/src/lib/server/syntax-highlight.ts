// Server-only ($lib/server): Shiki + 17 grammars is ~300KB gz — it highlights
// at render/prerender time only. Client components (CodeBlock) consume the
// pre-highlighted HTML and must never import this module; SvelteKit fails the
// build if anything client-reachable tries.
import { createHighlighter } from 'shiki';
import type { ThemeRegistration } from 'shiki';
import { renderPlainCodeHtml } from '#lib/utils/code-fences.ts';

const brandTheme: ThemeRegistration = {
	name: 'yesid-brand',
	type: 'dark',
	colors: {
		'editor.background': 'var(--terminal)',
		'editor.foreground': 'var(--terminal-ink)',
	},
	tokenColors: [
		{ scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'entity.name.tag', 'punctuation.definition.tag'], settings: { foreground: 'var(--syntax-keyword)' } },
		{ scope: ['string', 'string.quoted', 'string.regexp', 'entity.name.type', 'support.type', 'entity.name.class', 'meta.decorator', 'punctuation.decorator'], settings: { foreground: 'var(--syntax-string)' } },
		{ scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: 'var(--syntax-comment)', fontStyle: 'italic' } },
		{ scope: ['entity.name.function', 'support.function', 'meta.function-call', 'entity.other.attribute-name'], settings: { foreground: 'var(--syntax-function)' } },
		{ scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: 'var(--syntax-number)' } },
		{ scope: ['keyword.operator', 'punctuation'], settings: { foreground: 'var(--syntax-punctuation)' } },
		{ scope: ['variable', 'variable.other', 'variable.parameter', 'source.sql'], settings: { foreground: 'var(--syntax-plain)' } },
	],
};

const highlighter = await createHighlighter({
	themes: [brandTheme],
	langs: [
		'sql', 'typescript', 'javascript', 'python', 'bash', 'shell',
		'json', 'yaml', 'css', 'html', 'svelte', 'markdown',
		'go', 'rust', 'toml', 'dockerfile', 'graphql',
	],
});

const SHIKI_LANGUAGE_ALIASES = new Map<string, string>([
	['js', 'javascript'],
	['md', 'markdown'],
	['sh', 'bash'],
	['ts', 'typescript'],
]);

export function shikiLanguageFor(language: string): string {
	return SHIKI_LANGUAGE_ALIASES.get(language) ?? language;
}

export function highlightCodeHtml(code: string, normalizedLanguage: string): string {
	try {
		return highlighter.codeToHtml(code, {
			lang: shikiLanguageFor(normalizedLanguage),
			theme: 'yesid-brand',
		});
	} catch {
		try {
			return highlighter.codeToHtml(code, { lang: 'text', theme: 'yesid-brand' });
		} catch {
			return renderPlainCodeHtml(code);
		}
	}
}
