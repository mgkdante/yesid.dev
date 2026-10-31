<script lang="ts">
	import HomePage from '#lib/components/home/HomePage.svelte';

	let { data } = $props();
</script>

<div data-testid="app-root">
	<div class="relative z-30">
		<HomePage
			metroSvg={data.metroSvg}
			hero={data.hero}
			heroAnim={data.heroAnim}
			manifesto={data.manifesto}
			proofReel={data.proofReel}
			servicesGrid={data.servicesGrid}
			about={data.about}
			closer={data.closer}
			initialHeroData={data.initialHeroData}
			services={data.services}
			featuredProjects={data.featuredProjects}
			siteMeta={data.siteMeta}
			bookingHref={data.bookingHref}
			serviceSvgContents={data.serviceSvgContents}
		/>
	</div>
</div>
