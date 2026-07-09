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

  Persistent chrome (rides Nav): locale + url are PROPS (ThemeToggle convention).
  The switch preserves the full URL — path, query AND hash — so in-progress
  state (filters, ?station, the engine seed) survives the language change.
-->
<script lang="ts">
	import { siteLabels } from '$lib/content';
	import { PUBLISHED_LOCALES } from '$lib/utils/seo-defaults';
	import { localizeUrl } from '$lib/utils/locale-routing';
	import { resolveLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
	import type { Locale } from '$lib/types';

	let {
		class: className = '',
		locale = DEFAULT_LOCALE,
		url = new URL('https://yesid.dev/'),
		availableLocales = PUBLISHED_LOCALES as readonly Locale[],
	}: {
		class?: string;
		locale?: Locale;
		/** Full current URL — the switch preserves its path, query AND hash. */
		url?: URL;
		availableLocales?: readonly Locale[];
	} = $props();

	// Two-letter codes on the boards (legible at signpost scale); full self-names
	// drive the accessible label/title (a French/Spanish speaker hears theirs).
	const CODE: Record<Locale, string> = { en: 'EN', fr: 'FR', es: 'ES' };
	const NAMES: Record<Locale, string> = { en: 'English', fr: 'Français', es: 'Español' };

	const idx = $derived(Math.max(0, availableLocales.indexOf(locale)));
	const next = $derived(availableLocales[(idx + 1) % availableLocales.length]);
	const nextHref = $derived(localizeUrl(url, next));
	const switcherAria = $derived(resolveLocale(siteLabels.navChrome.shared.localeSwitcherAria, locale));
	const ariaLabel = $derived(`${switcherAria}: ${NAMES[locale] ?? locale}`);

	// One fingerboard per locale, alternating sides of the pole, current emphasised.
	// Pointed-pennant silhouette is the locked shape — drawn flat (outline + label).
	// Letters run at the FULL two-board size for EVERY board count (operator
	// call, launch 3-board mode): the per-board span is CONSTANT and the post
	// grows taller instead of shrinking its type. The control is exempt from
	// the nav pill's vertical padding (see .lang-post), so the taller 3-board
	// drawing rides the pill's padding band and the pill never grows.
	const SPAN = 18; // per-board vertical span — the locked two-board geometry
	const PLATE_H = 15; // plate height; carries the locked 15px-SVG-unit letters
	const FONT_SIZE = 15;
	const vbHeight = $derived(8 + SPAN * availableLocales.length); // 2 boards → 44 (unchanged)
	// Rendered at the two-board scale (36px tall for the 44-unit post) at every
	// count, so 15 SVG units paint the same on-screen size with 2 AND 3 boards.
	const svgHeight = $derived(Math.round(((vbHeight * 36) / 44) * 10) / 10);
	const boards = $derived(
		availableLocales.map((loc, k) => {
			const yTop = 4 + k * SPAN + (SPAN - PLATE_H) / 2;
			const mid = yTop + PLATE_H / 2;
			const right = k % 2 === 1;
			// Plate outline (pointed pennant) — the locked silhouette.
			const path = right
				? `M30 ${yTop} H49 L54 ${mid} L49 ${yTop + PLATE_H} H30 Z`
				: `M26 ${yTop} H7 L2 ${mid} L7 ${yTop + PLATE_H} H26 Z`;
			return {
				code: CODE[loc] ?? loc.slice(0, 2).toUpperCase(),
				path,
				fontSize: FONT_SIZE,
				ruleY: yTop + PLATE_H + 1.4,
				ruleX1: right ? 31 : 8,
				ruleX2: right ? 47.5 : 25,
				tx: right ? 39 : 16,
				ty: mid + FONT_SIZE * 0.36,
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
		data-sveltekit-noscroll
		class="lang-post tap-press {className}"
		aria-label={ariaLabel}
		title={NAMES[locale] ?? locale}
		style="--vb-h: {vbHeight}"
	>
		<svg viewBox="0 0 56 {vbHeight}" width="46" height={svgHeight} aria-hidden="true">
			<!-- POLE: simple shaft with a small finial cap. -->
			<line class="pole" x1="28" y1="6" x2="28" y2={vbHeight - 3} stroke-linecap="round" />
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
							<text x={b.tx} y={b.ty} font-size={b.fontSize}>{b.code}</text>
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
		/* FIXED height + zero vertical padding (operator call, 3-board mode):
		   the control is exempt from the pill's top/bottom padding — the
		   3-board drawing is taller than 44px and bleeds symmetrically into
		   the pill's padding band instead of growing the pill. The 44px hit
		   target comes from this height + the min-width. */
		height: 44px;
		min-width: 44px;
		padding-block: 0;
		padding-inline: 4px;
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
		/* Base size only — the render pins font-size to the locked 15 SVG
		   units on every board (2- and 3-board posts alike). */
		font-size: 15px;
		font-weight: 700;
		letter-spacing: 0.01em;
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

	/* MOTION — a gentle swing on switch + a small per-board stagger. No filters.
	   Swing pivots on the post's vertical centre — computed from the viewBox
	   height so the 3-board (62-unit) post pivots true, not at the 2-board 22. */
	.boards {
		transform-origin: 28px calc(0.5px * var(--vb-h, 44));
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
	   the drawing on phones — the tap target stays comfortably ≥24px (AA).
	   Heights derive from the viewBox height at each tier's 2-board scale
	   (27/44, 17/44), so the 3-board post keeps letter-size parity here too. */
	@media (max-width: 479px) {
		.lang-post {
			min-width: 38px;
			padding-inline: 3px;
		}
		.lang-post svg {
			width: 34px;
			height: calc(27px * var(--vb-h, 44) / 44);
		}
	}
	@media (max-width: 359px) {
		.lang-post {
			min-width: 26px;
			padding-inline: 2px;
		}
		.lang-post svg {
			width: 22px;
			height: calc(17px * var(--vb-h, 44) / 44);
		}
	}
</style>
