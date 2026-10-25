import { createHash } from 'node:crypto';

/**
 * Browsers normalize CRLF and lone CR before computing inline script hashes.
 * @param {string} source
 * @returns {`sha256-${string}`}
 */
export function hashScript(source) {
	return `sha256-${createHash('sha256').update(source.replace(/\r\n?/g, '\n')).digest('base64')}`;
}

/** @param {string | undefined} character */
function isTagBoundary(character) {
	return character !== undefined && (character === '/' || character === '>' || character.trim() === '');
}

/**
 * Scan script elements while preserving their original attributes and raw text.
 * @param {string} html
 * @returns {{ attributes: string; content: string }[]}
 */
export function extractInlineScripts(html) {
	const lower = html.toLowerCase();
	const scripts = [];
	let cursor = 0;
	while (true) {
		const start = lower.indexOf('<script', cursor);
		if (start === -1) break;
		if (!isTagBoundary(lower[start + 7])) {
			cursor = start + 7;
			continue;
		}
		const openingEnd = lower.indexOf('>', start + 7);
		if (openingEnd === -1) throw new Error('Unterminated script element');
		let closing = lower.indexOf('</script', openingEnd + 1);
		while (closing !== -1 && !isTagBoundary(lower[closing + 8])) {
			closing = lower.indexOf('</script', closing + 8);
		}
		if (closing === -1) throw new Error('Unterminated script element');
		const closingEnd = lower.indexOf('>', closing + 8);
		if (closingEnd === -1) throw new Error('Unterminated script element');
		scripts.push({
			attributes: html.slice(start + 7, openingEnd).trim(),
			content: html.slice(openingEnd + 1, closing),
		});
		cursor = closingEnd + 1;
	}
	return scripts;
}

/** @param {string} template */
export function hashThemeScript(template) {
	const scripts = extractInlineScripts(template);
	if (scripts.length !== 1 || scripts[0].attributes !== '') {
		throw new Error('CSP requires exactly one plain <script> element in src/app.html');
	}
	return hashScript(scripts[0].content);
}
