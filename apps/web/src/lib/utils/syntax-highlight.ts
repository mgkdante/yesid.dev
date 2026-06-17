import { createHighlighter } from 'shiki';
import type { ThemeRegistration } from 'shiki';
import { renderPlainCodeHtml } from './code-fences';

const brandTheme: ThemeRegistration = {
	name: 'yesid-brand',
	type: 'dark',
	colors: {
		'editor.background': 'var(--terminal)',
		'editor.foreground': 'var(--terminal-ink)',
	},
	tokenColors: [
		{ scope: ['keyword', 'storage', 'storage.type', 'keyword.control'], settings: { foreground: 'var(--primary)' } },
		{ scope: ['string', 'string.quoted'], settings: { foreground: 'var(--accent-text)' } },
		{ scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: 'var(--muted-foreground)', fontStyle: 'italic' } },
		{ scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: 'var(--secondary-foreground)' } },
		{ scope: ['entity.name.type', 'support.type', 'entity.name.class'], settings: { foreground: 'var(--accent-text)' } },
		{ scope: ['variable', 'variable.other', 'variable.parameter'], settings: { foreground: 'var(--terminal-ink)' } },
		{ scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: 'var(--secondary-foreground)' } },
		{ scope: ['keyword.operator'], settings: { foreground: 'var(--terminal-ink-muted)' } },
		{ scope: ['punctuation'], settings: { foreground: 'var(--terminal-ink-muted)' } },
		{ scope: ['entity.name.tag', 'punctuation.definition.tag'], settings: { foreground: 'var(--primary)' } },
		{ scope: ['entity.other.attribute-name'], settings: { foreground: 'var(--secondary-foreground)' } },
		{ scope: ['string.regexp'], settings: { foreground: 'var(--accent-text)' } },
		{ scope: ['meta.decorator', 'punctuation.decorator'], settings: { foreground: 'var(--accent-text)' } },
		{ scope: ['source.sql'], settings: { foreground: 'var(--terminal-ink)' } },
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
