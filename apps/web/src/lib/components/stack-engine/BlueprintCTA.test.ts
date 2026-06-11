// BlueprintCTA tests (slice-29 Task 12) — written FIRST per TDD.
// Three exits from an active archetype: proof project, delivering service,
// and the blueprint-prefilled contact handoff. Hrefs are pinned exactly.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import BlueprintCTA from './BlueprintCTA.svelte';
import { stackArchetypes } from '$lib/content/stack-archetypes';

const dashboard = stackArchetypes.find((a) => a.slug === 'data-dashboard')!;

describe('BlueprintCTA (goal mode — archetype stack)', () => {
	it('pins all three hrefs + labels for the dashboard seed', () => {
		render(BlueprintCTA, { props: { archetype: dashboard } });

		const proof = screen.getByTestId('cta-proof');
		expect(proof.getAttribute('href')).toBe('/projects/transit-data-pipeline');
		expect(proof.textContent).toContain('I built this');

		const service = screen.getByTestId('cta-service');
		expect(service.getAttribute('href')).toBe('/services/sql-development');
		expect(service.textContent).toContain('Hire this');

		const blueprint = screen.getByTestId('cta-blueprint');
		expect(blueprint.getAttribute('href')).toBe(
			'/contact?bp=data-dashboard~sveltekit.rest-api.postgresql.docker',
		);
		expect(blueprint.textContent).toContain('Send me this blueprint');
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
		// Proof + service still point at the archetype's rows.
		expect(screen.getByTestId('cta-proof').getAttribute('href')).toBe(
			'/projects/transit-data-pipeline',
		);
		expect(screen.getByTestId('cta-service').getAttribute('href')).toBe(
			'/services/sql-development',
		);
	});
});

describe('scenario archetypes (proof-optional spec amendment)', () => {
	const scenario = {
		...dashboard,
		slug: 'automated-workflow',
		proofProjectSlug: undefined,
		serviceId: undefined,
	};

	it('hides proof and service links, flips the primary label', () => {
		render(BlueprintCTA, { archetype: scenario });
		expect(screen.queryByTestId('cta-proof')).toBeNull();
		expect(screen.queryByTestId('cta-service')).toBeNull();
		expect(screen.getByTestId('cta-blueprint').textContent).toContain('Want to be the first?');
		expect(screen.getByTestId('cta-blueprint').getAttribute('href')).toContain('bp=automated-workflow~');
	});
});
