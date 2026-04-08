<!--
  Client trust strip — Style B: Counter + Logo Row.
  Big counter left ("10+"), gradient divider, logos right.
  Grayscale → color on hover. Stop label top-left.
-->
<script lang="ts">
	import type { AboutClientLogo } from '$lib/data/types.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';

	let {
		logos,
		count = 10,
		stop = '05',
		label = 'CLIENTS',
	}: {
		logos: readonly AboutClientLogo[];
		count?: number;
		stop?: string;
		label?: string;
	} = $props();
</script>

<div
	class="group bento-card relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3"
	data-testid="about-logos"
	use:reveal
	use:cursorGlow
>
	<!-- Cursor glow -->
	<div class="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		style="background: radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(224,120,0,0.06), transparent 60%);"
	></div>

	<div class="relative flex h-full flex-col">
		<div class="stop-label">STOP {stop} — {label}</div>

		<div class="flex flex-1 flex-col items-center justify-center gap-2">
			<!-- Counter -->
			<div class="text-center">
				<div class="font-mono text-3xl font-bold text-[var(--brand-accent)]">{count}+</div>
				<div class="font-mono text-[11px] uppercase tracking-[1px] text-[var(--text-secondary)]">clients served</div>
			</div>

			<!-- Logo grid -->
			<div class="mt-1 grid grid-cols-2 gap-2">
				{#each logos as logo}
					{@const Wrapper = logo.url ? 'a' : 'div'}
					<svelte:element
						this={Wrapper}
						href={logo.url ?? undefined}
						target={logo.url ? '_blank' : undefined}
						rel={logo.url ? 'noopener noreferrer' : undefined}
						class="flex items-center justify-center grayscale opacity-50 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
						title={logo.name}
					>
						<img
							src={logo.src}
							alt={logo.name}
							class="h-6 w-auto object-contain"
							loading="lazy"
						/>
					</svelte:element>
				{/each}
			</div>
		</div>
	</div>
</div>
