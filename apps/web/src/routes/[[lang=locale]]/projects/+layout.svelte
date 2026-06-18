<script lang="ts">
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { siteLabels } from '$lib/content';

	let { children } = $props();

	// Remounts per pathname under the root layout's {#key} — init-read is correct.
	const locale = getLocale();

	// go2-t1c2: edge title from site_labels, previous literal as fallback.
	const edgeTitle = resolveLocale(siteLabels.pages.projectsEdgeTitle, locale);
</script>

<div class="listing-layout">
	<div class="edge-title-column">
		<div class="edge-title">{edgeTitle}<span class="edge-dot">.</span></div>
		<div class="metro-dots metro-dots-top">
			<div class="metro-line"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-dot metro-dot-lg"></div>
		</div>
		<div class="metro-dots metro-dots-bottom">
			<div class="metro-dot metro-dot-lg"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-dot metro-dot-sm"></div>
			<div class="metro-line"></div>
		</div>
	</div>
	<div class="accent-rail"></div>
	<div class="listing-content">
		{@render children()}
	</div>
</div>

<style>
	/* Recipe 4: Edge Title Grid */
	.listing-layout {
		display: block;
		width: 100%;
	}
	.edge-title-column { display: none; }
	.accent-rail { display: none; }
	.listing-content { min-width: 0; }

	/* Round 5: rails one step bolder (operator) — the edge-title rule draws
	   at 2px / 35% primary (was 1px / 20%), the station dots and their lead
	   lines step up with it. Both modes (primary is theme-mapped). */
	@media (min-width: 1024px) {
		.listing-layout {
			display: grid;
			grid-template-columns: auto 2px 1fr;
			margin-top: -5rem;
		}
		.listing-content {
			padding-top: 5rem;
		}
		.edge-title-column {
			display: flex;
			align-items: center;
			justify-content: center;
			position: sticky;
			top: 0;
			height: 100dvh;
			writing-mode: vertical-rl;
			transform: rotate(180deg);
			padding: 1rem 1.5rem;
		}
		.edge-title {
			font-family: var(--font-heading);
			font-size: clamp(6rem, 12vw, 13rem);
			font-weight: 900;
			color: var(--foreground);
			white-space: nowrap;
			line-height: 1;
			letter-spacing: -0.04em;
		}
		.edge-dot {
			color: var(--primary);
		}
		.accent-rail {
			display: block;
			background: color-mix(in srgb, var(--primary) 35%, transparent);
		}
	}

	/* Metro station dots */
	.metro-dots {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		writing-mode: horizontal-tb;
	}
	.metro-dots-top { top: 16px; }
	.metro-dots-bottom { bottom: 16px; }
	.metro-line {
		width: 2px;
		height: 32px;
		background: color-mix(in srgb, var(--primary) 25%, transparent);
	}
	.metro-dot { border-radius: 50%; }
	.metro-dot-sm {
		width: 6px;
		height: 6px;
		border: 1.5px solid color-mix(in srgb, var(--primary) 35%, transparent);
	}
	.metro-dot-lg {
		width: 10px;
		height: 10px;
		background: color-mix(in srgb, var(--primary) 25%, transparent);
		border: 2px solid color-mix(in srgb, var(--primary) 45%, transparent);
	}
</style>
