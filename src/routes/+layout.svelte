<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/stores';
	import { prefersReducedMotion } from '$lib/motion/stores';
	import { siteMeta, buildPersonSchema } from '$lib/data';

	const personSchema = buildPersonSchema(siteMeta);

	let { children } = $props();

	// Home and services pages manage their own layout (full-width, no max-width).
	// All other pages get the centered, padded container.
	let isHome = $derived($page.url.pathname === '/');
	let isFullWidth = $derived(isHome || $page.url.pathname.startsWith('/services') || $page.url.pathname.startsWith('/about') || $page.url.pathname.startsWith('/contact') || $page.url.pathname.startsWith('/tech-stack') || $page.error !== null);
	// Hide footer on the services listing page — it has its own scroll container.
	// Footer shows on detail pages and all other pages.
	let hideFooter = $derived($page.url.pathname === '/services');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html `<script type="application/ld+json">${personSchema}</script>`}
</svelte:head>

<div class="flex min-h-screen flex-col bg-[var(--bg-primary)] font-body text-[var(--text-primary)]">
	<Nav pathname={$page.url.pathname} />

	<!-- Page content fades in on route change; instant when reduced motion is on -->
	{#key $page.url.pathname}
		<main class="{isFullWidth ? 'flex-1 pt-20' : 'mx-auto w-full max-w-5xl flex-1 px-6 pt-20'} {!isHome && !$prefersReducedMotion ? 'animate-page-fade-in' : ''}">
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
