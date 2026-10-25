import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import config from '../../svelte.config.js';
import { hashThemeScript } from '../../scripts/csp-script-hash.mjs';

const vercel = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));

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

	it('hashes the app.html theme script with HTML line endings and uses only the agreed directives', () => {
		const html = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
		const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
		expect(scripts).toHaveLength(1);
		const hash = `sha256-${createHash('sha256').update(scripts[0][1].replace(/\r\n?/g, '\n')).digest('base64')}`;
		expect(config.kit?.csp).toEqual({
			mode: 'hash',
			directives: {
				'default-src': ['self'],
				'script-src': ['self', hash],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'blob:'],
				'font-src': ['self', 'data:'],
				'connect-src': ['self', 'https://plausible.io', 'https://api.web3forms.com', 'https://transit.yesid.dev'],
				'manifest-src': ['self'],
				'frame-src': ['none'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'upgrade-insecure-requests': true,
			},
		});
	});
});
