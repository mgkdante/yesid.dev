<!--
  LANGUAGES stop (repurposed from the former client-logos stop).
  Spoken languages as a centered vertical list of chips. Locale-invariant
  data (the names display in their own language: Français / English / Español).
-->
<script lang="ts">
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	let {
		languages,
		stop,
		label,
	}: {
		languages: readonly string[];
		stop: string;
		label: string;
	} = $props();
</script>

<div class="group h-full" use:cursorGlow>
	<Card class="h-full p-3" data-testid="about-languages">
		<div class="relative flex h-full flex-col">
			<StopLabel {stop} {label} />
			<ul class="flex flex-1 flex-col items-center justify-center gap-2">
				{#each languages as lang}
					<li
						class="w-full rounded border border-[var(--border)] px-3 py-1.5 text-center text-small text-[var(--secondary-foreground)] transition-colors duration-200 hover:border-[var(--primary)] hover:text-[var(--primary)]"
					>
						{lang}
					</li>
				{/each}
			</ul>
		</div>
	</Card>
</div>
