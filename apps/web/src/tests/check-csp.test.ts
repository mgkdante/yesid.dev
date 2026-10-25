import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Window } from 'happy-dom';
import { checkHtml, scriptHash } from '../../scripts/check-csp';

const source = '\n  window.ready = true;\n';
const hash = `'sha256-${createHash('sha256').update(source).digest('base64')}'`;
const connect = "'self' https://plausible.io https://api.web3forms.com https://transit.yesid.dev";
const meta = `<meta http-equiv="content-security-policy" content="script-src 'self' ${hash}; connect-src ${connect}">`;
function page(head: string, body = ''): string {
	return `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
}
const fixture = page(meta, `<script>${source}</script>`);
const template = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
const themeSource = (() => {
	const window = new Window({
		settings: {
			enableJavaScriptEvaluation: false,
			disableJavaScriptFileLoading: true,
			enableCSSFileLoading: false,
			enableImageFileLoading: false,
		},
	});
	try {
		const scripts = new window.DOMParser().parseFromString(template, 'text/html').querySelectorAll('script');
		if (scripts.length !== 1) throw new Error('Expected exactly one app.html theme script');
		return scripts[0].textContent;
	} finally {
		window.close();
	}
})();
const themeHash = `'sha256-${createHash('sha256').update(themeSource.replace(/\r\n?/g, '\n')).digest('base64')}'`;
const themeMeta = meta.replace(hash, `${hash} ${themeHash}`);

describe('post-build CSP guard', () => {
	it('passes a hashed inline script and exact connect allow-list', () => {
		expect(scriptHash(source)).toBe(hash);
		expect(checkHtml(fixture)).toEqual([]);
	});

	it('passes when the head CSP precedes executable scripts in both head and body', () => {
		expect(checkHtml(page(`${meta}<script>${source}</script>`, `<script>${source}</script>`))).toEqual([]);
	});

	it.each(['\n', '\r\n', '\r'])('permits the app.html theme script before the CSP with %j line endings', (ending) => {
		const theme = themeSource.replace(/\r\n?/g, '\n').replaceAll('\n', ending);
		expect(checkHtml(page(`<script>${theme}</script>${themeMeta}`, `<script>${source}</script>`))).toEqual([]);
	});

	it.each([
		`<script>${themeSource}</script><script>${themeSource}</script>`,
		`<script>${themeSource}</script><script>${source}</script>`,
		`<script>${source}</script><script>${themeSource}</script>`,
	])('rejects two executable scripts before the CSP: %s', (scripts) => {
		expect(checkHtml(page(scripts + themeMeta))).toContain('more than one executable script precedes the CSP meta');
	});

	it('requires the permitted theme script hash in script-src too', () => {
		expect(checkHtml(page(`<script>${themeSource}</script>${meta}`))).toContain(
			`inline script 1 missing script-src hash ${themeHash}`,
		);
	});

	it.each([`<script>${source}</script>`, '<script src="/app.js"></script>', `<script src="/app.js">${themeSource}</script>`])(
		'rejects a CSP meta after an executable script: %s',
		(script) => {
			expect(checkHtml(page(script + meta))).toContain('CSP meta must precede executable script 1 unless it matches the app.html theme script');
		},
	);

	it('rejects a CSP meta outside the head even if it precedes scripts', () => {
		expect(checkHtml(page('', `${meta}<script>${source}</script>`))).toContain('CSP meta must be inside <head>');
	});

	it.each(['\r\n', '\r'])('hashes parser-normalized line endings for %j', (ending) => {
		const raw = source.replaceAll('\n', ending);
		const rawHash = `'sha256-${createHash('sha256').update(raw).digest('base64')}'`;
		expect(rawHash).not.toBe(hash);
		expect(scriptHash(raw)).toBe(hash);
		expect(checkHtml(page(meta, `<script>${raw}</script>`))).toEqual([]);
		expect(checkHtml(page(meta.replace(hash, rawHash), `<script>${raw}</script>`))).toContain(
			`inline script 1 missing script-src hash ${hash}`,
		);
	});

	it('rejects a missing hash and preserves script whitespace', () => {
		expect(checkHtml(fixture.replace(hash, ''))).toContain(`inline script 1 missing script-src hash ${hash}`);
		expect(checkHtml(fixture.replace(source, source.trim()))).toEqual([
			`inline script 1 missing script-src hash ${scriptHash(source.trim())}`,
		]);
	});

	it('rejects missing or duplicate CSP meta elements', () => {
		expect(checkHtml('<html></html>')).toContain('expected exactly one CSP meta, found 0');
		expect(checkHtml(fixture.replace(meta, meta + meta))).toContain('expected exactly one CSP meta, found 2');
	});

	it.each(['onclick="run()"', "ONCLICK='run()'", 'onload=run()'])('rejects inline handler %s', (handler) => {
		expect(checkHtml(page(meta, `<button ${handler}>Go</button>`)).some((error) => error.startsWith('inline event handler'))).toBe(true);
	});

	it.each(['', ' type=""', ' type="module"', ' type="text/javascript"', ' type="application/javascript"', ' type="text/ecmascript"', ' type="importmap"', ' type="speculationrules"', ' type="unknown"'])('checks executable script type %s', (type) => {
		expect(checkHtml(page(meta, `<script${type}>unhashed()</script>`))).toContain(
			`inline script 1 missing script-src hash ${scriptHash('unhashed()')}`,
		);
	});

	it.each(['application/ld+json', 'application/json'])('ignores inert %s data before the CSP', (type) => {
		expect(checkHtml(page(`<script type="${type}">{"data":true}</script>${meta}`))).toEqual([]);
	});

	it.each(['script-src-elem', 'script-src-attr'])('rejects directive precedence from %s', (directive) => {
		expect(checkHtml(fixture.replace('; connect-src', `; ${directive} 'unsafe-inline'; connect-src`))).toContain(
			`${directive} must not override script-src`,
		);
	});

	it('ignores external scripts, inert JSON-LD, comments, and handler-like strings', () => {
		expect(checkHtml(page(meta, `<script>${source}</script><script src="/app.js"></script><script type="application/ld+json">{"onclick":"data"}</script><!-- <img onerror="run()"> --><p title="onclick='data'">Text</p>`))).toEqual([]);
	});

	it.each([connect.replace(' https://plausible.io', ''), `${connect} https://example.com`, connect.replace("'self'", 'https://plausible.io')])('rejects changed connect-src %s', (sources) => {
		expect(checkHtml(fixture.replace(connect, sources)).some((error) => error.startsWith('connect-src must equal'))).toBe(true);
	});

	it('parses mixed-case attributes, single quotes, and HTML entities', () => {
		const policy = `script-src &#39;self&#39; ${hash.replaceAll("'", '&#39;')}; connect-src ${connect.replaceAll("'", '&#39;')}`;
		expect(checkHtml(page(`<META CONTENT='${policy}' HTTP-EQUIV='Content-Security-Policy'>`, `<script>${source}</script>`))).toEqual([]);
	});
});
