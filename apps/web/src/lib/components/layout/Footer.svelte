<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { siteMeta, menuItems as staticMenuItems, sharedChromeContent, footerContent } from '$lib/content';
	import { resolveLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { wordmarkHover } from '$lib/motion/actions';
	import { StatusDot } from '$lib/components/brand';
	import type { NavLink } from '$lib/content/nav';
	import type { Locale } from '$lib/types';

	// footerLinks: adapter-sourced footer placement links (from +layout.server.ts).
	// Falls back to the menu items (which serve as footer fallback in static mode).
	// (No url / availableLocales props: the EN|FR locale switcher was removed from
	// the status bar, so the footer no longer needs the current URL or locale list.)
	let {
		locale = DEFAULT_LOCALE,
		footerLinks = staticMenuItems as readonly NavLink[],
	}: {
		locale?: Locale;
		footerLinks?: readonly NavLink[];
	} = $props();

	// $derived (not const): Footer never remounts; locale changes on /fr↔/ navigation.
	const tagline = $derived(resolveLocale(footerContent.tagline, locale));
	const location = $derived(resolveLocale(footerContent.location, locale));
	const statusPrefix = $derived(resolveLocale(footerContent.statusPrefix, locale));
	const footerNavAria = $derived(resolveLocale(sharedChromeContent.footerNavAria, locale));

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

	<!-- Row 2: Status bar — below the hazard rule. Operator trim: location +
	     system status only (copyright and the EN|FR locale toggle removed). -->
	<div class="footer-status-border mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-4 font-mono text-caption text-[var(--muted-foreground)] sm:flex-row sm:justify-between sm:px-10">
		<address class="not-italic">{location}</address>
		<!-- Round-4 doctrine: the system status line is a departure-board
		     readout — the YELLOW voice under the amber departure rule
		     (the lamp stays the orange route-set aspect). -->
		<span class="flex items-center gap-1.5 text-[var(--accent-text)]">
			<StatusDot color="orange" pulse />
			{statusPrefix} {systemDate}
		</span>
	</div>

</footer>

<style>
	/* GO2-W5: platform-edge hazard strip (sm tape geometry, theme-invariant
	   yellow + warm black — matches the Separator hazard recipe).
	   Round 3: one step thicker (2px → 3px) with the rest of the structure. */
	.footer-gradient-sep {
		height: 3px;
		background: repeating-linear-gradient(
			-45deg,
			var(--hazard-a) 0px,
			var(--hazard-a) 6px,
			var(--hazard-b) 6px,
			var(--hazard-b) 12px
		);
	}

	/* Taste round 2: the status bar's top line is a BOLD departure-board rule
	   — the yellow wayfinding voice as structure (was a 6% foreground ghost).
	   Round 3: one step thicker (1px → 2px). */
	.footer-status-border {
		border-top: 2px solid var(--border-rule-accent);
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
