<script lang="ts">
	import type { AboutEducationItem } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	const locale = getLocale();

	let {
		education,
		stop,
		label,
	}: { education: readonly AboutEducationItem[]; stop: string; label: string } = $props();
</script>

<div class="group h-full" use:cursorGlow>
	<Card class="h-full p-3" data-testid="about-education">
		<div class="relative flex h-full flex-col">
			<StopLabel {stop} {label} />

			<div class="mt-3 flex flex-1 flex-col justify-center gap-3">
				{#each education as item}
					{@const school = resolveLocale(item.school, locale)}
					{@const program = resolveLocale(item.program, locale)}
					<div class="education-row">
						<div class="icon-shell">
							<!-- Real school marks, pixel-traced to vector (Champlain
							     Cougars navy paw / Bishop's purple BU monogram). Brand
							     colours are baked into the artwork; the white outline
							     keeps each mark legible in both themes. -->
							<img
								src={item.icon === 'champlain'
									? '/images/about/edu-champlain.svg'
									: '/images/about/edu-bishops.svg'}
								alt=""
								width="32"
								height="32"
								loading="lazy"
							/>
						</div>
						<div class="min-w-0">
							<div class="school">{school}</div>
							<div class="program">{program}</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</Card>
</div>

<style>
	.education-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 0.75rem;
		border-left: 2px solid color-mix(in srgb, var(--primary) 65%, transparent);
		padding: 0.55rem 0.5rem 0.55rem 0.7rem;
		background: color-mix(in srgb, var(--card) 86%, var(--accent) 14%);
	}

	.icon-shell {
		display: grid;
		width: 2.25rem;
		height: 2.25rem;
		place-items: center;
	}

	.icon-shell img {
		width: 2rem;
		height: 2rem;
		object-fit: contain;
	}

	.school {
		overflow-wrap: anywhere;
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--foreground);
	}

	.program {
		margin-top: 0.15rem;
		font-size: var(--text-caption);
		line-height: 1.35;
		color: var(--secondary-foreground);
	}
</style>
