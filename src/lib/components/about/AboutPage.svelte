<!--
  Full-viewport bento dashboard for /about.
  6×4 CSS Grid with named areas. SELL-first → Personal → Action.
  Wrapped in a plain section (w-full) — no shell needed for a bleed layout.
  Cards stretch to fill — no voids, no fixed heights.
  All content from aboutPageContent via data layer.
-->
<script lang="ts">
	import { aboutPageContent } from '$lib/data/about-page.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { stagger } from '$lib/motion/utils/stagger.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Separator } from '$lib/components/ui/separator';
	import { Card } from '$lib/components/ui/card';
	import AboutIdentity from './AboutIdentity.svelte';
	import AboutPolaroids from './AboutPolaroids.svelte';
	import AboutMetrics from './AboutMetrics.svelte';
	import AboutMethod from './AboutMethod.svelte';
	import AboutTestimonials from './AboutTestimonials.svelte';
	import AboutWeather from './AboutWeather.svelte';
	import AboutLogos from './AboutLogos.svelte';
	import AboutInterests from './AboutInterests.svelte';
	import AboutCta from './AboutCta.svelte';
	import AboutTrain from './AboutTrain.svelte';

	let {
		weather,
	}: {
		weather?: { temp: number; condition: string; icon: string } | null;
	} = $props();

	const c = aboutPageContent;

	// Programmatic stop numbers from card render order. Train is stopless.
	const s = Array.from({ length: 10 }, (_, i) => String(i).padStart(2, '0'));

	// Group tech stack by category
	const stackCategories = $derived.by(() => {
		const groups = new Map<string, typeof c.techStack[number][]>();
		for (const item of c.techStack) {
			const existing = groups.get(item.category) ?? [];
			groups.set(item.category, [...existing, item]);
		}
		return [...groups.entries()];
	});
</script>

<!-- Top Stripe -->
<div class="px-3 pt-1" aria-hidden="true">
	<Separator variant="hazard" />
</div>

<!-- Bento Dashboard -->
<section class="w-full" style="min-height: calc(100dvh - 5rem)" data-testid="page-about">
	<div class="px-3 py-2">
		<div class="dashboard">

				<!-- SELL ROW 1 -->
				<div class="area-identity"><AboutIdentity identity={c.identity} stop={s[0]} label="IDENTITY" /></div>
				<div class="area-metrics"><AboutMetrics metrics={c.metrics} stop={s[1]} label="METRICS" /></div>
				<div class="area-testimonials"><AboutTestimonials testimonials={c.testimonials} stop={s[4]} label="TESTIMONIALS" /></div>

				<!-- SELL ROW 2 -->
				<div class="area-process"><AboutMethod steps={c.methodology} stop={s[2]} label="PROCESS" /></div>
				<div class="area-stack">
					<div class="group h-full" use:reveal use:cursorGlow>
					<Card class="relative h-full p-3" data-testid="about-tech-stack">
						<div class="relative flex h-full flex-col">
							<StopLabel stop={s[3]} label="STACK" />
							<div class="mt-2 flex flex-1 flex-col justify-center gap-2">
								{#each stackCategories as [category, items]}
									<div>
										<div class="label-metric text-[var(--secondary-foreground)]">{category}</div>
										<div class="mt-1 flex flex-wrap gap-1">
											{#each items as item, i}
												<span
													class="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-caption text-[var(--secondary-foreground)] transition-colors duration-200 hover:border-[var(--primary)] hover:text-[var(--primary)]"
													use:reveal={{ delay: stagger(i, 50) }}
												>{item.name}</span>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</Card>
					</div>
				</div>

				<!-- SELL/PERSONAL ROW 3 -->
				<div class="area-clients"><AboutLogos logos={c.clientLogos} count={c.clientCount} stop={s[5]} label="CLIENTS" /></div>
				<div class="area-interests"><AboutInterests interests={c.interests} stop={s[7]} label="INTERESTS" /></div>
				<div class="area-snapshots" data-testid="about-polaroids-cell"><AboutPolaroids polaroids={c.identity.polaroids} stop={s[8]} label="SNAPSHOTS" /></div>

				<!-- ACTION ROW 4 -->
				<div class="area-weather"><AboutWeather config={c.weather} {weather} stop={s[6]} label="LOCATION" /></div>
				<div class="area-train"><AboutTrain /></div>
				<div class="area-cta"><AboutCta cta={c.cta} stop={s[9]} label="NEXT" /></div>

			</div>
		</div>
</section>

<!-- Bottom Stripe -->
<div class="px-3 pb-1" aria-hidden="true">
	<Separator variant="hazard" />
</div>

<style>
	/* ═══ DASHBOARD: CSS Grid Named Areas ═══ */

	/* Mobile: single column (< 500px) */
	.dashboard {
		display: grid;
		gap: 4px;
		grid-template-columns: 1fr;
		grid-template-areas:
			"identity"
			"metrics"
			"testim"
			"process"
			"stack"
			"clients"
			"interests"
			"snapshots"
			"weather"
			"train"
			"cta";
		grid-auto-rows: auto;
	}

	/* Foldable: 2 col (500px+) */
	@media (min-width: 500px) {
		.dashboard {
			grid-template-columns: repeat(2, 1fr);
			grid-template-areas:
				"identity   identity"
				"metrics    metrics"
				"process    testim"
				"stack      testim"
				"clients    clients"
				"interests  interests"
				"snapshots  weather"
				"train      cta";
		}
	}

	/* Tablet: 4 col (768px+) */
	@media (min-width: 768px) {
		.dashboard {
			grid-template-columns: repeat(4, 1fr);
			grid-template-areas:
				"identity    identity    metrics     metrics"
				"process     stack       testim      testim"
				"clients     interests   interests   snapshots"
				"train       weather     cta         cta";
		}
	}

	/* Desktop: 6 col × 4 row — the target layout (1024px+) */
	@media (min-width: 1024px) {
		.dashboard {
			grid-template-columns: repeat(6, 1fr);
			grid-template-rows: repeat(4, 1fr);
			grid-template-areas:
				"identity  identity  metrics   metrics   testim    testim"
				"process   process   stack     stack     testim    testim"
				"clients   interests interests interests interests snapshots"
				"train     weather   cta       cta       cta       snapshots";
			/* Fill the available viewport height minus nav + header + stripes */
			height: calc(100dvh - 5rem - 48px); /* viewport minus pill nav minus stripes/padding */
		}
	}

	/* Named area assignments — DRY: one rule per card, works at all breakpoints */
	.area-identity     { grid-area: identity; }
	.area-metrics      { grid-area: metrics; }
	.area-process      { grid-area: process; }
	.area-stack        { grid-area: stack; }
	.area-testimonials { grid-area: testim; }
	.area-clients      { grid-area: clients; }
	.area-interests    { grid-area: interests; }
	.area-snapshots    { grid-area: snapshots; min-height: 380px; }
	.area-weather      { grid-area: weather; }
	.area-train        { grid-area: train; }
	.area-cta          { grid-area: cta; }

	/* Desktop: snapshots auto-size from grid row, remove min-height */
	@media (min-width: 1024px) {
		.area-snapshots { min-height: 0; }
	}

	/* All grid cells stretch their children to fill */
	.dashboard > div {
		min-height: 0;
		min-width: 0;
		display: flex;
		align-items: stretch;
	}
	.dashboard > div > :global(*) {
		height: 100%;
		width: 100%;
	}

</style>
