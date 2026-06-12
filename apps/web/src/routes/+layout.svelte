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

	// Slice 15a: SEO is layout-authoritative. <SeoHead> renders all <head> tags
	// server-side from $page.data.seo, which is populated by +layout.ts load.
	// Slice 15b: JSON-LD is emitted by <JsonLd> mounted inside <SeoHead> —
	// no direct import here. The Slice 12 `buildPersonSchema` block it replaced
	// is gone; the Slice 17b "documented exception" reading siteMeta directly
	// is likewise resolved.
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { DEFAULT_LOCALE } from '$lib/utils/locale';
	import { provideLocale } from '$lib/utils/locale-context';
	import { delocalizePath } from '$lib/utils/locale-routing';
	import { initLenis, destroyLenis } from '$lib/motion/utils/lenis.js';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { initScrollTriggerConfig } from '$lib/motion/utils/gsap.js';
	import { initGlobalRipple } from '$lib/motion/utils/globalRipple.js';
	import { setMorphShapes } from '$lib/utils/shapes';
	import type { LayoutData } from './$types';
	import type { NavLink } from '$lib/content/nav';
	import type { MorphShape } from '$lib/types';

	let { data, children }: { data: LayoutData & {
		headerLinks?: readonly NavLink[];
		footerLinks?: readonly NavLink[];
		mobileLinks?: readonly NavLink[];
		menuItems?: readonly NavLink[];
		morphShapes?: readonly MorphShape[];
	}; children: import('svelte').Snippet } = $props();

	// Nav slots — threaded from +layout.server.ts via the adapter.nav port.
	// Passed as props so Nav/Footer don't import from $lib/content directly.
	const headerLinks = $derived(data.headerLinks ?? []);
	const footerLinks = $derived(data.footerLinks ?? []);
	const menuItems = $derived(data.menuItems ?? []);

	// slice-28.6: request locale. Persistent chrome (Nav/MenuOverlay/Footer/
	// SeoHead) receives it as a prop ($derived — it never remounts); everything
	// under {#key $page.url.pathname} reads it via getLocale() context
	// (page components remount per pathname, so an init-time read is correct).
	const locale = $derived(data.locale ?? DEFAULT_LOCALE);
	provideLocale(() => data.locale ?? DEFAULT_LOCALE);

	$effect(() => {
		if (data.morphShapes) {
			setMorphShapes(data.morphShapes);
		}
	});

	onMount(() => {
		if (!browser) return;

		// Register ScrollTrigger + apply site-wide config early so
		// ScrollTrigger.isTouch and pin behavior are available for all
		// consumers. Plugin-specific loading (DrawSVG, MorphSVG, Flip,
		// MotionPath) happens lazily per-consumer at mount.
		initScrollTriggerConfig();
		initLenis();

		// Slice-23: site-wide click ripple. Anywhere the user clicks/taps
		// spawns the Manifesto-style two-ring expanding ripple.
		const cleanupRipple = initGlobalRipple();

		// GO-W2.2: re-sync theme store with the pre-paint attribute + watch
		// system preference for users with no stored choice.
		const cleanupTheme = themeStore.init();

		return () => {
			destroyLenis();
			cleanupRipple();
			cleanupTheme();
		};
	});

	// Full-bleed pages skip pt-20 (hero is full-viewport).
	// Home page + project detail pages have manifesto-style headers.
	// Compares the canonical (delocalized) pathname so /fr/projects/x gets the
	// same treatment as /projects/x (slice-28.6).
	const basePath = $derived(delocalizePath($page.url.pathname));
	let isFullBleed = $derived(
		basePath === '/' ||
		(basePath.startsWith('/projects/') && basePath !== '/projects') ||
		(basePath.startsWith('/blog/') && basePath !== '/blog' && basePath !== '/blog/personal')
	);
</script>

<SeoHead seo={data.seo} {locale} themeColor={data.themeColor} />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="circuit-grid flex min-h-screen flex-col overflow-x-clip bg-[var(--background)] font-body text-[var(--foreground)]">
	<Nav pathname={$page.url.pathname} {locale} {headerLinks} {menuItems} />

	<!-- Page content fades in on route change; instant when reduced motion is on -->
	{#key $page.url.pathname}
		<main class="flex-1 {isFullBleed ? '' : 'pt-20'} {!isFullBleed && !$prefersReducedMotion ? 'animate-page-fade-in' : ''}">
			{@render children()}
		</main>
	{/key}

	<!-- Footer wrapper: z-[45] so it paints over the fixed rail (z-40) -->
	<div class="relative z-[45]">
		<Footer {locale} {footerLinks} />
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

	/* Slice-23: site-wide click ripple — appended to <body> by
	   motion/utils/globalRipple.ts on every pointerdown. Two expanding
	   rings (outer brand-primary, inner accent) for Manifesto-style
	   click feedback that works on desktop + mobile. position: fixed
	   so ripples stay where pressed regardless of scroll. :global()
	   because the elements live on <body>, outside any component scope. */
	:global(.global-ripple) {
		position: fixed;
		border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		z-index: 9999;
		animation: global-ripple-expand 1.2s ease-out forwards;
	}

	:global(.global-ripple-inner) {
		position: fixed;
		border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		z-index: 9999;
		animation: global-ripple-inner-expand 0.8s ease-out forwards;
	}

	@keyframes global-ripple-expand {
		0%   { width: 0;     height: 0;     opacity: 0.6; }
		100% { width: 200px; height: 200px; opacity: 0;   }
	}

	@keyframes global-ripple-inner-expand {
		0%   { width: 0;     height: 0;     opacity: 0.8; }
		100% { width: 100px; height: 100px; opacity: 0;   }
	}
</style>
