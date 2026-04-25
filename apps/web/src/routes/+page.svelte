<!--
  Home page route — delegates to HomePage component.
  SEO emitted by <SeoHead> in +layout.svelte (Slice 15a).

  Slice 18d Phase 8: `data.metroSvg` (loaded by +page.server.ts from Directus)
  is threaded down through HomePage → HeroBanner → MetroNetwork as a prop.
-->
<script lang="ts">
	import HomePage from '$lib/components/home/HomePage.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div data-testid="app-root">
	<div class="relative z-30">
		<HomePage metroSvg={data.metroSvg} />
	</div>
</div>
