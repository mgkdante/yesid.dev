import { describe, expect, it } from 'bun:test';
import { getExportSkipReason } from './export-fallbacks';

describe('export-fallbacks skip policy', () => {
	it('skips when EXPORT_FALLBACKS_SKIP is enabled', () => {
		expect(getExportSkipReason({ EXPORT_FALLBACKS_SKIP: '1' })).toBe('EXPORT_FALLBACKS_SKIP');
		expect(getExportSkipReason({ EXPORT_FALLBACKS_SKIP: 'true' })).toBe('EXPORT_FALLBACKS_SKIP');
	});

	it('skips Vercel builds by default so committed content remains authoritative', () => {
		expect(getExportSkipReason({ VERCEL_ENV: 'preview' })).toBe('VERCEL_ENV=preview');
		expect(getExportSkipReason({ VERCEL_ENV: 'production' })).toBe('VERCEL_ENV=production');
	});

	it('allows an explicit live CMS export on Vercel when requested', () => {
		expect(getExportSkipReason({ VERCEL_ENV: 'production', EXPORT_FALLBACKS_LIVE: '1' })).toBeNull();
	});

	it('does not skip local explicit export commands by default', () => {
		expect(getExportSkipReason({})).toBeNull();
	});
});
