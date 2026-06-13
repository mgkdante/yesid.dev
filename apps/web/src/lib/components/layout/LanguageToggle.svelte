<!--
  LanguageToggle — a fingerpost signpost (the wayfinding direction pole).

  A small vertical pole with one pointed fingerboard per published locale
  (EN / FR / ES), the CURRENT locale's board lit in --primary (the others muted
  outlines) — exactly how the theme toggle lights its current signal lens. Pure
  SVG, sized like that signal head. Mechanical wayfinding signage, distinct from
  the theme toggle's traffic-light. On switch the boards swing (a signpost
  catching the change); disabled under prefers-reduced-motion.

  ANGLE — ENAMEL DEPTH: Montréal-métro porcelain-enamel plate feel. Each board
  carries a restrained 2-stop face (top highlight → thin dark bottom edge), tiny
  mounting bolts where it meets the pole, and the lit plate adds the amber rule
  (--border-rule-accent) beneath plus the same lit-lens glow the theme toggle
  uses. A whisper of dimension — premium via precision, still flat métro brand.

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

	// Unique gradient ids per instance (chrome can mount more than once → no id clash).
	const uid = $props.id();

	// One enamel fingerboard per locale, alternating sides of the pole, current lit.
	// Geometry is the LOCKED shape; the enamel face/edge/bolts are layered on top.
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
			// Thin dark bottom edge: a sliver hugging the lower border of the plate.
			const edge = right
				? `M30 ${yTop + h - 1.4} H49 L51.2 ${mid + (h / 2 - 1.4) * 0.44} L49 ${yTop + h} H30 Z`
				: `M26 ${yTop + h - 1.4} H7 L4.8 ${mid + (h / 2 - 1.4) * 0.44} L7 ${yTop + h} H26 Z`;
			// Top highlight: a hairline catching light along the plate's upper border.
			const sheen = right
				? `M30.5 ${yTop + 1} H48.4 L52 ${mid - (h / 2 - 1) * 0.55}`
				: `M25.5 ${yTop + 1} H7.6 L4 ${mid - (h / 2 - 1) * 0.55}`;
			// Two mounting bolts where the plate fastens to the pole.
			const bx = right ? 32.4 : 23.6;
			return {
				code: CODE[loc] ?? loc.slice(0, 2).toUpperCase(),
				path,
				edge,
				sheen,
				bx,
				byTop: yTop + 2.6,
				byBot: yTop + h - 2.6,
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
			<defs>
				<!-- Enamel face: 2 flat stops — top highlight → seated base. Restrained. -->
				<linearGradient id="enamel-{uid}" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="var(--edge-highlight)" />
					<stop offset="48%" stop-color="transparent" />
				</linearGradient>
				<linearGradient id="enamel-lit-{uid}" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.55" />
					<stop offset="46%" stop-color="transparent" />
				</linearGradient>
			</defs>

			<!-- POLE: shaft with a finial cap and a seated base collar. -->
			<rect class="pole" x="25.5" y="5" width="5" height="36" rx="2.2" />
			<circle class="finial" cx="28" cy="4" r="2.4" />
			<rect class="finial-neck" x="26.4" y="4.6" width="3.2" height="2" rx="0.8" />

			{#key locale}
				<g class="boards">
					{#each boards as b, i}
						<g
							class="board"
							class:active={b.active}
							style="--d:{b.delay}ms; transform-origin:27px {b.ty - 3.8}px;"
						>
							<!-- mounting bolts (under the plate edge, at the pole) -->
							<circle class="bolt" cx={b.bx} cy={b.byTop} r="0.85" />
							<circle class="bolt" cx={b.bx} cy={b.byBot} r="0.85" />
							<!-- enamel plate: outline + flat 2-stop face -->
							<path class="plate" d={b.path} />
							<path class="face" d={b.path} fill="url(#enamel-{uid})" />
							{#if b.active}
								<path class="face-lit" d={b.path} fill="url(#enamel-lit-{uid})" />
							{/if}
							<!-- thin dark bottom edge (enamel seats into shadow) -->
							<path class="edge" d={b.edge} />
							<!-- top highlight hairline -->
							<path class="sheen" d={b.sheen} />
							<!-- amber rule beneath the lit plate (métro signage underline) -->
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

	/* POLE — galvanised post: shaft, finial cap, neck collar. */
	.pole {
		fill: color-mix(in srgb, var(--secondary-foreground) 55%, transparent);
	}
	.finial {
		fill: color-mix(in srgb, var(--secondary-foreground) 70%, transparent);
	}
	.finial-neck {
		fill: color-mix(in srgb, var(--secondary-foreground) 45%, transparent);
	}

	/* ENAMEL PLATE — flat porcelain face, hairline edges, restrained depth. */
	.plate {
		fill: var(--background);
		stroke: currentColor;
		stroke-width: 1.25;
		stroke-linejoin: round;
	}
	.face {
		stroke: none;
	}
	.edge {
		fill: color-mix(in srgb, var(--foreground) 22%, transparent);
		stroke: none;
	}
	.sheen {
		fill: none;
		stroke: var(--edge-highlight);
		stroke-width: 0.9;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.bolt {
		fill: color-mix(in srgb, var(--secondary-foreground) 80%, transparent);
	}
	.board text {
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.02em;
		fill: currentColor;
		text-anchor: middle;
	}

	/* CURRENT locale's plate — lit enamel, like the theme toggle's lit lens. */
	.board.active .plate {
		fill: var(--primary);
		stroke: var(--primary);
		filter: drop-shadow(0 0 4px color-mix(in srgb, var(--primary) 60%, transparent));
	}
	.board.active .edge {
		fill: color-mix(in srgb, #1c1814 38%, transparent);
	}
	.board.active .bolt {
		fill: color-mix(in srgb, var(--accent) 75%, var(--primary));
	}
	.board.active text {
		fill: color-mix(in srgb, var(--foreground) 12%, #1c1814);
	}
	/* amber rule under the lit plate — the métro enamel underline. */
	.rule {
		stroke: var(--border-rule-accent);
		stroke-width: 1.4;
		stroke-linecap: round;
	}

	/* MOTION — pendulum swing + per-board stagger/overshoot; lit plate breathes. */
	.boards {
		transform-origin: 27px 22px;
		animation: post-swing 460ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
	}
	.board {
		animation: board-settle 520ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
		animation-delay: var(--d, 0ms);
	}
	.board.active {
		animation:
			board-settle 520ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both,
			plate-breathe 3.6s ease-in-out 700ms infinite;
		animation-delay: var(--d, 0ms);
	}
	.lang-post:hover .board.active {
		animation:
			board-settle 520ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both,
			plate-lift 220ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) forwards;
	}
	@keyframes post-swing {
		0% { transform: rotate(-7deg); }
		55% { transform: rotate(2.4deg); }
		78% { transform: rotate(-0.8deg); }
		100% { transform: rotate(0deg); }
	}
	@keyframes board-settle {
		0% { transform: rotate(-5deg); opacity: 0.65; }
		55% { transform: rotate(1.8deg); opacity: 1; }
		100% { transform: rotate(0deg); opacity: 1; }
	}
	@keyframes plate-breathe {
		0%, 100% { filter: none; }
		50% { filter: drop-shadow(0 0 3px color-mix(in srgb, var(--primary) 35%, transparent)); }
	}
	@keyframes plate-lift {
		to { transform: translateY(-0.6px) scale(1.015); }
	}

	@media (prefers-reduced-motion: reduce) {
		.lang-post { transition: none; }
		.boards,
		.board,
		.board.active,
		.lang-post:hover .board.active {
			animation: none;
		}
	}
</style>
