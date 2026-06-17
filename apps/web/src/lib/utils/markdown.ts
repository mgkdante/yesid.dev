import { marked } from 'marked';
import {
	parseCodeFence,
	renderCodeTerminalHtml,
	renderMermaidPlaceholderHtml,
} from './code-fences';
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
