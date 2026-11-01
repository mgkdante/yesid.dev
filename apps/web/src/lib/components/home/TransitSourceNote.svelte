<script lang="ts">
	import { getLocale } from '#lib/utils/locale-context.ts';

	const copy = {
		en: { source: 'Data from Transit, a product by yesid.dev.', link: 'See here' },
		fr: { source: 'Données de Transit, un produit de yesid.dev.', link: 'Voir ici' },
		es: { source: 'Datos de Transit, un producto de yesid.dev.', link: 'Ver aquí' },
	}[getLocale()];
</script>

<p class="transit-source" data-testid="transit-source-note">
	{copy.source}
	<a href="https://transit.yesid.dev/" target="_blank" rel="noopener noreferrer">{copy.link}<span aria-hidden="true">&nbsp;↗</span></a>
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
