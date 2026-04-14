<!--
  Blog section layout — shared across /blog, /blog/personal, /blog/[slug].
  CSS Grid: EdgeRail column + thin accent line + content column.
  EdgeRail is a layout participant — sections cannot overlap it.
-->
<script lang="ts">
	import { EdgeRail } from '$lib/components/shells';

	let { children } = $props();
</script>

<div class="blog-layout">
	<EdgeRail position="left" label="Blog" variant="title">
		<!-- Metro station dots — above and below "Blog." label -->
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
	<div class="blog-accent-rail"></div>
	<div class="blog-content">
		{@render children()}
	</div>
</div>

<style>
	/* Mobile: single column, no rail */
	.blog-layout {
		display: block;
		width: 100%;
	}

	.blog-content {
		min-width: 0;
	}

	.blog-accent-rail {
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

	.metro-dots-top {
		top: 16px;
	}

	.metro-dots-bottom {
		bottom: 16px;
	}

	.metro-line {
		width: 1px;
		height: 32px;
		background: color-mix(in srgb, var(--primary) 12%, transparent);
	}

	.metro-dot {
		border-radius: 50%;
	}

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
		.blog-layout {
			display: grid;
			grid-template-columns: auto 1px 1fr;
			margin-top: -5rem; /* extend behind nav so rails reach viewport top */
		}

		.blog-content {
			padding-top: 5rem; /* restore content below nav */
		}

		.blog-accent-rail {
			display: block;
			background: color-mix(in srgb, var(--primary) 20%, transparent);
		}
	}
</style>
