<!--
  Per-viewport service content block for the /services index page.
  Single SVG element repositioned: desktop right, mobile centered above.
  Full available width — no max-width constraints.
-->
<script lang="ts">
	import type { Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';

	let {
		service,
		svgContent,
		index,
		total
	}: {
		service: Service;
		svgContent: string;
		index: number;
		total: number;
	} = $props();

	let svgMorphed = $state(false);
	let stationNum = $derived(String(service.station).padStart(2, '0'));
	let totalStr = $derived(String(total).padStart(2, '0'));
	let title = $derived(resolveLocale(service.title, 'en'));
	let description = $derived(resolveLocale(service.description, 'en'));
	let subtitle = $derived(service.subtitle ? resolveLocale(service.subtitle, 'en') : null);
</script>

<section
	class="service-viewport"
	data-testid="service-card-{service.id}"
	id="service-{service.id}"
>
	<div class="viewport-inner">
		<!-- Text content -->
		<div class="service-text">
			<span class="station-counter">
				Service {stationNum} / {totalStr}
			</span>

			<h2 class="service-title">
				{title}<span class="title-dot">.</span>
			</h2>

			{#if subtitle}
				<p class="service-subtitle">{subtitle}</p>
			{/if}

			<p class="service-description">{description}</p>

			{#if service.stack && service.stack.length > 0}
				<div class="stack-pills">
					{#each service.stack as tech}
						<span class="stack-pill">{tech}</span>
					{/each}
				</div>
			{/if}

			<a href="/services/{service.id}" class="deep-dive-cta">
				Deep dive &rarr;
			</a>
		</div>

		<!-- SVG illustration — rounded box that morphs to circle on hover/tap -->
		{#if svgContent}
			<button
				type="button"
				class="service-svg-box {svgMorphed ? 'morphed' : ''}"
				data-testid="service-card-svg"
				onmouseenter={() => svgMorphed = true}
				onmouseleave={() => svgMorphed = false}
				onclick={() => svgMorphed = !svgMorphed}
				aria-label="Service illustration"
			>
				<div class="svg-inner">
					{@html svgContent}
				</div>
			</button>
		{/if}
	</div>
</section>

<style>
	.service-viewport {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 100vh;
		padding: 0 3rem;
	}

	.viewport-inner {
		display: flex;
		align-items: center;
		gap: 4rem;
		width: 100%;
	}

	.service-text {
		flex: 1;
		min-width: 0;
	}

	.station-counter {
		display: block;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--brand-primary);
		margin-bottom: 1rem;
	}

	.service-title {
		font-family: var(--font-heading);
		font-size: clamp(2rem, 4vw, 3.5rem);
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1.1;
		margin-bottom: 0.5rem;
	}

	.title-dot { color: var(--brand-primary); }

	.service-subtitle {
		font-size: 1.125rem;
		color: var(--text-muted);
		margin-bottom: 1rem;
		font-style: italic;
	}

	.service-description {
		font-size: 1rem;
		line-height: 1.7;
		color: var(--text-secondary);
		max-width: 55ch;
		margin-bottom: 1.5rem;
	}

	.stack-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.stack-pill {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		padding: 0.25rem 0.625rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		color: var(--text-secondary);
		background: transparent;
		cursor: default;
		transition: color var(--duration-normal), border-color var(--duration-normal), background var(--duration-normal), transform var(--duration-normal);
	}
	.stack-pill:hover {
		color: var(--brand-primary);
		border-color: var(--brand-primary);
		background: color-mix(in srgb, var(--brand-primary) 8%, transparent);
		transform: translateY(-1px);
	}

	.deep-dive-cta {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--brand-primary);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: border-color var(--duration-normal);
	}
	.deep-dive-cta:hover {
		border-bottom-color: var(--brand-primary);
	}

	/* SVG container — rounded box that morphs to circle on hover/tap */
	.service-svg-box {
		flex: 0 0 240px;
		width: 240px;
		height: 240px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 1.25rem;
		border: 1px solid var(--border);
		background: var(--bg-card);
		padding: 2rem;
		cursor: pointer;
		transition: transform var(--duration-slower) var(--ease-bounce),
		            border-color var(--duration-slow) var(--ease-default),
		            border-radius var(--duration-slower) var(--ease-bounce),
		            box-shadow 0.4s var(--ease-default);
	}

	/* Hover morph — CSS handles desktop, JS class handles mobile tap */
	.service-svg-box:hover,
	.service-svg-box:global(.morphed) {
		border-color: var(--brand-primary);
		border-radius: 50%;
		transform: scale(1.06) rotate(3deg);
		box-shadow: var(--shadow-glow-lg);
	}

	.svg-inner {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.svg-inner :global(svg) {
		width: 100%;
		height: 100%;
		max-width: 180px;
		max-height: 180px;
	}

	/* Mobile: SVG above text, smaller */
	@media (max-width: 767px) {
		.service-viewport {
			padding: 0 1.25rem;
		}
		.viewport-inner {
			flex-direction: column-reverse;
			gap: 1.5rem;
			text-align: left;
		}
		.service-svg-box {
			flex: none;
			width: 140px;
			height: 140px;
			padding: 1.25rem;
			align-self: flex-start;
		}
		.service-description {
			max-width: none;
		}
	}

	/* Large desktop: more breathing room, bigger SVG */
	@media (min-width: 1024px) {
		.service-viewport {
			padding: 0 5rem;
		}
		.service-svg-box {
			flex: 0 0 320px;
			width: 320px;
			height: 320px;
			padding: 2.5rem;
		}
		.svg-inner :global(svg) {
			max-width: 240px;
			max-height: 240px;
		}
	}

	@media (min-width: 1440px) {
		.service-viewport {
			padding: 0 8rem;
		}
		.service-svg-box {
			flex: 0 0 360px;
			width: 360px;
			height: 360px;
		}
	}
</style>
