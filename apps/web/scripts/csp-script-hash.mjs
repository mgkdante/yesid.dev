import { createHash } from 'node:crypto';

/**
 * Browsers normalize CRLF and lone CR before computing inline script hashes.
 * @param {string} source
 * @returns {`sha256-${string}`}
 */
export function hashScript(source) {
	return `sha256-${createHash('sha256').update(source.replace(/\r\n?/g, '\n')).digest('base64')}`;
}

/** @param {string} template */
export function hashThemeScript(template) {
	const scripts = [...template.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
	if (scripts.length !== 1 || scripts[0][1] !== '') {
		throw new Error('CSP requires exactly one plain <script> element in src/app.html');
	}
	return hashScript(scripts[0][2]);
}
