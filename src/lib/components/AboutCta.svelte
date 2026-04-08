<!--
  CTA — Terminal style.
  Fake terminal: $ yesid --contact with typed lines.
  Social links, send button, availability tag.
  Stop label top-left.
-->
<script lang="ts">
	import type { AboutCta } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';

	let { cta, stop = '09', label = 'NEXT' }: { cta: AboutCta; stop?: string; label?: string } = $props();

	const buttonLabel = $derived(resolveLocale(cta.buttonLabel, 'en'));
	const availability = $derived(resolveLocale(cta.availability, 'en'));
</script>

<div
	class="group bento-card relative overflow-hidden rounded-lg border border-[var(--brand-primary)]/20 bg-[var(--bg-surface)] p-3"
	data-testid="about-cta"
	use:reveal
	use:cursorGlow
>
	<!-- Cursor glow -->
	<div class="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		style="background: radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(224,120,0,0.08), transparent 60%);"
	></div>

	<!-- Ambient glow -->
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.07]"
		style="background: radial-gradient(ellipse at 20% 50%, var(--brand-primary), transparent 70%);"
		aria-hidden="true"
	></div>

	<div class="relative flex h-full flex-col">
		<div class="stop-label">STOP {stop} — {label}</div>

		<!-- Terminal window -->
		<div class="mt-3 flex-1 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg-primary)]">
			<!-- Terminal title bar -->
			<div class="border-b border-[var(--border)] px-3 py-1.5">
				<span class="font-mono text-[10px] text-[var(--text-secondary)]">terminal</span>
			</div>

			<!-- Terminal body -->
			<div class="terminal-scroll overflow-y-auto p-3 font-mono text-sm leading-relaxed" style="max-height: 120px;">
				<!-- Command -->
				<div class="text-[var(--text-secondary)]">
					<span class="text-[var(--text-primary)]">~</span> {cta.command}
				</div>

				<!-- Output lines -->
				{#each cta.lines as line}
					<div class="{line.color === 'orange'
						? 'text-[var(--brand-primary)]'
						: line.color === 'accent'
							? 'text-[var(--brand-accent)]'
							: 'text-[var(--text-secondary)]'}">
						{line.text}
					</div>
				{/each}

				<!-- Blinking cursor -->
				<div class="mt-1 flex items-center gap-1">
					<span class="text-[var(--text-secondary)]">~</span>
					<span class="inline-block h-4 w-[7px] animate-pulse bg-[var(--brand-primary)]"></span>
				</div>
			</div>
		</div>

		<!-- Action row: button + availability -->
		<div class="mt-3 flex flex-wrap items-center gap-3">
			<a
				href={cta.buttonHref}
				class="inline-block rounded-md bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--brand-primary)]/20 transition-all duration-200 hover:bg-[var(--brand-primary-hover)] hover:shadow-[var(--brand-primary)]/40 hover:-translate-y-0.5"
			>
				{buttonLabel}
			</a>
			<span class="font-mono text-[10px] tracking-[1px] text-[var(--brand-accent)]">
				{availability}
			</span>
		</div>
	</div>
</div>

<style>
	/* Terminal-themed scrollbar */
	.terminal-scroll {
		scrollbar-width: thin;
		scrollbar-color: rgba(224, 120, 0, 0.3) transparent;
	}
	.terminal-scroll::-webkit-scrollbar {
		width: 6px;
	}
	.terminal-scroll::-webkit-scrollbar-track {
		background: transparent;
	}
	.terminal-scroll::-webkit-scrollbar-thumb {
		background: rgba(224, 120, 0, 0.3);
		border-radius: 3px;
	}
	.terminal-scroll::-webkit-scrollbar-thumb:hover {
		background: rgba(224, 120, 0, 0.5);
	}
</style>
