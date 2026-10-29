<script lang="ts">
	import { untrack } from 'svelte';
	import type { getLettering } from './annotation-lettering';
	let { lettering, width, height, x, y, arrow = '', tip = '', visible, ready, initiallyDrawn = false, sequential = false }: {
		lettering: ReturnType<typeof getLettering>;
		width: number; height: number; x: number; y: number;
		arrow?: string; tip?: string; visible: boolean; ready: boolean;
		initiallyDrawn?: boolean;
		sequential?: boolean;
	} = $props();
	const letterStep = $derived(sequential ? .28 : .16);
	let phase = $state<'hidden' | 'drawing' | 'drawn'>(untrack(() => initiallyDrawn ? 'drawn' : 'hidden'));
	$effect(() => {
		if (!visible || !ready) { phase = initiallyDrawn ? 'drawn' : 'hidden'; return; }
		if (sequential) { phase = 'drawing'; return; }
		phase = 'hidden';
		// Let pin teardown, scroll anchoring and glyph measurement finish before
		// starting the clock. Hidden strokes are undrawn, never completed ink.
		let frame = requestAnimationFrame(() => {
			frame = requestAnimationFrame(() => { phase = 'drawing'; });
		});
		return () => cancelAnimationFrame(frame);
	});
</script>

<svg class="annotation" class:ready class:drawing={phase === 'drawing'} class:drawn={phase === 'drawn'}
	class:available={visible && ready} class:sequential
	class:concealed={!visible || (!initiallyDrawn && (!ready || phase === 'hidden'))}
	style="--arrow-delay: {(lettering.letters.at(-1)?.index ?? 0) * letterStep + 0.32}s"
	data-testid="hero-dot-annotation" viewBox="0 0 {width || 1} {height || 1}"
	aria-hidden="true" focusable="false" fill="none" stroke="currentColor"
	stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
	onanimationend={event => { if (phase === 'drawing' && ((event.target as SVGElement).classList.contains('tip') || (!tip && (event.target as SVGElement).getAttribute('data-last') === 'true'))) phase = 'drawn'; }}>
	<g data-testid="hero-annotation-label" transform="translate({x} {y}) rotate({lettering.tilt}) scale({lettering.scale}) translate(0 -16)">
		<title>{lettering.label}</title>
		{#each lettering.letters as letter, i}
			<path class="letter" data-testid="hero-annotation-letter" d={letter.d}
				data-last={i === lettering.letters.length - 1}
				transform="translate({letter.x} {letter.y})" pathLength="1" style="--delay: {letter.index * letterStep}s" />
		{/each}
	</g>
	{#if arrow}<path class="arrow" data-testid="hero-annotation-arrow" d={arrow} pathLength="1" />{/if}
	{#if tip}<path class="tip" data-testid="hero-annotation-tip" d={tip} pathLength="1" />{/if}
</svg>

<style>
	.annotation { position: absolute; inset: 0; width: 100%; height: 100%; color: var(--primary); pointer-events: none; }
	.concealed { visibility: hidden; }
	path { stroke-dasharray: 1; stroke-dashoffset: 1; }
	.sequential .letter { opacity: 0; }
	.sequential.drawn .letter { opacity: 1; }
	.ready.drawing.sequential .letter { animation-name: write-letter; }
	.ready.drawing .letter { animation: draw 0.28s linear var(--delay) both; }
	.ready.drawing .arrow { animation: draw 0.75s ease-out var(--arrow-delay) both; }
	.ready.drawing .tip { animation: draw 0.2s ease-out calc(var(--arrow-delay) + 0.75s) both; }
	.drawn path { animation: none; stroke-dashoffset: 0; }
	@keyframes write-letter { from { stroke-dashoffset: 1; opacity: 0; } 1% { opacity: 1; } to { stroke-dashoffset: 0; opacity: 1; } }
	@keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
	@media (prefers-reduced-motion: reduce) {
		.available { visibility: visible; }
		.sequential.available .letter { opacity: 1; }
		.available path { animation: none; stroke-dashoffset: 0; }
		.ready.drawing .letter, .ready.drawing.sequential .letter, .ready.drawing .arrow, .ready.drawing .tip { animation: none; stroke-dashoffset: 0; }
	}
</style>
