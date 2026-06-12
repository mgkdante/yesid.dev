// slice-29 — Tech Stack Engine e2e. Runs on desktop-chrome AND the mobile
// projects (no desktop-only selectors; everything is tap-sized buttons).
//
// Goal path:    archetype card → living blueprint → preview morph → blueprint
//               CTA hands off to /contact?bp=<archetype>~…
// Compose path: mode switch → tech chips light match cards (AND contract —
//               go2/w4: every pick must be in a card's stack, more picks
//               narrow the rail). go2/w5 taste round 2: the live-composed
//               build-shape card is the ALWAYS-ON primary teaching surface —
//               every pick combo teaches (operator example pinned below);
//               AND-matched archetypes are the bonus "known builds" rail.

import { test, expect } from '@playwright/test';

test('goal path: card → blueprint → preview → blueprint-prefilled contact', async ({
	page,
}) => {
	await page.goto('/tech-stack');

	// Engine mounts below the hero from its own async chunk.
	const engine = page.locator('[data-testid="stack-engine"]');
	await expect(engine).toBeVisible();

	await page.locator('[data-testid="archetype-card-data-dashboard"]').click();
	await expect(page.locator('[data-testid="blueprint-canvas"]')).toBeVisible();

	await page.locator('[data-testid="view-toggle"]').click();
	await expect(page.locator('[data-testid="product-preview"]')).toBeVisible();

	await page.locator('[data-testid="cta-blueprint"]').click();
	await page.waitForURL('**/contact?bp=data-dashboard~**');
	expect(page.url()).toContain('/contact?bp=data-dashboard~');
});

test('compose path: chips rank archetypes into match cards (AND)', async ({ page }) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();

	await page.locator('[data-testid="mode-toggle-compose"]').click();
	await page.locator('[data-testid="tech-chip-postgresql"]').click();
	const cardsAfterOne = page.locator('[data-testid^="match-card-"]');
	await expect(cardsAfterOne.first()).toBeVisible();
	const countAfterOne = await cardsAfterOne.count();

	// Taste round 2: the build-shape card is ALWAYS-ON from the first pick —
	// the primary teaching surface coexists with the known-builds rail.
	await expect(page.locator('[data-testid="build-shape"]')).toBeVisible();

	await page.locator('[data-testid="tech-chip-docker"]').click();

	// data-pipeline carries BOTH picks and sits closest to complete (1 missing).
	await expect(page.locator('[data-testid="match-card-data-pipeline"]')).toBeVisible();
	// AND narrows: the two-pick rail is never wider than the one-pick rail.
	const countAfterTwo = await page.locator('[data-testid^="match-card-"]').count();
	expect(countAfterTwo).toBeLessThanOrEqual(countAfterOne);

	// go2/w5: the live build counter narrates the narrowing (taste round 2
	// vocabulary: archetypes are "known builds").
	await expect(page.locator('[data-testid="build-counter"]')).toContainText(
		/2 picks → \d+ known builds/,
	);
});

test('compose path: every combo TEACHES — the operator example (node.js + github-actions) composes a shape, never a blank', async ({
	page,
}) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();

	await page.locator('[data-testid="mode-toggle-compose"]').click();
	// Taste round 2 acceptance example: node.js + github-actions matches NO
	// drawn archetype under AND — round 1 showed nothing here; now the
	// live-composed build-shape card must read the coverage matrix out loud.
	await page.locator('[data-testid="tech-chip-node-js"]').click();
	await page.locator('[data-testid="tech-chip-github-actions"]').click();

	const shape = page.locator('[data-testid="build-shape"]');
	await expect(shape).toBeVisible();
	// Finale (4c): the card LEADS with the phrase builder's market sentence…
	await expect(page.locator('[data-testid="shape-phrase"]')).toContainText(/automation/i);
	// …the category line survives as the kicker…
	await expect(shape).toContainText('Your build: logic + infra covered');
	// …and the 15-subset reading stays as the supporting teaching line,
	await expect(shape).toContainText('a bot, a scheduled job, an automation');
	// naming what a complete build still needs.
	await expect(shape).toContainText(
		'add an interface layer + a data layer and this becomes a working product',
	);

	// Round 3: the build shape IS a blueprint. Exactly one variant is visible
	// (wide ≥768px / stacked below — both DOM-rendered, CSS-swapped), drawing
	// the 2 picks as solid boxes and the 2 missing layers as ghosted
	// placeholders with add-a-layer annotations.
	const drawing = shape.locator(
		'[data-testid="shape-blueprint"]:visible, [data-testid="shape-blueprint-stacked"]:visible',
	);
	await expect(drawing).toHaveCount(1);
	await expect(drawing.locator('.sbp-box-solid')).toHaveCount(2);
	await expect(drawing.locator('.sbp-box-ghost')).toHaveCount(2);
	await expect(drawing.locator('[data-testid="sbp-annotation-interface"]')).toContainText(
		'+ add an interface layer',
	);
	await expect(drawing.locator('[data-testid="sbp-annotation-data"]')).toContainText(
		'+ add a data layer',
	);
	// Ghost wiring is dashed; the drawing is drafted, not yet run.
	await expect(drawing.locator('.sbp-connector-ghost')).toHaveCount(3);
	// Warm exit: the take-it-with-you link carries both picks…
	await expect(shape.locator('[data-testid="shape-link"]')).toHaveAttribute(
		'href',
		'/contact?bp=custom~node-js.github-actions',
	);
	// …and the operator's door is open right beside it (finale 4c).
	const door = shape.locator('[data-testid="shape-availability"]');
	await expect(door).toContainText("I'm online");
	await expect(door).toHaveAttribute('href', '/contact');
	// The bonus rail says plainly why no known build lit up.
	await expect(page.locator('[data-testid="known-builds-label"]')).toContainText(
		'no drawn recipe uses all of these yet',
	);
});

// go2/w5 round 4: previews exist for EVERY archetype — the morph must work
// beyond the 3 seeds. ops-autopilot is a non-seed with TWO infra techs, so
// this also covers the round-4 `pick` slots (Docker AND GitHub Actions each
// get their own labeled box).
test('round 4: a NON-SEED archetype morphs into a product preview too', async ({ page }) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();

	await page.locator('[data-testid="archetype-card-ops-autopilot"]').click();
	await expect(page.locator('[data-testid="blueprint-canvas"]')).toBeVisible();

	await page.locator('[data-testid="view-toggle"]').click();
	await expect(page.locator('[data-testid="product-preview"]')).toBeVisible();
	// Both same-layer techs land their own slot (dual-role rule, audit-pinned
	// at unit level; role text itself yields below 480px so don't assert it).
	await expect(page.locator('[data-testid="slot-docker"]')).toBeVisible();
	await expect(page.locator('[data-testid="slot-github-actions"]')).toBeVisible();
	await expect(page.locator('[data-testid="slot-power-bi"]')).toBeVisible();
});

// go2/w5 round 4: stateful nav — the '←' steps preview → blueprint → map,
// and the BROWSER back button closes a drawing instead of leaving the page
// (shallow history entry per drawing).
test('round 4 nav: stepped back + browser back close the drawing, never strand the visitor', async ({
	page,
}) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();

	await page.locator('[data-testid="archetype-card-data-dashboard"]').click();
	const back = page.locator('[data-testid="engine-back"]');
	await expect(back).toContainText('back to the map');

	await page.locator('[data-testid="view-toggle"]').click();
	await expect(page.locator('[data-testid="product-preview"]')).toBeVisible();
	await expect(back).toContainText('back to the blueprint');

	// Step 1: preview → blueprint. Step 2: blueprint → the map.
	await back.click();
	await expect(page.locator('[data-testid="blueprint-canvas"]')).toBeVisible();
	await back.click();
	await expect(page.locator('[data-testid="archetype-card-data-dashboard"]')).toBeVisible();

	// Browser back: re-open a drawing, then use the BROWSER's back button —
	// the drawing folds back to the map and the visitor stays on /tech-stack.
	await page.locator('[data-testid="archetype-card-data-dashboard"]').click();
	await expect(page.locator('[data-testid="blueprint-canvas"]')).toBeVisible();
	await page.goBack();
	await expect(page.locator('[data-testid="archetype-card-data-dashboard"]')).toBeVisible();
	await expect(page.locator('[data-testid="blueprint-canvas"]')).not.toBeVisible();
	expect(page.url()).toContain('/tech-stack');
});

// go2/w5 round 4: compose nav (undo last pick / start over) + the composed
// build's OWN product preview ('see your build as a product').
test('round 4 compose: undo + start over narrate through the counter; the build flips to a product', async ({
	page,
}) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();

	await page.locator('[data-testid="mode-toggle-compose"]').click();
	await page.locator('[data-testid="tech-chip-postgresql"]').click();
	await page.locator('[data-testid="tech-chip-docker"]').click();
	await expect(page.locator('[data-testid="build-counter"]')).toContainText(/2 picks/);

	// Undo forgets the newest pick (docker) — one pick left.
	await page.locator('[data-testid="pick-undo"]').click();
	await expect(page.locator('[data-testid="build-counter"]')).toContainText(/1 pick →/);
	await expect(page.locator('[data-testid="tech-chip-docker"]')).toHaveAttribute(
		'aria-pressed',
		'false',
	);

	// 'see your build as a product' — the composed generic preview, morphing
	// inside the build-shape card; the drawing returns on toggle-back.
	const shape = page.locator('[data-testid="build-shape"]');
	await page.locator('[data-testid="shape-view-toggle"]').click();
	await expect(shape.locator('[data-testid="product-preview"]')).toBeVisible();
	await expect(shape.locator('[data-testid="slot-postgresql"]')).toBeVisible();
	await page.locator('[data-testid="shape-view-toggle"]').click();
	await expect(
		shape.locator(
			'[data-testid="shape-blueprint"]:visible, [data-testid="shape-blueprint-stacked"]:visible',
		),
	).toHaveCount(1);

	// Start over: picks gone, card retires, the board resets.
	await page.locator('[data-testid="pick-clear"]').click();
	await expect(page.locator('[data-testid="build-counter"]')).toContainText(
		'known builds on the board',
	);
	await expect(shape).not.toBeVisible();
});

test('finale 4d: hero + engine band are ONE full-bleed instrument panel; CTA stays constrained', async ({
	page,
	isMobile,
}) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();

	// clientWidth excludes any classic scrollbar — the honest "edge to edge".
	const pageWidth = await page.evaluate(() => document.documentElement.clientWidth);

	const band = await page.locator('[data-testid="engine-band"]').boundingBox();
	expect(band).not.toBeNull();
	expect(Math.round(band!.width)).toBe(pageWidth);
	expect(Math.round(band!.x)).toBe(0);

	// Finale (4d): the CONTROL ROOM hero runs the same full bleed — the old
	// constrained-hero rule is superseded for THIS page.
	const hero = await page.locator('[data-testid="tech-stack-hero"]').boundingBox();
	expect(hero).not.toBeNull();
	expect(Math.round(hero!.width)).toBe(pageWidth);
	expect(Math.round(hero!.x)).toBe(0);

	// The hazard frame (shared /projects divider) spans the full bleed too.
	for (const tid of ['engine-band-hazard-top', 'engine-band-hazard-bottom']) {
		const strip = await page.locator(`[data-testid="${tid}"]`).boundingBox();
		expect(strip, `${tid} must render`).not.toBeNull();
		expect(Math.round(strip!.width)).toBe(pageWidth);
		expect(Math.round(strip!.x)).toBe(0);
	}

	// Desktop only: the CTA below keeps its constrained width EXACTLY
	// ("perfect that way") — container-wide cap < page width. On mobile every
	// section is naturally edge-to-edge, so "constrained" is not observable.
	if (!isMobile) {
		const cta = await page.locator('[data-testid="tech-stack-cta"]').boundingBox();
		expect(cta!.width).toBeLessThan(pageWidth);
		expect(Math.round(band!.width)).toBeGreaterThan(Math.round(cta!.width));
	}
});

test('blueprint fits the viewport — whole drawing at a glance (GO-w2t5 operator playtest)', async ({
	page,
}) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();
	await page.locator('[data-testid="archetype-card-data-dashboard"]').click();

	const canvas = page.locator('[data-testid="blueprint-canvas"]');
	await expect(canvas).toBeVisible();

	const box = await canvas.boundingBox();
	const viewport = page.viewportSize();
	expect(box).not.toBeNull();
	expect(viewport).not.toBeNull();
	// Runs on desktop-chrome AND all three mobile projects.
	expect(box!.height).toBeLessThanOrEqual(viewport!.height * 0.85);
	expect(box!.width).toBeLessThanOrEqual(viewport!.width);
});

// go2/w5 finale (4b): the READABILITY FLOOR at a HIGH pick count — boxes hold
// their full size at 10 picks (the layout wraps/pans instead of shrinking),
// on desktop AND every mobile project. (4c rides along: the phrase heading
// and the journey stepper are live at the same time.)
test('finale: 10 picks never shrink a box below the readable floor; the phrase still leads', async ({
	page,
}) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();

	await page.locator('[data-testid="mode-toggle-compose"]').click();
	// The guided journey starts at 'pick parts'.
	const stepper = page.locator('[data-testid="engine-stepper"]');
	await expect(stepper.locator('[aria-current="step"]')).toContainText('pick parts');

	// 10 picks, interface-heavy — the historical shrink case.
	const picks = [
		'sveltekit', 'svelte-5', 'react', 'threejs-threlte', 'tailwind', 'gsap',
		'node-js', 'python', 'postgresql', 'docker',
	];
	for (const id of picks) {
		await page.locator(`[data-testid="tech-chip-${id}"]`).click();
	}
	await expect(page.locator('[data-testid="build-counter"]')).toContainText(/10 picks/);
	await expect(stepper.locator('[aria-current="step"]')).toContainText('read your build');

	// Exactly one drawing variant visible (wide ≥768px / stacked below)…
	const drawing = page.locator(
		'[data-testid="shape-blueprint"]:visible, [data-testid="shape-blueprint-stacked"]:visible',
	);
	await expect(drawing).toHaveCount(1);
	await expect(drawing.locator('.sbp-box-solid')).toHaveCount(10);
	// …and a rendered box keeps its FULL drawn size (BOX_W 160 × BOX_H 48 at
	// render scale 1 — the floor; small tolerance for sub-pixel rounding).
	const rect = await drawing.locator('.sbp-box-solid .sbp-box-rect').first().boundingBox();
	expect(rect).not.toBeNull();
	expect(rect!.width).toBeGreaterThanOrEqual(150);
	expect(rect!.height).toBeGreaterThanOrEqual(45);

	// The phrase builder composes one market sentence over all 10 picks.
	await expect(page.locator('[data-testid="shape-phrase"]')).toContainText(/^A .+\.$/);
});
