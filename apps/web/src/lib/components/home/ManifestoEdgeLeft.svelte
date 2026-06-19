<!--
  ManifestoEdgeLeft — beck-style route lines, transit roundels, left edge readouts.
  Parent GSAP timeline targets these via class selectors.
-->
<script lang="ts">
	let {
		sectionNumber,
		sectionName,
		location,
		hiddenLines,
	}: {
		sectionNumber: string;
		sectionName: string;
		location: string;
		hiddenLines: { name: string; color: string }[];
	} = $props();
</script>

<!-- Beck-style route lines (decorative) -->
<div class="manifesto__beck-line manifesto__beck-h" style="top:120px;left:0;width:160px;"></div>
<div class="manifesto__beck-line manifesto__beck-d45" style="top:120px;left:160px;width:80px;"></div>
<div class="manifesto__beck-line manifesto__beck-h" style="top:64px;left:217px;width:100px;opacity:0.04;"></div>
<div class="manifesto__beck-line manifesto__beck-v" style="right:120px;top:0;height:200px;"></div>
<div class="manifesto__beck-line manifesto__beck-d135" style="top:200px;right:120px;width:70px;"></div>
<div class="manifesto__beck-line manifesto__beck-h" style="bottom:160px;right:0;width:180px;"></div>
<div class="manifesto__beck-line manifesto__beck-d45" style="bottom:160px;right:180px;width:60px;"></div>
<div class="manifesto__beck-line manifesto__beck-v" style="left:160px;bottom:0;height:180px;"></div>
<div class="manifesto__beck-line manifesto__beck-d45" style="bottom:180px;left:160px;width:70px;"></div>

<!-- Transit line roundels (easter eggs) -->
{#each hiddenLines as line, i}
	<div
		class="manifesto__roundel manifesto__roundel--transit manifesto__roundel--t{i}"
		aria-hidden="true"
		style="--line-color: {line.color}; --line-color-border: {line.color}40; --line-color-bg: {line.color}1A; --line-color-text: {line.color};"
	>
		<span class="manifesto__roundel-dot"></span>
		<span class="manifesto__roundel-name">{line.name}</span>
	</div>
{/each}

<!-- Left edge readouts -->
<div data-testid="manifesto-edge-left" class="manifesto__edge-left">
	<span class="manifesto__readout">{sectionNumber}</span>
	<span class="manifesto__dot-active"></span>
	<span class="manifesto__readout">{sectionName}</span>
	<span class="manifesto__dot-inactive"></span>
	<span class="manifesto__dot-inactive"></span>
	<span class="manifesto__readout">{location}</span>
</div>

<style>
	/* ── Beck-style Route Lines ──────────────────────────────────── */
	.manifesto__beck-line {
		position: absolute;
		background: color-mix(in srgb, var(--primary) 14%, transparent);
		z-index: var(--z-content);
	}

	.manifesto__beck-h { height: 2px; }
	.manifesto__beck-v { width: 2px; }
	.manifesto__beck-d45 { height: 2px; transform-origin: left center; transform: rotate(-45deg); }
	.manifesto__beck-d135 { height: 2px; transform-origin: left center; transform: rotate(45deg); }

	/* ── Roundels (transit line easter eggs) ─────────────────────── */
	.manifesto__roundel {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 1px;
		z-index: calc(var(--z-content) + 1);
		white-space: nowrap;
		pointer-events: none;
	}

	.manifesto__roundel-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 1.5px solid var(--line-color-border);
		background: var(--line-color-bg);
		flex-shrink: 0;
	}

	/* Line names: the FULL line colour, dimmed through the same --chrome-ink-opacity
	   as the orange coordinate chrome. (The old --line-color-text baked a 20% alpha
	   `33` suffix, so the colored names read ~3x fainter than the orange labels —
	   that's why orange looked sharper.) The dot keeps its own faint fill/stroke as
	   the colour accent. */
	.manifesto__roundel-name { color: var(--line-color-text); opacity: var(--chrome-ink-opacity); }

	/* Scattered positions — 9 transit lines around edges */
	.manifesto__roundel--t0 { left: 155px; top: 116px; }
	.manifesto__roundel--t1 { right: 115px; top: 195px; }
	.manifesto__roundel--t2 { right: 178px; bottom: 210px; }
	.manifesto__roundel--t3 { left: 155px; bottom: 176px; }
	.manifesto__roundel--t4 { left: 260px; top: 60px; }
	.manifesto__roundel--t5 { right: 80px; top: 80px; }
	.manifesto__roundel--t6 { left: 80px; top: 260px; }
	.manifesto__roundel--t7 { right: 200px; bottom: 128px; }
	.manifesto__roundel--t8 { left: 300px; bottom: 100px; }

	/* ── Edge: Left ──────────────────────────────────────────────── */
	.manifesto__edge-left {
		position: absolute;
		left: 20px;
		top: 50%;
		transform: translateY(-50%);
		writing-mode: vertical-rl;
		display: flex;
		align-items: center;
		gap: 16px;
		z-index: calc(var(--z-content) + 2);
	}

	.manifesto__readout {
		font-family: var(--font-mono);
		font-size: 9px;
		letter-spacing: 3px;
		color: var(--primary); opacity: var(--chrome-ink-opacity);
		text-transform: uppercase;
	}

	.manifesto__dot-active {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--primary);
		box-shadow: 0 0 8px color-mix(in srgb, var(--glow) 40%, transparent);
		flex-shrink: 0;
	}

	.manifesto__dot-inactive {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
		flex-shrink: 0;
	}

	/* ── Responsive ──────────────────────────────────────────────── */
	@media (max-width: 640px) {
		.manifesto__edge-left { left: 8px; font-size: 7px; gap: 16px; }
	}

	@media (max-width: 768px) {
		.manifesto__beck-line { display: none; }
		.manifesto__roundel { font-size: 7px; }
		.manifesto__roundel-dot { width: 8px; height: 8px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.manifesto__beck-line,
		.manifesto__roundel,
		.manifesto__edge-left {
			opacity: 1;
			transform: none;
			translate: none;
		}
	}
</style>
