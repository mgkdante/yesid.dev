<script lang="ts">
	import { getLocale } from '#lib/utils/locale-context.ts';

	const lead = { en: 'Data from', fr: 'Données de', es: 'Datos de' }[getLocale()];
</script>

<p class="transit-source" data-testid="transit-source-note">
	{lead}
	<a href="https://transit.yesid.dev/" target="_blank" rel="noopener noreferrer">transit.yesid.dev<span aria-hidden="true">↗</span></a>
</p>

<style>
	.transit-source {
		margin-top: 0.5rem;
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--muted-foreground);
	}
	.transit-source a {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.transit-source a:hover { color: var(--accent-text); }
	.transit-source a:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
</style>
