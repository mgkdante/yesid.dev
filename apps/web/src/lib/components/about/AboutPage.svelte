<!--
  Full-viewport bento dashboard for /about.
  6×4 CSS Grid with named areas. SELL-first → Personal → Action.
  Wrapped in a plain section (w-full) — no shell needed for a bleed layout.
  Cards stretch to fill — no voids, no fixed heights.
  All content from aboutPageContent via data layer.
-->
<script lang="ts">
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import type { AboutContent } from '$lib/types';
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
	import AboutLanguages from './AboutLanguages.svelte';
	import AboutInterests from './AboutInterests.svelte';
	import AboutCta from './AboutCta.svelte';
	import AboutTrain from './AboutTrain.svelte';

	// slice-18i Phase 7C: aboutPageContent now flows as a prop from the server load.
	let {
		aboutPage,
		weather,
	}: {
		aboutPage: AboutContent;
		weather?: { temp: number; condition: string; icon: string } | null;
	} = $props();

	const c = aboutPage;

	// Programmatic stop numbers from card render order. Train is stopless.
	const s = Array.from({ length: 10 }, (_, i) => String(i).padStart(2, '0'));

	// EDUCATION stop (repurposed from the former tech-stack stop): icon → brand SVG mark.
	const EDU_MARKS: Record<'champlain' | 'bishops', string> = {
		champlain: '/images/about/edu-champlain.svg',
		bishops: '/images/about/edu-bishops.svg',
	};
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
				<div class="area-identity"><AboutIdentity identity={c.identity} stop={s[0]} label={resolveLocale(c.stopLabels.identity, locale)} /></div>
				<div class="area-metrics"><AboutMetrics metrics={c.metrics} stop={s[1]} label={resolveLocale(c.stopLabels.metrics, locale)} /></div>
				<div class="area-testimonials"><AboutTestimonials testimonials={c.testimonials} stop={s[4]} label={resolveLocale(c.stopLabels.testimonials, locale)} /></div>

				<!-- SELL ROW 2 -->
				<div class="area-process"><AboutMethod steps={c.methodology} stop={s[2]} label={resolveLocale(c.stopLabels.process, locale)} /></div>
				<div class="area-stack">
					<div class="group h-full" use:cursorGlow>
					<Card class="relative h-full p-3" data-testid="about-education">
						<div class="relative flex h-full flex-col">
							<StopLabel stop={s[3]} label={resolveLocale(c.stopLabels.stack, locale)} />
							<ul class="mt-2 flex flex-1 flex-col justify-center gap-3">
								{#each c.education as edu}
									<li class="flex items-center gap-3">
										<img
											src={EDU_MARKS[edu.icon]}
											alt={resolveLocale(edu.school, locale)}
											class="h-9 w-9 shrink-0 object-contain"
											loading="lazy"
											width="36"
											height="36"
										/>
										<div class="min-w-0">
											<div class="truncate text-small font-semibold text-[var(--foreground)]">{resolveLocale(edu.school, locale)}</div>
											<div class="text-caption leading-tight text-[var(--secondary-foreground)]">{resolveLocale(edu.program, locale)}</div>
										</div>
									</li>
								{/each}
							</ul>
						</div>
					</Card>
					</div>
				</div>

				<!-- SELL/PERSONAL ROW 3 -->
				<div class="area-clients"><AboutLanguages languages={c.languages} stop={s[5]} label={resolveLocale(c.stopLabels.clients, locale)} /></div>
				<div class="area-interests"><AboutInterests interests={c.interests} stop={s[7]} label={resolveLocale(c.stopLabels.interests, locale)} /></div>
				<div class="area-snapshots" data-testid="about-polaroids-cell"><AboutPolaroids polaroids={c.identity.polaroids} stop={s[8]} label={resolveLocale(c.stopLabels.snapshots, locale)} /></div>

				<!-- ACTION ROW 4 -->
				<div class="area-weather"><AboutWeather config={c.weather} {weather} stop={s[6]} label={resolveLocale(c.stopLabels.location, locale)} /></div>
				<div class="area-train"><AboutTrain /></div>
				<div class="area-cta"><AboutCta cta={c.cta} stop={s[9]} label={resolveLocale(c.stopLabels.next, locale)} /></div>

			</div>
		</div>
</section>

<!-- GO2-W5 final batch (6b): no page-level bottom stripe. The footer's
     platform-edge hazard tape owns the footer seam — a second tape here
     stacked two stripes at the page bottom (operator QA). -->

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
