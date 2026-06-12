<!-- /tech-stack route: hero + Tech Stack Engine (slice-29) + CTA -->
<script lang="ts">
	import type { Component } from 'svelte';
	import { onMount } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { fillTemplate } from '$lib/utils/labels';
	import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';
	import { StatusDot, SectionLabel } from '$lib/components/brand';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';

	let { data } = $props();

	// slice-29: the engine mounts below the hero via dynamic import() so ALL
	// engine code (state, sub-views, GSAP Flip) lives in its own async chunk —
	// the route's entry chunk stays hero-sized. `animate` is the single
	// reduced-motion switch for the whole engine tree.
	let EngineComponent = $state<Component<{ animate?: boolean }> | null>(null);
	let engineAnimate = $state(true);

	// Dynamic counts from data layer.
	const itemCount = data.items.length;

	// Pre-resolved chrome via the layout-provided locale (slice-28.6). Init-time
	// consts are correct: the page remounts per pathname under the root
	// layout's {#key $page.url.pathname}.
	// SEO meta + title emitted by <SeoHead> in +layout.svelte (Slice 15a).
	// Chrome content flows through adapter → repository → load() post-17c
	// (closed the 17b seam leak that had this file importing $lib/content).
	const c = data.techStackPage;
	const heroOverline = resolveLocale(c.hero.overline, locale);
	const heroTitleLine1 = resolveLocale(c.hero.titleLine1, locale);
	const heroTitleLine2 = resolveLocale(c.hero.titleLine2, locale);
	const heroTerminalAria = resolveLocale(c.hero.terminalAria, locale);
	// go2/w5 §1: "What is a stack?" explainer — CMS-backed (stack_explainer flat
	// column) with a byte-identical EN code fallback. The committed module has
	// no stackExplainer until the orchestrator applies the field + regenerates,
	// so the fallback is what EXPORT_FALLBACKS_SKIP=1 builds render. Never blank.
	const FALLBACK_STACK_EXPLAINER =
		'A "stack" is just the parts list of a piece of software: the interface people touch, the logic that decides things, the data it remembers, and the infrastructure it runs on. That\'s the whole secret. Once you can read a stack, a quote can\'t hide much from you — poke the blueprints below and see for yourself.';
	const stackExplainer = c.hero.stackExplainer
		? resolveLocale(c.hero.stackExplainer, locale) || FALLBACK_STACK_EXPLAINER
		: FALLBACK_STACK_EXPLAINER;
	const statLabels = {
		technologies: resolveLocale(c.hero.stats.technologies, locale),
	};
	const getInTouchLabel = resolveLocale(c.actions.getInTouch, locale);
	const viewServicesLabel = resolveLocale(c.actions.viewServices, locale);
	const ctaHeadingLine1 = resolveLocale(c.cta.headingLine1, locale);
	const ctaHeadingLine2 = resolveLocale(c.cta.headingLine2, locale);
	const ctaSub = resolveLocale(c.cta.sub, locale);
	const ctaAvailability = resolveLocale(c.cta.availability, locale);

	// Hero terminal typed sequence
	interface TerminalLine {
		text: string;
		color: 'default' | 'muted' | 'orange' | 'accent' | 'green';
		visible: boolean;
	}

	// CMS-driven line templates (go2-t1b2 operator addendum) with the previous
	// hardcoded strings as code fallbacks. The literal {count} token is
	// interpolated here from data.items.length — computed, never stored.
	const count = String(itemCount);
	const terminalLines: TerminalLine[] = [
		{ text: fillTemplate(resolveLocale(c.hero.terminal.cmd, locale) || '~ yesid --stack --verbose', { count }), color: 'default', visible: true },
		{ text: fillTemplate(resolveLocale(c.hero.terminal.loading, locale) || '→ loading {count} nodes...', { count }), color: 'muted', visible: false },
		{ text: fillTemplate(resolveLocale(c.hero.terminal.success, locale) || '✓ successful', { count }), color: 'green', visible: false },
		{ text: fillTemplate(resolveLocale(c.hero.terminal.cataloged, locale) || '→ {count} technologies cataloged', { count }), color: 'orange', visible: false },
		{ text: fillTemplate(resolveLocale(c.hero.terminal.status, locale) || 'interactive map online.', { count }), color: 'accent', visible: false },
	];

	let heroLines = $state<TerminalLine[]>(terminalLines);
	let heroReady = $state(false);
	let heroCursorVisible = $state(false);

	onMount(() => {
		// Engine chunk: kicked off immediately (parallel with the hero typing
		// sequence); reduced motion computed once here and passed down.
		engineAnimate = !isPrefersReducedMotion();
		void import('$lib/components/stack-engine/Engine.svelte').then((mod) => {
			EngineComponent = mod.default;
		});

		if (isPrefersReducedMotion()) {
			heroLines = terminalLines.map((l) => ({ ...l, visible: true }));
			heroReady = true;
			heroCursorVisible = true;
			return;
		}

		const delays = [400, 300, 400, 500];

		async function playSequence() {
			for (let i = 1; i < heroLines.length; i++) {
				await new Promise((r) => setTimeout(r, delays[i - 1]));
				heroLines[i] = { ...heroLines[i], visible: true };
			}
			await new Promise((r) => setTimeout(r, 300));
			heroCursorVisible = true;
			heroReady = true;
		}

		playSequence();
	});
</script>

<main class="tech-stack-page">
	<!-- ═══ HERO ZONE ═══ -->
	<section class="hero" data-testid="tech-stack-hero">
		<div class="hero-overline">
			<SectionLabel text={heroOverline} variant="station" />
		</div>

		<!-- go2/w5 micro-pass (4f): two columns on desktop — the READING column
		     (title → explainer → terminal) leads at ~60, the READOUT column
		     (count gauge + actions) anchors the right ~40. Mobile stacks in
		     source order — exactly the finale order: title → explainer →
		     terminal → count → actions. -->
		<div class="hero-columns">
			<div class="hero-col-main" data-testid="hero-col-main">
				<h1 class="hero-title">
					{heroTitleLine1}<br>
					<span class="hero-title-accent">{heroTitleLine2}.</span>
				</h1>

				<!-- go2/w5 §1: educational FIRST — the plain-language explainer reads
				     before the machine voice starts typing. Human voice = site sans;
				     mono stays the machine's. -->
				<p class="stack-explainer" data-testid="stack-explainer">
					<span class="explainer-kicker">what's a "stack"?</span>
					{stackExplainer}
				</p>

				<div class="hero-terminal" aria-label={heroTerminalAria}>
					{#each heroLines as line}
						<div
							class="hero-terminal-line hero-line-color-{line.color}"
							class:hero-line-visible={line.visible}
							class:hero-line-animate={line.visible && !isPrefersReducedMotion()}
						>
							{line.text}
						</div>
					{/each}
					<div
						class="hero-terminal-line"
						class:hero-line-visible={heroCursorVisible}
					>
						<span class="hero-prompt">~</span>
						<TerminalCursor />
					</div>
				</div>
			</div>

			<div class="hero-col-side" data-testid="hero-col-side">
				<div class="hero-stats" class:hero-reveal={heroReady} class:hero-hidden={!heroReady}>
					<div class="hero-stat">
						<span class="hero-stat-value flex items-center gap-2"><StatusDot color="orange" pulse />{itemCount}</span>
						<span class="hero-stat-label">{statLabels.technologies}</span>
					</div>
				</div>

				<!-- Yellow-conversion rule (ratified): 'Get in touch' IS the
				     conversation starter, so it wears the signage yellow — the
				     BlueprintCTA recipe (--accent under fixed near-black ink,
				     hover steps to --accent-hover, never orange). 'View services'
				     is exploration → stays in the standard orange grammar. -->
				<div class="hero-actions" class:hero-reveal={heroReady} class:hero-hidden={!heroReady}>
					<Button variant="default" size="cta" class="hero-cta-talk" href={localizeHref('/contact', locale)}>
						{getInTouchLabel} <span aria-hidden="true">&rarr;</span>
					</Button>
					<Button variant="outline" size="cta" href={localizeHref('/services', locale)}>
						{viewServicesLabel}
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══ ENGINE ZONE (slice-29, own async chunk) ═══
	     GO-w2t5 operator addendum: the zone is a full-bleed band — edge-to-edge
	     on desktop, framed top + bottom by the shared full-width hazard strips
	     (the /projects dashed orange divider, reused — not reinvented). Hero
	     above and CTA below keep their constrained width EXACTLY ("perfect
	     that way"). Mobile width behavior is unchanged: sections are already
	     naturally edge-to-edge below --container-wide. The band wraps the
	     loading placeholder too, so the frame is stable while the chunk lands. -->
	<div class="engine-band" data-testid="engine-band">
		<Separator variant="hazard" data-testid="engine-band-hazard-top" />
		{#if EngineComponent}
			<EngineComponent animate={engineAnimate} />
		{:else}
			<section class="engine-loading" data-testid="stack-engine-loading" aria-hidden="true">
				<span class="engine-loading-line">~ rolling out the drawing board…</span>
			</section>
		{/if}
		<Separator variant="hazard" data-testid="engine-band-hazard-bottom" />
	</div>

	<!-- ═══ CTA ZONE ═══ -->
	<section class="cta-zone" data-testid="tech-stack-cta">
		<div class="cta-hazard" aria-hidden="true"></div>
		<h2 class="cta-heading">
			{ctaHeadingLine1}<span class="cta-accent">?</span><br>
			{ctaHeadingLine2}<span class="cta-accent">.</span>
		</h2>
		<p class="cta-sub">
			{ctaSub}
		</p>
		<div class="cta-buttons">
			<Button variant="default" size="cta" href={localizeHref('/contact', locale)}>
				{getInTouchLabel} <span aria-hidden="true">&rarr;</span>
			</Button>
			<Button variant="outline" size="cta" href={localizeHref('/services', locale)}>
				{viewServicesLabel}
			</Button>
		</div>
		<span class="cta-avail">{ctaAvailability}</span>
	</section>
</main>

<style>
	.tech-stack-page {
		min-height: 100dvh;
		padding-block: 2rem;
	}

	/* ═══ HERO ZONE ═══ */

	/* go2/w5 finale (4d) + micro-pass (4e): the CONTROL ROOM stays full-bleed —
	   edge to edge, superseding the old constrained-hero rule for THIS page —
	   but it sits on the PLAIN site background (operator: "just usual black"
	   in dark; plain paper in light). The 3% brand tint belongs to the ENGINE
	   BAND alone; the hazard strip below is the band's front edge, not a seam
	   between two tinted panels. Type keeps the finale's confident scale. */
	.hero {
		padding: 3rem var(--space-page-x) 2rem;
		display: flex;
		flex-direction: column;
		min-height: 50dvh;
		justify-content: center;
	}

	/* Micro-pass (4f): the two-column control room. Single column by default
	   (mobile stacks in source order: title → explainer → terminal → count →
	   actions); the ≥768px grid lives in the Responsive section below. */
	.hero-columns {
		display: grid;
		grid-template-columns: 1fr;
	}

	.hero-overline {
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.hero-overline::before {
		content: '';
		width: 32px;
		height: 1px;
		background: var(--primary);
		flex-shrink: 0;
	}

	.hero-title {
		font-family: var(--font-heading);
		font-size: clamp(2.75rem, 8vw, 7.5rem);
		font-weight: 800;
		line-height: 1.02;
		letter-spacing: -0.03em;
		color: var(--foreground);
		margin-bottom: 2rem;
	}

	.hero-title-accent { color: var(--primary); }

	/* go2/w5 §1: the teaching voice is the human voice — site sans, not mono.
	   Finale (4d): a comfortable BIG reading size on the wide panel. */
	.stack-explainer {
		font-size: clamp(1.0625rem, 1.5vw, 1.375rem);
		line-height: 1.6;
		color: var(--secondary-foreground);
		max-width: 62ch;
		margin: 0 0 2.5rem;
	}

	.explainer-kicker {
		display: block;
		font-family: var(--font-mono);
		font-size: 12px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--accent-text);
		margin-bottom: 0.5rem;
	}

	/* Finale (4d): the terminal sits proud — bigger type, wider line. */
	.hero-terminal {
		font-family: var(--font-mono);
		font-size: clamp(13px, 1.3vw, 17px);
		line-height: 1.8;
		margin-bottom: 2.5rem;
		max-width: 760px;
	}

	.hero-terminal-line {
		color: var(--secondary-foreground);
		opacity: 0;
	}

	.hero-line-visible { opacity: 1; }

	.hero-line-color-default { color: var(--secondary-foreground); }
	.hero-line-color-muted { color: var(--muted-foreground); }
	.hero-line-color-orange { color: var(--primary); }
	.hero-line-color-accent { color: var(--accent-text); }
	.hero-line-color-green { color: var(--success); }

	.hero-line-animate { animation: hero-line-in 0.3s ease-out both; }

	@keyframes hero-line-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.hero-prompt { color: var(--foreground); }

	.hero-hidden { opacity: 0; }

	.hero-reveal {
		opacity: 1;
		transition: opacity var(--duration-slower) var(--ease-default);
	}

	.hero-stats {
		display: flex;
		gap: 2.5rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border);
		margin-bottom: 2rem;
	}

	.hero-stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* Finale (4d): the technologies count reads like a gauge on the panel. */
	.hero-stat-value {
		font-family: var(--font-mono);
		font-size: clamp(28px, 3.2vw, 44px);
		font-weight: 700;
		color: var(--foreground);
		line-height: 1;
		display: flex;
		align-items: center;
	}

	.hero-stat-label {
		font-family: var(--font-mono);
		font-size: 12px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--muted-foreground);
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	/* Yellow-conversion rule (go2/w5 operator doctrine): yellow means "talk
	   to Yesid" ONLY. The hero's get-in-touch is the conversation starter, so
	   it wears the signage pairing — the BlueprintCTA recipe verbatim:
	   --accent (#FFB627) under fixed near-black ink (#1C1814 ≈ 10:1, AA in
	   BOTH themes); hover steps down the accent system's own darker yellow
	   (--accent-hover #E5A220), never orange. Unlayered scoped rules outrank
	   the Button's layered utility classes; the glow swaps to the accent hue
	   so no orange halo sneaks under the yellow. */
	.hero-actions :global(.hero-cta-talk) {
		background: var(--accent);
		color: #1C1814;
	}

	.hero-actions :global(.hero-cta-talk:hover) {
		background: var(--accent-hover);
		color: #1C1814;
		box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 30%, transparent);
	}

	/* ═══ ENGINE ZONE ═══ */

	/* GO-w2t5 addendum: full-bleed work-zone band. No max-width — the band
	   runs edge-to-edge between its hazard strips; the faint brand tint marks
	   the interactive zone (cute-pass anchor; alpha-only over the global
	   circuit grid). Finale (4d): margin-top is GONE. Micro-pass (4e): the
	   tint is the BAND'S alone again ("I love the engine!") — the hero above
	   went back to plain site background, so the top hazard strip reads as
	   the engine's front edge. */
	.engine-band {
		margin: 0 0 2rem;
		background: color-mix(in srgb, var(--primary) 3%, transparent);
	}

	/* go2/w5 taste round 2: the placeholder rides the full bleed like the
	   engine it stands in for — no width cap anywhere inside the band (the
	   old container-wide cap flashed the "constrained" look while the chunk
	   loaded). Gutters via the same --space-page-x padding. */
	.engine-loading {
		padding: 2rem var(--space-page-x);
		min-height: 200px;
	}

	/* go2/w5 legibility pass: the placeholder reads at the engine's new base
	   size (--text-small) so the chunk landing never visibly shrinks type. */
	.engine-loading-line {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--muted-foreground);
	}

	/* ═══ CTA ZONE ═══ */

	.cta-zone {
		max-width: var(--container-wide);
		margin: 4rem auto 2rem;
		padding: 0 var(--space-page-x);
		text-align: center;
	}

	.cta-hazard {
		width: 60px;
		height: 3px;
		margin: 0 auto 2rem;
		background: repeating-linear-gradient(
			-45deg,
			var(--accent) 0px, var(--accent) 4px,
			transparent 4px, transparent 8px
		);
	}

	.cta-heading {
		font-family: var(--font-heading);
		font-size: clamp(1.5rem, 3vw, 2.5rem);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.2;
		color: var(--foreground);
		margin-bottom: 0.75rem;
	}

	.cta-accent { color: var(--primary); }

	.cta-sub {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--muted-foreground);
		margin-bottom: 2rem;
		max-width: 500px;
		margin-inline: auto;
		line-height: 1.6;
	}

	.cta-buttons {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.cta-avail {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 1px;
		color: var(--accent-text);
		text-transform: uppercase;
	}

	/* ═══ Responsive ═══ */

	@media (min-width: 768px) {
		/* Micro-pass (4f): desktop control room is TWO columns — the reading
		   column drives at ~60/40 and both columns sit on one bottom rhythm
		   line (align-items: end → the terminal's resting prompt and the
		   action row share the rail; terminal lines are always in flow, so
		   the typing sequence never shifts the grid). */
		.hero-columns {
			grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
			column-gap: clamp(2.5rem, 6vw, 6rem);
			align-items: end;
		}

		/* The shared rhythm line does the separating — no trailing margin on
		   the reading column's last block. */
		.hero-terminal {
			margin-bottom: 0;
		}

		/* The count is the readout column's anchor gauge — bigger on the
		   panel, still mono, still a number you can read across the room. */
		.hero-stat-value {
			font-size: clamp(2.75rem, 4.5vw, 5rem);
		}
	}

	@media (max-width: 767px) {
		/* Finale (4d): mobile stays composed — big but never broken. The clamp
		   minima above already fit a 360px viewport; tighten the frame only.
		   (4f: the bottom 2rem rides the section now that the action row lost
		   its own padding-bottom spacer.) */
		.hero {
			padding: 2rem var(--space-page-x) 2rem;
			min-height: 40dvh;
		}

		.hero-terminal {
			margin-bottom: 2rem;
		}

		.hero-stats {
			gap: 1.5rem;
			flex-wrap: wrap;
		}

		.cta-zone {
			margin-top: 3rem;
			padding: 0 var(--space-page-x);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-line-animate { animation: none; }
		.hero-hidden { opacity: 1; }
		.hero-reveal { transition: none; }
	}
</style>
