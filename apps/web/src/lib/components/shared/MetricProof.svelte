<script lang="ts">
	import type { ImpactMetric, Locale } from '#lib/types.ts';
	import { localeCopy } from '#lib/locales/index.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { intl } from '#lib/utils/locale-context.ts';

	let { metric, locale }: { metric: ImpactMetric; locale: Locale } = $props();
	const id = $props.id();
	const copy = $derived(localeCopy[locale].metricProof);
	const name = $derived(`${copy.info}: ${resolveLocale(metric.label, locale)}`);
	const sources = $derived([
		...(metric.sourceUrl ? [{ label: copy.source, url: metric.sourceUrl }] : []),
		...(metric.sources ?? []),
	]);
	const date = $derived(metric.asOf ? intl.dateTime(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${metric.asOf}T00:00:00Z`)) : '');
	let trigger = $state<HTMLButtonElement>(null!);
	let panel = $state<HTMLSpanElement>(null!);
	let expanded = $state(false);
	let pinned = false;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;
	let frame = 0;

	function cancelClose() { clearTimeout(closeTimer); }

	function position() {
		if (!panel?.matches(':popover-open')) return;
		const anchor = trigger.getBoundingClientRect();
		const bounds = panel.getBoundingClientRect();
		const gutter = parseFloat(getComputedStyle(panel).paddingLeft);
		const viewport = window.visualViewport;
		const left = viewport?.offsetLeft ?? 0;
		const top = viewport?.offsetTop ?? 0;
		const width = viewport?.width ?? window.innerWidth;
		const height = viewport?.height ?? window.innerHeight;
		panel.style.left = `${Math.max(left + gutter, Math.min(anchor.right - bounds.width, left + width - bounds.width - gutter))}px`;
		const below = anchor.bottom + bounds.height <= top + height - gutter;
		panel.style.top = `${Math.max(top + gutter, Math.min(below ? anchor.bottom : anchor.top - bounds.height, top + height - bounds.height - gutter))}px`;
	}

	function hide() {
		cancelClose();
		panel?.hidePopover?.();
		pinned = false;
	}

	function hover(event: PointerEvent) {
		if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover)').matches || !panel?.showPopover) return;
		cancelClose();
		if (!panel.matches(':popover-open')) panel.showPopover();
		position();
	}

	function leave() {
		// Bridge the trigger/panel edge and diagonal pointer travel.
		if (!pinned && !panel?.contains(document.activeElement)) closeTimer = setTimeout(hide, 180);
	}

	function toggle(event: MouseEvent) {
		if (!panel?.showPopover) return;
		event.preventDefault();
		cancelClose();
		if (panel.matches(':popover-open') && (pinned || event.detail === 0)) hide();
		else {
			pinned = true;
			if (!panel.matches(':popover-open')) panel.showPopover();
			position();
		}
	}

	$effect(() => {
		if (!panel?.showPopover) return;
		const escape = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || !panel.matches(':popover-open')) return;
			event.preventDefault();
			hide();
			trigger.focus({ preventScroll: true });
		};
		window.addEventListener('keydown', escape);
		window.addEventListener('resize', position);
		// Rails and nested scroll containers do not bubble scroll events.
		window.addEventListener('scroll', position, true);
		window.visualViewport?.addEventListener('resize', position);
		window.visualViewport?.addEventListener('scroll', position);
		return () => {
			cancelClose();
			cancelAnimationFrame(frame);
			window.removeEventListener('keydown', escape);
			window.removeEventListener('resize', position);
			window.removeEventListener('scroll', position, true);
			window.visualViewport?.removeEventListener('resize', position);
			window.visualViewport?.removeEventListener('scroll', position);
		};
	});
</script>

{#if sources.length || metric.asOf}
	<span class="metric-proof" data-testid="metric-proof">
		<button bind:this={trigger} type="button" popovertarget={id} aria-label={name} data-open={expanded} aria-controls={id} onclick={toggle} onpointerenter={hover} onpointerleave={leave}>
			<span class="info-icon" aria-hidden="true">i</span>
		</button>
		<span bind:this={panel} {id} class="metric-proof-panel" popover="auto" role="group" aria-label={name}
			onbeforetoggle={(event) => {
				expanded = event.newState === 'open';
				if (expanded) frame = requestAnimationFrame(position);
				else { pinned = false; cancelClose(); }
			}}
			onpointerenter={cancelClose} onpointerleave={leave} onfocusin={cancelClose}
			onfocusout={(event) => { if (!panel.contains(event.relatedTarget as Node | null) && event.relatedTarget !== trigger) hide(); }}
		>
		{#each sources as source}
			<a href={source.url} aria-label="{source.label}: {resolveLocale(metric.label, locale)}" rel="noopener noreferrer">{source.label}</a>
		{/each}
		{#if metric.asOf}
			<time datetime={metric.asOf}>{copy.asOf} {date}</time>
		{/if}
		</span>
	</span>
{/if}

<style>
	.metric-proof { display: inline; font-size: var(--text-small); line-height: 1.5; letter-spacing: normal; text-transform: none; }
	button {
		display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;
		min-width: var(--size-tap-min); min-height: var(--size-tap-min); padding: 0;
		border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--foreground); cursor: pointer;
	}
	.info-icon { display: inline-flex; align-items: center; justify-content: center; width: 1em; height: 1em; border: 1px solid currentColor; border-radius: var(--radius-pill); font: bold var(--text-small)/1 var(--font-mono); }
	button:hover .info-icon, button[data-open='true'] .info-icon { color: var(--primary); }
	.metric-proof-panel {
		padding: 0.75rem; border: 1px solid var(--border-strong); border-radius: var(--radius-md);
		background: var(--background); color: var(--foreground); font: var(--text-small)/1.5 var(--font-body);
		letter-spacing: normal; text-transform: none; overflow-wrap: anywhere;
	}
	.metric-proof-panel:popover-open { display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; }
	@supports selector(:popover-open) {
		.metric-proof-panel { position: fixed; inset: auto; margin: 0; width: max-content; max-width: min(20rem, calc(100dvw - 3rem)); max-height: min(18rem, calc(100dvh - 3rem)); overflow: auto; }
		/* Native HTML activation works before hydration and with JS disabled. */
		.metric-proof-panel:not([style]) { inset: 0; margin: auto; height: fit-content; }
	}
	@supports not selector(:popover-open) { button { display: none; } }
	a { display: inline-flex; align-items: center; min-height: var(--size-tap-min); color: var(--foreground); text-decoration: underline; text-underline-offset: 0.2em; }
	button:focus-visible, a:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; border-radius: var(--radius-sm); }
	@media (forced-colors: active) {
		button, .metric-proof-panel { color: CanvasText; }
		.metric-proof-panel { background: Canvas; border-color: CanvasText; }
		a { color: LinkText; }
		button:focus-visible, a:focus-visible { outline-color: Highlight; }
	}
</style>
