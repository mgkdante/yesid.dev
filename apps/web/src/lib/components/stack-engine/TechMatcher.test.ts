// TechMatcher tests (slice-29 Task 9, AND-rewrite go2/w4) — written FIRST per TDD.
// Compose-as-matching: chips grouped by layer, picks light archetype match
// cards, and an unusual combo gets a CTA — never a blank state.
// go2/w4: matching is AND — every pick must be in a card's stack, so more
// picks narrow the rail (and reach zero-match more often).

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { STACK_LAYERS } from '@repo/shared/schemas';
import TechMatcher from './TechMatcher.svelte';
import { stackArchetypes } from '$lib/content/stack-archetypes';
import { EngineState } from './engine-state.svelte';
import { techStackItems } from '$lib/content/tech-stack';
import { encodeBlueprint } from '$lib/utils/blueprint-param';
import { matchArchetypes } from '$lib/utils/stack-matching';

const usedIds = new Set(stackArchetypes.flatMap((a) => a.tech.map((l) => l.id)));
const unmatchedIds = techStackItems.filter((t) => !usedIds.has(t.id)).map((t) => t.id);
const unmatchedTechId = unmatchedIds[0]!;
const secondUnmatchedId = unmatchedIds[1]!;

describe('TechMatcher chips', () => {
	it('renders a chip per committed tech item', () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		for (const t of techStackItems) {
			expect(screen.getByTestId(`tech-chip-${t.id}`)).toBeTruthy();
		}
	});

	it('groups chips by STACK_LAYERS order (trailing more only when layerless techs exist)', () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		const layerless = techStackItems.find((t) => !t.layer);
		const expectedLayers = [...STACK_LAYERS, ...(layerless ? ['more'] : [])];
		const groups = screen.getAllByTestId(/tech-layer-group-/).map((el) => el.getAttribute('data-testid'));
		expect(groups).toEqual(expectedLayers.map((l) => `tech-layer-group-${l}`).filter((id) => groups.includes(id)));
		// every published tech renders exactly one chip
		for (const t of techStackItems) {
			expect(screen.getByTestId(`tech-chip-${t.id}`)).toBeTruthy();
		}
		if (layerless) {
			const moreGroup = screen.getByTestId('tech-layer-group-more');
			expect(
				moreGroup.querySelector(`[data-testid="tech-chip-${layerless.id}"]`),
			).toBeTruthy();
		}
	});


	it('tapping a chip toggles the pick (pressed state + engine set)', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		const chip = screen.getByTestId('tech-chip-postgresql');
		await fireEvent.click(chip);
		expect(engine.pickedTechs.has('postgresql')).toBe(true);
		expect(chip.getAttribute('aria-pressed')).toBe('true');
		await fireEvent.click(chip);
		expect(engine.pickedTechs.has('postgresql')).toBe(false);
		expect(chip.getAttribute('aria-pressed')).toBe('false');
	});

	it('GO-w2t5: chips and match cards carry tactile press affordances', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		const chip = screen.getByTestId('tech-chip-postgresql');
		expect(chip.className).toContain('tap-press');
		// Label lives on an inner span so the settle keyframe composes with
		// pressBounce's scale tween on the button itself.
		expect(chip.querySelector('.chip-label')?.textContent).toBe('PostgreSQL');

		await fireEvent.click(chip);
		const card = screen.getByTestId('match-card-data-pipeline');
		expect(card.className).toContain('tap-press');
	});
});

describe('TechMatcher match cards', () => {
	it('lights archetype cards in the stable grid; matches[0] carries the closest-to-complete tag (go2/w5)', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		await fireEvent.click(screen.getByTestId('tech-chip-docker'));

		// Data-driven (go-day matrix: archetype set grows with the portfolio).
		// go2/w5 stable grid: cards render in CATALOGUE order (never move), so
		// the assertion is SET equality against the matching engine; ranking
		// surfaces as the tag chip on matches[0] instead of position.
		const expected = matchArchetypes(['postgresql', 'docker'], stackArchetypes);
		const cards = screen.getAllByTestId(/^match-card-/);
		expect(new Set(cards.map((c) => c.getAttribute('data-testid')))).toEqual(
			new Set(expected.map((m) => `match-card-${m.slug}`)),
		);
		const top = expected[0];
		const topCard = screen.getByTestId(`match-card-${top.slug}`);
		expect(topCard.textContent).toContain(
			top.missing.length > 0 ? 'closest to complete' : 'complete — tap to draw it',
		);
		// Parts line teaches the gap: "{matched} of {total} parts — {missing} to go".
		expect(topCard.textContent).toContain(
			`${top.matched.length} of ${top.matched.length + top.missing.length} parts`,
		);
		expect(topCard.textContent).toContain(`${top.missing.length} to go`);
	});

	it('go2/w5 stable grid: full catalogue renders pre-pick; ruled-out cards print the AND lesson', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });

		// Pre-pick: every archetype is an idle compose-card (12 on the board).
		expect(screen.getAllByTestId(/^compose-card-/)).toHaveLength(
			engine.archetypes.length,
		);

		// Pick postgresql: the grid stays full — matches + ruled-out cards
		// together still cover the whole catalogue.
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		const matchCards = screen.getAllByTestId(/^match-card-/);
		const outCards = screen.getAllByTestId(/^compose-card-/);
		expect(matchCards.length + outCards.length).toBe(engine.archetypes.length);

		// A ruled-out card names the first conflicting pick (insertion order).
		const out = outCards.find((c) => c.textContent?.includes('ruled out'));
		expect(out).toBeTruthy();
		expect(out!.textContent).toContain("ruled out — PostgreSQL isn't in this recipe");
		expect(out!.getAttribute('aria-disabled')).toBe('true');
	});

	it('go2/w5 build counter narrates the narrowing (single aria-live element)', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		const counter = screen.getByTestId('build-counter');
		expect(counter.getAttribute('aria-live')).toBe('polite');
		expect(counter.textContent).toContain(
			`${engine.archetypes.length} recipes on the board — tap parts to narrow`,
		);

		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		await fireEvent.click(screen.getByTestId('tech-chip-docker'));
		const expected = matchArchetypes(['postgresql', 'docker'], stackArchetypes);
		expect(counter.textContent).toContain(`2 picks → ${expected.length} possible builds`);
		expect(counter.textContent).toContain('each pick narrows, never widens');

		// The counter is THE live region — the rail must not double-announce.
		expect(screen.getByTestId('tech-matcher').querySelectorAll('[aria-live]')).toHaveLength(1);
	});

	it('go2/w5 teach line: empty prompt, then hover/pick explains the tech and its layer', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		const slot = screen.getByTestId('tech-teach-line');
		expect(slot.textContent).toContain("tap a part — I'll tell you what it does.");

		// Pick (mobile path: every pick teaches) — postgresql has `enables`.
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(slot.textContent).toContain('PostgreSQL —');
		expect(slot.textContent).toContain('lives in data: the remembering part — where records live');

		// A tech without `enables` still teaches its layer (graceful, no blank).
		await fireEvent.mouseEnter(screen.getByTestId('tech-chip-threejs-threlte'));
		expect(slot.textContent).toContain('lives in interface: the part people see and touch');
	});

	it('AND contract: every rendered card contains every picked tech, and more picks narrow the rail', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		const afterOne = screen
			.getAllByTestId(/^match-card-/)
			.map((c) => c.getAttribute('data-testid')!);

		await fireEvent.click(screen.getByTestId('tech-chip-sveltekit'));
		const afterTwo = screen
			.getAllByTestId(/^match-card-/)
			.map((c) => c.getAttribute('data-testid')!);

		// Narrowing, never widening — the operator's "more clicks, fewer products".
		expect(afterTwo.length).toBeLessThanOrEqual(afterOne.length);
		expect(afterTwo.every((id) => afterOne.includes(id))).toBe(true);

		// Every surviving card's archetype carries BOTH picks.
		for (const id of afterTwo) {
			const slug = id.replace('match-card-', '');
			const stack = stackArchetypes.find((a) => a.slug === slug)!.tech.map((l) => l.id);
			expect(stack).toContain('postgresql');
			expect(stack).toContain('sveltekit');
		}
	});

	it('clicking a match card opens that archetype blueprint', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		await fireEvent.click(screen.getByTestId('match-card-data-pipeline'));
		expect(engine.activeArchetype).toBe('data-pipeline');
		expect(engine.view).toBe('blueprint');
	});

	it('shows no match cards and no zero-match CTA before any pick (but never blank)', () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		expect(screen.queryAllByTestId(/^match-card-/)).toHaveLength(0);
		expect(screen.queryByTestId('zero-match-cta')).toBeNull();
		// Never a blank state: the matcher always renders its chip groups.
		expect(screen.getAllByTestId(/^tech-layer-group-/).length).toBeGreaterThan(0);
	});
});

describe('TechMatcher zero-match state', () => {
	it('composes the project shape as a teaching moment + prefilled contact link (go2/w5)', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		// derive a published tech no archetype uses → picked.size>0 && matches.length===0.
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		expect(engine.matches).toHaveLength(0);

		const cta = screen.getByTestId('zero-match-cta');
		expect(cta.textContent).toContain(
			'No drawn recipe uses all of these — but the shape is real.',
		);
		// The shape line teaches what a working build usually still needs.
		expect(cta.textContent).toContain('A working build usually still needs');
		// Warm CTA + whisper (teacher voice, never a hard sell).
		expect(cta.textContent).toContain('Take this combo with you →');
		expect(cta.textContent).toContain("if you ever want help building it, I'm around.");
		const link = cta.querySelector('a');
		expect(link?.getAttribute('href')).toBe(
			'/contact?bp=' + encodeBlueprint({ archetype: null, techs: [unmatchedTechId] }),
		);
	});

	it('zero-match link carries every picked tech', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		await fireEvent.click(screen.getByTestId(`tech-chip-${secondUnmatchedId}`));
		const link = screen.getByTestId('zero-match-cta').querySelector('a');
		expect(link?.getAttribute('href')).toBe('/contact?bp=' + encodeBlueprint({ archetype: null, techs: [unmatchedTechId, secondUnmatchedId] }));
	});

	it('AND contract: adding a matchable pick on top of an unmatched one stays zero-match', async () => {
		// Under AND, a single out-of-catalogue pick poisons every combo — the
		// warm CTA must hold even when a popular tech joins it.
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		expect(screen.getByTestId('zero-match-cta')).toBeTruthy();
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(screen.getByTestId('zero-match-cta')).toBeTruthy();
		expect(screen.queryAllByTestId(/^match-card-/)).toHaveLength(0);
	});

	it('zero-match card disappears once the picks fit an archetype again', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		expect(screen.getByTestId('zero-match-cta')).toBeTruthy();
		// Toggle the unmatched pick OFF, then pick a catalogue tech — the picks
		// are a subset of data-pipeline's stack again.
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(screen.queryByTestId('zero-match-cta')).toBeNull();
		expect(screen.getByTestId('match-card-data-pipeline')).toBeTruthy();
	});
});
