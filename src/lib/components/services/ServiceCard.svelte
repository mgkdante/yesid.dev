<!--
  Per-viewport service content block for the /services index page.
  Single SVG element repositioned: desktop right, mobile centered above.
  Full available width — no max-width constraints.
-->
<script lang="ts">
	import type { Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { SvgIcon, SectionLabel } from '$lib/components/brand';
	import { cn } from '$lib/utils.js';

	export interface ServiceCardProps {
		/** The service data to display */
		service: Service;
		/** Raw SVG content for the service illustration */
		svgContent: string;
		/** Position index (0-based) in the listing */
		index: number;
		/** Total number of services */
		total: number;
		class?: string;
		[key: string]: unknown;
	}

	let {
		service,
		svgContent,
		index,
		total,
		class: className = '',
		...rest
	}: ServiceCardProps = $props();

	let stationNum = $derived(String(service.station).padStart(2, '0'));
	let totalStr = $derived(String(total).padStart(2, '0'));
	let title = $derived(resolveLocale(service.title, 'en'));
	let description = $derived(resolveLocale(service.description, 'en'));
	let subtitle = $derived(service.subtitle ? resolveLocale(service.subtitle, 'en') : null);
</script>

<section
	class={cn("service-viewport", className)}
	data-testid="service-card-{service.id}"
	id="service-{service.id}"
	{...rest}
>
	<div class="viewport-inner">
		<!-- Text content -->
		<div class="service-text">
			<SectionLabel text="Service {stationNum} / {totalStr}" variant="station" class="mb-4 block" />

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

		{#if svgContent}
			<SvgIcon {svgContent} size={240} data-testid="service-card-svg" />
		{/if}
	</div>
</section>

<style>
	.service-viewport {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 100dvh;
		padding: 0 var(--space-page-x);
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


	.service-title {
		font-family: var(--font-heading);
		font-size: clamp(2rem, 4vw, 3.5rem);
		font-weight: 800;
		color: var(--foreground);
		line-height: 1.1;
		margin-bottom: 0.5rem;
	}

	.title-dot { color: var(--primary); }

	.service-subtitle {
		font-size: 1.125rem;
		color: var(--muted-foreground);
		margin-bottom: 1rem;
		font-style: italic;
	}

	.service-description {
		font-size: 1rem;
		line-height: 1.7;
		color: var(--secondary-foreground);
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
		color: var(--secondary-foreground);
		background: transparent;
		cursor: default;
		transition: color var(--duration-normal), border-color var(--duration-normal), background var(--duration-normal), transform var(--duration-normal);
	}
	.stack-pill:hover {
		color: var(--primary);
		border-color: var(--primary);
		background: color-mix(in srgb, var(--primary) 8%, transparent);
		transform: translateY(-1px);
	}

	.deep-dive-cta {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--primary);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: border-color var(--duration-normal);
	}
	.deep-dive-cta:hover {
		border-bottom-color: var(--primary);
	}


	/* Mobile: SVG above text, smaller */
	@media (max-width: 767px) {
		.service-viewport {
			padding: 0 var(--space-page-x);
		}
		.viewport-inner {
			flex-direction: column-reverse;
			gap: 1.5rem;
			text-align: left;
		}
		.viewport-inner :global([data-slot="svg-icon"]) {
			--svg-icon-size: clamp(100px, 30vw, 160px);
			align-self: flex-start;
		}
		.service-description {
			max-width: none;
		}
	}
</style>
