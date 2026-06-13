<script lang="ts">
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	let { languages, stop, label }: { languages: readonly string[]; stop: string; label: string } = $props();
</script>

<div class="group h-full" use:cursorGlow>
	<Card class="h-full p-3" data-testid="about-languages">
		<div class="relative flex h-full flex-col">
			<StopLabel {stop} {label} />

			<div class="mt-3 flex flex-1 flex-col justify-center gap-2">
				{#each languages as language, i}
					<div class="language-row">
						<span class="signal-dot" aria-hidden="true"></span>
						<span>{language}</span>
						<span class="route-line" aria-hidden="true"></span>
						<span class="text-[var(--muted-foreground)]">{String(i + 1).padStart(2, '0')}</span>
					</div>
				{/each}
			</div>
		</div>
	</Card>
</div>

<style>
	.language-row {
		display: grid;
		grid-template-columns: auto auto minmax(1.5rem, 1fr) auto;
		align-items: center;
		gap: 0.6rem;
		border: 1px solid var(--border);
		padding: 0.45rem 0.55rem;
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--secondary-foreground);
		background: color-mix(in srgb, var(--card) 88%, var(--primary) 12%);
	}

	.signal-dot {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 999px;
		background: var(--primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent);
	}

	.route-line {
		height: 1px;
		background: linear-gradient(90deg, var(--primary), transparent);
	}
</style>
