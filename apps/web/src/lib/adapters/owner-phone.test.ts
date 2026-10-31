import { describe, expect, it, vi } from 'vitest';

vi.mock('#lib/content/site-owner-phone.server.ts', () => ({ ownerPhone: '+12025550100' }));

describe('owner phone boundary', () => {
	it('publishes the owner phone only as the JSON-LD telephone', async () => {
		const { staticAdapter } = await import('./static');
		const { jsonLd = [], ...pageSeo } = await staticAdapter.meta.forRoute('/', 'en');

		expect(jsonLd.flatMap((node) => ('telephone' in node ? [node.telephone] : []))).toEqual([
			'+12025550100',
			'+12025550100',
		]);
		expect(JSON.stringify(pageSeo)).not.toContain('2025550100');
		expect(JSON.stringify(await staticAdapter.meta.site())).not.toContain('2025550100');
	});
});
