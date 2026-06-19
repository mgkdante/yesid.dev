<!--
  ManifestoEdgeTop — measurement tick marks along top edge.
  Parent GSAP timeline targets .manifesto__edge-top.
-->
<script lang="ts">
	let { ticks }: { ticks: readonly string[] } = $props();
</script>

<div data-testid="manifesto-edge-top" class="manifesto__edge-top">
	{#each ticks as tick}
		<div class="manifesto__tick">
			<div class="manifesto__tick-line"></div>
			<span class="manifesto__tick-label">{tick}</span>
		</div>
	{/each}
</div>

<style>
	.manifesto__edge-top {
		position: absolute;
		top: 16px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 80px;
		z-index: calc(var(--z-content) + 2);
	}

	.manifesto__tick {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.manifesto__tick-line {
		width: 1px;
		height: 12px;
		background: color-mix(in srgb, var(--primary) 22%, transparent);
	}

	.manifesto__tick-label {
		font-family: var(--font-mono);
		font-size: 8px;
		letter-spacing: 1px;
		color: var(--primary); opacity: var(--chrome-ink-opacity);
	}

	@media (prefers-reduced-motion: reduce) {
		.manifesto__edge-top { opacity: 1; transform: translateX(-50%); translate: none; }
	}
</style>
