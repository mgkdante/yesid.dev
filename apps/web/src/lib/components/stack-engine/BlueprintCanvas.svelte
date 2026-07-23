<!--
  BlueprintCanvas (slice-29, go2/w5 layered learning) — the living blueprint.

  Pure SVG over layoutBlueprint(links): rows derive from layer data, never
  hand coordinates (blueprint-layout.ts is UNTOUCHED — all go2/w5 geometry
  lives in constants here). Every box carries data-flip-id=<tech id> so GSAP
  Flip can pair it with the matching preview slot.

  Draw sequence (animate=true): rows stagger-pop → connectors draw via
  stroke-dash → annotations + pair notes fade → title block stamp → one-shot
  signal dash per connector; replays when the links identity changes.
  animate=false (reduced motion): gsap.set final states only.

  go2/w5 teaching layer:
  - layer ROW LABELS in the left gutter + a 3px layer tab on each box's left
    edge (color always rides next to the printed layer name);
  - ONE pair note per distinct adjacent layer pair, centered in the row gap —
    hidden <768px (an <ol> below the SVG takes over) and suppressed in
    compose entry (the '+ add …' annotation owns the gaps there);
  - drafting-paper furniture: dot grid, registration ticks, title block;
  - hover (hover:hover only): a box brightens its outgoing connector to the
    box's layer color — color confirms the pair note's claim.

  Compose entry: matched boxes light up (bp-matched), missing boxes ghost
  (bp-ghost, dashed) and the FIRST missing box gets a single
  '+ add <name> to complete it' annotation.
-->
<script lang="ts">
	import { durationSec } from '@yesid/motion/tokens';
	import { gsap } from 'gsap';
	import type { ArchetypeTechLink, StackLayer } from '@repo/shared/schemas';
	import type { Locale, LocalizedString } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { techStackItems } from '$lib/content/tech-stack';
	import { layoutBlueprint, ROW_GAP } from './blueprint-layout';
	import { LAYER_NAMES } from './layer-teaching';

	const locale = getLocale();

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
	const layerById = $derived(new Map(layout.boxes.map((b) => [b.id, b.layer])));

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

	const layerCount = $derived(new Set(layout.boxes.map((b) => b.layer)).size);

	// Drawing geometry (declared before the stamp deriveds below read them).
	const PAD = 24;
	const STAMP_H = 36;
	/** go2/w5 §8: left gutter for the layer row labels (engine renders only).
	 *  Legibility pass: 64 → 84 — row labels wear --text-caption (12px) now;
	 *  right-anchored "INTERFACE" (9ch ≈ 70px) needs the room. */
	const LABEL_GUTTER = 84;

	// go2/w5 taste round 2 (fit audit): the old `{TITLE} — REV A` single line
	// overflowed the stamp frame on one-box-per-row blueprints. REV A now
	// leads the meta line, and the title gets a deterministic textLength clamp
	// when its estimated width exceeds the frame's inner width — long CMS
	// titles squeeze instead of escaping. Legibility pass: the title wears
	// --text-small (14px mono) + 2px letter-spacing ≈ 10.4px/char.
	const stampTitle = $derived(title.toUpperCase());
	const STAMP_CHAR_W = 10.4;
	const stampAvail = $derived(layout.width + PAD * 2 - 16);
	const stampTitleLength = $derived(
		stampTitle.length * STAMP_CHAR_W > stampAvail ? stampAvail : undefined,
	);

	// go2/w5 §4: layer-pair teaching — full map of every possible occupied-row
	// adjacency (copy short, homey-teacher voice). Localized; HTTP stays verbatim.
	const PAIR_NOTES: Record<string, LocalizedString> = {
		'interface-logic': {
			en: 'the UI asks logic over HTTP',
			fr: 'l\'UI parle à la logique en HTTP',
			es: 'la UI le habla a la lógica por HTTP',
		},
		'logic-data': {
			en: 'logic reads & writes the data',
			fr: 'la logique lit pis écrit les données',
			es: 'la lógica lee y escribe los datos',
		},
		'data-infra': {
			en: 'storage runs on this ground',
			fr: 'le stockage roule sur ce terrain',
			es: 'el almacenamiento corre sobre este terreno',
		},
		'interface-data': {
			en: 'the UI reads the data directly',
			fr: 'l\'UI lit les données direct',
			es: 'la UI lee los datos directo',
		},
		'logic-infra': {
			en: 'the logic runs on this ground',
			fr: 'la logique roule sur ce terrain',
			es: 'la lógica corre sobre este terreno',
		},
		'interface-infra': {
			en: 'pages are served from here',
			fr: 'les pages sont servies d\'icitte',
			es: 'las páginas se sirven desde aquí',
		},
	};

	/** ONE annotation per DISTINCT adjacent layer pair (first occurrence). */
	const pairNotes = $derived.by(() => {
		if (stacked) return [];
		const seen = new Set<string>();
		const out: { from: StackLayer; to: StackLayer; text: string; x: number; y: number }[] = [];
		for (let r = 0; r < rows.length - 1; r++) {
			const from = rows[r][0].layer;
			const to = rows[r + 1][0].layer;
			const key = `${from}-${to}`;
			if (seen.has(key)) continue;
			seen.add(key);
			const note = PAIR_NOTES[key];
			if (!note) continue;
			out.push({
				from,
				to,
				text: resolveLocale(note, locale),
				x: layout.width / 2,
				y: (rows[r][0].y + rows[r][0].h + rows[r + 1][0].y) / 2,
			});
		}
		return out;
	});

	const gutter = $derived(stacked ? 0 : LABEL_GUTTER);
	const viewBox = $derived(
		`${-(PAD + gutter)} ${-PAD} ${layout.width + PAD * 2 + gutter} ${layout.height + STAMP_H + PAD * 2}`,
	);

	/** GO-w2t5 sizing fix: cap rendered scale at 1 SVG unit = 1px. Launch
	 *  archetypes are one box per row (width 160 → viewBox 272 with the label
	 *  gutter), and the old flat `max-width: 720px` inflated them ~3.5× — "one
	 *  node fills the viewport height" (operator playtest). Natural width =
	 *  real pixels; 272px stays mobile-safe (< 360px viewports). */
	const naturalWidth = $derived(layout.width + PAD * 2 + gutter);

	// Localized chrome words (parts/layers) + the canvas aria-label + the
	// "complete it" annotation. Code-owned, em-dash-free. Exhaustive per-locale
	// template maps so a new locale is a compile error, never an EN fallback.
	const PARTS_WORD = { en: 'parts', fr: 'morceaux', es: 'piezas' };
	const LAYERS_WORD = { en: 'layers', fr: 'couches', es: 'capas' };
	const partsWord = $derived(resolveLocale(PARTS_WORD, locale));
	const layersWord = $derived(resolveLocale(LAYERS_WORD, locale));
	const CANVAS_ARIA: Record<Locale, (parts: number, layers: number) => string> = {
		en: (parts, layers) => `Blueprint: ${title}, ${parts} parts in ${layers} layers`,
		fr: (parts, layers) => `Plan : ${title}, ${parts} morceaux dans ${layers} couches`,
		es: (parts, layers) => `Plano: ${title}, ${parts} piezas en ${layers} capas`,
	};
	const COMPLETE_ANNOTATIONS: Record<Locale, (name: string) => string> = {
		en: (name) => `+ add ${name} to complete it`,
		fr: (name) => `+ ajoute ${name} pour le compléter`,
		es: (name) => `+ agrega ${name} para completarlo`,
	};
	const canvasAria = $derived(CANVAS_ARIA[locale](layout.boxes.length, layerCount));
	const completeAnnotation = $derived.by(() => {
		if (!firstMissingBox) return '';
		const name = nameById.get(firstMissingBox.id) ?? firstMissingBox.id;
		return COMPLETE_ANNOTATIONS[locale](name);
	});

	let svgEl: SVGSVGElement | null = $state(null);
	/** Hovered box id — its outgoing connector brightens to the layer color. */
	let hoverBoxId = $state<string | null>(null);

	// Draw sequence — re-runs whenever the layout identity changes (archetype
	// switch) or the animate flag flips. All GSAP sits behind `animate`.
	$effect(() => {
		void layout; // dependency: replay on archetype change
		const svg = svgEl;
		if (!svg) return;

		const rowEls = svg.querySelectorAll<SVGGElement>('.bp-row');
		const connectorEls = svg.querySelectorAll<SVGPathElement>('.bp-connector');
		const stampEl = svg.querySelector<SVGGElement>('.bp-stamp');
		// go2/w5: pair notes join the existing annotation fade — no new GSAP step.
		const annotationEls = svg.querySelectorAll<SVGTextElement>('.bp-annotation, .bp-pair-note');

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
				{ autoAlpha: 1, scale: 1, duration: durationSec('slow'), ease: 'power2.out' },
			);
		}
		// GO-w2t5: signal dash — a short bright segment travels each
		// connector once, then fades. dasharray "12 <len+12>" shows exactly
		// one 12-unit dash; sliding dashoffset 12 → -len walks it
		// start→end. One-shot, no repeat, dies with tl.kill().
		const signalEls = svg.querySelectorAll<SVGPathElement>('.bp-signal');
		if (signalEls.length > 0) {
			tl.addLabel('signals');
			signalEls.forEach((sig, i) => {
				const length =
					typeof sig.getTotalLength === 'function' ? sig.getTotalLength() : ROW_GAP * 2;
				const at = `signals+=${i * 0.08}`;
				tl.set(
					sig,
					{ strokeDasharray: `12 ${length + 12}`, strokeDashoffset: 12, autoAlpha: 1 },
					at,
				);
				tl.to(sig, { strokeDashoffset: -length, duration: durationSec('slower'), ease: 'power1.inOut' }, at);
				tl.to(sig, { autoAlpha: 0, duration: durationSec('fast') }, `signals+=${i * 0.08 + 0.45}`);
			});
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
	aria-label={canvasAria}
>
	<!-- go2/w5 §8 drafting paper: dot grid + registration ticks — static
	     furniture in --bp-grid-ink, decorative (sub-3:1 by design). -->
	<defs>
		<pattern id="bp-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
			<circle cx="1" cy="1" r="1" fill="var(--bp-grid-ink)" />
		</pattern>
	</defs>
	<rect
		class="bp-grid"
		aria-hidden="true"
		x={-PAD}
		y={-PAD}
		width={layout.width + PAD * 2}
		height={layout.height + PAD * 2}
		fill="url(#bp-dot-grid)"
	/>
	<g class="bp-reg-ticks" aria-hidden="true">
		<path d={`M ${-PAD} ${-PAD + 8} V ${-PAD} H ${-PAD + 8}`} />
		<path d={`M ${layout.width + PAD - 8} ${-PAD} H ${layout.width + PAD} V ${-PAD + 8}`} />
		<path d={`M ${-PAD} ${layout.height + PAD - 8} V ${layout.height + PAD} H ${-PAD + 8}`} />
		<path d={`M ${layout.width + PAD - 8} ${layout.height + PAD} H ${layout.width + PAD} V ${layout.height + PAD - 8}`} />
	</g>

	{#if !stacked}
		<!-- go2/w5 §8: layer row labels in the left gutter — the printed name
		     beside every layer-colored element (hue never the sole carrier). -->
		<g class="bp-row-labels" aria-hidden="true">
			{#each rows as row, rowIndex (rowIndex)}
				<text
					class={`bp-row-label bp-ink-${row[0].layer}`}
					x={-PAD - 6}
					y={row[0].y + row[0].h / 2}
					text-anchor="end"
					dominant-baseline="central"
				>
					{resolveLocale(LAYER_NAMES[row[0].layer], locale)}
				</text>
			{/each}
		</g>
	{/if}

	<g class="bp-connectors">
		{#each layout.connectors as connector (connector.kind + connector.from + '→' + connector.to)}
			<path
				class={`bp-connector bp-from-${layerById.get(connector.from)}`}
				class:bp-connector-rail={connector.kind === 'rail'}
				class:bp-connector-hot={hoverBoxId === connector.from}
				d={connector.path}
				data-from={connector.from}
				data-to={connector.to}
			/>
		{/each}
	</g>

	{#each rows as row, rowIndex (rowIndex)}
		<g class="bp-row">
			{#each row as box (box.id)}
				<!-- role=presentation: the svg is role="img" (children are not
				     exposed); the pointer handlers are a hover-only teaching
				     enrichment, gated visually behind @media (hover: hover). -->
				<g
					class="bp-box"
					class:bp-matched={compose && matchedSet.has(box.id)}
					class:bp-ghost={compose && missingSet.has(box.id)}
					data-flip-id={box.id}
					data-testid={`bp-box-${box.id}`}
					role="presentation"
					onpointerenter={() => (hoverBoxId = box.id)}
					onpointerleave={() => (hoverBoxId = null)}
				>
					<rect x={box.x} y={box.y} width={box.w} height={box.h} rx="4" class="bp-box-rect" />
					<!-- go2/w5 §8: 3px layer tab on the left edge — stroke
					     semantics untouched (matched/ghost ride the rect). -->
					<rect
						class={`bp-box-tab bp-fill-${box.layer}`}
						x={box.x + 1.5}
						y={box.y + 1.5}
						width="3"
						height={box.h - 3}
						rx="1"
					/>
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

	<!-- GO-w2t5 fun-pass: one-shot signal dash per FLOW connector (finale:
	     sibling rails carry no traffic — a signal pulsing 24px sideways is
	     noise). Rest opacity 0 (CSS); only the animate=true timeline lights
	     them. -->
	<g class="bp-signals" aria-hidden="true">
		{#each layout.connectors.filter((c) => c.kind === 'flow') as connector (connector.from + '→' + connector.to)}
			<path class="bp-signal" d={connector.path} />
		{/each}
	</g>

	{#if !compose}
		<!-- go2/w5 §4: pair notes — suppressed in compose entry (the '+ add …'
		     annotation owns the row gaps there); hidden <768px via CSS (the
		     <ol> below the SVG takes over). -->
		{#each pairNotes as note (note.from + '-' + note.to)}
			<text
				class="bp-pair-note"
				data-testid={`bp-pair-note-${note.from}-${note.to}`}
				x={note.x}
				y={note.y}
				text-anchor="middle"
				dominant-baseline="central"
			>
				{note.text}
			</text>
		{/each}
	{/if}

	{#if firstMissingBox}
		<text
			class="bp-annotation"
			data-testid="bp-annotation"
			x={firstMissingBox.x + firstMissingBox.w / 2}
			y={firstMissingBox.y + firstMissingBox.h + 16}
			text-anchor="middle"
		>
			{completeAnnotation}
		</text>
	{/if}

	<!-- go2/w5 §8: stamp → title block (rail plate): framed REV A line plus a
	     parts · layers meta line. -->
	<g class="bp-stamp" data-testid="blueprint-stamp">
		<rect
			class="bp-stamp-frame"
			x={-PAD}
			y={layout.height + STAMP_H - 16}
			width={layout.width + PAD * 2}
			height="36"
			rx="2"
		/>
		<text
			class="bp-stamp-title"
			x={layout.width + PAD - 8}
			y={layout.height + STAMP_H}
			text-anchor="end"
			textLength={stampTitleLength}
			lengthAdjust={stampTitleLength === undefined ? undefined : 'spacingAndGlyphs'}
		>
			{stampTitle}
		</text>
		<text
			class="bp-stamp-meta"
			x={layout.width + PAD - 8}
			y={layout.height + STAMP_H + 14}
			text-anchor="end"
		>
			REV A · {layout.boxes.length} {partsWord} · {layerCount} {layersWord}
		</text>
	</g>
</svg>

{#if !compose && pairNotes.length > 0}
	<!-- go2/w5 §4 mobile: the same derived pairs as a list below the SVG
	     (shown only <768px; the in-SVG notes hide there). -->
	<ol class="bp-pair-list" data-testid="bp-pair-list">
		{#each pairNotes as note (note.from + '-' + note.to)}
			<li>{note.text}</li>
		{/each}
	</ol>
{/if}

<style>
	.blueprint-canvas {
		width: 100%;
		/* max-width set inline = layout natural width (render scale ≤ 1). */
		height: auto;
		/* Safety net for tall compose blueprints: the default
		   preserveAspectRatio (xMidYMid meet) letterboxes the drawing down —
		   the WHOLE blueprint stays visible without scrolling. Legibility
		   pass: 440 → 480 so the taller 56px boxes (a 4-row drawing's viewBox
		   is 452 now) render 1:1 instead of letterboxing the new type back
		   down; still ≤ 85% of every project viewport (56svh governs first
		   on short screens). */
		max-height: min(56svh, 480px);
		display: block;
		margin: 0 auto;
		overflow: visible;
	}

	.bp-reg-ticks path {
		fill: none;
		stroke: var(--bp-grid-ink);
		stroke-width: 1;
	}

	/* go2/w5 §8: layer row labels — printed names in layer color. Legibility
	   pass: every SVG label steps up one rung of the site type scale (tokens,
	   never raw px); the svg renders 1:1 so token px = real px. */
	.bp-row-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}

	.bp-ink-interface { fill: var(--layer-interface); }
	.bp-ink-logic { fill: var(--layer-logic); }
	.bp-ink-data { fill: var(--layer-data); }
	.bp-ink-infra { fill: var(--layer-infra); }

	.bp-connector {
		fill: none;
		stroke: var(--border);
		stroke-width: 1.5;
	}

	/* Finale (4b): sibling rails — same-row ties keeping multi-box rows on one
	   circuit (total connectivity). Quieter than the flow wiring. */
	.bp-connector-rail {
		stroke-width: 1;
	}

	/* go2/w5 §8: hover teaching (pointer devices only) — the hovered box's
	   outgoing connector takes the box's layer color; color confirms the
	   pair note's claim. Signal dash stays --primary (brand pulse). */
	@media (hover: hover) {
		.bp-connector {
			transition: stroke var(--duration-fast) ease;
		}

		.bp-connector-hot.bp-from-interface { stroke: var(--layer-interface); }
		.bp-connector-hot.bp-from-logic { stroke: var(--layer-logic); }
		.bp-connector-hot.bp-from-data { stroke: var(--layer-data); }
		.bp-connector-hot.bp-from-infra { stroke: var(--layer-infra); }
	}

	.bp-signal {
		fill: none;
		stroke: var(--primary);
		stroke-width: 2.5;
		stroke-linecap: round;
		opacity: 0;
		pointer-events: none;
	}

	.bp-box-rect {
		fill: var(--background);
		stroke: var(--secondary-foreground);
		stroke-width: 1.5;
	}

	.bp-fill-interface { fill: var(--layer-interface); }
	.bp-fill-logic { fill: var(--layer-logic); }
	.bp-fill-data { fill: var(--layer-data); }
	.bp-fill-infra { fill: var(--layer-infra); }

	.bp-box-label {
		font-family: var(--font-mono);
		font-size: var(--text-body);
		fill: var(--foreground);
	}

	/* Compose entry: picked techs light up… */
	.bp-matched .bp-box-rect {
		stroke: var(--primary);
		stroke-width: 2;
	}

	/* …missing techs ghost out (group opacity dims the layer tab with it). */
	.bp-ghost {
		opacity: 0.4;
	}

	.bp-ghost .bp-box-rect {
		stroke-dasharray: 6 4;
	}

	.bp-annotation {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		fill: var(--primary);
	}

	/* go2/w5 §4: pair notes — teach ink with a paper halo so they read over
	   the connectors they annotate (classic drafting: the line breaks for the
	   label). Taste round 2: halo = --engine-paper (the band's composited
	   color), not raw --background — the old halo ghosted a lighter box on
	   the tinted band. */
	.bp-pair-note {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		fill: var(--engine-teach-ink);
		stroke: var(--engine-paper, var(--background));
		stroke-width: 3px;
		paint-order: stroke;
	}

	@media (--tablet-max) {
		.bp-pair-note {
			display: none;
		}
	}

	.bp-pair-list {
		display: none;
		margin: 0.5rem auto 0;
		padding-left: 1.25rem;
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		color: var(--engine-teach-ink);
	}

	.bp-pair-list li {
		line-height: 1.6;
	}

	@media (--tablet-max) {
		.bp-pair-list {
			display: block;
			width: fit-content;
		}
	}

	.bp-stamp-frame {
		fill: none;
		stroke: var(--border);
		stroke-width: 1;
	}

	.bp-stamp-title {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		letter-spacing: 2px;
		text-transform: uppercase;
		fill: var(--muted-foreground);
	}

	.bp-stamp-meta {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		fill: var(--muted-foreground);
	}
</style>
