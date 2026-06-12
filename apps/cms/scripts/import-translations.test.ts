// import-translations.test.ts — slice-28.6 T16.
//
// Pure-helper coverage for the FR translation import script. The script's
// live path (Directus writes) is ORCHESTRATOR-ONLY and never exercised here:
// all argument parsing + network execution live behind import.meta.main, so
// importing the module in tests is side-effect-free, and planDrop/--dry-run
// never construct a client (no-network by construction).
import { describe, expect, it } from 'bun:test';
import {
	junctionCollection,
	buildCreatePayload,
	planDrop,
	validateDrop,
	type Drop,
	type Entry,
} from './import-translations';

const serviceEntry: Entry = {
	collection: 'services',
	id: 'data-pipeline',
	parentFk: 'services_id',
	fields: { title: 'Pipelines de données', description: 'Des pipelines fiables.' },
};

const blockEntry: Entry = {
	collection: 'block_about_content',
	id: 1,
	parentFk: 'block_about_content_id',
	fields: { heading: 'À propos' },
};

const drop: Drop = { locale: 'fr', entries: [serviceEntry, blockEntry] };

describe('junctionCollection', () => {
	it('maps a parent collection to its _translations junction', () => {
		expect(junctionCollection('services')).toBe('services_translations');
		expect(junctionCollection('block_about_content')).toBe('block_about_content_translations');
	});
});

describe('buildCreatePayload', () => {
	it('shapes the junction row: parent FK + languages_code + fields', () => {
		expect(buildCreatePayload(serviceEntry, 'fr')).toEqual({
			services_id: 'data-pipeline',
			languages_code: 'fr',
			title: 'Pipelines de données',
			description: 'Des pipelines fiables.',
		});
	});

	it('supports numeric parent ids (block collections)', () => {
		expect(buildCreatePayload(blockEntry, 'fr')).toEqual({
			block_about_content_id: 1,
			languages_code: 'fr',
			heading: 'À propos',
		});
	});
});

describe('planDrop (--dry-run output)', () => {
	it('plans one junction upsert per entry, no I/O', () => {
		const plan = planDrop(drop);
		expect(plan).toHaveLength(2);
		expect(plan[0]).toEqual({
			junction: 'services_translations',
			payload: buildCreatePayload(serviceEntry, 'fr'),
		});
		expect(plan[1]!.junction).toBe('block_about_content_translations');
	});
});

describe('validateDrop', () => {
	it('accepts a well-formed drop', () => {
		expect(() => validateDrop(drop)).not.toThrow();
	});
	it('rejects unsupported locales (en is never a translation row)', () => {
		expect(() => validateDrop({ ...drop, locale: 'en' as Drop['locale'] })).toThrow(/locale/);
	});
	it('rejects entries with empty fields (nothing to write)', () => {
		const bad: Drop = {
			locale: 'fr',
			entries: [{ ...serviceEntry, fields: {} }],
		};
		expect(() => validateDrop(bad)).toThrow(/fields/);
	});
	it('rejects entries missing a parentFk', () => {
		const bad = {
			locale: 'fr',
			entries: [{ ...serviceEntry, parentFk: '' }],
		} as Drop;
		expect(() => validateDrop(bad)).toThrow(/parentFk/);
	});
});
