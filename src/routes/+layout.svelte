<script lang="ts">
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/layout/Nav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { prefersReducedMotion } from '$lib/motion/stores';
	import { buildPersonSchema } from '$lib/utils';

	import { siteMeta } from '$lib/content';
	import { initLenis, destroyLenis } from '$lib/motion/utils/lenis.js';
	import { initScrollTriggerConfig } from '$lib/motion/utils/gsap.js';

	const personSchema = buildPersonSchema(siteMeta);

	let { children } = $props();

	onMount(() => {
		if (browser) {
			// Register ScrollTrigger + apply site-wide config early so
			// ScrollTrigger.isTouch and pin behavior are available for all
			// consumers. Plugin-specific loading (DrawSVG, MorphSVG, Flip,
			// MotionPath) happens lazily per-consumer at mount.
			initScrollTriggerConfig();
			initLenis();
		}
		return () => {
			destroyLenis();
		};
	});

	// Full-bleed pages skip pt-20 (hero is full-viewport).
	// Home page + project detail pages have manifesto-style headers.
	let isFullBleed = $derived(
		$page.url.pathname === '/' ||
		($page.url.pathname.startsWith('/projects/') && $page.url.pathname !== '/projects') ||
		($page.url.pathname.startsWith('/blog/') && $page.url.pathname !== '/blog' && $page.url.pathname !== '/blog/personal')
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html `<script type="application/ld+json">${personSchema}</script>`}
</svelte:head>

<div class="circuit-grid flex min-h-screen flex-col overflow-x-clip bg-[var(--background)] font-body text-[var(--foreground)]">
	<Nav pathname={$page.url.pathname} />

	<!-- Page content fades in on route change; instant when reduced motion is on -->
	{#key $page.url.pathname}
		<main class="flex-1 {isFullBleed ? '' : 'pt-20'} {!isFullBleed && !$prefersReducedMotion ? 'animate-page-fade-in' : ''}">
			{@render children()}
		</main>
	{/key}

	<!-- Footer wrapper: z-[45] so it paints over the fixed rail (z-40) -->
	<div class="relative z-[45]">
		<Footer />
	</div>
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
