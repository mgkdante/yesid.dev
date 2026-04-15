<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/layout/Nav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { prefersReducedMotion } from '$lib/motion/stores';
	import { siteMeta, buildPersonSchema } from '$lib/data';
	import { initLenis, destroyLenis } from '$lib/motion/utils/lenis.js';
	import { registerGsapPlugins } from '$lib/motion/utils/gsap.js';

	const personSchema = buildPersonSchema(siteMeta);

	let { children } = $props();

	onMount(() => {
		if (browser) {
			// Register GSAP plugins early so ScrollTrigger.isTouch is available
			registerGsapPlugins();
			initLenis(); // Desktop: Lenis smooth scroll / Mobile: normalizeScroll
		}
		return () => {
			destroyLenis();
		};
	});

	// Full-bleed pages skip pt-20 (hero is full-viewport).
	// Home page + project detail pages have manifesto-style headers.
	let isFullBleed = $derived(
		$page.url.pathname === '/' ||
		($page.url.pathname.startsWith('/projects/') && $page.url.pathname !== '/projects')
	);
	// Hide footer on the services listing page — it has its own scroll container.
	// Footer shows on detail pages and all other pages.
	let hideFooter = $derived($page.url.pathname === '/services');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html `<script type="application/ld+json">${personSchema}</script>`}
</svelte:head>

<div class="circuit-grid flex min-h-screen flex-col bg-[var(--background)] font-body text-[var(--foreground)]">
	<Nav pathname={$page.url.pathname} />

	<!-- Page content fades in on route change; instant when reduced motion is on -->
	{#key $page.url.pathname}
		<main class="flex-1 {isFullBleed ? '' : 'pt-20'} {!isFullBleed && !$prefersReducedMotion ? 'animate-page-fade-in' : ''}">
			{@render children()}
		</main>
	{/key}

	<!-- Footer wrapper: z-[45] so it paints over the fixed rail (z-40) -->
	{#if !hideFooter}
		<div class="relative z-[45]">
			<Footer />
		</div>
	{/if}
</div>

<style>
	@keyframes page-fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	:global(.animate-page-fade-in) {
		animation: page-fade-in 250ms ease-out;
	}
</style>
