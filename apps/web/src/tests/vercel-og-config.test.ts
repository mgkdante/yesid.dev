import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

type RewriteRule = {
	source: string;
	destination: string;
};

type HeaderRule = {
	source: string;
	headers: Array<{ key: string; value: string }>;
};

const configPath = fileURLToPath(new URL('../../vercel.json', import.meta.url));
const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
	rewrites?: RewriteRule[];
	headers?: HeaderRule[];
};

describe('Vercel OG fallback and cache policy', () => {
	it('limits the default fallback to blog and project OG namespaces', () => {
		const fallbackRewrites = (config.rewrites ?? []).filter(
			({ destination }) => destination === '/og/default.en.png',
		);

		expect(fallbackRewrites).toEqual([
			{ source: '/og/blog/(.*)', destination: '/og/default.en.png' },
			{ source: '/og/project/(.*)', destination: '/og/default.en.png' },
		]);
	});

	it('pins browser and Vercel CDN caching for OG assets', () => {
		const ogCacheRules = (config.headers ?? []).filter(
			({ source }) => source === '/og/(.*)',
		);

		expect(ogCacheRules).toEqual([
			{
				source: '/og/(.*)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=60, must-revalidate',
					},
					{
						key: 'Vercel-CDN-Cache-Control',
						value: 'max-age=31536000',
					},
				],
			},
		]);
	});
});
