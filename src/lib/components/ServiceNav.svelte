<!--
  Prev/next service navigation for the bottom of /services/[id] detail pages.
  Shows directional links to adjacent services with arrows, labels, and titles.
  Omits either side when the current service is first or last.
-->
<script lang="ts">
	import type { Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { boop } from '$lib/motion/actions/boop.js';

	let {
		prev,
		next
	}: {
		prev?: Service;
		next?: Service;
	} = $props();

	// Resolve titles reactively so locale changes propagate without remounting
	let prevTitle = $derived(prev ? resolveLocale(prev.title, 'en') : '');
	let nextTitle = $derived(next ? resolveLocale(next.title, 'en') : '');
</script>

<nav class="service-nav" aria-label="Service navigation">
	{#if prev}
		<a
			href="/services/{prev.id}"
			class="nav-link nav-link--prev"
			data-testid="service-nav-prev"
			use:boop={{ scale: 1.03, timing: 200 }}
		>
			<span class="nav-arrow">&larr;</span>
			<span class="nav-meta">
				<span class="nav-label">Previous</span>
				<span class="nav-title">{prevTitle}</span>
			</span>
		</a>
	{/if}

	{#if next}
		<a
			href="/services/{next.id}"
			class="nav-link nav-link--next"
			data-testid="service-nav-next"
			use:boop={{ scale: 1.03, timing: 200 }}
		>
			<span class="nav-meta">
				<span class="nav-label">Next</span>
				<span class="nav-title">{nextTitle}</span>
			</span>
			<span class="nav-arrow">&rarr;</span>
		</a>
	{/if}
</nav>

<style>
	.service-nav {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		width: 100%;
		border-top: 1px solid var(--bg-card);
		padding: 2rem 1rem;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		transition: color 0.2s;
	}

	/* Push the "next" link to the right when prev is absent */
	.nav-link--next {
		text-align: right;
		margin-left: auto;
	}

	.nav-arrow {
		font-size: 1.25rem;
		color: var(--text-muted);
		transition: color 0.2s;
	}

	.nav-meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.nav-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.nav-title {
		font-weight: 600;
		color: var(--text-primary);
		transition: color 0.2s;
	}

	.nav-link:hover .nav-title {
		color: var(--brand-primary);
	}

	.nav-link:hover .nav-arrow {
		color: var(--brand-primary);
	}
</style>
