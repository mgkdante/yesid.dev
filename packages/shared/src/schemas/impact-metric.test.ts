import { describe, expect, it } from 'bun:test';
import { ImpactMetricSchema } from './project';

// Synthetic proof examples only. Production content must supply its own evidence.
const metric = { value: { en: '30 s' }, label: { en: 'refresh interval' } };

describe('shared impact metric', () => {
	it('accepts an uncited metric and preserves optional proof independently', () => {
		expect(ImpactMetricSchema.parse(metric)).toEqual(metric);
		for (const proof of [{ sourceUrl: 'https://example.org/evidence' }, { asOf: '2026-11-04' }]) {
			expect(ImpactMetricSchema.parse({ ...metric, ...proof })).toEqual({ ...metric, ...proof });
		}
	});
	it.each(['http://example.org', 'javascript:alert(1)', '/relative', 'https://user:secret@example.org', 'https://'])('rejects a non-public HTTPS proof URL: %s', (sourceUrl) => {
		expect(ImpactMetricSchema.safeParse({ ...metric, sourceUrl }).success).toBe(false);
		expect(ImpactMetricSchema.safeParse({ ...metric, sources: [{ label: 'Evidence', url: sourceUrl }] }).success).toBe(false);
	});
	it('preserves named sources alongside the single source and accepts an absent or empty list', () => {
		const sources = [{ label: 'Site A', url: 'https://example.org' }, { label: 'Site B', url: 'https://example.net' }];
		expect(ImpactMetricSchema.parse({ ...metric, sourceUrl: 'https://example.com', sources }).sources).toEqual(sources);
		expect(ImpactMetricSchema.parse({ ...metric, sources: [] }).sources).toEqual([]);
		for (const sources of [[{ label: ' ', url: 'https://example.org' }], [{ url: 'https://example.org' }], 'https://example.org']) {
			expect(ImpactMetricSchema.safeParse({ ...metric, sources }).success).toBe(false);
		}
	});
	it.each(['2026-02-30', '2026-13-01', '2026-11-04T00:00:00Z', 'yesterday'])('rejects a non-calendar date: %s', (asOf) => {
		expect(ImpactMetricSchema.safeParse({ ...metric, asOf }).success).toBe(false);
	});
});
