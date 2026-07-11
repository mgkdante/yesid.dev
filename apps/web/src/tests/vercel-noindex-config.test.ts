import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

type HeaderRule = {
	source: string;
	has?: Array<{ type: string; value?: string }>;
	headers: Array<{ key: string; value: string }>;
};

describe('Vercel host-scoped noindex policy', () => {
	it('sets X-Robots-Tag only when the request host is dev.yesid.dev', () => {
		const configPath = fileURLToPath(new URL('../../vercel.json', import.meta.url));
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as { headers: HeaderRule[] };
		const noindexRules = config.headers.filter((rule) =>
			rule.headers.some(({ key }) => key.toLowerCase() === 'x-robots-tag'),
		);

		expect(noindexRules).toHaveLength(1);
		expect(noindexRules[0]).toMatchObject({
			source: '/(.*)',
			has: [{ type: 'host', value: 'dev\\.yesid\\.dev' }],
			headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
		});
		expect(new RegExp(noindexRules[0].source).test('/')).toBe(true);
		expect(new RegExp(noindexRules[0].source).test('/about')).toBe(true);
	});
});
