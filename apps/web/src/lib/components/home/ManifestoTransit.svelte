<script lang="ts">
	let {
		platformBadge, directionBadge,
	}: {
		platformBadge: string; directionBadge: string;
	} = $props();
</script>


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

<div data-testid="manifesto-platform-badge" class="manifesto__badge manifesto__badge--platform" aria-hidden="true">{platformBadge}</div>
<div data-testid="manifesto-direction-badge" class="manifesto__badge manifesto__badge--direction" aria-hidden="true">{directionBadge}</div>

<style>




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
		opacity: var(--opacity-dim);
	}

	.manifesto__chevrons--right .manifesto__chevron { transform: rotate(-45deg); }
	.manifesto__chevrons--down .manifesto__chevron { transform: rotate(45deg); }

	.manifesto__badge {
		position: absolute;
		font-family: var(--font-mono);
		font-size: 8px;
		letter-spacing: 2px;
		color: var(--accent-text);
		border: 1px solid color-mix(in srgb, var(--accent-text) 25%, transparent);
		border-radius: var(--radius-sm);
		padding: 3px 8px;
		text-transform: uppercase;
		z-index: calc(var(--z-content) + 2);
	}

	.manifesto__badge--platform { right: 50px; bottom: 60px; }
	.manifesto__badge--direction { left: 50px; top: 55px; }

	@media (--tablet-max) {
		.manifesto__chevrons { opacity: var(--opacity-faint); }
		.manifesto__badge { font-size: 6px; padding: 2px 6px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.manifesto__chevrons,
		.manifesto__badge {
			opacity: 1;
			transform: none;
		}
	}
</style>
