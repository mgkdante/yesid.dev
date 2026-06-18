<!--
  Home page route — delegates to HomePage component.
  SEO emitted by <SeoHead> in +layout.svelte (Slice 15a).

  slice-18i Phase 7C: all home-page block content is now loaded server-side
  by +page.server.ts and threaded down through HomePage → section components
  as props. No component imports static content modules directly anymore.
-->
<script lang="ts">
	import HomePage from '$lib/components/home/HomePage.svelte';

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
			cta={data.cta}
			closer={data.closer}
			initialHeroData={data.initialHeroData}
			services={data.services}
			featuredProjects={data.featuredProjects}
			siteMeta={data.siteMeta}
			serviceSvgContents={data.serviceSvgContents}
		/>
	</div>
</div>
