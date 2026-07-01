// Server-only ($lib/server): pulls in Shiki via syntax-highlight — the whole
// chain must never reach the client bundle (highlighting happens at
// render/prerender time; CodeBlock consumes pre-highlighted HTML).
import { marked } from 'marked';
import {
	parseCodeFence,
	renderCodeTerminalHtml,
	renderMermaidPlaceholderHtml,
} from '$lib/utils/code-fences';
import { highlightCodeHtml } from './syntax-highlight';

marked.use({
	renderer: {
		code({ text, lang }) {
			const parsed = parseCodeFence(lang ? `\`\`\`${lang}\n${text}\n\`\`\`` : text);
			if (parsed.kind === 'mermaid') return renderMermaidPlaceholderHtml(parsed);

			return renderCodeTerminalHtml(parsed, highlightCodeHtml(parsed.body, parsed.normalizedLanguage));
		},
	},
});

export { marked };
