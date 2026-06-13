<!--
  LanguageToggle — a fingerpost signpost (the wayfinding direction pole).

  A small vertical pole with one pointed fingerboard per published locale
  (EN / FR / ES), the CURRENT locale's board lit in --primary (the others muted
  outlines) — exactly how the theme toggle lights its current signal lens. Pure
  SVG, sized like that signal head. Mechanical wayfinding signage, distinct from
  the theme toggle's traffic-light. On switch the boards swing (a signpost
  catching the change); disabled under prefers-reduced-motion.

  Data-driven by PUBLISHED_LOCALES: one board per published locale, cycling on
  click, path-preserving. Renders NOTHING when fewer than 2 are published — so
  it is absent today (['en']) and appears EN⇄FR the instant French is flipped on.

  Persistent chrome (rides Nav): locale + pathname are PROPS (ThemeToggle convention).
-->
<script lang="ts">
	import { sharedChromeContent } from '$lib/content';
	import { PUBLISHED_LOCALES } from '$lib/utils/seo-defaults';
	import { localizeHref, delocalizePath } from '$lib/utils/locale-routing';
	import { resolveLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
	import type { Locale } from '$lib/types';

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

	// Two-letter codes on the boards (legible at signpost scale); full self-names
	// drive the accessible label/title (a French/Spanish speaker hears theirs).
	const CODE: Record<Locale, string> = { en: 'EN', fr: 'FR', es: 'ES' };
	const NAMES: Record<Locale, string> = { en: 'English', fr: 'Français', es: 'Español' };

	const idx = $derived(Math.max(0, availableLocales.indexOf(locale)));
	const next = $derived(availableLocales[(idx + 1) % availableLocales.length]);
	const nextHref = $derived(localizeHref(delocalizePath(pathname), next));
	const switcherAria = $derived(resolveLocale(sharedChromeContent.localeSwitcherAria, locale));
	const ariaLabel = $derived(`${switcherAria}: ${NAMES[locale] ?? locale}`);

	// One fingerboard per locale, alternating sides of the pole, current lit.
	const boards = $derived(
		availableLocales.map((loc, k) => {
			const n = availableLocales.length;
			const span = 36 / n;
			const h = Math.min(12, span - 2);
			const yTop = 4 + k * span + (span - h) / 2;
			const mid = yTop + h / 2;
			const right = k % 2 === 1;
			const path = right
				? `M30 ${yTop} H49 L54 ${mid} L49 ${yTop + h} H30 Z`
				: `M26 ${yTop} H7 L2 ${mid} L7 ${yTop + h} H26 Z`;
			return {
				code: CODE[loc] ?? loc.slice(0, 2).toUpperCase(),
				path,
				tx: right ? 39 : 16,
				ty: mid + 3.8,
				active: loc === locale,
			};
		}),
	);
</script>

{#if availableLocales.length >= 2}
	<a
		href={nextHref}
		data-testid="language-toggle"
		data-sveltekit-preload-data="hover"
		class="lang-post tap-press {className}"
		aria-label={ariaLabel}
		title={NAMES[locale] ?? locale}
	>
		<svg viewBox="0 0 56 44" width="46" height="36" aria-hidden="true">
			<rect class="pole" x="25.5" y="3" width="5" height="38" rx="2.5" />
			{#key locale}
				<g class="boards">
					{#each boards as b}
						<g class="board" class:active={b.active}>
							<path d={b.path} />
							<text x={b.tx} y={b.ty}>{b.code}</text>
						</g>
					{/each}
				</g>
			{/key}
		</svg>
		<span class="sr-only" aria-live="polite">{NAMES[locale] ?? locale}</span>
	</a>
{/if}

<style>
	.lang-post {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		min-width: 44px;
		padding: 4px;
		color: var(--secondary-foreground);
		border-radius: var(--radius-sm);
		transition: color var(--duration-fast) var(--ease-default);
	}
	.lang-post:hover {
		color: var(--foreground);
	}
	.lang-post:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.pole {
		fill: color-mix(in srgb, var(--secondary-foreground) 55%, transparent);
	}
	.board path {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.25;
		stroke-linejoin: round;
	}
	.board text {
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.02em;
		fill: currentColor;
		text-anchor: middle;
	}
	/* current locale's board is lit, like the theme toggle's lit lens */
	.board.active path {
		fill: var(--primary);
		stroke: var(--primary);
	}
	.board.active text {
		fill: color-mix(in srgb, var(--foreground) 12%, #1c1814);
	}

	/* boards swing on switch — a signpost catching the change */
	.boards {
		transform-origin: 27px 22px;
		animation: post-swing 380ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
	}
	@keyframes post-swing {
		0% { transform: rotate(-7deg); }
		60% { transform: rotate(2deg); }
		100% { transform: rotate(0deg); }
	}
	@media (prefers-reduced-motion: reduce) {
		.lang-post { transition: none; }
		.boards { animation: none; }
	}
</style>
