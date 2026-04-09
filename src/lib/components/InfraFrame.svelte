<!--
  InfraFrame — terminal/metro chrome wrapper for infrastructure content.
  Title bar with LED + label, hazard stripe accent, status footer.
  OS-agnostic: no macOS traffic lights.
  Wraps any slotted content (diagram, builder, etc).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		tag = 'LIVE',
		title = 'infrastructure-diagram',
		status = '',
		footer = [] as { label: string; value: string }[],
		station = '',
		children,
	}: {
		tag?: string;
		title?: string;
		status?: string;
		footer?: { label: string; value: string }[];
		station?: string;
		children: Snippet;
	} = $props();
</script>

<div class="infra-frame" data-testid="infra-frame">
	<!-- Corner tick marks -->
	<span class="frame-tick frame-tick-tl" aria-hidden="true"></span>
	<span class="frame-tick frame-tick-tr" aria-hidden="true"></span>
	<span class="frame-tick frame-tick-bl" aria-hidden="true"></span>
	<span class="frame-tick frame-tick-br" aria-hidden="true"></span>

	<!-- Title bar -->
	<div class="frame-bar">
		<span class="frame-tag">
			<span class="frame-led" aria-hidden="true"></span>
			{tag}
		</span>
		<span class="frame-title">{title}</span>
		{#if status}
			<span class="frame-status">
				<span class="frame-led-ok" aria-hidden="true"></span>
				{status}
			</span>
		{/if}
	</div>

	<!-- Hazard stripe -->
	<div class="frame-stripe" aria-hidden="true"></div>

	<!-- Content -->
	<div class="frame-body">
		{@render children()}
	</div>

	<!-- Footer -->
	{#if footer.length > 0 || station}
		<div class="frame-footer">
			{#if footer.length > 0}
				<div class="frame-metrics">
					{#each footer as metric}
						<span class="frame-metric">
							{metric.label}: <span class="frame-metric-val">{metric.value}</span>
						</span>
					{/each}
				</div>
			{/if}
			{#if station}
				<span class="frame-station">{station}</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.infra-frame {
		position: relative;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--bg-surface);
		transition: border-color 0.3s ease, box-shadow 0.3s ease;
	}

	.infra-frame:hover {
		border-color: rgba(224, 120, 0, 0.25);
		box-shadow: 0 0 24px rgba(224, 120, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	/* Corner tick marks — infrastructure blueprint feel */
	.frame-tick {
		position: absolute;
		width: 12px;
		height: 12px;
		z-index: 2;
		pointer-events: none;
	}

	.frame-tick::before,
	.frame-tick::after {
		content: '';
		position: absolute;
		background: var(--brand-primary);
		opacity: 0.4;
	}

	.frame-tick::before { /* horizontal arm */ }
	.frame-tick::after { /* vertical arm */ }

	.frame-tick-tl { top: -1px; left: -1px; }
	.frame-tick-tl::before { top: 0; left: 0; width: 12px; height: 1px; }
	.frame-tick-tl::after { top: 0; left: 0; width: 1px; height: 12px; }

	.frame-tick-tr { top: -1px; right: -1px; }
	.frame-tick-tr::before { top: 0; right: 0; width: 12px; height: 1px; }
	.frame-tick-tr::after { top: 0; right: 0; width: 1px; height: 12px; }

	.frame-tick-bl { bottom: -1px; left: -1px; }
	.frame-tick-bl::before { bottom: 0; left: 0; width: 12px; height: 1px; }
	.frame-tick-bl::after { bottom: 0; left: 0; width: 1px; height: 12px; }

	.frame-tick-br { bottom: -1px; right: -1px; }
	.frame-tick-br::before { bottom: 0; right: 0; width: 12px; height: 1px; }
	.frame-tick-br::after { bottom: 0; right: 0; width: 1px; height: 12px; }

	/* --- Title bar --- */

	.frame-bar {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 16px;
		background: #1a1a1a;
		border-bottom: 1px solid var(--border);
	}

	.frame-tag {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--brand-primary);
		font-weight: 600;
	}

	.frame-led {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--brand-primary);
		box-shadow: 0 0 6px rgba(224, 120, 0, 0.6);
		animation: frame-led-pulse 2s ease-in-out infinite;
	}

	@keyframes frame-led-pulse {
		0%, 100% { opacity: 1; box-shadow: 0 0 4px rgba(224, 120, 0, 0.5); }
		50% { opacity: 0.7; box-shadow: 0 0 10px rgba(224, 120, 0, 0.8); }
	}

	.frame-title {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
	}

	.frame-status {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
	}

	.frame-led-ok {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #28c840;
		box-shadow: 0 0 4px rgba(40, 200, 64, 0.5);
	}

	/* --- Hazard stripe --- */

	.frame-stripe {
		height: 3px;
		background: repeating-linear-gradient(
			-45deg,
			#FFB627 0px, #FFB627 8px,
			transparent 8px, transparent 16px
		);
	}

	/* --- Body --- */

	.frame-body {
		position: relative;
		background: var(--bg-primary);
	}

	/* Subtle grid overlay — infrastructure blueprint feel */
	.frame-body::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(224, 120, 0, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(224, 120, 0, 0.03) 1px, transparent 1px);
		background-size: 40px 40px;
		pointer-events: none;
		z-index: 0;
	}

	.frame-body > :global(*) {
		position: relative;
		z-index: 1;
	}

	/* --- Footer --- */

	.frame-footer {
		display: flex;
		align-items: center;
		padding: 8px 16px;
		border-top: 1px solid var(--border);
		background: #1a1a1a;
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
		letter-spacing: 1px;
		text-transform: uppercase;
		gap: 2rem;
	}

	.frame-metrics {
		display: flex;
		gap: 2rem;
	}

	.frame-metric-val {
		color: var(--brand-accent);
		font-weight: 600;
	}

	.frame-station {
		margin-left: auto;
	}

	/* --- Responsive --- */

	@media (max-width: 767px) {
		.frame-bar {
			padding: 6px 12px;
			gap: 8px;
		}

		.frame-footer {
			flex-wrap: wrap;
			gap: 0.75rem;
			padding: 6px 12px;
		}

		.frame-metrics {
			gap: 1rem;
		}

		.frame-station {
			margin-left: 0;
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.frame-led {
			animation: none;
		}
	}
</style>
