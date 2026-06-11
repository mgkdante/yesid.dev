<!--
  CTA — Terminal style.
  Fake terminal: $ yesid --contact with typed lines.
  Social links, send button, availability tag.
  Stop label top-left.
-->
<script lang="ts">
	import type { AboutCta } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel, TerminalChrome } from '$lib/components/brand';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';

	let { cta, stop, label }: { cta: AboutCta; stop: string; label: string } = $props();

	const buttonLabel = $derived(resolveLocale(cta.buttonLabel, 'en'));
	const availability = $derived(resolveLocale(cta.availability, 'en'));
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="relative h-full p-3" data-testid="about-cta">
	<!-- Ambient glow -->
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.07]"
		style="background: radial-gradient(ellipse at 20% 50%, var(--primary), transparent 70%);"
		aria-hidden="true"
	></div>

	<div class="relative flex h-full flex-col">
		<StopLabel {stop} {label} />

		<!-- Terminal window -->
		<TerminalChrome title="terminal" class="mt-3 flex-1 min-h-0">
			<div class="font-mono text-sm leading-relaxed">
				<!-- Command -->
				<div class="text-[var(--secondary-foreground)]">
					<span class="text-[var(--foreground)]">~</span> {cta.command}
				</div>

				<!-- Output lines -->
				{#each cta.lines as line}
					<div class="{line.color === 'orange'
						? 'text-[var(--primary)]'
						: line.color === 'accent'
							? 'text-[var(--accent-text)]'
							: 'text-[var(--secondary-foreground)]'}">
						{line.text}
					</div>
				{/each}

				<!-- Blinking cursor -->
				<div class="mt-1 flex items-center gap-1">
					<span class="text-[var(--secondary-foreground)]">~</span>
					<TerminalCursor />
				</div>
			</div>
		</TerminalChrome>

		<!-- Action row: button + availability -->
		<div class="mt-3 flex flex-wrap items-center gap-3">
			<Button variant="default" size="cta" href={cta.buttonHref}>
				{buttonLabel}
			</Button>
			<span class="font-mono text-caption tracking-[1px] text-[var(--accent-text)]">
				{availability}
			</span>
		</div>
	</div>
</Card>
</div>

