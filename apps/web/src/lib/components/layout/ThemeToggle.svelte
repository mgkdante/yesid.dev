<!--
  ThemeToggle — transit signal lamp. Two lenses on a small signal head:
  top lens lit = dark theme (night running), bottom lens lit = light theme.
  role="switch" + aria-checked, 44px hit target (menu-toggle convention).
  Colors are tokens; the lit lens glows with the theme's own primary.
-->
<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { sharedChromeContent } from '$lib/content';
	import { resolveLocale } from '$lib/utils/locale';

	let { class: className = '' }: { class?: string } = $props();

	const label = resolveLocale(sharedChromeContent.themeToggleAria, 'en');
	const isDark = $derived(themeStore.isDark);
</script>

<button
	type="button"
	data-testid="theme-toggle"
	class="theme-toggle tap-press {className}"
	role="switch"
	aria-checked={isDark}
	aria-label={label}
	onclick={() => themeStore.toggle()}
>
	<svg viewBox="0 0 20 28" width="14" height="20" aria-hidden="true">
		<!-- signal head -->
		<rect x="3" y="2" width="14" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" />
		<!-- mast tick -->
		<line x1="10" y1="26" x2="10" y2="28" stroke="currentColor" stroke-width="1.5" />
		<!-- top lens (dark/night) -->
		<circle class="lens lens-top" class:lit={isDark} cx="10" cy="9" r="3.5" />
		<!-- bottom lens (light/day) -->
		<circle class="lens lens-bottom" class:lit={!isDark} cx="10" cy="19" r="3.5" />
	</svg>
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		min-width: 44px;
		padding: 4px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--secondary-foreground);
		transition: color var(--duration-fast) var(--ease-default);
	}
	.theme-toggle:hover {
		color: var(--foreground);
	}
	.theme-toggle:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.lens {
		fill: transparent;
		stroke: currentColor;
		stroke-width: 1.25;
		transition: fill var(--duration-normal) var(--ease-default),
			filter var(--duration-normal) var(--ease-default);
	}
	.lens.lit {
		fill: var(--primary);
		stroke: var(--primary);
		filter: drop-shadow(0 0 4px color-mix(in srgb, var(--primary) 60%, transparent));
	}

	@media (prefers-reduced-motion: reduce) {
		.theme-toggle,
		.lens {
			transition: none;
		}
	}
</style>
