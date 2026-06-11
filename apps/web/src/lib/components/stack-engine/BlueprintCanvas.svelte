<!--
  BlueprintCanvas (slice-29) — the living blueprint.

  Pure SVG over layoutBlueprint(links): rows derive from layer data, never
  hand coordinates. Every box carries data-flip-id=<tech id> so GSAP Flip can
  pair it with the matching preview slot (Task 11).

  Draw sequence (animate=true): rows stagger-pop → connectors draw via
  stroke-dash → title stamp last; replays when the links identity changes.
  animate=false (reduced motion): gsap.set final states only.

  Compose entry: matched boxes light up (bp-matched), missing boxes ghost
  (bp-ghost, dashed) and the FIRST missing box gets a single
  '+ add <name> to complete it' annotation.
-->
<script lang="ts">
	import { gsap } from 'gsap';
	import type { ArchetypeTechLink } from '@repo/shared/schemas';
	import { techStackItems } from '$lib/content/tech-stack';
	import { layoutBlueprint, ROW_GAP } from './blueprint-layout';

	let {
		links,
		title,
		matched = undefined,
		missing = undefined,
		animate = true,
		stacked = false,
	}: {
		links: readonly ArchetypeTechLink[];
		title: string;
		matched?: string[];
		missing?: string[];
		animate?: boolean;
		stacked?: boolean;
	} = $props();

	const nameById = new Map(techStackItems.map((t) => [t.id, t.name]));

	const layout = $derived(layoutBlueprint(links, { stacked }));
	const matchedSet = $derived(new Set(matched ?? []));
	const missingSet = $derived(new Set(missing ?? []));
	/** Compose entry = caller provided matched/missing partition. */
	const compose = $derived((matched?.length ?? 0) + (missing?.length ?? 0) > 0);
	const firstMissingBox = $derived(layout.boxes.find((b) => missingSet.has(b.id)) ?? null);

	/** Boxes grouped per row (by y) — the stagger unit of the draw sequence. */
	const rows = $derived.by(() => {
		const byY = new Map<number, typeof layout.boxes>();
		for (const box of layout.boxes) {
			const row = byY.get(box.y) ?? [];
			row.push(box);
			byY.set(box.y, row);
		}
		return [...byY.entries()].sort(([a], [b]) => a - b).map(([, row]) => row);
	});

	const stampText = $derived(`${title.toUpperCase()} — REV A`);

	const PAD = 24;
	const STAMP_H = 36;
	const viewBox = $derived(
		`${-PAD} ${-PAD} ${layout.width + PAD * 2} ${layout.height + STAMP_H + PAD * 2}`,
	);

	/** GO-w2t5 sizing fix: cap rendered scale at 1 SVG unit = 1px. Launch
	 *  archetypes are one box per row (width 160 → viewBox 208), and the old
	 *  flat `max-width: 720px` inflated them ~3.5× — "one node fills the
	 *  viewport height" (operator playtest). Natural width = real pixels. */
	const naturalWidth = $derived(layout.width + PAD * 2);

	let svgEl: SVGSVGElement | null = $state(null);

	// Draw sequence — re-runs whenever the layout identity changes (archetype
	// switch) or the animate flag flips. All GSAP sits behind `animate`.
	$effect(() => {
		void layout; // dependency: replay on archetype change
		const svg = svgEl;
		if (!svg) return;

		const rowEls = svg.querySelectorAll<SVGGElement>('.bp-row');
		const connectorEls = svg.querySelectorAll<SVGPathElement>('.bp-connector');
		const stampEl = svg.querySelector<SVGTextElement>('.bp-stamp');
		const annotationEls = svg.querySelectorAll<SVGTextElement>('.bp-annotation');

		if (!animate) {
			gsap.set([...rowEls, ...annotationEls, ...(stampEl ? [stampEl] : [])], {
				autoAlpha: 1,
				scale: 1,
			});
			gsap.set(connectorEls, { strokeDashoffset: 0, strokeDasharray: 'none' });
			return;
		}

		const tl = gsap.timeline();
		tl.fromTo(
			rowEls,
			{ autoAlpha: 0, scale: 0.9, transformOrigin: '50% 50%' },
			{ autoAlpha: 1, scale: 1, duration: 0.35, stagger: 0.12, ease: 'back.out(1.6)' },
		);
		for (const path of connectorEls) {
			const length =
				typeof path.getTotalLength === 'function' ? path.getTotalLength() : ROW_GAP * 2;
			gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, autoAlpha: 1 });
		}
		tl.to(
			connectorEls,
			{ strokeDashoffset: 0, duration: 0.4, stagger: 0.06, ease: 'power1.inOut' },
			'-=0.1',
		);
		if (annotationEls.length > 0) {
			tl.fromTo(annotationEls, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 });
		}
		if (stampEl) {
			tl.fromTo(
				stampEl,
				{ autoAlpha: 0, scale: 1.15, transformOrigin: '100% 100%' },
				{ autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power2.out' },
			);
		}
		return () => {
			tl.kill();
		};
	});
</script>

<svg
	bind:this={svgEl}
	class="blueprint-canvas"
	data-testid="blueprint-canvas"
	{viewBox}
	style:max-width={`${naturalWidth}px`}
	role="img"
	aria-label={`Blueprint: ${title}`}
>
	<g class="bp-connectors">
		{#each layout.connectors as connector (connector.from + '→' + connector.to)}
			<path class="bp-connector" d={connector.path} data-from={connector.from} data-to={connector.to} />
		{/each}
	</g>

	{#each rows as row, rowIndex (rowIndex)}
		<g class="bp-row">
			{#each row as box (box.id)}
				<g
					class="bp-box"
					class:bp-matched={compose && matchedSet.has(box.id)}
					class:bp-ghost={compose && missingSet.has(box.id)}
					data-flip-id={box.id}
					data-testid={`bp-box-${box.id}`}
				>
					<rect x={box.x} y={box.y} width={box.w} height={box.h} rx="4" class="bp-box-rect" />
					<text
						x={box.x + box.w / 2}
						y={box.y + box.h / 2}
						class="bp-box-label"
						text-anchor="middle"
						dominant-baseline="central"
					>
						{nameById.get(box.id) ?? box.id}
					</text>
				</g>
			{/each}
		</g>
	{/each}

	{#if firstMissingBox}
		<text
			class="bp-annotation"
			data-testid="bp-annotation"
			x={firstMissingBox.x + firstMissingBox.w / 2}
			y={firstMissingBox.y + firstMissingBox.h + 16}
			text-anchor="middle"
		>
			+ add {nameById.get(firstMissingBox.id) ?? firstMissingBox.id} to complete it
		</text>
	{/if}

	<text
		class="bp-stamp"
		data-testid="blueprint-stamp"
		x={layout.width}
		y={layout.height + STAMP_H}
		text-anchor="end"
	>
		{stampText}
	</text>
</svg>

<style>
	.blueprint-canvas {
		width: 100%;
		/* max-width set inline = layout natural width (render scale ≤ 1). */
		height: auto;
		/* Safety net for tall compose blueprints: the default
		   preserveAspectRatio (xMidYMid meet) letterboxes the drawing down —
		   the WHOLE blueprint stays visible without scrolling. */
		max-height: min(56svh, 440px);
		display: block;
		margin: 0 auto;
		overflow: visible;
	}

	.bp-connector {
		fill: none;
		stroke: var(--border);
		stroke-width: 1.5;
	}

	.bp-box-rect {
		fill: var(--background);
		stroke: var(--secondary-foreground);
		stroke-width: 1.5;
	}

	.bp-box-label {
		font-family: var(--font-mono);
		font-size: 13px;
		fill: var(--foreground);
	}

	/* Compose entry: picked techs light up… */
	.bp-matched .bp-box-rect {
		stroke: var(--primary);
		stroke-width: 2;
	}

	/* …missing techs ghost out. */
	.bp-ghost {
		opacity: 0.4;
	}

	.bp-ghost .bp-box-rect {
		stroke-dasharray: 6 4;
	}

	.bp-annotation {
		font-family: var(--font-mono);
		font-size: 11px;
		fill: var(--primary);
	}

	.bp-stamp {
		font-family: var(--font-mono);
		font-size: 12px;
		letter-spacing: 2px;
		text-transform: uppercase;
		fill: var(--muted-foreground);
	}
</style>
