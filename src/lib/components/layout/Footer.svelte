<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { siteMeta, menuItems } from '$lib/data';
	import { wordmarkHover } from '$lib/motion/actions';
	import { StatusDot } from '$lib/components/brand';

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

<footer data-testid="footer" class="relative z-50 bg-[var(--background)]">
	<!-- Gradient separator -->
	<div class="footer-gradient-sep" aria-hidden="true"></div>

	<!-- Row 1: Main content -->
	<div class="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pb-5 pt-10 sm:flex-row sm:items-start sm:justify-between sm:px-10 sm:pt-12">
		<!-- Left: Wordmark -->
		<div class="flex flex-col items-center sm:items-start">
			<a
				href="/"
				data-testid="footer-wordmark"
				class="inline-flex items-baseline font-heading text-xl font-bold text-[var(--foreground)]"
			>
				<span bind:this={wordmarkEl}>yesid</span><span
					bind:this={dotEl}
					class="text-primary">.</span
				>
			</a>
			<span class="mt-1 font-mono text-xs text-[var(--muted-foreground)]">// digital infrastructure</span>
		</div>

		<!-- Center: Nav links -->
		<nav aria-label="Footer navigation" class="flex flex-wrap justify-center gap-x-6 gap-y-2">
			{#each footerNavLinks as link}
				<a
					href={link.href}
					class="text-small text-[var(--secondary-foreground)] transition-colors hover:text-primary"
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
					class="text-small text-[var(--secondary-foreground)] transition-colors hover:text-primary"
					aria-label={link.label}
				>
					{link.label}
				</a>
			{/each}
		</div>
	</div>

	<!-- Row 2: Status bar -->
	<div class="footer-status-border mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-4 font-mono text-caption text-[var(--muted-foreground)] sm:flex-row sm:justify-between sm:px-10">
		<small>&copy; {year} yesid<span class="text-primary">.</span></small>
		<address class="not-italic">Montreal, QC &middot; Remote</address>
		<span class="flex items-center gap-1.5">
			<StatusDot color="orange" pulse />
			system online &mdash; {systemDate}
		</span>
	</div>

</footer>

<style>
	.footer-gradient-sep {
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--primary) 20%, var(--primary) 80%, transparent);
		opacity: var(--opacity-subtle);
	}

	.footer-status-border {
		border-top: 1px solid color-mix(in srgb, var(--foreground) 6%, transparent);
	}

	footer {
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}
</style>
