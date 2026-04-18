/**
 * Shared markdown renderer with Shiki syntax highlighting.
 * Brand theme: orange keywords, yellow strings, warm muted comments.
 * Both blog.ts and project detail loaders import `marked` from here.
 */
import { createHighlighter } from 'shiki';
import { marked } from 'marked';
import type { ThemeRegistration } from 'shiki';

const brandTheme: ThemeRegistration = {
	name: 'yesid-brand',
	type: 'dark',
	colors: {
		'editor.background': '#1a1814',
		'editor.foreground': '#e8e4de',
	},
	tokenColors: [
		// Keywords: SELECT, FROM, WHERE, import, const, function, if, return...
		{ scope: ['keyword', 'storage', 'storage.type', 'keyword.control'], settings: { foreground: '#E07800' } },
		// Strings: 'hello', "world", `template`
		{ scope: ['string', 'string.quoted'], settings: { foreground: '#FFB627' } },
		// Comments: // ..., /* ... */, -- ...
		{ scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#6b6560', fontStyle: 'italic' } },
		// Functions: myFunction(), COUNT(), pg_stat_statements
		{ scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: '#f0a050' } },
		// Types: string, number, interface, class
		{ scope: ['entity.name.type', 'support.type', 'entity.name.class'], settings: { foreground: '#FFB627' } },
		// Variables + properties
		{ scope: ['variable', 'variable.other', 'variable.parameter'], settings: { foreground: '#e8e4de' } },
		// Constants + numbers: true, false, null, 42, 3.14
		{ scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: '#f0a050' } },
		// Operators: =, ==, !=, +, -, *, &&, ||
		{ scope: ['keyword.operator'], settings: { foreground: '#8a847e' } },
		// Punctuation: {}, (), [], ;, :, .
		{ scope: ['punctuation'], settings: { foreground: '#8a847e' } },
		// Tags (HTML/JSX): <div>, <span>
		{ scope: ['entity.name.tag', 'punctuation.definition.tag'], settings: { foreground: '#E07800' } },
		// Attributes: class=, id=, style=
		{ scope: ['entity.other.attribute-name'], settings: { foreground: '#f0a050' } },
		// Regex
		{ scope: ['string.regexp'], settings: { foreground: '#FFB627' } },
		// Decorators: @decorator
		{ scope: ['meta.decorator', 'punctuation.decorator'], settings: { foreground: '#FFB627' } },
		// SQL-specific: table names, column names
		{ scope: ['source.sql'], settings: { foreground: '#e8e4de' } },
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

marked.use({
	renderer: {
		code({ text, lang }) {
			const language = lang || 'text';
			try {
				return highlighter.codeToHtml(text, {
					lang: language,
					theme: 'yesid-brand',
				});
			} catch {
				// Unknown language — fall back to plain text rendering
				try {
					return highlighter.codeToHtml(text, { lang: 'text', theme: 'yesid-brand' });
				} catch {
					return `<pre><code>${text}</code></pre>`;
				}
			}
		},
	},
});

export { marked };
