// Server-only ($lib/server): pulls in Shiki via syntax-highlight — the whole
// chain must never reach the client bundle (highlighting happens at
// render/prerender time; CodeBlock consumes pre-highlighted HTML).
import { marked } from 'marked';
import sanitizeHtml, { type IOptions } from 'sanitize-html';
import {
	parseCodeFence,
	renderCodeTerminalHtml,
	renderMermaidPlaceholderHtml,
} from '$lib/utils/code-fences';
import { highlightCodeHtml } from './syntax-highlight';

const README_DIAGNOSTICS = {
	invalid: '[project-readme] invalid source; section omitted',
	redirect: '[project-readme] redirect refused; section omitted',
	upstream: '[project-readme] upstream response unavailable; section omitted',
	fetch: '[project-readme] fetch failed; section omitted',
	render: '[project-readme] render failed; section omitted',
} as const;

const GITHUB_PATH_SEGMENT = /^[A-Za-z0-9._-]+$/;
const README_FILENAME = /^README(?:\.(?:md|markdown))?$/i;

function safeAbsoluteUrl(value: string, schemes: readonly string[]): boolean {
	try {
		const url = new URL(value);
		return !url.username && !url.password && schemes.includes(url.protocol.slice(0, -1));
	} catch {
		return false;
	}
}

const README_SANITIZER_OPTIONS: IOptions = {
	allowedTags: [
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'p',
		'a',
		'img',
		'strong',
		'em',
		'del',
		'blockquote',
		'ul',
		'ol',
		'li',
		'hr',
		'br',
		'table',
		'thead',
		'tbody',
		'tfoot',
		'tr',
		'th',
		'td',
		'pre',
		'code',
		'figure',
		'figcaption',
		'div',
		'span',
		'button',
		'input',
		'details',
		'summary',
		'kbd',
		'samp',
		'sub',
		'sup',
	],
	allowedAttributes: {
		a: ['href', 'title'],
		img: ['src', 'alt', 'title', 'width', 'height'],
		ol: ['start'],
		th: ['align', 'colspan', 'rowspan'],
		td: ['align', 'colspan', 'rowspan'],
		pre: ['class', 'style', 'tabindex'],
		code: ['class'],
		figure: [
			'class',
			'data-slot',
			'data-code-language',
			'data-code-copy',
			'data-testid',
			'data-mermaid-source',
		],
		figcaption: ['class'],
		div: ['class'],
		span: ['class', 'style', 'data-slot', 'aria-hidden'],
		button: [
			{ name: 'type', values: ['button'] },
			'class',
			'data-code-copy-button',
			'aria-label',
		],
		input: [
			{ name: 'type', values: ['checkbox'] },
			'checked',
			'disabled',
		],
	},
	allowedClasses: {
		figure: ['terminal', 'terminal-code', 'mermaid-diagram'],
		figcaption: ['terminal-titlebar'],
		div: [
			'terminal-titlebar-main',
			'terminal-titlebar-actions',
			'terminal-body',
			'no-pad',
			'terminal-code-body',
			'mermaid-diagram__surface',
		],
		span: [
			'line',
			'terminal-signal-head',
			'terminal-signal',
			'terminal-signal-green',
			'terminal-signal-caution',
			'terminal-signal-stop',
			'terminal-title',
			'terminal-tag',
		],
		pre: ['shiki', 'yesid-brand', 'mermaid-diagram__fallback'],
		button: ['terminal-code-copy'],
	},
	allowedStyles: {
		pre: {
			'background-color': [/^var\(--terminal\)$/],
			color: [/^var\(--terminal-ink\)$/],
		},
		span: {
			color: [
				/^var\(--(?:primary|accent-text|muted-foreground|secondary-foreground|terminal-ink|terminal-ink-muted)\)$/,
			],
			'font-style': [/^(?:italic|normal)$/],
		},
	},
	allowedSchemes: ['http', 'https', 'mailto'],
	allowedSchemesByTag: { img: ['http', 'https'] },
	allowedSchemesAppliedToAttributes: ['href', 'src'],
	allowProtocolRelative: false,
	disallowedTagsMode: 'discard',
	nestingLimit: 64,
	transformTags: {
		a(tagName, attributes) {
			if (attributes.href && !safeAbsoluteUrl(attributes.href, ['http', 'https', 'mailto'])) {
				delete attributes.href;
			}
			return { tagName, attribs: attributes };
		},
		img(tagName, attributes) {
			if (attributes.src && !safeAbsoluteUrl(attributes.src, ['http', 'https'])) {
				delete attributes.src;
			}
			return { tagName, attribs: attributes };
		},
	},
};

function sanitizeReadmeHtml(html: string): string {
	return sanitizeHtml(html, README_SANITIZER_OPTIONS);
}

function githubRawReadmeUrl(value: string): string | null {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return null;
	}
	if (
		url.protocol !== 'https:' ||
		url.port ||
		url.username ||
		url.password ||
		url.search ||
		url.hash
	) {
		return null;
	}

	const encodedSegments = url.pathname.split('/').slice(1);
	if (encodedSegments.length === 0 || encodedSegments.some((segment) => !segment)) return null;
	let segments: string[];
	try {
		segments = encodedSegments.map((segment) => decodeURIComponent(segment));
	} catch {
		return null;
	}
	if (
		segments.some(
			(segment) =>
				!GITHUB_PATH_SEGMENT.test(segment) || segment === '.' || segment === '..',
		)
	) {
		return null;
	}

	let owner = '';
	let repository = '';
	let revision = '';
	let readmePath: string[] = [];
	if (url.hostname === 'github.com') {
		if (segments.length < 5 || segments[2] !== 'blob') return null;
		[owner, repository, , revision, ...readmePath] = segments;
	} else if (url.hostname === 'raw.githubusercontent.com') {
		if (segments.length < 4) return null;
		[owner, repository, revision, ...readmePath] = segments;
	} else {
		return null;
	}
	if (!owner || !repository || !revision || !README_FILENAME.test(readmePath.at(-1) ?? '')) {
		return null;
	}

	return `https://raw.githubusercontent.com/${[owner, repository, revision, ...readmePath]
		.map((segment) => encodeURIComponent(segment))
		.join('/')}`;
}

marked.use({
	renderer: {
		code({ text, lang }) {
			const parsed = parseCodeFence(lang ? `\`\`\`${lang}\n${text}\n\`\`\`` : text);
			if (parsed.kind === 'mermaid') return renderMermaidPlaceholderHtml(parsed);

			return renderCodeTerminalHtml(parsed, highlightCodeHtml(parsed.body, parsed.normalizedLanguage));
		},
	},
});

export async function renderGithubReadme(
	readmeUrl: string | null | undefined,
	request: typeof globalThis.fetch,
): Promise<string | undefined> {
	if (!readmeUrl) return undefined;
	const sourceUrl = githubRawReadmeUrl(readmeUrl);
	if (!sourceUrl) {
		console.warn(README_DIAGNOSTICS.invalid);
		return undefined;
	}

	let response: Response;
	try {
		response = await request(sourceUrl, { credentials: 'omit', redirect: 'manual' });
	} catch {
		console.warn(README_DIAGNOSTICS.fetch);
		return undefined;
	}
	if (response.redirected || (response.status >= 300 && response.status < 400)) {
		console.warn(README_DIAGNOSTICS.redirect);
		return undefined;
	}
	if (!response.ok) {
		console.warn(README_DIAGNOSTICS.upstream);
		return undefined;
	}

	try {
		const markdown = await response.text();
		return sanitizeReadmeHtml(await marked.parse(markdown));
	} catch {
		console.warn(README_DIAGNOSTICS.render);
		return undefined;
	}
}
