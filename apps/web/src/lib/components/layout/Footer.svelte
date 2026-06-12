<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { siteMeta, menuItems as staticMenuItems, sharedChromeContent, footerContent, siteLabels } from '$lib/content';
	import { resolveLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
	import { delocalizePath, localizeHref } from '$lib/utils/locale-routing';
	import { PUBLISHED_LOCALES } from '$lib/utils/seo-defaults';
	import { fillTemplate } from '$lib/utils/labels';
	import { wordmarkHover } from '$lib/motion/actions';
	import { StatusDot } from '$lib/components/brand';
	import type { NavLink } from '$lib/content/nav';
	import type { Locale } from '$lib/types';

	// footerLinks: adapter-sourced footer placement links (from +layout.server.ts).
	// Falls back to the menu items (which serve as footer fallback in static mode).
	let {
		locale = DEFAULT_LOCALE,
		pathname = '/',
		footerLinks = staticMenuItems as readonly NavLink[],
		availableLocales = PUBLISHED_LOCALES as readonly Locale[],
	}: {
		locale?: Locale;
		/** Current pathname — the locale switch preserves it across locales. */
		pathname?: string;
		footerLinks?: readonly NavLink[];
		/** Locale switcher entries; hidden until more than one is published. */
		availableLocales?: readonly Locale[];
	} = $props();

	// $derived (not const): Footer never remounts; locale changes on /fr↔/ navigation.
	const tagline = $derived(resolveLocale(footerContent.tagline, locale));
	const location = $derived(resolveLocale(footerContent.location, locale));
	const statusPrefix = $derived(resolveLocale(footerContent.statusPrefix, locale));
	const footerNavAria = $derived(resolveLocale(sharedChromeContent.footerNavAria, locale));
	const switcherAria = $derived(resolveLocale(sharedChromeContent.localeSwitcherAria, locale));
	// Path-preserving: /fr/about ↔ /about (slice-28.6).
	const switchHref = (l: Locale) => localizeHref(delocalizePath(pathname), l);

	const year = new Date().getFullYear();
	// go2-t1c2: copyright template from site_labels (orange dot stays code =
	// placement), previous literal as fallback.
	const copyrightText = $derived(fillTemplate(
		resolveLocale(siteLabels.ui.copyrightTemplate, locale) || '© {year} yesid',
		{ year: String(year) },
	));

	const now = new Date();
	const systemDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

	// Use footerLinks when available; fall back to staticMenuItems for backwards compat.
	const footerNavLinks = $derived(
		(footerLinks.length > 0 ? footerLinks : staticMenuItems).map((item) => ({
			label: resolveLocale(item.label, locale),
			href: localizeHref(item.href, locale),
		})),
	);

	const socialLinks = [
		siteMeta.links.github ? { label: 'GitHub', href: siteMeta.links.github } : null,
		siteMeta.links.linkedin ? { label: 'LinkedIn', href: siteMeta.links.linkedin } : null,
		siteMeta.links.upwork ? { label: 'Upwork', href: siteMeta.links.upwork } : null
	].filter((link): link is { label: string; href: string } => link !== null);

	let wordmarkEl: HTMLSpanElement;
	let dotEl: HTMLSpanElement;
	let wordmarkAction: ReturnType<typeof wordmarkHover> | undefined;

	onMount(() => {
		wordmarkAction = wordmarkHover(wordmarkEl, { dotEl });
	});

	onDestroy(() => {
		wordmarkAction?.destroy();
	});
</script>

<footer data-testid="footer" class="relative z-50 bg-[var(--muted)]">
	<!-- GO2-W5 platform edge: the footer's top line is real hazard tape -->
	<div class="footer-gradient-sep" aria-hidden="true"></div>

	<!-- Row 1: Main content -->
	<div class="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pb-5 pt-10 sm:flex-row sm:items-start sm:justify-between sm:px-10 sm:pt-12">
		<!-- Left: Wordmark -->
		<div class="flex flex-col items-center sm:items-start">
			<a
				href={localizeHref('/', locale)}
				data-testid="footer-wordmark"
				class="inline-flex items-baseline font-heading text-xl font-bold text-[var(--foreground)]"
			>
				<span bind:this={wordmarkEl}>yesid</span><span
					bind:this={dotEl}
					class="text-primary">.</span
				>
			</a>
			<span class="mt-1 font-mono text-xs text-[var(--muted-foreground)]">{tagline}</span>
		</div>

		<!-- Center: Nav links -->
		<nav aria-label={footerNavAria} class="flex flex-wrap justify-center gap-x-6 gap-y-2">
			{#each footerNavLinks as link}
				<a
					href={link.href}
					class="footer-link text-small text-[var(--secondary-foreground)] transition-colors hover:text-primary active:text-primary"
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<!-- Right: Social links -->
		<div class="flex items-center gap-4">
			{#each socialLinks as link}
				<a
					href={link.href}
					target="_blank"
					rel="noopener noreferrer"
					class="footer-link text-small text-[var(--secondary-foreground)] transition-colors hover:text-primary active:text-primary"
					aria-label={link.label}
				>
					{link.label}
				</a>
			{/each}
		</div>
	</div>

	<!-- Row 2: Status bar -->
	<div class="footer-status-border mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-4 font-mono text-caption text-[var(--muted-foreground)] sm:flex-row sm:justify-between sm:px-10">
		<small>{copyrightText}<span class="text-primary">.</span></small>
		<address class="not-italic">{location}</address>
		{#if availableLocales.length > 1}
			<nav data-testid="footer-locale-switch" aria-label={switcherAria} class="flex items-center gap-2">
				{#each availableLocales as l, i (l)}
					{#if i > 0}<span aria-hidden="true" class="opacity-30">|</span>{/if}
					<a
						href={switchHref(l)}
						aria-current={l === locale ? 'true' : undefined}
						class={l === locale ? 'text-primary' : 'transition-colors hover:text-primary'}
					>{l.toUpperCase()}</a>
				{/each}
			</nav>
		{/if}
		<span class="flex items-center gap-1.5">
			<StatusDot color="orange" pulse />
			{statusPrefix} {systemDate}
		</span>
	</div>

</footer>

<style>
	/* GO2-W5: platform-edge hazard strip (sm tape geometry, theme-invariant
	   yellow + warm black — matches the Separator hazard recipe). */
	.footer-gradient-sep {
		height: 2px;
		background: repeating-linear-gradient(
			-45deg,
			var(--hazard-a) 0px,
			var(--hazard-a) 6px,
			var(--hazard-b) 6px,
			var(--hazard-b) 12px
		);
	}

	.footer-status-border {
		border-top: 1px solid color-mix(in srgb, var(--foreground) 6%, transparent);
	}

	footer {
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	/* GO-w2t5: underline draw, blueprint line at word scale (SAFE-ALWAYS). */
	.footer-link {
		background-image: linear-gradient(var(--primary), var(--primary));
		background-repeat: no-repeat;
		background-position: 0 100%;
		background-size: 0% 1px;
		transition:
			background-size var(--duration-fast) var(--ease-out),
			color var(--duration-fast) var(--ease-default);
	}
	.footer-link:hover,
	.footer-link:focus-visible {
		background-size: 100% 1px;
	}
</style>
