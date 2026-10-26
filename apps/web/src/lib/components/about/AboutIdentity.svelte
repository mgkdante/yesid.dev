<!--
  About page identity card: V1 Editorial Glow.
  Side-by-side: headshot with gradient ring + ambient glow, text right.
  Metro stop label top-left. Cursor-following glow.
  All text from data layer via props.
-->
<script lang="ts">
	import type { AboutIdentity } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';

	const locale = getLocale();
	import { cursorGlow } from '@yesid/motion/actions';
	import { StopLabel } from '#lib/components/brand/index.ts';
	import { Card } from '#lib/components/ui/card/index.ts';
	import { variantImage } from '#lib/utils/variant-image.ts';

	let { identity, stop, label }: { identity: AboutIdentity; stop: string; label: string } = $props();

	const name = $derived(resolveLocale(identity.name, locale));
	const title = $derived(resolveLocale(identity.title, locale));
	const valueProp = $derived(resolveLocale(identity.valueProp, locale));
	const headshotMedia = $derived(variantImage(identity.headshot));
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="relative h-full p-3" data-testid="about-identity">
	<!-- Ambient glow behind headshot -->
	<div
		class="pointer-events-none absolute -top-10 -left-10 h-44 w-44 opacity-[0.28] dark:opacity-[0.12]"
		style="background: radial-gradient(circle, var(--glow) 0%, transparent 70%);"
		aria-hidden="true"
	></div>

	<div class="relative flex flex-col">
		<!-- Stop label. Every OTHER bento card renders its stop label as the
		     card's <h2>; this one stays a plain <div> so the page's first heading
		     is the <h1> below it and the outline reads h1 → h2…, never h2 → h1. -->
		<StopLabel {stop} {label} />

		<div
			class="pr-1"
			data-testid="about-identity-scroll"
		>
		<div class="flex flex-col items-center justify-center gap-4 md:flex-row md:items-center md:gap-5">
			<!-- Headshot with gradient ring -->
			<div class="relative shrink-0">
				<div
					class="size-20 overflow-hidden rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-0.5 md:size-24"
					data-testid="about-headshot-frame"
				>
					<div class="h-full w-full overflow-hidden rounded-full">
						<img
							src={headshotMedia.src}
							srcset={headshotMedia.srcset}
							sizes="(min-width: 768px) 96px, 80px"
							width={headshotMedia.width}
							height={headshotMedia.height}
							alt={name}
							class="block h-full w-full scale-[1.08] rounded-full object-cover object-[50%_42%]"
							style="width: 100%; height: 100%; aspect-ratio: 1 / 1; object-fit: cover; object-position: 50% 42%; scale: 1.08;"
							data-testid="about-headshot"
						/>
					</div>
				</div>
			</div>

			<!-- Text block -->
			<div class="text-center md:pt-1 md:text-left">
				<!-- The identity title IS /about's single <h1> (WCAG 1.3.1): the page
				     had no heading element at all, and this is the one existing text
				     node that reads as the page title. Element only — the classes,
				     copy and computed styles are unchanged (Tailwind preflight zeroes
				     the h1 margin and inherits its weight, and .label-station owns the
				     size), so nothing moves. -->
				<h1 class="label-station text-caption">
					{title}
				</h1>
				<!-- Gradient separator -->
				<div class="mx-auto mt-4 h-px w-10 md:mx-0" style="background: linear-gradient(90deg, var(--primary), transparent);"></div>
				<p class="mt-4 max-w-md text-body leading-relaxed text-[var(--secondary-foreground)]">
					{valueProp}
				</p>
			</div>
		</div>
		</div>
	</div>
</Card>
</div>
