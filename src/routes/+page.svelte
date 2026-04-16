<!--
  Home page route — delegates to HomePage component.
-->
<script lang="ts">
	import HomePage from '$lib/components/home/HomePage.svelte';
</script>

<svelte:head>
</svelte:head>

<div data-testid="app-root">
	<div class="relative z-30">
		<HomePage />
	</div>
</div>
