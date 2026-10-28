import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import { loadWebConfig } from './load-web-config';

import boot from '@yesid/ui/boot.json' with { type: 'json' };
import { createCspDirectives } from '../../scripts/csp-policy.mjs';

vi.stubEnv('VERCEL_ENV', undefined);
const config = await loadWebConfig().finally(() => vi.unstubAllEnvs());

const themeScriptHash = boot.hash as `sha256-${string}`;
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

describe('production security policy', () => {
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

	it('resolves the production policy with VERCEL_ENV unset and the boot script hash', () => {
		// The resolved config includes inactive defaults (undefined/false).
		// Compare every active directive, including any unexpected additions.
		const activeDirectives = (directives: NonNullable<typeof config.csp>['directives']) =>
			Object.fromEntries(Object.entries(directives ?? {}).filter(([, value]) => value !== undefined && value !== false));
		expect({ mode: config.csp?.mode, directives: activeDirectives(config.csp?.directives) }).toEqual({
			mode: 'hash',
			directives: productionDirectives,
		});
		expect(activeDirectives(config.csp?.reportOnly)).toEqual({});
	});
});
