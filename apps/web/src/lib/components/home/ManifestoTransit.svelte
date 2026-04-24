<!--
  ManifestoTransit — arrival countdown, chevron arrows, platform badges.
  Parent GSAP timeline targets .manifesto__arrival, .manifesto__chevrons, .manifesto__badge.
-->
<script lang="ts">
	let {
		arrivalLabel, countdownDisplay,
		platformBadge, directionBadge,
	}: {
		arrivalLabel: string; countdownDisplay: string;
		platformBadge: string; directionBadge: string;
	} = $props();
</script>

<!-- Arrival countdown -->
<div data-testid="manifesto-arrival" class="manifesto__arrival">
	<span class="manifesto__arr-label">{arrivalLabel}</span>
	<span class="manifesto__arr-time">{countdownDisplay}</span>
</div>

<!-- Chevrons -->
<div class="manifesto__chevrons manifesto__chevrons--right">
	<div class="manifesto__chevron"></div>
	<div class="manifesto__chevron"></div>
	<div class="manifesto__chevron"></div>
</div>
<div class="manifesto__chevrons manifesto__chevrons--down">
	<div class="manifesto__chevron"></div>
	<div class="manifesto__chevron"></div>
	<div class="manifesto__chevron"></div>
</div>

<!-- Platform badges -->
<div data-testid="manifesto-platform-badge" class="manifesto__badge manifesto__badge--platform">{platformBadge}</div>
<div data-testid="manifesto-direction-badge" class="manifesto__badge manifesto__badge--direction">{directionBadge}</div>

<style>
	/* ── Arrival ─────────────────────────────────────────────────── */
	.manifesto__arrival {
		position: absolute;
		left: 60px;
		bottom: 80px;
		z-index: calc(var(--z-content) + 2);
		font-family: var(--font-mono);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.manifesto__arr-label {
		font-size: 7px;
		letter-spacing: 2px;
		color: color-mix(in srgb, var(--primary) 15%, transparent);
		text-transform: uppercase;
	}

	.manifesto__arr-time {
		font-size: 18px;
		font-weight: 600;
		color: color-mix(in srgb, var(--primary) 20%, transparent);
		letter-spacing: 2px;
		font-variant-numeric: tabular-nums;
	}

	/* ── Chevrons ────────────────────────────────────────────────── */
	.manifesto__chevrons {
		position: absolute;
		display: flex;
		gap: 6px;
		z-index: calc(var(--z-content) + 2);
	}

	.manifesto__chevrons--right { right: 60px; top: 110px; flex-direction: row; }
	.manifesto__chevrons--down { left: 80px; top: 60px; flex-direction: column; }

	.manifesto__chevron {
		width: 12px;
		height: 12px;
		border-right: 2px solid var(--primary);
		border-bottom: 2px solid var(--primary);
		opacity: var(--opacity-subtle);
	}

	.manifesto__chevrons--right .manifesto__chevron { transform: rotate(-45deg); }
	.manifesto__chevrons--down .manifesto__chevron { transform: rotate(45deg); }

	/* ── Platform Badges ─────────────────────────────────────────── */
	.manifesto__badge {
		position: absolute;
		font-family: var(--font-mono);
		font-size: 8px;
		letter-spacing: 2px;
		color: color-mix(in srgb, var(--primary) 20%, transparent);
		border: 1px solid color-mix(in srgb, var(--primary) 10%, transparent);
		border-radius: var(--radius-sm);
		padding: 3px 8px;
		text-transform: uppercase;
		z-index: calc(var(--z-content) + 2);
	}

	.manifesto__badge--platform { right: 50px; bottom: 60px; }
	.manifesto__badge--direction { left: 50px; top: 55px; }

	/* ── Responsive ──────────────────────────────────────────────── */
	@media (max-width: 640px) {
		.manifesto__arrival { left: 12px; bottom: 50px; }
		.manifesto__arrival .manifesto__arr-time { font-size: 14px; }
	}

	@media (max-width: 768px) {
		.manifesto__chevrons { opacity: var(--opacity-faint); }
		.manifesto__badge { font-size: 6px; padding: 2px 6px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.manifesto__arrival,
		.manifesto__chevrons,
		.manifesto__badge {
			opacity: 1;
			transform: none;
		}
	}
</style>
