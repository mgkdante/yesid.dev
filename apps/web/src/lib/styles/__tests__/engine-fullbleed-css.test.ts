// GO-w2t5 operator addendum — source locks for the /tech-stack full-bleed
// engine band. CSS layout can't be exercised in happy-dom, so (per the
// tokens.test.ts / motion-policy-css.test.ts precedent) we lock the source
// text; computed-layout behavior is covered by tests/stack-engine.spec.ts
// ("engine band is full-bleed…", Playwright).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');

describe('GO-w2t5 addendum — /tech-stack full-bleed engine band', () => {
	const page = () => read('src/routes/[[lang=locale]]/tech-stack/+page.svelte');
	const engine = () => read('src/lib/components/stack-engine/Engine.svelte');

	it('route wraps the engine zone in an engine-band framed by TWO hazard separators', () => {
		const src = page();
		expect(src).toContain('data-testid="engine-band"');
		// Reuse the shared hazard composable (the /projects dashed orange divider) —
		// no reinvented stripe gradients in the route.
		expect(src).toContain("import { Separator } from '$lib/components/ui/separator'");
		const hazards = src.match(/variant="hazard"/g) ?? [];
		expect(hazards).toHaveLength(2);
	});

	it('engine-band is full-bleed: no max-width cap on the band rule', () => {
		const src = page();
		const rule = src.match(/\.engine-band \{[^}]*\}/);
		expect(rule, '.engine-band rule must exist').not.toBeNull();
		expect(rule![0]).not.toContain('max-width');
	});

	it('band carries the brand tint (cute-pass anchor)', () => {
		const src = page();
		expect(src).toMatch(/\.engine-band \{[^}]*color-mix\(in srgb, var\(--primary\)/);
	});

	it("hero above and CTA below keep their constrained width EXACTLY ('perfect that way')", () => {
		const src = page();
		expect(src).toMatch(/\.hero \{[^}]*max-width: var\(--container-wide\);/);
		expect(src).toMatch(/\.cta-zone \{[^}]*max-width: var\(--container-wide\);/);
	});

	it('taste round 2: the WHOLE engine chain is uncapped — section AND inner (gutters via padding only)', () => {
		const src = engine();
		const sectionRule = src.match(/\.stack-engine \{[^}]*\}/);
		expect(sectionRule, '.stack-engine rule must exist').not.toBeNull();
		expect(sectionRule![0]).not.toContain('max-width');
		// Operator verdict (round 2): the engine "still feels constrained" —
		// .engine-inner's container-wide cap was re-constraining the content
		// the band had just un-constrained. No width cap anywhere in the
		// engine; readable gutters come from the section's --space-page-x
		// padding.
		const innerRule = src.match(/\.engine-inner \{[^}]*\}/);
		expect(innerRule, '.engine-inner rule must exist').not.toBeNull();
		expect(innerRule![0]).not.toContain('max-width');
		expect(sectionRule![0]).toContain('var(--space-page-x)');
	});

	it('taste round 2: the loading placeholder inside the band is uncapped too (no constrained flash)', () => {
		const src = page();
		const rule = src.match(/\.engine-loading \{[^}]*\}/);
		expect(rule, '.engine-loading rule must exist').not.toBeNull();
		expect(rule![0]).not.toContain('max-width');
		expect(rule![0]).toContain('var(--space-page-x)');
	});
});
