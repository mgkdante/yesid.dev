<script lang="ts" module>
	const glyphs: Record<string, { d: string; width: number; end: [number, number] }> = {
		c: { d: 'M10 6 C0 0 -2 19 10 15', width: 11, end: [10, 15] },
		l: { d: 'M6 0 4 15', width: 8, end: [4, 15] },
		i: { d: 'M6 1 6.1 .5 M5 6 4 15', width: 8, end: [4, 15] },
		k: { d: 'M5 0 3 15 M4 9 11 5 M5 10 11 16', width: 12, end: [11, 16] },
		m: { d: 'M1 15 3 5 2 9 Q10 -2 9 15 M9 8 Q17 -2 16 15', width: 18, end: [16, 15] },
		e: { d: 'M2 10 Q14 9 9 5 C2 1 -3 19 10 15', width: 11, end: [10, 15] },
		q: { d: 'M10 6 C2 1 -3 18 7 15 L11 5 8 23', width: 12, end: [8, 23] },
		u: { d: 'M2 5 C-2 20 9 20 11 5 L9 16', width: 12, end: [9, 16] },
		h: { d: 'M4 0 1 15 M2 10 Q12 0 10 15', width: 12, end: [10, 15] },
		a: { d: 'M9 6 C2 0 -4 17 5 15 L10 5 8 16', width: 12, end: [8, 16] },
		z: { d: 'M1 6 11 5 0 16 11 15', width: 12, end: [11, 15] },
	};
	export function getLettering(label: string) {
		let width = 0;
		let end = { x: 0, y: 0 };
		const letters = [...label].flatMap((letter, index) => {
			if (letter === ' ') { width += 7; return []; }
			const glyph = glyphs[letter];
			const path = { d: glyph.d, x: width, index };
			end = { x: width + glyph.end[0], y: glyph.end[1] };
			width += glyph.width;
			return [path];
		});
		const scale = 0.85;
		const tilt = -6;
		const angle = tilt * Math.PI / 180;
		const endX = end.x * scale;
		const endY = (end.y - 16) * scale;
		return { label, letters, width: width * scale, scale, tilt,
			end: { x: endX * Math.cos(angle) - endY * Math.sin(angle), y: endX * Math.sin(angle) + endY * Math.cos(angle) } };
	}
</script>

<script lang="ts">
	let { lettering, width, height, x, y, arrow, tip, visible, ready }: {
		lettering: ReturnType<typeof getLettering>;
		width: number; height: number; x: number; y: number;
		arrow: string; tip: string; visible: boolean; ready: boolean;
	} = $props();
	let drawn = $state(false);
	$effect(() => { drawn = !visible; });
</script>

<svg class="annotation" class:ready class:drawn class:concealed={!visible || !ready}
	data-testid="hero-dot-annotation" viewBox="0 0 {width || 1} {height || 1}"
	aria-hidden="true" focusable="false" fill="none" stroke="currentColor"
	stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
	onanimationend={event => { if ((event.target as SVGElement).classList.contains('tip')) drawn = true; }}>
	<g data-testid="hero-annotation-label" transform="translate({x} {y}) rotate({lettering.tilt}) scale({lettering.scale}) translate(0 -16)">
		<title>{lettering.label}</title>
		{#each lettering.letters as letter}
			<path class="letter" data-testid="hero-annotation-letter" d={letter.d}
				transform="translate({letter.x} 0)" pathLength="1" style="--delay: {letter.index * 0.06}s" />
		{/each}
	</g>
	<path class="arrow" data-testid="hero-annotation-arrow" d={arrow} pathLength="1" />
	<path class="tip" data-testid="hero-annotation-tip" d={tip} pathLength="1" />
</svg>

<style>
	.annotation { position: absolute; inset: 0; width: 100%; height: 100%; color: var(--primary); pointer-events: none; }
	.concealed { visibility: hidden; }
	path { stroke-dasharray: 1; stroke-dashoffset: 0; }
	.ready .letter { animation: draw 0.24s linear var(--delay) both; }
	.ready .arrow { animation: draw 0.75s ease-out 0.8s both; }
	.ready .tip { animation: draw 0.2s ease-out 1.55s both; }
	.ready.drawn path { animation: none; stroke-dashoffset: 0; }
	@keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
	@media (prefers-reduced-motion: reduce) {
		.ready .letter, .ready .arrow, .ready .tip { animation: none; stroke-dashoffset: 0; }
	}
</style>
