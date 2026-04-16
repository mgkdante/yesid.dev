<!-- /about route: full-viewport bento dashboard -->
<script lang="ts">
	import AboutPage from '$lib/components/about/AboutPage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>About — yesid.</title>
	<meta name="description" content="Freelance digital infrastructure engineer based in Montreal. PostgreSQL, SQL Server, Python, Power BI — building reliable infrastructure for teams that ship." />
</svelte:head>

<AboutPage weather={data.weather} />
