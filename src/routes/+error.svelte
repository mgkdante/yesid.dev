<script lang="ts">
	import { onMount } from 'svelte';
	import ConstructionScene from '$lib/components/ConstructionScene.svelte';
	import TerminalCursor from '$lib/components/TerminalCursor.svelte';
	import { errorPageContent } from '$lib/data';
	import { resolveLocale, DEFAULT_LOCALE } from '$lib/data/locale.js';
	import { prefersReducedMotion } from '$lib/motion/stores';

	const locale = DEFAULT_LOCALE;
	const label = resolveLocale(errorPageContent.label, locale);
	const heading = resolveLocale(errorPageContent.heading, locale);
	const description = resolveLocale(errorPageContent.description, locale);
	const terminalLine = errorPageContent.terminalLine;
	const suggestions = errorPageContent.suggestions.map((s) => ({
		label: resolveLocale(s.label, locale),
		href: s.href
	}));

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<div class="error-page flex flex-col px-4">
	<!-- Top hazard tape -->
	<div class="hazard-tape w-full" data-testid="hazard-tape"></div>

	<!-- Centered content area — fills space between tapes -->
	<div class="flex flex-1 flex-col items-center justify-center gap-5 py-4 sm:gap-6">
		<!-- Construction scene SVG — big and prominent -->
		<div class="w-full max-w-sm sm:max-w-md">
			<ConstructionScene />
		</div>

		<!-- Error text block -->
		<div class="flex flex-col items-center gap-2 text-center sm:gap-3">
			<!-- Monospace label -->
			<span
				class="font-mono text-xs tracking-[3px] sm:text-sm"
				style="color: rgba(224, 120, 0, 0.6);"
			>
				{label}
			</span>

			<!-- Heading -->
			<h1 class="max-w-lg text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl">
				{heading}
			</h1>

			<!-- Description -->
			<p class="max-w-md text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
				{description}
			</p>
		</div>

		<!-- Route suggestion buttons -->
		<div class="flex flex-wrap justify-center gap-3">
			{#each suggestions as suggestion, i}
				<a
					href={suggestion.href}
					class="suggestion-pill group flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.03] sm:text-base"
					class:suggestion-primary={i === 0}
					class:suggestion-secondary={i > 0}
				>
					<!-- Metro stop dot -->
					<span
						class="inline-block h-2 w-2 rounded-full transition-colors duration-200"
						class:bg-[var(--brand-primary)]={i === 0}
						class:metro-dot-hollow={i > 0}
					></span>
					{suggestion.label}
				</a>
			{/each}
		</div>

		<!-- Terminal status line -->
		<div
			class="font-mono text-xs sm:text-sm"
			data-testid="terminal-line"
		>
			<span style="color: #E07800;">$</span>
			<span style="color: #777;"> route </span>
			<span style="color: #777;">--status</span>
			<span style="color: #E07800;"> 404</span>
			<span style="color: #555;"> // requested path not in service</span>
			{#if mounted && !$prefersReducedMotion}
				<TerminalCursor />
			{/if}
		</div>
	</div>

	<!-- Bottom hazard tape -->
	<div class="hazard-tape w-full" data-testid="hazard-tape"></div>
</div>

<style>
	.error-page {
		/* Fill exactly: viewport minus nav top padding (pt-20 = 5rem) */
		height: calc(100dvh - 5rem);
		min-height: 0;
	}

	.hazard-tape {
		height: 4px;
		flex-shrink: 0;
		background: repeating-linear-gradient(
			-45deg,
			#FFB627 0px,
			#FFB627 8px,
			#0a0a0a 8px,
			#0a0a0a 16px
		);
		border-radius: 1px;
	}

	.suggestion-primary {
		background: rgba(224, 120, 0, 0.08);
		border: 1px solid rgba(224, 120, 0, 0.3);
		color: var(--brand-primary);
	}

	.suggestion-primary:hover {
		background: rgba(224, 120, 0, 0.15);
		border-color: rgba(224, 120, 0, 0.6);
	}

	.suggestion-secondary {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--text-secondary);
	}

	/* All links turn orange on hover */
	.suggestion-secondary:hover {
		border-color: rgba(224, 120, 0, 0.4);
		color: var(--brand-primary);
	}

	.suggestion-secondary:hover .metro-dot-hollow {
		background: var(--brand-primary);
		border-color: var(--brand-primary);
	}

	.metro-dot-hollow {
		background: transparent;
		border: 1.5px solid rgba(255, 255, 255, 0.2);
		transition: all 200ms;
	}
</style>
