<script lang="ts">
	import '@yesid/tokens/fonts.css';
	import '#lib/styles/site.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';
	import Wrench from '@lucide/svelte/icons/wrench';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import Newspaper from '@lucide/svelte/icons/newspaper';
	import UserRound from '@lucide/svelte/icons/user-round';
	import Mail from '@lucide/svelte/icons/mail';
	import { browser } from '$app/env';
	import { afterNavigate, beforeNavigate, onNavigate } from '$app/navigation';
	import { viewTransition } from '@yesid/motion/utils/viewTransition';
	import '@yesid/motion/ripple.css';
	import { SiteFooter, SiteHeader, SiteRoot } from '@yesid/ui/layout';
	import { Wordmark } from '@yesid/ui/brand';

	// SEO is layout-authoritative: @yesid/ui/head renders tags server-side.
	// seoHeadProps resolves the page SEO and JSON-LD for the current locale.
	import { SeoHead } from '@yesid/ui/head';
	import { startAnalytics, trackAnalyticsEvent } from '#lib/analytics/client.ts';
	import { navigationEvents, profileClickNetwork } from '#lib/analytics/site-events.ts';
	import { siteMeta, menuItems as staticMenuItems, siteLabels } from '#lib/content/index.ts';
	import { errorPagesById } from '#lib/content/error-pages.ts';
	import { appendBrandPerLocale } from '#lib/adapters/compose-page-seo.ts';
	import { errorTitleBody } from '#lib/adapters/error-seo-fallback.ts';
	import { DEFAULT_LOCALE, resolveLocale } from '#lib/utils/locale.ts';
	import { provideLocale } from '#lib/utils/locale-context.ts';
	import { delocalizePath, localizeHref } from '#lib/utils/locale-routing.ts';
	import { PUBLISHED_LOCALES, languageHref, seoHeadProps } from '#lib/utils/seo-defaults.ts';
	import { attachLocaleHandoff } from '#lib/state/locale-handoff.svelte.ts';
	import { initScrollTriggerConfig } from '@yesid/motion/utils/gsap';
	import { initGlobalRipple } from '@yesid/motion/utils/globalRipple';
	import { setMorphShapes } from '#lib/utils/shapes.ts';
	import type { LayoutData } from './$types';
	import type { NavLink } from '#lib/navigation/types.ts';
	import type { Locale, MorphShape } from '#lib/types.ts';

	let { data, children }: { data: LayoutData & {
		headerLinks?: readonly NavLink[];
		footerLinks?: readonly NavLink[];
		menuItems?: readonly NavLink[];
		morphShapes?: readonly MorphShape[];
	}; children: import('svelte').Snippet } = $props();

	// Header slots — threaded from +layout.server.ts via the adapter.nav port.
	// Passed as props so SiteHeader/Footer don't import from $lib/content directly.
	const headerLinks = $derived(data.headerLinks ?? []);
	const footerLinks = $derived(data.footerLinks ?? []);
	const menuItems = $derived(data.menuItems ?? []);

	// Error renders use the browser tab title of their own status row.
	const seo = $derived(page.error
		? { ...data.seo, title: appendBrandPerLocale(errorTitleBody(errorPagesById, page.status), siteMeta.name) }
		: data.seo);

	// Persistent chrome receives reactive locale props; keyed page subtrees read locale context at initialization.
	const locale = $derived(data.locale ?? DEFAULT_LOCALE);
	provideLocale(() => data.locale ?? DEFAULT_LOCALE);

	// Register navigation hooks during layout initialization; the persistent layout owns locale handoff.
	attachLocaleHandoff(() => data.seo.localeHandoffId);
	let pendingTransitions = 0;
	onNavigate((navigation) => {
		const transition = viewTransition(navigation);
		if (!transition) return;
		pendingTransitions += 1;
		void navigation.complete.then(
			() => { pendingTransitions -= 1; },
			() => { pendingTransitions -= 1; },
		);
		return transition;
	});

	$effect(() => {
		if (data.morphShapes) {
			setMorphShapes(data.morphShapes);
		}
	});

	// Register ScrollTrigger + apply site-wide config early so
	// ScrollTrigger.isTouch and pin behavior are available for all
	// consumers. Runs before SiteRoot mounts: initLenis reads isTouch to skip
	// touch devices. Plugin-specific loading (DrawSVG, MorphSVG) happens
	// lazily per-consumer at mount.
	if (browser) initScrollTriggerConfig();

	onMount(() => {
		if (!browser) return;
		startAnalytics();

		return initGlobalRipple();
	});

	// Registered after the mount above, so the tracker exists when the first navigation reports.
	afterNavigate((navigation) => {
		for (const event of navigationEvents(navigation, page.status)) trackAnalyticsEvent(event);
	});

	const basePath = $derived(delocalizePath(page.url.pathname));
	const navChrome = siteLabels.navChrome.shared;
	const MENU_ICONS: Record<string, Component<{ class?: string }>> = {
		'/services': Wrench,
		'/projects': FolderOpen,
		'/blog': Newspaper,
		'/about': UserRound,
		'/contact': Mail,
	};
	const isCurrent = (href: string) => (href === '/' ? basePath === '/' : basePath.startsWith(href));
	const nextLocale = $derived(
		PUBLISHED_LOCALES[(Math.max(0, PUBLISHED_LOCALES.indexOf(locale)) + 1) % PUBLISHED_LOCALES.length],
	);

	const footer = siteLabels.footerChrome.footer;
	const footerNav = $derived(
		(footerLinks.length > 0 ? footerLinks : staticMenuItems).map((item) => ({
			label: resolveLocale(item.label, locale),
			href: localizeHref(item.href, locale),
			legal: item.href.startsWith('/legal/'),
		})),
	);
	const socialLinks = (['GitHub', 'LinkedIn', 'Upwork'] as const).flatMap((label) => {
		const href = siteMeta.links[label.toLowerCase() as 'github' | 'linkedin' | 'upwork'];
		return href ? [{ href, label, ariaLabel: label, external: true, me: true }] : [];
	});

	let isFullBleed = $derived(basePath === '/' || basePath.startsWith('/projects/') && basePath !== '/projects' || basePath.startsWith('/blog/') && basePath !== '/blog' && basePath !== '/blog/personal');
</script>

<!-- SvelteKit skips beforeNavigate during an active navigation, so use native history events. -->
<svelte:window
	onpopstate={() => { if (pendingTransitions > 0) location.reload(); }}
	onclick={(event) => {
		const network = profileClickNetwork(event);
		if (network) trackAnalyticsEvent('profile_click', { network });
	}}
/>

{#snippet footerBrand()}
	<Wordmark href={localizeHref('/', locale)} data-testid="footer-wordmark" class="items-baseline text-2xl" />
{/snippet}

{#snippet footerAddress()}
	<address class="not-italic">{resolveLocale(footer.location, locale)}</address>
{/snippet}

<SiteRoot lang={locale}>
	<SeoHead {...seoHeadProps(seo, locale, data.themeColor)} />
	<div class="site-grid circuit-grid" data-testid="site-grid" aria-hidden="true"></div>

	<div
		style:overflow-anchor={basePath === '/' ? 'none' : undefined}
		class="site-shell flex min-h-screen flex-col overflow-x-clip font-body text-[var(--foreground)]"
	>
		<SiteHeader
			navigation={{ beforeNavigate, onNavigate, afterNavigate }}
			home={localizeHref('/', locale)}
			links={headerLinks.map((link) => ({
				href: localizeHref(link.href, locale),
				label: resolveLocale(link.label, locale),
				current: isCurrent(link.href),
				priority: link.priority,
			}))}
			menuItems={menuItems.map((item) => ({
				href: localizeHref(item.href, locale),
				label: resolveLocale(item.label, locale),
				subtitle: item.subtitle ? resolveLocale(item.subtitle, locale) : undefined,
				current: isCurrent(item.href),
				icon: MENU_ICONS[item.href],
			}))}
			labels={{
				openMenu: resolveLocale(navChrome.openMenuAria, locale),
				closeMenu: resolveLocale(navChrome.closeMenuAria, locale),
				menu: resolveLocale(navChrome.menuOverlayAria, locale),
				menuFooter: resolveLocale(navChrome.menuOverlayFooterLabel, locale),
				skipToContent: navChrome.skipToContentLabel ? resolveLocale(navChrome.skipToContentLabel, locale) : undefined,
				theme: resolveLocale(navChrome.themeToggleAria, locale),
			}}
			language={{
				locale,
				locales: PUBLISHED_LOCALES,
				href: (next) => languageHref(new URL(page.url.href), next as Locale, data.seo.localeAlternates),
				label: resolveLocale(navChrome.localeSwitcherAria, locale),
				preserveState: !data.seo.localeAlternates || Boolean(data.seo.localeAlternates[nextLocale]),
			}}
		/>

		{#key page.url.pathname}
			<main
				id="main"
				class="flex-1 {isFullBleed ? '' : 'pt-nav-clear'}"
			>{@render children()}</main>
		{/key}

		<!-- Footer wrapper: z-footer paints over the fixed rail (z-rail) -->
		<div class="relative z-footer">

			<SiteFooter
				brand={footerBrand}
				tagline={resolveLocale(footer.tagline, locale)}
				groups={[
					{
						label: resolveLocale(footer.exploreLabel, locale),
						navLabel: resolveLocale(siteLabels.navChrome.shared.footerNavAria, locale),
						links: footerNav.filter((link) => !link.legal),
					},
					{
						label: resolveLocale(footer.legalLabel, locale),
						testId: 'footer-legal',
						links: footerNav.filter((link) => link.legal),
					},
					{ label: resolveLocale(footer.connectLabel, locale), links: socialLinks },
				]}
				statusStart={footerAddress}
				statusPrefix={resolveLocale(footer.statusPrefix, locale)}
				liveLabel={resolveLocale(footer.liveLabel, locale)}
			/>
		</div>
	</div>
</SiteRoot>

<style>
	/* The page grid stays put while content scrolls over it; section grids scroll with their
	   sections. Sized to the large viewport so phones don't jump when the URL bar moves. */
	.site-grid { position: fixed; inset: 0 0 auto; height: 100lvh; z-index: -1; pointer-events: none; }
	.site-shell {
		--strip-h: 68px; /* Calibration switch: use 70px for the T=70 candidate. */
	}
	:global(.pt-nav-clear) {
		padding-top: var(--nav-clearance, 5.5rem);
	}

</style>
