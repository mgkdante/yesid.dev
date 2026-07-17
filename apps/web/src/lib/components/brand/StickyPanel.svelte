<!-- Kept as a yesid.dev compatibility wrapper per packages/ui/PARITY-NOTES.md. -->
<script lang="ts">
	import { StickyPanel as UiStickyPanel, type StickyPanelProps as UiStickyPanelProps } from '@yesid/ui/brand';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';

	export type StickyPanelProps = Omit<UiStickyPanelProps, 'class' | 'ref'>;

	let { children, top = '6rem', ...rest }: StickyPanelProps = $props();
	let panel = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!panel) return;
		const lifecycle = scrollChain(panel);
		return () => lifecycle?.destroy?.();
	});
</script>

<UiStickyPanel bind:ref={panel} class="yesid-sticky-panel" {top} {children} {...rest} />

<style>
	:global(.yesid-sticky-panel.yesid-sticky-panel.yesid-sticky-panel) {
		background: var(--surface-3);
		box-shadow: none;
	}
</style>
