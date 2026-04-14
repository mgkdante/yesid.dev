<!--
  Blog section layout — shared across /blog, /blog/personal, /blog/[slug].
  CSS Grid: EdgeRail column + vertical hazard stripe + content column.
  EdgeRail is a layout participant — sections cannot overlap it.
-->
<script lang="ts">
	import { EdgeRail } from '$lib/components/shells';
	import { Separator } from '$lib/components/ui/separator';

	let { children } = $props();
</script>

<div class="blog-layout">
	<EdgeRail position="left" label="Blog" variant="title" />
	<div class="blog-hazard-rail">
		<Separator variant="hazard" orientation="vertical" hazardSize="md" />
	</div>
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

	.blog-hazard-rail {
		display: none;
	}

	/* Desktop: grid with EdgeRail + vertical hazard + content */
	@media (min-width: 1024px) {
		.blog-layout {
			display: grid;
			grid-template-columns: auto auto 1fr;
			margin-top: -5rem; /* extend behind nav so rails reach viewport top */
		}

		.blog-content {
			padding-top: 5rem; /* restore content below nav */
		}

		.blog-hazard-rail {
			display: block;
			position: sticky;
			top: 0;
			height: 100dvh;
			align-self: start;
		}
	}
</style>
