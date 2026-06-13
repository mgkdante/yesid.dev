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

			<div class="lang-line mt-4 flex flex-1 flex-col justify-center">
				{#each languages as language}
					<div class="lang-stop">
						<span class="lang-node" aria-hidden="true"></span>
						<span class="lang-name">{language}</span>
					</div>
				{/each}
			</div>
		</div>
	</Card>
</div>

<style>
	/* No filled rows (operator). The three languages are STATIONS on one
	   orange transit line — the brand motif carried over from Education. The
	   vertical line threads the nodes; names are big and legible. */
	.lang-line {
		position: relative;
		gap: 1.4rem;
		padding-left: 0.35rem;
	}

	/* The line itself — runs through the node centres (node is 0.85rem wide,
	   so its centre sits at padding-left + 0.425rem). */
	.lang-line::before {
		content: '';
		position: absolute;
		left: calc(0.35rem + 0.42rem);
		top: 0.6rem;
		bottom: 0.6rem;
		width: 2px;
		transform: translateX(-50%);
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--primary) 70%, transparent),
			color-mix(in srgb, var(--primary) 35%, transparent)
		);
	}

	.lang-stop {
		position: relative;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 0.85rem;
	}

	/* Station node — orange dot with a soft halo, sitting on the line. */
	.lang-node {
		width: 0.85rem;
		height: 0.85rem;
		border-radius: 999px;
		background: var(--primary);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 14%, transparent);
		transition: box-shadow var(--duration-normal) var(--ease-default);
	}

	.group:hover .lang-node {
		box-shadow: 0 0 0 5px color-mix(in srgb, var(--primary) 22%, transparent);
	}

	/* Legible native names — bigger heading type, foreground ink. */
	.lang-name {
		font-family: var(--font-heading);
		font-size: var(--text-body);
		font-weight: 700;
		letter-spacing: -0.005em;
		color: var(--foreground);
	}
</style>
