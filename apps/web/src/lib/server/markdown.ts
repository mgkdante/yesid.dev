// Server-only ($lib/server): fetches and sanitizes GitHub READMEs; code highlighting stays on the server.
import { marked, type Token, type Tokens } from 'marked';
import sanitizeHtml, { type IOptions } from 'sanitize-html';
import type { ReadmeSegment } from '#lib/utils/code-fences.ts';
import { highlightFence } from './code-highlights';

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
		code: ['class'],
		input: [
			{ name: 'type', values: ['checkbox'] },
			'checked',
			'disabled',
		],
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

function hasRawUrlAmbiguity(value: string): boolean {
	const raw = /^(?:https?):\/\/([^/?#]*)([^?#]*)/iu.exec(value);
	if (!raw) return false;
	const [, authority, pathname] = raw;
	if (authority?.includes(':')) return true;
	for (const encodedSegment of pathname?.split('/') ?? []) {
		let segment: string;
		try {
			segment = decodeURIComponent(encodedSegment);
		} catch {
			return true;
		}
		if (segment === '.' || segment === '..') return true;
	}
	return false;
}

function githubRawReadmeUrl(value: string): string | null {
	if (hasRawUrlAmbiguity(value)) return null;
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

// Top-level fences become CodeBlock segments; the prose between them is sanitized HTML. A fence
// inside a raw <details> stays in that prose so the disclosure is sanitized whole.
async function readmeSegments(markdown: string): Promise<ReadmeSegment[]> {
	const segments: ReadmeSegment[] = [];
	let prose: Token[] = [];
	let openDetails = 0;
	const flush = () => {
		const html = sanitizeReadmeHtml(marked.parser(prose));
		if (html.trim()) segments.push({ html });
		prose = [];
	};
	for (const token of marked.lexer(markdown)) {
		if (token.type === 'html') {
			const opened = token.raw.match(/<details\b/gi)?.length ?? 0;
			const closed = token.raw.match(/<\/details>/gi)?.length ?? 0;
			openDetails = Math.max(0, openDetails + opened - closed);
		}
		if (token.type !== 'code' || openDetails > 0) {
			prose.push(token);
			continue;
		}
		flush();
		const { lang, text } = token as Tokens.Code;
		const fence = lang ? `\`\`\`${lang}\n${text}\n\`\`\`` : text;
		segments.push({ fence, highlighted: await highlightFence(fence) });
	}
	flush();
	return segments;
}

export async function renderGithubReadme(
	readmeUrl: string | null | undefined,
	request: typeof globalThis.fetch,
): Promise<ReadmeSegment[] | undefined> {
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
		return await readmeSegments(await response.text());
	} catch {
		console.warn(README_DIAGNOSTICS.render);
		return undefined;
	}
}
