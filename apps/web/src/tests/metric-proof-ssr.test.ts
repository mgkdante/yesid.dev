import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import MetricProof from '#lib/components/shared/MetricProof.svelte';

describe('MetricProof SSR', () => {
	it('ships a native button and reachable popover content without client execution', () => {
		const { body } = render(MetricProof, { props: {
			metric: { value: { en: '30 s' }, label: { en: 'refresh interval' }, sourceUrl: 'https://example.org/evidence', asOf: '2026-11-04' },
			locale: 'en',
		} });
		expect(body).toContain('type="button"');
		expect(body).toContain('popovertarget=');
		expect(body).toContain('popover="auto"');
		expect(body).toContain('href="https://example.org/evidence"');
		expect(body).toContain('As of November 4, 2026');
	});
});
