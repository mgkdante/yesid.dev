<script lang="ts">
	import type { AboutTestimonial } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	const locale = getLocale();

	let { testimonials, stop, label }: { testimonials: readonly AboutTestimonial[]; stop: string; label: string } = $props();

	const active = $derived(testimonials[0]);
	const quote = $derived(active ? resolveLocale(active.quote, locale) : '');
	const author = $derived(locale === 'fr' && active?.role.fr ? active.role.fr : active?.author);
</script>

<div class="group h-full" use:cursorGlow>
	<Card class="h-full p-3" data-testid="about-testimonials" role="region" aria-label={label}>
		<div class="relative flex h-full flex-col">
			<StopLabel {stop} {label} />

			<div class="flex flex-1 flex-col justify-center">
				<div class="font-heading text-7xl leading-none text-[var(--primary)] select-none" aria-hidden="true">
					&ldquo;
				</div>

				<blockquote class="-mt-2 max-w-xl text-pretty text-xl leading-tight font-semibold text-[var(--foreground)] md:text-2xl">
					{quote}
				</blockquote>

				<div class="mt-5 flex items-center gap-3">
					<span class="h-px w-10 bg-[var(--primary)]" aria-hidden="true"></span>
					<span class="font-mono text-caption font-bold tracking-[0.12em] text-[var(--accent-text)]">
						{author}
					</span>
				</div>
			</div>
		</div>
	</Card>
</div>
