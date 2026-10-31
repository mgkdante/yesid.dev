<!--
  CTA — Terminal style.
  Fake terminal: $ yesid --contact with typed lines.
  Social links, send button.
  Stop label top-left.
-->
<script lang="ts">
	import type { AboutCta } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';

	const locale = getLocale();
	import { TerminalPanel, TerminalCursor } from '@yesid/ui/brand';
	import { siteLabels } from '#lib/content/index.ts';
	import { cursorGlow } from '@yesid/motion/actions';
	import StopLabel from '#lib/components/brand/StopLabel.svelte';
	import { Button } from '@yesid/ui/button';
	import { Card } from '@yesid/ui/card';

	let { cta, stop, label }: { cta: AboutCta; stop: string; label: string } = $props();

	const buttonLabel = $derived(resolveLocale(cta.buttonLabel, locale));
	const terminalTitle = $derived(resolveLocale(siteLabels.ui.terminalTitle, locale));
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="relative h-full p-3" data-testid="about-cta">
	<!-- Ambient glow -->
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.2] dark:opacity-[0.07]"
		style="background: radial-gradient(ellipse at 20% 50%, var(--glow), transparent 70%);"
		aria-hidden="true"
	></div>

	<div class="relative flex flex-col">
		<StopLabel {stop} {label} as="h2" />

		<!-- Terminal window -->
		<TerminalPanel title={terminalTitle} class="mt-3">
			<div class="break-words font-mono text-reading-code leading-[1.6] lg:text-reading-code-desktop">
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
		</TerminalPanel>

		<!-- Action row: the About view's one "talk to Yesid" conversion → yellow. -->
		<div class="mt-3 flex flex-wrap items-center gap-3">
			<Button variant="conversion" size="cta" href={cta.buttonHref} data-testid="about-cta-button">
				{buttonLabel}
			</Button>
		</div>
	</div>
</Card>
</div>
