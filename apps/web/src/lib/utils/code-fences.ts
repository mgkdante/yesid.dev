export type ParsedCodeFence =
	| {
			kind: 'code';
			raw: string;
			body: string;
			language: string | null;
			normalizedLanguage: string;
			title: string;
	  }
	| {
			kind: 'mermaid';
			raw: string;
			body: string;
			language: 'mermaid';
			normalizedLanguage: 'mermaid';
			title: 'mermaid';
	  };

/** A rendered README: sanitized prose HTML, or a top-level fence for the CMS CodeBlock. */
export type ReadmeSegment = { html: string } | { fence: string; highlighted?: string };

const LANGUAGE_ALIASES = new Map<string, string>([
	['bash', 'sh'],
	['shell', 'sh'],
	['shell-session', 'sh'],
	['terminal', 'sh'],
	['zsh', 'sh'],
	['typescript', 'ts'],
	['javascript', 'js'],
	['markdown', 'md'],
]);

export function normalizeCodeLanguage(language: string | null | undefined): string {
	const normalized = language?.trim().toLowerCase();
	if (!normalized) return 'text';
	return LANGUAGE_ALIASES.get(normalized) ?? normalized;
}

export function parseCodeFence(code: string): ParsedCodeFence {
	const trimmed = code.trim();
	const fenced = /^```([A-Za-z0-9_+#.-]+)?[^\n]*\n([\s\S]*?)\n```$/i.exec(trimmed);
	if (fenced?.[2]?.trim()) {
		const language = fenced[1]?.trim().toLowerCase() || null;
		const body = fenced[2].replace(/\s+$/g, '');
		const normalizedLanguage = normalizeCodeLanguage(language);
		if (normalizedLanguage === 'mermaid') {
			return {
				kind: 'mermaid',
				raw: code,
				body,
				language: 'mermaid',
				normalizedLanguage: 'mermaid',
				title: 'mermaid',
			};
		}
		return { kind: 'code', raw: code, body, language, normalizedLanguage, title: normalizedLanguage };
	}

	const prefixed = /^mermaid\s*\n([\s\S]+)$/i.exec(trimmed);
	if (prefixed?.[1]?.trim()) {
		return {
			kind: 'mermaid',
			raw: code,
			body: prefixed[1].trim(),
			language: 'mermaid',
			normalizedLanguage: 'mermaid',
			title: 'mermaid',
		};
	}

	return {
		kind: 'code',
		raw: code,
		body: code,
		language: null,
		normalizedLanguage: 'text',
		title: 'text',
	};
}

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
