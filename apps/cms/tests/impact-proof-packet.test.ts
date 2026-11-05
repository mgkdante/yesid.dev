import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import packet from '../ops/impact-proof-fields.json';
import { ImpactMetricSchema } from '@repo/shared/schemas';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(import.meta.dir, path), 'utf8'));
const urlFields = packet.filter(step => step.payload.field.endsWith('source_url'));
const metric = { value: { en: '30 s' }, label: { en: 'synthetic test claim' } };
const urlCases: Array<[string, boolean]> = [
	['https://example.org', true],
	['HTTPS://example.org/proof?version=1#result', true],
	['https://docs.example.org:443/résultats', true],
	['https://example.org:65535/proof', true],
	['https://xn--bcher-kva.example/proof', true],
	['http://example.org', false],
	['javascript:alert(1)', false],
	['/relative', false],
	['https://user:secret@example.org', false],
	['https://user@example.org', false],
	['https://user%3Asecret@example.org', false],
	['https://', false],
	['https:///example.org', false],
	['https://example.org:65536', false],
	['https://example.org:invalid', false],
	['https://999.999.999.999', false],
	['https://[invalid]', false],
	['https://exa%mple.org', false],
	['https://example.org\\@evil.org', false],
	['https://example.org\n', false],
	[' https://example.org', false],
];

describe('impact proof schema packet', () => {
	it('adds exactly four nullable fields with snapshots matching their REST payloads', () => {
		expect(packet.map(step => `${step.payload.collection}.${step.payload.field}`)).toEqual([
			'projects_impact_metrics.source_url', 'projects_impact_metrics.as_of',
			'services.impact_metric_source_url', 'services.impact_metric_as_of',
		]);
		for (const step of packet) {
			const { collection, field } = step.payload;
			const snapshot = JSON.parse(readFileSync(resolve(import.meta.dir, `../directus/snapshot/fields/${collection}/${field}.json`), 'utf8'));
			expect(step.method).toBe('POST');
			expect(step.path).toBe(`/fields/${collection}`);
			const { name: _name, table: _table, data_type: _dataType, ...schema } = snapshot.schema;
			expect(step.payload).toEqual({ ...snapshot, schema });
			expect(step.payload.schema.is_nullable).toBe(true);
			expect(step.payload.schema.default_value).toBeNull();
			expect(step.payload.meta.required).toBe(false);
			expect(step.payload.meta.translations.map(label => label.language)).toEqual(['en-US', 'fr-CA', 'es-ES']);
		}
	});

	for (const { payload } of urlFields) {
		const { collection, field } = payload;
		const snapshot = readJson(`../directus/snapshot/fields/${collection}/${field}.json`);
		const branches = snapshot.meta.validation?._and?.[0]?._or;
		const pattern = branches?.[2]?.[field]?._regex ?? '';

		it(`${collection}.${field} uses the Directus 12.5.1 _and/_or form and accepts both stored empty string and null`, () => {
			expect(snapshot.meta.validation).toEqual({ _and: [{ _or: [
				{ [field]: { _null: true } }, { [field]: { _eq: '' } }, { [field]: { _regex: expect.any(String) } },
			] }] });
			expect(pattern.length).toBeGreaterThan(0);
			// The two explicit branches preserve null and a stored empty string.
			// Both are omitted by the exporter before ImpactMetricSchema runs.
			for (const sourceUrl of [undefined, null, '']) {
				expect(ImpactMetricSchema.safeParse({ ...metric, ...(sourceUrl ? { sourceUrl } : {}) }).success).toBe(true);
			}
		});

		it.each(urlCases)(`${collection}.${field} accepts %s = %s, and every accepted URL passes export`, (sourceUrl, accepted) => {
			const matches = new RegExp(pattern).test(sourceUrl);
			expect(matches).toBe(accepted);
			if (matches) expect(ImpactMetricSchema.safeParse({ ...metric, sourceUrl }).success).toBe(true);
		});

		it(`${collection}.${field} resolves its validation message in every field locale`, () => {
			const translations: Array<{ key: string; language: string; value: string; _syncId: string }> = readJson('../directus/collections/translations.json');
			expect(snapshot.meta.validation_message).toBe('$t:impact_proof_source_invalid');
			for (const label of snapshot.meta.translations) {
				const message = translations.find(row => row.key === 'impact_proof_source_invalid' && row.language === label.language);
				expect(message?.value).toMatch(/https:\/\//);
			}
		});
	}

	it('ships the same three localized messages in the snapshot and REST packet', () => {
		const translations: Array<{ _syncId: string }> = readJson('../directus/collections/translations.json').filter((row: { key: string }) => row.key === 'impact_proof_source_invalid');
		const steps: Array<{ method: string; path: string; payload: unknown; syncId: string }> = readJson('../ops/impact-proof-translations.json');
		expect(steps.map(step => step.payload)).toEqual(translations.map(({ _syncId, ...row }) => row));
		expect(steps.map(step => step.syncId)).toEqual(translations.map(row => row._syncId));
		expect(steps.map(step => [step.method, step.path])).toEqual(Array.from({ length: 3 }, () => ['POST', '/translations']));
	});

	it('keeps the datetime interface on plain date columns whose emitted calendar dates pass export', () => {
		for (const { payload } of packet.filter(step => step.payload.field.endsWith('as_of'))) {
			expect(payload.type).toBe('date');
			expect(payload.meta.interface).toBe('datetime');
			for (const asOf of ['2024-02-29', '2026-11-04', '2026-12-31']) {
				expect(ImpactMetricSchema.safeParse({ ...metric, asOf }).success).toBe(true);
			}
			for (const asOf of ['2026-02-29', '2026-11-04T00:00:00Z']) {
				expect(ImpactMetricSchema.safeParse({ ...metric, asOf }).success).toBe(false);
			}
		}
	});
});
