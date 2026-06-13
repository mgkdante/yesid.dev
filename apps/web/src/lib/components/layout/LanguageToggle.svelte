<!--
  LanguageToggle — the métro DIRECTION blind.

  A Montréal-métro "DIRECTION ▸" destination plate whose destination is the SITE
  LANGUAGE, self-named on a Solari split-flap leaf (Français / English / Español).
  It is mechanical signage — an orange enamel cap, a dark flap blind, an amber
  rule — deliberately NOT light-based, so it never collides with the theme
  toggle's traffic-light metaphor.

  Self-naming (each language in its own tongue) means a French or Spanish speaker
  spots theirs instantly — no flags, which are ambiguous.

  Data-driven by PUBLISHED_LOCALES (the build-time cache regenerated FROM the CMS):
  one destination per published locale, cycling on click. Renders NOTHING when
  fewer than 2 locales are published — today PUBLISHED_LOCALES === ['en'], so the
  control is absent until the operator flips French (then EN⇄FR; later +ES).

  Persistent chrome (rides Nav, never remounts): `locale` is a PROP, like
  ThemeToggle — getLocale() would init-freeze here (slice-28.6).
-->
<script lang="ts">
	import { sharedChromeContent } from '$lib/content';
	import { PUBLISHED_LOCALES } from '$lib/utils/seo-defaults';
	import { localizeHref, delocalizePath } from '$lib/utils/locale-routing';
	import { resolveLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
	import type { Locale } from '$lib/types';

	// Persistent chrome (rides Nav, never remounts): locale + pathname are PROPS
	// (getLocale()/$page would init-freeze here) — same convention as ThemeToggle
	// + Footer's locale switcher.
	let {
		class: className = '',
		locale = DEFAULT_LOCALE,
		pathname = '/',
		availableLocales = PUBLISHED_LOCALES as readonly Locale[],
	}: {
		class?: string;
		locale?: Locale;
		pathname?: string;
		availableLocales?: readonly Locale[];
	} = $props();

	// Self-names — each language in its own tongue (no flags: ambiguous). Invariant.
	const NAMES: Record<Locale, string> = { en: 'English', fr: 'Français', es: 'Español' };

	const idx = $derived(Math.max(0, availableLocales.indexOf(locale)));
	const next = $derived(availableLocales[(idx + 1) % availableLocales.length]);
	// Path-preserving locale switch — same mechanism as the footer/menu switchers.
	const nextHref = $derived(localizeHref(delocalizePath(pathname), next));
	const currentName = $derived(NAMES[locale] ?? locale);
	const switcherAria = $derived(resolveLocale(sharedChromeContent.localeSwitcherAria, locale));
	const ariaLabel = $derived(`${switcherAria}: ${currentName}`);
</script>

{#if availableLocales.length >= 2}
	<a
		href={nextHref}
		data-testid="language-toggle"
		data-sveltekit-preload-data="hover"
		class="dir-plate tap-press {className}"
		aria-label={ariaLabel}
		title={currentName}
	>
		<span class="cap" aria-hidden="true">
			<span class="cap-word">DIRECTION</span>
			<svg class="cap-arrow" viewBox="0 0 26 12" width="20" height="9">
				<path d="M2 6 H21 M21 6 L16 2 M21 6 L16 10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</span>
		<span class="blind" aria-hidden="true">
			<span class="hinge"></span>
			{#key locale}
				<span class="leaf">{currentName}</span>
			{/key}
		</span>
		<span class="sr-only" aria-live="polite">{currentName}</span>
	</a>
{/if}

<style>
	.dir-plate {
		display: inline-flex;
		align-items: stretch;
		min-height: 44px; /* hit target — content sits centered, like ThemeToggle */
		padding: 6px 0;
		border-radius: var(--radius-sm);
		text-decoration: none;
		line-height: 1;
		color: var(--secondary-foreground);
	}
	.dir-plate:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* Orange enamel cap — the métro "DIRECTION ▸" signage. Orange stays orange
	   across both themes (tokens.css), with dark ink on it. */
	.cap {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 0 8px;
		background: var(--primary);
		color: color-mix(in srgb, var(--foreground) 14%, #1c1814);
		border-radius: 4px 0 0 4px;
		font-family: var(--font-mono);
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.16em;
	}
	.cap-arrow { display: block; }

	/* The flap blind — dark hardware in BOTH themes (a split-flap reads as
	   dark even on paper), so it stays distinct from surrounding chrome. */
	.blind {
		position: relative;
		display: grid;
		place-items: center;
		min-width: 6.2em;
		padding: 0 10px;
		background: color-mix(in srgb, var(--background) 72%, #000);
		border: 1px solid var(--border);
		border-left: none;
		border-radius: 0 4px 4px 0;
		/* the lit amber rule under the housing, like real transit signage */
		box-shadow: inset 0 -2px 0 var(--border-rule-accent);
		overflow: hidden;
		perspective: 240px;
	}
	/* hinge seam across the middle of the blind */
	.hinge {
		position: absolute;
		inset-inline: 0;
		top: 50%;
		height: 1px;
		background: color-mix(in srgb, #000 70%, transparent);
		box-shadow: 0 1px 0 color-mix(in srgb, var(--accent) 18%, transparent);
		z-index: 2;
	}
	/* the destination word — the only non-mono text, the "name" reads as a sign */
	.leaf {
		grid-area: 1 / 1;
		font-family: var(--font-heading);
		font-size: 15px;
		font-weight: 600;
		color: var(--accent);
		white-space: nowrap;
		transform-origin: top center;
		animation: flap 300ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
		backface-visibility: hidden;
	}

	/* split-flap hand-off: the new destination hinges down into place */
	@keyframes flap {
		0% { transform: rotateX(-90deg); opacity: 0; }
		55% { transform: rotateX(14deg); opacity: 1; }
		100% { transform: rotateX(0deg); opacity: 1; }
	}

	@media (prefers-reduced-motion: reduce) {
		.leaf { animation: none; }
	}
</style>
