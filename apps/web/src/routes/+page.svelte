<!--
  Home page route — delegates to HomePage component.
  SEO emitted by <SeoHead> in +layout.svelte (Slice 15a).
-->
<script lang="ts">
	import HomePage from '$lib/components/home/HomePage.svelte';
</script>

<div data-testid="app-root">
	<div class="relative z-30">
		<HomePage />
	</div>
</div>
