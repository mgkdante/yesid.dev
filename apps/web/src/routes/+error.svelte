<script lang="ts">
	import { onMount } from 'svelte';
	import ErrorIllustration from '$lib/components/home/ErrorIllustration.svelte';
	import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';
	// slice-18i Phase 5 Task 5.4: error page copy is sourced from
	// $page.data.errorPage (pre-resolved by +layout.server.ts via
	// adapter.content.errorPage(0) — status 0 = generic-fallback row, served
	// from the static content layer post-27.2). If layout data is unavailable
	// (e.g., the adapter read threw), staticErrorPageContent is used as a
	// synchronous inline fallback so the page always renders something
	// meaningful.
	//
	// Slice 15a resolved the SEO half: root +layout.ts falls back to
	// getPageSeo('/__error', locale), so 404s ship noindex,nofollow server-side.
	import { page } from '$app/stores';
	import { errorPageContent as staticErrorPageContent } from '$lib/content';
	import type { ErrorPageContent } from '$lib/content/nav';
	import { resolveLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
	import { prefersReducedMotion } from '$lib/motion/stores';
	import { Separator } from '$lib/components/ui/separator';
	import { SectionLabel } from '$lib/components/brand';

	const locale = DEFAULT_LOCALE;

	// Prefer the status-specific row resolved by handleError (stashed on
	// $page.error.cmsErrorPage). Fall back to the layout's status=0 fallback
	// row ($page.data.errorPage), then to the static inline fixture.
	const errorPage: ErrorPageContent = $derived(
		$page.error?.cmsErrorPage ?? $page.data?.errorPage ?? staticErrorPageContent,
	);

	const label = $derived(resolveLocale(errorPage.label, locale));
	const heading = $derived(resolveLocale(errorPage.heading, locale));
	const description = $derived(resolveLocale(errorPage.description, locale));
	const terminalLine = $derived(errorPage.terminalLine);
	const suggestions = $derived(
		errorPage.suggestions.map((s) => ({
			label: resolveLocale(s.label, locale),
			href: s.href,
		})),
	);

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<div class="error-page flex flex-col px-[var(--space-page-x)]">
	<!-- Top hazard tape -->
	<div data-testid="hazard-tape"><Separator variant="hazard" /></div>

	<!-- Centered content area — fills space between tapes -->
	<div class="flex flex-1 flex-col items-center justify-center gap-5 py-4 sm:gap-6">
		<!-- Construction scene SVG — big and prominent -->
		<div class="w-full max-w-sm sm:max-w-md">
			<ErrorIllustration />
		</div>

		<!-- Error text block -->
		<div class="flex flex-col items-center gap-2 text-center sm:gap-3">
			<!-- Monospace label -->
			<div data-testid="error-label">
				<SectionLabel text={label} variant="station" />
			</div>

			<!-- Heading -->
			<h1 class="max-w-lg text-2xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
				{heading}
			</h1>

			<!-- Description -->
			<p class="max-w-md text-base leading-relaxed text-[var(--secondary-foreground)] sm:text-lg">
				{description}
			</p>
		</div>

		<!-- Route suggestion buttons -->
		<div class="flex flex-wrap justify-center gap-3">
			{#each suggestions as suggestion, i}
				<a
					href={suggestion.href}
					data-testid="error-suggestion-link"
					class="suggestion-pill group flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.03] sm:text-base"
					class:suggestion-primary={i === 0}
					class:suggestion-secondary={i > 0}
				>
					<!-- Metro stop dot -->
					<span
						class="inline-block h-2 w-2 rounded-full transition-colors duration-200"
						class:bg-[var(--primary)]={i === 0}
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
			<span style="color: var(--primary);">$</span>
			<span style="color: var(--secondary-foreground);"> route </span>
			<span style="color: var(--secondary-foreground);">--status</span>
			<span style="color: var(--primary);"> {$page.status}</span>
			<span style="color: var(--muted-foreground);"> // requested path not in service</span>
			{#if mounted && !$prefersReducedMotion}
				<TerminalCursor />
			{/if}
		</div>
	</div>

	<!-- Bottom hazard tape -->
	<div data-testid="hazard-tape"><Separator variant="hazard" /></div>
</div>

<style>
	.error-page {
		/* Fill exactly: viewport minus nav top padding (pt-20 = 5rem) */
		height: calc(100dvh - 5rem);
		min-height: 0;
	}


	.suggestion-primary {
		background: color-mix(in srgb, var(--primary) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
		color: var(--primary);
	}

	.suggestion-primary:hover {
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		border-color: color-mix(in srgb, var(--primary) 60%, transparent);
	}

	.suggestion-secondary {
		background: color-mix(in srgb, var(--foreground) 3%, transparent);
		border: 1px solid color-mix(in srgb, var(--foreground) 10%, transparent);
		color: var(--secondary-foreground);
	}

	/* All links turn orange on hover */
	.suggestion-secondary:hover {
		border-color: color-mix(in srgb, var(--primary) 40%, transparent);
		color: var(--primary);
	}

	.suggestion-secondary:hover .metro-dot-hollow {
		background: var(--primary);
		border-color: var(--primary);
	}

	.metro-dot-hollow {
		background: transparent;
		border: 1.5px solid var(--border-subtle);
		transition: all var(--duration-normal);
	}
</style>
