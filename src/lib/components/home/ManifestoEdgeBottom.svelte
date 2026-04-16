<!--
  ManifestoEdgeBottom — data flow lines (h+v) + bottom status bar.
  Parent GSAP timeline targets .manifesto__edge-bottom, .manifesto__flow-line, .manifesto__flow-line-v.
-->
<script lang="ts">
	let {
		connected, line, url, version, scrollHint,
		hFlows, vFlows,
	}: {
		connected: string; line: string; url: string;
		version: string; scrollHint: string;
		hFlows: { y: number; w: number; dur: number; delay: number }[];
		vFlows: { x: number; h: number; dur: number; delay: number }[];
	} = $props();
</script>

<!-- Data flow lines — horizontal -->
{#each hFlows as flow}
	<div
		class="manifesto__flow-line"
		style="top:{flow.y}px;width:{flow.w}px;left:-{flow.w}px;animation-duration:{flow.dur}s;animation-delay:{flow.delay}s;"
	></div>
{/each}
<!-- Data flow lines — vertical -->
{#each vFlows as flow}
	<div
		class="manifesto__flow-line-v"
		style="left:{flow.x}px;height:{flow.h}px;top:-{flow.h}px;animation-duration:{flow.dur}s;animation-delay:{flow.delay}s;"
	></div>
{/each}

<!-- Bottom status bar -->
<div data-testid="manifesto-edge-bottom" class="manifesto__edge-bottom">
	<span class="manifesto__status-dot"></span>
	<span>{connected}</span>
	<span class="manifesto__separator"></span>
	<span>{line}</span>
	<span class="manifesto__separator"></span>
	<span>{url}</span>
	<span class="manifesto__separator"></span>
	<span>{version}</span>
	<span class="manifesto__separator"></span>
	<span>{scrollHint}</span>
</div>

<style>
	/* ── Data Flow Lines ─────────────────────────────────────────── */
	.manifesto__flow-line {
		position: absolute;
		height: 1px;
		background: linear-gradient(90deg,
			transparent 0%,
			color-mix(in srgb, var(--primary) 10%, transparent) 30%,
			color-mix(in srgb, var(--primary) 15%, transparent) 50%,
			color-mix(in srgb, var(--primary) 10%, transparent) 70%,
			transparent 100%
		);
		animation-name: flowRight;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		z-index: var(--z-content);
		opacity: 0;
	}

	.manifesto__flow-line-v {
		position: absolute;
		width: 1px;
		background: linear-gradient(180deg,
			transparent 0%,
			color-mix(in srgb, var(--accent) 8%, transparent) 30%,
			color-mix(in srgb, var(--accent) 12%, transparent) 50%,
			color-mix(in srgb, var(--accent) 8%, transparent) 70%,
			transparent 100%
		);
		animation-name: flowDown;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		z-index: var(--z-content);
		opacity: 0;
	}

	@keyframes flowRight {
		from { transform: translateX(0); }
		to { transform: translateX(calc(100vw + 400px)); }
	}

	@keyframes flowDown {
		from { transform: translateY(0); }
		to { transform: translateY(calc(100dvh + 200px)); }
	}

	/* ── Edge: Bottom ────────────────────────────────────────────── */
	.manifesto__edge-bottom {
		position: absolute;
		bottom: 16px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 20px;
		z-index: calc(var(--z-content) + 2);
		font-family: var(--font-mono);
		font-size: 9px;
		letter-spacing: 1px;
		color: color-mix(in srgb, var(--primary) 18%, transparent);
		white-space: nowrap;
		opacity: 0;
		translate: 0 8px;
	}

	.manifesto__status-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--primary) 30%, transparent);
		flex-shrink: 0;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.3; box-shadow: none; }
		50% { opacity: 1; box-shadow: 0 0 6px color-mix(in srgb, var(--primary) 40%, transparent); }
	}

	.manifesto__separator {
		width: 1px;
		height: 10px;
		background: color-mix(in srgb, var(--primary) 10%, transparent);
		flex-shrink: 0;
	}

	/* ── Responsive + Reduced Motion ─────────────────────────────── */
	@media (prefers-reduced-motion: reduce) {
		.manifesto__flow-line, .manifesto__flow-line-v { display: none; }
		.manifesto__edge-bottom { opacity: 1; transform: translateX(-50%); translate: none; }
		.manifesto__status-dot { animation: none; opacity: 1; }
	}
</style>
