// TechMatcher tests (slice-29 Task 9, AND-rewrite go2/w4) — written FIRST per TDD.
// Compose-as-matching: chips grouped by layer, picks light archetype match
// cards, and an unusual combo gets a CTA — never a blank state.
// go2/w4: matching is AND — every pick must be in a card's stack, so more
// picks narrow the rail (and reach zero-match more often).

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
		// Taste round 2 vocabulary: archetypes are "known builds" everywhere.
		expect(counter.textContent).toContain(
			`${engine.archetypes.length} known builds on the board — tap parts to narrow`,
		);

		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		await fireEvent.click(screen.getByTestId('tech-chip-docker'));
		const expected = matchArchetypes(['postgresql', 'docker'], stackArchetypes);
		expect(counter.textContent).toContain(`2 picks → ${expected.length} known builds`);
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

	it('shows no match cards and no build-shape card before any pick (but never blank)', () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		expect(screen.queryAllByTestId(/^match-card-/)).toHaveLength(0);
		expect(screen.queryByTestId('build-shape')).toBeNull();
		expect(screen.queryByTestId('known-builds-label')).toBeNull();
		// Never a blank state: the matcher always renders its chip groups.
		expect(screen.getAllByTestId(/^tech-layer-group-/).length).toBeGreaterThan(0);
	});
});

describe('TechMatcher build-shape card (taste round 2 — the always-on matrix)', () => {
	it('appears from the FIRST pick and coexists with the known-builds rail', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));

		// Matches exist AND the shape card teaches alongside them — the shape
		// is the primary surface, the archetype cards are the bonus rail.
		expect(engine.matches.length).toBeGreaterThan(0);
		const card = screen.getByTestId('build-shape');
		expect(card.textContent).toContain('Your build: data covered');
		expect(card.textContent).toContain(
			"that's memory with nothing using it yet — records kept safe and queryable.",
		);
		expect(screen.getAllByTestId(/^match-card-/).length).toBe(engine.matches.length);
		expect(screen.getByTestId('known-builds-label').textContent).toContain(
			"known builds — recipes I've already drawn",
		);
	});

	it("pins the operator example: node-js + github-actions always teaches the automation shape", async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-node-js'));
		await fireEvent.click(screen.getByTestId('tech-chip-github-actions'));

		// AND over 12 archetypes finds nothing here — and that must no longer
		// mean NOTHING is taught.
		expect(engine.matches).toHaveLength(0);
		const card = screen.getByTestId('build-shape');
		expect(card.textContent).toContain('Your build: logic + infra covered');
		expect(card.textContent).toContain(
			"that's code with ground to run on — a bot, a scheduled job, an automation.",
		);
		expect(card.textContent).toContain(
			'add an interface layer + a data layer and this becomes a working product.',
		);
		// The picks themselves are named in the roster.
		expect(card.textContent).toContain('Node.js');
		expect(card.textContent).toContain('GitHub Actions');
	});

	it('roster grounds the shape in the picks: enables line when present, name alone when not', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		// postgresql carries an `enables` line; node-js does not (content task
		// pending) — both must list gracefully.
		await fireEvent.click(screen.getByTestId('tech-chip-node-js'));
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));

		const roster = screen.getByTestId('build-shape').querySelector('.shape-roster')!;
		const items = [...roster.querySelectorAll('li')].map((li) => li.textContent?.trim());
		expect(items).toHaveLength(2);
		// STACK_LAYERS order: logic (node-js) before data (postgresql).
		expect(items[0]).toBe('Node.js');
		expect(items[1]).toMatch(/^PostgreSQL — .+/);
	});

	it('complete coverage flips the next-step line to ready-to-build', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		// data-dashboard's stack covers all four layers.
		for (const id of ['sveltekit', 'rest-api', 'postgresql', 'docker']) {
			await fireEvent.click(screen.getByTestId(`tech-chip-${id}`));
		}
		const card = screen.getByTestId('build-shape');
		expect(card.textContent).toContain('Your build: interface + logic + data + infra covered');
		expect(card.textContent).toContain(
			"that's all four layers — the shape of a complete, working product.",
		);
		expect(card.textContent).toContain("nothing missing — this one's ready to build.");
	});

	it('warm CTA + availability door + prefilled contact link (exactly TWO <a>s, hrefs pinned)', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));

		const card = screen.getByTestId('build-shape');
		expect(card.textContent).toContain('Take this combo with you →');
		// Finale (4c): the whisper grew a door — the warm availability line IS
		// a link to /contact (code-owned LocalizedString, en fallback).
		expect(card.textContent).toContain('Questions? Ask me anything.');
		const links = card.querySelectorAll('a');
		expect(links).toHaveLength(2);
		expect(screen.getByTestId('shape-link').getAttribute('href')).toBe(
			'/contact?bp=' + encodeBlueprint({ archetype: null, techs: [unmatchedTechId] }),
		);
		expect(screen.getByTestId('shape-availability').getAttribute('href')).toBe('/contact');
	});

	it('shape link carries every picked tech', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		await fireEvent.click(screen.getByTestId(`tech-chip-${secondUnmatchedId}`));
		const link = screen.getByTestId('shape-link');
		expect(link.getAttribute('href')).toBe('/contact?bp=' + encodeBlueprint({ archetype: null, techs: [unmatchedTechId, secondUnmatchedId] }));
	});

	it('zero-match is just the card with an all-ruled-out rail under it (no dead end)', async () => {
		// Under AND, a single out-of-catalogue pick poisons every combo — the
		// shape card holds even when a popular tech joins it.
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		expect(screen.getByTestId('build-shape')).toBeTruthy();
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(screen.getByTestId('build-shape')).toBeTruthy();
		expect(screen.queryAllByTestId(/^match-card-/)).toHaveLength(0);
		// The label says plainly why the rail is gray.
		expect(screen.getByTestId('known-builds-label').textContent).toContain(
			'no drawn recipe uses all of these yet',
		);
	});

	// ── Round 3: the build shape IS a blueprint. ──────────────────────────
	it('round 3: the card draws BOTH mini-blueprint variants (wide + stacked) from the first pick', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));

		const card = screen.getByTestId('build-shape');
		// CSS swaps them at 768px; both live in the DOM (bp-pair-list precedent).
		const wide = card.querySelector('[data-testid="shape-blueprint"]')!;
		const stacked = card.querySelector('[data-testid="shape-blueprint-stacked"]')!;
		expect(wide).toBeTruthy();
		expect(stacked).toBeTruthy();

		// One pick → 1 solid box + 3 ghosted layers, in EACH variant.
		for (const svg of [wide, stacked]) {
			expect(svg.querySelectorAll('.sbp-box-solid')).toHaveLength(1);
			expect(svg.querySelectorAll('.sbp-box-ghost')).toHaveLength(3);
		}
		// The drawing teaches the gaps in established annotation voice.
		expect(wide.textContent).toContain('+ add an interface layer');
		expect(wide.textContent).toContain('+ add a logic layer');
		expect(wide.textContent).toContain('+ add an infra layer');
	});

	it('round 3: picking into a missing layer flips its ghost solid in the drawing (and back on unpick)', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-node-js'));

		const wide = () =>
			screen.getByTestId('build-shape').querySelector('[data-testid="shape-blueprint"]')!;
		expect(wide().querySelector('[data-testid="sbp-ghost-data"]')).toBeTruthy();
		expect(wide().querySelector('[data-testid="sbp-box-postgresql"]')).toBeNull();

		// The flip the operator loves — ghost out, solid (settle-popping) box in.
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(wide().querySelector('[data-testid="sbp-ghost-data"]')).toBeNull();
		const solid = wide().querySelector('[data-testid="sbp-box-postgresql"]')!;
		expect(solid.classList.contains('sbp-box-solid')).toBe(true);
		expect(wide().querySelectorAll('.sbp-box-solid')).toHaveLength(2);
		expect(wide().querySelectorAll('.sbp-box-ghost')).toHaveLength(2);

		// Unpick → the placeholder returns; the drawing never lies.
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(wide().querySelector('[data-testid="sbp-ghost-data"]')).toBeTruthy();
		expect(wide().querySelectorAll('.sbp-box-ghost')).toHaveLength(3);
	});

	it('round 3: complete coverage graduates the drawing — no ghosts, REV A on the title block', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		for (const id of ['sveltekit', 'rest-api', 'postgresql', 'docker']) {
			await fireEvent.click(screen.getByTestId(`tech-chip-${id}`));
		}
		const wide = screen
			.getByTestId('build-shape')
			.querySelector('[data-testid="shape-blueprint"]')!;
		expect(wide.querySelectorAll('.sbp-box-solid')).toHaveLength(4);
		expect(wide.querySelectorAll('.sbp-box-ghost')).toHaveLength(0);
		expect(wide.querySelectorAll('.sbp-connector-ghost')).toHaveLength(0);
		expect(wide.textContent).toContain('REV A · 4 parts · 4/4 layers');
	});

	it('round 3 (finale-adjusted): the drawing adds no anchors — the card has exactly the TWO pinned links', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		const links = screen.getByTestId('build-shape').querySelectorAll('a');
		expect(links).toHaveLength(2);
		expect(screen.getByTestId('shape-link').getAttribute('href')).toBe(
			'/contact?bp=' + encodeBlueprint({ archetype: null, techs: ['postgresql'] }),
		);
		expect(screen.getByTestId('shape-availability').getAttribute('href')).toBe('/contact');
	});

	// ── Round 4: pick tools + the composed product preview. ────────────────
	it('round 4: pick tools appear with picks; undo forgets the newest; start over clears everything', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		expect(screen.queryByTestId('pick-tools')).toBeNull();

		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		await fireEvent.click(screen.getByTestId('tech-chip-docker'));
		expect(screen.getByTestId('pick-undo').textContent).toContain('undo last pick');
		expect(screen.getByTestId('pick-clear').textContent).toContain('start over');

		// Undo = the NEWEST pick leaves (docker), postgresql stays pressed.
		await fireEvent.click(screen.getByTestId('pick-undo'));
		expect([...engine.pickedTechs]).toEqual(['postgresql']);
		expect(screen.getByTestId('tech-chip-docker').getAttribute('aria-pressed')).toBe('false');
		expect(screen.getByTestId('tech-chip-postgresql').getAttribute('aria-pressed')).toBe('true');

		// Start over: picks gone, card retires, tools retire, counter resets.
		await fireEvent.click(screen.getByTestId('pick-clear'));
		expect(engine.pickedTechs.size).toBe(0);
		expect(screen.queryByTestId('build-shape')).toBeNull();
		expect(screen.queryByTestId('pick-tools')).toBeNull();
		expect(screen.getByTestId('build-counter').textContent).toContain(
			'known builds on the board',
		);
	});

	it("round 4: the shape card flips to 'see your build as a product' and back (still exactly one <a>)", async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine, animate: false } });
		await fireEvent.click(screen.getByTestId('tech-chip-node-js'));
		await fireEvent.click(screen.getByTestId('tech-chip-github-actions'));

		const card = screen.getByTestId('build-shape');
		const toggle = () => screen.getByTestId('shape-view-toggle');
		expect(toggle().textContent).toContain('see your build as a product');

		await fireEvent.click(toggle());
		// The generic product: one slot per pick, in the build-shape card.
		expect(card.querySelector('[data-testid="shape-product"]')).toBeTruthy();
		expect(card.querySelector('[data-testid="slot-node-js"]')).toBeTruthy();
		expect(card.querySelector('[data-testid="slot-github-actions"]')).toBeTruthy();
		// The drawings yield while the product is up…
		expect(card.querySelector('[data-testid="shape-blueprint"]')).toBeNull();
		expect(card.querySelector('[data-testid="shape-blueprint-stacked"]')).toBeNull();
		// …the notes stay, and the card still carries exactly its two links.
		expect(card.querySelectorAll('a')).toHaveLength(2);
		expect(toggle().textContent).toContain('back to the drawing');

		await fireEvent.click(toggle());
		expect(card.querySelector('[data-testid="shape-blueprint"]')).toBeTruthy();
		expect(card.querySelector('[data-testid="shape-product"]')).toBeNull();
	});

	it("round 4: 'start over' then re-picking reopens on the DRAWING — never a stale product view", async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine, animate: false } });
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		await fireEvent.click(screen.getByTestId('shape-view-toggle'));
		expect(
			screen.getByTestId('build-shape').querySelector('[data-testid="shape-product"]'),
		).toBeTruthy();

		await fireEvent.click(screen.getByTestId('pick-clear'));
		expect(screen.queryByTestId('build-shape')).toBeNull();

		await fireEvent.click(screen.getByTestId('tech-chip-docker'));
		const card = screen.getByTestId('build-shape');
		expect(card.querySelector('[data-testid="shape-blueprint"]')).toBeTruthy();
		expect(card.querySelector('[data-testid="shape-product"]')).toBeNull();
	});

	it('round 4 morph hygiene: exactly ONE flip id per tech in the card (only the visible drawing variant tags)', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine, animate: false } });
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		const card = screen.getByTestId('build-shape');
		expect(card.querySelectorAll('[data-flip-id="postgresql"]')).toHaveLength(1);
	});

	it('card leaves only when the last pick leaves', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		expect(screen.getByTestId('build-shape')).toBeTruthy();
		// Swapping the unmatched pick for a catalogue one keeps the card AND
		// brings the known builds back.
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(screen.getByTestId('build-shape')).toBeTruthy();
		expect(screen.getByTestId('match-card-data-pipeline')).toBeTruthy();
		// Unpick everything → the card retires with the picks.
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(screen.queryByTestId('build-shape')).toBeNull();
	});
});

describe('TechMatcher finale 4c — the phrase leads, the journey guides', () => {
	it('the card LEADS with the product sentence; the category line demotes to the kicker', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-node-js'));
		await fireEvent.click(screen.getByTestId('tech-chip-github-actions'));

		const phrase = screen.getByTestId('shape-phrase');
		// The operator pin: logic + infra reads as an automation, market voice.
		expect(phrase.textContent).toMatch(/automation/i);
		expect(phrase.textContent).toContain('ships itself reliably');
		// The old heading survives as the kicker right above the phrase…
		const card = screen.getByTestId('build-shape');
		expect(card.querySelector('.shape-kicker')?.textContent).toBe(
			'Your build: logic + infra covered',
		);
		// …and the 15-subset reading stays as the supporting teaching line.
		expect(card.textContent).toContain(
			"that's code with ground to run on — a bot, a scheduled job, an automation.",
		);
	});

	it('the phrase re-composes as picks change (data layer joins → records language)', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-node-js'));
		expect(screen.getByTestId('shape-phrase').textContent).not.toContain('keeps clean records');
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(screen.getByTestId('shape-phrase').textContent).toContain('keeps clean records');
	});

	it('the stepper lights pick parts → read your build → see it as a product', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine, animate: false } });
		const stepper = screen.getByTestId('engine-stepper');
		const current = () => stepper.querySelector('[aria-current="step"]')?.textContent ?? '';
		expect(stepper.querySelectorAll('li')).toHaveLength(4);
		expect(stepper.textContent).toContain('take it with you');
		expect(current()).toContain('pick parts');

		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(current()).toContain('read your build');

		await fireEvent.click(screen.getByTestId('shape-view-toggle'));
		expect(current()).toContain('see it as a product');

		// Back to the drawing → back to reading; clearing → back to picking.
		await fireEvent.click(screen.getByTestId('shape-view-toggle'));
		expect(current()).toContain('read your build');
		await fireEvent.click(screen.getByTestId('pick-clear'));
		expect(current()).toContain('pick parts');
	});
});

// Yellow-conversion rule (go2/w5 operator doctrine): the availability door is
// a conversion moment, so its link accent joins the signage family — subtler
// than the blueprint button (a door, not a billboard). SOURCE locks, since
// happy-dom can't compute scoped component CSS (engine-fullbleed precedent).
describe('yellow-conversion rule — the availability door speaks accent, softly', () => {
	const src = readFileSync(
		resolve(process.cwd(), 'src/lib/components/stack-engine/TechMatcher.svelte'),
		'utf-8',
	);

	it('door link wears --accent-text (theme-aware accent-as-text: #FFB627 dark / #8A6400 light — AA in both themes)', () => {
		const rule = src.match(/\.shape-availability-link \{[^}]*\}/);
		expect(rule, '.shape-availability-link rule must exist').not.toBeNull();
		expect(rule![0]).toContain('color: var(--accent-text);');
	});

	it('door hover stays in the accent family — underline thickens, never goes orange (orange = exploration)', () => {
		const hover = src.match(/\.shape-availability-link:hover \{[^}]*\}/);
		expect(hover, '.shape-availability-link:hover rule must exist').not.toBeNull();
		expect(hover![0]).toContain('text-decoration-thickness: 2px;');
		expect(hover![0]).not.toContain('var(--primary)');
	});
});
