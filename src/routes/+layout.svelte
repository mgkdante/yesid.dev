<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/stores';
	import { prefersReducedMotion } from '$lib/motion/stores';

	let { children } = $props();

	// Home page manages its own layout (fixed 3D bg + full-width sections).
	// All other pages get the centered, padded container.
	let isHome = $derived($page.url.pathname === '/');
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col bg-[var(--bg-primary)] font-body text-[var(--text-primary)]">
	<Nav pathname={$page.url.pathname} />

	<!-- Page content fades in on route change; instant when reduced motion is on -->
	{#key $page.url.pathname}
		<main class="{isHome ? 'flex-1' : 'mx-auto w-full max-w-5xl flex-1 px-6 pt-20'} {!isHome && !$prefersReducedMotion ? 'animate-page-fade-in' : ''}">
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
