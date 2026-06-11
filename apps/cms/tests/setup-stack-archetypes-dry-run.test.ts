import { describe, it, expect } from 'bun:test';
import { STACK_LAYERS } from '@repo/shared/schemas';
import {
	buildSchemaPlan,
	parseFlags,
	type SchemaStep,
} from '../scripts/setup-stack-archetypes-schema';

/** Helper — all steps of a kind. */
const ofKind = (plan: SchemaStep[], kind: SchemaStep['kind']) =>
	plan.filter((s) => s.kind === kind);

describe('setup-stack-archetypes-schema buildSchemaPlan', () => {
	const plan = buildSchemaPlan();

	it('creates the three new collections, parent first', () => {
		const collections = ofKind(plan, 'collection').map((s) => s.target);
		expect(collections).toEqual([
			'stack_archetypes',
			'stack_archetypes_translations',
			'stack_archetypes_tech',
		]);
	});

	it('stack_archetypes collection carries the editor meta (group, archive, display)', () => {
		const step = plan.find((s) => s.kind === 'collection' && s.target === 'stack_archetypes');
		const meta = (step?.payload as { meta: Record<string, unknown> }).meta;
		expect(meta.group).toBe('tech_stack_page');
		expect(meta.icon).toBe('hub');
		expect(meta.archive_field).toBe('status');
		expect(meta.archive_value).toBe('archived');
		expect(meta.display_template).toBe('{{slug}}');
		expect(meta.sort_field).toBe('sort');
	});

	it('stack_archetypes inline fields cover id/status/slug/sort/icon', () => {
		const step = plan.find((s) => s.kind === 'collection' && s.target === 'stack_archetypes');
		const fields = (step?.payload as { fields: { field: string }[] }).fields.map(
			(f) => f.field,
		);
		expect(fields.sort()).toEqual(['icon', 'id', 'slug', 'sort', 'status'].sort());
	});

	it('translations collection fields cover id/parent/language/title/hook/description', () => {
		const step = plan.find(
			(s) => s.kind === 'collection' && s.target === 'stack_archetypes_translations',
		);
		const fields = (step?.payload as { fields: { field: string }[] }).fields.map(
			(f) => f.field,
		);
		expect(fields.sort()).toEqual(
			['id', 'stack_archetypes_id', 'languages_code', 'title', 'hook', 'description'].sort(),
		);
	});

	it('tech junction fields are exactly id/stack_archetypes_id/tech_stack_id/layer/sort', () => {
		const step = plan.find(
			(s) => s.kind === 'collection' && s.target === 'stack_archetypes_tech',
		);
		const fields = (step?.payload as { fields: { field: string }[] }).fields.map(
			(f) => f.field,
		);
		expect(fields.sort()).toEqual(
			['id', 'stack_archetypes_id', 'tech_stack_id', 'layer', 'sort'].sort(),
		);
	});

	it('junction layer field offers exactly the four canonical layers', () => {
		const step = plan.find(
			(s) => s.kind === 'collection' && s.target === 'stack_archetypes_tech',
		);
		const layer = (step?.payload as { fields: { field: string; meta: any }[] }).fields.find(
			(f) => f.field === 'layer',
		);
		const values = layer?.meta.options.choices.map((c: { value: string }) => c.value);
		expect(values).toEqual([...STACK_LAYERS]);
	});

	it('wires the translations junction relations (one_field translations, CASCADE)', () => {
		const relations = ofKind(plan, 'relation');
		const parent = relations.find(
			(s) => s.target === 'stack_archetypes_translations.stack_archetypes_id',
		);
		const lang = relations.find(
			(s) => s.target === 'stack_archetypes_translations.languages_code',
		);
		expect(parent).toBeDefined();
		expect(lang).toBeDefined();
		const parentPayload = parent?.payload as any;
		expect(parentPayload.related_collection).toBe('stack_archetypes');
		expect(parentPayload.meta.one_field).toBe('translations');
		expect(parentPayload.meta.junction_field).toBe('languages_code');
		expect(parentPayload.schema.on_delete).toBe('CASCADE');
		const langPayload = lang?.payload as any;
		expect(langPayload.related_collection).toBe('languages');
		expect(langPayload.meta.junction_field).toBe('stack_archetypes_id');
		expect(langPayload.schema.on_delete).toBe('CASCADE');
	});

	it('wires the tech junction relations (one_field tech, CASCADE both sides)', () => {
		const relations = ofKind(plan, 'relation');
		const parent = relations.find(
			(s) => s.target === 'stack_archetypes_tech.stack_archetypes_id',
		);
		const tech = relations.find((s) => s.target === 'stack_archetypes_tech.tech_stack_id');
		expect((parent?.payload as any).meta.one_field).toBe('tech');
		expect((parent?.payload as any).schema.on_delete).toBe('CASCADE');
		expect((tech?.payload as any).related_collection).toBe('tech_stack');
		expect((tech?.payload as any).schema.on_delete).toBe('CASCADE');
	});

	it('adds proof_project + service M2O fields as string FKs (slug PKs) with SET NULL', () => {
		const fields = ofKind(plan, 'field');
		const proof = fields.find((s) => s.target === 'stack_archetypes.proof_project');
		const service = fields.find((s) => s.target === 'stack_archetypes.service');
		// projects/services PKs are string slugs (verified in directus/snapshot) — not uuid.
		expect((proof?.payload as any).type).toBe('string');
		expect((service?.payload as any).type).toBe('string');

		const relations = ofKind(plan, 'relation');
		const proofRel = relations.find((s) => s.target === 'stack_archetypes.proof_project');
		const serviceRel = relations.find((s) => s.target === 'stack_archetypes.service');
		expect((proofRel?.payload as any).related_collection).toBe('projects');
		expect((proofRel?.payload as any).schema.on_delete).toBe('SET NULL');
		expect((serviceRel?.payload as any).related_collection).toBe('services');
		expect((serviceRel?.payload as any).schema.on_delete).toBe('SET NULL');
	});

	it('adds the translations + tech alias fields on stack_archetypes', () => {
		const fields = ofKind(plan, 'field');
		const translations = fields.find((s) => s.target === 'stack_archetypes.translations');
		expect((translations?.payload as any).type).toBe('alias');
		expect((translations?.payload as any).meta.special).toEqual(['translations']);
		expect((translations?.payload as any).meta.options.languageField).toBe('code');
		const tech = fields.find((s) => s.target === 'stack_archetypes.tech');
		expect((tech?.payload as any).type).toBe('alias');
		expect((tech?.payload as any).meta.interface).toBe('list-m2m');
	});

	it('adds tech_stack.layer (nullable select, four layers) + tech_stack_translations.enables', () => {
		const fields = ofKind(plan, 'field');
		const layer = fields.find((s) => s.target === 'tech_stack.layer');
		expect(layer).toBeDefined();
		const values = (layer?.payload as any).meta.options.choices.map(
			(c: { value: string }) => c.value,
		);
		expect(values).toEqual([...STACK_LAYERS]);
		expect((layer?.payload as any).schema.is_nullable).toBe(true);
		const enables = fields.find((s) => s.target === 'tech_stack_translations.enables');
		expect((enables?.payload as any).type).toBe('string');
		expect((enables?.payload as any).schema.is_nullable).toBe(true);
	});

	it('registers stack_archetypes on the Vercel revalidate flow', () => {
		const triggers = ofKind(plan, 'flow-trigger');
		expect(triggers.length).toBe(1);
		expect(triggers[0]?.target).toBe('stack_archetypes');
		expect((triggers[0]?.payload as any).flowName).toBe('Vercel revalidate on publish');
	});

	it('grants read on every new collection to the public + build-bot policies', () => {
		const perms = ofKind(plan, 'permission');
		// 2 policies × 3 collections
		expect(perms.length).toBe(6);
		const newCollections = [
			'stack_archetypes',
			'stack_archetypes_translations',
			'stack_archetypes_tech',
		];
		for (const collection of newCollections) {
			const forCollection = perms.filter(
				(s) => (s.payload as any).collection === collection,
			);
			expect(forCollection.length).toBe(2);
			for (const step of forCollection) {
				expect((step.payload as any).action).toBe('read');
				expect((step.payload as any).fields).toEqual(['*']);
				expect(step.policyNames?.length).toBeGreaterThan(0);
			}
		}
		const allNames = new Set(perms.flatMap((s) => s.policyNames ?? []));
		expect(allNames.has('Build Bot — content read')).toBe(true);
		// Public policy is named '$t:public_label' in this instance; 'Public' kept as alias.
		expect(allNames.has('$t:public_label') || allNames.has('Public')).toBe(true);
	});

	it('orders schema steps before flow/permission steps and is deterministic', () => {
		const kinds = plan.map((s) => s.kind);
		const firstFlow = kinds.indexOf('flow-trigger');
		const firstPerm = kinds.indexOf('permission');
		const lastSchema = Math.max(
			kinds.lastIndexOf('collection'),
			kinds.lastIndexOf('field'),
			kinds.lastIndexOf('relation'),
		);
		expect(lastSchema).toBeLessThan(firstFlow);
		expect(firstFlow).toBeLessThan(firstPerm);
		expect(buildSchemaPlan()).toEqual(plan);
	});
});

describe('parseFlags', () => {
	it('defaults to dry-run', () => {
		expect(parseFlags([]).apply).toBe(false);
		expect(parseFlags(['--dry-run']).apply).toBe(false);
	});
	it('writes only with explicit --apply', () => {
		expect(parseFlags(['--apply']).apply).toBe(true);
	});
});
