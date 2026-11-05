import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import fields from '../ops/metric-sources-fields.json';
import flowPacket from '../ops/metric-sources-flow.json';
import messages from '../ops/metric-sources-translations.json';
import { ImpactMetricSchema } from '@repo/shared/schemas';

const read = (path: string) => JSON.parse(readFileSync(resolve(import.meta.dir, path), 'utf8'));
const legacy = read('../directus/snapshot/fields/services/impact_metric_source_url.json');
const pattern = legacy.meta.validation._and[0]._or[2].impact_metric_source_url._regex;
const metric = { value: { en: '4' }, label: { en: 'sites' } };
type Trigger = { collection: string; payload: unknown };
const validate: (data: { $trigger: Trigger }) => unknown = runInNewContext(`${flowPacket.operation.options.code}; module.exports`, { module: { exports: null } });

describe('named metric sources packet', () => {
	it('adds exactly two nullable JSON repeaters with the existing URL rule and localized fields', () => {
		expect(fields.map(step => `${step.payload.collection}.${step.payload.field}`)).toEqual(['services.impact_metric_sources', 'projects_impact_metrics.sources']);
		for (const { payload, method, path } of fields) {
			const snapshot = read(`../directus/snapshot/fields/${payload.collection}/${payload.field}.json`);
			const { name: _name, table: _table, data_type: _dataType, ...schema } = snapshot.schema;
			expect(payload).toEqual({ ...snapshot, schema });
			expect([method, path, payload.type, payload.meta.interface]).toEqual(['POST', `/fields/${payload.collection}`, 'json', 'list']);
			expect(payload.schema.is_nullable).toBe(true);
			expect(payload.schema.default_value).toBeNull();
			expect(payload.meta.required).toBe(false);
			const url = payload.meta.options.fields.find(field => field.field === 'url')!;
			const rule = url.meta.validation._and[0]!;
			expect('url' in rule && rule.url._regex).toBe(pattern);
			for (const field of payload.meta.options.fields) {
				expect(field.meta.translations.map(row => row.language)).toEqual(['en-US', 'fr-CA', 'es-ES']);
			}
		}
	});

	it('keeps flow, operation, translations and narrow service grants aligned with the packet', () => {
		const flow = read('../directus/collections/flows.json').find((row: { _syncId: string }) => row._syncId === flowPacket.flowSyncId);
		const operation = read('../directus/collections/operations.json').find((row: { _syncId: string }) => row._syncId === flowPacket.operationSyncId);
		expect(flow).toEqual({ ...flowPacket.flow, _syncId: flowPacket.flowSyncId });
		expect(operation).toEqual({ ...flowPacket.operation, _syncId: flowPacket.operationSyncId });
		expect(flow.options).toEqual({ type: 'filter', scope: ['items.create', 'items.update'], collections: ['services', 'projects_impact_metrics'], return: '$last' });
		expect(operation.reject).toBeNull();
		for (const message of messages) expect(read('../directus/collections/translations.json')).toContainEqual({ ...message.payload, _syncId: message.syncId });
		for (const action of ['read', 'update']) {
			const grant = read('../directus/collections/permissions.json').find((row: { _syncId: string }) => row._syncId === `he-services-impact-proof-${action}`);
			expect(grant.fields).toEqual(['impact_metric_source_url', 'impact_metric_as_of', 'impact_metric_sources']);
			expect(grant.policy).toBe('_sync_human_editor_policy');
			expect(grant.permissions).toEqual({});
		}
	});

	for (const collection of ['services', 'projects_impact_metrics']) {
		const field = collection === 'services' ? 'impact_metric_sources' : 'sources';
		it(`${collection}: preserves payloads and accepts absent/null/empty lists or public named URLs`, () => {
			for (const sources of [undefined, null, [], [{ label: 'Site A', url: 'https://example.org' }, { label: 'Site B', url: 'https://example.net:443/proof' }]]) {
				const payload = { title: 'untouched', ...(sources === undefined ? {} : { [field]: sources }) };
				expect(validate({ $trigger: { collection, payload } })).toEqual(payload);
				if (sources) expect(ImpactMetricSchema.safeParse({ ...metric, sources }).success).toBe(true);
			}
		});
		it(`${collection}: refuses every invalid URL or unnamed entry, including a bad later row or bulk payload`, () => {
			for (const url of ['http://example.org', 'javascript:alert(1)', '/relative', 'https://user@example.org', 'https://user:pass@example.org', 'https://', 'https://example.org:65536', 'https://example.org\\@evil.org', 'https://example.org\n']) {
				const payload = [{ title: 'untouched' }, { [field]: [{ label: 'Valid', url: 'https://example.org' }, { label: 'Invalid', url }] }];
				let error;
				try { validate({ $trigger: { collection, payload } }); } catch (caught) { error = JSON.parse(String(caught)); }
				expect(error).toMatchObject({ code: 'FAILED_VALIDATION', status: 400, extensions: { field } });
			}
			for (const sources of [{ label: 'Not a list' }, [{ label: ' ', url: 'https://example.org' }], [{ label: 'Missing URL' }]]) {
				expect(() => validate({ $trigger: { collection, payload: { [field]: sources } } })).toThrow();
			}
		});
	}
});

