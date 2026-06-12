// BlueprintCTA tests (slice-29 Task 12, go2/w5 taste round 2) — written FIRST
// per TDD. Two exits from an active archetype: the blueprint-prefilled
// contact handoff and the delivering service. Hrefs are pinned exactly.
//
// Taste round 2 (operator verdict): the proof-project link is GONE from the
// engine — these suites pin its ABSENCE. proofProjectSlug stays in the
// schema/content (the dashboard seed still carries one); the engine just
// never renders it.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import BlueprintCTA from './BlueprintCTA.svelte';
import { encodeBlueprint } from '$lib/utils/blueprint-param';
import { stackArchetypes } from '$lib/content/stack-archetypes';

const dashboard = stackArchetypes.find((a) => a.slug === 'data-dashboard')!;

describe('BlueprintCTA (goal mode — archetype stack)', () => {
	it('pins the two exits + labels for the dashboard seed', () => {
		render(BlueprintCTA, { props: { archetype: dashboard } });

		const blueprint = screen.getByTestId('cta-blueprint');
		expect(blueprint.getAttribute('href')).toBe(
			'/contact?bp=' + encodeBlueprint({ archetype: 'data-dashboard', techs: dashboard.tech.map((l) => l.id) }),
		);
		expect(blueprint.textContent).toContain('Take this blueprint with you');

		// Taste round 2: the service link speaks hire in the homey voice.
		const service = screen.getByTestId('cta-service');
		expect(service.getAttribute('href')).toBe(`/services/${dashboard.serviceId}`); // consolidation remaps live (gate A: analytics-reporting)
		expect(service.textContent).toContain('Hire this — see the service behind it');
	});

	it('taste round 2: NO proof link, even when the archetype carries a proofProjectSlug', () => {
		expect(dashboard.proofProjectSlug).toBeTruthy(); // data stays — rendering stops
		render(BlueprintCTA, { props: { archetype: dashboard } });
		expect(screen.queryByTestId('cta-proof')).toBeNull();
		expect(screen.getByTestId('blueprint-cta').textContent).not.toContain('I built this');
	});

	it('go2/w5: the whisper line sits under the CTA row', () => {
		render(BlueprintCTA, { props: { archetype: dashboard } });
		expect(screen.getByTestId('blueprint-cta').textContent).toContain(
			"if you ever want help building it, I'm around.",
		);
	});
});

describe('BlueprintCTA (compose mode — picked techs)', () => {
	it('blueprint href carries the picked ids instead of the full stack', () => {
		render(BlueprintCTA, {
			props: { archetype: dashboard, composeTechs: ['postgresql', 'docker'] },
		});
		expect(screen.getByTestId('cta-blueprint').getAttribute('href')).toBe(
			'/contact?bp=data-dashboard~postgresql.docker',
		);
		// The service still points at the archetype's row.
		expect(screen.getByTestId('cta-service').getAttribute('href')).toBe(`/services/${dashboard.serviceId}`);
	});
});

// Yellow-conversion rule (go2/w5 operator doctrine): yellow buttons mean
// "talk to Yesid" conversion ONLY; orange covers every other interaction.
// happy-dom can't compute scoped component CSS, so these are SOURCE locks
// (engine-fullbleed-css / style-regressions precedent).
describe('yellow-conversion rule — the blueprint CTA wears signage yellow', () => {
	const src = readFileSync(
		resolve(process.cwd(), 'src/lib/components/stack-engine/BlueprintCTA.svelte'),
		'utf-8',
	);

	it('cta-primary: signage pairing — --accent surface under the fixed near-black ink (#1C1814 on #FFB627 ≈ 10:1, AA in both themes)', () => {
		const rule = src.match(/\.cta-primary \{[^}]*\}/);
		expect(rule, '.cta-primary rule must exist').not.toBeNull();
		expect(rule![0]).toContain('background: var(--accent);');
		expect(rule![0]).toContain('color: #1C1814;');
		expect(rule![0]).not.toContain('var(--primary)');
	});

	it('hover steps down the accent system (darker yellow via --accent-hover, ink holds, never orange)', () => {
		const hover = src.match(/\.cta-primary:hover \{[^}]*\}/);
		expect(hover, '.cta-primary:hover rule must exist').not.toBeNull();
		expect(hover![0]).toContain('background: var(--accent-hover);');
		expect(hover![0]).toContain('color: #1C1814;');
		expect(hover![0]).not.toContain('var(--primary)');
	});

	it("the 'Hire this' service link STAYS in the orange grammar (exploration, not conversation)", () => {
		const hover = src.match(/\.cta-link:hover \{[^}]*\}/);
		expect(hover, '.cta-link:hover rule must exist').not.toBeNull();
		expect(hover![0]).toContain('color: var(--primary);');
	});
});

describe('scenario archetypes (service-optional)', () => {
	const scenario = {
		...dashboard,
		slug: 'automated-workflow',
		proofProjectSlug: undefined,
		serviceId: undefined,
	};

	it('hides the service link; the blueprint handoff label holds steady', () => {
		render(BlueprintCTA, { archetype: scenario });
		expect(screen.queryByTestId('cta-service')).toBeNull();
		expect(screen.queryByTestId('cta-proof')).toBeNull();
		// Taste round 2: one constant label — no more proof-keyed flip.
		expect(screen.getByTestId('cta-blueprint').textContent?.trim()).toBe(
			'Take this blueprint with you →',
		);
		expect(screen.getByTestId('cta-blueprint').getAttribute('href')).toContain('bp=automated-workflow~');
	});
});
