<script lang="ts">
	import type { Service } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { localizeHref } from '#lib/utils/locale-routing.ts';
	import { siteLabels } from '#lib/content/index.ts';
	import { Separator } from '@yesid/ui/separator';
	import * as Tabs from '@yesid/ui/tabs';
	import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';
	import { scrollChain } from '@yesid/motion/actions';
	import { onMount, onDestroy } from 'svelte';

	// Keyed pages remount, so the initialization-time locale stays current.
	const locale = getLocale();
	const serviceNavAria = resolveLocale(siteLabels.servicesChrome.detail.serviceNavAria, locale);

	let {
		services,
		activeId,
		mode = 'scroll',
		onSelect
	}: {
		services: readonly Service[];
		activeId: string;
		mode?: 'scroll' | 'navigate';
		onSelect?: (id: string) => void;
	} = $props();

	let sorted = $derived([...services].sort((a, b) => a.station - b.station));

	let activeIndex = $derived(sorted.findIndex((s) => s.id === activeId));

	function padStation(n: number): string {
		return String(n).padStart(2, '0');
	}

	const stationShortLabels = siteLabels.servicesChrome.listing.stationShortLabels;

	function getLabel(service: Service): string {
		const short = stationShortLabels[service.id as keyof typeof stationShortLabels];
		if (short) return resolveLocale(short, locale);
		return resolveLocale(service.title, locale);
	}

	// The 0.8 opacity floor keeps inactive tabs readable.
	function getOpacity(index: number): number {
		if (activeIndex === -1) return 1;
		const distance = Math.abs(index - activeIndex);
		return Math.max(0.8, 1 - distance * 0.15);
	}

	// Disable tab clicks during swipes regardless of event ordering.
	let swipeActive = $state(false);
	let touchStartX = 0;

	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		swipeActive = false;
	}

	function onTouchMove(e: TouchEvent) {
		if (!swipeActive && Math.abs(e.touches[0].clientX - touchStartX) > 8) {
			swipeActive = true;
		}
	}

	function onTouchEnd() {
		if (swipeActive) {
			// Delay reset so the post-touch click event is still blocked
			setTimeout(() => { swipeActive = false; }, 300);
		}
	}

	// scrollChain for Tabs.List (bits-ui component — can't use use: directly on components)
	let tabsListRef = $state<HTMLElement | null>(null);

	let navRef = $state<HTMLElement | null>(null);
	let tabsListScrollChain: { destroy(): void } | undefined;

	// Center only the tab container; listing scroll updates must never move the window.
	$effect(() => {
		const container = tabsListRef ?? navRef;
		if (!container || !activeId) return;
		const activeEl = container.querySelector<HTMLElement>(
			`[data-testid="station-tab-${activeId}"]`,
		);
		if (!activeEl) return;
		const cRect = container.getBoundingClientRect();
		const aRect = activeEl.getBoundingClientRect();
		const delta = aRect.left - cRect.left - (container.clientWidth - activeEl.clientWidth) / 2;
		if (Math.abs(delta) < 1) return;
		const reduce = isPrefersReducedMotion();
		container.scrollTo({ left: container.scrollLeft + delta, behavior: reduce ? 'auto' : 'smooth' });
	});

	onMount(() => {
		if (tabsListRef) {
			tabsListScrollChain = scrollChain(tabsListRef);
		}
	});

	onDestroy(() => {
		tabsListScrollChain?.destroy();
	});
</script>

{#snippet tabContent(service: Service, isActive: boolean)}
	<span class="station-num font-mono text-xs" class:text-brand={isActive}>{padStation(service.station)}</span>
	<span class="station-label text-sm" class:font-bold={isActive}>{getLabel(service)}</span>
{/snippet}

<Separator variant="hazard" hazardSize="sm" />

{#if mode === 'navigate'}

	<div class="station-tabs-wrapper">
		<nav
			bind:this={navRef}
			aria-label={serviceNavAria}
			class="station-tabs flex w-full overflow-x-auto p-[3px] justify-start xl:justify-center"
			class:swipe-lock={swipeActive}
			use:scrollChain
			ontouchstart={onTouchStart}
			ontouchmove={onTouchMove}
			ontouchend={onTouchEnd}
		>
			{#each sorted as service, i (service.id)}
				{@const isActive = service.id === activeId}
				{@const opacity = isActive ? 1 : getOpacity(i)}

				<a
					href={localizeHref(`/services/${service.id}`, locale)}
					class="station-tab flex shrink-0 items-center gap-2 px-4 py-3 text-sm no-underline transition-all tap-press"

					class:active={isActive}
					style="opacity: {opacity};"
					data-testid="station-tab-{service.id}"
					data-active={isActive ? 'true' : undefined}
				>
					{@render tabContent(service, isActive)}
				</a>
			{/each}
		</nav>

		<div class="scroll-cue" aria-hidden="true"></div>
	</div>
{:else}

	<Tabs.Root
		value={activeId}
		onValueChange={(v) => onSelect?.(v)}
		class="station-tabs-root"
	>
		<Tabs.List
			bind:ref={tabsListRef}
			variant="line"
			class="station-tabs flex w-full overflow-x-auto p-[3px] justify-start xl:justify-center {swipeActive ? 'swipe-lock' : ''}"
			ontouchstart={onTouchStart}
			ontouchmove={onTouchMove}
			ontouchend={onTouchEnd}
		>
			{#each sorted as service, i (service.id)}
				{@const isActive = service.id === activeId}
				{@const opacity = isActive ? 1 : getOpacity(i)}

				<Tabs.Trigger value={service.id}>
					{#snippet child({ props })}
						<button
							{...props}
							class="station-tab flex shrink-0 items-center gap-2 px-4 py-3 text-sm transition-all tap-press"
							class:active={isActive}
							style="opacity: {opacity};"
							data-testid="station-tab-{service.id}"
							data-active={isActive ? 'true' : undefined}
						>
							{@render tabContent(service, isActive)}
						</button>
					{/snippet}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>
	</Tabs.Root>
{/if}

<style>
	:global(.station-tabs) {
		background: var(--primary);
		border: none;
	}

	/* Tabs.Root adds gap-2 + flex-col by default; flatten for our horizontal layout */
	:global([data-slot="tabs"].station-tabs-root) {
		gap: 0;
	}

	/* Each tab needs min-width so tabs don't collapse on narrow viewports */
	.station-tab {
		min-width: max-content;
		cursor: pointer;
		border-bottom: 3px solid transparent;
		color: var(--background);
		background: transparent;
		border-top: none;
		border-left: none;
		border-right: none;
		min-height: 44px;
		padding: calc((var(--strip-h) - 12px - 1.25rem) / 2) 1.25rem;
		font-family: var(--font-mono);
		font-size: var(--text-small);
		line-height: 1.25rem;
		transition: opacity var(--duration-fast) var(--ease-default);
	}

	/* The active signage chip keeps the same readable colors in both themes. */
	.station-tab.active {
		background: var(--signage-bg);
		border-bottom-color: var(--signage-text);
		color: var(--signage-text);
		font-weight: 800;
	}

	.station-tab:not(.active):hover {
		opacity: 0.7;
	}

	.text-brand {
		color: var(--signage-text);
	}

	.station-num {
		font-family: var(--font-mono);
	}

	/* Swipe guard: disable all pointer events on tabs during horizontal swipe.
	   Prevents click/pointerdown from firing on buttons or links mid-swipe. */
	.swipe-lock .station-tab {
		pointer-events: none;
	}

	.station-tabs-wrapper {
		position: relative;
	}

	/* The overlay signals horizontal overflow without blocking tab clicks. */
	.scroll-cue {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 3rem;
		/* End-stop MUST match the .station-tabs nav background (both var(--primary)),
		   so the cue fades tab content into the strip. Update both together if either changes. */
		background: linear-gradient(to right, transparent, var(--primary));
		pointer-events: none;
	}

	@media (min-width: 1280px) {
		.scroll-cue {
			display: none;
		}
	}
</style>
