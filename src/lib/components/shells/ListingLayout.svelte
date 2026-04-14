<!--
  ListingLayout — Shared layout for listing pages (Blog, Projects).
  CSS Grid: EdgeRail column + thin accent line + content column.
  Metro station dots above/below the EdgeRail label.
  Only the `label` prop differs between consumers.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { EdgeRail } from '$lib/components/shells';

	export interface ListingLayoutProps {
		/** EdgeRail label — "Blog", "Projects", etc. */
		label: string;
		children: Snippet;
	}

	let { label, children }: ListingLayoutProps = $props();
</script>

<div class="listing-layout">
	<EdgeRail position="left" {label} variant="title">
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
	</EdgeRail>
	<div class="listing-accent-rail"></div>
	<div class="listing-content">
		{@render children()}
	</div>
</div>

<style>
	.listing-layout {
		display: block;
		width: 100%;
	}

	.listing-content {
		min-width: 0;
	}

	.listing-accent-rail {
		display: none;
	}

	/* --- Metro station dots in EdgeRail --- */
	.metro-dots {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.metro-dots-top { top: 16px; }
	.metro-dots-bottom { bottom: 16px; }

	.metro-line {
		width: 1px;
		height: 32px;
		background: color-mix(in srgb, var(--primary) 12%, transparent);
	}

	.metro-dot { border-radius: 50%; }

	.metro-dot-sm {
		width: 5px;
		height: 5px;
		border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
	}

	.metro-dot-lg {
		width: 8px;
		height: 8px;
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		border: 1.5px solid color-mix(in srgb, var(--primary) 30%, transparent);
	}

	/* Desktop: grid with EdgeRail + accent line + content */
	@media (min-width: 1024px) {
		.listing-layout {
			display: grid;
			grid-template-columns: auto 1px 1fr;
			margin-top: -5rem;
		}

		.listing-content {
			padding-top: 5rem;
		}

		.listing-accent-rail {
			display: block;
			background: color-mix(in srgb, var(--primary) 20%, transparent);
		}
	}
</style>
