<!--
  Individual blog post card for the home page feed.
  Metro-styled with numbered badge, monospace date, and boop interaction.
-->
<script lang="ts">
	import { boop } from '$lib/motion/actions/boop.js';

	let {
		title,
		excerpt,
		date,
		url,
		external = false,
		index = 0
	}: {
		title: string;
		excerpt: string;
		date: string;
		url: string;
		external?: boolean;
		index?: number;
	} = $props();

	// Zero-padded station-style number
	let badge = $derived(String(index + 1).padStart(2, '0'));
</script>

<a
	href={url}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
	class="group block"
	data-testid="blog-card"
	use:boop={{ scale: 1.03, timing: 300 }}
>
	<article class="h-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 transition-colors group-hover:border-[#E07800]">
		<div class="flex items-start justify-between gap-3">
			<time class="shrink-0 font-mono text-xs text-[var(--text-muted)]">{date}</time>
			<span class="shrink-0 font-mono text-xs font-bold text-[#E07800]">{badge}</span>
		</div>
		<h3 class="mt-3 font-heading text-base font-semibold leading-snug text-[var(--text-primary)]">
			{title}
		</h3>
		<p class="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
			{excerpt}
		</p>
	</article>
</a>
