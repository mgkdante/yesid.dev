<!--
  Prev/next service navigation for the bottom of /services/[id] detail pages.
  Shows directional links to adjacent services with arrows, labels, and titles.
  Omits either side when the current service is first or last.
-->
<script lang="ts">
	import type { Service } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { siteLabels } from '$lib/content';
	import { boop } from '@yesid/motion/actions';
	import { SectionLabel } from '@yesid/ui/brand';

	let {
		prev,
		next
	}: {
		prev?: Service;
		next?: Service;
	} = $props();

	// Resolve titles reactively so locale changes propagate without remounting
	let prevTitle = $derived(prev ? resolveLocale(prev.title, locale) : '');
	let nextTitle = $derived(next ? resolveLocale(next.title, locale) : '');
	let navAria = $derived(resolveLocale(siteLabels.servicesChrome.detail.serviceNavAria, locale));
	let prevLabel = $derived(resolveLocale(siteLabels.navChrome.directions.previous, locale));
	let nextLabel = $derived(resolveLocale(siteLabels.navChrome.directions.next, locale));
</script>

<nav class="service-nav" aria-label={navAria}>
	{#if prev}
		<a
			href={localizeHref(`/services/${prev.id}`, locale)}
			class="nav-link nav-link--prev tap-press"
			data-testid="service-nav-prev"
			use:boop={{ scale: 1.03, timing: 200 }}
		>
			<span class="nav-arrow">&larr;</span>
			<span class="nav-meta">
				<SectionLabel text={prevLabel} variant="section" />
				<span class="nav-title">{prevTitle}</span>
			</span>
		</a>
	{/if}

	{#if next}
		<a
			href={localizeHref(`/services/${next.id}`, locale)}
			class="nav-link nav-link--next tap-press"
			data-testid="service-nav-next"
			use:boop={{ scale: 1.03, timing: 200 }}
		>
			<span class="nav-meta">
				<SectionLabel text={nextLabel} variant="section" />
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
		border-top: 1px solid var(--card);
		padding: 2rem 1rem;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		transition: color var(--duration-normal);
	}

	/* Push the "next" link to the right when prev is absent */
	.nav-link--next {
		text-align: right;
		margin-left: auto;
	}

	.nav-arrow {
		font-size: 1.25rem;
		color: var(--muted-foreground);
		transition: color var(--duration-normal);
	}

	.nav-meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}


	.nav-title {
		font-weight: 600;
		color: var(--foreground);
		transition: color var(--duration-normal);
	}

	.nav-link:hover .nav-title {
		color: var(--primary);
	}

	.nav-link:hover .nav-arrow {
		color: var(--primary);
	}
</style>
