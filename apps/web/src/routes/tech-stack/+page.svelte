<!-- /tech-stack route: hero + Tech Stack Engine (slice-29) + CTA -->
<script lang="ts">
	import type { Component } from 'svelte';
	import { onMount } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { resolveLocale } from '$lib/utils/locale';
	import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';
	import { StatusDot, SectionLabel } from '$lib/components/brand';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();

	// slice-29: the engine mounts below the hero via dynamic import() so ALL
	// engine code (state, sub-views, GSAP Flip) lives in its own async chunk —
	// the route's entry chunk stays hero-sized. `animate` is the single
	// reduced-motion switch for the whole engine tree.
	let EngineComponent = $state<Component<{ animate?: boolean }> | null>(null);
	let engineAnimate = $state(true);

	// Dynamic counts from data layer.
	const itemCount = data.items.length;

	// Pre-resolved chrome — all static English for now (swap to $derived on
	// locale when translation arrives).
	// SEO meta + title emitted by <SeoHead> in +layout.svelte (Slice 15a).
	// Chrome content flows through adapter → repository → load() post-17c
	// (closed the 17b seam leak that had this file importing $lib/content).
	const c = data.techStackPage;
	const heroOverline = resolveLocale(c.hero.overline, 'en');
	const heroTitleLine1 = resolveLocale(c.hero.titleLine1, 'en');
	const heroTitleLine2 = resolveLocale(c.hero.titleLine2, 'en');
	const heroTerminalAria = resolveLocale(c.hero.terminalAria, 'en');
	const statLabels = {
		technologies: resolveLocale(c.hero.stats.technologies, 'en'),
	};
	const getInTouchLabel = resolveLocale(c.actions.getInTouch, 'en');
	const viewServicesLabel = resolveLocale(c.actions.viewServices, 'en');
	const ctaHeadingLine1 = resolveLocale(c.cta.headingLine1, 'en');
	const ctaHeadingLine2 = resolveLocale(c.cta.headingLine2, 'en');
	const ctaSub = resolveLocale(c.cta.sub, 'en');
	const ctaAvailability = resolveLocale(c.cta.availability, 'en');

	// Hero terminal typed sequence
	interface TerminalLine {
		text: string;
		color: 'default' | 'muted' | 'orange' | 'accent' | 'green';
		visible: boolean;
	}

	const terminalLines: TerminalLine[] = [
		{ text: '~ yesid --stack --verbose', color: 'default', visible: true },
		{ text: `→ loading ${itemCount} nodes...`, color: 'muted', visible: false },
		{ text: '✓ successful', color: 'green', visible: false },
		{ text: `→ ${itemCount} technologies cataloged`, color: 'orange', visible: false },
		{ text: 'interactive map online.', color: 'accent', visible: false },
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

		<h1 class="hero-title">
			{heroTitleLine1}<br>
			<span class="hero-title-accent">{heroTitleLine2}.</span>
		</h1>

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

		<div class="hero-stats" class:hero-reveal={heroReady} class:hero-hidden={!heroReady}>
			<div class="hero-stat">
				<span class="hero-stat-value flex items-center gap-2"><StatusDot color="orange" pulse />{itemCount}</span>
				<span class="hero-stat-label">{statLabels.technologies}</span>
			</div>
		</div>

		<div class="hero-actions" class:hero-reveal={heroReady} class:hero-hidden={!heroReady}>
			<Button variant="default" size="cta" href="/contact">
				{getInTouchLabel} <span aria-hidden="true">&rarr;</span>
			</Button>
			<Button variant="outline" size="cta" href="/services">
				{viewServicesLabel}
			</Button>
		</div>
	</section>

	<!-- ═══ ENGINE ZONE (slice-29, own async chunk) ═══ -->
	{#if EngineComponent}
		<EngineComponent animate={engineAnimate} />
	{:else}
		<section class="engine-loading" data-testid="stack-engine-loading" aria-hidden="true">
			<span class="engine-loading-line">~ loading engine…</span>
		</section>
	{/if}

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
			<Button variant="default" size="cta" href="/contact">
				{getInTouchLabel} <span aria-hidden="true">&rarr;</span>
			</Button>
			<Button variant="outline" size="cta" href="/services">
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

	.hero {
		max-width: var(--container-wide);
		margin: 0 auto;
		padding: 2rem var(--space-page-x) 0;
		display: flex;
		flex-direction: column;
		min-height: 50dvh;
		justify-content: center;
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
		font-size: clamp(2.5rem, 6vw, 5rem);
		font-weight: 800;
		line-height: 1.05;
		letter-spacing: -0.03em;
		color: var(--foreground);
		margin-bottom: 1.5rem;
	}

	.hero-title-accent { color: var(--primary); }

	.hero-terminal {
		font-family: var(--font-mono);
		font-size: clamp(12px, 1.4vw, 14px);
		line-height: 1.8;
		margin-bottom: 2.5rem;
		max-width: 600px;
	}

	.hero-terminal-line {
		color: var(--secondary-foreground);
		opacity: 0;
	}

	.hero-line-visible { opacity: 1; }

	.hero-line-color-default { color: var(--secondary-foreground); }
	.hero-line-color-muted { color: var(--muted-foreground); }
	.hero-line-color-orange { color: var(--primary); }
	.hero-line-color-accent { color: var(--accent); }
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

	.hero-stat-value {
		font-family: var(--font-mono);
		font-size: clamp(22px, 3vw, 28px);
		font-weight: 700;
		color: var(--foreground);
		line-height: 1;
		display: flex;
		align-items: center;
	}

	.hero-stat-label {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--muted-foreground);
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		padding-bottom: 2rem;
	}

	/* ═══ ENGINE ZONE ═══ */

	.engine-loading {
		max-width: var(--container-wide);
		margin: 0 auto;
		padding: 2rem var(--space-page-x);
		min-height: 200px;
	}

	.engine-loading-line {
		font-family: var(--font-mono);
		font-size: 12px;
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
		color: var(--accent);
		text-transform: uppercase;
	}

	/* ═══ Responsive ═══ */

	@media (max-width: 767px) {
		.hero {
			padding: 1.5rem var(--space-page-x) 0;
			min-height: 40dvh;
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
