import { describe, expect, it } from 'bun:test';
import { buildFieldSteps, buildArchiveSteps, parseFlags } from '../scripts/setup-block-flat-fields';
import { FLAT_FIELD_PLAN } from '../scripts/lib/flat-field-plan';

describe('setup-block-flat-fields buildFieldSteps', () => {
	const steps = buildFieldSteps();
	it('emits one POST /fields step per plan entry', () => {
		expect(steps.length).toBe(FLAT_FIELD_PLAN.length);
		for (const s of steps) {
			expect(s.method).toBe('POST');
			expect(s.path).toMatch(/^\/fields\/block_/);
		}
	});
	it('string columns get input interface, text get input-multiline', () => {
		const line1 = steps.find((s) => s.payload.field === 'headline_line1');
		expect((line1!.payload.meta as { interface: string }).interface).toBe('input');
		const vp = steps.find((s) => s.payload.field === 'identity_value_prop');
		expect(vp!.payload.type).toBe('text');
		expect((vp!.payload.meta as { interface: string }).interface).toBe('input-multiline');
	});
	it('polaroids becomes a per-locale repeater (list + cast-json) on translations', () => {
		const pol = steps.find(
			(s) => s.payload.field === 'polaroids' && s.path === '/fields/block_about_content_translations',
		);
		const meta = pol!.payload.meta as { interface: string; special: string[]; options: { fields: { field: string }[] } };
		expect(pol!.payload.type).toBe('json');
		expect(meta.interface).toBe('list');
		expect(meta.special).toEqual(['cast-json']);
		expect(meta.options.fields.map((f) => f.field)).toEqual(['src', 'alt', 'caption', 'rotate']);
	});
	it('weather_enabled is a boolean toggle on the parent', () => {
		const we = steps.find((s) => s.payload.field === 'weather_enabled');
		expect(we!.path).toBe('/fields/block_about_content');
		expect(we!.payload.type).toBe('boolean');
		expect((we!.payload.meta as { special: string[] }).special).toEqual(['cast-boolean']);
	});
	it('every new field carries a replaces-note for the capture diff', () => {
		for (const s of steps) {
			expect((s.payload.meta as { note: string }).note).toContain('replaces');
		}
	});
	it('seeded terminal template fields note the hardcoded-string origin (operator addendum)', () => {
		const cmd = steps.find((s) => s.payload.field === 'terminal_cmd');
		expect(cmd!.path).toBe('/fields/block_tech_stack_page_content_translations');
		expect((cmd!.payload.meta as { note: string }).note).toContain('hardcoded');
		expect((cmd!.payload.meta as { note: string }).note).toContain('{count}');
	});
	it('parseFlags: dry-run default, --apply opt-in', () => {
		expect(parseFlags([])).toEqual({ apply: false, archiveOld: false });
		expect(parseFlags(['--apply'])).toEqual({ apply: true, archiveOld: false });
		expect(parseFlags(['--archive-old', '--apply'])).toEqual({ apply: true, archiveOld: true });
	});
});

describe('setup-block-flat-fields buildArchiveSteps (go2-t1b3)', () => {
	it('archive pass hides exactly the 30 retired JSON columns', () => {
		const steps = buildArchiveSteps();
		expect(steps.length).toBe(30);
		for (const s of steps) {
			expect(s.method).toBe('PATCH');
			expect((s.payload.meta as { hidden: boolean }).hidden).toBe(true);
			expect((s.payload.meta as { note: string }).note).toContain('ARCHIVED');
		}
	});
	it('does not archive list repeaters, parent arrays, or pre-existing flat columns', () => {
		const paths = buildArchiveSteps().map((s) => s.path);
		for (const keep of [
			'/fields/block_manifesto_translations/pills',
			'/fields/block_manifesto_translations/hidden_transit_lines',
			'/fields/block_about_content_translations/metrics',
			'/fields/block_about_content/tech_stack',
			'/fields/block_closer/cta_href',
		]) {
			expect(paths).not.toContain(keep);
		}
		// Seeded addendum fields have no JSON source — hero is archived exactly once.
		expect(paths.filter((p) => p === '/fields/block_tech_stack_page_content_translations/hero').length).toBe(1);
	});
});
