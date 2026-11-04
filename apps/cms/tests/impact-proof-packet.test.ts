import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import packet from '../ops/impact-proof-fields.json';

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
			expect(snapshot).toMatchObject(step.payload);
			expect(step.payload.schema.is_nullable).toBe(true);
			expect(step.payload.schema.default_value).toBeNull();
			expect(step.payload.meta.required).toBe(false);
			expect(step.payload.meta.translations.map(label => label.language)).toEqual(['en-US', 'fr-CA', 'es-ES']);
		}
	});
});
