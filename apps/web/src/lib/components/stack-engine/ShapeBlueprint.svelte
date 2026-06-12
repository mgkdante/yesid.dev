<!--
  ShapeBlueprint (go2/w5 round 3, finale 4b) — the build shape IS a blueprint.

  Finale (4b) — the READABILITY FLOOR: the drawing renders at 1:1, ALWAYS.
  Big pick sets used to scale the whole svg down (width:100% against a fixed
  container); now layoutBlueprint WRAPS crowded layers into multiple lines
  (the drawing grows vertically) and the svg keeps its natural pixel width
  inside a pan wrapper — at extreme widths the band pans horizontally instead
  of shrinking a single box. The old 56svh letterbox is gone for the same
  reason: tall drawings grow, the page scrolls, boxes stay readable.

  Finale (4b) — TOTAL CONNECTIVITY: sibling boxes in a line are tied by rails
  (kind 'rail' from blueprint-layout), so every box — ghosts included — joins
  one connected drawing.

  Operator verdict on round 2: the build-shape card felt "still on the drawing
  board" next to the real blueprint view. Round 3 makes the always-teaching
  surface a real drawing: the composed pick-set rendered with the SAME
  machinery as the archetype canvas — layoutBlueprint() for geometry (rows
  derive from layer data, never hand coordinates), the established bp-ghost
  treatment for what's missing, drafting-paper furniture, a title block.

  - Picked techs are SOLID boxes in their layer rows (layer tab + name).
  - Every MISSING layer is one ghosted/dashed placeholder box (opacity .4 +
    6 4 dash — the bp-ghost values) labeled with the layer name, plus a
    full-ink '+ add a {layer} layer' annotation below it (bp-annotation
    treatment, engine-paper halo so connectors break for the label).
  - Connectors run between adjacent layer rows via layoutBlueprint; a
    connector touching a ghost draws DASHED — the circuit is sketched, not
    yet wired.
  - Title block: YOUR BUILD · REV 0 while layers are missing, REV A the
    moment all four are covered (the drawing graduates).

  Fun pass: a solid box entering the drawing (a pick landing / a ghost layer
  flipping solid) settles in with the chips' own pop — keyed {#each} means
  ONLY the new box animates. CSS-only, user-initiated, <400ms, tiny element
  → SAFE-ALWAYS (chip-settle precedent; no GSAP, no reduce gate needed).

  Mobile: `stacked` renders the existing blueprint-layout stacked mode (one
  centered column, straight verticals). TechMatcher renders both variants and
  CSS-toggles at 768px (bp-pair-list precedent).

  Pure presentational: props in, SVG out — fully unit-testable, no engine
  state, no GSAP, nothing on the route entry chunk.
-->
<script lang="ts">
	import type { ArchetypeTechLink, StackLayer } from '@repo/shared/schemas';
	import { layoutBlueprint } from './blueprint-layout';
	import { layerArticle } from './stack-shape';

	interface ShapePick {
		id: string;
		name: string;
		layer: StackLayer;
	}

	let {
		picked,
		missing,
		stacked = false,
		testid = 'shape-blueprint',
		flip = false,
	}: {
		picked: readonly ShapePick[];
		missing: readonly StackLayer[];
		stacked?: boolean;
		testid?: string;
		/** Round 4: solid boxes carry data-flip-id so the drawing morphs into
		 *  the composed product preview. The card flip-tags only the VISIBLE
		 *  variant (wide/stacked are CSS-swapped) — duplicate flip ids would
		 *  confuse GSAP Flip's pairing. Ghosts never flip (no slot to fly to). */
		flip?: boolean;
	} = $props();

	// Two instances render side by side (wide + stacked) — the dot-grid
	// <pattern> id must stay unique per instance (SVG ids are document-global).
	const uid = $props.id();

	/** Ghost placeholder id for a missing layer — never collides with tech ids. */
	const ghostId = (layer: StackLayer): string => `ghost-${layer}`;

	// Synthesized links: real picks in their layers + ONE ghost per missing
	// layer. layoutBlueprint re-groups by STACK_LAYERS order, so the drawing
	// always shows all four rows — the complete picture the operator asked for.
	const links = $derived<ArchetypeTechLink[]>([
		...picked.map((p, i) => ({ id: p.id, layer: p.layer, sort: i })),
		...missing.map((layer) => ({ id: ghostId(layer), layer, sort: 0 })),
	]);

	const layout = $derived(layoutBlueprint(links, { stacked }));
	const ghostIds = $derived(new Set(missing.map(ghostId)));
	const nameById = $derived(new Map(picked.map((p) => [p.id, p.name])));
	const ghostBoxes = $derived(layout.boxes.filter((b) => ghostIds.has(b.id)));

	/** One label per LAYER BAND (finale: a wrapped layer is several lines but
	 *  one band) — anchored at the band's first (topmost) box. */
	const layerLabels = $derived.by(() => {
		const firstByLayer = new Map<StackLayer, (typeof layout.boxes)[number]>();
		for (const box of layout.boxes) {
			if (!firstByLayer.has(box.layer)) firstByLayer.set(box.layer, box);
		}
		return [...firstByLayer.values()];
	});

	// Same drawing geometry as BlueprintCanvas — the mini IS a blueprint.
	const PAD = 24;
	const STAMP_H = 36;
	// go2/w5 legibility pass: 64 → 84. Row labels wear --text-caption (12px)
	// now; right-anchored "INTERFACE" (9ch ≈ 70px) needs the wider gutter to
	// stay inside the viewBox.
	const LABEL_GUTTER = 84;

	const gutter = $derived(stacked ? 0 : LABEL_GUTTER);
	const viewBox = $derived(
		`${-(PAD + gutter)} ${-PAD} ${layout.width + PAD * 2 + gutter} ${layout.height + STAMP_H + PAD * 2}`,
	);
	/** Finale (4b) readability floor: render scale = 1, exactly. The svg keeps
	 *  its natural pixel width; the pan wrapper scrolls when the container is
	 *  narrower. (Round 1 capped scale at ≤1; the floor pins it at 1.) */
	const naturalWidth = $derived(layout.width + PAD * 2 + gutter);

	const complete = $derived(missing.length === 0);
	const coveredCount = $derived(4 - missing.length);
	const ariaLabel = $derived(
		complete
			? `Your build blueprint: ${picked.length} part${picked.length === 1 ? '' : 's'} placed, all 4 layers covered`
			: `Your build blueprint: ${picked.length} part${picked.length === 1 ? '' : 's'} placed, ${missing.length} layer${missing.length === 1 ? '' : 's'} still to add`,
	);
</script>

<!-- Finale (4b): contained horizontal pan — when even the wrapped drawing is
     wider than the card column, the BAND scrolls; boxes never shrink. -->
<div class="sbp-pan" data-testid={`${testid}-pan`}>
<svg
	class="shape-blueprint"
	data-testid={testid}
	{viewBox}
	style:width={`${naturalWidth}px`}
	role="img"
	aria-label={ariaLabel}
>
	<!-- Drafting-paper furniture — the same dot grid + registration ticks as
	     the archetype canvas (decorative, sub-3:1 by design). -->
	<defs>
		<pattern id={`sbp-dot-grid-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse">
			<circle cx="1" cy="1" r="1" fill="var(--bp-grid-ink)" />
		</pattern>
	</defs>
	<rect
		class="sbp-grid"
		aria-hidden="true"
		x={-PAD}
		y={-PAD}
		width={layout.width + PAD * 2}
		height={layout.height + PAD * 2}
		fill={`url(#sbp-dot-grid-${uid})`}
	/>
	<g class="sbp-reg-ticks" aria-hidden="true">
		<path d={`M ${-PAD} ${-PAD + 8} V ${-PAD} H ${-PAD + 8}`} />
		<path d={`M ${layout.width + PAD - 8} ${-PAD} H ${layout.width + PAD} V ${-PAD + 8}`} />
		<path d={`M ${-PAD} ${layout.height + PAD - 8} V ${layout.height + PAD} H ${-PAD + 8}`} />
		<path d={`M ${layout.width + PAD - 8} ${layout.height + PAD} H ${layout.width + PAD} V ${layout.height + PAD - 8}`} />
	</g>

	{#if !stacked}
		<!-- Layer band labels in the left gutter — one per LAYER (wrapped lines
		     share their band's label); with ghosts filling every empty layer,
		     all four names always print (the full picture). -->
		<g class="sbp-row-labels" aria-hidden="true">
			{#each layerLabels as box (box.layer)}
				<text
					class={`sbp-row-label sbp-ink-${box.layer}`}
					x={-PAD - 6}
					y={box.y + box.h / 2}
					text-anchor="end"
					dominant-baseline="central"
				>
					{box.layer}
				</text>
			{/each}
		</g>
	{/if}

	<g class="sbp-connectors">
		{#each layout.connectors as connector (connector.kind + connector.from + '→' + connector.to)}
			<path
				class="sbp-connector"
				class:sbp-connector-rail={connector.kind === 'rail'}
				class:sbp-connector-ghost={ghostIds.has(connector.from) || ghostIds.has(connector.to)}
				d={connector.path}
				data-from={connector.from}
				data-to={connector.to}
			/>
		{/each}
	</g>

	<!-- Keyed by box id: a pick landing (or a ghost flipping solid) mounts a
	     NEW solid box — only that box runs the settle pop. -->
	{#each layout.boxes as box (box.id)}
		{#if ghostIds.has(box.id)}
			<!-- The established bp-ghost treatment: dashed rect, group at .4. -->
			<g class="sbp-box sbp-box-ghost" data-testid={`sbp-ghost-${box.layer}`}>
				<rect x={box.x} y={box.y} width={box.w} height={box.h} rx="4" class="sbp-box-rect" />
				<text
					x={box.x + box.w / 2}
					y={box.y + box.h / 2}
					class={`sbp-ghost-label sbp-ink-${box.layer}`}
					text-anchor="middle"
					dominant-baseline="central"
				>
					{box.layer}
				</text>
			</g>
		{:else}
			<g
				class="sbp-box sbp-box-solid"
				data-testid={`sbp-box-${box.id}`}
				data-flip-id={flip ? box.id : undefined}
			>
				<rect x={box.x} y={box.y} width={box.w} height={box.h} rx="4" class="sbp-box-rect" />
				<rect
					class={`sbp-box-tab sbp-fill-${box.layer}`}
					x={box.x + 1.5}
					y={box.y + 1.5}
					width="3"
					height={box.h - 3}
					rx="1"
				/>
				<text
					x={box.x + box.w / 2}
					y={box.y + box.h / 2}
					class="sbp-box-label"
					text-anchor="middle"
					dominant-baseline="central"
				>
					{nameById.get(box.id) ?? box.id}
				</text>
			</g>
		{/if}
	{/each}

	<!-- One full-ink annotation under EVERY ghost (the archetype canvas
	     annotates only its first missing tech; here each empty layer teaches).
	     Engine-paper halo: the connector line breaks for the label. -->
	{#each ghostBoxes as box (box.id)}
		<text
			class="sbp-annotation"
			data-testid={`sbp-annotation-${box.layer}`}
			x={box.x + box.w / 2}
			y={box.y + box.h + 16}
			text-anchor="middle"
		>
			+ add {layerArticle(box.layer)} {box.layer} layer
		</text>
	{/each}

	<!-- Title block — the drawing graduates: REV 0 while drafting, REV A when
	     all four layers are covered. -->
	<g class="sbp-stamp" data-testid="shape-blueprint-stamp">
		<rect
			class="sbp-stamp-frame"
			x={-PAD}
			y={layout.height + STAMP_H - 16}
			width={layout.width + PAD * 2}
			height="36"
			rx="2"
		/>
		<text class="sbp-stamp-title" x={layout.width + PAD - 8} y={layout.height + STAMP_H} text-anchor="end">
			YOUR BUILD
		</text>
		<text
			class="sbp-stamp-meta"
			x={layout.width + PAD - 8}
			y={layout.height + STAMP_H + 14}
			text-anchor="end"
		>
			REV {complete ? 'A' : '0'} · {picked.length} part{picked.length === 1 ? '' : 's'} · {coveredCount}/4 layers
		</text>
	</g>
</svg>
</div>

<style>
	/* Finale (4b): the pan rail. Wider-than-column drawings scroll INSIDE the
	   band (contained pan); narrower ones center. No vertical cap — the
	   drawing grows down and stays readable at any pick count. */
	.sbp-pan {
		width: 100%;
		overflow-x: auto;
		overscroll-behavior-x: contain;
	}

	.shape-blueprint {
		/* width set inline = layout natural width (render scale = 1, the
		   readability floor — boxes never shrink below 1:1). */
		max-width: none;
		height: auto;
		display: block;
		margin: 0 auto;
		overflow: visible;
	}

	.sbp-reg-ticks path {
		fill: none;
		stroke: var(--bp-grid-ink);
		stroke-width: 1;
	}

	/* go2/w5 legibility pass: every SVG label steps up one rung of the site
	   type scale (tokens, never raw px) — labels --text-body, supporting ink
	   --text-mono/--text-caption. The svg renders 1:1, so token px = real px. */
	.sbp-row-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}

	.sbp-ink-interface { fill: var(--layer-interface); }
	.sbp-ink-logic { fill: var(--layer-logic); }
	.sbp-ink-data { fill: var(--layer-data); }
	.sbp-ink-infra { fill: var(--layer-infra); }

	.sbp-connector {
		fill: none;
		stroke: var(--border);
		stroke-width: 1.5;
	}

	/* Ghosts connect with dashed lines — the wire is sketched, not run yet. */
	.sbp-connector-ghost {
		stroke-dasharray: 4 4;
	}

	/* Finale (4b): sibling rails — the same-line tie that keeps every box on
	   one circuit. Quieter than the flow wiring (1px), same ink. */
	.sbp-connector-rail {
		stroke-width: 1;
	}

	.sbp-box-rect {
		fill: var(--background);
		stroke: var(--secondary-foreground);
		stroke-width: 1.5;
	}

	.sbp-fill-interface { fill: var(--layer-interface); }
	.sbp-fill-logic { fill: var(--layer-logic); }
	.sbp-fill-data { fill: var(--layer-data); }
	.sbp-fill-infra { fill: var(--layer-infra); }

	.sbp-box-label {
		font-family: var(--font-mono);
		font-size: var(--text-body);
		fill: var(--foreground);
	}

	/* Fun pass: a solid box lands with the chips' own settle pop. Keyed each
	   → only NEW boxes (fresh picks / ghost-flips) animate. CSS-only,
	   user-initiated, <400ms, tiny → SAFE-ALWAYS (chip-settle precedent). */
	.sbp-box-solid {
		transform-box: fill-box;
		transform-origin: center;
		animation: sbp-settle 180ms var(--ease-bounce);
	}

	@keyframes sbp-settle {
		0% { scale: 1; }
		50% { scale: 1.06; }
		100% { scale: 1; }
	}

	/* The established bp-ghost treatment: group dims, rect dashes. */
	.sbp-box-ghost {
		opacity: 0.4;
	}

	.sbp-box-ghost .sbp-box-rect {
		stroke-dasharray: 6 4;
	}

	.sbp-ghost-label {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}

	/* bp-annotation ink + the pair-note halo: full-strength teaching line
	   under each ghost; connectors break for the label, drafting style. */
	.sbp-annotation {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		fill: var(--primary);
		stroke: var(--engine-paper, var(--background));
		stroke-width: 3px;
		paint-order: stroke;
	}

	.sbp-stamp-frame {
		fill: none;
		stroke: var(--border);
		stroke-width: 1;
	}

	.sbp-stamp-title {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		letter-spacing: 2px;
		text-transform: uppercase;
		fill: var(--muted-foreground);
	}

	.sbp-stamp-meta {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		fill: var(--muted-foreground);
	}
</style>
