<!--
  InfraFrame — terminal/metro chrome wrapper for infrastructure content.
  Title bar with LED + label, hazard stripe accent, status footer.
  OS-agnostic: no macOS traffic lights.
  Wraps any slotted content (diagram, builder, etc).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { StatusDot, HazardStripe, CornerMarks } from '$lib/components/brand';

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
	<CornerMarks size="sm" opacity={0.4} />

	<!-- Title bar -->
	<div class="frame-bar">
		<span class="frame-tag">
			<StatusDot color="orange" pulse />
			{tag}
		</span>
		<span class="frame-title">{title}</span>
		{#if status}
			<span class="frame-status">
				<StatusDot color="green" />
				{status}
			</span>
		{/if}
	</div>

	<!-- Hazard stripe -->
	<HazardStripe size="sm" />

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
		transition: border-color var(--duration-slow) var(--ease-default), box-shadow var(--duration-slow) var(--ease-default);
	}

	.infra-frame:hover {
		border-color: color-mix(in srgb, var(--brand-primary) 25%, transparent);
		box-shadow: 0 0 24px color-mix(in srgb, var(--brand-primary) 6%, transparent), 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	/* --- Title bar --- */

	.frame-bar {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 16px;
		background: var(--bg-card);
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

	/* --- Hazard stripe --- */

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
			linear-gradient(color-mix(in srgb, var(--brand-primary) 3%, transparent) 1px, transparent 1px),
			linear-gradient(90deg, color-mix(in srgb, var(--brand-primary) 3%, transparent) 1px, transparent 1px);
		background-size: 40px 40px;
		pointer-events: none;
		z-index: var(--z-base);
	}

	.frame-body > :global(*) {
		position: relative;
		z-index: var(--z-content);
	}

	/* --- Footer --- */

	.frame-footer {
		display: flex;
		align-items: center;
		padding: 8px 16px;
		border-top: 1px solid var(--border);
		background: var(--bg-card);
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

</style>
