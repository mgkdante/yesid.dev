<script lang="ts">
	import { onMount } from 'svelte';
	import { quietModeStore } from '$lib/state/quiet-mode.svelte';
	import { siteLabels } from '$lib/content';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	let { class: className = '' }: { class?: string } = $props();

	// CMS-backed bilingual copy (siteLabels.a11y.quietMode*). getLocale() returns
	// DEFAULT_LOCALE without a provider, so unit tests render the EN seeds.
	// Homework #19b: the visible VERB label is the accessible name and flips
	// with state (Collapse all / Expand all), so both controls are plain
	// buttons; role="switch"/aria-pressed would double-encode the state the
	// label already announces.
	const locale = getLocale();
	const a11y = siteLabels.a11y;

	const enabled = $derived(quietModeStore.enabled);
	const remembered = $derived(quietModeStore.remembered);
	const switchLabel = $derived(
		enabled
			? resolveLocale(a11y.quietModeLabelCollapsed, locale)
			: resolveLocale(a11y.quietModeLabel, locale)
	);
	const switchTitle = $derived(
		enabled
			? resolveLocale(a11y.quietModeDisable, locale)
			: resolveLocale(a11y.quietModeEnable, locale)
	);
	const rememberLabel = $derived(
		remembered
			? resolveLocale(a11y.quietModeForget, locale)
			: resolveLocale(a11y.quietModeRemember, locale)
	);

	onMount(() => quietModeStore.init());
</script>

<div class="quiet-mode-controls {className}" data-testid="quiet-mode-controls">
	<button
		type="button"
		data-testid="quiet-mode-toggle"
		class="quiet-mode-toggle quiet-mode-toggle--switch tap-press"
		data-collapsed={enabled}
		title={switchTitle}
		onclick={() => quietModeStore.toggle()}
	>
		<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
			<!-- broadcast arcs: the signal announces; they fall silent when quiet engages -->
			<path class="q-wave" d="M8.4 8.4a5 5 0 0 0 0 7.2" />
			<path class="q-wave" d="M15.6 8.4a5 5 0 0 1 0 7.2" />
			<path class="q-wave q-wave--far" d="M5.7 5.7a8.9 8.9 0 0 0 0 12.6" />
			<path class="q-wave q-wave--far" d="M18.3 5.7a8.9 8.9 0 0 1 0 12.6" />
			<!-- signal core: lights up to mark the quiet zone -->
			<circle class="q-core" cx="12" cy="12" r="2.3" />
		</svg>
		<span>{switchLabel}</span>
	</button>

	<button
		type="button"
		data-testid="quiet-mode-remember"
		class="quiet-mode-toggle quiet-mode-toggle--remember tap-press"
		data-remembered={remembered}
		title={rememberLabel}
		onclick={() => (remembered ? quietModeStore.forgetDefault() : quietModeStore.rememberCurrent())}
	>
		<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
			<!-- wayfinding bookmark: fills solid when the preference is pinned -->
			<path class="r-bookmark" d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.9L6 20V5.5a1 1 0 0 1 1-1z" />
		</svg>
		<span>{rememberLabel}</span>
	</button>
</div>

<style>
	.quiet-mode-controls {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.quiet-mode-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-width: 44px;
		min-height: 44px;
		border: 2px solid var(--border-brand);
		border-radius: var(--radius-md);
		background: var(--background);
		color: var(--secondary-foreground);
		box-shadow: inset 0 1px 0 var(--edge-highlight);
		cursor: pointer;
		transition:
			border-color var(--duration-normal) var(--ease-default),
			color var(--duration-normal) var(--ease-default),
			background var(--duration-normal) var(--ease-default);
	}

	.quiet-mode-toggle--switch {
		padding-inline: 0.875rem 1rem;
		font-family: var(--font-mono);
		font-size: var(--text-control);
		letter-spacing: 0;
	}

	.quiet-mode-toggle--remember {
		padding-inline: 0.75rem 0.875rem;
		font-family: var(--font-mono);
		font-size: var(--text-control);
		letter-spacing: 0;
	}

	.quiet-mode-toggle:hover,
	.quiet-mode-toggle:focus-visible,
	.quiet-mode-toggle[data-collapsed='true'],
	.quiet-mode-toggle[data-remembered='true'] {
		border-color: var(--primary);
		color: var(--primary);
		background: color-mix(in srgb, var(--primary) 7%, var(--background));
	}

	.quiet-mode-toggle:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 3px;
	}

	/* Flat line-art in the ThemeToggle / LanguageToggle family: currentColor
	   strokes, and the active state lights --primary with a soft glow exactly
	   like the theme toggle's lit signal lens. */
	.q-wave,
	.q-core,
	.r-bookmark {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
		transition:
			opacity var(--duration-normal) var(--ease-default),
			fill var(--duration-normal) var(--ease-default),
			stroke var(--duration-normal) var(--ease-default),
			filter var(--duration-normal) var(--ease-default);
	}

	.q-wave--far {
		opacity: 0.5;
	}

	/* Collapsed ENGAGED: the broadcast falls silent (arcs fade) and the core lights. */
	.quiet-mode-toggle[data-collapsed='true'] .q-wave {
		opacity: 0;
	}
	.quiet-mode-toggle[data-collapsed='true'] .q-core {
		fill: var(--primary);
		stroke: var(--primary);
		filter: drop-shadow(0 0 4px color-mix(in srgb, var(--glow) 60%, transparent));
	}

	/* Pinned: the bookmark fills solid --primary (the saved preference). */
	.quiet-mode-toggle[data-remembered='true'] .r-bookmark {
		fill: var(--primary);
		stroke: var(--primary);
		filter: drop-shadow(0 0 4px color-mix(in srgb, var(--glow) 55%, transparent));
	}

	@media (prefers-reduced-motion: reduce) {
		.quiet-mode-toggle,
		.q-wave,
		.q-core,
		.r-bookmark {
			transition: none;
		}
	}
</style>
