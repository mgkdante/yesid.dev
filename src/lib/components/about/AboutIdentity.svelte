<!--
  About page identity card — V1 Editorial Glow.
  Side-by-side: headshot with gradient ring + ambient glow, text right.
  Metro stop label top-left. Cursor-following glow.
  All text from data layer via props.
-->
<script lang="ts">
	import type { AboutIdentity } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	let { identity, stop = '00', label = 'IDENTITY' }: { identity: AboutIdentity; stop?: string; label?: string } = $props();

	const name = $derived(resolveLocale(identity.name, 'en'));
	const title = $derived(resolveLocale(identity.title, 'en'));
	const valueProp = $derived(resolveLocale(identity.valueProp, 'en'));
</script>

<div
	class="group h-full"
	use:reveal
	use:cursorGlow
>
<Card class="relative h-full p-3" data-testid="about-identity">
	<!-- Ambient glow behind headshot -->
	<div
		class="pointer-events-none absolute -top-10 -left-10 h-44 w-44"
		style="background: radial-gradient(circle, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 70%);"
		aria-hidden="true"
	></div>

	<div class="relative flex h-full flex-col">
		<!-- Stop label -->
		<StopLabel {stop} {label} />

		<div class="flex flex-1 flex-col items-center justify-center gap-4 md:flex-row md:items-center md:gap-5">
			<!-- Headshot with gradient ring + availability dot -->
			<div class="relative shrink-0">
				<div class="rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-0.5">
					<img
						src={identity.headshot}
						alt={name}
						class="h-20 w-20 rounded-full object-cover md:h-24 md:w-24"
						data-testid="about-headshot"
					/>
				</div>
				<!-- Green availability dot -->
				<div class="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-[3px] border-[var(--muted)] bg-emerald-500"></div>
			</div>

			<!-- Text block -->
			<div class="text-center md:pt-1 md:text-left">
				<h1 class="font-heading text-title font-bold leading-tight tracking-tight text-[var(--foreground)]">
					{name}
				</h1>
				<div class="mt-1.5 label-station text-caption">
					{title}
				</div>
				<!-- Gradient separator -->
				<div class="mx-auto mt-4 h-px w-10 md:mx-0" style="background: linear-gradient(90deg, var(--primary), transparent);"></div>
				<p class="mt-4 max-w-md text-small leading-relaxed text-[var(--secondary-foreground)]">
					{valueProp}
				</p>
			</div>
		</div>
	</div>
</Card>
</div>
