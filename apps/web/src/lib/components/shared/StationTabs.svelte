<script lang="ts">
	import type { Service } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { localizeHref } from '#lib/utils/locale-routing.ts';
	import { siteLabels } from '#lib/content/index.ts';
	import { orderServices, stationNumber } from '#lib/utils/station.ts';
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

	let sorted = $derived(orderServices(services));

	let activeIndex = $derived(sorted.findIndex((s) => s.id === activeId));

	const stationShortLabels = siteLabels.servicesChrome.listing.stationShortLabels;

	function getLabel(service: Service): string {
		const short = stationShortLabels[service.id as keyof typeof stationShortLabels];
		if (short) return resolveLocale(short, locale);
		return resolveLocale(service.title, locale);
	}

	// Rendered light-theme contrast stays above 4.5:1 at the 0.9 floor.
	function getOpacity(index: number): number {
		if (activeIndex === -1) return 1;
		const distance = Math.abs(index - activeIndex);
		return Math.max(0.9, 1 - distance * 0.05);
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

{#snippet tabContent(service: Service, isActive: boolean, index: number)}
	<span class="station-num font-mono text-xs">{stationNumber(index)}</span>
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
					class="station-tab flex shrink-0 items-center gap-2 px-4 py-3 text-sm no-underline tap-press"

					aria-current={isActive ? 'page' : undefined}
					style="--station-distance-opacity: {opacity};"
					data-testid="station-tab-{service.id}"
					data-active={isActive ? 'true' : undefined}
				>
					{@render tabContent(service, isActive, i)}
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
							class="station-tab flex shrink-0 items-center gap-2 px-4 py-3 text-sm tap-press"
							style="--station-distance-opacity: {opacity};"
							data-testid="station-tab-{service.id}"
							data-active={isActive ? 'true' : undefined}
						>
							{@render tabContent(service, isActive, i)}
						</button>
					{/snippet}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>
	</Tabs.Root>
{/if}

<style>
	/* Tabs.Root adds gap-2 + flex-col by default; flatten for our horizontal layout */
	:global([data-slot="tabs"].station-tabs-root) {
		gap: 0;
	}

	/* Each tab needs min-width so tabs don't collapse on narrow viewports */
	.station-tab {
		flex-grow: 0;
		min-width: max-content;
		padding: calc((var(--strip-h) - 12px - 1.25rem) / 2) 1.25rem;
		line-height: 1.25rem;
	}

	.station-tab:not(:hover, :focus-visible, :active) {
		opacity: var(--station-distance-opacity);
	}

	/* Swipe guard: disable all pointer events on tabs during horizontal swipe.
	   Prevents click/pointerdown from firing on buttons or links mid-swipe. */
	:global(.swipe-lock) .station-tab {
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
		:global(.station-tabs) {
			justify-content: center;
		}

		.scroll-cue {
			display: none;
		}
	}
</style>
