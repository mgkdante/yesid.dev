import { describe, expect, it } from 'vitest';
import { catalog } from '#lib/catalog/index.ts';
import { resolvePageSeo } from './page-seo';

describe('owner phone boundary', () => {
	it('publishes the fixture phone only as the JSON-LD telephone', async () => {
		const { jsonLd = [], ...pageSeo } = await resolvePageSeo('/', 'en', {}, { ownerPhone: '+12025550100' });
		expect(jsonLd.flatMap((node) => 'telephone' in node ? [node.telephone] : [])).toEqual(['+12025550100', '+12025550100']);
		expect(JSON.stringify(pageSeo)).not.toContain('2025550100');
		expect(JSON.stringify(catalog.meta.site())).not.toContain('2025550100');
	});
});
