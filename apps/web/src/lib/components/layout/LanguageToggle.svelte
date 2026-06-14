<!--
  LanguageToggle — a fingerpost signpost (the wayfinding direction pole),
  drawn FLAT — line-art, like the ThemeToggle traffic-light beside it.

  A small vertical pole with one pointed fingerboard per published locale
  (EN / FR / ES), the CURRENT locale's board emphasised with a solid --primary
  fill + an amber rule (--border-rule-accent) underline — exactly the way the
  theme toggle fills its current signal lens. Pure SVG, simple strokes, solid
  fills: NO gradients, NO drop-shadow glows, NO filter animations. A drawing.

  Data-driven by PUBLISHED_LOCALES: one board per published locale, cycling on
  click, path-preserving. Renders NOTHING when fewer than 2 are published — so
  it is absent today (['en']) and appears EN⇄FR the instant French is flipped on.

  On switch the boards give a gentle swing (a signpost catching the change);
  disabled under prefers-reduced-motion.

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

	// One fingerboard per locale, alternating sides of the pole, current emphasised.
	// Pointed-pennant silhouette is the locked shape — drawn flat (outline + label).
	const boards = $derived(
		availableLocales.map((loc, k) => {
			const n = availableLocales.length;
			const span = 36 / n;
			const h = Math.min(12, span - 2);
			const yTop = 4 + k * span + (span - h) / 2;
			const mid = yTop + h / 2;
			const right = k % 2 === 1;
			// Plate outline (pointed pennant) — the locked silhouette.
			const path = right
				? `M30 ${yTop} H49 L54 ${mid} L49 ${yTop + h} H30 Z`
				: `M26 ${yTop} H7 L2 ${mid} L7 ${yTop + h} H26 Z`;
			return {
				code: CODE[loc] ?? loc.slice(0, 2).toUpperCase(),
				path,
				ruleY: yTop + h + 1.4,
				ruleX1: right ? 31 : 8,
				ruleX2: right ? 47.5 : 25,
				tx: right ? 39 : 16,
				ty: mid + 3.8,
				active: loc === locale,
				delay: k * 60,
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
			<!-- POLE: simple shaft with a small finial cap. -->
			<line class="pole" x1="28" y1="6" x2="28" y2="41" stroke-linecap="round" />
			<circle class="finial" cx="28" cy="4" r="2" />

			{#key locale}
				<g class="boards">
					{#each boards as b}
						<g
							class="board"
							class:active={b.active}
							style="--d:{b.delay}ms; transform-origin:28px {b.ty - 3.8}px;"
						>
							<!-- fingerboard: flat outline (current locale fills solid --primary) -->
							<path class="plate" d={b.path} />
							<!-- amber rule beneath the current plate (signage underline) -->
							{#if b.active}
								<line class="rule" x1={b.ruleX1} y1={b.ruleY} x2={b.ruleX2} y2={b.ruleY} />
							{/if}
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

	/* POLE — flat line, matching the signal head's stroke weight. */
	.pole {
		stroke: currentColor;
		stroke-width: 1.5;
	}
	.finial {
		fill: currentColor;
	}

	/* FINGERBOARD — flat line-art: transparent outline, current locale solid. */
	.plate {
		fill: transparent;
		stroke: currentColor;
		stroke-width: 1.25;
		stroke-linejoin: round;
		transition: fill var(--duration-normal) var(--ease-default);
	}
	.board text {
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.02em;
		fill: currentColor;
		text-anchor: middle;
	}

	/* CURRENT locale — solid --primary fill (like the theme toggle's lit lens), flat. */
	.board.active .plate {
		fill: var(--primary);
		stroke: var(--primary);
	}
	.board.active text {
		fill: var(--primary-foreground);
	}
	/* amber rule under the current plate — the signage underline (no glow). */
	.rule {
		stroke: var(--border-rule-accent);
		stroke-width: 1.4;
		stroke-linecap: round;
	}

	/* MOTION — a gentle swing on switch + a small per-board stagger. No filters. */
	.boards {
		transform-origin: 28px 22px;
		animation: post-swing 460ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
	}
	.board {
		animation: board-settle 520ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
		animation-delay: var(--d, 0ms);
	}
	@keyframes post-swing {
		0% { transform: rotate(-6deg); }
		60% { transform: rotate(2deg); }
		100% { transform: rotate(0deg); }
	}
	@keyframes board-settle {
		0% { transform: rotate(-4deg); opacity: 0.7; }
		60% { transform: rotate(1.4deg); opacity: 1; }
		100% { transform: rotate(0deg); opacity: 1; }
	}

	@media (prefers-reduced-motion: reduce) {
		.lang-post { transition: none; }
		.plate { transition: none; }
		.boards,
		.board {
			animation: none;
		}
	}

	/* Mobile: the fingerpost is the widest pill control (svg is 46px wide) and,
	   added in slice-30, it overflowed the floating nav pill at ≤360px. Shrink
	   the drawing on phones — the tap target stays comfortably ≥24px (AA). */
	@media (max-width: 479px) {
		.lang-post {
			min-width: 38px;
			padding: 3px;
		}
		.lang-post svg {
			width: 34px;
			height: 27px;
		}
	}
	@media (max-width: 359px) {
		.lang-post {
			min-width: 26px;
			padding: 2px;
		}
		.lang-post svg {
			width: 22px;
			height: 17px;
		}
	}
</style>
