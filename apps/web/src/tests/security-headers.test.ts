import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { Window } from 'happy-dom';

import { loadWebConfig } from './load-web-config';

import { extractInlineScripts, hashThemeScript } from '../../scripts/csp-script-hash.mjs';
import { createCspDirectives } from '../../scripts/csp-policy.mjs';

vi.stubEnv('VERCEL_ENV', undefined);
const config = await loadWebConfig().finally(() => vi.unstubAllEnvs());

const themeScriptHash = hashThemeScript(readFileSync(new URL('../app.html', import.meta.url), 'utf8'));
const productionDirectives = {
	'default-src': ['self'],
	'script-src': ['self', themeScriptHash],
	'style-src': ['self', 'unsafe-inline'],
	'img-src': ['self', 'data:', 'blob:'],
	'font-src': ['self', 'data:'],
	'connect-src': ['self', 'https://plausible.io', 'https://api.web3forms.com', 'https://transit.yesid.dev'],
	'manifest-src': ['self'],
	'frame-src': ['none'],
	'frame-ancestors': ['none'],
	'object-src': ['none'],
	'base-uri': ['self'],
	'form-action': ['self'],
};

const vercel = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));

describe('CSP deployment policy', () => {
	it.each([undefined, 'production', 'development', 'ci', 'Preview'])(
		'uses exactly the production directives for VERCEL_ENV=%s',
		(vercelEnv) => {
			expect(createCspDirectives({ themeScriptHash, vercelEnv })).toEqual(productionDirectives);
		},
	);

	it('appends only the preview toolbar sources and replaces frame-src none', () => {
		expect(createCspDirectives({ themeScriptHash, vercelEnv: 'preview' })).toEqual({
			...productionDirectives,
			'script-src': ['self', themeScriptHash, 'https://vercel.live'],
			'style-src': ['self', 'unsafe-inline', 'https://vercel.live'],
			'img-src': ['self', 'data:', 'blob:', 'https://vercel.live', 'https://vercel.com'],
			'font-src': ['self', 'data:', 'https://vercel.live', 'https://assets.vercel.com'],
			'connect-src': [
				'self',
				'https://plausible.io',
				'https://api.web3forms.com',
				'https://transit.yesid.dev',
				'https://vercel.live',
				'wss://ws-us3.pusher.com',
			],
			'frame-src': ['https://vercel.live'],
		});
	});
});

describe('script element scanner', () => {
	it('matches uppercase tags and preserves raw script text', () => {
		expect(extractInlineScripts('<SCRIPT>\r\nWindow.Ready = true;\r</SCRIPT>')).toEqual([
			{ attributes: '', content: '\r\nWindow.Ready = true;\r' },
		]);
	});

	it('accepts whitespace and attributes on the end tag', () => {
		expect(extractInlineScripts('<script>run()</script\t\n bar>')).toEqual([
			{ attributes: '', content: 'run()' },
		]);
	});

	it('does not match scripts as a tag name or end tag', () => {
		expect(extractInlineScripts('<scripts>data</scripts>')).toEqual([]);
		expect(extractInlineScripts('<script>raw</scripts>text</script>')).toEqual([
			{ attributes: '', content: 'raw</scripts>text' },
		]);
	});

	it('returns trimmed attributes with their original case', () => {
		expect(extractInlineScripts('<script \tTYPE="module" data-Label="Theme" \n>run()</script>')).toEqual([
			{ attributes: 'TYPE="module" data-Label="Theme"', content: 'run()' },
		]);
	});

	it('accepts slash delimiters on script tags', () => {
		expect(extractInlineScripts('<script/>raw</script/>')).toEqual([
			{ attributes: '/', content: 'raw' },
		]);
	});

	it.each(['<script ', '<script type="module"', '<script>run()', '<script>run()</script', '<script>run()</script\t bar'])(
		'throws on an unterminated element: %s',
		(html) => {
			expect(() => extractInlineScripts(html)).toThrow('Unterminated script element');
		},
	);
});

describe('production security policy', () => {
	it.each(['\r\n', '\r'])('normalizes %j line endings when extracting the theme script hash', (ending) => {
		const source = '\n  window.theme = "dark";\n';
		const raw = source.replaceAll('\n', ending);
		const expected = `sha256-${createHash('sha256').update(source).digest('base64')}`;
		expect(hashThemeScript(`<script>${raw}</script>`)).toBe(expected);
		expect(expected).not.toBe(`sha256-${createHash('sha256').update(raw).digest('base64')}`);
	});

	it.each(['', '<script></script><script></script>', '<script type="module"></script>'])(
		'rejects templates without exactly one plain script: %s',
		(template) => {
			expect(() => hashThemeScript(template)).toThrow('CSP requires exactly one plain <script> element in src/app.html');
		},
	);

	it('applies exactly the agreed security headers on every host and path', () => {
		expect(vercel.headers.filter((rule: { source: string; has?: unknown }) => rule.source === '/(.*)' && !rule.has)).toEqual([{
			source: '/(.*)',
			headers: [
				{ key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
				{ key: 'X-Frame-Options', value: 'DENY' },
				{ key: 'X-Content-Type-Options', value: 'nosniff' },
				{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
				{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
				{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
			],
		}]);
	});

	it('preserves the dev noindex and OG cache rules', () => {
		expect(vercel.headers).toHaveLength(3);
		expect(vercel.headers.slice(1)).toEqual([
			{
				source: '/(.*)',
				has: [{ type: 'host', value: 'dev\\.yesid\\.dev' }],
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
			},
			{
				source: '/og/(.*)',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=60, must-revalidate' },
					{ key: 'Vercel-CDN-Cache-Control', value: 'max-age=31536000' },
				],
			},
		]);
	});

	it('resolves the production policy with VERCEL_ENV unset and the HTML-normalized theme hash', () => {
		const html = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
		const window = new Window({
			settings: {
				enableJavaScriptEvaluation: false,
				disableJavaScriptFileLoading: true,
				enableCSSFileLoading: false,
				enableImageFileLoading: false,
			},
		});
		let source: string;
		try {
			const scripts = new window.DOMParser().parseFromString(html, 'text/html').querySelectorAll('script');
			expect(scripts).toHaveLength(1);
			source = scripts[0].textContent;
		} finally {
			window.close();
		}
		const hash = `sha256-${createHash('sha256').update(source.replace(/\r\n?/g, '\n')).digest('base64')}`;
		// The resolved config includes inactive defaults (undefined/false).
		// Compare every active directive, including any unexpected additions.
		const activeDirectives = (directives: NonNullable<typeof config.csp>['directives']) =>
			Object.fromEntries(Object.entries(directives ?? {}).filter(([, value]) => value !== undefined && value !== false));
		expect({ mode: config.csp?.mode, directives: activeDirectives(config.csp?.directives) }).toEqual({
			mode: 'hash',
			directives: {
				...productionDirectives,
				'script-src': ['self', hash],
			},
		});
		expect(activeDirectives(config.csp?.reportOnly)).toEqual({});
	});
});
