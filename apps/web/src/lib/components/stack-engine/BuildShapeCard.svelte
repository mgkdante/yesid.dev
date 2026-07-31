<script lang="ts">
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { gsap } from 'gsap';
	import { Flip } from 'gsap/Flip';
	import { STACK_LAYERS, type StackLayer } from '@repo/shared/schemas';
	import type { Locale } from '$lib/types';
	import { StatusDot } from '$lib/components/brand';
	import { techStackItems } from '$lib/content/tech-stack';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { encodeBlueprint } from '$lib/utils/blueprint-param';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { LAYER_NAMES } from './layer-teaching';
	import {
		AVAILABILITY_LINE,
		composePhrase,
		composeStackShape,
		layerGapLine,
		readShape,
	} from './stack-shape';
	import ShapeBlueprint from './ShapeBlueprint.svelte';
	import ProductPreview from './ProductPreview.svelte';

	const locale = getLocale();

	// Idempotent (Engine.svelte registers it too) — the card morph below uses
	// Flip directly; everything stays inside the engine's async chunk.
	gsap.registerPlugin(Flip);

	type Tech = (typeof techStackItems)[number];

	let {
		pickedTechs,
		animate,
		onViewChange,
	}: {
		pickedTechs: ReadonlySet<string>;
		animate: boolean;
		onViewChange: (view: 'drawing' | 'product') => void;
	} = $props();

	const techById = new Map(techStackItems.map((t) => [t.id, t]));
	const hasPicks = $derived(pickedTechs.size > 0);
	const shapeHref = $derived(
		'/contact?bp=' + encodeBlueprint({ archetype: null, techs: [...pickedTechs] }),
	);

	// ── Build shape (taste round 2; round 3 makes it a DRAWING) — the
	// ALWAYS-ON primary teaching surface. Every pick re-reads the 15-cell
	// layer-coverage matrix: the mini-blueprint draws it (solid picks, ghost
	// layers), the heading names the covered layers, the reading says what
	// they do TOGETHER, the roster grounds it in the actual picks (enables
	// lines), and the next-step line names what a complete build still needs.
	const shape = $derived(composeStackShape([...pickedTechs], techStackItems));
	// Per-locale shape-card templates — exhaustive Record<Locale, …> so a new
	// locale is a compile error here, never a silent English fallback (L1 rule).
	const layerNames = (present: readonly StackLayer[], l: Locale): string =>
		present.map((layer) => resolveLocale(LAYER_NAMES[layer], l)).join(' + ');
	const SHAPE_HEADINGS: Record<Locale, (present: readonly StackLayer[]) => string> = {
		en: (present) =>
			present.length > 0
				? `Your build: ${layerNames(present, 'en')} covered`
				: 'Your build: no layers covered yet',
		fr: (present) =>
			present.length > 0
				? `Ton build : ${layerNames(present, 'fr')} couvert${present.length === 1 ? '' : 's'}`
				: 'Ton build : aucune couche couverte encore',
		es: (present) =>
			present.length > 0
				? `Tu build: ${layerNames(present, 'es')} cubierto${present.length === 1 ? '' : 's'}`
				: 'Tu build: ninguna capa cubierta todavía',
	};
	const SHAPE_READING_LEADS: Record<Locale, string> = {
		en: "that's",
		fr: "c'est",
		es: 'eso es',
	};
	const SHAPE_NEXT: Record<Locale, (missing: readonly StackLayer[]) => string> = {
		en: (missing) =>
			missing.length === 0
				? "nothing missing, this one's ready to build."
				: `add ${missing.map((l) => layerGapLine(l, 'en')).join(' + ')} and this becomes a working product.`,
		fr: (missing) =>
			missing.length === 0
				? 'rien ne manque, celui-là est prêt à bâtir.'
				: `ajoute ${missing.map((l) => layerGapLine(l, 'fr')).join(' + ')} pis ça devient un produit fonctionnel.`,
		es: (missing) =>
			missing.length === 0
				? 'no falta nada, este ya está listo para construir.'
				: `agrega ${missing.map((l) => layerGapLine(l, 'es')).join(' + ')} y esto se vuelve un producto funcional.`,
	};
	const shapeHeading = $derived(SHAPE_HEADINGS[locale](shape.present));
	const shapeReading = $derived(
		`${SHAPE_READING_LEADS[locale]} ${resolveLocale(readShape(shape.present), locale)}.`,
	);
	const shapeNext = $derived(SHAPE_NEXT[locale](shape.missing));
	/** Picked techs in STACK_LAYERS order (stable within a layer), with enables. */
	const layerRank = new Map<string, number>(
		STACK_LAYERS.map((l, i) => [l as string, i] as const),
	);
	const shapeRoster = $derived(
		[...pickedTechs]
			.map((id) => techById.get(id))
			.filter((t): t is Tech => Boolean(t))
			.sort((a, b) => (layerRank.get(a.layer ?? '') ?? 99) - (layerRank.get(b.layer ?? '') ?? 99))
			.map((t) => ({
				id: t.id,
				name: t.name,
				layer: t.layer,
				enables: t.enables ? resolveLocale(t.enables, locale) : '',
			})),
	);
	/** The drawable picks — roster order, layered only (defensive: a layerless
	 *  pick has no blueprint row; it still lists in the roster). */
	const shapePicked = $derived(
		shapeRoster
			.filter((p): p is typeof p & { layer: StackLayer } =>
				Boolean(p.layer && (STACK_LAYERS as readonly string[]).includes(p.layer)),
			)
			.map(({ id, name, layer }) => ({ id, name, layer })),
	);

	// ── Finale (4c): THE PHRASE BUILDER — the card now LEADS with a
	// market-friendly product sentence composed by the layer grammar
	// (stack-shape.ts); the category line demotes to the kicker above it and
	// the 15-subset reading stays as the supporting teaching line below.
	const shapePhrase = $derived(
		resolveLocale(composePhrase(shapePicked, shape.present), locale),
	);

	const availabilityLine = $derived(resolveLocale(AVAILABILITY_LINE, locale));

	// ── Round 4: 'see your build as a product' — the composed shape gets the
	// same drawing ⇄ product flip as the archetypes. The drawing flip-tags
	// only the VISIBLE variant (wide/stacked are CSS-swapped at 1024px) so
	// GSAP Flip never sees duplicate ids.
	let shapeView = $state<'drawing' | 'product'>('drawing');
	let shapeBoardEl: HTMLElement | null = $state(null);
	const wideDrawing = new MediaQuery('(min-width: 1024px)');

	async function toggleShapeView(): Promise<void> {
		const next = shapeView === 'drawing' ? 'product' : 'drawing';
		if (!animate) {
			shapeView = next;
			onViewChange(next);
			return;
		}
		const state = Flip.getState(
			shapeBoardEl?.querySelectorAll('[data-flip-id]') ?? '[data-flip-id]',
		);
		shapeView = next;
		onViewChange(next);
		await tick();
		Flip.from(state, { duration: 0.6, ease: 'power2.inOut', absolute: true, nested: true });
	}

	// ── Localized UI copy (code-owned, em-dash-free). Counts/names interpolate. ─
	const t = {
		shapeLink: resolveLocale(
			{
				en: 'Take this combo with you →',
				fr: 'Apporte cette combinaison avec toi →',
				es: 'Llévate esta combinación contigo →',
			},
			locale,
		),
		seeAsProduct: resolveLocale(
			{
				en: 'see your build as a product',
				fr: 'vois ton build comme un produit',
				es: 've tu build como producto',
			},
			locale,
		),
		backToDrawing: resolveLocale(
			{ en: 'back to the drawing', fr: 'retour au dessin', es: 'volver al dibujo' },
			locale,
		),
	};
</script>

{#if hasPicks}
	<!-- Build shape (taste round 2; round 3: the shape IS a blueprint) —
	     THE primary teaching surface, present from the first pick
	     onward; archetype cards below are bonus "known builds". The
	     mini-blueprint carries the teaching visually (solid picks,
	     ghosted missing layers, dashed wiring); the words support it.
	     Exactly ONE <a> (href formula pinned by unit + e2e suites).
	     The reading re-keys on coverage so it settles in with a
	     micro-pop (fun pass, <400ms → SAFE-ALWAYS). -->
	<div class="build-shape" data-testid="build-shape">
		<div class="shape-head">
			<!-- Finale (4c): the PHRASE leads — a market-friendly product
			     sentence from the layer grammar; the category line
			     demotes to the kicker above it. -->
			<div class="shape-head-text">
				<p class="shape-kicker">{shapeHeading}</p>
				<p class="shape-phrase" data-testid="shape-phrase">{shapePhrase}</p>
			</div>
			{#if shapePicked.length > 0}
				<!-- Round 4: the composed shape gets the archetype payoff
				     too — drawing ⇄ generic product, Flip-morphed. -->
				<button
					type="button"
					class="shape-view-toggle"
					data-testid="shape-view-toggle"
					onclick={toggleShapeView}
				>
					{#if shapeView === 'drawing'}
						{t.seeAsProduct} <span class="shape-toggle-arrow" aria-hidden="true">→</span>
					{:else}
						<span class="shape-toggle-arrow" aria-hidden="true">←</span> {t.backToDrawing}
					{/if}
				</button>
			{/if}
		</div>
		<div class="shape-board" bind:this={shapeBoardEl}>
			<!-- Both variants render; CSS swaps at the desktop breakpoint.
			     The 1:1 stacked column stays active through tablet widths;
			     wide rows take over only once their 972px worst-case frame
			     can preserve the pinned readability floor. display:none keeps the hidden
			     one out of the a11y tree; only the VISIBLE one flip-tags
			     (MediaQuery mirrors the CSS breakpoint). -->
			{#if shapeView === 'drawing' || shapePicked.length === 0}
				<div class="shape-drawing shape-drawing-wide">
					<ShapeBlueprint
						picked={shapePicked}
						missing={shape.missing}
						flip={wideDrawing.current}
					/>
				</div>
				<div class="shape-drawing shape-drawing-stacked">
					<ShapeBlueprint
						picked={shapePicked}
						missing={shape.missing}
						stacked
						testid="shape-blueprint-stacked"
						flip={!wideDrawing.current}
					/>
				</div>
			{:else}
				<div class="shape-product" data-testid="shape-product">
					<ProductPreview picks={shapePicked} />
				</div>
			{/if}
			<div class="shape-notes">
				{#key shape.present.join('+')}
					<p class="shape-reading">{shapeReading}</p>
				{/key}
				<ul class="shape-roster">
					{#each shapeRoster as part (part.id)}
						<li>
							<!-- The separator lives in the expression: Svelte trims a text
							     node's leading whitespace at the element boundary, which
							     ate the space ("PostgreSQL— stores…"). -->
							<span class="roster-name">{part.name}</span>{#if part.enables}<span class="roster-enables">{`, ${part.enables}`}</span>{/if}
						</li>
					{/each}
				</ul>
				<p class="shape-next">{shapeNext}</p>
				<a class="shape-link" data-testid="shape-link" href={shapeHref}>{t.shapeLink}</a>
				<!-- Finale (4c): the operator's open door, woven next to the
				     CTA — warm, small, homey; the whole line is the link. -->
				<p class="shape-availability">
					<StatusDot color="green" pulse />
					<a
						class="shape-availability-link"
						data-testid="shape-availability"
						href={localizeHref('/contact', locale)}
					>{availabilityLine}</a>
				</p>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Taste round 2: the build-shape card — the ever-present companion.
	   Round 3: the card is a drawing board — mini-blueprint beside (desktop)
	   or above (mobile) the supporting words. */
	.build-shape {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px dashed var(--primary);
		border-radius: var(--radius, 6px);
	}

	/* Round 3: drawing + notes share the board — drawing keeps its natural
	   width (render scale ≤ 1), the words wrap beside it and drop below when
	   the row gets tight. */
	.shape-board {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 1rem 2.5rem;
	}

	.shape-drawing {
		flex: 0 1 auto;
		min-width: 0;
		max-width: 100%;
	}

	.shape-notes {
		flex: 1 1 280px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* The wide ⇄ stacked swap: exactly one variant is displayed. The desktop
	   threshold protects the worst-case wide frame's readability scale;
	   display:none keeps the other variant out of the a11y tree. */
	.shape-drawing-wide {
		display: none;
	}

	@media (--desktop-min) {
		/* At the 1024px boundary, the engine's fluid page gutters leave
		   942.08px. This 8px card inset leaves at least 924px for the 972px
		   worst-case frame: scale 0.9506, above the 53/56 floor (0.9464). */
		.build-shape {
			padding-inline: 0.5rem;
		}

		.shape-drawing-wide {
			display: block;
		}

		.shape-drawing-stacked {
			display: none;
		}
	}

	/* Round 4: heading + the product toggle share the card's head row. */
	.shape-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		flex-wrap: wrap;
	}

	.shape-head-text {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}

	/* Finale (4c): the category line, demoted to kicker — still teaching the
	   layer names, no longer the headline. */
	.shape-kicker {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		letter-spacing: 0.5px;
		color: var(--muted-foreground);
		margin: 0;
	}

	/* The product sentence — the card now leads with what this build IS in
	   market words; heading voice, sized to carry the card. Legibility pass:
	   it's the headline of the card, so it wears the site's heading token. */
	.shape-phrase {
		font-family: var(--font-heading);
		font-size: var(--text-heading);
		font-weight: 700;
		line-height: 1.3;
		letter-spacing: -0.01em;
		color: var(--foreground);
		margin: 0;
		max-width: 56ch;
	}

	/* Round 4: same pill language as the engine's view toggle — one hover
	   grammar for every blueprint ⇄ product flip. */
	.shape-view-toggle {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--primary);
		background: none;
		border: 1px solid var(--primary);
		border-radius: var(--radius-pill);
		padding: 0.35rem 0.9rem;
		cursor: pointer;
		transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
	}

	.shape-view-toggle:hover {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.shape-toggle-arrow {
		display: inline-block;
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.shape-view-toggle:hover .shape-toggle-arrow {
		transform: translateX(2px);
	}

	.shape-product {
		flex: 1 1 280px;
		min-width: 0;
		max-width: 540px;
	}

	/* The matrix reading — re-keyed per coverage change, eases in 2px. */
	.shape-reading {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--foreground);
		margin: 0;
		animation: shape-note-in 180ms ease-out;
	}

	@keyframes shape-note-in {
		from {
			opacity: 0;
			translate: 0 2px;
		}
		to {
			opacity: 1;
			translate: 0 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shape-reading {
			animation: none;
		}
	}

	.shape-roster {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin: 0;
		padding: 0;
		font-family: var(--font-mono);
		font-size: var(--text-mono);
	}

	.roster-name {
		color: var(--secondary-foreground);
	}

	.roster-enables {
		color: var(--engine-teach-ink);
	}

	.shape-next {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--engine-teach-ink);
		margin: 0;
	}

	.shape-link {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 3px;
		width: fit-content;
	}

	/* Finale (4c): the open door — a green dot and one warm linked line. */
	.shape-availability {
		display: flex;
		align-items: center;
		gap: 7px;
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		margin: 0;
	}

	/* Yellow-conversion rule (go2/w5): the door is a conversion moment, so its
	   accent joins the signage family — --accent-text is accent-AS-text
	   (#FFB627 dark / darkened #8A6400 light; AA on both engine surfaces).
	   Subtler than the blueprint button — a door, not a billboard: hover
	   thickens the underline and never goes orange (orange = exploration). */
	.shape-availability-link {
		color: var(--accent-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.shape-availability-link:hover {
		text-decoration-thickness: 2px;
	}
</style>
