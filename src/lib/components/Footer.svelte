<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { siteMeta, menuItems } from '$lib/data';
	import { wordmarkHover } from '$lib/motion/actions';

	const year = new Date().getFullYear();

	const now = new Date();
	const systemDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

	const footerNavLinks = menuItems.map((item) => ({
		label: item.label.en,
		href: item.href
	}));

	const socialLinks = [
		siteMeta.links.github ? { label: 'GitHub', href: siteMeta.links.github } : null,
		siteMeta.links.linkedin ? { label: 'LinkedIn', href: siteMeta.links.linkedin } : null,
		siteMeta.links.upwork ? { label: 'Upwork', href: siteMeta.links.upwork } : null
	].filter((link): link is { label: string; href: string } => link !== null);

	let wordmarkEl: HTMLSpanElement;
	let dotEl: HTMLSpanElement;
	let wordmarkAction: ReturnType<typeof wordmarkHover> | undefined;

	onMount(() => {
		wordmarkAction = wordmarkHover(wordmarkEl, { dotEl });
	});

	onDestroy(() => {
		wordmarkAction?.destroy();
	});
</script>

<footer data-testid="footer" class="relative z-50 bg-[var(--bg-primary)]">
	<!-- Gradient separator -->
	<div class="footer-gradient-sep" aria-hidden="true"></div>

	<!-- Row 1: Main content -->
	<div class="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pb-5 pt-10 sm:flex-row sm:items-start sm:justify-between sm:px-10 sm:pt-12">
		<!-- Left: Wordmark -->
		<div class="flex flex-col items-center sm:items-start">
			<a
				href="/"
				data-testid="footer-wordmark"
				class="inline-flex items-baseline font-heading text-xl font-bold text-[var(--text-primary)]"
			>
				<span bind:this={wordmarkEl}>yesid</span><span
					bind:this={dotEl}
					class="text-brand-primary">.</span
				>
			</a>
			<span class="mt-1 font-mono text-xs text-[var(--text-muted)]">// digital infrastructure</span>
		</div>

		<!-- Center: Nav links -->
		<nav aria-label="Footer navigation" class="flex flex-wrap justify-center gap-x-6 gap-y-2">
			{#each footerNavLinks as link}
				<a
					href={link.href}
					class="text-small text-[var(--text-secondary)] transition-colors hover:text-brand-primary"
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<!-- Right: Social links -->
		<div class="flex items-center gap-4">
			{#each socialLinks as link}
				<a
					href={link.href}
					target="_blank"
					rel="noopener noreferrer"
					class="text-small text-[var(--text-secondary)] transition-colors hover:text-brand-primary"
					aria-label={link.label}
				>
					{link.label}
				</a>
			{/each}
		</div>
	</div>

	<!-- Row 2: Status bar -->
	<div class="footer-status-border mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-4 font-mono text-caption text-[var(--text-muted)] sm:flex-row sm:justify-between sm:px-10">
		<small>&copy; {year} yesid<span class="text-brand-primary">.</span></small>
		<address class="not-italic">Montreal, QC &middot; Remote</address>
		<span class="flex items-center gap-1.5">
			<span class="footer-status-dot" aria-hidden="true"></span>
			system online &mdash; {systemDate}
		</span>
	</div>

</footer>

<style>
	.footer-gradient-sep {
		height: 1px;
		background: linear-gradient(90deg, transparent, #E07800 20%, #E07800 80%, transparent);
		opacity: 0.15;
	}

	.footer-status-border {
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.footer-status-dot {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #E07800;
		box-shadow: 0 0 6px #E07800, 0 0 12px rgba(224, 120, 0, 0.3);
	}

</style>
