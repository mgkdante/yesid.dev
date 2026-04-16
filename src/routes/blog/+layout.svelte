<script lang="ts">
	let { children } = $props();
</script>

<div class="listing-layout">
	<div class="edge-title-column">
		<div class="edge-title">Blog<span class="edge-dot">.</span></div>
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

	@media (min-width: 1024px) {
		.listing-layout {
			display: grid;
			grid-template-columns: auto 1px 1fr;
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
			padding-inline: 0.5rem;
		}
		.edge-title {
			font-family: var(--font-heading);
			font-size: clamp(8rem, 15vw, 15rem);
			font-weight: 900;
			color: var(--foreground);
			white-space: nowrap;
			line-height: 1;
			letter-spacing: -0.04em;
		}
		.edge-title-column {
			overflow: hidden;
		}
		.edge-dot {
			color: var(--primary);
		}
		.accent-rail {
			display: block;
			background: color-mix(in srgb, var(--primary) 20%, transparent);
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
</style>
