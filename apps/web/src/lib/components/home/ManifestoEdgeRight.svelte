<!--
  ManifestoEdgeRight — construction stripes + right edge coordinates.
  Parent GSAP timeline targets these via class selectors.
-->
<script lang="ts">
	let {
		lat, lng, src, via, dst, node, status,
	}: {
		lat: string; lng: string; src: string; via: string;
		dst: string; node: string; status: string;
	} = $props();
</script>

<!-- Construction stripes (4 corners) -->
<div class="manifesto__stripe manifesto__stripe--tl"></div>
<div class="manifesto__stripe manifesto__stripe--br"></div>
<div class="manifesto__stripe manifesto__stripe--tr"></div>
<div class="manifesto__stripe manifesto__stripe--bl"></div>

<!-- Right edge coordinates + easter eggs -->
<div data-testid="manifesto-edge-right" class="manifesto__edge-right">
	<span class="manifesto__coord">{lat}</span>
	<span class="manifesto__coord">{lng}</span>
	<span class="manifesto__separator-line"></span>
	<span class="manifesto__coord manifesto__coord--value">{src}</span>
	<span class="manifesto__coord manifesto__coord--value">{via}</span>
	<span class="manifesto__coord manifesto__coord--value">{dst}</span>
	<span class="manifesto__separator-line"></span>
	<span class="manifesto__coord">{node}</span>
	<span class="manifesto__coord">{status}</span>
</div>

<style>
	/* ── Construction Stripes ────────────────────────────────────── */
	.manifesto__stripe {
		position: absolute;
		overflow: hidden;
		z-index: calc(var(--z-content) + 1);
	}

	.manifesto__stripe::before {
		content: '';
		position: absolute;
	}

	.manifesto__stripe--tl { top: 0; left: 0; width: 240px; height: 240px; }
	.manifesto__stripe--tl::before {
		width: 480px; height: 480px; top: -240px; left: -240px;
		background: repeating-linear-gradient(-45deg, var(--hazard-a) 0px, var(--hazard-a) 12px, var(--hazard-b) 12px, var(--hazard-b) 24px);
		opacity: var(--opacity-subtle);
	}

	.manifesto__stripe--br { bottom: 0; right: 0; width: 240px; height: 240px; }
	.manifesto__stripe--br::before {
		width: 480px; height: 480px; bottom: -240px; right: -240px;
		background: repeating-linear-gradient(-45deg, var(--hazard-a) 0px, var(--hazard-a) 12px, var(--hazard-b) 12px, var(--hazard-b) 24px);
		opacity: var(--opacity-subtle);
	}

	.manifesto__stripe--tr { top: 0; right: 0; width: 110px; height: 110px; }
	.manifesto__stripe--tr::before {
		width: 220px; height: 220px; top: -130px; right: -130px;
		background: repeating-linear-gradient(45deg, var(--hazard-a) 0px, var(--hazard-a) 7px, var(--hazard-b) 7px, var(--hazard-b) 14px);
		opacity: var(--opacity-faint);
	}

	.manifesto__stripe--bl { bottom: 0; left: 0; width: 110px; height: 110px; }
	.manifesto__stripe--bl::before {
		width: 220px; height: 220px; bottom: -130px; left: -130px;
		background: repeating-linear-gradient(45deg, var(--hazard-a) 0px, var(--hazard-a) 7px, var(--hazard-b) 7px, var(--hazard-b) 14px);
		opacity: var(--opacity-faint);
	}

	/* ── Edge: Right ─────────────────────────────────────────────── */
	.manifesto__edge-right {
		position: absolute;
		right: 20px;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		gap: 6px;
		z-index: calc(var(--z-content) + 2);
	}

	.manifesto__coord {
		font-family: var(--font-mono);
		font-size: 9px;
		letter-spacing: 1px;
		color: var(--primary); opacity: var(--chrome-ink-opacity);
		text-transform: uppercase;
		white-space: nowrap;
	}

	.manifesto__coord--value {
		color: var(--primary); opacity: var(--chrome-ink-opacity);
	}

	.manifesto__separator-line {
		width: 24px;
		height: 1px;
		background: color-mix(in srgb, var(--primary) 20%, transparent);
		margin-block: 4px;
	}

	/* ── Responsive ──────────────────────────────────────────────── */
	@media (max-width: 640px) {
		.manifesto__edge-right { right: 8px; font-size: 7px; gap: 10px; }
		.manifesto__stripe--tl, .manifesto__stripe--br { width: 160px; height: 160px; }
		.manifesto__stripe--tr, .manifesto__stripe--bl { width: 80px; height: 80px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.manifesto__stripe,
		.manifesto__edge-right {
			opacity: 1;
			transform: none;
			translate: none;
		}
	}
</style>
