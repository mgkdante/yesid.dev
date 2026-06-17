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

export function escapeAttribute(value: string): string {
	return escapeHtml(value).replace(/\n/g, '&#10;');
}

export function renderPlainCodeHtml(code: string): string {
	return `<pre><code>${escapeHtml(code)}</code></pre>`;
}

export function renderCodeTerminalHtml(
	parsed: Extract<ParsedCodeFence, { kind: 'code' }>,
	highlightedHtml: string,
): string {
	const language = escapeAttribute(parsed.normalizedLanguage);
	const copyText = escapeAttribute(parsed.body);
	const title = escapeHtml(parsed.title);
	return [
		`<figure class="terminal terminal-code" data-slot="terminal-chrome" data-code-language="${language}" data-code-copy="${copyText}">`,
		'<figcaption class="terminal-titlebar">',
		'<div class="terminal-titlebar-main">',
		'<span class="terminal-signal-head" data-slot="signal-head" aria-hidden="true"><span class="terminal-signal terminal-signal-green"></span><span class="terminal-signal terminal-signal-caution"></span><span class="terminal-signal terminal-signal-stop"></span></span>',
		'<span class="terminal-title">code</span>',
		`<span class="terminal-tag" data-testid="code-block-language">${title}</span>`,
		'</div>',
		'<div class="terminal-titlebar-actions">',
		'<button type="button" class="terminal-code-copy" data-code-copy-button aria-label="Copy code">Copy</button>',
		'</div>',
		'</figcaption>',
		`<div class="terminal-body no-pad terminal-code-body">${highlightedHtml}</div>`,
		'</figure>',
	].join('');
}

export function renderMermaidPlaceholderHtml(parsed: Extract<ParsedCodeFence, { kind: 'mermaid' }>): string {
	const source = escapeAttribute(parsed.body);
	return [
		`<figure class="mermaid-diagram" data-testid="mermaid-diagram" data-mermaid-source="${source}">`,
		'<div class="mermaid-diagram__surface">',
		`<pre class="mermaid-diagram__fallback"><code>${escapeHtml(parsed.body)}</code></pre>`,
		'</div>',
		'</figure>',
	].join('');
}
